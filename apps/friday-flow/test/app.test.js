import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jql, checkProjectKey, searchAll, countIssues, loadProjectData, findFlaggedFieldId, SAFETY_MAX } from '../src/jira.js';
import { buildFlowView } from '../src/flow.js';

const NOW = new Date('2026-11-14T00:00:00Z');

function response(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}

function rawIssue(n, statusKey, extra = {}) {
  return {
    key: `FRI-${n}`,
    fields: {
      summary: `Issue ${n}`, issuetype: { name: 'Story' }, assignee: { displayName: 'Ana' },
      status: { name: statusKey, statusCategory: { key: statusKey } },
      created: '2026-10-01T00:00:00.000+0000', resolutiondate: null, statuscategorychangedate: '2026-11-01T00:00:00.000+0000',
      ...extra,
    },
  };
}

/**
 * Jira simulado: responde por caminho e, nas pesquisas, pelo JQL.
 * `wip` e `done` são listas de issues; `backlog` é { idDoTipo: contagem }; `blockedBacklog` é um número.
 */
function fakeJira({ wip = [], done = [], backlog = {}, blockedBacklog = 0, failCount = false, flagged = true }) {
  const calls = [];
  const request = async (path, init) => {
    const body = init?.body ? JSON.parse(init.body) : null;
    calls.push({ path, jql: body?.jql });
    if (path === '/rest/api/3/field') return response(200, flagged ? [{ id: 'customfield_1', custom: true, name: 'Flagged' }] : []);
    if (path === '/rest/api/3/project/FRI') {
      return response(200, { issueTypes: [{ id: '1', name: 'Story' }, { id: '2', name: 'Bug' }, { id: '3', name: 'Sub-task', subtask: true }] });
    }
    if (path === '/rest/api/3/search/approximate-count') {
      if (failCount) return response(500, {});
      if (body.jql.includes('cf[1] is not EMPTY')) return response(200, { count: blockedBacklog });
      const type = /issuetype = (\d+)/.exec(body.jql)[1];
      return response(200, { count: backlog[type] || 0 });
    }
    if (path === '/rest/api/3/search/jql') {
      const all = body.jql.includes('"In Progress"') ? wip : done;
      const start = Number(body.nextPageToken || 0);
      const page = all.slice(start, start + body.maxResults);
      const next = start + body.maxResults;
      return response(200, { issues: page, isLast: next >= all.length, nextPageToken: String(next) });
    }
    return response(404, {});
  };
  return { request, calls };
}

test('JQL: chave validada, subtarefas excluídas, campo Flagged por número', () => {
  assert.throws(() => checkProjectKey('FRI" OR 1=1'));
  assert.match(jql.wip('FRI'), /statusCategory = "In Progress" AND issuetype not in subTaskIssueTypes\(\)/);
  assert.match(jql.done('FRI', 14), /statusCategory = Done AND updated >= -14d AND issuetype not in subTaskIssueTypes\(\)/);
  assert.equal(jql.backlogOfType('FRI', '10001'), 'project = "FRI" AND statusCategory = "To Do" AND issuetype = 10001');
  assert.match(jql.blockedBacklog('FRI', 'customfield_10021'), /cf\[10021\] is not EMPTY/);
  assert.throws(() => jql.blockedBacklog('FRI', 'summary'));
});

test('campo Flagged é encontrado pelo nome ou pelo tipo', async () => {
  const req = async () => response(200, [{ id: 'summary', custom: false, name: 'Summary' }, { id: 'customfield_10021', custom: true, name: 'Sinalizado', schema: { custom: 'com.atlassian.jira.plugin.system.customfieldtypes:flagged' } }]);
  assert.equal(await findFlaggedFieldId(req), 'customfield_10021');
  assert.equal(await findFlaggedFieldId(async () => response(403, {})), null);
});

