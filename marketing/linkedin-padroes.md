# 3 publicações no LinkedIn: padrões que as equipas não leem

Objetivo: testar se as pessoas querem ajuda para ler os próprios gráficos, e encontrar quem queira testar o FRIDAY. Ver o `BACKLOG.md`, item 2.

## Como publicar e medir

- **Ritmo:** uma publicação por semana, de terça a quinta, de manhã.
- **Imagem:** o gráfico do padrão, tirado do separador «Como ler» da maqueta (`maquete/index.html`, dados fictícios). Nada da CTT.
- **Língua:** português do Brasil. Se quiser chegar também ao público em inglês, publique a versão em inglês uns dias depois e meça à parte.
- **O que registar em cada publicação, 7 dias depois:**

| Publicação | Data | Impressões | Reações | Comentários | Partilhas | Mensagens privadas | Pedidos para testar |
|---|---|---|---|---|---|---|---|
| 1. Cauda longa | | | | | | | |
| 2. Entra mais do que sai | | | | | | | |
| 3. Duas corcovas | | | | | | | |

- **Critério de decisão (item 2):**
  - **5 ou mais pedidos** para ver isto nos dados da própria equipa, somando as 3 publicações: avançar com o item 5;
  - **menos de 2:** repensar antes de construir.

  As reações não contam: são baratas.
- **A quem pedir:** responda com a maqueta e proponha 30 minutos de conversa. Na conversa, pergunte pelo passado: «Da última vez que olharam para um gráfico destes, o que decidiram?»

---

## Publicação 1: cauda longa

A maioria das equipes que acompanho tem um gráfico de tempo de entrega. Quase ninguém olha para a parte direita dele.

É lá que fica a cauda: os poucos itens que levaram semanas quando a maioria leva dias. Num histograma, aparece como uma rampa que desce devagar para a direita.

A tentação é achar que esses itens eram difíceis. Na minha experiência, quase nunca é isso. Quando abrimos os 5 mais demorados, eles ficaram esperando: por outra equipe, por uma decisão, por um ambiente, por alguém que voltou de férias. O trabalho em si levou pouco tempo.

Por isso, a pergunta útil não é «por que demoramos tanto?», e sim «onde esses itens ficaram parados?». Se a resposta for a mesma coluna em 3 dos 5 casos, você encontrou por onde começar.

Quando não se preocupar: toda equipe que faz trabalho de conhecimento tem alguma cauda. O sinal é a cauda crescer de um mês para o outro.

Estou construindo uma forma de fazer essa leitura automaticamente nos dados do Jira. Se quiser ver isso nos dados da sua equipe, me mande uma mensagem.

---

## Publicação 2: entra mais do que sai

Se a sua equipe começa mais trabalho do que termina, ela vai ficar mais lenta. Não por preguiça nem por falta de competência: por aritmética.

Funciona assim. Cada item começado e não terminado fica esperando a sua vez. Com a mesma capacidade de entrega e mais itens abertos, cada um espera mais. É a Lei de Little, de 1961, e vale para filas de banco, de hospital e de software.

O gráfico que mostra isso é simples: por semana, quantos itens entraram em andamento e quantos foram concluídos. Quando a barra de entrada fica acima da de saída por várias semanas seguidas, o tempo de entrega vai subir nas semanas seguintes, mesmo que ninguém tenha mudado nada.

O que fazer: parar de começar e começar a terminar. Na prática, combinar um limite para o trabalho em andamento e respeitar esse limite antes de puxar algo novo.

Quando não se preocupar: uma semana com muita entrada é normal, como depois de um planejamento. O sinal é a diferença se manter por 3 ou 4 semanas.

Estou construindo uma forma de fazer essa leitura automaticamente nos dados do Jira. Se quiser ver isso nos dados da sua equipe, me mande uma mensagem.

---

## Publicação 3: duas corcovas

