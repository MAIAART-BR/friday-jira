// Leitura de dados do Jira. Recebe `request(path, init)` para poder ser testada sem o Forge.
import { normalizeIssue } from './core/metrics.js';

export const FIELDS = [
  'summary', 'issuetype', 'assignee', 'status', 'created', 'resolutiondate', 'statuscategorychangedate',
];
export const MAX_ISSUES = 1000;
const PAGE_SIZE = 100;

/** Id do campo «Flagged» (bloqueado) do Jira Software; muda de site para site. */
export async function findFlaggedFieldId(request) {
  const res = await request('/rest/api/3/field');
  if (!res.ok) return null;
  const fields = await res.json();
  const f = fields.find((x) => x.custom && (x.name === 'Flagged' || x.schema?.custom?.endsWith(':flagged')));
  return f ? f.id : null;
}

/** JQL do estado atual: tudo o que está aberto e o que foi resolvido nos últimos N dias. */
export function currentStateJql(projectKey, doneWindowDays) {
  if (!/^[A-Z][A-Z0-9_]+$/.test(projectKey)) throw new Error(`Chave de projeto inválida: ${projectKey}`);
  return `project = "${projectKey}" AND (statusCategory != Done OR resolved >= -${doneWindowDays}d) ORDER BY created DESC`;
}

/**
 * Busca as issues com /rest/api/3/search/jql (paginação por nextPageToken).
 * Pára em MAX_ISSUES e diz se cortou, para a página poder avisar.
 */
export async function searchIssues(request, jql, fields) {
  const issues = [];
  let nextPageToken;
  let truncated = false;
  do {
    const res = await request('/rest/api/3/search/jql', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ jql, fields, maxResults: PAGE_SIZE, ...(nextPageToken ? { nextPageToken } : {}) }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Jira respondeu ${res.status}: ${text.slice(0, 300)}`);
    }
    const body = await res.json();
    issues.push(...(body.issues || []));
    nextPageToken = body.isLast ? undefined : body.nextPageToken;
    if (issues.length >= MAX_ISSUES && nextPageToken) {
      truncated = true;
      break;
    }
  } while (nextPageToken);
  return { issues: issues.slice(0, MAX_ISSUES), truncated };
}

export async function loadProjectIssues(request, { projectKey, siteUrl, doneWindowDays }) {
  const flaggedFieldId = await findFlaggedFieldId(request);
  const fields = flaggedFieldId ? [...FIELDS, flaggedFieldId] : FIELDS;
  const { issues, truncated } = await searchIssues(request, currentStateJql(projectKey, doneWindowDays), fields);
  return {
    issues: issues.map((raw) => normalizeIssue(raw, { flaggedFieldId, siteUrl })),
    truncated,
    hasFlaggedField: Boolean(flaggedFieldId),
  };
}
