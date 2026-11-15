// Base de demonstração do FRIDAY: que tickets existem e quando passa cada um de coluna.
// Funções puras: o mesmo t0 e a mesma hora dão sempre o mesmo resultado.
// Usada pelo modo de demonstração da app (buildDemoData) e pela base de teste no Jira (scripts/base-friday.mjs).
//
// O Jira não deixa recuar as datas do histórico, por isso a base é simulada em tempo real a partir de t0:
//   lote A (criado em t0)   → cauda longa, tickets acima do habitual e bloqueios longos, em cerca de 5 dias;
//   lotes semanais W1–W5    → começa mais do que termina (6 começados e 3 concluídos por semana), em 4 semanas completas.

const H = 60 * 60 * 1000;
const DAY = 24 * H;
export const DURATION_DAYS = 36; // depois disto a rotina não faz nada
export const LABEL = 'friday-base';

const TITLES = [
  'Update the pricing page', 'Fix SSO login error', 'Export monthly report to CSV', 'Review finance group permissions',
  'Move alerts to the new channel', 'Adjust public API limits', 'Build the billing dashboard', 'Translate welcome emails',
  'Remove obsolete form fields', 'Automate certificate renewal', 'Test the ERP integration', 'Document the release process',
];
const title = (code, i) => `${code} · ${TITLES[i % TITLES.length]}`;

/** Segunda-feira 00:00 UTC da semana de `d`. */
export function weekStart(d) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return new Date(x.getTime() - ((x.getUTCDay() + 6) % 7) * DAY);
}

/**
 * Todos os tickets da base, com as datas (ms) em que devem ser criados e entrar em cada coluna.
 * Colunas do quadro Kanban simples do Jira: 0 Backlog, 1 Selected for Development, 2 In Progress, 3 Done.
 *   create, sel, prog, done: ms ou null (null = nunca); flag: ms em que é sinalizado (nunca é retirado).
 */
export function plan(t0ms) {
  const items = [];
  const at = (h) => t0ms + h * H;
  // A-fast: 22 tickets rápidos, de 6 a 30 horas do início ao fim (mediana perto de meio dia).
  for (let i = 0; i < 22; i += 1) {
    const sel = at(1 + i * 0.9);
    const prog = sel + 0.5 * H;
    items.push({ code: `A${String(i + 1).padStart(2, '0')}`, kind: 'fast', create: t0ms, sel, prog, done: prog + (6 + ((i * 37) % 25)) * H, flag: null });
  }
  // A-tail: 3 tickets que esperam 3,3 a 4,3 dias em «Selected for Development» antes de avançar: a cauda e a coluna onde esperaram.
  for (let i = 0; i < 3; i += 1) {
    const sel = at(2 + i);
    const prog = sel + (80 + i * 12) * H;
    items.push({ code: `T${i + 1}`, kind: 'tail', create: t0ms, sel, prog, done: prog + 4 * H, flag: null });
  }
  // A-aging: 5 tickets que começam e nunca terminam: ficam acima do tempo habitual.
  for (let i = 0; i < 5; i += 1) {
    const sel = at(2 + i);
    items.push({ code: `G${i + 1}`, kind: 'aging', create: t0ms, sel, prog: sel + H, done: null, flag: null });
  }
  // A-blocked: 2 tickets bloqueados 3 horas depois de começarem, sem nunca serem desbloqueados.
  for (let i = 0; i < 2; i += 1) {
    items.push({ code: `B${i + 1}`, kind: 'blocked', create: t0ms, sel: at(1), prog: at(2), done: null, flag: at(3 + i) });
  }
  // Semanas 1 a 5 depois da semana de t0: 6 começados, 3 terminados no dia seguinte.
  const w0 = weekStart(new Date(t0ms)).getTime();
  for (let k = 1; k <= 5; k += 1) {
    const ws = w0 + k * 7 * DAY;
    for (let i = 0; i < 6; i += 1) {
      const create = ws + i * 20 * H;
      const sel = create + H;
      const prog = sel + H;
      items.push({ code: `W${k}-${i + 1}`, kind: 'weekly', create, sel, prog, done: i < 3 ? prog + 18 * H : null, flag: null });
    }
  }
  return items.map((it, n) => ({ ...it, summary: title(it.code, n) }));
}

