# Especificação: «O que os seus dados dizem» (item 5 do backlog)

Data: 15/11/2026. Estado: **construído a 15/11/2026, por decisão do Artur, sem deploy.** Falta testar com dados reais (item 3).

## 1. O que é

Um ecrã, o primeiro do FRIDAY no Jira, que lê o histórico do quadro escolhido e escreve **no máximo 4 conclusões** em linguagem simples. O painel atual passa a um separador «Detalhe», sem mudanças.

Cada conclusão tem sempre as mesmas partes:

| Parte | Exemplo |
|---|---|
| Título (o padrão, numa frase) | «Entra mais trabalho do que sai» |
| Gráfico pequeno | barras por semana: começados e concluídos |
| O que o gráfico mostra | «Por semana, quantos itens começaram e quantos terminaram.» |
| O padrão nos seus dados | «Nas últimas 4 semanas começaram 31 itens e terminaram 19.» |
| O que costuma significar | «Com mais itens abertos e a mesma capacidade, cada um espera mais.» |
| O que fazer | «Combinar um limite de trabalho em curso e terminar antes de começar.» |
| Quando não confiar | «Uma semana alta é normal; o sinal é a diferença manter-se 3 ou 4 semanas.» |
| Os tickets | ligação para a lista de tickets por trás da conclusão |
| Aprender | «Aprender a ler este padrão» (ligação para conteúdo do Artur; o URL é configurado no código) |

Sem nenhuma conclusão, o ecrã diz que não encontrou nenhum dos 4 padrões, mostra quantos tickets analisou e em que período, e sugere o separador «Detalhe».

## 2. Os 4 padrões da primeira versão

As regras são **determinísticas**: os mesmos dados dão sempre o mesmo resultado. Os limiares são pontos de partida, a afinar com dados reais (item 3). Cada um é uma constante no código, com nome e comentário.

Notação: `concluídos` = os tickets concluídos no período do Histórico (30, 60, 90 ou 180 dias; 90 por omissão). `cycle` = do início (entrada na primeira coluna em curso) até à conclusão.

### P1. Entra mais trabalho do que sai
- **Dados:** os inícios por semana (`startedAt` dos concluídos e dos em curso) e as conclusões por semana (`doneAt`), nas últimas 4 semanas completas.
- **Dispara quando:**
  - começados ≥ 1,25 × concluídos;
  - a diferença é de pelo menos 4 itens;
  - em pelo menos 3 das 4 semanas, começaram mais itens do que terminaram.
- **Não dispara se:** houver menos de 8 conclusões nas 4 semanas (poucos dados).
- **Gráfico:** barras agrupadas por semana (começados, concluídos).
- **Tickets:** os itens começados no período e ainda em curso.
- **Limite conhecido:** um ticket que começou e voltou ao backlog não conta como começado. Fica dito em «Quando não confiar».

### P2. Cauda longa no tempo de entrega
- **Dados:** o `cycle` dos concluídos.
- **Dispara quando:**
  - há pelo menos 20 concluídos;
  - P95 ≥ 4 × P50.
- **Onde esperaram:** para os 5 concluídos mais lentos, soma o tempo em cada coluna a partir do histórico de estados (que já é carregado). Mostra a coluna com mais tempo somado e a parte do tempo total que lá passaram («3 dos 5 passaram mais de metade do tempo em "À espera de QA"»).
- **Gráfico:** histograma do `cycle`, com a linha do P85.
- **Tickets:** os 5 mais lentos, com a coluna onde mais esperaram.

### P3. Tickets acima do tempo habitual
- **Dados:** a idade dos em curso face ao P85 do `cycle` dos concluídos (o «tempo habitual», já calculado).
- **Dispara quando:**
  - há pelo menos 10 concluídos (a regra que a app já usa para o alerta vermelho);
  - pelo menos 1 ticket em curso está acima do P85.
- **Texto:** quantos estão acima, em que colunas e qual o mais antigo. Se mais de metade estiver na mesma coluna, diz qual.
- **Gráfico:** as bandas por coluna que já existem (habitual, a ficar lento, lento).
- **Tickets:** os acima do P85, do mais antigo para o mais novo.

### P4. Bloqueios que duram demais
- **Dados:** os tickets em curso com Flagged e há quanto tempo estão com Flagged. A data do bloqueio vem do histórico: é preciso **acrescentar o campo Flagged ao pedido de histórico** (`fieldIds` em `fetchStatusHistories`). É a única alteração ao que é carregado.
- **Dispara quando:** pelo menos 1 ticket em curso está bloqueado há 3 dias ou mais.
- **Sem campo Flagged no site:** o padrão não é avaliado e o ecrã diz porquê.
- **Gráfico:** lista com os dias de bloqueio por ticket.
- **Tickets:** os bloqueados, do mais antigo para o mais novo.

### Ordem e limite
- **Ordem:** P1, P2, P3, P4. Do sistema (tudo fica mais lento) para o ticket (este está parado).
- **Limite:** no máximo 4, por isso todos cabem na primeira versão.

## 3. Onde fica o código

