// Cria um projeto Kanban de teste com issues em backlog, em curso (uma bloqueada) e concluídas.
// Lê JIRA_SITE, JIRA_EMAIL, JIRA_TOKEN e PROJECT_KEY do ambiente. Pode correr mais do que uma vez:
// reutiliza o projeto e não duplica as issues (marcadas com a etiqueta «friday-teste»).

const site = (process.env.JIRA_SITE || '').trim().replace(/\/$/, '');
const email = (process.env.JIRA_EMAIL || '').trim();
const token = process.env.JIRA_TOKEN || '';
const projectKey = (process.env.PROJECT_KEY || 'FRIDEMO').trim().toUpperCase();
const LABEL = 'friday-teste';
const WAIT_TRIES = Number(process.env.WAIT_TRIES || 20);
const WAIT_MS = Number(process.env.WAIT_MS || 30000);

function isSiteStarting(r) {
  const text = typeof r.data === 'string' ? r.data : JSON.stringify(r.data || '');
  return !r.ok && (r.status === 404 || r.status === 503) && /temporarily unavailable/i.test(text);
}

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
  if (r.status === 401) console.error('  O email ou o token estão errados, ou o token não é deste utilizador.');
  if (r.status === 403) console.error('  O utilizador não tem permissão. Precisa de ser administrador do site.');
  process.exit(1);
}

const PLAN = [
  { summary: 'Rever requisitos do relatório mensal', target: 'backlog', assign: true },
  { summary: 'Definir critérios de aceitação do login', target: 'backlog', assign: false },
  { summary: 'Estudar integração com o SSO', target: 'backlog', assign: true },
  { summary: 'Corrigir erro ao exportar CSV', target: 'wip', assign: true, flag: true },
  { summary: 'Página de definições do utilizador', target: 'wip', assign: true },
  { summary: 'Melhorar tempo de carregamento do quadro', target: 'wip', assign: false },
  { summary: 'Testes automáticos da API de cartões', target: 'wip', assign: true },
  { summary: 'Atualizar dependências do projeto', target: 'done', assign: true },
  { summary: 'Documentar instalação', target: 'done', assign: true },
];

