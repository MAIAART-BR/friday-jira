// Leitura de um quadro do Jira Software, para os números baterem com o que o cliente vê no quadro.
// Recebe `request(path, init)` para poder ser testada sem o Forge.
//
// Do quadro vêm: o filtro (que tickets entram), as colunas (que estados ficam em cada uma) e o sub-filtro
// dos quadros Kanban. As subtarefas contam se o filtro do quadro as incluir, tal como no quadro.
import { normalizeIssue } from './core/metrics.js';
import { FIELDS, searchAll, countIssues, findFlaggedFieldId, findIssueTypes, checkProjectKey } from './jira.js';

const DAY_MS = 86400000;

/** Quadros do projeto. */
export async function listBoards(request, projectKey) {
  const boards = [];
  let startAt = 0;
  for (;;) {
    const res = await request(`/rest/agile/1.0/board?projectKeyOrId=${checkProjectKey(projectKey)}&startAt=${startAt}&maxResults=50`);
    if (!res.ok) throw new Error(`Jira respondeu ${res.status} ao listar os quadros`);
    const body = await res.json();
    boards.push(...(body.values || []).map((b) => ({ id: b.id, name: b.name, type: b.type })));
    if (body.isLast !== false || !(body.values || []).length) break;
    startAt += body.values.length;
  }
  return boards;
}

/** Tira o «ORDER BY» do fim de um JQL, para o poder pôr entre parênteses e juntar condições. */
export function stripOrderBy(query) {
  return (query || '').replace(/\s+ORDER\s+BY\s+[\s\S]*$/i, '').trim();
}

/** Filtro do quadro (+ sub-filtro Kanban) e colunas, com a categoria de cada estado. */
export async function readBoard(request, boardId) {
  const id = Number(boardId);
  if (!Number.isInteger(id) || id <= 0) throw new Error(`Quadro inválido: ${boardId}`);
  const cfgRes = await request(`/rest/agile/1.0/board/${id}/configuration`);
  if (!cfgRes.ok) throw new Error(`Jira respondeu ${cfgRes.status} ao ler o quadro`);
  const cfg = await cfgRes.json();

  const [filterRes, statusRes] = await Promise.all([
    request(`/rest/api/3/filter/${Number(cfg.filter.id)}`),
    request('/rest/api/3/status'),
  ]);
  if (!filterRes.ok) throw new Error(`Jira respondeu ${filterRes.status} ao ler o filtro do quadro`);
  if (!statusRes.ok) throw new Error(`Jira respondeu ${statusRes.status} ao ler os estados`);
  const filter = await filterRes.json();
  const categoryOf = new Map((await statusRes.json()).map((s) => [String(s.id), s.statusCategory?.key]));

  const parts = [stripOrderBy(filter.jql), stripOrderBy(cfg.subQuery?.query)].filter(Boolean).map((q) => `(${q})`);
  const columns = (cfg.columnConfig?.columns || []).map((c) => {
    const statusIds = (c.statuses || []).map((s) => String(s.id));
    const cats = statusIds.map((s) => categoryOf.get(s));
    // Categoria da coluna: concluída se todos os estados são «done»; em curso se algum é «indeterminate»; senão, a fazer.
    const category = statusIds.length && cats.every((k) => k === 'done') ? 'done'
      : cats.some((k) => k === 'indeterminate') ? 'wip' : 'backlog';
    return { name: c.name, statusIds, category, min: c.min ?? null, max: c.max ?? null };
  });
  return { id, baseJql: parts.join(' AND '), columns };
}

const inStatuses = (ids) => `status in (${ids.map(Number).join(', ')})`;