| Ficheiro | O quê |
|---|---|
| `packages/core/src/findings.js` (novo) | As 4 regras como funções puras: recebem itens normalizados e a referência e devolvem `{ id, fired, facts, items }`. Nenhum texto: os textos ficam no ecrã, na língua do utilizador. |
| `packages/core/test/findings.test.js` (novo) | Para cada padrão: dispara, não dispara, poucos dados e casos limite (exatamente no limiar). |
| `apps/friday-flow/src/board.js` | Acrescentar o campo Flagged ao pedido de histórico; tempo por coluna dos 5 mais lentos; `findings` na vista. |
| `apps/friday-flow/src/flow.js` | Sem quadro, as conclusões não são calculadas: sem colunas não há início do trabalho nem histórico. O ecrã diz para escolher um quadro e mostra o detalhe. (Mudança face ao plano: menos código e nenhuma conclusão a meias.) |
| `apps/friday-flow/src/frontend/index.jsx` | Separadores «O que os seus dados dizem» e «Detalhe» (componente `Tabs` do UI Kit), com um cartão por conclusão. |
| `apps/friday-flow/src/frontend/i18n.js` | Textos em inglês e português (o teste exige as mesmas chaves). Se o item 4 for feito ao mesmo tempo, em pt-BR por omissão. |

## 4. O que não muda

- Os números continuam a seguir o quadro: filtro, colunas e o P85 dos concluídos.
- Não guarda dados novos. A política de privacidade não muda.
- Não envia nada para fora da Atlassian. A ligação «Aprender» é aberta pela pessoa, num separador novo.

## 5. Como saber se está certo antes do deploy

1. `npm test` com os testes novos.
2. **Cenários no site de teste** (`scripts/criar-cenarios-jira.mjs`): acrescentar um cenário por padrão, que o dispara, e um que não dispara.
3. **Validação local com CSV** (`scripts/validar-csv.mjs`): acrescentar a saída dos 4 padrões, para comparar com a leitura do Artur nos dados que ele conhece.
4. Deploy em development só com a autorização do Artur.

## 6. Estimativa

| Parte | Semanas |
|---|---|
| Regras e testes no núcleo | 0,5 |
| Histórico do Flagged e tempo por coluna | 0,5 |
| Ecrã, separadores e textos | 1 |
| Cenários e validação | 0,5 |
| **Total** | **2,5** |

## 7. O que foi construído (15/11/2026)

- **Núcleo:** `packages/core/src/findings.js`, com as 4 regras, `timeInStatuses` e `flaggedSince`; 18 testes.
- **Dados:** `board.js` pede o campo Flagged no mesmo pedido de histórico, guarda `flaggedSince` nos tickets em curso e `timeInColumns` nos concluídos, e devolve `findings` e `analysed` na vista. 2 testes novos.
- **Ecrã:** separadores «O que os seus dados dizem» e «Detalhe». Cada conclusão é um cartão com o padrão nos dados, o gráfico (começados e concluídos por semana; histograma da cauda), o que significa, o que fazer, os tickets (até 5, com ligação) e quando não confiar.
- **Textos:** em inglês e português (`find` em `i18n.js`), testados nas duas línguas.
- **Ligação «Aprender»:** a constante `LEARN_URLS` em `index.jsx` está vazia, até haver conteúdo publicado.
- **Por fazer antes de publicar:**
  - cenários no site de teste, um por padrão;
  - saída dos padrões no `validar-csv`;
  - deploy em development, depois de o Artur autorizar.

## 8. Uma página só (15/11/2026, decisão do Artur depois de ver o deploy nº 15)

Com dois separadores, o painel antigo ficava intacto e o separador novo quase vazio. O Artur esperava que o painel antigo fosse reformatado ou desaparecesse. Passa a haver **uma página só**:

1. **Topo:** o título, o seletor de quadro, as definições (⚙) e a ajuda (?). A idade e o histórico saíram da barra e foram para as definições.
2. **Uma frase:** quantas coisas pedem atenção, ou que está tudo dentro do habitual, ou que faltam dados.
3. **Os números numa linha,** em vez dos 4 cartões: em curso, bloqueados, concluídos esta semana e tempo habitual.
4. **As conclusões,** cada uma com o gráfico que a explica. A idade por coluna passou para «acima do habitual», as entregas por semana para «dentro do habitual».
5. **Guia «O que o FRIDAY precisa para ler este quadro»** (pedido do Artur: «que o guie para conseguir ter o que precisa»). Cada ponto diz o que existe, o que falta e como resolver:
   - as colunas de início e fim, com botão para mudar;
   - os concluídos com início conhecido face aos 20 necessários, como os conseguir e quantas semanas faltam ao ritmo atual, com botão para usar 180 dias;
   - os concluídos das últimas 4 semanas;
   - o campo Flagged e como sinalizar;
   - o histórico incompleto.
6. **Exemplo marcado:** quando nenhum padrão pode ser avaliado, aparece um cartão de exemplo com dados fictícios e o selo «Exemplo».
7. **Dentro do habitual:** uma linha por padrão avaliado que não disparou, mais as entregas por semana. A página nunca fica vazia.
8. **«Ver todos os tickets em curso»:** a tabela antiga, escondida por omissão.

Sem quadro, a página explica como escolher ou criar um.

## 9. Modo de demonstração (15/11/2026)

- **O que é:** um quadro fictício, calculado pelo mesmo código que lê os dados reais: as mesmas regras e a mesma vista. Não lê nada do Jira.
- **Onde se ativa:** no botão «Ver o FRIDAY com dados de demonstração», no guia (quando faltam dados) e no aviso de falta de quadro.
- **No ecrã:** um aviso «Dados de demonstração» no topo, com «Voltar ao meu quadro». Os tickets DEMO-n não têm ligação. As definições do quadro ficam escondidas.
- **Dados:** `packages/core/src/demo.js` é o mesmo plano da base de teste no Jira (FRIBASE), simulado como se tivesse começado há 45 dias. Dispara os 4 padrões (testado).
- **Para quê:** ver o produto inteiro sem histórico, mostrá-lo nas entrevistas e dar a quem instala a app algo para ver no primeiro minuto.