test('defeito dos 1000: um backlog grande e recente já não esconde o trabalho em curso', async () => {
  const wip = [
    rawIssue(1, 'indeterminate', { customfield_1: [{ value: 'Impediment' }] }),
    rawIssue(2, 'indeterminate', { assignee: null, issuetype: { name: 'Bug' } }),
    ...Array.from({ length: 5 }, (_, i) => rawIssue(10 + i, 'indeterminate')),
  ];
  const done = [
    rawIssue(20, 'done', { resolutiondate: '2026-11-12T00:00:00.000+0000' }),
    rawIssue(21, 'done', { resolutiondate: null, statuscategorychangedate: '2026-11-13T00:00:00.000+0000' }),
    rawIssue(22, 'done', { resolutiondate: null, statuscategorychangedate: '2026-10-01T00:00:00.000+0000' }),
  ];
  const { request } = fakeJira({ wip, done, backlog: { 1: 1003, 2: 1 }, blockedBacklog: 1 });
  const data = await loadProjectData(request, { projectKey: 'FRI', doneWindowDays: 14 });
  const v = buildFlowView(data, NOW);
  assert.deepEqual(v.kpis, { open: 1011, backlog: 1004, wip: 7, blocked: 2, doneRecent: 2, doneWindowDays: 14 });
  assert.deepEqual(v.byType, [{ label: 'Story', count: 1009 }, { label: 'Bug', count: 2 }]);
  assert.deepEqual(v.wipByAssignee, [{ label: 'Ana', count: 6 }, { label: null, count: 1 }]);
  assert.equal(v.oldestWip.length, 7);
  assert.equal(v.backlogUnavailable, false);
  assert.equal(data.truncated, false);
});

test('todo o trabalho em curso é carregado, em várias páginas', async () => {
  const wip = Array.from({ length: 250 }, (_, i) => rawIssue(i, 'indeterminate'));
  const { request, calls } = fakeJira({ wip });
  const data = await loadProjectData(request, { projectKey: 'FRI', doneWindowDays: 14 });
  assert.equal(data.wip.length, 250);
  assert.equal(calls.filter((c) => c.jql?.includes('"In Progress"')).length, 3);
});

test('limite de segurança só acima de SAFETY_MAX', async () => {
  const wip = Array.from({ length: SAFETY_MAX + 50 }, (_, i) => rawIssue(i, 'indeterminate'));
  const { request } = fakeJira({ wip });
  const r = await searchAll(request, jql.wip('FRI'), ['summary']);
  assert.equal(r.issues.length, SAFETY_MAX);
  assert.equal(r.truncated, true);
});

test('se a contagem do backlog falhar, mostra «–» em vez de um número errado', async () => {
  const { request } = fakeJira({ wip: [rawIssue(1, 'indeterminate')], failCount: true });
  const v = buildFlowView(await loadProjectData(request, { projectKey: 'FRI', doneWindowDays: 14 }), NOW);
  assert.equal(v.kpis.backlog, null);
  assert.equal(v.kpis.open, null);
  assert.equal(v.kpis.wip, 1);
  assert.equal(v.backlogUnavailable, true);
  assert.deepEqual(v.byType, []);
});

test('sem campo Flagged, não pede a contagem de bloqueados', async () => {
  const { request, calls } = fakeJira({ flagged: false, backlog: { 1: 2 } });
  const data = await loadProjectData(request, { projectKey: 'FRI', doneWindowDays: 14 });
  assert.equal(data.hasFlaggedField, false);
  assert.equal(data.blockedBacklog, 0);
  assert.ok(!calls.some((c) => c.jql?.includes('is not EMPTY')));
});

test('countIssues devolve null quando o Jira falha', async () => {
  assert.equal(await countIssues(async () => response(400, {}), 'x'), null);
  assert.equal(await countIssues(async () => response(200, { count: 7 }), 'x'), 7);
});

test('erro na pesquisa é propagado com o código', async () => {
  await assert.rejects(searchAll(async () => response(400, { errorMessages: ['bad'] }), 'x', []), /Jira respondeu 400/);
});
