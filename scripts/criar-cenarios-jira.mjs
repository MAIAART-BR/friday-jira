// Acrescenta ao projeto de teste (FRIDEMO) as situações-limite que o Jira deixa criar.
// Corre depois de criar-dados-teste.mjs. Lê JIRA_SITE, JIRA_EMAIL, JIRA_TOKEN e PROJECT_KEY do ambiente.
// Não duplica: as issues ficam com a etiqueta «friday-cenarios».
//
//   node scripts/criar-cenarios-jira.mjs              situações-limite (5 issues)
//   node scripts/criar-cenarios-jira.mjs --volume     + 1000 issues em backlog, para testar o limite e o tempo de resposta
//
// O que não dá para simular: idades. O Jira põe as datas de criação e de mudança de estado no momento em que
// acontecem; não há forma de as recuar. Isso valida-se com scripts/validar-csv.mjs.

const site = (process.env.JIRA_SITE || '').trim().replace(/\/$/, '');
const email = (process.env.JIRA_EMAIL || '').trim();
const token = process.env.JIRA_TOKEN || '';
const projectKey = (process.env.PROJECT_KEY || 'FRIDEMO').trim().toUpperCase();
const LABEL = 'friday-cenarios';
const VOLUME_LABEL = 'friday-volume';
const VOLUME = 1000;
const withVolume = process.argv.includes('--volume');

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
  console.error(`\n✗ ${step} falhou (HTTP ${r.status}): ${msg}`);
  process.exit(1);
}

async function countLabel(label) {
  const r = await jira('POST', '/rest/api/3/search/jql', { jql: `project = "${projectKey}" AND labels = "${label}"`, fields: ['summary'], maxResults: 1 });
  return r.ok ? (r.data.issues?.length || 0) : 0;
}

async function create(fields) {
  const r = await jira('POST', '/rest/api/3/issue', { fields: { project: { key: projectKey }, labels: [LABEL], ...fields } });
  if (!r.ok) fail(`Criar «${fields.summary}»`, r);
  return r.data.key;
}

/** Move a issue para a primeira transição que chegue à categoria pedida (new, indeterminate, done). */
async function moveTo(key, category) {
  const tr = await jira('GET', `/rest/api/3/issue/${key}/transitions`);
  const t = tr.ok && tr.data.transitions.find((x) => x.to?.statusCategory?.key === category);
  if (!t) return false;
  return (await jira('POST', `/rest/api/3/issue/${key}/transitions`, { transition: { id: t.id } })).ok;
}

