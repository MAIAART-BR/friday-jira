// Copia packages/core/src para apps/*/src/core, para cada app Forge ser autossuficiente no deploy.
// Uso: node scripts/sync-core.mjs          (copia)
//      node scripts/sync-core.mjs --check  (falha se alguma cópia estiver desatualizada)
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'packages/core/src');
const check = process.argv.includes('--check');
const header = '// GERADO por scripts/sync-core.mjs a partir de packages/core/src. Não editar aqui.\n';

let stale = [];
for (const app of readdirSync(join(root, 'apps'))) {
  const dest = join(root, 'apps', app, 'src/core');
  if (!existsSync(join(root, 'apps', app, 'manifest.yml'))) continue;
  for (const file of readdirSync(src)) {
    const want = header + readFileSync(join(src, file), 'utf8');
    const target = join(dest, file);
    const have = existsSync(target) ? readFileSync(target, 'utf8') : null;
    if (have === want) continue;
    if (check) stale.push(`apps/${app}/src/core/${file}`);
    else {
      mkdirSync(dest, { recursive: true });
      writeFileSync(target, want);
      console.log(`atualizado: apps/${app}/src/core/${file}`);
    }
  }
}
if (check && stale.length) {
  console.error(`Cópias do core desatualizadas (corra npm run sync-core):\n  ${stale.join('\n  ')}`);
  process.exit(1);
}
