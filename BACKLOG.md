# Backlog do FRIDAY para Jira

Nada é implementado sem estar aqui e sem decisão do Artur. A ordem sai do **CD3**: o custo do atraso (CoD) dividido pela duração.

## Como se avalia

**Custo do atraso (CoD)** = soma de três componentes, cada uma numa escala relativa (1, 2, 3, 5, 8, 13):

| Componente | Pergunta |
|---|---|
| Valor (V) | Quanto vale para clientes e receitas, quando estiver feito? |
| Urgência (U) | Quanto se perde por cada semana de atraso? Bloqueia outra coisa? |
| Risco e aprendizagem (R) | Que dúvida grande elimina, ou que oportunidade abre? |

- **Duração (D):** semanas de trabalho, contando o do Artur e o meu. O tempo à espera da Atlassian conta na urgência, não na duração.
- **Custo de correr no Forge:** estimativa mensal. Hoje é 0 € para tudo o que está aqui, dentro da franquia gratuita; volta a ser calculado quando um item guardar dados ou fizer cálculos pesados.
- **CD3 = CoD ÷ D.** Quanto maior, mais cedo se faz.

**Os números são estimativas** do Claude, de 14/11/2026, sem dados de clientes. São para corrigir pelo Artur e rever sempre que houver dados novos: um teste, a primeira instalação, a primeira venda.

## Prioridades

| # | Item | V | U | R | CoD | D (sem.) | CD3 | Forge |
|---|---|---|---|---|---|---|---|---|
| 1 | Decidir: Flow gratuito ou pago | 3 | 8 | 5 | 16 | 0,2 | **80** | 0 € |
| 2 | Validar o posicionamento com potenciais clientes | 5 | 8 | 13 | 26 | 0,5 | **52** | 0 € |
| 3 | Testar com dados reais | 3 | 8 | 13 | 24 | 0,5 | **48** | 0 € |
| 4 | Publicar o Flow no Marketplace | 5 | 5 | 8 | 18 | 1,5 | **12** | 0 € |
| 5 | Módulo FRIDAY Delivery | 5 | 2 | 3 | 10 | 2 | **5** | 0 € |
| 6 | Módulo FRIDAY Forecast | 8 | 2 | 3 | 13 | 4 | **3,3** | ~0 € (a calcular) |
| 7 | Módulo FRIDAY Health | 5 | 1 | 2 | 8 | 3 | **2,7** | 0 € |
| ✓ | Limite de 1000 tickets esconde o trabalho em curso | 5 | 8 | 5 | 18 | 0,5 | **36** | ~0 € |

### 1. Decidir: Flow gratuito ou pago

- **Hipótese:** um Flow gratuito traz instalações e avaliações; os módulos pagos trazem receita.
- **Porquê agora:** bloqueia a publicação (item 3). Se o modelo de pagamento não puder ser mudado depois, uma escolha errada obriga a uma listagem nova.
- **O que fazer:** confirmar o que diz a página «Why can't I change the payment model» da Atlassian e ver os preços dos concorrentes (ver `marketplace/PREPARACAO.md`). A decisão é do Artur.
- **Sinal de que acertámos:** instalações e avaliações nos primeiros 2 meses (se gratuito); primeira venda (se pago).
- **Estado (14/11/2026):** a pesquisa indica que passar de gratuito para «Paid via Atlassian» na mesma listagem não é permitido, mas as fontes não são claras. As edições Standard e Advanced, que permitiriam vender módulos dentro da mesma listagem, só existem para apps «Paid via Atlassian». Recomendação: pago e barato desde o início. **À espera da resposta do suporte da Atlassian: pedido ECOHELP-185604**, enviado a 14/11/2026 (pergunta em `marketplace/PERGUNTA-SUPORTE.md`).

### 2. Validar o posicionamento com potenciais clientes

