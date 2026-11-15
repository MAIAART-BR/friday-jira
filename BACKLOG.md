# Backlog do FRIDAY para Jira

Nada é implementado sem estar aqui e sem decisão do Artur. A ordem sai do **CD3**: o custo do atraso (CoD) dividido pela duração.

## O produto (decisão de 15/11/2026)

**O objetivo do Artur é vender o seu conhecimento de leitura do fluxo da melhor forma possível.** As equipas têm gráficos mas não tiram conclusões. O trabalho do Artur na CTT mostrou que é possível ensiná-las, mas uma app sozinha não parece ter mercado grande. Por isso, o negócio tem três camadas:

| Camada | O que é | Para que serve |
|---|---|---|
| 1. App no Marketplace | **«O que os seus dados dizem»** (item 5): um ecrã que lê o histórico do quadro e escreve no máximo 4 conclusões, cada uma com o padrão, o que significa, o que fazer e quando não confiar | Montra: prova o método, chega a quem não conhece o Artur e traz contactos. Barata ou grátis até 10 utilizadores. |
| 2. Conteúdo | Publicações e, depois, um curso curto «como ler o seu gráfico» | Autoridade e confiança; recruta pessoas para testar. Custo baixo. |
| 3. Serviços do Artur | Diagnóstico de equipas com a jornada, workshops inspirados no STATIK, orientação de equipas de transformação (CoE) | Onde está o valor por cliente. |

- **A jornada fica primeiro como serviço** (Começar, Onde estamos, sinais, experiências, modo reunião, resumo): itens 6 e 8 a 12. Só passa a produto se o serviço mostrar procura.
- **Teste antes de construir:** 3 publicações no LinkedIn com os padrões da maqueta (`marketing/linkedin-padroes.md`). Se gerarem pedidos, constrói-se o item 5.
- **Maqueta:** `maquete/index.html` (dados fictícios, sem nada da CTT).

### Direção anterior: a jornada como produto (15/11/2026)


**O FRIDAY é a jornada Kanban da equipa.** Por ordem, cobre:
1. por onde começar (STATIK guiado);
2. onde a equipa está (autoavaliação de toda a equipa, com as metáforas do Artur);
3. como ler os gráficos da equipa (a confirmação das respostas pelos dados e os padrões explicados);
4. os próximos passos e experiências com antes e depois.

Ver o `README.md`.

- **Porquê esta direção (15/11/2026):**
  - o Artur acredita que as equipas não percebem o que fazer porque não sabem ler os padrões dos gráficos;
  - na autoavaliação real que fez, a dimensão «Análise de Métricas» ficou quase toda em 2 («às vezes fazemos»). É um sinal, de uma só organização;
  - o método é do Artur e já foi aplicado com equipas;
  - funciona sem histórico, ao contrário do Nave, do ActionableAgile e do TeamRhythm;
  - não encontrei no Marketplace nenhuma app de jornada ou maturidade Kanban.
- **Direção anterior (14/11/2026):** a reunião de melhoria com experiências. Mantém-se, como passo 4.
- **Lições do método aplicado, para o produto:**
  - **respostas apressadas:** 4 de 7 respostas foram preenchidas em 7 a 16 segundos para cerca de 38 perguntas. A app tem de as detetar;
  - **uma só voz por equipa:** houve 1 respondente por equipa, e uma pessoa respondeu por 3. A app pede a resposta de toda a equipa e mostra a divergência;
  - **pontuação sem validação:** somar escalas de 8 dimensões numa percentagem não está validado. Os critérios de cada passo têm de ser explícitos;
  - **os dados validam a autoavaliação:** a confirmação pelos dados é o que dá validade ao método.
- **Maqueta:** `maquete/index.html` (dados fictícios, sem nada da CTT).

## Retomar aqui (fim de 15/11/2026)

**Estado:**
- **Página única e conclusões:** o FRIDAY no site de teste mostra as 4 conclusões no projeto FRIDAY Base (FRIBASE), a partir da base importada em JSON.
- **Modo de demonstração:** feito.
- **Defeito corrigido:** o histórico importado sem fieldId (deploy nº 18).
- **Simulação em tempo real:** desligada.

