// Textos do ecrã em inglês e português. A língua vem do perfil do utilizador no Jira (context.locale).
// Qualquer língua que não seja português mostra inglês.

const en = {
  loading: 'Loading',
  title: (key) => `FRIDAY Flow · ${key}`,
  subtitle: (days) => `Current flow: what is open, in progress, blocked and done in the last ${days} days.`,
  truncated: (max) => `This space has more than ${max} work items in this view; the numbers count only the ${max} most recent.`,
  noFlaggedField: 'This site has no "Flagged" field, so blocked items show as zero.',
  kpiOpen: 'Open',
  kpiBacklog: 'Backlog',
  kpiWip: 'In progress (WIP)',
  kpiBlocked: 'Blocked',
  kpiDone: (days) => `Done (${days} days)`,
  byType: 'Open by type',
  wipByAssignee: 'WIP by assignee',
  noOpen: 'No open work items.',
  noWip: 'No work in progress.',
  unassigned: 'Unassigned',
  noType: 'No type',
  oldestWip: 'Oldest work in progress',
  agingSummary: (p50, p85) => [`Median age: `, p50, ` · 85% of work in progress is at most `, p85, `.`],
  colIssue: 'Work item',
  colSummary: 'Summary',
  colAssignee: 'Assignee',
  colStatus: 'Status',
  colAge: 'Days in progress',
  blocked: 'Blocked',
  emptyTable: 'No work in progress.',
  days: (n) => (n == null ? '–' : n < 1 ? 'less than 1 day' : n === 1 ? '1 day' : `${n} days`),
  errors: {
    LICENSE_INACTIVE: 'The FRIDAY Flow license is not active on this site.',
    NO_PROJECT: 'Open FRIDAY Flow from a Jira space.',
    LOAD_FAILED: 'Could not read the work items in this space. Please try again in a moment.',
    UNKNOWN: 'Could not load FRIDAY Flow.',
  },
};

const pt = {
  loading: 'A carregar',
  title: (key) => `FRIDAY Flow · ${key}`,
  subtitle: (days) => `Estado atual do fluxo: o que está em aberto, em curso, bloqueado e concluído nos últimos ${days} dias.`,
  truncated: (max) => `Este espaço tem mais de ${max} tickets neste filtro; os números contam só os ${max} mais recentes.`,
  noFlaggedField: 'Este site não tem o campo «Flagged»; os bloqueados ficam a zero.',
  kpiOpen: 'Em aberto',
  kpiBacklog: 'Backlog',
  kpiWip: 'Em curso (WIP)',
  kpiBlocked: 'Bloqueado',
  kpiDone: (days) => `Concluído (${days} dias)`,
  byType: 'Em aberto por tipo',
  wipByAssignee: 'WIP por responsável',
  noOpen: 'Sem tickets em aberto.',
  noWip: 'Sem trabalho em curso.',
  unassigned: 'Sem responsável',
  noType: 'Sem tipo',
  oldestWip: 'Trabalho em curso mais antigo',
  agingSummary: (p50, p85) => [`Idade mediana: `, p50, ` · 85% do trabalho em curso tem até `, p85, `.`],
  colIssue: 'Ticket',
  colSummary: 'Resumo',
  colAssignee: 'Responsável',
  colStatus: 'Estado',
  colAge: 'Dias em curso',
  blocked: 'Bloqueado',
  emptyTable: 'Não há trabalho em curso.',
  days: (n) => (n == null ? '–' : n < 1 ? 'menos de 1 dia' : n === 1 ? '1 dia' : `${n} dias`),
  errors: {
    LICENSE_INACTIVE: 'A licença do FRIDAY Flow não está ativa neste site.',
    NO_PROJECT: 'Abra o FRIDAY Flow a partir de um espaço do Jira.',
    LOAD_FAILED: 'Não foi possível ler os tickets deste espaço. Tente de novo dentro de momentos.',
    UNKNOWN: 'Não foi possível carregar o FRIDAY Flow.',
  },
};

export const MESSAGES = { en, pt };

/** «pt_PT», «pt-BR», «pt» → português; tudo o resto → inglês. */
export function languageOf(locale) {
  return /^pt([_-]|$)/i.test(locale || '') ? 'pt' : 'en';
}

export function messagesFor(locale) {
  return MESSAGES[languageOf(locale)];
}

/** Arredonda dias para mostrar: abaixo de 1 fica como está (para «menos de 1»), acima é inteiro. */
export function roundDays(n) {
  return n == null ? null : n < 1 ? n : Math.round(n);
}

/** Célula da tabela: compacta, «< 1» em vez de 0. */
export function daysCell(n) {
  return n == null ? '–' : n < 1 ? '< 1' : String(Math.round(n));
}
