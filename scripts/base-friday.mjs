// Base de teste do FRIDAY simulada em tempo real (projeto FRIBASE). Cada execução é um «passo»:
// cria os tickets do plano cuja hora chegou e move cada um para a coluna em que deve estar agora.
// Corre a cada 2 horas no GitHub Actions (.github/workflows/base-friday.yml) durante 36 dias.
//
//   node scripts/base-friday.mjs --start   cria o projeto (se faltar), marca o início e dá o primeiro passo
//   node scripts/base-friday.mjs           dá um passo (não faz nada se a base não foi iniciada ou já terminou)
//
// Ambiente: JIRA_SITE, JIRA_EMAIL, JIRA_TOKEN e, opcional, PROJECT_KEY (FRIBASE).
// O plano (quem é criado e quando muda de coluna) está em scripts/base-friday-plano.mjs, com testes.

import { plan, targetColumn, codeOf, finished, LABEL, DURATION_DAYS } from './base-friday-plano.mjs';

const site = (process.env.JIRA_SITE || '').trim().replace(/\/$/, '');
const email = (process.env.JIRA_EMAIL || '').trim();
const token = process.env.JIRA_TOKEN || '';
const projectKey = (process.env.PROJECT_KEY || 'FRIBASE').trim().toUpperCase();
const start = process.argv.includes('--start');
const PROP = 'friday-base';

