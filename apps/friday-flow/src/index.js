import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { kvs } from '@forge/kvs';
import { loadProjectData, checkProjectKey, SAFETY_MAX } from './jira.js';
import { buildFlowView, DONE_WINDOW_DAYS } from './flow.js';
import { listBoards, readBoard, loadBoardData, buildBoardView } from './board.js';
import { countBy, agingViews, referenceTimes } from './core/metrics.js';

const resolver = new Resolver();

// asUser: a página só mostra o que o utilizador já pode ver no Jira.
// Só estes caminhos são aceites; o JQL vai sempre no corpo do POST.
const request = (path, init) => api.asUser().requestJira(toRoute(path), init);

export function toRoute(path) {
  if (path === '/rest/api/3/field') return route`/rest/api/3/field`;
  if (path === '/rest/api/3/changelog/bulkfetch') return route`/rest/api/3/changelog/bulkfetch`;
  if (path === '/rest/api/3/search/jql') return route`/rest/api/3/search/jql`;
  if (path === '/rest/api/3/search/approximate-count') return route`/rest/api/3/search/approximate-count`;
  let m = /^\/rest\/api\/3\/project\/([A-Z][A-Z0-9_]+)$/.exec(path);
  if (m) return route`/rest/api/3/project/${checkProjectKey(m[1])}`;
  m = /^\/rest\/api\/3\/filter\/(\d+)$/.exec(path);
  if (m) return route`/rest/api/3/filter/${m[1]}`;
  m = /^\/rest\/api\/3\/issue\/([A-Z][A-Z0-9_]+-\d+)\/changelog\?startAt=(\d+)&maxResults=100$/.exec(path);
  if (m) return route`/rest/api/3/issue/${m[1]}/changelog?startAt=${m[2]}&maxResults=100`;
  m = /^\/rest\/agile\/1\.0\/board\/(\d+)\/configuration$/.exec(path);
  if (m) return route`/rest/agile/1.0/board/${m[1]}/configuration`;
  m = /^\/rest\/agile\/1\.0\/board\?projectKeyOrId=([A-Z][A-Z0-9_]+)&startAt=(\d+)&maxResults=50$/.exec(path);
  if (m) return route`/rest/agile/1.0/board?projectKeyOrId=${checkProjectKey(m[1])}&startAt=${m[2]}&maxResults=50`;
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

// Quadro escolhido por cada pessoa, em cada espaço. Uma escrita só quando a pessoa muda de quadro.
const choiceKey = (context, projectKey) => `board:${context.accountId || 'anon'}:${projectKey}`;
// Escolhas de cada pessoa, em cada espaço: contar o tempo no backlog na idade; período da referência (SLE).
const backlogTimeKey = (context, projectKey) => `agebacklog:${context.accountId || 'anon'}:${projectKey}`;
const referenceKey = (context, projectKey) => `refdays:${context.accountId || 'anon'}:${projectKey}`;
export const REFERENCE_OPTIONS = [30, 60, 90, 180];
export const DEFAULT_REFERENCE_DAYS = 90;
const validReference = (d) => (REFERENCE_OPTIONS.includes(Number(d)) ? Number(d) : DEFAULT_REFERENCE_DAYS);

function guard(context) {
  if (licenseIsInactive(context)) return { error: 'LICENSE_INACTIVE' };
  const projectKey = context?.extension?.project?.key;
  if (!projectKey) return { error: 'NO_PROJECT' };
  return { projectKey };
}

resolver.define('getBoards', async ({ context }) => {
  const g = guard(context);
  if (g.error) return g;
  try {
    const [boards, includeBacklog, referenceDays] = await Promise.all([
      listBoards(request, g.projectKey),
      kvs.get(backlogTimeKey(context, g.projectKey)).catch(() => undefined),
      kvs.get(referenceKey(context, g.projectKey)).catch(() => undefined),
    ]);
    const saved = boards.length ? await kvs.get(choiceKey(context, g.projectKey)).catch(() => undefined) : undefined;
    const selectedId = boards.some((b) => b.id === saved) ? saved : boards[0]?.id ?? null;
    return { projectKey: g.projectKey, boards, selectedId, includeBacklog: includeBacklog === true, referenceDays: validReference(referenceDays), referenceOptions: REFERENCE_OPTIONS };
  } catch (e) {
    console.error(e);
    // Sem acesso aos quadros (por exemplo, um espaço que não é de software): segue sem quadro.
    return { projectKey: g.projectKey, boards: [], selectedId: null, includeBacklog: false, referenceDays: DEFAULT_REFERENCE_DAYS, referenceOptions: REFERENCE_OPTIONS };
  }
});

resolver.define('getFlowView', async ({ payload, context }) => {
  const g = guard(context);
  if (g.error) return g;
  const { projectKey } = g;
  const referenceDays = validReference(payload?.referenceDays);
  try {
    if (payload?.boardId) {
      if (payload.remember) await kvs.set(choiceKey(context, projectKey), Number(payload.boardId)).catch((e) => console.error(e));
      const board = await readBoard(request, payload.boardId);
      const data = await loadBoardData(request, board, { projectKey, doneWindowDays: DONE_WINDOW_DAYS, referenceDays });
      return {
        mode: 'board',
        projectKey,
        truncated: data.truncated,
        limit: SAFETY_MAX,
        hasFlaggedField: data.hasFlaggedField,
        ...buildBoardView(data, { countBy, agingViews, referenceTimes }, new Date(), DONE_WINDOW_DAYS, referenceDays),
      };
    }
    const data = await loadProjectData(request, { projectKey, doneWindowDays: DONE_WINDOW_DAYS, referenceDays });
    return {
      mode: 'project',
      projectKey,
      truncated: data.truncated,
      limit: SAFETY_MAX,
      hasFlaggedField: data.hasFlaggedField,
      ...buildFlowView(data, new Date(), referenceDays),
    };
  } catch (e) {
    console.error(e);
    return { error: payload?.boardId ? 'BOARD_FAILED' : 'LOAD_FAILED' };
  }
});

resolver.define('saveBacklogTime', async ({ payload, context }) => {
  const g = guard(context);
  if (g.error) return g;
  await kvs.set(backlogTimeKey(context, g.projectKey), payload?.includeBacklog === true);
  return { ok: true };
});

resolver.define('saveReferenceDays', async ({ payload, context }) => {
  const g = guard(context);
  if (g.error) return g;
  await kvs.set(referenceKey(context, g.projectKey), validReference(payload?.referenceDays));
  return { ok: true };
});

export const handler = resolver.getDefinitions();
