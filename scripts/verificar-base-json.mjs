// Verifica uma importação da base de teste (JSON) no Jira, só com leituras:
//   em que projetos estão os tickets com a etiqueta da base, se o histórico de colunas ficou com as datas do passado
//   e se há códigos repetidos (por exemplo, a importação no mesmo projeto da simulação em tempo real).
// Ambiente: JIRA_SITE, JIRA_EMAIL, JIRA_TOKEN.

import { codeOf, LABEL } from './base-friday-plano.mjs';

const site = (process.env.JIRA_SITE || '').trim().replace(/\/$/, '');
const base = /^https?:\/\//.test(site) ? site : `https://${site}`;
const auth = `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_TOKEN}`).toString('base64')}`;

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

const day = (s) => (s ? String(s).slice(0, 10) : '–');

async function main() {
  const me = await jira('GET', '/rest/api/3/myself');
  if (!me.ok) { console.error(`✗ Não consegui ligar (HTTP ${me.status})`); process.exit(1); }

  // Todos os tickets com resumo no formato da base («A01 · …»), com ou sem a etiqueta, em qualquer projeto.
  const issues = [];
  let token;
  do {
    const r = await jira('POST', '/rest/api/3/search/jql', {
      jql: `(labels = "${LABEL}" OR summary ~ "\\"A01\\"" OR summary ~ "\\"T1\\"") ORDER BY created ASC`,
      fields: ['summary', 'status', 'created', 'resolutiondate', 'labels', 'project', 'customfield_10021'],
      maxResults: 100, ...(token ? { nextPageToken: token } : {}),
    });
    if (!r.ok) { console.error(`✗ Pesquisa falhou (HTTP ${r.status}): ${JSON.stringify(r.data).slice(0, 300)}`); process.exit(1); }
    issues.push(...(r.data.issues || []));
    token = r.data.isLast ? null : r.data.nextPageToken;
  } while (token);

  const byProject = new Map();
  for (const i of issues) {
    const p = i.fields.project?.key || '?';
    if (!byProject.has(p)) byProject.set(p, []);
    byProject.get(p).push(i);
  }
  console.log(`Tickets encontrados: ${issues.length}`);
  for (const [p, list] of byProject) {
    const status = {};
    for (const i of list) status[i.fields.status?.name] = (status[i.fields.status?.name] || 0) + 1;
    const created = list.map((i) => i.fields.created).sort();
    const codes = list.map((i) => codeOf(i.fields.summary)).filter(Boolean);
    const dup = codes.filter((c, k) => codes.indexOf(c) !== k);
    console.log(`\n== Projeto ${p}: ${list.length} tickets · ${JSON.stringify(status)}`);
    console.log(`   criados entre ${day(created[0])} e ${day(created[created.length - 1])} · com etiqueta: ${list.filter((i) => i.fields.labels?.includes(LABEL)).length}`);
    console.log(`   códigos repetidos: ${dup.length ? [...new Set(dup)].join(', ') : 'nenhum'}`);

    // Histórico de 3 tickets de exemplo: as datas das mudanças de coluna.
    for (const code of ['A01', 'T1', 'B1']) {
      const it = list.find((i) => codeOf(i.fields.summary) === code);
      if (!it) continue;
      const h = await jira('GET', `/rest/api/3/issue/${it.key}/changelog?maxResults=50`);
      const changes = (h.data?.values || []).flatMap((e) => (e.items || []).map((x) => `${day(e.created)} ${x.field}: ${x.fromString || '∅'} → ${x.toString || '∅'}`));
      console.log(`   ${it.key} (${code}) criado ${day(it.fields.created)}, resolvido ${day(it.fields.resolutiondate)}, estado ${it.fields.status?.name}`);
      console.log(changes.length ? changes.map((c) => `      ${c}`).join('\n') : '      sem histórico de mudanças');
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
