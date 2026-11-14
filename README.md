# FRIDAY para Jira

Métricas de fluxo para equipas Kanban no **Jira Cloud**, vendidas por módulos no Atlassian Marketplace.
Versão para Jira do [FRIDAY](https://github.com/MAIAART-BR/FRIDAY), que lê BusinessMap e Trello.

© Artur Castro. Todos os direitos reservados.

## Módulos

Cada módulo é uma app Forge própria, com listagem e preço próprios no Marketplace. O cliente compra só o que quer.
Os módulos integram-se de duas formas:

- **No ecrã:** cada módulo instalado acrescenta a sua página ao menu do projeto no Jira. Quem tem os quatro vê os quatro lado a lado.
- **Nos números:** todos usam o mesmo núcleo de cálculo (`packages/core`). WIP, bloqueado ou lead time querem dizer o mesmo em todos os módulos, por isso os números batem certo entre módulos.

Nenhum módulo depende de outro. Não há dados partilhados entre apps: cada uma lê diretamente do Jira.

| # | Módulo | Pergunta a que responde | Estado |
|---|---|---|---|
| 1 | **FRIDAY Flow** | Como está o fluxo agora? (KPIs, WIP por pessoa e por tipo, bloqueados, trabalho em curso mais antigo) | Feito (v0.1), por testar num site Jira |
| 2 | **FRIDAY Delivery** | Quanto entregamos e em quanto tempo? (throughput semanal, lead time) | Cálculos já no core; falta a app |
| 3 | **FRIDAY Forecast** | Quando fica pronto? (P50/P85, simulação Monte Carlo) | Por fazer |
| 4 | **FRIDAY Health** | Onde está o problema? (bloqueios, envelhecimento, guia KMM) | Por fazer |

O FRIDAY Quest (o jogo) fica de fora até haver módulos a vender.

## Estrutura

```
packages/core/        cálculos de fluxo (funções puras, testadas)
apps/friday-flow/     módulo 1 (app Forge: manifest, resolver, ecrã em UI Kit)
  src/core/           cópia gerada do core, não editar (ver abaixo)
scripts/sync-core.mjs copia o core para cada app
```

Cada app tem de ser autossuficiente no `forge deploy`, por isso leva uma cópia do core.
Edite só `packages/core/src` e corra `npm run sync-core`. O `npm test` falha se alguma cópia estiver desatualizada.

## Testar

```bash
npm test
```

Corre os testes do core e do FRIDAY Flow e verifica as cópias do core. Não precisa de conta Atlassian.

## Pôr a correr num Jira (no Mac)

É preciso um site Jira Cloud de desenvolvimento, que é gratuito: https://go.atlassian.com/cloud-dev

```bash
npm install -g @forge/cli
```

```bash
forge login
```

```bash
cd apps/friday-flow && npm install && forge register
```

O `forge register` substitui o `app.id` provisório do `manifest.yml` pelo id real.

```bash
forge deploy
```

```bash
forge install
```

Escolha o produto Jira e o site de desenvolvimento. O FRIDAY Flow aparece no menu lateral de cada projeto.

## O que falta para vender (módulo 1)

- [ ] Testar num site Jira real: quadro Kanban e quadro Scrum, projeto com mais de 1000 issues, site sem o campo «Flagged».
- [ ] Conta de parceiro no Marketplace e escolha do nome. «FRIDAY» pode já estar em uso no Marketplace; verificar antes de criar a listagem.
- [ ] Política de privacidade, termos (EULA), página de suporte e contacto de segurança. São obrigatórios na listagem.
- [ ] Preço (Paid via Atlassian). O preço é por número de utilizadores do site, em escalões.
- [ ] Ícone, capturas de ecrã e textos da listagem, em inglês.
- [ ] Tradução do ecrã para inglês. Hoje está só em português.

## Decisões técnicas

- **Forge e UI Kit:** desde 17/09/2025, o Marketplace só aceita apps novas em Forge. O UI Kit desenha o ecrã com os componentes do próprio Jira, incluindo os gráficos.
- **Tudo corre dentro da Atlassian:** a app não envia dados para servidores externos. Simplifica a revisão de segurança e a privacidade, e permite o selo «Runs on Atlassian».
- **`asUser`:** cada utilizador só vê as issues a que já tem acesso no Jira.
- **Licença:** `licensing.enabled: true`. Em produção, a app recusa mostrar dados se a licença não estiver ativa.
- **Bloqueado = campo «Flagged» do Jira Software.** É o equivalente mais próximo dos bloqueios do BusinessMap. Os motivos de bloqueio ficam para o FRIDAY Health.
- **Limites da v0.1:**
  - Lê no máximo 1000 issues por projeto e avisa quando corta.
  - A idade do trabalho em curso conta desde a última mudança de categoria de estado. Uma issue que volta de «Em revisão» para «Em curso» não reinicia a contagem, porque fica na mesma categoria.
  - Uma issue que sai de «Feito» e volta a «Em curso» reinicia a contagem.