- **Hipótese:** quem gere equipas Kanban em Jira paga por números que batem com o quadro e se explicam sozinhos, sem configuração. Hoje não temos nenhuma razão forte para comprar o FRIDAY em vez do ActionableAgile, do Nave ou da Broken Build.
- **O que já se sabe (14/11/2026, `marketplace/CONCORRENCIA.md`):**
  - as queixas recorrentes nas avaliações são números em que não se confia, configuração que falha, apps difíceis de encontrar e lentidão;
  - o suporte rápido é o que mais se elogia;
  - a estratégia «barato e por módulos» já existe (Broken Build: grátis até 10 utilizadores, 0,55 $ por utilizador com 100, por app);
  - «diz-me o que fazer» também já existe (o painel de melhoria do processo do Nave).
- **Porquê agora:** define o texto da listagem, o preço (item 1) e o que vem a seguir. Publicar sem isto é publicar mais uma app de gráficos.
- **O que fazer:**
  1. Mostrar o ecrã atual a 5 pessoas que gerem equipas Kanban em Jira e perguntar o que fariam com ele amanhã, o que usam hoje e quanto pagariam.
  2. Experimentar a versão atual do ActionableAgile, do Nave e do WIP Aging da Broken Build no site de teste, para confirmar o que ainda é verdade nas queixas.
  3. Reescrever a frase da listagem com as palavras dos entrevistados.
- **Depende de:** nada. Pode correr em paralelo com o item 1.
- **Sinal de que acertámos:** pelo menos 3 das 5 pessoas descrevem sem ajuda um ganho concreto («isto poupa-me X»). Se nenhuma o fizer, repensar o produto antes de publicar.
- **Candidato a funcionalidade, só se a validação o confirmar:** carregar num número e ver os tickets que o compõem, com o motivo de cada um contar.

### 3. Testar com dados reais

- **Hipótese:** a idade do trabalho e o P85 batem certo com a perceção da equipa num projeto com meses de histórico.
- **Porquê agora:** é a maior dúvida. São os números que distinguem o FRIDAY, e nunca foram vistos com dados verdadeiros. Publicar sem os testar arrisca más avaliações logo no início.
- **O que fazer:** instalar o FRIDAY Flow num Jira Cloud com histórico, um projeto real ou o de alguém que aceite testar. Importar tickets por CSV não chega: o Jira não deixa recuar a data da mudança de estado, e é dela que a idade depende.
- **Sinal de que acertámos:** a equipa reconhece os tickets mais antigos e o P85 como «certos».

### 4. Publicar o Flow no Marketplace

- **Hipótese:** há equipas Kanban à procura disto no Marketplace.
- **Depende de:** 1, 2 e 3.
- **O que fazer:** Developer Space, perfil de parceiro, documentos legais publicados, imagens, deploy para production, submissão (ver `marketplace/PREPARACAO.md`).
- **Sinal de que acertámos:** a primeira instalação de alguém que não conhecemos.

### Limite de 1000 tickets esconde o trabalho em curso (confirmado e corrigido)

- **Confirmado a 14/11/2026:** com 1014 tickets no projeto de teste, o FRIDAY Flow mostrava 0 em curso e 0 bloqueados, quando havia 7 e 2.
- **Correção:** o trabalho em curso e os concluídos recentes são carregados por inteiro; o backlog só é contado, por tipo.
- **Decisões do Artur na mesma altura:**
  - só as tarefas mãe contam, as subtarefas não;
  - bloqueado no backlog conta como bloqueado;
  - contar tudo, sem exceções.
- **Custo no Forge:** mais alguns pedidos ao Jira por visita (um por tipo de ticket), dentro da franquia gratuita.

### Números iguais aos do quadro (feito, por testar no Jira)

- **Porquê:** o Artur já desinstalou uma app cujos números não batiam com o quadro. É uma questão de confiança.
- **Decisões (14/11/2026):**
  - um seletor de quadro bem visível, que lembra a escolha de cada pessoa;
  - números por coluna do quadro;
  - as subtarefas contam se o quadro as mostrar.
