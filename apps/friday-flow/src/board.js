// Leitura de um quadro do Jira Software, para os números baterem com o que o cliente vê no quadro.
// Recebe `request(path, init)` para poder ser testada sem o Forge.
//
// Do quadro vêm: o filtro (que tickets entram), as colunas (que estados ficam em cada uma) e o sub-filtro
// dos quadros Kanban. As subtarefas contam se o filtro do quadro as incluir, tal como no quadro.
//
// WIP pela posição das colunas, não pelas categorias de estado do Jira (decisão de 14/11/2026):
//   primeira coluna = backlog; última = concluído; todas as do meio = trabalho em curso.
// As categorias enganam: «Selected for Development» é «A fazer» no Jira, mas já está depois do backlog.
// Idade = tempo desde a última entrada numa coluna do meio, lida no histórico de cada ticket
// (The Kanban Guide: «Work Item Age: time since start for an unfinished item»).
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

  const filterRes = await request(`/rest/api/3/filter/${Number(cfg.filter.id)}`);
  if (!filterRes.ok) throw new Error(`Jira respondeu ${filterRes.status} ao ler o filtro do quadro`);
  const filter = await filterRes.json();

  const parts = [stripOrderBy(filter.jql), stripOrderBy(cfg.subQuery?.query)].filter(Boolean).map((q) => `(${q})`);
  const raw = cfg.columnConfig?.columns || [];
  const columns = raw.map((c, i) => ({
    name: c.name,
    statusIds: (c.statuses || []).map((s) => String(s.id)),
    category: columnCategory(i, raw.length),
    min: c.min ?? null,
    max: c.max ?? null,
  }));
  return { id, baseJql: parts.join(' AND '), columns };
}

/** Posição → papel: primeira = backlog, última = concluído, meio = WIP. Com 1 coluna, é tudo backlog. */
export function columnCategory(index, count) {
  if (count <= 1 || index === 0) return 'backlog';
  if (index === count - 1) return 'done';
  return 'wip';
}

/**
 * Quando o ticket entrou no trabalho em curso: a última mudança de estado de fora para dentro das colunas WIP.
 * Sem essa mudança no histórico (criado já em curso, ou histórico em falta), usa a data de criação.
 */
export function startedAt(histories, wipStatusIds, created) {
  const wip = new Set(wipStatusIds.map(String));
  let latest = null;
  for (const h of histories || []) {
    const t = new Date(h.created);
    if (Number.isNaN(t.getTime())) continue;
    for (const it of h.items || []) {
      if ((it.fieldId || it.field) !== 'status') continue;
      if (!wip.has(String(it.from)) && wip.has(String(it.to)) && (!latest || t > latest)) latest = t;
    }
  }
  return latest || created || null;
}

const CHANGELOG_CONCURRENCY = 8;

/** Histórico de estados de vários tickets: primeiro em lote; se o Jira recusar, ticket a ticket. Mapa id → histórico. */
export async function fetchStatusHistories(request, issues) {
  if (!issues.length) return { histories: new Map(), complete: true };
  const ids = issues.map((i) => String(i.id));
  const bulk = await request('/rest/api/3/changelog/bulkfetch', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ issueIdsOrKeys: ids, fieldIds: ['status'], maxResults: 1000 }),
  }).catch(() => null);
  if (bulk?.ok) {
    const body = await bulk.json();
    const map = new Map();
    for (const log of body.issueChangeLogs || []) map.set(String(log.issueId), log.changeHistories || log.histories || []);
    if (!body.nextPageToken) return { histories: map, complete: true };
  }
  // Ticket a ticket, com no máximo CHANGELOG_CONCURRENCY pedidos ao mesmo tempo; lê a última página (as mudanças mais recentes).
  const map = new Map();
  let complete = true;
  let next = 0;
  const worker = async () => {
    while (next < issues.length) {
      const issue = issues[next++];
      const first = await request(`/rest/api/3/issue/${issue.key}/changelog?startAt=0&maxResults=100`);
      if (!first.ok) { complete = false; continue; }
      let page = await first.json();
      if (page.total > 100) {
        const last = await request(`/rest/api/3/issue/${issue.key}/changelog?startAt=${page.total - 100}&maxResults=100`);
        if (last.ok) page = await last.json(); else complete = false;
      }
      map.set(String(issue.id), page.values || []);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CHANGELOG_CONCURRENCY, issues.length) }, worker));
  return { histories: map, complete };
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

  // Idade a partir do histórico: quando o ticket entrou nas colunas do meio.
  const { histories, complete } = await fetchStatusHistories(request, wip.issues);
  const wipItems = wip.issues.map((raw) => {
    const n = normalize(raw);
    return { ...n, categoryChanged: startedAt(histories.get(String(raw.id)), wipIds, n.created) };
  });

  return {
    columns: board.columns.map((c, i) => ({ name: c.name, category: c.category, count: columnCounts[i], max: c.max })),
    wip: wipItems,
    ageFromHistory: complete,
    done: done.issues.map(normalize),
    blocked,
    openByType: typeCounts.some((c) => c === null) ? null
      : types.map((t, i) => ({ label: t.name, count: typeCounts[i] || 0 })).filter((r) => r.count > 0),
    truncated: wip.truncated || done.truncated,
    hasFlaggedField: Boolean(flaggedFieldId),
  };
}

/** Vista da página a partir dos dados do quadro. */
export function buildBoardView(data, { countBy, agingViews }, now = new Date(), doneWindowDays = 14) {
  const since = new Date(now.getTime() - doneWindowDays * DAY_MS);
  const openColumns = data.columns.filter((c) => c.category !== 'done');
  const countFailed = openColumns.some((c) => c.count === null);
  return {
    columns: openColumns.map((c) => ({ name: c.name, count: c.count, wip: c.category === 'wip', max: c.max })),
    kpis: {
      wip: data.wip.length,
      blocked: data.blocked,
      doneRecent: data.done.filter((i) => i.doneAt && i.doneAt >= since).length,
      doneWindowDays,
    },
    countFailed: countFailed || data.openByType === null,
    wipColumnCount: data.columns.filter((c) => c.category === 'wip').length,
    ageFromHistory: data.ageFromHistory !== false,
    byType: (data.openByType || []).slice().sort((a, b) => b.count - a.count || String(a.label).localeCompare(String(b.label))),
    wipByAssignee: countBy(data.wip, (i) => i.assignee),
    aging: agingViews(data.wip, now),
    generatedAt: now.toISOString(),
  };
}
