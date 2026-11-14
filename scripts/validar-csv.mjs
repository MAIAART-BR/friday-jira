// Valida os cálculos do FRIDAY contra uma exportação CSV (por exemplo, do BusinessMap), sem os dados saírem do computador.
//
// Uso:  node scripts/validar-csv.mjs caminho/para/export.csv [opções]
//
// Anonimização: só lê o ID, as datas, o responsável e o bloqueio. Nunca lê títulos nem descrições.
// Os IDs aparecem como CARTAO-001… e os responsáveis como Pessoa A, Pessoa B…
// O resultado são números agregados; não grava nada em disco.
//
// Classificação, pelas datas (não pelos nomes das colunas do quadro):
//   tem data de fim                → concluído
//   tem data de início, sem fim    → em curso (a idade conta desde o início)
//   sem início nem fim             → backlog
//
// Opções (só se a deteção automática das colunas falhar; usar o nome exato do cabeçalho):
//   --id "Card ID" --created "Created At" --start "In Progress Date" --done "Done Date"
//   --owner "Owner" --blocked "Is Blocked"
//   --us-dates      datas no formato mês/dia/ano (por omissão: dia/mês/ano)
//   --now 2026-11-14   data de referência para a idade (por omissão: hoje)
//   --window 14     janela, em dias, para «concluído recentemente»

import { readFileSync } from 'node:fs';
import { percentile, daysBetween } from '../packages/core/src/metrics.js';

const COLUMN_HINTS = {
  id: ['card id', 'cardid', 'card_id', 'id'],
  created: ['created at', 'created', 'creation date', 'date created', 'data de criação', 'criado em'],
  start: ['in progress date', 'start date', 'started at', 'started', 'first start', 'actual start date',
    'start', 'data de início', 'inicio', 'início'],
  done: ['done date', 'completed at', 'completed', 'finished at', 'end date', 'actual end date', 'done',
    'data de fim', 'data de conclusão', 'concluído em'],
  owner: ['owner', 'assignee', 'responsible', 'responsável'],
  blocked: ['is blocked', 'blocked', 'block reason', 'bloqueado'],
};

export function parseArgs(argv) {
  const opts = { file: null, cols: {}, usDates: false, now: null, window: 14 };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--us-dates') opts.usDates = true;
    else if (a === '--now') opts.now = argv[++i];
    else if (a === '--window') opts.window = Number(argv[++i]);
    else if (a.startsWith('--') && a.slice(2) in COLUMN_HINTS) opts.cols[a.slice(2)] = argv[++i];
    else if (!opts.file) opts.file = a;
  }
  return opts;
}

/** CSV com aspas, separador «,» ou «;» (deteta pelo cabeçalho), e BOM opcional. */
export function parseCsv(text) {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/, 1)[0];
  const sep = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i += 1; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== '')) rows.push(row);
  return rows;
}

export function detectColumns(header, overrides = {}) {
  const lower = header.map((h) => h.trim().toLowerCase());
  const found = {};
  for (const [role, hints] of Object.entries(COLUMN_HINTS)) {
    if (overrides[role]) {
      const idx = lower.indexOf(overrides[role].trim().toLowerCase());
      found[role] = idx >= 0 ? idx : -2; // -2 = indicado mas não existe
      continue;
    }
    let idx = -1;
    for (const h of hints) {
      idx = lower.indexOf(h);
      if (idx >= 0) break;
    }
    found[role] = idx;
  }
  return found;
}