- **Custo:** cerca de 1 s a mais por visita (~0,5 GB-s). A franquia gratuita continua a cobrir cerca de 100 000 visitas por mês.
- **Consequências:** 4 permissões novas (a instalação tem de ser atualizada) e a app passa a guardar a escolha do quadro. A privacidade e a listagem já foram atualizadas.

### WIP pela posição das colunas, idade pelo histórico, ajuda com fontes (feito, por testar no Jira)

- **Porquê:** as categorias de estado do Jira enganam («Selected for Development» é «A fazer», mas já é trabalho assumido).
- **Decisões do Artur (14/11/2026):**
  - o WIP é tudo o que está entre a primeira e a última coluna;
  - uma ajuda com fontes de confiança, referenciadas;
  - um seletor de quadro mais moderno e limpo.
- **Custo no Forge:** um pedido a mais por visita (histórico em lote). Se o lote falhar, há um pedido por ticket em curso, no máximo 8 em paralelo. Continua dentro da franquia gratuita.

### Idade com ou sem o tempo no backlog (feito, por testar no Jira)

- **Decisão do Artur (14/11/2026):** cada pessoa escolhe se a idade conta o tempo no backlog, porque o backlog também tem custo.
- **Como funciona:** um interruptor «Contar o tempo no backlog» junto à tabela; a escolha fica guardada por pessoa e espaço. As duas idades são calculadas de uma vez, por isso mudar o interruptor não volta a pedir dados ao Jira.
- **Fontes da ajuda:** The Kanban Guide (sem o backlog) e Reinertsen (2009), sobre o custo das filas de espera (com o backlog).
- **Também:** espaço por cima do título, que estava colado à barra de separadores do Jira.

### P85 a partir dos concluídos, com período configurável (feito, por testar no Jira)

- **Problema:** o P85 era calculado a partir da idade dos itens em curso, o mesmo erro que o FRIDAY original já tinha corrigido (ver o PROJECT_BOARD do FRIDAY).
- **Correção:** a referência (SLE) vem dos tickets concluídos no período escolhido. Com o interruptor desligado usa o cycle time (do início ao fim); ligado, o lead time (da criação ao fim). A página mostra quantos tickets em curso já passaram o P85.
- **Decisão do Artur (14/11/2026):** o período é configurável (30, 60, 90 ou 180 dias; 90 por omissão), com a explicação e as fontes na ajuda (The Kanban Guide 2020: SLE).
- **Por decidir:** marcar a vermelho, na tabela, os tickets acima do P85. Os dados já vêm calculados (`above`).
- **Custo no Forge:** o histórico dos concluídos do período, no mesmo pedido em lote. Com 180 dias pode haver centenas de tickets, mas continua dentro da franquia gratuita.

### Onde o trabalho começa e acaba, 4 cartões e controlo de idade (feito, por validar pelo Artur)

- **Erro corrigido:** com a coluna especial de backlog dos quadros Kanban (vazia), a regra «primeira coluna = backlog» punha o «Backlog» no WIP (WIP 1011 em vez de 7).
- **Regra:** por omissão, as colunas vazias do início e do fim são ignoradas. Uma definição por quadro («O trabalho começa em / termina em»), para toda a equipa, segue o The Kanban Guide (cada equipa define o início e o fim).
- **Ecrã:**
  - 4 cartões: Em curso, Acima da referência, Bloqueado, Concluído (14 dias);
  - as contagens por coluna passam a um gráfico, com os limites de WIP;
  - a idade escolhe-se com um controlo «Desde o início | Desde a criação»;
  - ajuda e definições como ícones, com dica ao passar o rato.
- **Por rever com o Artur:** no modo quadro, o gráfico «Em aberto por tipo» deu lugar ao «Por coluna».

