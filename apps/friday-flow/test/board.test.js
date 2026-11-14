import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listBoards, readBoard, loadBoardData, buildBoardView, stripOrderBy, columnCategory, startedAt, enteredAt, fetchStatusHistories } from '../src/board.js';
import { countBy, agingViews, referenceTimes } from '../src/core/metrics.js';

const NOW = new Date('2026-11-14T00:00:00Z');
const response = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) });

function rawIssue(n, catKey, extra = {}) {
  return {
    id: String(1000 + n),
    key: `FRI-${n}`,
    fields: {
      summary: `Issue ${n}`, issuetype: { name: 'Task' }, assignee: { displayName: 'Ana' },
      status: { name: catKey, statusCategory: { key: catKey } },
      created: '2026-10-01T00:00:00.000+0000', resolutiondate: null, statuscategorychangedate: '2026-11-01T00:00:00.000+0000',
      ...extra,
    },
  };
}

// Quadro como o do projeto de teste: Backlog, Selected for Development, In Progress, Done.
// Estados: 10000 Backlog (new), 10001 Selected (new), 3 In Progress (indeterminate), 10002 Done (done).
function fakeJira({ wip = [], done = [], counts = {}, failCount = false, histories = {}, bulkFails = false, boards = [{ id: 1, name: 'FRI board', type: 'kanban' }] } = {}) {
  const calls = [];
  const request = async (path, init) => {
    const body = init?.body ? JSON.parse(init.body) : null;
    calls.push({ path, jql: body?.jql });
    if (path.startsWith('/rest/agile/1.0/board?')) return response(200, { values: boards, isLast: true });
    if (path === '/rest/agile/1.0/board/1/configuration') {
      return response(200, {
        filter: { id: 99 },
        subQuery: { query: 'fixVersion in unreleasedVersions() OR fixVersion is EMPTY' },
        columnConfig: { columns: [
          { name: 'Backlog', statuses: [{ id: '10000' }] },
          { name: 'Selected for Development', statuses: [{ id: '10001' }] },
          { name: 'In Progress', statuses: [{ id: '3' }], max: 5 },
          { name: 'Done', statuses: [{ id: '10002' }] },
        ] },
      });
    }
    if (path === '/rest/api/3/filter/99') return response(200, { jql: 'project = FRI ORDER BY Rank ASC' });
    if (path === '/rest/api/3/status') {
      return response(200, [
        { id: '10000', statusCategory: { key: 'new' } }, { id: '10001', statusCategory: { key: 'new' } },
        { id: '3', statusCategory: { key: 'indeterminate' } }, { id: '10002', statusCategory: { key: 'done' } },
      ]);
    }
    if (path === '/rest/api/3/field') return response(200, [{ id: 'customfield_1', custom: true, name: 'Flagged' }]);
    if (path === '/rest/api/3/project/FRI') {
      return response(200, { issueTypes: [{ id: '1', name: 'Task' }, { id: '2', name: 'Bug' }, { id: '3', name: 'Sub-task', subtask: true }] });
    }
    if (path === '/rest/api/3/search/approximate-count') {
      if (failCount) return response(500, {});
      const key = Object.keys(counts).find((k) => body.jql.includes(k));
      return response(200, { count: key ? counts[key] : 0 });
    }
    if (path === '/rest/api/3/changelog/bulkfetch') {
      if (bulkFails) return response(404, {});
      return response(200, { issueChangeLogs: body.issueIdsOrKeys.map((id) => ({ issueId: id, changeHistories: histories[id] || [] })) });
    }
    const one = /^\/rest\/api\/3\/issue\/(FRI-\d+)\/changelog/.exec(path);
    if (one) {
      const raw = wip.find((i) => i.key === one[1]);
      const values = histories[raw.id] || [];
      return response(200, { values, total: values.length });
    }
    if (path === '/rest/api/3/search/jql') {
      const all = body.jql.includes('status in (10001, 3)') ? wip : done;
      const start = Number(body.nextPageToken || 0);
      const next = start + body.maxResults;
      return response(200, { issues: all.slice(start, next), isLast: next >= all.length, nextPageToken: String(next) });
    }
    return response(404, { path });
  };
  return { request, calls };
}

test('tira o ORDER BY do filtro do quadro', () => {
  assert.equal(stripOrderBy('project = FRI ORDER BY Rank ASC'), 'project = FRI');
  assert.equal(stripOrderBy('project = FRI order by created DESC, priority'), 'project = FRI');
  assert.equal(stripOrderBy('project = FRI'), 'project = FRI');
  assert.equal(stripOrderBy(undefined), '');
});

test('lista os quadros do projeto', async () => {
  const { request } = fakeJira();
  assert.deepEqual(await listBoards(request, 'FRI'), [{ id: 1, name: 'FRI board', type: 'kanban' }]);
});