if (!site || !email || !token) {
  console.error('Faltam JIRA_SITE, JIRA_EMAIL ou JIRA_TOKEN.');
  process.exit(1);
}
const base = /^https?:\/\//.test(site) ? site : `https://${site}`;
const auth = `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;

async function jira(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { Authorization: auth, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

function fail(step, r) {
  const msg = typeof r.data === 'string' ? r.data.slice(0, 300) : JSON.stringify(r.data).slice(0, 500);
  console.error(`✗ ${step} falhou (HTTP ${r.status}): ${msg}`);
  process.exit(1);
}

/** As 4 colunas do quadro (0 backlog … 3 concluído), cada uma com os seus estados. */
function pickColumns(columns) {
  const withStatus = columns.filter((c) => (c.statuses || []).length);
  if (withStatus.length < 4) return null;
  const pick = withStatus.length === 4 ? withStatus : [withStatus[0], withStatus[1], withStatus[withStatus.length - 2], withStatus[withStatus.length - 1]];
  return pick.map((c) => ({ name: c.name, ids: c.statuses.map((s) => String(s.id)) }));
}

async function main() {
  console.log(`Site: ${base} · Projeto: ${projectKey}`);
  const me = await jira('GET', '/rest/api/3/myself');
  if (!me.ok) fail('Ler o utilizador (confirme o email e o token)', me);
  console.log(`✓ Ligado como ${me.data.displayName}`);

  let proj = await jira('GET', `/rest/api/3/project/${projectKey}`);
  if (!proj.ok && proj.status === 404) {
    if (!start) { console.log('A base ainda não foi iniciada. Nada a fazer.'); return; }
    const created = await jira('POST', '/rest/api/3/project', {
      key: projectKey, name: 'FRIDAY Base', projectTypeKey: 'software',
      projectTemplateKey: 'com.pyxis.greenhopper.jira:gh-simplified-kanban-classic',
      leadAccountId: me.data.accountId, assigneeType: 'UNASSIGNED',
    });
    if (!created.ok) fail('Criar o projeto', created);
    console.log(`✓ Projeto ${projectKey} criado (Kanban)`);
    proj = await jira('GET', `/rest/api/3/project/${projectKey}`);
  }
  if (!proj.ok) fail('Ler o projeto', proj);

  // Início da simulação, guardado no próprio projeto.
  let t0 = null;
  const prop = await jira('GET', `/rest/api/3/project/${projectKey}/properties/${PROP}`);
  if (prop.ok && prop.data?.value?.t0) t0 = prop.data.value.t0;
  if (!t0) {
    if (!start) { console.log('A base ainda não foi iniciada. Nada a fazer.'); return; }
    t0 = Date.now();
    const saved = await jira('PUT', `/rest/api/3/project/${projectKey}/properties/${PROP}`, { t0 });
    if (!saved.ok) fail('Guardar o início', saved);
    console.log(`✓ Base iniciada em ${new Date(t0).toISOString()}`);
  }
  const now = Date.now();
  if (finished(t0, now)) { console.log(`A base terminou (${DURATION_DAYS} dias). Pode desligar a rotina.`); return; }

  // Quadro e colunas.
  const boards = await jira('GET', `/rest/agile/1.0/board?projectKeyOrId=${projectKey}`);
  if (!boards.ok || !boards.data.values?.length) fail('Encontrar o quadro do projeto', boards);
  const config = await jira('GET', `/rest/agile/1.0/board/${boards.data.values[0].id}/configuration`);
  if (!config.ok) fail('Ler as colunas do quadro', config);
  const cols = pickColumns(config.data.columnConfig?.columns || []);
  if (!cols) fail('Encontrar 4 colunas com estados no quadro', { status: 0, data: config.data.columnConfig });
  const columnOf = (statusId) => cols.findIndex((c) => c.ids.includes(String(statusId)));
  console.log(`✓ Colunas: ${cols.map((c) => c.name).join(' → ')}`);

  // Tipo de ticket e campo Flagged.
  const meta = await jira('GET', `/rest/api/3/issue/createmeta/${projectKey}/issuetypes`);
  if (!meta.ok) fail('Ler os tipos de ticket', meta);
  const types = meta.data.issueTypes || meta.data.values || [];
  const type = types.find((t) => /^(task|tarefa)$/i.test(t.name)) || types.find((t) => !t.subtask && (t.hierarchyLevel ?? 0) === 0);
  const fields = await jira('GET', '/rest/api/3/field');
  const flagged = fields.ok ? fields.data.find((f) => f.custom && (f.name === 'Flagged' || f.schema?.custom?.endsWith(':flagged'))) : null;

  // Tickets que já existem.
  const existing = new Map();
  let pageToken;
  do {
    const r = await jira('POST', '/rest/api/3/search/jql', {
      jql: `project = "${projectKey}" AND labels = "${LABEL}"`,
      fields: ['summary', 'status', ...(flagged ? [flagged.id] : [])], maxResults: 100, ...(pageToken ? { nextPageToken: pageToken } : {}),
    });
    if (!r.ok) fail('Ler os tickets da base', r);
    for (const i of r.data.issues || []) {
      const code = codeOf(i.fields.summary);
      if (code) existing.set(code, { key: i.key, statusId: i.fields.status?.id, flagged: flagged ? Boolean(i.fields[flagged.id]?.length) : false });
    }
    pageToken = r.data.isLast ? null : r.data.nextPageToken;
  } while (pageToken);

  const stats = { created: 0, moved: 0, flagged: 0, problems: [] };
  for (const item of plan(t0)) {
    if (item.create > now) continue;
    let cur = existing.get(item.code);
    if (!cur) {
      const r = await jira('POST', '/rest/api/3/issue', { fields: { project: { key: projectKey }, issuetype: { id: type.id }, summary: item.summary, labels: [LABEL] } });
      if (!r.ok) { stats.problems.push(`${item.code}: criar (HTTP ${r.status})`); continue; }
      const got = await jira('GET', `/rest/api/3/issue/${r.data.key}?fields=status`);
      cur = { key: r.data.key, statusId: got.data?.fields?.status?.id, flagged: false };
      stats.created += 1;
    }
    // Avança coluna a coluna até onde o plano diz, para o histórico passar por todas.
    let col = columnOf(cur.statusId);
    const target = targetColumn(item, now);
    while (col >= 0 && col < target) {
      const next = cols[col + 1];
      const tr = await jira('GET', `/rest/api/3/issue/${cur.key}/transitions`);
      const t = tr.ok && tr.data.transitions.find((x) => next.ids.includes(String(x.to?.id)));
      if (!t) { stats.problems.push(`${cur.key}: sem transição para «${next.name}»`); break; }
      const moved = await jira('POST', `/rest/api/3/issue/${cur.key}/transitions`, { transition: { id: t.id } });
      if (!moved.ok) { stats.problems.push(`${cur.key}: mover para «${next.name}» (HTTP ${moved.status})`); break; }
      col += 1;
      stats.moved += 1;
    }
    if (item.flag != null && item.flag <= now && !cur.flagged) {
      const ok = flagged && (await jira('PUT', `/rest/api/3/issue/${cur.key}`, { fields: { [flagged.id]: [{ value: 'Impediment' }] } })).ok;
      if (ok) stats.flagged += 1; else stats.problems.push(`${cur.key}: sinalizar`);
    }
  }
  const day = ((now - t0) / 86400000).toFixed(1);
  console.log(`✓ Dia ${day} de ${DURATION_DAYS}: ${stats.created} criados, ${stats.moved} mudanças de coluna, ${stats.flagged} sinalizados.`);
  if (stats.problems.length) {
    console.log(`Problemas (${stats.problems.length}):`);
    for (const p of stats.problems) console.log(`  - ${p}`);
    process.exitCode = 1;
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
