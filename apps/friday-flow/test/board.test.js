import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listBoards, readBoard, loadBoardData, buildBoardView, ageBands, stripOrderBy, columnCategory, classifyColumns, startedAt, enteredAt, fetchStatusHistories } from '../src/board.js';
import { agingViews, referenceTimes, weeklyThroughput } from '../src/core/metrics.js';
import { flowFindings } from '../src/core/findings.js';
const DEPS = { agingViews, referenceTimes, weeklyThroughput };

const NOW = new Date('2026-11-14T00:00:00Z');
const response = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) });

function rawIssue(n, catKey, extra = {}) {
  return {
    id: String(1000 + n),
    key: `FRI-${n}`,
    fields: {
      summary: `Issue ${n}`, issuetype: { name: 'Task' }, assignee: { displayName: 'Ana' },
      status: { id: { new: '10000', indeterminate: '3', done: '10002' }[catKey], name: catKey, statusCategory: { key: catKey } },
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
  assert.ok(calls.some((c) => c.path === '/rest/api/3/status'), 'lê as categorias, só para o fim (Done | Released)');
  await assert.rejects(readBoard(request, 'x'), /Quadro inválido/);
});

test('números do quadro: colunas em curso exatas, backlog contado, bloqueados separados, uma só fonte', async () => {
  const wip = [
    rawIssue(1, 'indeterminate', { customfield_1: [{ value: 'Impediment' }] }),
    ...Array.from({ length: 6 }, (_, i) => rawIssue(10 + i, 'indeterminate')),
  ];
  const done = [
    rawIssue(20, 'done', { resolutiondate: '2026-11-12T00:00:00.000+0000' }),
    rawIssue(21, 'done', { resolutiondate: null, statuscategorychangedate: '2026-10-01T00:00:00.000+0000' }),
  ];
  // A contagem do Jira para «In Progress» diz 9, mas os carregados são 7: o gráfico tem de usar os carregados.
  const counts = { 'status in (10000) AND cf[1]': 1, 'status in (10000)': 1004, 'status in (3)': 9 };
  const { request, calls } = fakeJira({ wip, done, counts });
  const board = await readBoard(request, 1);
  const data = await loadBoardData(request, board, { doneWindowDays: 14 });
  const v = buildBoardView(data, DEPS, NOW, 14);

  assert.deepEqual(v.columns, [
    { name: 'Selected for Development', count: 0, max: null },
    { name: 'In Progress', count: 7, max: 5 },
  ]);
  assert.equal(v.backlogCount, 1004);
  assert.deepEqual(v.kpis, { wip: 7, blocked: { total: 2, backlog: 1 }, doneRecent: 1, doneWindowDays: 14 });
  assert.equal(v.aging.start.rows.length, 7);
  assert.equal(v.aging.start.rows[0].column, 'In Progress');
  assert.equal(v.countFailed, false);
  assert.equal(v.throughput.length, 12);

  // Todas as pesquisas usam o filtro do quadro; nenhuma tem o ORDER BY do filtro a meio; não há pedidos por tipo.
  for (const c of calls.filter((x) => x.jql)) {
    assert.ok(c.jql.startsWith('(project = FRI) AND (fixVersion in unreleasedVersions() OR fixVersion is EMPTY) AND '), c.jql);
    assert.ok(!/Rank/.test(c.jql), c.jql);
    assert.ok(!c.jql.includes('issuetype ='), 'já não conta por tipo no modo quadro');
  }
  // As colunas em curso já não são contadas pelo Jira (vêm dos carregados).
  assert.ok(!calls.some((c) => c.path.endsWith('approximate-count') && c.jql.endsWith('status in (3)')));
});

test('se a contagem do backlog falhar: backlog «–» e aviso; as colunas em curso continuam certas', async () => {
  const { request } = fakeJira({ wip: [rawIssue(1, 'indeterminate')], failCount: true });
  const board = await readBoard(request, 1);
  const v = buildBoardView(await loadBoardData(request, board, { doneWindowDays: 14 }), DEPS, NOW, 14);
  assert.equal(v.backlogCount, null);
  assert.equal(v.countFailed, true);
  assert.deepEqual(v.columns.map((c) => c.count), [0, 1]);
  assert.equal(v.kpis.blocked, null, 'sem contagem de bloqueados no backlog: «–», não um número errado');
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
  const v = buildBoardView(await loadBoardData(request, board, { doneWindowDays: 14 }), { agingViews, referenceTimes, weeklyThroughput }, NOW, 14);
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
  const data = await loadBoardData(request, board, { doneWindowDays: 14, referenceDays: 30 });
  assert.equal(data.done[0].startedAt.toISOString(), '2026-11-02T00:00:00.000Z');
  assert.equal(data.done[0].doneAt.toISOString(), '2026-11-09T00:00:00.000Z');
  const v = buildBoardView(data, { agingViews, referenceTimes, weeklyThroughput }, NOW, 14, 30);
  assert.deepEqual(v.reference.cycle, { p50: 7, p85: 7, n: 1 });
  assert.deepEqual(v.reference.lead, { p50: 20, p85: 20, n: 1 });
  assert.equal(v.reference.windowDays, 30);
});

test('a pesquisa dos concluídos cobre o maior período (cartão, referência, 12 semanas) e vem ordenada', async () => {
  const { request, calls } = fakeJira({});
  const board = await readBoard(request, 1);
  await loadBoardData(request, board, { doneWindowDays: 14, referenceDays: 180 });
  assert.ok(calls.some((c) => c.jql?.includes('status in (10002) AND updated >= -180d ORDER BY updated DESC')));
  const again = fakeJira({});
  await loadBoardData(again.request, await readBoard(again.request, 1), { doneWindowDays: 14, referenceDays: 30 });
  assert.ok(again.calls.some((c) => c.jql?.includes('updated >= -84d ORDER BY updated DESC')), '12 semanas = 84 dias');
});

test('Done | Released: colunas «Concluído» encostadas à última nunca são em curso', () => {
  const col = (name, statuses) => ({ name, statusIds: statuses });
  const cols = [col('Backlog', ['1']), col('Dev', ['2']), col('Done', ['3']), col('Released', ['4'])];
  const cats = new Map([['1', 'new'], ['2', 'indeterminate'], ['3', 'done'], ['4', 'done']]);
  assert.deepEqual(classifyColumns(cols, null, cats).categories, ['backlog', 'wip', 'done', 'done']);
  // Sem categorias (pedido falhou): volta à posição.
  assert.deepEqual(classifyColumns(cols).categories, ['backlog', 'wip', 'wip', 'done']);
  // Uma coluna «Concluído» que não está encostada ao fim não é alargada.
  const gap = [col('Backlog', ['1']), col('Done?', ['3']), col('Teste', ['2']), col('Released', ['4'])];
  assert.deepEqual(classifyColumns(gap, null, cats).categories, ['backlog', 'wip', 'wip', 'done']);
  // A definição da equipa ganha sempre.
  assert.deepEqual(classifyColumns(cols, { start: 'Dev', end: 'Released' }, cats).categories, ['backlog', 'wip', 'wip', 'done']);
});

test('bandas de idade por coluna: habitual, a ficar lento, acima da referência', () => {
  const now = new Date('2026-11-14T00:00:00Z');
  const item = (column, daysAgo) => ({ column, categoryChanged: new Date(now.getTime() - daysAgo * 86400000) });
  const wip = [item('Dev', 1), item('Dev', 4), item('Dev', 12), item('Teste', 2)];
  const rows = ageBands(wip, [{ name: 'Dev' }, { name: 'Teste' }], now, { p50: 3, p85: 10, n: 20 }, (i) => i.categoryChanged);
  assert.deepEqual(rows.map((r) => [r.column, r.band, r.count]), [
    ['Dev', 'ok', 1], ['Dev', 'slow', 1], ['Dev', 'late', 1], ['Teste', 'ok', 1], ['Teste', 'slow', 0], ['Teste', 'late', 0],
  ]);
  assert.equal(ageBands(wip, [{ name: 'Dev' }], now, { p50: null, p85: null, n: 0 }, (i) => i.categoryChanged), null);
});

test('histórico cortado sem a entrada em curso: a idade cai para a criação e a página avisa', async () => {
  const wip = [rawIssue(1, 'indeterminate')];
  const { request } = fakeJira({ wip, bulkFails: true, histories: { 1001: [] } });
  const longHistory = async (path, init) => {
    if (/\/issue\/FRI-1\/changelog/.test(path)) return response(200, { values: [], total: 250 });
    return request(path, init);
  };
  const board = await readBoard(longHistory, 1);
  const data = await loadBoardData(longHistory, board, { doneWindowDays: 14 });
  assert.equal(data.ageFromHistory, false);
});

test('colunas vazias no início (backlog Kanban do Jira) não contam como backlog nem empurram o WIP', () => {
  const col = (name, statuses) => ({ name, statusIds: statuses });
  // O caso do quadro de teste: «Lista de pendências» vazia, depois Backlog, Selected, In Progress, Done.
  const cols = [col('Lista de pendências', []), col('Backlog', ['10000']), col('Selected', ['10001']), col('In Progress', ['3']), col('Done', ['10002'])];
  const r = classifyColumns(cols);
  assert.deepEqual(r.categories, ['backlog', 'backlog', 'wip', 'wip', 'done']);
  assert.deepEqual([r.workflow.start, r.workflow.end, r.workflow.isDefault], ['Selected', 'Done', true]);
  // Coluna vazia no fim também é ignorada.
  assert.deepEqual(classifyColumns([...cols, col('Arquivo', [])]).categories, ['backlog', 'backlog', 'wip', 'wip', 'done', 'done']);
  // Uma só coluna com estados: tudo backlog.
  assert.deepEqual(classifyColumns([col('A', ['1']), col('B', [])]).categories, ['backlog', 'backlog']);
});

test('definição da equipa: começa e termina onde a equipa disser; inválida volta ao padrão e avisa', () => {
  const col = (name, statuses) => ({ name, statusIds: statuses });
  const cols = [col('Backlog', ['1']), col('Pronto', ['2']), col('Dev', ['3']), col('Teste', ['4']), col('Done', ['5'])];
  const r = classifyColumns(cols, { start: 'Dev', end: 'Done' });
  assert.deepEqual(r.categories, ['backlog', 'backlog', 'wip', 'wip', 'done']);
  assert.equal(r.workflow.isDefault, false);
  const fim = classifyColumns(cols, { start: 'Pronto', end: 'Teste' });
  assert.deepEqual(fim.categories, ['backlog', 'wip', 'wip', 'done', 'done']);
  const bad = classifyColumns(cols, { start: 'Já não existe', end: 'Done' });
  assert.deepEqual(bad.categories, ['backlog', 'wip', 'wip', 'wip', 'done']);
  assert.equal(bad.workflow.overrideIgnored, true);
  assert.equal(classifyColumns(cols, { start: 'Done', end: 'Dev' }).workflow.overrideIgnored, true);
});

test('readBoard aplica a definição guardada', async () => {
  const { request } = fakeJira();
  const b = await readBoard(request, 1, { start: 'In Progress', end: 'Done' });
  assert.deepEqual(b.columns.map((c) => c.category), ['backlog', 'backlog', 'wip', 'done']);
  assert.equal(b.workflow.start, 'In Progress');
});

test('«O que os seus dados dizem»: histórico do Flagged no mesmo pedido, tempo por coluna e os 4 padrões na vista', async () => {
  const h = (created, from, to) => ({ created, items: [{ fieldId: 'status', from, to }] });
  const wip = [rawIssue(1, 'indeterminate', { customfield_1: [{ value: 'Impediment' }] })];
  const done = [rawIssue(30, 'done', { created: '2026-10-20T00:00:00.000+0000' })];
  const histories = {
    1001: [h('2026-11-02T00:00:00Z', '10001', '3'),
      { created: '2026-11-08T00:00:00Z', items: [{ fieldId: 'customfield_1', from: null, fromString: null, to: '[10019]', toString: 'Impediment' }] }],
    // Selected 02/11 → In Progress 04/11 → Done 09/11: 2 dias em Selected, 5 em In Progress.
    1030: [h('2026-11-02T00:00:00Z', '10000', '10001'), h('2026-11-04T00:00:00Z', '10001', '3'), h('2026-11-09T00:00:00Z', '3', '10002')],
  };
  const bodies = [];
  const fake = fakeJira({ wip, done, histories, counts: {} });
  const request = async (path, init) => {
    if (path === '/rest/api/3/changelog/bulkfetch') bodies.push(JSON.parse(init.body));
    return fake.request(path, init);
  };
  const board = await readBoard(request, 1);
  const data = await loadBoardData(request, board, { doneWindowDays: 14, referenceDays: 30 });
  assert.deepEqual(bodies[0].fieldIds, ['status', 'customfield_1']);
  assert.equal(data.wip[0].flaggedSince.toISOString(), '2026-11-08T00:00:00.000Z');
  assert.deepEqual(data.done[0].timeInColumns, { 'Selected for Development': 2, 'In Progress': 5 });

  const v = buildBoardView(data, { ...DEPS, flowFindings }, NOW, 14, 30);
  assert.deepEqual(v.findings.map((f) => f.id), ['inflow', 'tail', 'above', 'blocks']);
  const blocks = v.findings.find((f) => f.id === 'blocks');
  assert.equal(blocks.fired, true); // bloqueado desde 08/11, há 6 dias
  assert.equal(blocks.items[0].key, 'FRI-1');
  assert.deepEqual(v.analysed, { done: 1, wip: 1, days: 30 });
});

test('sem flowFindings nas dependências, a vista não tem conclusões (compatível)', async () => {
  const { request } = fakeJira({ counts: {} });
  const v = buildBoardView(await loadBoardData(request, await readBoard(request, 1), { doneWindowDays: 14 }), DEPS, NOW, 14);
  assert.equal(v.findings, null);
});
