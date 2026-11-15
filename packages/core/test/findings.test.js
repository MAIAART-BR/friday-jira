import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LIMITS, lastFullWeeks, inflowOverOutflow, longTail, aboveUsual, longBlocks, flowFindings,
  histogram, timeInStatuses, flaggedSince,
} from '../src/findings.js';

// Domingo, 15/11/2026: as 4 semanas completas vão de 19/10 a 15/11 (segundas 19/10, 26/10, 02/11, 09/11).
const NOW = new Date('2026-11-15T12:00:00Z');
const DAY = 86400000;
const ago = (d) => new Date(NOW.getTime() - d * DAY);
const at = (iso) => new Date(`${iso}T10:00:00Z`);

test('últimas semanas completas: segunda a domingo, sem a semana corrente', () => {
  const w = lastFullWeeks(NOW, 4);
  assert.deepEqual(w.map((x) => x.week), ['2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02']);
  // 15/11 é domingo: a semana de 09/11 ainda é a corrente.
});

// ---------- P1: entra mais do que sai ----------
function flow(startsPerWeek, endsPerWeek) {
  const weeks = lastFullWeeks(NOW, 4);
  const done = [];
  const wip = [];
  weeks.forEach((w, k) => {
    for (let j = 0; j < endsPerWeek[k]; j += 1) {
      done.push({ key: `D-${k}-${j}`, startedAt: new Date(w.from.getTime() - 100 * DAY), doneAt: new Date(w.from.getTime() + DAY) });
    }
    for (let j = 0; j < startsPerWeek[k]; j += 1) {
      wip.push({ key: `W-${k}-${j}`, summary: 's', column: 'Doing', categoryChanged: new Date(w.from.getTime() + 2 * DAY) });
    }
  });
  return { wip, done };
}

test('P1 dispara: começam muito mais do que terminam, 3+ semanas seguidas', () => {
  const { wip, done } = flow([3, 4, 4, 4], [2, 2, 2, 3]);
  const r = inflowOverOutflow(wip, done, NOW);
  assert.equal(r.fired, true);
  assert.deepEqual([r.facts.started, r.facts.finished, r.facts.weeksAbove, r.facts.gap], [15, 9, 4, 6]);
  assert.equal(r.items.length, 15);
});

test('P1 não dispara com poucas conclusões (menos de 8)', () => {
  const { wip, done } = flow([5, 5, 5, 5], [1, 1, 2, 2]);
  const r = inflowOverOutflow(wip, done, NOW);
  assert.equal(r.enoughData, false);
  assert.equal(r.fired, false);
});

test('P1 não dispara quando a diferença é pequena ou só numa semana', () => {
  assert.equal(inflowOverOutflow(...Object.values(flow([3, 3, 3, 3], [3, 3, 2, 2])), NOW).fired, false); // 12 vs 10
  assert.equal(inflowOverOutflow(...Object.values(flow([12, 2, 2, 2], [3, 3, 3, 3])), NOW).fired, false); // só 1 semana acima
});

test('P1 conta os inícios dos concluídos e ignora os que começaram fora do período', () => {
  const weeks = lastFullWeeks(NOW, 4);
  const done = Array.from({ length: 8 }, (_, j) => ({ key: `D${j}`, startedAt: new Date(weeks[1].from.getTime() + DAY), doneAt: new Date(weeks[3].from.getTime() + DAY) }));
  const wip = [{ key: 'OLD', categoryChanged: ago(200) }];
  const r = inflowOverOutflow(wip, done, NOW);
  assert.equal(r.facts.started, 8);
  assert.equal(r.facts.finished, 8);
  assert.equal(r.items.length, 0);
});

// ---------- P2: cauda longa ----------
function doneWithCycles(cycles, extra = () => ({})) {
  return cycles.map((c, k) => ({ key: `T-${k}`, summary: `s${k}`, startedAt: ago(c + 1), doneAt: ago(1), ...extra(k, c) }));
}