test('papel da coluna pela posição: primeira backlog, última concluído, meio WIP', () => {
  assert.deepEqual([0, 1, 2, 3].map((i) => columnCategory(i, 4)), ['backlog', 'wip', 'wip', 'done']);
  assert.deepEqual([0, 1].map((i) => columnCategory(i, 2)), ['backlog', 'done']);
  assert.deepEqual([0].map((i) => columnCategory(i, 1)), ['backlog']);
});

test('lê o quadro: filtro + sub-filtro, colunas pela posição (não pela categoria do Jira)', async () => {
  const { request, calls } = fakeJira();
  const b = await readBoard(request, 1);
  assert.equal(b.baseJql, '(project = FRI) AND (fixVersion in unreleasedVersions() OR fixVersion is EMPTY)');
  // «Selected for Development» é «A fazer» no Jira, mas está entre o backlog e o done: é WIP.
  assert.deepEqual(b.columns.map((c) => [c.name, c.category, c.max]), [
    ['Backlog', 'backlog', null], ['Selected for Development', 'wip', null], ['In Progress', 'wip', 5], ['Done', 'done', null],
  ]);
  assert.ok(!calls.some((c) => c.path === '/rest/api/3/status'), 'já não precisa das categorias de estado');
  await assert.rejects(readBoard(request, 'x'), /Quadro inválido/);
});

test('números do quadro: por coluna, WIP com subtarefas, bloqueados e tipos', async () => {
  const wip = [
    rawIssue(1, 'indeterminate', { customfield_1: [{ value: 'Impediment' }] }),
    ...Array.from({ length: 6 }, (_, i) => rawIssue(10 + i, 'indeterminate')),
  ];
  const done = [
    rawIssue(20, 'done', { resolutiondate: '2026-11-12T00:00:00.000+0000' }),
    rawIssue(21, 'done', { resolutiondate: null, statuscategorychangedate: '2026-10-01T00:00:00.000+0000' }),
  ];
  const counts = {
    'status in (10000)': 1004,
    'status in (10001)': 0,
    'status in (3)': 7,
    'cf[1] is not EMPTY': 2,
    'issuetype = 1': 1009,
    'issuetype = 2': 1,
    'issuetype = 3': 1,
  };
  // As chaves não se confundem: «status in (3)» não aparece em «status in (10000, 10001, 3)».
  const { request, calls } = fakeJira({ wip, done, counts });
  const board = await readBoard(request, 1);
  const data = await loadBoardData(request, board, { projectKey: 'FRI', doneWindowDays: 14 });
  const v = buildBoardView(data, { countBy, agingViews, referenceTimes }, NOW, 14);

  assert.deepEqual(v.columns, [
    { name: 'Backlog', count: 1004, wip: false, max: null },
    { name: 'Selected for Development', count: 0, wip: true, max: null },
    { name: 'In Progress', count: 7, wip: true, max: 5 },
  ]);
  assert.equal(v.wipColumnCount, 2);
  assert.deepEqual(v.kpis, { wip: 7, blocked: 2, doneRecent: 1, doneWindowDays: 14 });
  assert.deepEqual(v.byType, [{ label: 'Task', count: 1009 }, { label: 'Bug', count: 1 }, { label: 'Sub-task', count: 1 }]);
  assert.equal(v.aging.start.rows.length, 7);
  assert.equal(v.countFailed, false);

  // Todas as pesquisas usam o filtro do quadro; nenhuma tem o ORDER BY do filtro a meio.
  for (const c of calls.filter((x) => x.jql)) {
    assert.ok(c.jql.startsWith('(project = FRI) AND (fixVersion in unreleasedVersions() OR fixVersion is EMPTY) AND '), c.jql);
    assert.ok(!/Rank/.test(c.jql), c.jql);
    assert.ok(!c.jql.includes('subTaskIssueTypes'), 'o quadro decide as subtarefas, não a app');
  }
  // A coluna Done não é contada: o quadro esconde os concluídos antigos à sua maneira.
  assert.ok(!calls.some((c) => c.jql?.endsWith('status in (10002)')));
});

test('se uma contagem falhar, mostra «–» e avisa', async () => {
  const { request } = fakeJira({ failCount: true });
  const board = await readBoard(request, 1);
  const v = buildBoardView(await loadBoardData(request, board, { projectKey: 'FRI', doneWindowDays: 14 }), { countBy, agingViews, referenceTimes }, NOW, 14);
  assert.equal(v.columns[0].count, null);
  assert.equal(v.countFailed, true);
});

