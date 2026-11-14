// Leitura de um quadro do Jira Software, para os números baterem com o que o cliente vê no quadro.
// Recebe `request(path, init)` para poder ser testada sem o Forge.
//
// Do quadro vêm: o filtro (que tickets entram), as colunas (que estados ficam em cada uma) e o sub-filtro
// dos quadros Kanban. As subtarefas contam se o filtro do quadro as incluir, tal como no quadro.
//
// Onde o trabalho começa e acaba (The Kanban Guide: cada equipa define os «start and finish points»):
//   por omissão, ignora as colunas vazias (sem estados) do início e do fim, como a coluna especial de backlog
//   dos quadros Kanban; a primeira coluna com estados é o backlog, a última é o concluído, as do meio são WIP.
//   A equipa pode escolher outras colunas de início e de fim (guardado por quadro).
// Não usamos as categorias de estado do Jira para o início: «Selected for Development» é «A fazer» no Jira, mas já é WIP.
// No fim, sim: as colunas com estados da categoria «Concluído» encostadas à última (ex.: Done | Released) nunca são WIP
// (decisão de 15/11/2026).
// Idade = tempo desde a última entrada numa coluna do meio, lida no histórico de cada ticket
// (The Kanban Guide: «Work Item Age: time since start for an unfinished item»).
import { normalizeIssue } from './core/metrics.js';
import { FIELDS, searchAll, countIssues, findFlaggedFieldId, checkProjectKey } from './jira.js';

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
export async function readBoard(request, boardId, override = null) {
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
  const filter = await filterRes.json();
  // Categorias dos estados: só para alargar o «concluído» (Done | Released). Se falhar, segue sem elas.
  const categoryOf = new Map(statusRes.ok ? (await statusRes.json()).map((x) => [String(x.id), x.statusCategory?.key]) : []);

  const parts = [stripOrderBy(filter.jql), stripOrderBy(cfg.subQuery?.query)].filter(Boolean).map((q) => `(${q})`);
  const raw = (cfg.columnConfig?.columns || []).map((c) => ({
    name: c.name,
    statusIds: (c.statuses || []).map((s) => String(s.id)),
    min: c.min ?? null,
    max: c.max ?? null,
  }));
  const { categories, workflow } = classifyColumns(raw, override, categoryOf);
  const columns = raw.map((c, i) => ({ ...c, category: categories[i] }));
  return { id, baseJql: parts.join(' AND '), columns, workflow };
}

/**
 * Papel de cada coluna: 'backlog', 'wip' ou 'done'.
 * `override` = { start, end } com nomes de colunas: WIP vai da coluna `start` até antes da `end`; da `end` em diante é concluído.
 * Sem override (ou se já não servir), a regra por omissão descrita no topo do ficheiro.
 */
export function classifyColumns(columns, override = null, categoryOf = new Map()) {
  const n = columns.length;
  const filled = columns.map((c, i) => (c.statusIds.length ? i : -1)).filter((i) => i >= 0);
  const byOverride = () => {
    if (!override?.start || !override?.end) return null;
    const s = columns.findIndex((c) => c.name === override.start);
    const e = columns.findIndex((c) => c.name === override.end);
    if (s < 0 || e < 0 || s >= e) return null;
    return { s, e };
  };
  const chosen = byOverride();
  let s; let e;
  if (chosen) ({ s, e } = chosen);
  else if (filled.length >= 2) {
    // Backlog = primeira coluna com estados; WIP começa na coluna seguinte; concluído = última coluna com estados
    // e as colunas com estados que estão logo antes dela e cujos estados são todos «Concluído» no Jira (Done | Released).
    const allDone = (c) => c.statusIds.length > 0 && c.statusIds.every((id) => categoryOf.get(String(id)) === 'done');
    let k = filled.length - 1;
    while (k - 1 >= 1 && allDone(columns[filled[k - 1]])) k -= 1;
    s = filled[0] + 1;
    e = filled[k];
  } else {
    s = n; e = n; // uma só coluna com estados: tudo backlog
  }
  const categories = columns.map((_, i) => (i < s ? 'backlog' : i < e ? 'wip' : 'done'));
  const wipCols = columns.filter((_, i) => categories[i] === 'wip');
  return {
    categories,
    workflow: {
      start: wipCols[0]?.name ?? null,
      end: columns[e]?.name ?? null,
      isDefault: !chosen,
      overrideIgnored: Boolean(override?.start && override?.end) && !chosen,
      columns: columns.map((c) => c.name),
    },
  };
}

/** Compatível com os testes antigos: papel pela posição, com todas as colunas preenchidas. */
export function columnCategory(index, count) {
  const cols = Array.from({ length: count }, (_, i) => ({ name: String(i), statusIds: ['x'] }));
  return classifyColumns(cols).categories[index];
}