### Revisão por 5 agentes e decisões de 15/11/2026 (feito, por validar pelo Artur)

**Como se decidiu:** 5 agentes reviram o dashboard (clareza, métricas Kanban, cliente do Marketplace, texto e acessibilidade, correção dos dados). Foi adotado o que 3 ou mais encontraram de forma independente. Os defeitos objetivos foram adotados sempre.

- **Adotado (3+ votos):**
  - a tabela marca e mostra primeiro os tickets acima da referência, com a coluna do quadro;
  - a idade por coluna em bandas (habitual, a ficar lento, acima), só com as colunas em curso, e o backlog numa nota;
  - uma barra de filtros única (quadro, idade, referência);
  - uma linha curta da referência, sem jargão;
  - o alerta vermelho só com 10 ou mais concluídos;
  - um nome por conceito.
- **Defeitos corrigidos:**
  - uma só fonte para o WIP (os carregados);
  - uma contagem falhada aparece como «–», não 0;
  - os concluídos vêm ordenados (ORDER BY);
  - o histórico cortado deixa de ser silencioso;
  - acabaram os pedidos por tipo sem uso no modo quadro;
  - sem campo Flagged, aparece «–»;
  - o texto («menos de 1 dia», rótulos das listas, «por omissão», sem «vosso»).
- **Decisões do Artur:**
  1. As colunas Done | Released nunca contam como em curso: as colunas «Concluído» no Jira encostadas à última passam a concluído.
  2. As subtarefas contam como o quadro as mostra; sem quadro, contam todas (os mesmos números que o Jira).
  3. Concluídos por semana (12 semanas), com uma explicação curta.
  4. «WIP por responsável» retirado.
  5. Bloqueados com a parte do backlog à vista («3 · 1 no backlog»).

### Ajuda junto a cada número e frase-resumo (feito, por validar pelo Artur)

- **Pedido do Artur (15/11/2026):** a ajuda era uma janela com 11 secções que ninguém lê à primeira; as explicações têm de aparecer ao passar o rato.
- **Feito:**
  - um ícone ⓘ com dica em cada cartão, filtro, gráfico e na tabela;
  - a janela «Sobre o FRIDAY Flow» passa a 4 secções curtas, com as fontes;
  - uma frase no topo diz o que precisa de atenção («2 tickets estão mais lentos do que o habitual (mais de 8 dias). Comece por FRIDEMO-4.»).
- **Decidido (15/11/2026):** o cartão passa a «Concluídos esta semana», igual à última barra de «Concluídos por semana», com a semana passada ao lado. Fica só o Histórico como período à parte.

### 5 a 7. Módulos seguintes

Ficam atrás de propósito: sem saber se alguém instala o Flow, construir mais módulos é apostar às cegas. Cada um acrescenta uma listagem, uma revisão de segurança e suporte próprios. Reavaliar quando houver dados dos itens 2 e 4.

- **Delivery:** os cálculos de throughput e lead time já estão no núcleo, por isso é o mais curto.
- **Forecast:** o ActionableAgile, o Nave e a Broken Build já fazem Monte Carlo, por isso diferencia menos do que se pensava. Mesmo assim, é um dos pontos mais elogiados nas avaliações. É o mais longo: precisa de histórico de mudanças de estado e de simulação Monte Carlo, e o custo no Forge tem de ser calculado antes de começar.
- **Health:** depende do guia KMM do FRIDAY original.

## Rejeitados

| Item | Data | Porquê |
|---|---|---|
| Memória de 256 MB e limite de 25 s na função | 14/11/2026 | Poupança zero dentro da franquia gratuita, mais o risco de falta de memória; o `forge lint` não aceita o limite de tempo em funções de páginas. |

## Para acrescentar um item

Uma linha na tabela e uma secção com: hipótese, porquê agora, o que fazer, depende de, sinal de que acertámos, custo no Forge.
