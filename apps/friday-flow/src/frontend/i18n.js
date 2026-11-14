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
    ['Work in progress (WIP)', 'Work that has started but is not finished yet. Here, that is everything between the first column (backlog) and the last column (done) of your board. (Vacanti & Coleman, 2025)'],
    ['Age', 'How long an item has been in progress. It starts when the item enters a WIP column and stops when it reaches the last column. If an item is reopened, its age starts again. (Vacanti & Coleman, 2025)'],
    ['Include time in backlog', 'Turn this on to count age from the day the item was created, including the time it waited in the backlog. Waiting work also costs money. (Reinertsen, 2009)'],
    ['Reference (SLE)', 'A target based on your own past work. FRIDAY Flow looks at the items your team finished in the chosen period and says: “85% of them took X days or less”. If an item in progress is already older than X, it needs attention. (Vacanti & Coleman, 2020)'],
    ['Reference period', 'Choose how far back to look. A short period shows how the team works now. A long period gives a steadier number. With fewer than 10 finished items, the number is not reliable yet.'],
    ['From start or from creation', 'With “Include time in backlog” off, the reference counts from start to finish. With it on, it counts from creation to finish. Age and reference always count from the same point, so you can compare them.'],
    ['Why less WIP helps', 'If the team finishes work at the same pace, having more work in progress means each item takes longer to finish. (Little, 1961, 2011)'],
    ['Blocked', 'Items with a flag in Jira, in any column except the last one.'],
    ['Done (14 days)', 'Items that reached the last column in the last 14 days.'],
    ['Column numbers', 'The same counts Jira shows for your board.'],
  ],
  helpRefs: [
    'Little, J. D. C. (1961). A proof for the queuing formula: L = λW. Operations Research, 9(3), 383–387. https://doi.org/10.1287/opre.9.3.383',
    'Little, J. D. C. (2011). Little’s law as viewed on its 50th anniversary. Operations Research, 59(3), 536–549. https://doi.org/10.1287/opre.1110.0940',
    'Reinertsen, D. G. (2009). The principles of product development flow: Second generation lean product development. Celeritas Publishing.',
    'Vacanti, D., & Coleman, J. (2020). The Kanban Guide (December 2020). https://kanbanguides.org/the-kanban-guide/2020.12',
    'Vacanti, D., & Coleman, J. (2025). The Kanban Guide (May 2025). https://kanbanguides.org/',
  ],
  refLabel: 'Reference (SLE):',
  refOption: (d) => `last ${d} days`,
  refCycle: 'from start to finish',
  refLead: 'from creation to finish',
  refSummary: ({ days, n, p85, p50, metric, above }) =>
    `In the last ${days} days, ${n} work items were finished: 85% took ${p85} or less ${metric}, half took ${p50} or less. ${above === 1 ? '1 item in progress is' : `${above} items in progress are`} already older than ${p85}.`,
  refFew: 'Few finished items: treat this reference with care.',
  refNone: (d) => `No work items were finished in the last ${d} days, so there is no reference yet. Choose a longer period.`,
  refNoBoard: 'Without a board, FRIDAY Flow cannot tell when work started. Turn on “Include time in backlog” to use time from creation, or choose a board.',
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
  colIssue: 'Work item',
  colSummary: 'Summary',
  colAssignee: 'Assignee',
  colStatus: 'Status',
  colAge: 'Days in progress',
  colAgeCreated: 'Days since created',
  toggleBacklog: 'Include time in backlog',
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
    ['Trabalho em curso (WIP)', 'Trabalho que já começou mas ainda não terminou. Aqui, é tudo o que está entre a primeira coluna (backlog) e a última (concluído) do seu quadro. (Vacanti & Coleman, 2025)'],
    ['Idade', 'Há quanto tempo um ticket está em curso. Começa a contar quando o ticket entra numa coluna de WIP e para quando chega à última coluna. Se o ticket for reaberto, a idade recomeça. (Vacanti & Coleman, 2025)'],
    ['Contar o tempo no backlog', 'Ligue para contar a idade desde o dia em que o ticket foi criado, incluindo o tempo à espera no backlog. Trabalho à espera também custa dinheiro. (Reinertsen, 2009)'],
    ['Referência (SLE)', 'Uma meta baseada no vosso próprio trabalho. O FRIDAY Flow olha para os tickets que a equipa terminou no período escolhido e diz: «85% levaram até X dias». Se um ticket em curso já tem mais de X dias, merece atenção. (Vacanti & Coleman, 2020)'],
    ['Período da referência', 'Escolha quanto tempo para trás olhar. Um período curto mostra como a equipa trabalha agora. Um período longo dá um número mais estável. Com menos de 10 tickets concluídos, o número ainda não é fiável.'],
    ['Desde o início ou desde a criação', 'Com «Contar o tempo no backlog» desligado, a referência conta do início ao fim. Ligado, conta da criação ao fim. A idade e a referência contam sempre a partir do mesmo ponto, para as poder comparar.'],
    ['Porque menos WIP ajuda', 'Se a equipa termina trabalho ao mesmo ritmo, ter mais trabalho em curso faz cada ticket demorar mais a terminar. (Little, 1961, 2011)'],
    ['Bloqueado', 'Tickets com bandeira (flag) no Jira, em qualquer coluna exceto a última.'],
    ['Concluído (14 dias)', 'Tickets que chegaram à última coluna nos últimos 14 dias.'],
    ['Números das colunas', 'As mesmas contagens que o Jira mostra no seu quadro.'],
  ],
  helpRefs: [
    'Little, J. D. C. (1961). A proof for the queuing formula: L = λW. Operations Research, 9(3), 383–387. https://doi.org/10.1287/opre.9.3.383',
    'Little, J. D. C. (2011). Little’s law as viewed on its 50th anniversary. Operations Research, 59(3), 536–549. https://doi.org/10.1287/opre.1110.0940',
    'Reinertsen, D. G. (2009). The principles of product development flow: Second generation lean product development. Celeritas Publishing.',
    'Vacanti, D., & Coleman, J. (2020). The Kanban Guide (December 2020). https://kanbanguides.org/the-kanban-guide/2020.12',
    'Vacanti, D., & Coleman, J. (2025). The Kanban Guide (May 2025). https://kanbanguides.org/',
  ],
  refLabel: 'Referência (SLE):',
  refOption: (d) => `últimos ${d} dias`,
  refCycle: 'do início ao fim',
  refLead: 'da criação ao fim',
  refSummary: ({ days, n, p85, p50, metric, above }) =>
    `Nos últimos ${days} dias terminaram ${n} tickets: 85% levaram até ${p85} ${metric}, metade até ${p50}. ${above === 1 ? '1 ticket em curso já passou' : `${above} tickets em curso já passaram`} os ${p85}.`,
  refFew: 'Poucos tickets concluídos: use esta referência com cuidado.',
  refNone: (d) => `Não terminou nenhum ticket nos últimos ${d} dias, por isso ainda não há referência. Escolha um período maior.`,
  refNoBoard: 'Sem quadro, o FRIDAY Flow não sabe quando o trabalho começou. Ligue «Contar o tempo no backlog» para usar o tempo desde a criação, ou escolha um quadro.',
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
  colIssue: 'Ticket',
  colSummary: 'Resumo',
  colAssignee: 'Responsável',
  colStatus: 'Estado',
  colAge: 'Dias em curso',
  colAgeCreated: 'Dias desde a criação',
  toggleBacklog: 'Contar o tempo no backlog',
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