/** Números do quadro: contagem por coluna, trabalho em curso e concluídos recentes carregados, bloqueados contados. */
export async function loadBoardData(request, board, { projectKey, doneWindowDays }) {
  const [flaggedFieldId, types] = await Promise.all([
    findFlaggedFieldId(request),
    findIssueTypes(request, projectKey, { includeSubtasks: true }),
  ]);
  const fields = flaggedFieldId ? [...FIELDS, flaggedFieldId] : FIELDS;
  const normalize = (raw) => normalizeIssue(raw, { flaggedFieldId });
  const ids = (cat) => board.columns.filter((c) => c.category === cat).flatMap((c) => c.statusIds);
  const where = (cond) => `${board.baseJql ? `${board.baseJql} AND ` : ''}${cond}`;

  const wipIds = ids('wip');
  const doneIds = ids('done');
  const openIds = [...ids('backlog'), ...wipIds];
  const flaggedNum = flaggedFieldId ? /^customfield_(\d+)$/.exec(flaggedFieldId)?.[1] : null;

  const [columnCounts, wip, done, blocked, typeCounts] = await Promise.all([
    Promise.all(board.columns.map((c) => (c.category === 'done' || !c.statusIds.length
      ? Promise.resolve(c.statusIds.length ? null : 0)
      : countIssues(request, where(inStatuses(c.statusIds)))))),
    wipIds.length ? searchAll(request, where(`${inStatuses(wipIds)} ORDER BY created ASC`), fields) : { issues: [], truncated: false },
    doneIds.length ? searchAll(request, where(`${inStatuses(doneIds)} AND updated >= -${Number(doneWindowDays)}d`), fields) : { issues: [], truncated: false },
    flaggedNum && openIds.length ? countIssues(request, where(`${inStatuses(openIds)} AND cf[${flaggedNum}] is not EMPTY`)) : Promise.resolve(0),
    // Em aberto por tipo: todos os tickets em aberto do quadro, contados por tipo (sem os carregar).
    openIds.length ? Promise.all(types.map((t) => countIssues(request, where(`${inStatuses(openIds)} AND issuetype = ${Number(t.id)}`)))) : Promise.resolve([]),
  ]);

  return {
    columns: board.columns.map((c, i) => ({ name: c.name, category: c.category, count: columnCounts[i], max: c.max })),
    wip: wip.issues.map(normalize),
    done: done.issues.map(normalize),
    blocked,
    openByType: typeCounts.some((c) => c === null) ? null
      : types.map((t, i) => ({ label: t.name, count: typeCounts[i] || 0 })).filter((r) => r.count > 0),
    truncated: wip.truncated || done.truncated,
    hasFlaggedField: Boolean(flaggedFieldId),
  };
}

/** Vista da página a partir dos dados do quadro. */
export function buildBoardView(data, { countBy, wipAging, percentile }, now = new Date(), doneWindowDays = 14) {
  const since = new Date(now.getTime() - doneWindowDays * DAY_MS);
  const aging = wipAging(data.wip, now);
  const ages = aging.map((i) => i.ageDays);
  const openColumns = data.columns.filter((c) => c.category !== 'done');
  const countFailed = openColumns.some((c) => c.count === null);
  const round1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
  return {
    columns: openColumns.map((c) => ({ name: c.name, count: c.count, wip: c.category === 'wip', max: c.max })),
    kpis: {
      wip: data.wip.length,
      blocked: data.blocked,
      doneRecent: data.done.filter((i) => i.doneAt && i.doneAt >= since).length,
      doneWindowDays,
    },
    countFailed: countFailed || data.openByType === null,
    byType: (data.openByType || []).slice().sort((a, b) => b.count - a.count || String(a.label).localeCompare(String(b.label))),
    wipByAssignee: countBy(data.wip, (i) => i.assignee),
    agingP50: round1(percentile(ages, 50)),
    agingP85: round1(percentile(ages, 85)),
    oldestWip: aging.slice(0, 25).map((i) => ({
      key: i.key, summary: i.summary, assignee: i.assignee, status: i.status, ageDays: round1(i.ageDays), flagged: i.flagged,
    })),
    generatedAt: now.toISOString(),
  };
}