/**
 * Quando o ticket entrou no trabalho em curso: a última mudança de estado de fora para dentro das colunas WIP.
 * Sem essa mudança no histórico (criado já em curso, ou histórico em falta), usa a data de criação.
 */
/** Última entrada, vinda de fora, num conjunto de estados; null se não houver no histórico. */
export function enteredAt(histories, statusIds) {
  const set = new Set(statusIds.map(String));
  let latest = null;
  for (const h of histories || []) {
    const t = new Date(h.created);
    if (Number.isNaN(t.getTime())) continue;
    for (const it of h.items || []) {
      if ((it.fieldId || it.field) !== 'status') continue;
      if (!set.has(String(it.from)) && set.has(String(it.to)) && (!latest || t > latest)) latest = t;
    }
  }
  return latest;
}

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
  if (!issues.length) return { histories: new Map(), complete: true, partial: new Set() };
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
    if (!body.nextPageToken) return { histories: map, complete: true, partial: new Set() };
  }
  // Ticket a ticket, com no máximo CHANGELOG_CONCURRENCY pedidos ao mesmo tempo; lê a última página (as mudanças mais recentes).
  const map = new Map();
  const partial = new Set(); // tickets com mais de 100 alterações: só lemos as 100 mais recentes
  let complete = true;
  let next = 0;
  const worker = async () => {
    while (next < issues.length) {
      const issue = issues[next++];
      const first = await request(`/rest/api/3/issue/${issue.key}/changelog?startAt=0&maxResults=100`);
      if (!first.ok) { complete = false; continue; }
      let page = await first.json();
      if (page.total > 100) {
        partial.add(String(issue.id));
        const last = await request(`/rest/api/3/issue/${issue.key}/changelog?startAt=${page.total - 100}&maxResults=100`);
        if (last.ok) page = await last.json(); else complete = false;
      }
      map.set(String(issue.id), page.values || []);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CHANGELOG_CONCURRENCY, issues.length) }, worker));
  return { histories: map, complete, partial };
}

const inStatuses = (ids) => `status in (${ids.map(Number).join(', ')})`;

export const THROUGHPUT_WEEKS = 12;

/**
 * Números do quadro. Uma só fonte para cada número:
 *   colunas de WIP e cartão «Em curso» — os tickets carregados (exatos);
 *   colunas de backlog e bloqueados no backlog — contagem do Jira;
 *   concluídos — carregados, pelo maior período preciso (cartão, referência, entregas por semana).
 */
export async function loadBoardData(request, board, { doneWindowDays, referenceDays = 90 }) {
  const flaggedFieldId = await findFlaggedFieldId(request);
  const fields = flaggedFieldId ? [...FIELDS, flaggedFieldId] : FIELDS;
  const normalize = (raw) => normalizeIssue(raw, { flaggedFieldId });
  const ids = (cat) => board.columns.filter((c) => c.category === cat).flatMap((c) => c.statusIds);
  const where = (cond) => `${board.baseJql ? `${board.baseJql} AND ` : ''}${cond}`;

  const wipIds = ids('wip');
  const doneIds = ids('done');
  const backlogIds = ids('backlog');
  const flaggedNum = flaggedFieldId ? /^customfield_(\d+)$/.exec(flaggedFieldId)?.[1] : null;
  const doneDays = Math.max(Number(doneWindowDays), Number(referenceDays), THROUGHPUT_WEEKS * 7);

  const [backlogCounts, wip, done, blockedBacklog] = await Promise.all([
    Promise.all(board.columns.map((c) => (c.category === 'backlog' && c.statusIds.length
      ? countIssues(request, where(inStatuses(c.statusIds))) : Promise.resolve(null)))),
    wipIds.length ? searchAll(request, where(`${inStatuses(wipIds)} ORDER BY created ASC`), fields) : { issues: [], truncated: false },
    // ORDER BY: se o limite de segurança cortar, ficam os mais recentes, não um subconjunto ao acaso.
    doneIds.length ? searchAll(request, where(`${inStatuses(doneIds)} AND updated >= -${doneDays}d ORDER BY updated DESC`), fields) : { issues: [], truncated: false },
    // Bloqueados no backlog: contados. Os em curso contam-se nos carregados, para baterem com a tabela.
    flaggedNum && backlogIds.length ? countIssues(request, where(`${inStatuses(backlogIds)} AND cf[${flaggedNum}] is not EMPTY`))
      : Promise.resolve(flaggedNum ? 0 : null),
  ]);

  // Histórico dos em curso e dos concluídos, num só pedido: idade, início e fim reais pelas colunas do quadro.
  const { histories, complete, partial } = await fetchStatusHistories(request, [...wip.issues, ...done.issues]);
  const columnOfStatus = new Map(board.columns.flatMap((c) => c.statusIds.map((id) => [String(id), c.name])));
  let ageGuessed = false;
  const wipItems = wip.issues.map((raw) => {
    const n = normalize(raw);
    const h = histories.get(String(raw.id));
    const started = enteredAt(h, wipIds);
    // Histórico cortado e sem a entrada em WIP: a idade cai para a criação — e a página tem de o dizer.
    if (!started && partial.has(String(raw.id))) ageGuessed = true;
    return { ...n, categoryChanged: started || n.created, column: columnOfStatus.get(String(raw.fields?.status?.id)) ?? null };
  });
  const doneItems = done.issues.map((raw) => {
    const n = normalize(raw);
    const h = histories.get(String(raw.id));
    return { ...n, doneAt: enteredAt(h, doneIds) || n.doneAt, startedAt: enteredAt(h, wipIds) };
  });

  const wipCount = (c) => wipItems.filter((i) => i.column === c.name).length;
  return {
    columns: board.columns.map((c, i) => ({
      name: c.name, category: c.category, max: c.max, hasStatuses: c.statusIds.length > 0,
      count: c.category === 'wip' ? wipCount(c) : c.category === 'backlog' ? backlogCounts[i] : null,
    })),
    workflow: board.workflow,
    wip: wipItems,
    ageFromHistory: complete && !ageGuessed,
    done: doneItems,
    blockedBacklog,
    truncated: wip.truncated || done.truncated,
    hasFlaggedField: Boolean(flaggedFieldId),
  };
}

