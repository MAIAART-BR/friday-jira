# Nicho A: equipas de operações e suporte de TI em Jira

Pesquisa de 14/11/2026. A pergunta: a dor «o que está parado na fila, porquê e o que fazer primeiro» faz sentido neste ramo, e alguém paga para a resolver?

## 1. A dor é reconhecida no ramo

- **Backlog e envelhecimento do backlog são KPIs habituais do service desk.**
  - A HDI e a MetricNet (Jeff Rumburg) definem o backlog como os tickets em aberto num momento e dividem-no por idade: menos de 10 dias, 10 a 30, mais de 30.
  - Rumburg afirma que só publicar o relatório de backlog o reduz em 50% ou mais. A afirmação não vem acompanhada de dados.
  - Fonte: [HDI, Metric of the Month: Ticket Backlog](https://www.thinkhdi.com/library/supportworld/2020/metric-of-month-ticket-backlog).
- **A BMC** trata os incidentes com mais de 14 dias como envelhecidos, com a meta de menos de 30% dos abertos. É recomendação de um fornecedor, não referência do setor ([BMC](https://blogs.bmc.com/5-key-performance-indicators-high-performance-service-desk/)).
- **DeGrandis (2017),** *Making Work Visible* (IT Revolution), vem do mundo das operações de TI: relatório de envelhecimento, relatório de WIP, revisão mensal das operações com métricas de fluxo. **Por verificar no livro:** as definições exatas, porque só li resumos.

## 2. As pessoas perguntam e improvisam

- **Fórum de Jira Service Management da Atlassian Community:** a pergunta repete-se de 2018 a 2026:
  - «vista consolidada da idade dos tickets»;
  - «idade média do backlog»;
  - «quanto tempo um ticket fica aberto»;
  - «idade corrente de um ticket ainda aberto» (2026).
- **As respostas apontam para relatórios genéricos** (Average Age, Time to resolution) ou para apps de *Time in Status*. Não encontrei um relatório nativo de envelhecimento por estado.

## 3. Onde está o dinheiro hoje

| Tipo de app | Exemplos (instalações) | Para que serve |
|---|---|---|
| Time in Status | Bloompeak Free (10 509), SaaSJet (5 118), Timepiece (4 251) | Tempo por estado, SLA e também faturação de horas. Tabelas cruas. |
| Relatórios para JSM | Advanced Portal Reports (1 389), view26 (892), ITSM Reports (578) | Relatórios **para os clientes** do service desk e SLA. |
| BI genérico | eazyBI (10 580), Custom Charts (7 652) | Tudo, com configuração. |

As avaliações destas apps elogiam sobretudo a **automatização dos relatórios para clientes** e o **SLA**, não a melhoria do fluxo.

## 4. Quem já tentou exatamente este nicho

| App | Instalações | Avaliações | Preço |
|---|---|---|---|
| Queue Aging Heatmap (Earlywick), v4.6.0 de 12/08/2026: «veja que fila está a apodrecer» | **1** | 0 | grátis até 10 utilizadores; 0,30 $ por utilizador com 100 |
| Time in Status Gadget: Aging & Stuck Issues | 23 | 1 | – |
| Metrics and Reports for JSM (inclui envelhecimento) | 35 | 3 | – |
| Status Aging Alerts | – | – | – |

**É o sinal mais importante da pesquisa.** Há quem já tenha feito a proposta quase palavra por palavra («veja que fila está a apodrecer, carregue e veja os tickets, configura em menos de 1 minuto»), e ninguém instala. Há três explicações possíveis, e os dados não permitem escolher entre elas:
1. **Não há procura** suficiente para pagar por isto em separado.
2. **Há procura, mas ninguém encontra estas apps.** A distribuição no Marketplace é difícil para apps novas.
3. **As apps são recentes** e ainda não tiveram tempo.

## 5. Viabilidade técnica

- O `jira:projectPage` funciona em projetos de Service Management e aparece no menu lateral ([Forge, Jira project page](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-project-page/)).
- Há também um módulo de página dentro das filas ([Forge, JSM queue page](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-service-management-queue-page)). Seria o sítio mais natural para este público.
- Os projetos de Service Management usam filas, não quadros. O FRIDAY cai hoje para as categorias de estado, que já vimos que enganam. Seria preciso ler os estados do fluxo de trabalho e o SLA (API do Service Management).

## Conclusão

- **A dor existe e é reconhecida.** É um KPI do ramo, há perguntas recorrentes e as soluções atuais são improvisadas.
- **A disposição para pagar não está demonstrada.** As apps que atacam esta dor diretamente têm 1 a 35 instalações, e o dinheiro do ramo vai para o SLA, para os relatórios a clientes e para o BI genérico.
- **Não conhecer pessoas no ramo agrava o risco:** sem entrevistas, não conseguimos distinguir as três explicações da secção 4.

## Limites

- **Fontes secundárias:** as fontes do ramo são em parte blogs de fornecedores. O livro de DeGrandis e as tabelas da MetricNet não foram lidos no original.
- **Instalações não são vendas:** os números do Marketplace não dizem quantas instalações são pagas.
- **Pouca profundidade:** não li as avaliações negativas das apps de relatórios para JSM a fundo.