test('P2 dispara: P95 pelo menos 4 vezes a mediana, com 20+ concluídos', () => {
  const cycles = [...Array(18).fill(3), 40, 60];
  const done = doneWithCycles(cycles, (k) => (k >= 18 ? { timeInColumns: { 'À espera de QA': 30, Doing: 5 } } : {}));
  const r = longTail(done, NOW, 90);
  assert.equal(r.fired, true);
  assert.equal(r.facts.n, 20);
  assert.equal(r.facts.p50, 3);
  assert.equal(r.facts.p95, 40);
  assert.equal(r.items[0].key, 'T-19');
  assert.equal(r.items[0].waitColumn, 'À espera de QA');
  assert.equal(r.facts.waitColumn, 'À espera de QA');
  assert.equal(r.facts.waitCount, 2);
});

test('P2 não dispara com menos de 20 concluídos nem com uma distribuição sem cauda', () => {
  assert.equal(longTail(doneWithCycles([...Array(17).fill(3), 40, 60]), NOW, 90).fired, false);
  assert.equal(longTail(doneWithCycles(Array.from({ length: 30 }, (_, k) => 5 + (k % 5))), NOW, 90).fired, false);
});

test('P2 ignora concluídos fora do período e sem início', () => {
  const done = [...doneWithCycles(Array(20).fill(2)), { key: 'X', doneAt: ago(1) }, { key: 'Y', startedAt: ago(400), doneAt: ago(300) }];
  assert.equal(longTail(done, NOW, 90).facts.n, 20);
});

test('P2 com mediana quase zero: compara com meio dia, não com zero', () => {
  const r = longTail(doneWithCycles([...Array(19).fill(0.1), 1]), NOW, 90);
  assert.equal(r.fired, false); // P95 = 0,1 < 4 × 0,5
});

// ---------- P3: acima do habitual ----------
test('P3 dispara e diz a coluna quando mais de metade está nela', () => {
  const wip = [
    { key: 'A', categoryChanged: ago(30), column: 'Review' },
    { key: 'B', categoryChanged: ago(20), column: 'Review' },
    { key: 'C', categoryChanged: ago(15), column: 'Doing' },
    { key: 'D', categoryChanged: ago(2), column: 'Doing' },
  ];
  const r = aboveUsual(wip, NOW, { n: 12, p85: 10 });
  assert.equal(r.fired, true);
  assert.deepEqual(r.items.map((i) => i.key), ['A', 'B', 'C']);
  assert.equal(r.facts.mainColumn, 'Review');
  assert.equal(r.facts.oldest.key, 'A');
});

test('P3 não diz coluna quando não há maioria, e não avalia com menos de 10 concluídos', () => {
  const wip = [{ key: 'A', categoryChanged: ago(30), column: 'Review' }, { key: 'C', categoryChanged: ago(15), column: 'Doing' }];
  assert.equal(aboveUsual(wip, NOW, { n: 12, p85: 10 }).facts.mainColumn, null);
  const few = aboveUsual(wip, NOW, { n: 9, p85: 10 });
  assert.equal(few.enoughData, false);
  assert.equal(few.fired, false);
});

// ---------- P4: bloqueios longos ----------
test('P4 dispara com bloqueios de 3 dias ou mais; conta os que não têm data', () => {
  const wip = [
    { key: 'A', flagged: true, flaggedSince: ago(5) },
    { key: 'B', flagged: true, flaggedSince: ago(1) },
    { key: 'C', flagged: true, flaggedSince: null },
    { key: 'D', flagged: false },
  ];
  const r = longBlocks(wip, NOW, true);
  assert.equal(r.fired, true);
  assert.deepEqual(r.items.map((i) => i.key), ['A']);
  assert.equal(r.facts.unknownSince, 1);
});