**Próximos passos para vender:**
- **Claude:**
  1. verificar se o nome «FRIDAY» está livre no Marketplace;
  2. reescrever a listagem (`marketplace/LISTING.md`), a privacidade e o EULA para o produto atual;
  3. preparar as imagens a partir do modo de demonstração;
  4. depois, o pt-BR (item 4), o deploy em produção e a preparação da submissão.
- **Artur:**
  1. publicar o primeiro carrossel (antes, confirmar com a CTT e com a Cristina);
  2. decidir o canal e o prazo de suporte;
  3. criar o perfil de parceiro;
  4. procurar uma equipa piloto (fora da CTT).
- **À espera:** a resposta da Atlassian sobre o preço (ECOHELP-185604).
- **A base FRIBASE dura cerca de 1 semana** (até perto de 22/11). Depois disso, gerar uma base nova com `node scripts/base-friday-json.mjs <pasta>` e importá-la.

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
| 0 | Verificar o uso comercial do KMM e do STATIK com a Kanban University | 2 | 8 | 8 | 18 | 0,2 | **90** | 0 € |
| 1 | Decidir: gratuito ou pago | 3 | 8 | 5 | 16 | 0,2 | **80** | 0 € |
| 2 | Validar o posicionamento com potenciais clientes (com a maqueta) | 5 | 8 | 13 | 26 | 0,5 | **52** | 0 € |
| 3 | Testar com dados reais | 3 | 8 | 13 | 24 | 0,5 | **48** | 0 € |
| 4 | A app na língua do Jira de cada pessoa | 3 | 3 | 2 | 8 | 0,5 | **16** | 0 € |
| 5 | **O que os seus dados dizem** (4 padrões, primeira versão) | 13 | 5 | 8 | 26 | 2,5 | **10,4** | 0 € |
| 6 | Onde estamos: autoavaliação da equipa e confirmação pelos dados | 8 | 3 | 8 | 19 | 2 | **9,5** | ~0 € (respostas por equipa, poucos KB) |
| 7 | Como ler: os outros padrões (versão 1.1 do item 5) | 8 | 2 | 5 | 15 | 2 | **7,5** | 0 € |
| 8 | Começar: STATIK guiado | 8 | 2 | 5 | 15 | 2,5 | **6** | ~0 € |
| 9 | Sinais «Esta quinzena» (3 regras determinísticas) | 8 | 3 | 8 | 19 | 1,5 | **12,7** | 0 € |
| 10 | Experiências com antes e depois | 8 | 3 | 8 | 19 | 2 | **9,5** | ~0 € (guarda poucos KB por equipa) |
| 11 | Modo reunião | 5 | 2 | 3 | 10 | 0,5 | **20** | 0 € |
| 12 | Resumo do mês para a gestão | 5 | 2 | 3 | 10 | 1 | **10** | 0 € |
| 13 | Publicar no Marketplace | 5 | 5 | 8 | 18 | 1,5 | **12** | 0 € |
| ✓ | Limite de 1000 tickets esconde o trabalho em curso | 5 | 8 | 5 | 18 | 0,5 | **36** | ~0 € |

**A ordem segue as dependências e a decisão de 15/11/2026, não só o CD3.** O próximo item a construir é o 5, depois das publicações do item 2. Os itens 6 e 8 a 12 (a jornada) ficam como serviço do Artur até haver procura; o 7 é a versão 1.1 do 5; o 13 é a publicação. O modo reunião (11) tem o CD3 mais alto da jornada, mas só tem conteúdo com os sinais (9) e as experiências (10).

### 0. Verificar o uso comercial do KMM e do STATIK

- **Porquê:** o catálogo de práticas e os níveis do KMM, e o STATIK, são da Kanban University. O método da jornada é do Artur, mas usa partes do KMM. Usá-las num produto pago pode exigir licença.
- **O que fazer:**
  1. ler as regras de uso de marca e de conteúdos da Kanban University;
  2. se não forem claras, perguntar-lhes diretamente;
  3. aproveitar para saber se há interesse em parceria: os coaches acreditados precisam de ferramentas.
- **Plano B:** reescrever as práticas com palavras próprias, sem os códigos (VZ, LW…) nem os nomes dos níveis do KMM.

### 1. Decidir: gratuito ou pago