Já viu um histograma de tempo de entrega com duas montanhas? Uma perto de 5 dias e outra perto de 30, com um vale no meio?

Isso quase sempre quer dizer que há dois tipos de trabalho misturados na mesma raia, e que eles se comportam de forma muito diferente. Pedidos pequenos e projetos. Correções e melhorias. Coisas que dependem só da equipe e coisas que dependem de fora.

O problema é a previsão. Se você diz ao cliente «85% dos itens ficam prontos em até 30 dias», está errado para os dois tipos: os pequenos ficam prontos muito antes, e os grandes muitas vezes passam disso.

O que fazer: separar a raia em duas e acompanhar o tempo de cada uma. A previsão de cada tipo fica mais honesta, e a equipe consegue combinar prazos diferentes para coisas diferentes.

Quando não confiar: com menos de 30 itens, duas montanhas podem ser acaso. Confirme nos meses seguintes antes de mudar o quadro.

Estou construindo uma forma de fazer essa leitura automaticamente nos dados do Jira. Se quiser ver isso nos dados da sua equipe, me mande uma mensagem.

---

## Notas

- **«Na minha experiência»** refere-se ao trabalho de orientação de equipas do Artur. Não cite a CTT nem números da CTT sem autorização.
- **Duas corcovas** é um padrão da versão 1.1 (item 7). Se a publicação 3 for a que gera mais pedidos, isso é um argumento para a antecipar.
- **Fonte da publicação 2:** Little, J. D. C. (1961). A proof for the queuing formula L = λW. *Operations Research, 9*(3), 383–387. https://doi.org/10.1287/opre.9.3.383

---

# English versions (15/11/2026)

Same measurement table and decision rule as above, recorded separately for the English posts.

## Post 1: the long tail

Most teams I work with have a delivery time chart. Almost nobody looks at the right-hand side of it.

That's where the tail lives: the few items that took weeks when most take days. On a histogram, it shows up as a slope that fades slowly to the right.

The temptation is to assume those items were hard. In my experience, that's rarely the case. When we open the 5 slowest, we find they were waiting: for another team, for a decision, for an environment, for someone back from holiday. The work itself took very little time.

So the useful question isn't "why did this take so long?" but "where did these items sit still?" If the answer is the same column in 3 out of 5 cases, you've found where to start.

When not to worry: every team doing knowledge work has some tail. The signal is a tail that grows from one month to the next.

I'm building a way to do this reading automatically on Jira data. If you'd like to see it on your team's data, send me a message.

## Post 2: more work coming in than going out

If your team starts more work than it finishes, it will get slower. Not because of laziness or lack of skill. Because of arithmetic.

Here's how it works. Every item that's started but not finished waits for its turn. With the same delivery capacity and more items open, each one waits longer. That's Little's Law, from 1961, and it holds for bank queues, hospitals and software alike.

The chart that shows it is simple: per week, how many items were started and how many were finished. When the "started" bar sits above the "finished" bar for several weeks in a row, delivery times will rise in the weeks that follow, even if nobody changed anything.

What to do: stop starting, start finishing. In practice, agree on a limit for work in progress and respect it before pulling anything new.

When not to worry: one heavy week is normal, for example right after planning. The signal is a gap that holds for 3 or 4 weeks.

I'm building a way to do this reading automatically on Jira data. If you'd like to see it on your team's data, send me a message.

## Post 3: two humps

Have you ever seen a delivery time histogram with two hills? One around 5 days and another around 30, with a valley in between?

That almost always means two kinds of work are mixed in the same lane, and they behave very differently. Small requests and projects. Fixes and improvements. Things that depend only on the team and things that depend on someone else.

The problem is forecasting. If you tell your customer "85% of items are done within 30 days", you're wrong for both kinds: the small ones finish much sooner, and the big ones often take longer.

What to do: split the lane in two and track each one's delivery time. Each forecast becomes more honest, and the team can agree on different expectations for different kinds of work.

