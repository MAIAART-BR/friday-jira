import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plan, targetColumn, codeOf, weekStart, finished } from './base-friday-plano.mjs';
import { flowFindings, LIMITS } from '../packages/core/src/findings.js';
import { referenceTimes } from '../packages/core/src/metrics.js';

const T0 = Date.UTC(2026, 10, 16, 10); // segunda-feira, 16/11/2026, 10:00 UTC
const H = 3600000;
const DAY = 24 * H;

/** Simula o quadro no momento `now`: o que o FRIDAY veria, a partir do plano. */
function boardAt(now) {
  const items = plan(T0).filter((it) => it.create <= now);
  const wip = [];
  const done = [];
  for (const it of items) {
    const col = targetColumn(it, now);
    const startedAt = it.sel != null && it.sel <= now ? new Date(it.sel) : null;
    if (col === 3) {
      done.push({ key: it.code, summary: it.summary, startedAt, doneAt: new Date(it.done), timeInColumns: it.kind === 'tail' ? { 'Selected for Development': (it.prog - it.sel) / DAY, 'In Progress': (it.done - it.prog) / DAY } : { 'In Progress': (it.done - it.prog) / DAY } });
    } else if (col >= 1) {
      wip.push({ key: it.code, summary: it.summary, column: col === 1 ? 'Selected for Development' : 'In Progress', categoryChanged: startedAt, flagged: it.flag != null && it.flag <= now, flaggedSince: it.flag != null && it.flag <= now ? new Date(it.flag) : null });
    }
  }
  return { wip, done };
}

function firedAt(now) {
  const { wip, done } = boardAt(now);
  const reference = referenceTimes(done, new Date(now), 90).cycle;
  return Object.fromEntries(flowFindings({ wip, done, reference, hasFlaggedField: true }, new Date(now), 90).map((f) => [f.id, f.fired]));
}

test('o plano tem códigos únicos e resumos que se leem de volta', () => {
  const p = plan(T0);
  assert.equal(new Set(p.map((x) => x.code)).size, p.length);
  for (const it of p) assert.equal(codeOf(it.summary), it.code);
  assert.equal(codeOf('Outra coisa'), null);
});

test('as colunas avançam pela ordem e nunca recuam', () => {
  for (const it of plan(T0)) {
    let last = 0;
    for (let h = 0; h <= 40 * 24; h += 2) {
      const c = targetColumn(it, it.create + h * H);
      assert.ok(c >= last, `${it.code} recuou`);
      last = c;
    }
  }
});

test('ao fim de 5 dias já aparecem a cauda longa, os tickets acima do habitual e os bloqueios longos', () => {
  const f = firedAt(T0 + 5 * DAY);
  assert.equal(f.tail, true);
  assert.equal(f.above, true);
  assert.equal(f.blocks, true);
});

test('com 4 semanas completas de lotes semanais aparece também «entra mais do que sai»', () => {
  const wk = weekStart(new Date(T0)).getTime();
  const f = firedAt(wk + 5 * 7 * DAY + 12 * H); // segunda-feira depois da 4.ª semana completa
  assert.equal(f.inflow, true);
});

test('a rotina para ao fim do período', () => {
  assert.equal(finished(T0, T0 + 10 * DAY), false);
  assert.equal(finished(T0, T0 + 40 * DAY), true);
  assert.ok(LIMITS.tailMinItems <= 25);
});

test('JSON para o importador: histórico de colunas no passado, resolução nos concluídos, sinalizador', async () => {
  const { buildImport, jiraDate } = await import('./base-friday-json.mjs');
  const now = Date.UTC(2026, 10, 15, 12);
  const full = buildImport({ now, daysAgo: 45 });
  const issues = full.projects[0].issues;
  assert.ok(issues.length >= 50);
  const a01 = issues.find((i) => i.externalId === 'A01');
  assert.equal(a01.status, 'Done');
  assert.deepEqual(a01.history.map((h) => h.items[0].toString), ['Selected for Development', 'In Progress', 'Done']);
  assert.ok(a01.created < a01.history[0].created && a01.resolutionDate === a01.history[2].created);
  const b1 = issues.find((i) => i.externalId === 'B1');
  assert.ok(b1.history.some((h) => h.items[0].field === 'Flagged'));
  assert.equal(jiraDate(Date.UTC(2026, 0, 2, 3)), '2026-01-02T03:00:00.000+0000');
  const test5 = buildImport({ now, only: ['A01', 'A02', 'T1', 'G1', 'B1'] });
  assert.equal(test5.projects[0].issues.length, 5);
});
