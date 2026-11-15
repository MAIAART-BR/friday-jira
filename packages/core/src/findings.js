// FRIDAY core: «O que os seus dados dizem». Lê o histórico de um quadro e devolve os padrões encontrados.
// Funções puras e determinísticas: os mesmos dados dão sempre o mesmo resultado. Nenhum texto aqui:
// o ecrã escreve as conclusões na língua do utilizador a partir dos factos devolvidos.
// Especificação: docs/specs/2026-11-15-o-que-os-seus-dados-dizem.md

import { percentile } from './metrics.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Limiares da primeira versão. São pontos de partida, a afinar com dados reais (backlog, item 3).
export const LIMITS = {
  // P1 — entra mais do que sai
  inflowWeeks: 4, // semanas completas analisadas
  inflowMinFinished: 8, // abaixo disto, poucos dados
  inflowRatio: 1.25, // começados ≥ 1,25 × concluídos
  inflowMinGap: 4, // e pelo menos 4 itens de diferença
  inflowMinWeeksAbove: 3, // em pelo menos 3 das 4 semanas começaram mais do que terminaram
  // P2 — cauda longa
  tailMinItems: 20,
  tailRatio: 4, // P95 ≥ 4 × P50
  tailSlowest: 5,
  tailMinMedianDays: 0.5, // uma mediana abaixo de meio dia não serve de comparação
  // P3 — acima do tempo habitual
  aboveMinItems: 10,
  // P4 — bloqueios longos
  blockedMinDays: 3,
};

const round1 = (x) => (x == null ? null : Math.round(x * 10) / 10);
const days = (from, to) => Math.max(0, (to.getTime() - from.getTime()) / DAY_MS);

function startOfWeekUTC(d) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return new Date(x.getTime() - ((x.getUTCDay() + 6) % 7) * DAY_MS);
}

/** As últimas `n` semanas completas (segunda a domingo, UTC), da mais antiga para a mais recente. */
export function lastFullWeeks(now, n) {
  const current = startOfWeekUTC(now);
  return Array.from({ length: n }, (_, k) => {
    const from = new Date(current.getTime() - (n - k) * 7 * DAY_MS);
    return { week: from.toISOString().slice(0, 10), from, to: new Date(from.getTime() + 7 * DAY_MS) };
  });
}

/**
 * P1. Entra mais trabalho do que sai.
 * Começados: entradas no trabalho em curso (startedAt dos concluídos, categoryChanged dos em curso).
 * Concluídos: doneAt. Um ticket que voltou ao backlog não conta como começado (limite conhecido).
 */
export function inflowOverOutflow(wip, done, now, L = LIMITS) {
  const weeks = lastFullWeeks(now, L.inflowWeeks);
  const from = weeks[0].from;
  const to = weeks[weeks.length - 1].to;
  const starts = [
    ...done.map((i) => i.startedAt),
    ...wip.map((i) => i.categoryChanged || null),
  ].filter((d) => d && d >= from && d < to);
  const ends = done.map((i) => i.doneAt).filter((d) => d && d >= from && d < to);
  const perWeek = weeks.map((w) => ({
    week: w.week,
    started: starts.filter((d) => d >= w.from && d < w.to).length,
    finished: ends.filter((d) => d >= w.from && d < w.to).length,
  }));
  const started = starts.length;
  const finished = ends.length;
  const weeksAbove = perWeek.filter((w) => w.started > w.finished).length;
  const enoughData = finished >= L.inflowMinFinished;
  const fired = enoughData
    && started >= L.inflowRatio * finished
    && started - finished >= L.inflowMinGap
    && weeksAbove >= L.inflowMinWeeksAbove;
  const items = wip
    .filter((i) => i.categoryChanged && i.categoryChanged >= from && i.categoryChanged < to)
    .map((i) => ({ key: i.key, summary: i.summary, column: i.column ?? null, ageDays: round1(days(i.categoryChanged, now)) }))
    .sort((a, b) => b.ageDays - a.ageDays);
  return { id: 'inflow', fired, enoughData, facts: { weeks: perWeek, started, finished, weeksAbove, gap: started - finished }, items };
}

