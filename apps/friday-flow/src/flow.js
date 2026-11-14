// Monta os dados da página «FRIDAY Flow» a partir das issues normalizadas.
import { currentState, countBy, wipAging, percentile } from './core/metrics.js';

export const DONE_WINDOW_DAYS = 14;
const AGING_ROWS = 25;

export function buildFlowView(issues, now = new Date()) {
  const open = issues.filter((i) => i.category !== 'done');
  const wip = issues.filter((i) => i.category === 'wip');
  const aging = wipAging(issues, now);
  const ages = aging.map((i) => i.ageDays);
  return {
    kpis: currentState(issues, now, { doneWindowDays: DONE_WINDOW_DAYS }),
    byType: countBy(open, (i) => i.type),
    wipByAssignee: countBy(wip, (i) => i.assignee),
    agingP50: round1(percentile(ages, 50)),
    agingP85: round1(percentile(ages, 85)),
    oldestWip: aging.slice(0, AGING_ROWS).map((i) => ({
      key: i.key,
      summary: i.summary,
      assignee: i.assignee,
      status: i.status,
      ageDays: round1(i.ageDays),
      flagged: i.flagged,
      url: i.url,
    })),
    generatedAt: now.toISOString(),
  };
}

function round1(x) {
  return x == null ? null : Math.round(x * 10) / 10;
}
