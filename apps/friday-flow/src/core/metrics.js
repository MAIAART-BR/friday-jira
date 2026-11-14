// GERADO por scripts/sync-core.mjs a partir de packages/core/src. Não editar aqui.
// FRIDAY core: métricas de fluxo calculadas a partir de issues do Jira.
// Funções puras, sem dependências, partilhadas por todos os módulos (apps Forge).
// Cada app recebe uma cópia em src/core/ (ver scripts/sync-core.mjs).

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Converte uma issue devolvida por /rest/api/3/search/jql num objeto simples.
 * @param {object} raw issue do Jira
 * @param {{flaggedFieldId?: string, siteUrl?: string}} opts
 */
export function normalizeIssue(raw, opts = {}) {
  const f = raw.fields || {};
  const flaggedValue = opts.flaggedFieldId ? f[opts.flaggedFieldId] : null;
  return {
    key: raw.key,
    summary: f.summary || '',
    // null = sem tipo / sem responsável. O texto a mostrar é escolhido no ecrã, na língua do utilizador.
    type: f.issuetype?.name || null,
    assignee: f.assignee?.displayName || null,
    status: f.status?.name || '',
    category: categoryOf(f.status?.statusCategory?.key),
    created: toDate(f.created),
    resolved: toDate(f.resolutiondate),
    categoryChanged: toDate(f.statuscategorychangedate),
    // Data de conclusão: a resolução, ou a entrada em «Feito» quando o fluxo não preenche a resolução.
    doneAt: categoryOf(f.status?.statusCategory?.key) === 'done'
      ? toDate(f.resolutiondate) || toDate(f.statuscategorychangedate)
      : null,
    flagged: Array.isArray(flaggedValue) ? flaggedValue.length > 0 : Boolean(flaggedValue),
    url: opts.siteUrl ? `${opts.siteUrl.replace(/\/$/, '')}/browse/${raw.key}` : null,
  };
}

// O Jira usa as chaves de categoria «new», «indeterminate» e «done».
function categoryOf(key) {
  if (key === 'done') return 'done';
  if (key === 'indeterminate') return 'wip';
  return 'backlog';
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function daysBetween(from, to) {
  if (!from || !to) return null;
  return Math.max(0, (to.getTime() - from.getTime()) / DAY_MS);
}

/**
 * Percentil pelo método do posto mais próximo (o mesmo do FRIDAY original).
 * Devolve null para listas vazias.
 */
export function percentile(values, p) {
  const v = values.filter((x) => typeof x === 'number' && !Number.isNaN(x)).sort((a, b) => a - b);
  if (v.length === 0) return null;
  if (p <= 0) return v[0];
  if (p >= 100) return v[v.length - 1];
  const rank = Math.ceil((p / 100) * v.length);
  return v[rank - 1];
}

/**
 * KPIs do estado atual.
 * «Concluído» conta só o que foi resolvido nos últimos `doneWindowDays` dias.
 */
export function currentState(issues, now = new Date(), { doneWindowDays = 14 } = {}) {
  const since = new Date(now.getTime() - doneWindowDays * DAY_MS);
  let backlog = 0;
  let wip = 0;
  let blocked = 0;
  let doneRecent = 0;
  for (const i of issues) {
    if (i.category === 'backlog') backlog += 1;
    else if (i.category === 'wip') wip += 1;
    else if (i.category === 'done' && i.doneAt && i.doneAt >= since) doneRecent += 1;
    if (i.flagged && i.category !== 'done') blocked += 1;
  }
  return { open: backlog + wip, backlog, wip, blocked, doneRecent, doneWindowDays };
}

/** Contagem por chave, ordenada por quantidade (desc), com «sem valor» (null) no fim dos empates e depois pelo nome. */
export function countBy(issues, keyFn) {
  const counts = new Map();
  for (const i of issues) {
    const k = keyFn(i) ?? null;
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count
      || (a.label === null) - (b.label === null)
      || String(a.label).localeCompare(String(b.label)));
}

/**
 * Idade do trabalho em curso: dias desde que a issue entrou na categoria «em curso».
 * Usa statuscategorychangedate; se faltar, usa a data de criação.
 */
export function wipAging(issues, now = new Date()) {
  return issues
    .filter((i) => i.category === 'wip')
    .map((i) => ({ ...i, ageDays: daysBetween(i.categoryChanged || i.created, now) }))
    .sort((a, b) => b.ageDays - a.ageDays);
}

/** Lead time (criação → conclusão) das issues concluídas, em dias. */
export function leadTimes(issues) {
  return issues
    .filter((i) => i.category === 'done' && i.created && i.doneAt)
    .map((i) => ({ key: i.key, days: daysBetween(i.created, i.doneAt) }));
}

/**
 * Throughput semanal (semanas a começar à segunda-feira, UTC), das mais antigas para as mais recentes.
 * Inclui semanas a zero para não esconder paragens.
 */
export function throughputByWeek(issues, now = new Date(), weeks = 12) {
  const start = startOfWeekUTC(now);
  const buckets = [];
  for (let w = weeks - 1; w >= 0; w -= 1) {
    const from = new Date(start.getTime() - w * 7 * DAY_MS);
    buckets.push({ week: from.toISOString().slice(0, 10), from, count: 0 });
  }
  for (const i of issues) {
    if (i.category !== 'done' || !i.doneAt) continue;
    for (let b = buckets.length - 1; b >= 0; b -= 1) {
      if (i.doneAt >= buckets[b].from) {
        if (b === buckets.length - 1 || i.doneAt < buckets[b + 1].from) buckets[b].count += 1;
        break;
      }
    }
  }
  return buckets.map(({ week, count }) => ({ week, count }));
}

function startOfWeekUTC(d) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = (x.getUTCDay() + 6) % 7; // segunda = 0
  return new Date(x.getTime() - dow * DAY_MS);
}

/**
 * Idade do trabalho em curso de duas formas, para o utilizador escolher:
 *   start   — desde a entrada em curso (categoryChanged), como o «Work Item Age» do The Kanban Guide;
 *   created — desde a criação, contando o tempo no backlog.
 * Cada uma com mediana, P85 e as `rows` linhas mais antigas.
 */
export function agingViews(wip, now = new Date(), rows = 25) {
  const round1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
  const view = (from) => {
    const aging = wip
      .map((i) => ({ ...i, ageDays: daysBetween(from(i), now) }))
      .sort((a, b) => b.ageDays - a.ageDays);
    const ages = aging.map((i) => i.ageDays);
    return {
      p50: round1(percentile(ages, 50)),
      p85: round1(percentile(ages, 85)),
      rows: aging.slice(0, rows).map((i) => ({
        key: i.key, summary: i.summary, assignee: i.assignee, status: i.status, ageDays: round1(i.ageDays), flagged: i.flagged,
      })),
    };
  };
  return {
    start: view((i) => i.categoryChanged || i.created),
    created: view((i) => i.created || i.categoryChanged),
  };
}