test('P4 sem campo Flagged no site: não avaliado', () => {
  const r = longBlocks([{ key: 'A', flagged: true, flaggedSince: ago(9) }], NOW, false);
  assert.equal(r.unavailable, true);
  assert.equal(r.fired, false);
});

test('flowFindings devolve os 4 padrões pela ordem combinada', () => {
  const r = flowFindings({ wip: [], done: [], reference: { n: 0 }, hasFlaggedField: true }, NOW, 90);
  assert.deepEqual(r.map((f) => f.id), ['inflow', 'tail', 'above', 'blocks']);
  assert.ok(r.every((f) => f.fired === false));
});

test('os limiares estão num só sítio', () => {
  assert.equal(LIMITS.blockedMinDays, 3);
  assert.equal(LIMITS.tailRatio, 4);
});

// ---------- auxiliares ----------
test('histograma: classes inteiras a partir de 0, até 12', () => {
  assert.deepEqual(histogram([0, 1, 2, 11.5], 12), { width: 1, counts: [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1] });
  const h = histogram([1, 50, 100], 10);
  assert.equal(h.width, 10);
  assert.equal(h.counts.reduce((a, b) => a + b), 3);
  assert.deepEqual(histogram([]), { width: 1, counts: [] });
});

test('tempo em cada estado entre o início e o fim, a partir das mudanças', () => {
  const histories = [
    { created: '2026-11-01T10:00:00Z', items: [{ fieldId: 'status', from: '1', to: '2' }] },
    { created: '2026-11-03T10:00:00Z', items: [{ fieldId: 'status', from: '2', to: '3' }] },
    { created: '2026-11-08T10:00:00Z', items: [{ fieldId: 'status', from: '3', to: '4' }, { fieldId: 'assignee', from: 'a', to: 'b' }] },
  ];
  const r = timeInStatuses(histories, at('2026-11-01'), at('2026-11-10'));
  assert.deepEqual(r, { 2: 2, 3: 5, 4: 2 });
  assert.deepEqual(timeInStatuses(histories, null, at('2026-11-10')), {});
});

test('desde quando está bloqueado: a última passagem de vazio a preenchido', () => {
  const h = [
    { created: '2026-11-01T10:00:00Z', items: [{ fieldId: 'customfield_10021', from: null, fromString: null, to: '[10019]', toString: 'Impediment' }] },
    { created: '2026-11-03T10:00:00Z', items: [{ fieldId: 'customfield_10021', from: '[10019]', fromString: 'Impediment', to: null, toString: null }] },
    { created: '2026-11-05T10:00:00Z', items: [{ fieldId: 'customfield_10021', from: null, fromString: null, to: '[10019]', toString: 'Impediment' }] },
  ];
  assert.deepEqual(flaggedSince(h, 'customfield_10021'), new Date('2026-11-05T10:00:00Z'));
  assert.equal(flaggedSince(h, null), null);
  // Uma remoção (para vazio) não conta como início, mesmo com «toString» herdado.
  assert.equal(flaggedSince([{ created: '2026-11-05T10:00:00Z', items: [{ fieldId: 'customfield_10021', from: '[1]', to: null }] }], 'customfield_10021'), null);
});

test('modo de demonstração: os dados disparam os 4 padrões', async () => {
  const { buildDemoData } = await import('../src/demo.js');
  const { referenceTimes } = await import('../src/metrics.js');
  const now = new Date('2026-11-18T10:00:00Z');
  const data = buildDemoData(now);
  const reference = referenceTimes(data.done, now, 90).cycle;
  const r = flowFindings({ wip: data.wip, done: data.done, reference, hasFlaggedField: true }, now, 90);
  assert.deepEqual(r.map((f) => [f.id, f.fired]), [['inflow', true], ['tail', true], ['above', true], ['blocks', true]]);
  assert.ok(data.wip.every((i) => i.key.startsWith('DEMO-')));
  assert.equal(r[1].facts.waitColumn, 'Selected for Development');
});