async function main() {
  console.log(`Site: ${base} · Projeto: ${projectKey}`);
  const me = await jira('GET', '/rest/api/3/myself');
  if (!me.ok) fail('Ler o utilizador', me);

  const meta = await jira('GET', `/rest/api/3/issue/createmeta/${projectKey}/issuetypes`);
  if (!meta.ok) fail('Ler os tipos de issue', meta);
  const types = meta.data.issueTypes || meta.data.values || [];
  const standard = types.find((t) => !t.subtask && (t.hierarchyLevel ?? 0) === 0);
  const epic = types.find((t) => t.hierarchyLevel === 1 || /^(epic|épico)$/i.test(t.name));
  const subtask = types.find((t) => t.subtask);
  const fields = await jira('GET', '/rest/api/3/field');
  const flagged = fields.ok ? fields.data.find((f) => f.custom && (f.name === 'Flagged' || f.schema?.custom?.endsWith(':flagged'))) : null;
  const flag = async (key) => flagged && (await jira('PUT', `/rest/api/3/issue/${key}`, { fields: { [flagged.id]: [{ value: 'Impediment' }] } })).ok;

  const manual = [];
  const note = (ok, text) => { if (!ok) manual.push(text); };

  if (await countLabel(LABEL)) {
    console.log(`✓ As situações-limite já existem (etiqueta ${LABEL}); não crio outras.`);
  } else {
    // 1. Reaberta: Feito → Em curso. Deve contar como em curso, com idade desde a reabertura.
    const k1 = await create({ summary: 'Cenário: reaberta depois de concluída', issuetype: { id: standard.id }, assignee: { accountId: me.data.accountId } });
    note(await moveTo(k1, 'done') && await moveTo(k1, 'indeterminate'), `${k1}: mover para Done e depois de volta para In Progress`);
    console.log(`✓ ${k1} · reaberta (esperado: em curso)`);

    // 2. Bloqueada ainda no backlog. Hoje conta como bloqueada.
    const k2 = await create({ summary: 'Cenário: bloqueada ainda no backlog', issuetype: { id: standard.id } });
    note(await flag(k2), `${k2}: ⋯ → Add flag`);
    console.log(`✓ ${k2} · bloqueada no backlog (esperado: conta em Bloqueado)`);

    // 3. Bloqueada e concluída. Não deve contar como bloqueada.
    const k3 = await create({ summary: 'Cenário: concluída mas ainda com flag', issuetype: { id: standard.id }, assignee: { accountId: me.data.accountId } });
    note(await flag(k3), `${k3}: ⋯ → Add flag`);
    note(await moveTo(k3, 'done'), `${k3}: mover para Done`);
    console.log(`✓ ${k3} · bloqueada e concluída (esperado: não conta em Bloqueado; conta em Concluído)`);

    // 4. Epic em curso. Hoje conta como trabalho em curso.
    if (epic) {
      const k4 = await create({ summary: 'Cenário: epic em curso', issuetype: { id: epic.id }, assignee: { accountId: me.data.accountId } });
      note(await moveTo(k4, 'indeterminate'), `${k4}: mover para In Progress`);
      console.log(`✓ ${k4} · ${epic.name} em curso (hoje: conta no WIP)`);
    } else manual.push('O projeto não tem tipo Epic: cenário 4 não criado');

    // 5. Subtarefa em curso de uma issue em curso. Hoje conta no WIP, ao lado da mãe.
    if (subtask) {
      const parent = await jira('POST', '/rest/api/3/search/jql', {
        jql: `project = "${projectKey}" AND statusCategory = "In Progress" AND issuetype not in subTaskIssueTypes() ORDER BY created ASC`,
        fields: ['summary'], maxResults: 1,
      });
      const parentKey = parent.ok && parent.data.issues?.[0]?.key;
      if (parentKey) {
        const k5 = await create({ summary: 'Cenário: subtarefa em curso', issuetype: { id: subtask.id }, parent: { key: parentKey } });
        note(await moveTo(k5, 'indeterminate'), `${k5}: mover para In Progress`);
        console.log(`✓ ${k5} · subtarefa de ${parentKey} em curso (hoje: conta no WIP, além da mãe)`);
      } else manual.push('Não há nenhuma issue em curso para ser mãe da subtarefa: cenário 5 não criado');
    } else manual.push('O projeto não tem subtarefas: cenário 5 não criado');
  }

  if (withVolume) {
    if (await countLabel(VOLUME_LABEL)) {
      console.log(`✓ O volume já existe (etiqueta ${VOLUME_LABEL}); não crio outro.`);
    } else {
      console.log(`A criar ${VOLUME} issues em backlog, 50 de cada vez (pode demorar alguns minutos)...`);
      for (let n = 0; n < VOLUME; n += 50) {
        const issueUpdates = Array.from({ length: Math.min(50, VOLUME - n) }, (_, i) => ({
          fields: { project: { key: projectKey }, summary: `Volume ${n + i + 1}`, issuetype: { id: standard.id }, labels: [VOLUME_LABEL] },
        }));
        const r = await jira('POST', '/rest/api/3/issue/bulk', { issueUpdates });
        if (!r.ok) fail(`Criar o lote ${n / 50 + 1}`, r);
        if (r.data.errors?.length) fail(`Lote ${n / 50 + 1} com erros`, { status: r.status, data: r.data.errors.slice(0, 3) });
        process.stdout.write(`  ${n + issueUpdates.length}/${VOLUME}\r`);
      }
      console.log(`\n✓ ${VOLUME} issues em backlog (etiqueta ${VOLUME_LABEL})`);
    }
  }

  console.log('\nO que verificar no FRIDAY Flow:');
  console.log('  - a reaberta aparece em curso, com idade «menos de 1 dia»');
  console.log('  - Bloqueado conta a do backlog, mas não a concluída');
  console.log('  - a epic e a subtarefa entram no WIP: decidir se é isso que se quer');
  if (withVolume) console.log('  - aviso de mais de 1000 tickets, e quanto tempo a página demora a abrir');
  if (manual.length) {
    console.log('\n⚠ Falta fazer à mão no Jira:');
    for (const m of manual) console.log(`  - ${m}`);
  }
}

main().catch((e) => {
  console.error(`\n✗ Erro inesperado: ${e.message}`);
  process.exit(1);
});
