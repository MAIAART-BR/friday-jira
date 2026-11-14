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
    ['Work item age', '“Time since start for an unfinished item” (Vacanti & Coleman, 2025). By default, FRIDAY Flow counts age from the last time the work item moved into a WIP column, read from its history; reopening a done item starts its age again. Age stops when the item reaches the last column.'],
    ['Include time in backlog', 'Some teams count age from the moment a work item is created, because work waiting in the backlog also has a cost: invisible, unmanaged queues are a root cause of poor product development performance (Reinertsen, 2009). Turn on “Include time in backlog” to count from creation. Each person chooses, and the choice is remembered in each space.'],
    ['Reference (SLE)', 'A Service Level Expectation forecasts how long a work item should take from start to finish, as a time and a probability, for example “85% finish in 8 days or less”. It should be based on historical cycle time, and teams use it as a reference so that work items do not age unnecessarily (Vacanti & Coleman, 2020). FRIDAY Flow takes the work items finished in the chosen period and shows how long 85% of them took (P85) and half of them took (median). A work item in progress that is already older than the P85 is at risk: 85% of past work finished sooner.'],
    ['Reference period', 'The guide warns that there is no guarantee the past will repeat. A shorter period follows how the team works now but has fewer items; a longer one is steadier but slower to show change. With fewer than 10 finished items, the page warns that the reference is weak. Each person chooses the period, and the choice is remembered in each space.'],
    ['Cycle time and lead time', 'With “Include time in backlog” off, the reference is cycle time: from the first WIP column to the last column. With it on, it is lead time: from creation to the last column. Age and reference always use the same start, so they can be compared.'],
    ['Why WIP matters', 'Little’s Law: in a stable system, the average number of items in the system equals the average arrival rate times the average time each item spends in it (Little, 1961, 2011). With the same delivery rate, more work in progress means each item takes longer to finish.'],
    ['Blocked', 'Work items flagged in Jira, in any column except the last one.'],
    ['Done (14 days)', 'Work items that reached the last column in the last 14 days.'],
    ['Column counts', 'Each column shows Jira’s own count for that board’s filter, the same number Jira shows in a search.'],
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
    ['Trabalho em curso (WIP)', '«Trabalho começado mas não terminado» (Vacanti & Coleman, 2025). No FRIDAY Flow, o WIP é tudo o que está nas colunas entre a primeira (backlog) e a última (concluído) do quadro escolhido. Não usamos as categorias de estado do Jira: uma coluna como «Selected for Development» está em «A fazer» no Jira, mas a equipa já se comprometeu com esse trabalho.'],
    ['Idade do item', '«Tempo desde o início, para um item não terminado» (Vacanti & Coleman, 2025). Por omissão, o FRIDAY Flow conta a idade desde a última vez que o ticket entrou numa coluna de WIP, lida no histórico do ticket; reabrir um ticket concluído recomeça a idade. A idade para quando o ticket chega à última coluna.'],
    ['Contar o tempo no backlog', 'Algumas equipas contam a idade desde a criação do ticket, porque o trabalho à espera no backlog também tem custo: filas de espera invisíveis e mal geridas são uma causa de fundo do mau desempenho no desenvolvimento de produto (Reinertsen, 2009). Ligue «Contar o tempo no backlog» para contar desde a criação. Cada pessoa escolhe, e a escolha fica guardada em cada espaço.'],
    ['Referência (SLE)', 'Uma Service Level Expectation é uma previsão de quanto tempo um item deve levar do início ao fim, com um prazo e uma probabilidade, por exemplo «85% terminam em 8 dias ou menos». Deve basear-se no cycle time histórico, e a equipa usa-a como referência para os itens não envelhecerem sem necessidade (Vacanti & Coleman, 2020). O FRIDAY Flow pega nos tickets concluídos no período escolhido e mostra quanto tempo levaram 85% deles (P85) e metade deles (mediana). Um ticket em curso que já é mais velho do que o P85 está em risco: 85% do trabalho passado terminou antes.'],
    ['Período da referência', 'O guia avisa que não há garantia de que o passado se repita. Um período mais curto segue a forma como a equipa trabalha agora, mas tem menos tickets; um mais longo é mais estável, mas demora mais a mostrar mudanças. Com menos de 10 tickets concluídos, a página avisa que a referência é fraca. Cada pessoa escolhe o período, e a escolha fica guardada em cada espaço.'],
    ['Cycle time e lead time', 'Com «Contar o tempo no backlog» desligado, a referência é o cycle time: da primeira coluna de WIP à última coluna. Ligado, é o lead time: da criação à última coluna. A idade e a referência usam sempre o mesmo ponto de partida, para poderem ser comparadas.'],
    ['Porque o WIP importa', 'Lei de Little: num sistema estável, o número médio de itens no sistema é igual à taxa média de chegada vezes o tempo médio que cada item lá passa (Little, 1961, 2011). Com a mesma taxa de entrega, mais trabalho em curso faz cada item demorar mais a terminar.'],
    ['Bloqueado', 'Tickets com «Flagged» no Jira, em qualquer coluna exceto a última.'],
    ['Concluído (14 dias)', 'Tickets que chegaram à última coluna nos últimos 14 dias.'],
    ['Contagens das colunas', 'Cada coluna mostra a contagem do próprio Jira para o filtro do quadro, o mesmo número que o Jira mostra numa pesquisa.'],
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
