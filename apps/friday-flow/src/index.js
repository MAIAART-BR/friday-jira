import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { loadProjectData, checkProjectKey, SAFETY_MAX } from './jira.js';
import { buildFlowView, DONE_WINDOW_DAYS } from './flow.js';

const resolver = new Resolver();

// asUser: a página só mostra o que o utilizador já pode ver no Jira.
// O caminho é sempre uma das constantes de jira.js; o JQL vai no corpo do POST.
const request = (path, init) => api.asUser().requestJira(toRoute(path), init);

function toRoute(path) {
  if (path === '/rest/api/3/field') return route`/rest/api/3/field`;
  if (path === '/rest/api/3/search/jql') return route`/rest/api/3/search/jql`;
  if (path === '/rest/api/3/search/approximate-count') return route`/rest/api/3/search/approximate-count`;
  const project = /^\/rest\/api\/3\/project\/([A-Z][A-Z0-9_]+)$/.exec(path);
  if (project) return route`/rest/api/3/project/${checkProjectKey(project[1])}`;
  throw new Error(`Caminho não previsto: ${path}`);
}

// Com licensing.enabled, o Jira envia a licença no contexto das instalações de produção.
// Em desenvolvimento e staging não há licença: deixa passar.
export function licenseIsInactive(context) {
  const lic = context?.license;
  if (!lic) return false;
  const active = lic.isActive ?? lic.active;
  return active === false;
}

resolver.define('getFlowView', async ({ context }) => {
  if (licenseIsInactive(context)) return { error: 'LICENSE_INACTIVE' };
  const projectKey = context?.extension?.project?.key;
  if (!projectKey) return { error: 'NO_PROJECT' };
  try {
    const data = await loadProjectData(request, { projectKey, doneWindowDays: DONE_WINDOW_DAYS });
    return {
      projectKey,
      truncated: data.truncated,
      limit: SAFETY_MAX,
      hasFlaggedField: data.hasFlaggedField,
      ...buildFlowView(data),
    };
  } catch (e) {
    console.error(e);
    return { error: 'LOAD_FAILED' };
  }
});

export const handler = resolver.getDefinitions();
