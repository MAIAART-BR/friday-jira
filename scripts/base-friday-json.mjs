// Gera a base de teste do FRIDAY como ficheiro JSON para o importador do Jira
// (Definições → Sistema → Importação de sistema externo → JSON), com o histórico de colunas já no passado.
//
//   node scripts/base-friday-json.mjs <pasta> [--key FRIBASE]
//
// Cria dois ficheiros:
//   base-teste.json   5 tickets, para confirmar primeiro que o Jira guarda as datas do histórico;
//   base-resto.json   o resto da base (cerca de 6 semanas), que faz aparecer os 4 padrões logo à primeira.
// Os 4 padrões aparecem até cerca de uma semana depois de gerar os ficheiros: gere-os no dia em que vai importar.
//
// O plano é o mesmo da simulação em tempo real (scripts/base-friday-plano.mjs), deslocado para o passado.
// O CSV não serve: só guarda a criação e a resolução, não as mudanças de coluna, e é delas que o FRIDAY lê o início.
//
// ATENÇÃO (15/11/2026): no site de teste do Artur a opção de importar JSON não existe. Usar o modo de demonstração
// da app ou a base em tempo real (scripts/base-friday.mjs, projeto FRIBASE). Este gerador fica para sites que a tenham.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { plan, targetColumn, LABEL } from './base-friday-plano.mjs';

const COLUMNS = ['Backlog', 'Selected for Development', 'In Progress', 'Done'];
const DAY = 24 * 60 * 60 * 1000;

/** Data no formato que o importador aceita: 2026-10-01T10:00:00.000+0000. */
export function jiraDate(ms) {
  return new Date(ms).toISOString().replace('Z', '+0000');
}

/** Um ticket do plano, como ficaria em `now`, com o histórico das mudanças de coluna e do sinalizador. */
export function toImportIssue(item, now) {
  const col = targetColumn(item, now);
  const history = [];
  const steps = [['sel', 1], ['prog', 2], ['done', 3]];
  let from = 0;
  for (const [field, to] of steps) {
    if (item[field] != null && item[field] <= now) {
      history.push({
        created: jiraDate(item[field]),
        items: [{ fieldType: 'jira', field: 'status', fromString: COLUMNS[from], toString: COLUMNS[to] }],
      });
      from = to;
    }
  }
  const flagged = item.flag != null && item.flag <= now;
  if (flagged) {
    history.push({
      created: jiraDate(item.flag),
      items: [{ fieldType: 'custom', field: 'Flagged', fromString: '', toString: 'Impediment' }],
    });
  }
  history.sort((a, b) => a.created.localeCompare(b.created));
  const lastChange = history.length ? history[history.length - 1].created : jiraDate(item.create);
  const issue = {
    externalId: item.code,
    summary: item.summary,
    issueType: 'Task',
    status: COLUMNS[col],
    labels: [LABEL],
    created: jiraDate(item.create),
    updated: lastChange,
    history,
  };
  if (col === 3) {
    issue.resolution = 'Done';
    issue.resolutionDate = jiraDate(item.done);
  }
  if (flagged) issue.customFieldValues = [{ fieldName: 'Flagged', fieldType: 'com.atlassian.jira.plugin.system.customfieldtypes:multicheckboxes', value: ['Impediment'] }];
  return issue;
}

/** A base no formato do importador. `daysAgo`: há quantos dias começou a simulação. */
export function buildImport({ key = 'FRIBASE', now = Date.now(), daysAgo = 45, only = null } = {}) {
  const t0 = now - daysAgo * DAY;
  let items = plan(t0).filter((it) => it.create <= now);
  if (only) items = items.filter((it) => only.includes(it.code));
  return {
    projects: [{
      name: 'FRIDAY Base',
      key,
      type: 'software',
      issues: items.map((it) => toImportIssue(it, now)),
    }],
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2];
  if (!dir) {
    console.error('Uso: node scripts/base-friday-json.mjs <pasta> [--key FRIBASE]');
    process.exit(1);
  }
  const k = process.argv.indexOf('--key');
  const key = k > 0 ? process.argv[k + 1] : 'FRIBASE';
  mkdirSync(dir, { recursive: true });
  const TEST = ['A01', 'A02', 'T1', 'G1', 'B1'];
  const now = Date.now();
  const test = buildImport({ key, now, only: TEST });
  const full = buildImport({ key, now });
  const rest = { projects: [{ ...full.projects[0], issues: full.projects[0].issues.filter((i) => !TEST.includes(i.externalId)) }] };
  writeFileSync(join(dir, 'base-teste.json'), JSON.stringify(test, null, 2));
  writeFileSync(join(dir, 'base-resto.json'), JSON.stringify(rest, null, 2));
  console.log(`✓ base-teste.json: ${test.projects[0].issues.length} tickets (importar primeiro)`);
  console.log(`✓ base-resto.json: ${rest.projects[0].issues.length} tickets (importar depois, se o teste correr bem)`);
}
