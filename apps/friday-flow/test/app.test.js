import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentStateJql, searchIssues, loadProjectIssues, findFlaggedFieldId, MAX_ISSUES } from '../src/jira.js';
import { buildFlowView } from '../src/flow.js';

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

test('JQL recusa chaves de projeto que não são chaves do Jira', () => {
  assert.match(currentStateJql('FRI', 14), /^project = "FRI" AND \(statusCategory != Done OR resolved >= -14d\)/);
  assert.throws(() => currentStateJql('FRI" OR 1=1', 14));
});

test('campo Flagged é encontrado pelo nome ou pelo tipo', async () => {
  const req = async () => response(200, [{ id: 'summary', custom: false, name: 'Summary' }, { id: 'customfield_10021', custom: true, name: 'Sinalizado', schema: { custom: 'com.atlassian.jira.plugin.system.customfieldtypes:flagged' } }]);
  assert.equal(await findFlaggedFieldId(req), 'customfield_10021');
  assert.equal(await findFlaggedFieldId(async () => response(403, {})), null);
});

test('paginação por nextPageToken e corte em MAX_ISSUES', async () => {
  const calls = [];
  const req = async (path, init) => {
    const body = JSON.parse(init.body);
    calls.push(body.nextPageToken || null);
    const start = calls.length * 100;
    return response(200, { issues: Array.from({ length: 100 }, (_, i) => rawIssue(start + i, 'new')), nextPageToken: `t${calls.length}`, isLast: false });
  };
  const r = await searchIssues(req, 'project = "FRI"', ['summary']);
  assert.equal(r.issues.length, MAX_ISSUES);
  assert.equal(r.truncated, true);
  assert.equal(calls[0], null);
  assert.equal(calls[1], 't1');
});

test('erro do Jira é propagado com o código', async () => {
  await assert.rejects(searchIssues(async () => response(400, { errorMessages: ['bad'] }), 'x', []), /Jira respondeu 400/);
});

test('do Jira à vista: KPIs, gráficos e envelhecimento', async () => {
  const req = async (path) => {
    if (path === '/rest/api/3/field') return response(200, [{ id: 'customfield_1', custom: true, name: 'Flagged' }]);
    return response(200, {
      isLast: true,
      issues: [
        rawIssue(1, 'new'),
        rawIssue(2, 'indeterminate', { customfield_1: [{ value: 'Impediment' }] }),
        rawIssue(3, 'indeterminate', { assignee: null, statuscategorychangedate: '2026-11-13T00:00:00.000+0000' }),
        rawIssue(4, 'done', { resolutiondate: '2026-11-12T00:00:00.000+0000' }),
      ],
    });
  };
  const { issues, truncated, hasFlaggedField } = await loadProjectIssues(req, { projectKey: 'FRI', doneWindowDays: 14 });
  assert.equal(truncated, false);
  assert.equal(hasFlaggedField, true);
  const v = buildFlowView(issues, new Date('2026-11-14T00:00:00Z'));
  assert.deepEqual(v.kpis, { open: 3, backlog: 1, wip: 2, blocked: 1, doneRecent: 1, doneWindowDays: 14 });
  assert.deepEqual(v.byType, [{ label: 'Story', count: 3 }]);
  assert.deepEqual(v.wipByAssignee, [{ label: 'Ana', count: 1 }, { label: 'Sem responsável', count: 1 }]);
  assert.deepEqual(v.oldestWip.map((r) => [r.key, r.ageDays, r.flagged]), [['FRI-2', 13, true], ['FRI-3', 1, false]]);
  assert.equal(v.agingP85, 13);
});
