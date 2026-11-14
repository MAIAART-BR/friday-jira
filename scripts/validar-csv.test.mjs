import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, detectColumns, parseDate, toCards, summarize, parseArgs } from './validar-csv.mjs';

const CSV = '﻿Card ID;Title;Owner;Created At;In Progress Date;Done Date;Is Blocked\n'
  + '101;"Segredo; com aspas ""x""";Maria Silva;2026-10-01 09:00:00;2026-10-05 10:00:00;;1\n'
  + '102;Outro segredo;João Costa;2026-10-02;2026-11-10;;0\n'
  + '103;Mais um;Maria Silva;2026-09-01;2026-09-10;2026-09-20;\n'
  + '104;Backlog;;2026-11-01;;;\n';

test('lê CSV com «;», aspas e BOM', () => {
  const rows = parseCsv(CSV);
  assert.equal(rows.length, 5);
  assert.equal(rows[0][0], 'Card ID');
  assert.equal(rows[1][1], 'Segredo; com aspas "x"');
});

test('deteta colunas pelo nome e aceita indicação explícita', () => {
  const [header] = parseCsv(CSV);
  const c = detectColumns(header);
  assert.deepEqual([c.id, c.created, c.start, c.done, c.owner, c.blocked], [0, 3, 4, 5, 2, 6]);
  assert.equal(detectColumns(header, { start: 'Created At' }).start, 3);
  assert.equal(detectColumns(header, { start: 'Não existe' }).start, -2);
});

test('datas ISO e dia/mês/ano', () => {
  assert.equal(parseDate('2026-10-05 10:00:00').getDate(), 5);
  assert.equal(parseDate('05/10/2026').getMonth(), 9);
  assert.equal(parseDate('10/05/2026', true).getMonth(), 9);
  assert.equal(parseDate('05.10.2026 14:30').getHours(), 14);
  assert.equal(parseDate(''), null);
  assert.equal(parseDate('ontem'), null);
});

test('anonimiza: sem títulos, IDs e nomes trocados', () => {
  const [header, ...data] = parseCsv(CSV);
  const { cards } = toCards(data, detectColumns(header), false);
  const out = JSON.stringify(cards);
  for (const secret of ['Segredo', 'Maria', 'João', '101', '102']) assert.ok(!out.includes(secret), secret);
  assert.deepEqual(cards.map((c) => [c.key, c.owner, c.category]), [
    ['CARTAO-001', 'Pessoa A', 'wip'], ['CARTAO-002', 'Pessoa B', 'wip'],
    ['CARTAO-003', 'Pessoa A', 'done'], ['CARTAO-004', null, 'backlog'],
  ]);
});

test('resumo: idade desde o início, cycle e lead time, bloqueados abertos', () => {
  const [header, ...data] = parseCsv(CSV);
  const { cards } = toCards(data, detectColumns(header), false);
  const s = summarize(cards, new Date(2026, 10, 14, 10, 0, 0), 14);
  assert.equal(s.wip, 2);
  assert.equal(s.backlog, 1);
  assert.equal(s.blocked, 1);
  assert.equal(Math.round(s.oldest[0].age), 40);
  assert.equal(s.oldest[0].key, 'CARTAO-001');
  assert.equal(Math.round(s.cycleP85), 10);
  assert.equal(Math.round(s.leadP85), 19);
});

test('argumentos', () => {
  const o = parseArgs(['x.csv', '--start', 'Início', '--us-dates', '--window', '7']);
  assert.deepEqual([o.file, o.cols.start, o.usDates, o.window], ['x.csv', 'Início', true, 7]);
});
