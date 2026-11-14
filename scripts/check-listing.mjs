// Conta os caracteres de cada campo de marketplace/LISTING.md e falha se algum passar o limite.
// Cada campo é marcado com <!-- field: nome (max N) --> e o texto é o parágrafo seguinte (sem títulos «## »).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'marketplace', 'LISTING.md');
const lines = readFileSync(file, 'utf8').split('\n');
let bad = 0;
for (let i = 0; i < lines.length; i += 1) {
  const m = lines[i].match(/<!-- field: (\S+) \(max (\d+)\) -->/);
  if (!m) continue;
  const [, name, max] = m;
  const text = [];
  let j = i + 1;
  while (j < lines.length && (lines[j].startsWith('## ') || lines[j].trim() === '')) j += 1;
  // «more-details» ocupa vários parágrafos, até ao próximo título ou campo.
  while (j < lines.length && !lines[j].startsWith('<!--') && !lines[j].startsWith('## ')
    && !lines[j].startsWith('Screenshot:')) {
    text.push(lines[j]);
    j += 1;
    if (name !== 'more-details' && lines[j]?.trim() === '') break;
  }
  const value = text.join('\n').trim();
  const ok = value.length <= Number(max);
  if (!ok) bad += 1;
  console.log(`${ok ? '✓' : '✗'} ${name.padEnd(20)} ${String(value.length).padStart(4)} / ${max}`);
}
process.exit(bad ? 1 : 0);