- **Hipótese:** grátis até 10 utilizadores traz instalações e avaliações; o pago acima disso traz receita. Com um só produto, deixa de haver «módulo grátis» e «módulos pagos».
- **Porquê agora:** bloqueia a publicação (item 3). Se o modelo de pagamento não puder ser mudado depois, uma escolha errada obriga a uma listagem nova.
- **O que fazer:** confirmar o que diz a página «Why can't I change the payment model» da Atlassian e ver os preços dos concorrentes (ver `marketplace/PREPARACAO.md`). A decisão é do Artur.
- **Sinal de que acertámos:** instalações e avaliações nos primeiros 2 meses (se gratuito); primeira venda (se pago).
- **Estado (14/11/2026):** a pesquisa indica que passar de gratuito para «Paid via Atlassian» na mesma listagem não é permitido, mas as fontes não são claras. As edições Standard e Advanced, que permitiriam vender módulos dentro da mesma listagem, só existem para apps «Paid via Atlassian». Recomendação: pago e barato desde o início. **À espera da resposta do suporte da Atlassian: pedido ECOHELP-185604**, enviado a 14/11/2026 (pergunta em `marketplace/PERGUNTA-SUPORTE.md`).
- **Opção nova (14/11/2026):** pago via Atlassian com o escalão de 10 utilizadores a 0 $, como a Great Gadgets e a Broken Build. As equipas pequenas instalam e avaliam, e as maiores pagam. Falta perguntar ao suporte se é permitido numa app nova.

### 2. Validar o posicionamento com potenciais clientes

- **Hipótese em vigor (14/11/2026, terceira):** os coaches e os líderes de equipas Kanban querem saber se a melhoria decidida na reunião resultou, e pagam por uma ferramenta que lhes dá os sinais, a experiência e o antes e depois sem fazerem contas. Ver «O produto», no topo.
- **Hipótese anterior (segunda):** há equipas e empresas que querem o diagnóstico do fluxo que o Nave dá (o próximo passo e porquê, a saúde, os riscos e as tendências), mas que **não podem tirar os dados da Atlassian nem usar IA de terceiros**, ou que não querem negociar o preço com um vendedor. O FRIDAY seria esse diagnóstico, explicado e determinístico, a correr só na Atlassian, com preço público.
- **Primeira hipótese, enfraquecida:** «números que batem com o quadro e se explicam sozinhos» é condição mínima (a Broken Build já mostra os tickets por trás dos números), não razão para comprar. O «intérprete do fluxo» também já existe no Nave (ver `marketplace/CONCORRENCIA.md`, segunda leitura).
- **O que já se sabe (14/11/2026, `marketplace/CONCORRENCIA.md`):**
  - as queixas recorrentes nas avaliações são números em que não se confia, configuração que falha, apps difíceis de encontrar e lentidão;
  - o suporte rápido é o que mais se elogia;
  - a estratégia «barato e por módulos» já existe (Broken Build: grátis até 10 utilizadores, 0,55 $ por utilizador com 100, por app);
  - «diz-me o que fazer» também já existe (o painel de melhoria do processo do Nave).
- **Porquê agora:** define o texto da listagem, o preço (item 1) e o que vem a seguir. Publicar sem isto é publicar mais uma app de gráficos.
- **O que fazer:**
  0. **Primeiro, as publicações (15/11/2026):** publicar as 3 de `marketing/linkedin-padroes.md`, com uma semana de intervalo, e oferecer a maqueta e 30 minutos de conversa a quem pedir. **Critério:** 5 ou mais pedidos para ver isto nos dados da própria equipa, somando as 3 publicações, levam à construção do item 5. Menos de 2 pedidos: repensar antes de construir.
  0. **Maqueta (14/11/2026):** mostrar `maquete/index.html` (Esta quinzena, Experiências, Modo reunião, Resumo do mês) e perguntar pela última reunião de melhoria que fizeram: o que decidiram e se souberam se resultou.
  1. Mostrar o ecrã atual a 5 pessoas que gerem equipas Kanban em Jira e perguntar o que fariam com ele amanhã, o que usam hoje e quanto pagariam. Incluir pessoas de empresas com regras de dados apertadas e perguntar se já foram impedidas de usar o Nave ou outra app parecida por causa dos dados ou da IA.
  2. Experimentar a versão atual do ActionableAgile, do Nave e do WIP Aging da Broken Build no site de teste, para confirmar o que ainda é verdade nas queixas.
  3. Reescrever a frase da listagem com as palavras dos entrevistados.
