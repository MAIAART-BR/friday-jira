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

## Validar os cálculos com uma exportação CSV

Compara os cálculos do FRIDAY com os de outra ferramenta, por exemplo o BusinessMap, sem enviar dados para lado nenhum:

```bash
node scripts/validar-csv.mjs caminho/para/export.csv
```

- **O que lê:** só o ID, as datas, o responsável e o bloqueio. Nunca lê os títulos.
- **Anonimização:** os IDs aparecem como `CARTAO-001` e os nomes como `Pessoa A`.
- **O que mostra:** apenas números agregados. Não grava nada em disco.
- **Ficheiros de dados:** o repositório ignora `*.csv` e `*.xlsx`.

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
- `approve_major`: aprova a versão principal nova que o Forge exige quando as permissões mudam. Com a app publicada, obriga cada cliente a aprovar a atualização. Por isso fica desligado por omissão e é uma decisão de cada vez.

## O que falta para vender (módulo 1)

Textos da listagem, privacidade, termos e o guia do que falta: pasta [`marketplace/`](marketplace/PREPARACAO.md).

- [ ] Testar num site Jira real: quadro Kanban e quadro Scrum, site sem o campo «Flagged». (Mais de 1000 tickets: testado a 14/11/2026.)
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
- **WIP pela posição das colunas:** a primeira coluna do quadro é o backlog, a última é o concluído, e tudo o que está entre elas é trabalho em curso (decisão de 14/11/2026). Não usamos as categorias de estado do Jira, porque «Selected for Development» está em «A fazer» no Jira mas já é trabalho assumido.
- **Idade a partir do histórico:** conta desde a última vez que o ticket entrou numa coluna do meio. Se o Jira não devolver o histórico, conta desde a criação e a página avisa.
- **Ajuda com fontes:** o botão «Como contamos» explica cada número, com referências ao The Kanban Guide (2025) e a Little (1961, 2011).
- **Os números seguem o quadro:** a página tem um seletor de quadro, logo abaixo do título, que lembra a escolha de cada pessoa. Os números usam o filtro, o sub-filtro Kanban e as colunas desse quadro, por isso batem com o que o cliente vê. Nos espaços sem quadro, usa as categorias de estado do Jira.
- **O que é carregado e o que é contado:** o trabalho em curso e os concluídos nos últimos 14 dias são carregados por inteiro. O backlog é só contado, por tipo, com a contagem do próprio Jira (`/search/approximate-count`), para um backlog grande não esconder o trabalho em curso. Há um limite de segurança de 5000 tickets em curso e concluídos, só por causa do tempo de resposta.
- **Subtarefas não contam:** só as tarefas mãe (decisão de 14/11/2026).
- **Bloqueado inclui o backlog:** um ticket com flag no backlog conta como bloqueado; os concluídos com flag não contam (decisão de 14/11/2026).
- **Idade do trabalho em curso:** conta desde a última mudança de categoria de estado. Voltar de «Em revisão» para «Em curso» não reinicia a contagem, porque é a mesma categoria; reabrir um ticket concluído reinicia.
