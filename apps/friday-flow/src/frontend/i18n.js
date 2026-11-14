// Textos do ecrã em inglês e português. A língua vem do perfil do utilizador no Jira (context.locale).
// Qualquer língua que não seja português mostra inglês.

const en = {
  loading: 'Loading',
  title: (key) => `FRIDAY Flow · ${key}`,
  subtitle: (days) => `Current flow: what is open, in progress, blocked and done in the last ${days} days.`,
  truncated: (max) => `More than ${max} work items are in progress or were recently done; only the first ${max} are included.`,
  backlogUnavailable: 'Jira did not return the backlog count, so Open and Backlog are not shown. Please reload the page.',
  countFailed: 'Jira did not return some of the column counts, so they show as –. Please reload the page.',
  helpButton: 'How we count',
  helpTitle: 'How FRIDAY Flow counts',
  helpClose: 'Close',
  helpReferences: 'References',
  helpSections: [
    ['Work in progress (WIP)', '“Work started but not finished” (Vacanti & Coleman, 2025). In FRIDAY Flow, WIP is every work item in the columns between the first column (backlog) and the last one (done) of the selected board. We do not use Jira’s status categories for this: a column such as “Selected for Development” is To Do in Jira, but the team has already committed to that work.'],
    ['Work item age', '“Time since start for an unfinished item” (Vacanti & Coleman, 2025). In FRIDAY Flow, age counts from the last time the work item moved into a WIP column, read from its history. Reopening a done item starts its age again.'],
    ['Median and P85', 'Half of the work in progress is at most the median age; 85% is at most the P85 age. Items older than the P85 are the first ones to look at.'],
    ['Why WIP matters', 'Little’s Law: in a stable system, the average number of items in the system equals the average arrival rate times the average time each item spends in it (Little, 1961, 2011). With the same delivery rate, more work in progress means each item takes longer to finish.'],
    ['Blocked', 'Work items flagged in Jira, in any column except the last one.'],
    ['Done (14 days)', 'Work items that reached the last column in the last 14 days.'],
    ['Column counts', 'Each column shows Jira’s own count for that board’s filter, the same number Jira shows in a search.'],
  ],
  helpRefs: [
    'Little, J. D. C. (1961). A proof for the queuing formula: L = λW. Operations Research, 9(3), 383–387. https://doi.org/10.1287/opre.9.3.383',
    'Little, J. D. C. (2011). Little’s law as viewed on its 50th anniversary. Operations Research, 59(3), 536–549. https://doi.org/10.1287/opre.1110.0940',
    'Vacanti, D., & Coleman, J. (2025). The Kanban Guide (May 2025). https://kanbanguides.org/',
  ],
  boardLabel: 'Board',
  boardHelp: 'The numbers follow this board: its filter and its columns.',
  ageApprox: 'Jira did not return the history of some work items; their age counts from creation.',
  noBoards: 'This space has no board, so the numbers use Jira status categories (To Do, In Progress, Done).',
  wipLimit: (max) => `limit ${max}`,
  wipColumn: 'WIP',
  byTypeBoard: 'Open on the board by type',
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
    BOARD_FAILED: 'Could not read this board. You may not have access to its filter. Choose another board or ask a Jira admin.',
  },
};

const pt = {
  loading: 'A carregar',
  title: (key) => `FRIDAY Flow · ${key}`,
  subtitle: (days) => `Estado atual do fluxo: o que está em aberto, em curso, bloqueado e concluído nos últimos ${days} dias.`,
  truncated: (max) => `Há mais de ${max} tickets em curso ou concluídos recentemente; só os primeiros ${max} entram nas contas.`,
  backlogUnavailable: 'O Jira não devolveu a contagem do backlog, por isso Em aberto e Backlog não aparecem. Recarregue a página.',
  countFailed: 'O Jira não devolveu algumas contagens das colunas, por isso aparecem como –. Recarregue a página.',
  helpButton: 'Como contamos',
  helpTitle: 'Como o FRIDAY Flow conta',
  helpClose: 'Fechar',
  helpReferences: 'Referências',
  helpSections: [
    ['Trabalho em curso (WIP)', '«Trabalho começado mas não terminado» (Vacanti & Coleman, 2025). No FRIDAY Flow, o WIP é tudo o que está nas colunas entre a primeira (backlog) e a última (concluído) do quadro escolhido. Não usamos as categorias de estado do Jira: uma coluna como «Selected for Development» está em «A fazer» no Jira, mas a equipa já se comprometeu com esse trabalho.'],
    ['Idade do item', '«Tempo desde o início, para um item não terminado» (Vacanti & Coleman, 2025). No FRIDAY Flow, a idade conta desde a última vez que o ticket entrou numa coluna de WIP, lida no histórico do ticket. Reabrir um ticket concluído recomeça a idade.'],
    ['Mediana e P85', 'Metade do trabalho em curso tem até a idade mediana; 85% tem até a idade P85. Os itens mais velhos do que o P85 são os primeiros a olhar.'],
    ['Porque o WIP importa', 'Lei de Little: num sistema estável, o número médio de itens no sistema é igual à taxa média de chegada vezes o tempo médio que cada item lá passa (Little, 1961, 2011). Com a mesma taxa de entrega, mais trabalho em curso faz cada item demorar mais a terminar.'],
    ['Bloqueado', 'Tickets com «Flagged» no Jira, em qualquer coluna exceto a última.'],
    ['Concluído (14 dias)', 'Tickets que chegaram à última coluna nos últimos 14 dias.'],
    ['Contagens das colunas', 'Cada coluna mostra a contagem do próprio Jira para o filtro do quadro, o mesmo número que o Jira mostra numa pesquisa.'],
  ],
  helpRefs: [
    'Little, J. D. C. (1961). A proof for the queuing formula: L = λW. Operations Research, 9(3), 383–387. https://doi.org/10.1287/opre.9.3.383',
    'Little, J. D. C. (2011). Little’s law as viewed on its 50th anniversary. Operations Research, 59(3), 536–549. https://doi.org/10.1287/opre.1110.0940',
    'Vacanti, D., & Coleman, J. (2025). The Kanban Guide (May 2025). https://kanbanguides.org/',
  ],
  boardLabel: 'Quadro',
  boardHelp: 'Os números seguem este quadro: o filtro e as colunas dele.',
  ageApprox: 'O Jira não devolveu o histórico de alguns tickets; a idade deles conta desde a criação.',
  noBoards: 'Este espaço não tem quadro, por isso os números usam as categorias de estado do Jira (A fazer, Em curso, Concluído).',
  wipLimit: (max) => `limite ${max}`,
  wipColumn: 'WIP',
  byTypeBoard: 'Em aberto no quadro, por tipo',
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
    BOARD_FAILED: 'Não foi possível ler este quadro. Pode não ter acesso ao filtro dele. Escolha outro quadro ou fale com um administrador do Jira.',
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
