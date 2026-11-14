import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeIssue, percentile, currentState, countBy, wipAging, leadTimes, throughputByWeek,
} from '../src/metrics.js';

const NOW = new Date('2026-11-14T12:00:00Z');

function issue(key, category, extra = {}) {
  return {
    key, summary: key, type: 'Story', assignee: 'Ana', status: '', category,
    created: new Date('2026-10-01T00:00:00Z'), resolved: null, categoryChanged: null, flagged: false, url: null,
    ...extra,
    doneAt: extra.doneAt ?? (category === 'done' ? extra.resolved ?? null : null),
  };
}

test('normalizeIssue mapeia categorias, flag e URL', () => {
  const raw = {
    key: 'FRI-1',
    fields: {
      summary: 'Login', issuetype: { name: 'Bug' }, assignee: null,
      status: { name: 'In Review', statusCategory: { key: 'indeterminate' } },
      created: '2026-11-01T10:00:00.000+0000', resolutiondate: null,
      statuscategorychangedate: '2026-11-10T10:00:00.000+0000',
      customfield_10021: [{ value: 'Impediment' }],
    },
  };
  const n = normalizeIssue(raw, { flaggedFieldId: 'customfield_10021', siteUrl: 'https://x.atlassian.net/' });
  assert.equal(n.category, 'wip');
  assert.equal(n.assignee, null);
  assert.equal(normalizeIssue({ key: 'A', fields: {} }).type, null);
  assert.equal(n.flagged, true);
  assert.equal(n.url, 'https://x.atlassian.net/browse/FRI-1');
  assert.equal(normalizeIssue({ key: 'A', fields: { status: { statusCategory: { key: 'new' } } } }).category, 'backlog');
  assert.equal(normalizeIssue({ key: 'A', fields: { customfield_1: [] } }, { flaggedFieldId: 'customfield_1' }).flagged, false);
});

test('conclusão sem resolução usa a entrada em Feito', () => {
  const base = { status: { name: 'Done', statusCategory: { key: 'done' } }, created: '2026-11-01T00:00:00.000+0000' };
  const semRes = normalizeIssue({ key: 'A', fields: { ...base, resolutiondate: null, statuscategorychangedate: '2026-11-10T00:00:00.000+0000' } });
  assert.equal(semRes.doneAt.toISOString(), '2026-11-10T00:00:00.000Z');
  const comRes = normalizeIssue({ key: 'B', fields: { ...base, resolutiondate: '2026-11-09T00:00:00.000+0000', statuscategorychangedate: '2026-11-10T00:00:00.000+0000' } });
  assert.equal(comRes.doneAt.toISOString(), '2026-11-09T00:00:00.000Z');
  const aberta = normalizeIssue({ key: 'C', fields: { ...base, status: { statusCategory: { key: 'indeterminate' } }, resolutiondate: '2026-11-09T00:00:00.000+0000' } });
  assert.equal(aberta.doneAt, null);
  assert.equal(currentState([semRes], new Date('2026-11-14T00:00:00Z')).doneRecent, 1);
});

test('percentil por posto mais próximo', () => {
  assert.equal(percentile([], 85), null);
  assert.equal(percentile([5], 85), 5);
  assert.equal(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 85), 9);
  assert.equal(percentile([10, 1, 5], 50), 5);
  assert.equal(percentile([1, 2, 3], 100), 3);
});

test('currentState conta backlog, WIP, bloqueados abertos e concluídos na janela', () => {
  const issues = [
    issue('A', 'backlog'),
    issue('B', 'wip', { flagged: true }),
    issue('C', 'wip'),
    issue('D', 'done', { resolved: new Date('2026-11-10T00:00:00Z'), flagged: true }),
    issue('E', 'done', { resolved: new Date('2026-10-01T00:00:00Z') }),
  ];
  assert.deepEqual(currentState(issues, NOW), {
    open: 3, backlog: 1, wip: 2, blocked: 1, doneRecent: 1, doneWindowDays: 14,
  });
});

test('countBy põe «sem valor» no fim dos empates', () => {
  const r = countBy([issue('A', 'wip', { assignee: null }), issue('B', 'wip', { assignee: 'Zé' }), issue('C', 'wip', { assignee: 'Ana' })], (i) => i.assignee);
  assert.deepEqual(r, [{ label: 'Ana', count: 1 }, { label: 'Zé', count: 1 }, { label: null, count: 1 }]);
});

test('countBy ordena por contagem e depois por nome', () => {
  const r = countBy([issue('A', 'wip', { type: 'Bug' }), issue('B', 'wip', { type: 'Story' }), issue('C', 'wip', { type: 'Bug' }), issue('D', 'wip', { type: 'Epic' })], (i) => i.type);
  assert.deepEqual(r, [{ label: 'Bug', count: 2 }, { label: 'Epic', count: 1 }, { label: 'Story', count: 1 }]);
});

test('wipAging usa a mudança de categoria e recorre à criação', () => {
  const r = wipAging([
    issue('A', 'wip', { categoryChanged: new Date('2026-11-13T12:00:00Z') }),
    issue('B', 'wip'),
    issue('C', 'backlog'),
  ], NOW);
  assert.deepEqual(r.map((x) => [x.key, Math.round(x.ageDays)]), [['B', 45], ['A', 1]]);
});

test('leadTimes só conta concluídas com as duas datas', () => {
  const r = leadTimes([
    issue('A', 'done', { resolved: new Date('2026-10-11T00:00:00Z') }),
    issue('B', 'done'),
    issue('C', 'wip'),
  ]);
  assert.deepEqual(r, [{ key: 'A', days: 10 }]);
});

test('throughputByWeek inclui semanas a zero e respeita os limites', () => {
  const r = throughputByWeek([
    issue('A', 'done', { resolved: new Date('2026-11-09T00:00:00Z') }), // segunda desta semana
    issue('B', 'done', { resolved: new Date('2026-11-08T23:59:59Z') }), // domingo da anterior
    issue('C', 'done', { resolved: new Date('2026-01-01T00:00:00Z') }), // fora da janela
  ], NOW, 3);
  assert.deepEqual(r, [
    { week: '2026-10-26', count: 0 },
    { week: '2026-11-02', count: 1 },
    { week: '2026-11-09', count: 1 },
  ]);
});

test('agingViews: idade desde a entrada em curso ou desde a criação, com ordem própria', async () => {
  const { agingViews } = await import('../src/metrics.js');
  const now = new Date('2026-11-14T00:00:00Z');
  const wip = [
    // A: criado há 60 dias, em curso há 2 · B: criado há 10, em curso há 9
    issue('A', 'wip', { created: new Date('2026-09-15T00:00:00Z'), categoryChanged: new Date('2026-11-12T00:00:00Z') }),
    issue('B', 'wip', { created: new Date('2026-11-04T00:00:00Z'), categoryChanged: new Date('2026-11-05T00:00:00Z') }),
  ];
  const v = agingViews(wip, now);
  assert.deepEqual(v.start.rows.map((r) => [r.key, r.ageDays]), [['B', 9], ['A', 2]]);
  assert.deepEqual(v.created.rows.map((r) => [r.key, r.ageDays]), [['A', 60], ['B', 10]]);
  assert.equal(v.start.p85, 9);
  assert.equal(v.created.p50, 10);
  assert.deepEqual(agingViews([], now).start, { p50: null, p85: null, rows: [] });
});
