import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MESSAGES, languageOf, messagesFor, roundDays, daysCell } from '../src/frontend/i18n.js';

test('a língua vem do locale do Jira; tudo o que não é português fica em inglês', () => {
  assert.equal(languageOf('pt_PT'), 'pt');
  assert.equal(languageOf('pt_BR'), 'pt');
  assert.equal(languageOf('pt-BR'), 'pt');
  assert.equal(languageOf('en_US'), 'en');
  assert.equal(languageOf('fr_FR'), 'en');
  assert.equal(languageOf(undefined), 'en');
  assert.equal(languageOf('ptx'), 'en');
});

test('as duas línguas têm exatamente as mesmas chaves', () => {
  const keys = (o) => Object.keys(o).sort();
  assert.deepEqual(keys(MESSAGES.pt), keys(MESSAGES.en));
  assert.deepEqual(keys(MESSAGES.pt.errors), keys(MESSAGES.en.errors));
  for (const k of Object.keys(MESSAGES.en)) assert.equal(typeof MESSAGES.pt[k], typeof MESSAGES.en[k], k);
});

test('dias por extenso, com singular e «menos de 1»', () => {
  const pt = messagesFor('pt_PT');
  const en = messagesFor('en_US');
  assert.equal(pt.days(roundDays(0.3)), 'menos de 1 dia');
  assert.equal(pt.days(roundDays(1.2)), '1 dia');
  assert.equal(pt.days(roundDays(12.6)), '13 dias');
  assert.equal(en.days(roundDays(0.3)), 'less than 1 day');
  assert.equal(en.days(roundDays(1)), '1 day');
  assert.equal(en.days(roundDays(4.4)), '4 days');
  assert.equal(en.days(null), '–');
});

test('célula da tabela compacta', () => {
  assert.equal(daysCell(0.2), '< 1');
  assert.equal(daysCell(3.6), '4');
  assert.equal(daysCell(null), '–');
});
