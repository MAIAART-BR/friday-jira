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