- **Depende de:** nada. Pode correr em paralelo com o item 1.
- **Nicho de operações e suporte de TI (pesquisa de 14/11/2026, `marketplace/NICHO-OPERACOES.md`):** a dor é reconhecida no ramo (o envelhecimento do backlog é um KPI da HDI e da MetricNet, e há perguntas recorrentes na Atlassian Community), mas a disposição para pagar não está demonstrada: as apps que atacam esta dor diretamente têm 1 a 35 instalações.
- **Sinal de que acertámos:** pelo menos 3 das 5 pessoas descrevem sem ajuda um ganho concreto («isto poupa-me X»). Se nenhuma o fizer, repensar o produto antes de publicar.
- **Ver os tickets por trás de cada número:** passou para o item 5 (cada sinal tem a lista dos tickets).

### 3. Testar com dados reais

- **Hipótese:** a idade do trabalho e o P85 batem certo com a perceção da equipa num projeto com meses de histórico.
- **Porquê agora:** é a maior dúvida. São os números que distinguem o FRIDAY, e nunca foram vistos com dados verdadeiros. Publicar sem os testar arrisca más avaliações logo no início.
- **O que fazer:** instalar o FRIDAY Flow num Jira Cloud com histórico, um projeto real ou o de alguém que aceite testar. Importar tickets por CSV não chega: o Jira não deixa recuar a data da mudança de estado, e é dela que a idade depende.
- **Sinal de que acertámos:** a equipa reconhece os tickets mais antigos e o P85 como «certos».

### 4. A app na língua do Jira de cada pessoa

