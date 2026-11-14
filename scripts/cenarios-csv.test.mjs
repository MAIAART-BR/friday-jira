// O validador contra o CSV simulado, com resultados esperados calculados à mão em cenarios-csv.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCsv, EXPECTED, NOW, SCENARIOS } from './cenarios-csv.mjs';
import { parseCsv, detectColumns, toCards, summarize } from './validar-csv.mjs';

const [header, ...data] = parseCsv(buildCsv());
const cols = detectColumns(header);
const { cards, badDates } = toCards(data, cols, false);
const s = summarize(cards, NOW, 14);
// Os IDs anonimizados seguem a ordem do ficheiro: CARTAO-001 = SCENARIOS[0], etc.
const original = (masked) => SCENARIOS[Number(masked.split('-')[1]) - 1][0];

test('lê todas as linhas, com BOM, CRLF, linha em branco, «;» e aspas no título', () => {
  assert.equal(data.length, EXPECTED.total);
  assert.equal(s.total, EXPECTED.total);
});

test('contagens por estado', () => {
  assert.equal(s.backlog, EXPECTED.backlog);
  assert.equal(s.wip, EXPECTED.wip);
  assert.equal(s.doneTotal, EXPECTED.doneTotal);
  assert.equal(s.doneRecent, EXPECTED.doneRecent);
});

test('bloqueados: «Yes», «true» e «1» contam; «0», «no» e concluídos não', () => {
  assert.equal(s.blocked, EXPECTED.blocked);
});

test('idade do trabalho em curso: mediana e P85', () => {
  assert.equal(Math.round(s.agingP50), EXPECTED.agingP50);
  assert.equal(Math.round(s.agingP85), EXPECTED.agingP85);
});

test('cycle time: sem início fica de fora; fim antes do início conta 0', () => {
  assert.equal(s.cycleCount, EXPECTED.cycleCount);
  assert.equal(Math.round(s.cycleP50), EXPECTED.cycleP50);
  assert.equal(Math.round(s.cycleP85), EXPECTED.cycleP85);
});

test('os mais antigos, pela ordem certa, incluindo datas dia/mês/ano', () => {
  assert.deepEqual(s.oldest.map((o) => original(o.key)), EXPECTED.oldestKeysInOrder);
});

test('a data ilegível é assinalada', () => {
  assert.equal(badDates, 1);
});

test('nada do original aparece no resultado', () => {
  const out = JSON.stringify(s);
  for (const word of ['Ana', 'Rui', 'Rita', 'Concluído', 'Backlog normal', 'W8', 'B1']) assert.ok(!out.includes(word), word);
});
