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
| 2 | Testar com dados reais | 3 | 8 | 13 | 24 | 0,5 | **48** | 0 € |
| 3 | Publicar o Flow no Marketplace | 5 | 5 | 8 | 18 | 1,5 | **12** | 0 € |
| 4 | Módulo FRIDAY Delivery | 5 | 2 | 3 | 10 | 2 | **5** | 0 € |
| 5 | Módulo FRIDAY Forecast | 8 | 2 | 3 | 13 | 4 | **3,3** | ~0 € (a calcular) |
| 6 | Módulo FRIDAY Health | 5 | 1 | 2 | 8 | 3 | **2,7** | 0 € |

### 1. Decidir: Flow gratuito ou pago

- **Hipótese:** um Flow gratuito traz instalações e avaliações; os módulos pagos trazem receita.
- **Porquê agora:** bloqueia a publicação (item 3). Se o modelo de pagamento não puder ser mudado depois, uma escolha errada obriga a uma listagem nova.
- **O que fazer:** confirmar o que diz a página «Why can't I change the payment model» da Atlassian e ver os preços dos concorrentes (ver `marketplace/PREPARACAO.md`). A decisão é do Artur.
- **Sinal de que acertámos:** instalações e avaliações nos primeiros 2 meses (se gratuito); primeira venda (se pago).
- **Estado (14/11/2026):** a pesquisa indica que passar de gratuito para «Paid via Atlassian» na mesma listagem não é permitido, mas as fontes não são claras. As edições Standard e Advanced, que permitiriam vender módulos dentro da mesma listagem, só existem para apps «Paid via Atlassian». Recomendação: pago e barato desde o início. **À espera da resposta do suporte da Atlassian** (pergunta em `marketplace/PERGUNTA-SUPORTE.md`).

### 2. Testar com dados reais

- **Hipótese:** a idade do trabalho e o P85 batem certo com a perceção da equipa num projeto com meses de histórico.
- **Porquê agora:** é a maior dúvida. São os números que distinguem o FRIDAY, e nunca foram vistos com dados verdadeiros. Publicar sem os testar arrisca más avaliações logo no início.
- **O que fazer:** instalar o FRIDAY Flow num Jira Cloud com histórico, um projeto real ou o de alguém que aceite testar. Importar tickets por CSV não chega: o Jira não deixa recuar a data da mudança de estado, e é dela que a idade depende.
- **Sinal de que acertámos:** a equipa reconhece os tickets mais antigos e o P85 como «certos».

### 3. Publicar o Flow no Marketplace

- **Hipótese:** há equipas Kanban à procura disto no Marketplace.
- **Depende de:** 1 e 2.
- **O que fazer:** Developer Space, perfil de parceiro, documentos legais publicados, imagens, deploy para production, submissão (ver `marketplace/PREPARACAO.md`).
- **Sinal de que acertámos:** a primeira instalação de alguém que não conhecemos.

### 4 a 6. Módulos seguintes

Ficam atrás de propósito: sem saber se alguém instala o Flow, construir mais módulos é apostar às cegas. Cada um acrescenta uma listagem, uma revisão de segurança e suporte próprios. Reavaliar quando houver dados do item 3.

- **Delivery:** os cálculos de throughput e lead time já estão no núcleo, por isso é o mais curto.
- **Forecast:** é o que mais diferencia face à concorrência, mas é o mais longo. Precisa de histórico de mudanças de estado e de simulação Monte Carlo, e o custo no Forge tem de ser calculado antes de começar.
- **Health:** depende do guia KMM do FRIDAY original.

## Rejeitados

| Item | Data | Porquê |
|---|---|---|
| Memória de 256 MB e limite de 25 s na função | 14/11/2026 | Poupança zero dentro da franquia gratuita, mais o risco de falta de memória; o `forge lint` não aceita o limite de tempo em funções de páginas. |

## Para acrescentar um item

Uma linha na tabela e uma secção com: hipótese, porquê agora, o que fazer, depende de, sinal de que acertámos, custo no Forge.
