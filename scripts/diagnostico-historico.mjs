// Diagnóstico (só leituras): o que o pedido em lote do histórico devolve para um ticket importado, com e sem filtro de campos.
const site = (process.env.JIRA_SITE || '').trim().replace(/\/$/, '');
const base = /^https?:\/\//.test(site) ? site : `https://${site}`;
const auth = `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_TOKEN}`).toString('base64')}`;
const req = async (path, body) => (await fetch(base + path, { method: body ? 'POST' : 'GET', headers: { Authorization: auth, Accept: 'application/json', 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })).json();
const key = process.env.ISSUE || 'FRIBASE-94';
const issue = await req(`/rest/api/3/issue/${key}?fields=status`);
console.log('id', issue.id, 'estado', issue.fields?.status?.id, issue.fields?.status?.name);
const fields = await req('/rest/api/3/field');
const flagged = fields.find((f) => f.custom && (f.name === 'Flagged' || f.schema?.custom?.endsWith(':flagged')));
console.log('campo Flagged', flagged?.id);
for (const fieldIds of [['status', flagged?.id].filter(Boolean), undefined]) {
  const r = await req('/rest/api/3/changelog/bulkfetch', { issueIdsOrKeys: [issue.id], ...(fieldIds ? { fieldIds } : {}), maxResults: 1000 });
  const hs = r.issueChangeLogs?.[0]?.changeHistories || [];
  console.log(`\nbulkfetch fieldIds=${JSON.stringify(fieldIds)} → ${hs.length} entradas`);
  for (const h of hs) for (const it of h.items || []) console.log('  ', h.created, JSON.stringify(it));
}
const one = await req(`/rest/api/3/issue/${key}/changelog?maxResults=50`);
console.log('\nchangelog do ticket:');
for (const h of one.values || []) for (const it of h.items || []) console.log('  ', h.created, JSON.stringify(it));
const st = await req('/rest/api/3/status');
console.log('\nestados:', st.filter((s) => /Backlog|Selected|Progress|Done|andamento|Conclu/i.test(s.name)).map((s) => `${s.id}=${s.name}`).join(', '));