/** Histograma simples para o ecrã: até `bins` classes de largura inteira em dias, a começar em 0. */
export function histogram(values, bins = 12) {
  if (!values.length) return { width: 1, counts: [] };
  const max = Math.max(...values);
  const width = Math.max(1, Math.ceil(max / bins));
  const counts = Array.from({ length: Math.min(bins, Math.floor(max / width) + 1) }, () => 0);
  for (const v of values) counts[Math.min(counts.length - 1, Math.floor(v / width))] += 1;
  return { width, counts };
}

/**
 * P2. Cauda longa no tempo de entrega (cycle time dos concluídos no período).
 * Onde esperaram: para os mais lentos, a coluna onde passaram mais tempo (`timeInColumns`, em dias, quando existe).
 */
export function longTail(done, now, windowDays, L = LIMITS) {
  const since = new Date(now.getTime() - windowDays * DAY_MS);
  const items = done
    .filter((i) => i.startedAt && i.doneAt && i.doneAt >= since && i.doneAt <= now)
    .map((i) => ({ ...i, cycle: days(i.startedAt, i.doneAt) }));
  const cycles = items.map((i) => i.cycle);
  const p50 = percentile(cycles, 50);
  const p85 = percentile(cycles, 85);
  const p95 = percentile(cycles, 95);
  const enoughData = items.length >= L.tailMinItems;
  const fired = enoughData && p50 != null && p95 >= L.tailRatio * Math.max(p50, L.tailMinMedianDays);

  const slowest = [...items].sort((a, b) => b.cycle - a.cycle).slice(0, L.tailSlowest).map((i) => {
    const spent = Object.entries(i.timeInColumns || {}).sort((a, b) => b[1] - a[1]);
    const top = spent[0] || null;
    return {
      key: i.key,
      summary: i.summary,
      days: round1(i.cycle),
      waitColumn: top ? top[0] : null,
      waitShare: top && i.cycle > 0 ? Math.min(1, top[1] / i.cycle) : null,
    };
  });
  // A coluna que mais se repete como «onde mais esperou» entre os mais lentos (desempate: mais tempo somado).
  const tally = new Map();
  for (const s of slowest) {
    if (!s.waitColumn) continue;
    const t = tally.get(s.waitColumn) || { count: 0, share: 0 };
    tally.set(s.waitColumn, { count: t.count + 1, share: t.share + (s.waitShare || 0) });
  }
  const best = [...tally.entries()].sort((a, b) => b[1].count - a[1].count || b[1].share - a[1].share)[0] || null;

  return {
    id: 'tail',
    fired,
    enoughData,
    facts: {
      n: items.length, p50: round1(p50), p85: round1(p85), p95: round1(p95),
      waitColumn: best ? best[0] : null,
      waitCount: best ? best[1].count : 0,
      slowestCount: slowest.length,
      histogram: histogram(cycles),
    },
    items: slowest,
  };
}

/** P3. Tickets em curso acima do tempo habitual (P85 do cycle time dos concluídos). */
export function aboveUsual(wip, now, reference, L = LIMITS) {
  const enoughData = Boolean(reference && reference.n >= L.aboveMinItems && reference.p85 != null);
  const items = enoughData
    ? wip
      .map((i) => ({ key: i.key, summary: i.summary, column: i.column ?? null, flagged: i.flagged, ageDays: days(i.categoryChanged || i.created, now) }))
      .filter((i) => i.ageDays > reference.p85)
      .sort((a, b) => b.ageDays - a.ageDays)
      .map((i) => ({ ...i, ageDays: round1(i.ageDays) }))
    : [];
  const byColumn = new Map();
  for (const i of items) byColumn.set(i.column, (byColumn.get(i.column) || 0) + 1);
  const top = [...byColumn.entries()].sort((a, b) => b[1] - a[1])[0] || null;
  return {
    id: 'above',
    fired: enoughData && items.length > 0,
    enoughData,
    facts: {
      count: items.length,
      limit: enoughData ? reference.p85 : null,
      oldest: items[0] ? { key: items[0].key, ageDays: items[0].ageDays } : null,
      // Só quando mais de metade está na mesma coluna é que vale a pena dizê-la.
      mainColumn: top && top[0] != null && top[1] > items.length / 2 ? top[0] : null,
      mainColumnCount: top ? top[1] : 0,
    },
    items,
  };
}