async function main() {
  console.log(`Site: ${base} · Projeto: ${projectKey}`);

  // Um site acabado de criar responde «Site temporarily unavailable» durante alguns minutos.
  let me = await jira('GET', '/rest/api/3/myself');
  for (let tentativa = 1; isSiteStarting(me) && tentativa <= WAIT_TRIES; tentativa += 1) {
    if (tentativa === 1) console.log('O site ainda não está disponível (se acabou de ser criado, é normal). Vou esperar até 10 minutos...');
    console.log(`  à espera... (${tentativa}/${WAIT_TRIES})`);
    await new Promise((r) => setTimeout(r, WAIT_MS));
    me = await jira('GET', '/rest/api/3/myself');
  }
  if (isSiteStarting(me)) {
    console.error(`\n✗ O site ${base} continua indisponível.`);
    console.error('  Abra esse endereço no browser. Se não abrir, o endereço está errado ou o site ainda não foi criado.');
    console.error('  Quando abrir no browser, corra o script de novo e escreva esse endereço (não carregue em Enter).');
    process.exit(1);
  }
  if (!me.ok) fail('Ler o utilizador', me);
  console.log(`✓ Ligado como ${me.data.displayName}`);

  const proj = await jira('GET', `/rest/api/3/project/${projectKey}`);
  if (proj.ok) {
    console.log(`✓ Projeto ${projectKey} já existe, vou reutilizá-lo`);
  } else if (proj.status === 404) {
    const created = await jira('POST', '/rest/api/3/project', {
      key: projectKey,
      name: 'FRIDAY Teste',
      projectTypeKey: 'software',
      projectTemplateKey: 'com.pyxis.greenhopper.jira:gh-simplified-kanban-classic',
      leadAccountId: me.data.accountId,
      assigneeType: 'UNASSIGNED',
    });
    if (!created.ok) {
      console.error(`\nNão consegui criar o projeto. Crie-o à mão no Jira (modelo Kanban, chave ${projectKey}) e corra o script de novo.`);
      fail('Criar o projeto', created);
    }
    console.log(`✓ Projeto ${projectKey} criado (Kanban)`);
  } else {
    fail('Ler o projeto', proj);
  }

  const existing = await jira('POST', '/rest/api/3/search/jql', {
    jql: `project = "${projectKey}" AND labels = "${LABEL}"`, fields: ['summary'], maxResults: 1,
  });
  if (existing.ok && existing.data.issues?.length) {
    console.log(`✓ As issues de teste já existem (etiqueta ${LABEL}); não crio outras.`);
    return;
  }

  const meta = await jira('GET', `/rest/api/3/issue/createmeta/${projectKey}/issuetypes`);
  if (!meta.ok) fail('Ler os tipos de issue', meta);
  const types = (meta.data.issueTypes || meta.data.values || []).filter((t) => !t.subtask && t.name !== 'Epic');
  if (!types.length) fail('Escolher tipos de issue', { status: 0, data: 'o projeto não tem tipos de issue utilizáveis' });
  console.log(`✓ Tipos de issue: ${types.map((t) => t.name).join(', ')}`);

  const fields = await jira('GET', '/rest/api/3/field');
  const flagged = fields.ok
    ? fields.data.find((f) => f.custom && (f.name === 'Flagged' || f.schema?.custom?.endsWith(':flagged')))
    : null;

  const counts = { backlog: 0, wip: 0, done: 0, flagged: 0 };
  const manual = [];
  for (const [n, item] of PLAN.entries()) {
    const type = types[n % types.length];
    const issue = await jira('POST', '/rest/api/3/issue', {
      fields: {
        project: { key: projectKey },
        summary: item.summary,
        issuetype: { id: type.id },
        labels: [LABEL],
        ...(item.assign ? { assignee: { accountId: me.data.accountId } } : {}),
      },
    });
    if (!issue.ok) fail(`Criar «${item.summary}»`, issue);
    const key = issue.data.key;

    if (item.target !== 'backlog') {
      const want = item.target === 'wip' ? 'indeterminate' : 'done';
      const tr = await jira('GET', `/rest/api/3/issue/${key}/transitions`);
      const t = tr.ok && tr.data.transitions.find((x) => x.to?.statusCategory?.key === want);
      if (!t) {
        manual.push(`${key}: mover para ${item.target === 'wip' ? 'In Progress' : 'Done'}`);
      } else {
        const moved = await jira('POST', `/rest/api/3/issue/${key}/transitions`, { transition: { id: t.id } });
        if (!moved.ok) manual.push(`${key}: mover para ${t.to.name}`);
      }
    }
    counts[item.target] += 1;

    if (item.flag) {
      const ok = flagged && (await jira('PUT', `/rest/api/3/issue/${key}`, { fields: { [flagged.id]: [{ value: 'Impediment' }] } })).ok;
      if (ok) counts.flagged += 1;
      else manual.push(`${key}: abrir a issue, ⋯ → Add flag`);
    }
    console.log(`✓ ${key} · ${type.name} · ${item.target}${item.flag ? ' · bloqueada' : ''}${item.assign ? '' : ' · sem responsável'}`);
  }

  console.log('\nResultado esperado no FRIDAY Flow:');
  console.log(`  Abertas ${counts.backlog + counts.wip} · Backlog ${counts.backlog} · Em curso ${counts.wip} · Bloqueadas 1 · Concluídas ${counts.done}`);
  if (manual.length) {
    console.log('\n⚠ Falta fazer à mão no Jira:');
    for (const m of manual) console.log(`  - ${m}`);
  }
}

main().catch((e) => {
  console.error(`\n✗ Erro inesperado: ${e.message}`);
  process.exit(1);
});
