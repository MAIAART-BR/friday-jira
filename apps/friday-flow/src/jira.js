// Leitura de dados do Jira. Recebe `request(path, init)` para poder ser testada sem o Forge.
//
// O que é carregado e o que é só contado:
//   - em curso: todos os tickets, sem limite, porque alimentam a idade, o P85 e a tabela;
//   - concluídos nos últimos N dias: todos os tickets;
//   - backlog: só contado, por tipo, com /search/approximate-count (a contagem que o próprio Jira mostra),
//     para um backlog grande não esconder o trabalho em curso.
// Subtarefas não contam em nada: só as tarefas mãe (decisão de 14/11/2026).
import { normalizeIssue } from './core/metrics.js';

export const FIELDS = [
  'summary', 'issuetype', 'assignee', 'status', 'created', 'resolutiondate', 'statuscategorychangedate',
];
/** Limite de segurança, só para o tempo de resposta. Em curso + concluídos acima disto é muito improvável. */
export const SAFETY_MAX = 5000;
const PAGE_SIZE = 100;
const NOT_SUBTASK = 'issuetype not in subTaskIssueTypes()';
const JSON_HEADERS = { Accept: 'application/json', 'Content-Type': 'application/json' };

export function checkProjectKey(projectKey) {
  if (!/^[A-Z][A-Z0-9_]+$/.test(projectKey)) throw new Error(`Chave de projeto inválida: ${projectKey}`);
  return projectKey;
}

export const jql = {
  wip: (k) => `project = "${checkProjectKey(k)}" AND statusCategory = "In Progress" AND ${NOT_SUBTASK} ORDER BY created ASC`,
  // «updated» e não «resolved»: há fluxos que levam a Feito sem preencher a resolução.
  // Apanha um pouco a mais; o filtro exato pela data de conclusão é feito em buildFlowView.
  done: (k, days) => `project = "${checkProjectKey(k)}" AND statusCategory = Done AND updated >= -${Number(days)}d AND ${NOT_SUBTASK}`,
  backlogOfType: (k, typeId) => `project = "${checkProjectKey(k)}" AND statusCategory = "To Do" AND issuetype = ${Number(typeId)}`,
  blockedBacklog: (k, fieldId) => `project = "${checkProjectKey(k)}" AND statusCategory = "To Do" AND ${NOT_SUBTASK} AND cf[${fieldNumber(fieldId)}] is not EMPTY`,
};

function fieldNumber(fieldId) {
  const m = /^customfield_(\d+)$/.exec(fieldId || '');
  if (!m) throw new Error(`Campo inválido: ${fieldId}`);
  return m[1];
}

/** Id do campo «Flagged» (bloqueado) do Jira Software; muda de site para site. */
export async function findFlaggedFieldId(request) {
  const res = await request('/rest/api/3/field');
  if (!res.ok) return null;
  const fields = await res.json();
  const f = fields.find((x) => x.custom && (x.name === 'Flagged' || x.schema?.custom?.endsWith(':flagged')));
  return f ? f.id : null;
}

/** Tipos de ticket do projeto (sem subtarefas, a menos que se peça). */
export async function findIssueTypes(request, projectKey, { includeSubtasks = false } = {}) {
  const res = await request(`/rest/api/3/project/${checkProjectKey(projectKey)}`);
  if (!res.ok) throw new Error(`Jira respondeu ${res.status} ao ler o projeto`);
  const project = await res.json();
  return (project.issueTypes || []).filter((t) => includeSubtasks || !t.subtask).map((t) => ({ id: t.id, name: t.name }));
}

/** Busca todos os tickets do JQL (paginação por nextPageToken), até SAFETY_MAX. */
export async function searchAll(request, query, fields) {
  const issues = [];
  let nextPageToken;
  let truncated = false;
  do {
    const res = await request('/rest/api/3/search/jql', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ jql: query, fields, maxResults: PAGE_SIZE, ...(nextPageToken ? { nextPageToken } : {}) }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Jira respondeu ${res.status}: ${text.slice(0, 300)}`);
    }
    const body = await res.json();
    issues.push(...(body.issues || []));
    nextPageToken = body.isLast ? undefined : body.nextPageToken;
    if (issues.length >= SAFETY_MAX && nextPageToken) {
      truncated = true;
      break;
    }
  } while (nextPageToken);
  return { issues: issues.slice(0, SAFETY_MAX), truncated };
}

/** Contagem do Jira para um JQL; null se falhar (o ecrã mostra «–» em vez de um número errado). */
export async function countIssues(request, query) {
  const res = await request('/rest/api/3/search/approximate-count', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ jql: query }),
  });
  if (!res.ok) return null;
  const body = await res.json();
  return typeof body.count === 'number' ? body.count : null;
}

export async function loadProjectData(request, { projectKey, doneWindowDays }) {
  const [flaggedFieldId, types] = await Promise.all([findFlaggedFieldId(request), findIssueTypes(request, projectKey)]);
  const fields = flaggedFieldId ? [...FIELDS, flaggedFieldId] : FIELDS;
  const normalize = (raw) => normalizeIssue(raw, { flaggedFieldId });

  const [wip, done, typeCounts, blockedBacklog] = await Promise.all([
    searchAll(request, jql.wip(projectKey), fields),
    searchAll(request, jql.done(projectKey, doneWindowDays), fields),
    Promise.all(types.map((t) => countIssues(request, jql.backlogOfType(projectKey, t.id)))),
    flaggedFieldId ? countIssues(request, jql.blockedBacklog(projectKey, flaggedFieldId)) : Promise.resolve(0),
  ]);

  const countFailed = typeCounts.some((c) => c === null);
  return {
    wip: wip.issues.map(normalize),
    done: done.issues.map(normalize),
    backlogByType: countFailed ? null : types.map((t, i) => ({ label: t.name, count: typeCounts[i] })).filter((r) => r.count > 0),
    blockedBacklog,
    truncated: wip.truncated || done.truncated,
    hasFlaggedField: Boolean(flaggedFieldId),
  };
}