- **Pedido do Artur (14/11/2026):** a app adapta-se à língua do Jira. Fica à frente do item 5 (CD3 23) por decisão dele, «desde já».
- **Como é hoje:** a app já segue a língua que o Jira usa para cada pessoa (`context.locale`, que vem do perfil ou do browser), mas só tem inglês e português. As outras línguas caem para inglês.
- **Defeito encontrado:** o português da app é de Portugal, mas o Jira Cloud só suporta oficialmente o português do Brasil; o de Portugal está fora da lista desde julho de 2020 ([JRACLOUD-84879](https://jira.atlassian.com/browse/JRACLOUD-84879)). Quase todos os utilizadores de português veem o Jira em pt-BR e recebem o texto da app em pt-PT.
- **O que fazer:**
  1. pt-BR como português por omissão, mantendo o pt-PT para quem tem o Jira em `pt_PT`;
  2. espanhol, francês e alemão;
  3. as restantes línguas do Jira Cloud (cerca de 20) só se houver clientes.
  
  O teste que exige as mesmas chaves em todas as línguas continua a valer.
- **Risco:** as traduções feitas pelo Claude precisam de revisão por quem fala a língua, sobretudo a ajuda com conceitos Kanban. Um texto estranho reduz a confiança.
- **Custo no Forge:** 0 €. O texto vai no código do ecrã.

### 5. O que os seus dados dizem (construído a 15/11/2026, sem deploy)

- **Hipótese:** as equipas têm os gráficos mas não tiram conclusões. Uma leitura escrita do seu próprio quadro, com o que fazer, é suficiente para instalarem e voltarem.
- **O que fazer:** um ecrã com no máximo 4 conclusões, cada uma com o gráfico pequeno, o padrão, o que costuma significar, o que fazer, quando não confiar e uma ligação para aprender a ler o padrão (conteúdo do Artur). Primeira versão, só com dados que a app já carrega:
  1. entra mais trabalho do que sai;
  2. cauda longa no tempo de entrega, com a coluna onde os mais lentos esperaram;
  3. tickets acima do tempo habitual;
  4. bloqueios que duram demais.

  As duas corcovas e o WIP fora dos limites ficam para a versão 1.1.
- **O ecrã atual** passa para um separador «Detalhe».
- **Especificação:** `docs/specs/2026-11-15-o-que-os-seus-dados-dizem.md`.
- **Custo no Forge:** 0 €. Acrescenta o campo Flagged ao pedido de histórico que já existe e não guarda nada.
- **Depende de:** 2 (as publicações). O item 4 (língua) pode ir junto.
- **Decisão do Artur (15/11/2026):** construir já, sem esperar pelas publicações. Depois do deploy nº 15, o Artur pediu uma página só, sem o painel antigo à parte, e um guia do que falta quando não há dados (especificação, secção 8). Feito no mesmo dia. Construído no mesmo dia (ver a especificação, secção 7). Falta o deploy, que só se faz com a autorização dele, e o teste com dados reais (item 3).
- **Sinal de que acertámos:**
  - quem testa diz por palavras suas o que vai fazer a seguir;
  - depois de publicado, a mesma equipa abre a página em 2 semanas diferentes.

### 6. Onde estamos: autoavaliação da equipa e confirmação pelos dados

- **Hipótese:** a equipa aceita o próximo passo quando vê, lado a lado, o que respondeu e o que os dados mostram.
- **O que fazer:**
  - autoavaliação curta, respondida por toda a equipa;
  - o passo da jornada, com a metáfora do Artur;
  - a dispersão das respostas por dimensão;
  - a confirmação de cada dimensão pelos dados do Jira, quando existem («dizem que limitam o WIP; o WIP variou entre 8 e 19»);
  - as respostas apressadas (menos de 30 segundos) ficam de fora e pede-se que sejam refeitas;
  - os 2 ou 3 próximos passos, com o porquê.
- **Atenção:**
  - as perguntas e os critérios de cada passo têm de ser explícitos e defensáveis;
  - o catálogo de práticas do KMM é da Kanban University (item 0).
- **Custo no Forge:** guarda as respostas por equipa, poucos KB. Atualizar a política de privacidade, porque guarda respostas de pessoas.
- **Depende de:** 0 e 2.
- **Sinal de que acertámos:** nas entrevistas, um coach diz que usaria isto em vez da sua folha de cálculo.

### 7. Como ler: os outros padrões (versão 1.1 do item 5)

- **Desde 15/11/2026:** os primeiros 4 padrões passaram para o item 5. Ficam aqui as duas corcovas, o WIP fora dos limites, os bloqueios agrupados e o envelhecimento do backlog.
- **Texto original do item, para referência:**

- **Hipótese:** as equipas não agem porque não sabem ler os padrões. Explicar o padrão no gráfico da própria equipa muda isso.
- **O que fazer:** detetar e explicar cada padrão nos gráficos da equipa, sempre com: o que o gráfico mostra, o padrão, o que costuma significar, o que fazer e quando não se aplica. Primeiros padrões:
  1. duas corcovas no histograma (partir a raia);
  2. cauda longa (onde o trabalho esperou);
  3. WIP fora dos limites naturais (algo mudou);
  4. bloqueios agrupados (rever as políticas);
  5. aging acima do habitual (limpar o backlog).
- **Base:** a tabela de leitura do Artur (moda, mediana, P85, P85–P98), os limites naturais do processo (XmR) e Vacanti (2015).
- **Depende de:** 2 e 3 (testar a deteção com dados reais).
- **Sinal de que acertámos:** nas entrevistas, as pessoas explicam o padrão por palavras suas depois de o ver uma vez.

### 8. Começar: STATIK guiado

- **Hipótese:** as equipas não sabem por onde começar, e um guia passo a passo com resultado numa página resolve o primeiro dia.
- **O que fazer:** perguntas guiadas sobre o propósito, as fontes de insatisfação, os tipos de procura e o fluxo atual. O resultado é uma proposta de quadro e de políticas.
- **Atenção:** o STATIK é um workshop facilitado. A app guia e regista, não substitui o facilitador. O comprador é o coach ou o CoE.
- **Depende de:** 0 e 2.

### 9. Sinais «Esta quinzena»

- **Hipótese:** a equipa percebe e aceita o próximo passo quando vê, numa só frase, o que mudou, o porquê e a fonte.
- **O que fazer:** no máximo 3 sinais por quinzena, por ordem de impacto, cada um com: o que vemos, porquê, o que experimentar, como saber se resultou, a fonte e a lista de tickets por trás. Primeiras regras candidatas:
  1. o WIP a subir com o tempo habitual a subir (Lei de Little);
  2. uma coluna que recebe mais do que entrega (Reinertsen, 2009);
  3. tickets acima do tempo habitual numa coluna;
  4. bloqueios antigos ou a durar mais;
  5. bons sinais, para manter o que resulta.
- **Regras sem IA:** os mesmos dados dão o mesmo resultado, e cada sinal explica-se.
- **Reaproveita:** a idade face ao habitual, os bloqueados, os concluídos por semana, a frase-resumo e o pacote «Confiança» (ver os tickets por trás de cada número), que deixa de ser um item à parte.
- **Depende de:** 2. As regras finais saem das entrevistas.
- **Sinal de que acertámos:** nas entrevistas, as pessoas reconhecem os sinais e dizem o que fariam a seguir.

### 10. Experiências com antes e depois

- **Hipótese:** é isto que o FRIDAY tem e os outros não: a equipa sabe se a mudança resultou, sem fazer contas.
- **O que fazer:**
  - registar a hipótese, a métrica, a duração e quem acompanha;
  - comparar o período antes e depois a partir do histórico do Jira;
  - com menos de 10 concluídos, dizer «ainda não dá para saber».
- **Custo no Forge:** guarda as experiências por quadro, com poucos KB por equipa, dentro da franquia gratuita. Atualizar a política de privacidade.
- **Depende de:** 9.
- **Risco:** comparar antes e depois não prova a causa, porque outras coisas mudam ao mesmo tempo. A app tem de o dizer, e não pode prometer mais do que isso.
- **Sinal de que acertámos:** uma equipa faz a segunda experiência.

### 11. Modo reunião

- **O que fazer:** ecrã inteiro para projetar, com 3 passos (a experiência anterior resultou? os sinais; a próxima experiência) e um temporizador de 30 minutos.
- **Base:** a Service Delivery Review do Método Kanban (Anderson e Carmichael, 2016).
- **Depende de:** 9 e 10.
- **Sinal de que acertámos:** a terceira reunião feita na app. É o indicador de quem fica.

### 12. Resumo do mês para a gestão

- **O que fazer:** texto pronto a copiar com as entregas, o tempo habitual, as experiências e o resultado de cada uma, os riscos e o próximo passo.
- **Responde a:** à dor de PM do Artur («mostrar a saúde do projeto, riscos e tendências»).
- **Depende de:** 10.

### 13. Publicar no Marketplace

- **Hipótese:** coaches e líderes de equipas Kanban procuram uma forma de saber se a melhoria resultou.
- **Depende de:** 0 a 5. A jornada (6 a 12) não é necessária para publicar.
- **O que fazer:** Developer Space, perfil de parceiro, documentos legais publicados, imagens, deploy para production e submissão (ver `marketplace/PREPARACAO.md`). A listagem tem de ser reescrita para o produto novo.
- **Para aprender com quem instala:**
  - escrever ao contacto técnico de cada nova experiência;
  - ler os motivos de desinstalação nos relatórios de parceiro;
  - medir a ativação (a primeira experiência registada) e a permanência (a terceira reunião).
- **Sinal de que acertámos:** a primeira instalação de alguém que não conhecemos, e essa equipa faz uma segunda experiência.

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

## Rejeitados

| Item | Data | Porquê |
|---|---|---|
| Venda por módulos (Flow, Delivery, Forecast, Health como apps separadas) | 14/11/2026 | A Broken Build já vende uma app por gráfico, grátis até 10 utilizadores e a 0,55 $ por utilizador. Passa a haver um só produto, e o que for útil desses módulos entra como sinais. |
| Previsão Monte Carlo (antigo Forecast) | 14/11/2026 | O ActionableAgile, o Nave e a Broken Build já a têm. Pode voltar se as entrevistas o pedirem. |
| Modo stand-up na tabela | 14/11/2026 | Fica em espera: o produto passa a servir a reunião quinzenal, não a diária. |
| Memória de 256 MB e limite de 25 s na função | 14/11/2026 | Poupança zero dentro da franquia gratuita, mais o risco de falta de memória; o `forge lint` não aceita o limite de tempo em funções de páginas. |

## Para acrescentar um item

Uma linha na tabela e uma secção com: hipótese, porquê agora, o que fazer, depende de, sinal de que acertámos, custo no Forge.
