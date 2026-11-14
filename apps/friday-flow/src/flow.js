// Monta os dados da página «FRIDAY Flow» a partir do que jira.js carregou e contou.
import { countBy, agingViews } from './core/metrics.js';

export const DONE_WINDOW_DAYS = 14;
const DAY_MS = 86400000;

/**
 * @param {{wip: object[], done: object[], backlogByType: {label: string, count: number}[] | null,
 *          blockedBacklog: number | null}} data
 */
export function buildFlowView({ wip, done, backlogByType, blockedBacklog }, now = new Date()) {
  const since = new Date(now.getTime() - DONE_WINDOW_DAYS * DAY_MS);
  const backlog = backlogByType ? backlogByType.reduce((s, r) => s + r.count, 0) : null;

  // Em aberto por tipo = em curso (carregados) + backlog (contado), somados por nome de tipo.
  const byTypeMap = new Map();
  for (const { label, count } of countBy(wip, (i) => i.type)) byTypeMap.set(label, count);
  for (const { label, count } of backlogByType || []) byTypeMap.set(label, (byTypeMap.get(label) || 0) + count);
  const byType = [...byTypeMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || (a.label === null) - (b.label === null) || String(a.label).localeCompare(String(b.label)));

  return {
    kpis: {
      open: backlog === null ? null : backlog + wip.length,
      backlog,
      wip: wip.length,
      // Bloqueados = em curso com flag + backlog com flag (decisão de 14/11/2026). Concluídos não contam.
      blocked: wip.filter((i) => i.flagged).length + (blockedBacklog ?? 0),
      doneRecent: done.filter((i) => i.doneAt && i.doneAt >= since).length,
      doneWindowDays: DONE_WINDOW_DAYS,
    },
    backlogUnavailable: backlog === null,
    // Sem a contagem do backlog, o gráfico só teria o trabalho em curso: melhor não o mostrar.
    byType: backlogByType ? byType : [],
    wipByAssignee: countBy(wip, (i) => i.assignee),
    aging: agingViews(wip, now),
    generatedAt: now.toISOString(),
  };
}

