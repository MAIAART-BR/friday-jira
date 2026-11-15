// Corre o código do FRIDAY (o mesmo da app) sobre um quadro real do Jira e mostra o que a página vai dizer:
// os números, as conclusões e o guia. Só leituras. Ambiente: JIRA_SITE, JIRA_EMAIL, JIRA_TOKEN, PROJECT_KEY.

import { readBoard, loadBoardData, buildBoardView } from '../apps/friday-flow/src/board.js';
import { agingViews, referenceTimes, weeklyThroughput } from '../apps/friday-flow/src/core/metrics.js';
import { flowFindings } from '../apps/friday-flow/src/core/findings.js';

const site = (process.env.JIRA_SITE || '').trim().replace(/\/$/, '');
const base = /^https?:\/\//.test(site) ? site : `https://${site}`;
const auth = `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_TOKEN}`).toString('base64')}`;
const projectKey = (process.env.PROJECT_KEY || 'FRIBASE').toUpperCase();

// O mesmo contrato que o requestJira do Forge: caminho relativo, devolve { ok, status, json() }.
const request = (path, init = {}) => fetch(base + path, { ...init, headers: { Authorization: auth, Accept: 'application/json', ...(init.headers || {}) } });

async function main() {
  const boards = await (await request(`/rest/agile/1.0/board?projectKeyOrId=${projectKey}`)).json();
  const id = boards.values?.[0]?.id;
  if (!id) { console.error(`✗ O projeto ${projectKey} não tem quadro.`); process.exit(1); }
  const board = await readBoard(request, id);
  const data = await loadBoardData(request, board, { doneWindowDays: 14, referenceDays: 90 });
  const now = new Date();
  const v = buildBoardView(data, { agingViews, referenceTimes, weeklyThroughput, flowFindings }, now, 14, 90);
  console.log(`Quadro ${boards.values[0].name} · trabalho de «${v.workflow.start}» a «${v.workflow.end}»`);
  console.log(`Em curso ${v.kpis.wip} · Bloqueados ${v.kpis.blocked?.total ?? '–'} · Concluídos (14 dias) ${v.kpis.doneRecent} · Tempo habitual P85 ${v.reference.cycle.p85} dias (${v.reference.cycle.n} concluídos)`);
  console.log(`Histórico completo: ${v.ageFromHistory ? 'sim' : 'não'} · Backlog: ${v.backlogCount}`);
  for (const f of v.findings) {
    const state = f.fired ? 'APARECE' : f.unavailable ? 'sem campo Flagged' : f.enoughData ? 'dentro do habitual' : 'faltam dados';
    console.log(`\n[${state}] ${f.id}: ${JSON.stringify({ ...f.facts, histogram: undefined, weeks: f.facts.weeks?.map((w) => `${w.week} ${w.started}/${w.finished}`) })}`);
    for (const i of f.items.slice(0, 5)) console.log(`   ${i.key} ${i.summary} ${JSON.stringify({ dias: i.ageDays ?? i.days ?? i.blockedDays, coluna: i.column ?? i.waitColumn })}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
