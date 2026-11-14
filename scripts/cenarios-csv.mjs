// Gera uma exportação CSV inventada, ao estilo do BusinessMap, com todas as situações que o validador tem de tratar.
// As datas são relativas a NOW, para os resultados esperados serem fixos. Nada aqui vem de dados reais.
//
// Uso: node scripts/cenarios-csv.mjs > /tmp/cenarios.csv
//      node scripts/validar-csv.mjs /tmp/cenarios.csv --now 2026-11-14

export const NOW = new Date(2026, 10, 14, 12, 0, 0); // 14/11/2026 12:00, hora local

const DAY = 86400000;
const iso = (daysAgo) => {
  const d = new Date(NOW.getTime() - daysAgo * DAY);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:00`;
};
const pt = (daysAgo) => {
  const d = new Date(NOW.getTime() - daysAgo * DAY);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// [id, título, responsável, criado, início, fim, bloqueado, situação]
// Números = dias antes de NOW; null = vazio; texto = valor literal.
export const SCENARIOS = [
  // Backlog
  ['B1', 'Backlog normal', 'Ana', 10, null, null, '', 'backlog'],
  ['B2', 'Backlog sem responsável', '', 3, null, null, '', 'backlog sem responsável'],
  ['B3', 'Backlog bloqueado', 'Rui', 20, null, null, 'Yes', 'bloqueado ainda no backlog'],
  // Em curso: idades 1, 3, 5, 8, 13, 21, 34, 55 dias
  ['W1', 'Em curso há 1 dia', 'Ana', 5, 1, null, '', 'em curso'],
  ['W2', 'Em curso há 3 dias', 'Rui', 10, 3, null, '0', 'em curso, bloqueio «0»'],
  ['W3', 'Em curso há 5 dias; com «;» e "aspas"', 'Ana', 9, 5, null, 'no', 'título com separador e aspas'],
  ['W4', 'Em curso há 8 dias', '', 30, 8, null, '', 'em curso sem responsável'],
  ['W5', 'Em curso há 13 dias, bloqueado', 'Rita', 40, 13, null, 'true', 'em curso bloqueado'],
  ['W6', 'Em curso há 21 dias', 'Rui', 25, 21, null, '', 'em curso'],
  ['W7', 'Em curso há 34 dias, formato PT', 'Ana', `PT:40`, `PT:34`, null, '', 'datas dia/mês/ano'],
  ['W8', 'Em curso há 55 dias, bloqueado', 'Rita', 90, 55, null, '1', 'o mais antigo, bloqueado'],
  // Concluídos: cycle time 2, 4, 6, 10, 15 dias
  ['D1', 'Concluído recente', 'Ana', 12, 6, 4, '', 'concluído há 4 dias (cycle 2)'],
  ['D2', 'Concluído recente', 'Rui', 20, 14, 10, '', 'concluído há 10 dias (cycle 4)'],
  ['D3', 'Concluído antigo', 'Rita', 60, 46, 40, '', 'concluído há 40 dias (cycle 6)'],
  ['D4', 'Concluído antigo, bloqueado', 'Ana', 100, 90, 80, 'Yes', 'bloqueado mas concluído: não conta'],
  ['D5', 'Concluído antigo', '', 50, 45, 30, '', 'concluído sem responsável (cycle 15)'],
  ['D6', 'Concluído sem início', 'Rui', 15, null, 5, '', 'saltou o «em curso»: sem cycle, com lead'],
  // Dados estranhos
  ['X1', 'Fim antes do início', 'Ana', 30, 10, 20, '', 'dados incoerentes: cycle conta 0'],
  ['X2', 'Data ilegível', 'Rui', 'ontem', 7, null, '', 'data de criação ilegível'],
];

function cell(v) {
  if (v === null) return '';
  if (typeof v === 'number') return iso(v);
  if (typeof v === 'string' && v.startsWith('PT:')) return pt(Number(v.slice(3)));
  return v;
}

function quote(s) {
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv() {
  const header = ['Card ID', 'Title', 'Owner', 'Created At', 'In Progress Date', 'Done Date', 'Is Blocked'];
  const lines = [header.join(';')];
  for (const [id, title, owner, created, start, done, blocked] of SCENARIOS) {
    lines.push([id, title, owner, cell(created), cell(start), cell(done), blocked].map((v) => quote(String(v))).join(';'));
  }
  // BOM e CRLF, como sai do Excel em português; uma linha em branco no meio.
  return `﻿${lines.slice(0, 5).join('\r\n')}\r\n\r\n${lines.slice(5).join('\r\n')}\r\n`;
}

// Resultados esperados, calculados à mão a partir da tabela acima (não pelo código que está a ser testado).
export const EXPECTED = {
  total: 19,
  backlog: 3, // B1, B2, B3
  wip: 9, // W1–W8 e X2 (X2 tem início, a data ilegível é a de criação)
  // Bloqueados não concluídos: B3 («Yes»), W5 («true»), W8 («1»). W2 («0») e W3 («no») não contam; D4 está concluído.
  blocked: 3,
  doneTotal: 7, // D1–D6, X1
  doneRecent: 3, // D1 (4 dias), D2 (10), D6 (5); X1 acabou há 20, D3–D5 antigos
  // Idades em curso: 1, 3, 5, 7 (X2), 8, 13, 21, 34, 55 → 9 valores
  // P50 posto ceil(0,5×9)=5 → 8; P85 posto ceil(0,85×9)=8 → 34
  agingP50: 8,
  agingP85: 34,
  // Cycle (início → fim) dos concluídos com início: D1 2, D2 4, D3 6, D4 10, D5 15, X1 0 → 0,2,4,6,10,15
  // P50 posto 3 → 4; P85 posto ceil(5,1)=6 → 15
  cycleP50: 4,
  cycleP85: 15,
  cycleCount: 6,
  oldestKeysInOrder: ['W8', 'W7', 'W6', 'W5', 'W4'],
};

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) process.stdout.write(buildCsv());