/** Coluna em que o ticket deve estar no momento `now` (0 a 3). */
export function targetColumn(item, now) {
  if (item.done != null && now >= item.done) return 3;
  if (item.prog != null && now >= item.prog) return 2;
  if (item.sel != null && now >= item.sel) return 1;
  return 0;
}

/** O código do ticket a partir do resumo («A07 · …» → «A07»). */
export function codeOf(summary) {
  const m = /^([A-Z]\d+(?:-\d+)?) · /.exec(summary || '');
  return m ? m[1] : null;
}

export function finished(t0ms, now) {
  return now > t0ms + DURATION_DAYS * DAY;
}

export const DEMO_COLUMNS = ['Backlog', 'Selected for Development', 'In Progress', 'Done'];

/**
 * Os dados de um quadro de demonstração, no mesmo formato que loadBoardData devolve, para correrem pelo mesmo código.
 * A simulação começou há `daysAgo` dias: com 45, aparecem os 4 padrões.
 */
export function buildDemoData(now = new Date(), daysAgo = 45) {
  const nowMs = now.getTime();
  const t0 = nowMs - daysAgo * DAY;
  const items = plan(t0).filter((it) => it.create <= nowMs);
  const wip = [];
  const done = [];
  let backlog = 0;
  items.forEach((it, n) => {
    const col = targetColumn(it, nowMs);
    const key = `DEMO-${n + 1}`;
    const summary = it.summary.replace(/^[^·]+· /, '');
    const created = new Date(it.create);
    if (col === 0) { backlog += 1; return; }
    if (col === 3) {
      const timeInColumns = {
        [DEMO_COLUMNS[1]]: (it.prog - it.sel) / DAY,
        [DEMO_COLUMNS[2]]: (it.done - it.prog) / DAY,
      };
      done.push({
        key, summary, type: 'Task', assignee: null, status: DEMO_COLUMNS[3], category: 'done', created,
        resolved: new Date(it.done), categoryChanged: new Date(it.done), doneAt: new Date(it.done), startedAt: new Date(it.sel),
        flagged: false, url: null, timeInColumns,
      });
      return;
    }
    const flagged = it.flag != null && it.flag <= nowMs;
    wip.push({
      key, summary, type: 'Task', assignee: null, status: DEMO_COLUMNS[col], category: 'wip', created,
      resolved: null, categoryChanged: new Date(it.sel), doneAt: null, column: DEMO_COLUMNS[col],
      flagged, flaggedSince: flagged ? new Date(it.flag) : null, url: null,
    });
  });
  const count = (name) => wip.filter((i) => i.column === name).length;
  return {
    columns: [
      { name: DEMO_COLUMNS[0], category: 'backlog', max: null, hasStatuses: true, count: backlog + 12 },
      { name: DEMO_COLUMNS[1], category: 'wip', max: null, hasStatuses: true, count: count(DEMO_COLUMNS[1]) },
      { name: DEMO_COLUMNS[2], category: 'wip', max: 8, hasStatuses: true, count: count(DEMO_COLUMNS[2]) },
      { name: DEMO_COLUMNS[3], category: 'done', max: null, hasStatuses: true, count: null },
    ],
    workflow: { start: DEMO_COLUMNS[1], end: DEMO_COLUMNS[3], isDefault: true, overrideIgnored: false, columns: DEMO_COLUMNS },
    wip,
    ageFromHistory: true,
    done,
    blockedBacklog: 1,
    truncated: false,
    hasFlaggedField: true,
  };
}