/**
 * Bandas de idade por coluna de WIP (a leitura do gráfico de aging de Vacanti, sem gráfico de dispersão):
 *   ok   — até à mediana da referência; slow — até ao P85; late — acima do P85.
 * Sem referência (nenhum concluído no período), não há bandas.
 */
export function ageBands(wip, wipColumns, now, ref, from) {
  if (!ref || !ref.n) return null;
  const rows = [];
  for (const c of wipColumns) {
    const ages = wip.filter((i) => i.column === c.name).map((i) => (now.getTime() - from(i).getTime()) / DAY_MS);
    rows.push({ column: c.name, band: 'ok', count: ages.filter((a) => a <= ref.p50).length });
    rows.push({ column: c.name, band: 'slow', count: ages.filter((a) => a > ref.p50 && a <= ref.p85).length });
    rows.push({ column: c.name, band: 'late', count: ages.filter((a) => a > ref.p85).length });
  }
  return rows;
}

/** Vista da página a partir dos dados do quadro. */
export function buildBoardView(data, { agingViews, referenceTimes, weeklyThroughput }, now = new Date(), doneWindowDays = 14, referenceDays = 90) {
  const since = new Date(now.getTime() - doneWindowDays * DAY_MS);
  const reference = referenceTimes(data.done, now, referenceDays);
  const wipColumns = data.columns.filter((c) => c.category === 'wip');
  const backlogColumns = data.columns.filter((c) => c.category === 'backlog' && c.hasStatuses);
  const backlogCount = backlogColumns.some((c) => c.count === null) ? null : backlogColumns.reduce((sum, c) => sum + c.count, 0);
  const wipFlagged = data.wip.filter((i) => i.flagged).length;
  const from = { start: (i) => i.categoryChanged || i.created, created: (i) => i.created || i.categoryChanged };
  return {
    workflow: data.workflow,
    columns: wipColumns.map((c) => ({ name: c.name, count: c.count, max: c.max })),
    backlogCount,
    countFailed: backlogCount === null,
    kpis: {
      wip: data.wip.length,
      // Bloqueados: em curso (dos carregados, batem com a tabela) + no backlog (contados). Sem campo Flagged: null.
      blocked: data.hasFlaggedField && data.blockedBacklog !== null
        ? { total: wipFlagged + data.blockedBacklog, backlog: data.blockedBacklog } : null,
      doneRecent: data.done.filter((i) => i.doneAt && i.doneAt >= since).length,
      doneWindowDays,
    },
    ageFromHistory: data.ageFromHistory !== false,
    reference,
    aging: agingViews(data.wip, now, 25, { start: reference.cycle.p85, created: reference.lead.p85 }),
    bands: {
      start: ageBands(data.wip, wipColumns, now, reference.cycle, from.start),
      created: ageBands(data.wip, wipColumns, now, reference.lead, from.created),
    },
    throughput: weeklyThroughput(data.done.map((i) => i.doneAt), now),
    generatedAt: now.toISOString(),
  };
}