/** P4. Bloqueios que duram demais: tickets em curso com Flagged há `blockedMinDays` dias ou mais. */
export function longBlocks(wip, now, hasFlaggedField, L = LIMITS) {
  if (!hasFlaggedField) return { id: 'blocks', fired: false, enoughData: false, unavailable: true, facts: { count: 0 }, items: [] };
  const items = wip
    .filter((i) => i.flagged && i.flaggedSince)
    .map((i) => ({ key: i.key, summary: i.summary, column: i.column ?? null, blockedDays: days(i.flaggedSince, now) }))
    .filter((i) => i.blockedDays >= L.blockedMinDays)
    .sort((a, b) => b.blockedDays - a.blockedDays)
    .map((i) => ({ ...i, blockedDays: round1(i.blockedDays) }));
  const unknownSince = wip.filter((i) => i.flagged && !i.flaggedSince).length;
  return {
    id: 'blocks',
    fired: items.length > 0,
    enoughData: true,
    facts: { count: items.length, longest: items[0] ? { key: items[0].key, days: items[0].blockedDays } : null, unknownSince },
    items,
  };
}

/**
 * Os 4 padrões, por ordem: do sistema (tudo fica mais lento) para o ticket (este está parado).
 * Devolve todos os avaliados; o ecrã mostra os que dispararam e diz quais não tinham dados suficientes.
 */
export function flowFindings({ wip, done, reference, hasFlaggedField }, now = new Date(), windowDays = 90, L = LIMITS) {
  return [
    inflowOverOutflow(wip, done, now, L),
    longTail(done, now, windowDays, L),
    aboveUsual(wip, now, reference, L),
    longBlocks(wip, now, hasFlaggedField, L),
  ];
}

/**
 * Tempo passado em cada estado entre `from` e `to`, a partir do histórico de mudanças de estado do Jira.
 * Devolve { idDoEstado: dias }. Sem mudanças no período, todo o tempo vai para o estado de onde saiu a primeira mudança seguinte, ou fica vazio.
 */
export function timeInStatuses(histories, from, to) {
  if (!from || !to || to <= from) return {};
  const changes = [];
  for (const h of histories || []) {
    const t = new Date(h.created);
    if (Number.isNaN(t.getTime())) continue;
    for (const it of h.items || []) {
      if ((it.fieldId || it.field) === 'status') changes.push({ t, from: String(it.from), to: String(it.to) });
    }
  }
  changes.sort((a, b) => a.t - b.t);
  const out = {};
  const add = (status, a, b) => {
    const s = a < from ? from : a;
    const e = b > to ? to : b;
    if (e > s && status) out[status] = (out[status] || 0) + days(s, e);
  };
  // Estado no início do período: o destino da última mudança antes de `from`, ou a origem da primeira mudança depois.
  const before = changes.filter((c) => c.t <= from);
  let current = before.length ? before[before.length - 1].to : changes.find((c) => c.t > from)?.from ?? null;
  let since = from;
  for (const c of changes) {
    if (c.t <= from) continue;
    if (c.t >= to) break;
    add(current, since, c.t);
    current = c.to;
    since = c.t;
  }
  add(current, since, to);
  return out;
}

/** Desde quando o ticket está sinalizado (Flagged): a última vez que o campo passou de vazio a preenchido. */
export function flaggedSince(histories, flaggedFieldId) {
  if (!flaggedFieldId) return null;
  let latest = null;
  for (const h of histories || []) {
    const t = new Date(h.created);
    if (Number.isNaN(t.getTime())) continue;
    for (const it of h.items || []) {
      if ((it.fieldId || '') !== flaggedFieldId && it.field !== 'Flagged') continue;
      // «toString» é também um método de qualquer objeto: só conta quando é texto.
      const toText = typeof it.toString === 'string' ? it.toString : '';
      const wasEmpty = !it.from && !it.fromString;
      const isSet = Boolean(it.to || toText);
      if (wasEmpty && isSet && (!latest || t > latest)) latest = t;
    }
  }
  return latest;
}