When not to trust it: with fewer than 30 items, two hills can be chance. Confirm over the next months before changing your board.

I'm building a way to do this reading automatically on Jira data. If you'd like to see it on your team's data, send me a message.

---

# English versions with real experience (v2, 15/11/2026)

Images: `marketing/imagens/post-1.png`, `post-2.png`, `post-3.png` (1200 × 1200, illustrative data; source in `posts.html`).
First comment on each post: the link to the article "Transforming CTT with STATIK-inspired Workshops" (public, March 2025).

**Attention:** the sentences marked [internal] come from internal team data. They are rounded and the team is not named, but get the company's OK before publishing them, or use the alternative in brackets.

## Post 1: the long tail

Last year I looked at the delivery times of a team I was coaching. Half of their work was done in about 3 days. Good news, right?

Then I looked at the right-hand side of the chart. [internal] The slowest 2% had taken the better part of a year. [Alternative: A handful of items had taken months.]

That's the long tail. On a histogram, it's the slope that fades slowly to the right, and almost nobody looks at it.

So we opened those items one by one. None of them was hard. They had been waiting: for another team, for a supplier, for a decision nobody owned. The actual work was a few days. The rest was queue.

Two things changed after that conversation. The team started showing time spent in external queues on the board, so waiting stopped being invisible. And they began agreeing on response times with the teams they depended on.

Across the 45 teams in that program, the ones that adopted these practices cut their queues by 55% within a few months.

The useful question isn't "why did this take so long?" It's "where did it sit still?" If the answer is the same place in 3 out of 5 cases, you know where to start.

When not to worry: every team doing knowledge work has some tail. The signal is a tail that grows from one month to the next.

I'm turning this way of reading into a Jira app. If you'd like to see it on your team's data, send me a message.

## Post 2: more work coming in than going out

For a year and a half, a colleague and I guided 45 teams, about 150 people, through a Kanban program. One pattern showed up again and again: teams starting more work than they finished.

Nobody does this on purpose. A request arrives, it's urgent, someone starts it. Then another. The board fills up and everyone is busy. And delivery gets slower.

It's not lack of effort. It's arithmetic. Every started item waits for its turn, and with the same capacity and more open items, each one waits longer. That's Little's Law, from 1961.

The chart that shows it is simple: per week, how many items started and how many finished. When "started" stays above "finished" for 3 or 4 weeks, delivery times rise a few weeks later, even if nobody changed anything.

What helped most was not a new tool. It was agreeing on a limit for work in progress and respecting it before pulling anything new. Some teams also cleaned out the oldest items sitting in their backlog, which turned out to be more freeing than they expected.

In the teams that adopted these practices, delivery time dropped about 20% and throughput grew 15 to 17% within a few months. At portfolio level, deliveries that used to take 90 to 120 days now take around 63.

Stop starting, start finishing. It sounds simple. The hard part is seeing it in your own data before the delays show up.

I'm turning this way of reading into a Jira app. If you'd like to see it on your team's data, send me a message.

## Post 3: two humps

In a quarterly review with one of the teams I coach, the delivery time histogram of their main lane had more than one hill. Most items finished quickly. Another group clustered much further out, with a gap in between.

That pattern almost always means different kinds of work are sharing one lane, and they behave differently. Small requests and larger pieces. Work the team controls and work that depends on someone else.

It matters because of forecasting. If you tell your customer "85% of items are done within 30 days", you're wrong for both groups: the small ones finish much sooner, and the large ones often take longer. The average describes nobody.

My recommendation to that team was to split the lane in two or three, one per kind of work, and track each separately. Their prioritisation becomes clearer, and each forecast becomes honest for the work it describes.

Most teams have this chart available. Very few read it this way, because nobody taught them what the shape means.

When not to trust it: with fewer than 30 items, two hills can be chance. Confirm over the next months before changing your board.

I'm turning this way of reading into a Jira app. If you'd like to see it on your team's data, send me a message.