/** Datas: ISO (2026-10-01, 2026-10-01 12:00:00, 2026-10-01T12:00Z) ou dia/mês/ano com / . - */
export function parseDate(value, usDates = false) {
  const v = (value || '').trim();
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
    // Sem fuso explícito, tudo em hora local (só a data também), para as idades não variarem com o formato.
    const d = new Date(v.length === 10 ? `${v}T00:00:00` : v.replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  const [, a, b, y, hh = '0', mm = '0', ss = '0'] = m;
  const [day, month] = usDates ? [b, a] : [a, b];
  const d = new Date(Number(y), Number(month) - 1, Number(day), Number(hh), Number(mm), Number(ss));
  return Number.isNaN(d.getTime()) ? null : d;
}

function isBlocked(value) {
  const v = (value || '').trim().toLowerCase();
  return v !== '' && !['0', 'no', 'não', 'nao', 'false', 'n'].includes(v);
}

/** Anonimiza e classifica. Devolve só o que o cálculo precisa; títulos nunca são lidos. */
export function toCards(rows, cols, usDates) {
  const ids = new Map();
  const people = new Map();
  const person = (name) => {
    const n = (name || '').trim();
    if (!n) return null;
    if (!people.has(n)) {
      const i = people.size;
      people.set(n, `Pessoa ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ''}`);
    }
    return people.get(n);
  };
  let badDates = 0;
  const cards = rows.map((r, n) => {
    const rawId = cols.id >= 0 ? r[cols.id] : String(n);
    if (!ids.has(rawId)) ids.set(rawId, `CARTAO-${String(ids.size + 1).padStart(3, '0')}`);
    const get = (role) => (cols[role] >= 0 ? r[cols[role]] : '');
    const created = parseDate(get('created'), usDates);
    const start = parseDate(get('start'), usDates);
    const done = parseDate(get('done'), usDates);
    for (const role of ['created', 'start', 'done']) if (get(role).trim() && !parseDate(get(role), usDates)) badDates += 1;
    return {
      key: ids.get(rawId),
      owner: person(get('owner')),
      created,
      start,
      done,
      category: done ? 'done' : start ? 'wip' : 'backlog',
      flagged: cols.blocked >= 0 ? isBlocked(get('blocked')) : false,
    };
  });
  return { cards, badDates };
}

const round1 = (x) => (x == null ? '–' : (Math.round(x * 10) / 10).toString().replace('.', ','));

export function summarize(cards, now, windowDays) {
  const since = new Date(now.getTime() - windowDays * 86400000);
  const wip = cards.filter((c) => c.category === 'wip');
  const done = cards.filter((c) => c.category === 'done');
  const aging = wip.map((c) => ({ ...c, age: daysBetween(c.start, now) })).sort((a, b) => b.age - a.age);
  const cycle = done.filter((c) => c.start).map((c) => daysBetween(c.start, c.done));
  const lead = done.filter((c) => c.created).map((c) => daysBetween(c.created, c.done));
  return {
    total: cards.length,
    backlog: cards.filter((c) => c.category === 'backlog').length,
    wip: wip.length,
    blocked: cards.filter((c) => c.flagged && c.category !== 'done').length,
    doneRecent: done.filter((c) => c.done >= since).length,
    doneTotal: done.length,
    agingP50: percentile(aging.map((c) => c.age), 50),
    agingP85: percentile(aging.map((c) => c.age), 85),
    cycleP50: percentile(cycle, 50),
    cycleP85: percentile(cycle, 85),
    cycleCount: cycle.length,
    leadP50: percentile(lead, 50),
    leadP85: percentile(lead, 85),
    oldest: aging.slice(0, 5).map((c) => ({ key: c.key, owner: c.owner, age: c.age, flagged: c.flagged })),
  };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.file) {
    console.error('Uso: node scripts/validar-csv.mjs export.csv [--start "Nome da coluna" ...]');
    process.exit(2);
  }
  const rows = parseCsv(readFileSync(opts.file, 'utf8'));
  const [header, ...data] = rows;
  const cols = detectColumns(header, opts.cols);
  const roleNames = { id: 'ID', created: 'criação', start: 'início', done: 'fim', owner: 'responsável', blocked: 'bloqueio' };

  console.log(`Colunas do ficheiro (só os nomes): ${header.map((h) => `«${h.trim()}»`).join(', ')}\n`);
  console.log('Colunas usadas:');
  for (const [role, label] of Object.entries(roleNames)) {
    const idx = cols[role];
    const txt = idx >= 0 ? `«${header[idx].trim()}»` : idx === -2 ? 'indicada mas não existe' : 'não encontrada';
    console.log(`  ${label.padEnd(12)} ${txt}`);
  }
  if (cols.start < 0 || cols.done < 0) {
    console.error('\nFaltam as colunas de início e/ou de fim, sem as quais não há idade nem cycle time.');
    console.error('Indique-as com --start "Nome" e --done "Nome", usando os nomes da lista acima.');
    process.exit(1);
  }

  const now = opts.now ? new Date(`${opts.now}T23:59:59`) : new Date();
  const { cards, badDates } = toCards(data, cols, opts.usDates);
  const s = summarize(cards, now, opts.window);

  console.log(`\nCartões: ${s.total} · Backlog ${s.backlog} · Em curso ${s.wip} · Bloqueados ${s.blocked} · Concluídos ${s.doneTotal} (${s.doneRecent} nos últimos ${opts.window} dias)`);
  if (badDates) console.log(`⚠ ${badDates === 1 ? '1 data não foi reconhecida' : `${badDates} datas não foram reconhecidas`}. Se as datas forem mês/dia/ano, use --us-dates.`);
  console.log('\nIdade do trabalho em curso (dias desde o início):');
  console.log(`  Mediana ${round1(s.agingP50)} · P85 ${round1(s.agingP85)}`);
  console.log(`Cycle time dos concluídos (início → fim, ${s.cycleCount} cartões):`);
  console.log(`  Mediana ${round1(s.cycleP50)} · P85 ${round1(s.cycleP85)}`);
  console.log(`Lead time dos concluídos (criação → fim): Mediana ${round1(s.leadP50)} · P85 ${round1(s.leadP85)}`);
  console.log('\nOs 5 em curso mais antigos (IDs e nomes anonimizados):');
  for (const o of s.oldest) console.log(`  ${o.key}  ${round1(o.age).padStart(6)} dias  ${o.owner || 'Sem responsável'}${o.flagged ? '  [bloqueado]' : ''}`);
  console.log('\nCompare com o BusinessMap: nº em curso, idade dos mais antigos e P85 do cycle time.');
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) main();
