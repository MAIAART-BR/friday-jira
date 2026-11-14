# Concorrência: o que as avaliações dizem

Leitura de 14/11/2026, pela API pública do Marketplace (`/rest/2/addons/{app}/reviews` e `/pricing/cloud/live`). Os preços estão em USD, por mês, nas apps Cloud.

## Apps lidas

| App | Fornecedor | Nota | Avaliações (≤ 3★) | Instalações | Preço com 10 utilizadores | Preço por utilizador com 100 |
|---|---|---|---|---|---|---|
| ActionableAgile Analytics | 55 Degrees (Vacanti) | 4,1 | 32 (11) | 1 401 | 14 $ | 1,40 $ |
| Kanban Analytics | Nave | 4,4 | 33 (9) | 971 | 15 $ | 1,50 $ |
| Great Gadgets | StonikByte | 4,5 | 50 (12) | 3 567 | grátis | 1,20 $ |
| WIP Aging Reports (e outras 5 apps, uma por gráfico) | Broken Build | 5,0 | 13 (0) | 1 190 | grátis | 0,55 $ **por app** |
| Time in Status | SaaSJet | 4,5 | 207 (51) | 5 118 | – | – |
| Timepiece (Time in Status) | OBSS | 4,8 | 270 (36) | 4 251 | – | – |
| Kanban Combined WIP | Rauliki | 3,8 | 14 (5) | 218 | – | – |

## Queixas recorrentes (avaliações de 1 a 3★)

### 1. Números em que não se confia
- ActionableAgile, 1★ (2024): «selecionei as etapas para calcular as métricas e a app vai buscar tickets das etapas não selecionadas para o WIP. Resulta num WIP completamente falso.»
- Time in Status, 2★ (2025): «não é claro como os valores são calculados».
- Time in Status, 3★ (2024): os dados não batem certo quando se escolhe um período no calendário.

### 2. Configuração que falha ou não arranca
- ActionableAgile, 1★ (2025): «avariada a maior parte do tempo».
- ActionableAgile, 2★ (2022): «Format Error: Can't parse dates in column "To Do". At least two non-backlog workflow stages are required», seguido de ecrã em branco.
- ActionableAgile, 1★ (2019): «não a consegui pôr a funcionar em meia hora».
- Great Gadgets (2017–2018): erros de filtro nulo e opções que não funcionam no Jira novo.
- Kanban Combined WIP, 1★ (2024): «não funciona nos quadros novos do Jira».

### 3. Difícil de encontrar e sem explicação
- ActionableAgile, 1★ (2018): sem documentação e sem entrada no menu.
- Time in Status (2025): «difícil de encontrar», «documentação e instruções ajudariam muito».

### 4. Lentidão
- Time in Status: lento; cada mudança de configuração leva cerca de 30 s; acima de 10 000 tickets é pesado.

### 5. Preço pouco claro
- Nave (2020–2021, 5 avaliações): «diz que é grátis e não é». A conta é paga à parte, porque a app é vendida fora da Atlassian.
- ActionableAgile (2018): cerca de 20 000 $ no escalão de utilizadores do cliente.

### 6. Bloqueios
- ActionableAgile (2017, 2019): não há forma de marcar tarefas bloqueadas. Pode já estar resolvido; ainda não verifiquei.

## O que os clientes elogiam (avaliações de 4 e 5★)

- **Suporte rápido:** é o tema mais repetido nas três apps.
- **Ver uma equipa num instante,** com destaque para os coaches que entram numa equipa nova (ActionableAgile).
- **Previsão com Monte Carlo** (ActionableAgile, Nave).
- **Sugestões de melhoria e um painel de melhoria do processo fácil de ler** (Nave, 2024–2025).
- **Configurar à medida** (Great Gadgets).

## O que isto muda no FRIDAY

1. **Barato e por módulos não é diferenciador.** A Broken Build já vende uma app por gráfico, grátis até 10 utilizadores e a 0,55 $ por utilizador com 100. A app de envelhecimento já tem zonas de saúde e deteção de trabalho parado. Para competir no preço, o FRIDAY teria de ficar ao nível da Broken Build ou abaixo.
2. **«Diz-me o que fazer» também já existe.** O Nave tem sugestões de melhoria e um painel do processo. A hipótese de 14/11 fica enfraquecida.
3. **O espaço que as queixas deixam livre:** números que batem com o quadro e se explicam, sem configuração e sem avarias. É precisamente onde o FRIDAY já investiu: o seletor de quadro, a definição das colunas, as dicas ⓘ e o «–» quando um valor falha. Falta uma peça: carregar num número e ver os tickets que o compõem.
4. **O suporte pesa mais do que as funcionalidades.** O suporte de um produto de uma só pessoa tem de ser pensado antes de publicar.

## Limites desta leitura

- **Amostras pequenas** (32, 33 e 50 avaliações). Muitas das negativas não têm texto, e várias são de 2017 a 2019, provavelmente já resolvidas.
- **Viés de quem escreve:** quem desinstala raramente avalia, por isso as queixas estão sub-representadas. As notas também estão inflacionadas: o Time in Status pede avaliação logo que a app se abre.
- **Funcionalidades atuais não verificadas:** não testei as versões de hoje do ActionableAgile, do Nave nem da Broken Build. Uma queixa antiga pode já não ser verdade.
- **Não diz o que faz comprar.** Uma queixa mostra o que faz desinstalar; não prova que a confiança nos números leve alguém a pagar. Isso só se confirma a falar com potenciais clientes (item 2 do backlog).