test('idade: última entrada nas colunas WIP; reabrir recomeça; sem histórico usa a criação', () => {
  const created = new Date('2026-10-01T00:00:00Z');
  const h = (created, from, to) => ({ created, items: [{ fieldId: 'status', from, to }] });
  const wipIds = ['10001', '3'];
  // Backlog → Selected (dia 5) → In Progress (dia 8): conta desde a entrada em Selected, não desde In Progress.
  assert.equal(startedAt([h('2026-11-05T00:00:00Z', '10000', '10001'), h('2026-11-08T00:00:00Z', '10001', '3')], wipIds, created).toISOString(), '2026-11-05T00:00:00.000Z');
  // Concluído e reaberto a dia 12: recomeça.
  assert.equal(startedAt([h('2026-11-05T00:00:00Z', '10000', '3'), h('2026-11-10T00:00:00Z', '3', '10002'), h('2026-11-12T00:00:00Z', '10002', '3')], wipIds, created).toISOString(), '2026-11-12T00:00:00.000Z');
  // Mudanças de outros campos não contam; sem entrada em WIP, usa a criação.
  assert.equal(startedAt([{ created: '2026-11-01T00:00:00Z', items: [{ field: 'assignee', from: 'a', to: 'b' }] }], wipIds, created), created);
  assert.equal(startedAt(undefined, wipIds, created), created);
});

test('histórico: em lote; se o lote falhar, ticket a ticket', async () => {
  const wip = [rawIssue(1, 'indeterminate'), rawIssue(2, 'indeterminate')];
  const histories = { 1001: [{ created: '2026-11-10T00:00:00Z', items: [{ fieldId: 'status', from: '10000', to: '3' }] }] };
  const bulk = fakeJira({ wip, histories });
  const r1 = await fetchStatusHistories(bulk.request, wip);
  assert.equal(r1.complete, true);
  assert.equal(r1.histories.get('1001').length, 1);
  assert.equal(bulk.calls.filter((c) => c.path.includes('/changelog')).length, 1);

  const single = fakeJira({ wip, histories, bulkFails: true });
  const r2 = await fetchStatusHistories(single.request, wip);
  assert.equal(r2.complete, true);
  assert.equal(r2.histories.get('1001').length, 1);
  assert.equal(single.calls.filter((c) => c.path.startsWith('/rest/api/3/issue/')).length, 2);
});

test('a idade na vista vem do histórico', async () => {
  const wip = [rawIssue(1, 'indeterminate', { statuscategorychangedate: '2026-11-13T00:00:00.000+0000' })];
  const histories = { 1001: [{ created: '2026-11-04T00:00:00Z', items: [{ fieldId: 'status', from: '10000', to: '10001' }] }] };
  const { request } = fakeJira({ wip, histories, counts: { 'status in (10000)': 0 } });
  const board = await readBoard(request, 1);
  const v = buildBoardView(await loadBoardData(request, board, { projectKey: 'FRI', doneWindowDays: 14 }), { countBy, agingViews, referenceTimes }, NOW, 14);
  assert.equal(v.aging.start.rows[0].ageDays, 10);
  assert.equal(v.aging.created.rows[0].ageDays, 44); // com o backlog: desde a criação, 1/10 // desde 4/11 (entrada em Selected), não 1 dia (mudança de categoria)
  assert.equal(v.ageFromHistory, true);
});

test('concluídos: início e fim lidos no histórico pelas colunas do quadro, e a referência a partir deles', async () => {
  const h = (created, from, to) => ({ created, items: [{ fieldId: 'status', from, to }] });
  assert.equal(enteredAt([h('2026-11-01T00:00:00Z', '3', '10002')], ['10002']).toISOString(), '2026-11-01T00:00:00.000Z');
  assert.equal(enteredAt([], ['10002']), null);

  const done = [rawIssue(30, 'done', { created: '2026-10-20T00:00:00.000+0000' })];
  const histories = { 1030: [h('2026-11-02T00:00:00Z', '10000', '10001'), h('2026-11-09T00:00:00Z', '3', '10002')] };
  const { request } = fakeJira({ wip: [], done, histories, counts: {} });
  const board = await readBoard(request, 1);
  const data = await loadBoardData(request, board, { projectKey: 'FRI', doneWindowDays: 14, referenceDays: 30 });
  assert.equal(data.done[0].startedAt.toISOString(), '2026-11-02T00:00:00.000Z');
  assert.equal(data.done[0].doneAt.toISOString(), '2026-11-09T00:00:00.000Z');
  const v = buildBoardView(data, { countBy, agingViews, referenceTimes }, NOW, 14, 30);
  assert.deepEqual(v.reference.cycle, { p50: 7, p85: 7, n: 1 });
  assert.deepEqual(v.reference.lead, { p50: 20, p85: 20, n: 1 });
  assert.equal(v.reference.windowDays, 30);
});

test('a pesquisa dos concluídos cobre o maior dos dois períodos', async () => {
  const { request, calls } = fakeJira({});
  const board = await readBoard(request, 1);
  await loadBoardData(request, board, { projectKey: 'FRI', doneWindowDays: 14, referenceDays: 180 });
  assert.ok(calls.some((c) => c.jql?.includes('status in (10002) AND updated >= -180d')));
});
