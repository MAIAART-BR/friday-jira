# Preparação para o Marketplace: FRIDAY Flow

| Ficheiro | O que é |
|---|---|
| `LISTING.md` | Textos da listagem, em inglês, prontos a copiar para o formulário. `node scripts/check-listing.mjs` confirma os limites de caracteres. |
| `PRIVACY.md` | Política de privacidade (inglês). Confere com o código: sem saída de dados, sem armazenamento, um único registo de erro. |
| `EULA.md` | Termos de utilização (inglês). |

Os textos legais são um ponto de partida, não aconselhamento jurídico. Para vender, convém que um advogado os reveja, sobretudo a cláusula de responsabilidade e a lei aplicável.

## O que só o Artur pode fazer

1. **Completar o Developer Space.** O Forge avisou no primeiro deploy: https://developer.atlassian.com/console/developer-space/a08f8cf0-f7c8-4545-97ad-d631fe60f93b
2. **Criar o perfil de parceiro no Marketplace.** Nome comercial, dados fiscais e de pagamento.
3. **Preencher os campos em falta nos documentos:**
   - `[LEGAL NAME]`: o seu nome ou o da sua empresa;
   - `[SUPPORT_EMAIL]`: um email de suporte (de preferência não o pessoal);
   - `[COUNTRY]` e `[CITY]`: a lei aplicável aos termos;
   - `[DATE]`: a data de publicação.
4. **Publicar a privacidade e os termos num endereço público.** Pode ser uma página do GitHub Pages ou do seu site.
5. **Criar uma página de suporte.** É obrigatória para apps pagas.
6. **Fazer as imagens:** logótipo de 144×144, banner de 1120×548 e 3 capturas de ecrã de 1840×900. O FRIDAY tem um `friday.jpg` no repositório original que pode servir de base ao logótipo.
7. **Confirmar o nome.** Não encontrei nenhuma app «FRIDAY» no Marketplace, mas a pesquisa web não chega para o garantir. Confirme também que não há uma marca registada «FRIDAY» na área de software que o impeça de usar o nome.

## Preço: o que decidir antes de publicar

**Verificar primeiro:** há uma página da Atlassian chamada «Why can't I change the payment model» (https://developer.atlassian.com/platform/marketplace/why-cant-i-change-the-payment-model). Pelo título, uma app publicada como gratuita pode não poder passar a paga depois. Não consegui ler a página. Se for assim, a escolha entre gratuito e pago é definitiva para cada listagem.

**Concorrência direta:** estas apps já fazem mais do que o FRIDAY Flow (cycle time, throughput, previsão Monte Carlo):
- Flow Metrics & Forecasting: https://marketplace.atlassian.com/apps/3298816930
- FlowPaths: https://marketplace.atlassian.com/apps/1892174736
- Nave (Kanban Analytics)
- Measure Team Health & Sustainable Flow

Não consegui ver os preços delas. Abra o separador **Pricing** de cada uma antes de fixar o seu.

**Proposta:**
- **FRIDAY Flow gratuito**, como porta de entrada. Sozinho, mostra pouco mais do que o Jira e as apps acima já mostram, e é difícil cobrar por ele. Gratuito, traz instalações e avaliações, e quem o usar vê os módulos pagos.
- **Delivery, Forecast e Health pagos**, a um preço abaixo da concorrência, que é a sua estratégia de «barato por módulos».

A alternativa é pôr o Flow a um preço muito baixo desde o início. Isso mantém a possibilidade de o subir mais tarde, mas atrai menos instalações.

## Antes de submeter

- [ ] Testar com dados reais: um Jira com meses de histórico. A idade do trabalho e o P85 nunca foram vistos com dados verdadeiros.
- [ ] Deploy para **production** (`environment: production` no fluxo do GitHub) e instalar a versão de produção no site de testes.
- [ ] Rever os textos do `LISTING.md` contra o ecrã real. Não prometer nada que a app não faça.
