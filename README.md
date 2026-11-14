# FRIDAY para Jira

Métricas de fluxo para equipas Kanban no **Jira Cloud**, vendidas por módulos no Atlassian Marketplace.
Versão para Jira do [FRIDAY](https://github.com/MAIAART-BR/FRIDAY), que lê BusinessMap e Trello.

© Artur Castro. Todos os direitos reservados.

Prioridades e decisões: [`BACKLOG.md`](BACKLOG.md). Nada é implementado sem estar lá.

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

Precisa de `node` (20, 22 ou 24), `npm`, `forge` (`npm install -g @forge/cli`) e de um token API da Atlassian
(https://id.atlassian.com/manage-profile/security/api-tokens).

```bash
bash scripts/testar-no-jira.sh
```

### Node.js

O Forge CLI só arranca com Node `^22.23.4`, `^24.22.1` ou `>=26.12.1`. Com outras versões, incluindo 26.0 a 26.11, todos os comandos `forge` falham com «Unsupported Node.js version». Num Mac com o Node 22 do Homebrew:

```bash
echo 'export PATH="$(brew --prefix node@22)/bin:$PATH"' >> ~/.zprofile && source ~/.zprofile && node -v
```

O script pede o email e o token e guarda-os só nessa janela do Terminal. Depois faz o seguinte:

1. Usa o site Jira de teste que indicar ou, se carregar em Enter, cria um com `forge site provision`.
2. Cria o projeto Kanban `FRIDEMO` com 9 issues de teste: 3 em backlog, 4 em curso (uma bloqueada e uma sem responsável) e 2 concluídas. Se correr outra vez, não as duplica.
3. Regista a app (`forge register`, que troca o `app.id` provisório pelo real), faz o deploy e instala-a no site.

No fim, abra o projeto no Jira e escolha **FRIDAY Flow** no menu lateral.

## Deploy pelo GitHub Actions

O fluxo «Deploy FRIDAY Flow» (`.github/workflows/deploy-friday-flow.yml`) corre os testes e faz o `forge deploy`.
Só corre à mão: **Actions → Deploy FRIDAY Flow → Run workflow**. Nunca corre num push.

Precisa de dois secrets no repositório (**Settings → Secrets and variables → Actions → New repository secret**):

| Secret | Valor |
|---|---|
| `FORGE_EMAIL` | email da conta Atlassian |
| `FORGE_API_TOKEN` | token do Forge CLI (de preferência um token só para o Forge: https://go.atlassian.com/forge-cli-api-token) |

Opções do fluxo:
- `environment`: development (por omissão), staging ou production.
- `upgrade_install`: atualiza também a instalação no site. Só é preciso quando as permissões (`scopes`) mudam.

## O que falta para vender (módulo 1)

Textos da listagem, privacidade, termos e o guia do que falta: pasta [`marketplace/`](marketplace/PREPARACAO.md).

- [ ] Testar num site Jira real: quadro Kanban e quadro Scrum, projeto com mais de 1000 issues, site sem o campo «Flagged».
- [ ] Conta de parceiro no Marketplace e escolha do nome. «FRIDAY» pode já estar em uso no Marketplace; verificar antes de criar a listagem.
- [ ] Política de privacidade, termos (EULA), página de suporte e contacto de segurança. São obrigatórios na listagem.
- [ ] Preço (Paid via Atlassian). O preço é por número de utilizadores do site, em escalões.
- [ ] Ícone, capturas de ecrã e textos da listagem, em inglês.
- [x] Ecrã em inglês e português, escolhido pela língua do perfil de cada utilizador no Jira (`src/frontend/i18n.js`).

## Decisões técnicas

- **Forge e UI Kit:** desde 17/09/2025, o Marketplace só aceita apps novas em Forge. O UI Kit desenha o ecrã com os componentes do próprio Jira, incluindo os gráficos.
- **Tudo corre dentro da Atlassian:** a app não envia dados para servidores externos. Simplifica a revisão de segurança e a privacidade, e permite o selo «Runs on Atlassian».
- **`asUser`:** cada utilizador só vê as issues a que já tem acesso no Jira.
- **Licença:** `licensing.enabled: true`. Em produção, a app recusa mostrar dados se a licença não estiver ativa.
- **Bloqueado = campo «Flagged» do Jira Software.** É o equivalente mais próximo dos bloqueios do BusinessMap. Os motivos de bloqueio ficam para o FRIDAY Health.
- **Concluído = entrada em «Feito».** Usa a data de resolução quando existe. Muitos fluxos não preenchem a resolução e, nesses casos, conta a data em que a issue passou para «Feito».
- **Limites da v0.1:**
  - Lê no máximo 1000 issues por projeto e avisa quando corta.
  - A idade do trabalho em curso conta desde a última mudança de categoria de estado. Uma issue que volta de «Em revisão» para «Em curso» não reinicia a contagem, porque fica na mesma categoria.
  - Uma issue que sai de «Feito» e volta a «Em curso» reinicia a contagem.
