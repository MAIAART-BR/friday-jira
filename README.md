# FRIDAY para Jira

A jornada Kanban da equipa no **Jira Cloud**, para vender no Atlassian Marketplace.
Versão para Jira do [FRIDAY](https://github.com/MAIAART-BR/FRIDAY), que lê BusinessMap e Trello.

© Artur Castro. Todos os direitos reservados.

Prioridades e decisões: [`BACKLOG.md`](BACKLOG.md). Nada é implementado sem estar lá.

## O produto

**O FRIDAY é a jornada Kanban da equipa dentro do Jira.** Mostra onde a equipa está, ensina a ler os seus próprios gráficos e diz por onde começar. Depois ajuda a melhorar, com experiências cujo resultado a app mede sozinha. Funciona desde o primeiro dia, com poucas métricas ou nenhuma.

O método da jornada é de Artur Castro: as metáforas por passo, a autoavaliação, a confirmação das respostas pelos dados e a tabela de leitura das métricas.

| Passo | O que faz | Precisa de métricas? |
|---|---|---|
| 1. Começar | STATIK guiado: propósito, insatisfações, procura e fluxo. Termina com uma proposta de quadro e de políticas. | Não |
| 2. Onde estamos | Autoavaliação de toda a equipa, com a metáfora do passo. Assinala respostas apressadas e grandes divergências na equipa. | Não |
| 3. Como ler | Cada resposta confrontada com os dados, e os padrões dos gráficos explicados: duas corcovas, cauda longa, fora dos limites, bloqueios agrupados. | Sim, quando houver |
| 4. Próximos passos e experiências | 2 ou 3 práticas do passo seguinte, com o porquê. Experiências com antes e depois, reunião quinzenal e resumo mensal. | Sim, para medir |

- **Para quem:** coaches, equipas de transformação (CoE) e líderes de equipas Kanban.
- **Porque é diferente:** as ferramentas de métricas (Nave, ActionableAgile, Broken Build) pressupõem que se sabe ler gráficos e que há histórico. As de retrospetiva (TeamRhythm, SprintRetro) são feitas para o sprint e não medem se a ação resultou. Não encontrei no Marketplace nenhuma app de jornada ou maturidade Kanban. Ver [`marketplace/CONCORRENCIA.md`](marketplace/CONCORRENCIA.md).
- **Regras, não IA:** os mesmos dados dão o mesmo resultado, e cada conclusão explica-se.
- **Um só produto:** grátis até 10 utilizadores, pago acima disso.
- **Estado:**
  - direção **por validar com entrevistas**, com a maqueta em [`maquete/index.html`](maquete/index.html) (dados fictícios);
  - o que existe hoje no Jira é o painel de fluxo (FRIDAY Flow), que passa a ser a base dos passos 3 e 4.
- **Por verificar antes de vender:** o catálogo de práticas e os níveis do KMM e o STATIK são da Kanban University. Reescrever com palavras próprias ou licenciar.

## Estrutura

```
packages/core/        cálculos de fluxo (funções puras, testadas)
apps/friday-flow/     a app Forge (manifest, resolver, ecrã em UI Kit); hoje é o painel de fluxo
maquete/              maqueta navegável do produto, para entrevistas (dados fictícios)
  src/core/           cópia gerada do core, não editar (ver abaixo)
scripts/sync-core.mjs copia o core para cada app
```

A app tem de ser autossuficiente no `forge deploy`, por isso leva uma cópia do core.
Edite só `packages/core/src` e corra `npm run sync-core`. O `npm test` falha se alguma cópia estiver desatualizada.

## Testar

```bash
npm test
```

Corre os testes do core e da app e verifica a cópia do core. Não precisa de conta Atlassian.

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

## O que falta para vender

Textos da listagem, privacidade, termos e o guia do que falta: pasta [`marketplace/`](marketplace/PREPARACAO.md).

- [ ] Testar num site Jira real: quadro Kanban e quadro Scrum, site sem o campo «Flagged». (Mais de 1000 tickets: testado a 14/11/2026.)
- [ ] Conta de parceiro no Marketplace e escolha do nome. «FRIDAY» pode já estar em uso no Marketplace; verificar antes de criar a listagem.
- [ ] Política de privacidade, termos (EULA), página de suporte e contacto de segurança. São obrigatórios na listagem.
- [ ] Preço (Paid via Atlassian): grátis até 10 utilizadores, por confirmar com o suporte (ECOHELP-185604).
- [ ] Entrevistas com a maqueta e, se confirmarem, os sinais, as experiências e o modo reunião (backlog, itens 2 e 5 a 7).
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
- **Subtarefas:** contam como o quadro as mostra; sem quadro, contam todas, como no Jira (decisão de 15/11/2026).
- **Bloqueados incluem o backlog,** mostrado à parte no cartão («3 · 1 no backlog»); os concluídos com flag não contam.
- **Done | Released:** as colunas com estados «Concluído» encostadas à última coluna nunca contam como em curso (decisão de 15/11/2026).
- **Idade do trabalho em curso:** conta desde a última mudança de categoria de estado. Voltar de «Em revisão» para «Em curso» não reinicia a contagem, porque é a mesma categoria; reabrir um ticket concluído reinicia.
