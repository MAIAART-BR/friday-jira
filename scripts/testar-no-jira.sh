#!/bin/bash
# Prepara um teste completo do FRIDAY Flow num Jira Cloud:
#   1. site de teste (usa um que já tenha ou cria um com «forge site provision»)
#   2. projeto Kanban com issues de teste
#   3. registo, deploy e instalação da app
# O token só existe nesta janela do Terminal: não é gravado em ficheiro nenhum.
#
# Uso, a partir da pasta do repositório:  bash scripts/testar-no-jira.sh

set -e
cd "$(dirname "$0")/.."
RAIZ="$(pwd)"

for cmd in node npm forge; do
  command -v "$cmd" >/dev/null || { echo "Falta o comando «$cmd». Veja o guia de instalação."; exit 1; }
done

echo "== FRIDAY Flow: teste num Jira =="
echo
read -r -p "Email da sua conta Atlassian: " JIRA_EMAIL
read -r -s -p "Token API (não aparece enquanto escreve): " JIRA_TOKEN
echo
[ -n "$JIRA_EMAIL" ] && [ -n "$JIRA_TOKEN" ] || { echo "Email e token são obrigatórios."; exit 1; }

# O Forge CLI lê estas duas variáveis em vez de pedir «forge login».
export FORGE_EMAIL="$JIRA_EMAIL" FORGE_API_TOKEN="$JIRA_TOKEN" JIRA_EMAIL JIRA_TOKEN
forge settings set usage-analytics false >/dev/null 2>&1 || true

echo
read -r -p "Endereço do site Jira de teste (ex.: arturdev.atlassian.net). Enter para criar um novo: " JIRA_SITE
if [ -z "$JIRA_SITE" ]; then
  echo "A criar um site de teste com o Forge (pode demorar alguns minutos)..."
  forge site provision
  echo
  read -r -p "Copie para aqui o endereço do site que apareceu acima: " JIRA_SITE
fi
JIRA_SITE="${JIRA_SITE#https://}"; JIRA_SITE="${JIRA_SITE%%/*}"
export JIRA_SITE

read -r -p "Chave do projeto de teste [FRIDEMO]: " PROJECT_KEY
export PROJECT_KEY="${PROJECT_KEY:-FRIDEMO}"

echo
echo "== 1/3 Projeto e issues de teste =="
node scripts/criar-dados-teste.mjs

echo
echo "== 2/3 Registo e deploy da app =="
cd "$RAIZ/apps/friday-flow"
npm install --silent
if grep -q "app/00000000-0000-0000-0000-000000000000" manifest.yml; then
  forge register "FRIDAY Flow" --accept-terms
fi
forge deploy --non-interactive -e development

echo
echo "== 3/3 Instalação no site =="
if forge install list 2>/dev/null | grep -q "$JIRA_SITE"; then
  forge install --upgrade --non-interactive --site "$JIRA_SITE" --product jira -e development --confirm-scopes || true
else
  forge install --non-interactive --site "$JIRA_SITE" --product jira -e development --confirm-scopes
fi

echo
echo "Pronto. Abra https://$JIRA_SITE/jira/software/projects/$PROJECT_KEY/boards"
echo "e, no menu lateral do projeto, «FRIDAY Flow» (pode estar dentro de «Apps»)."
if ! git -C "$RAIZ" diff --quiet -- apps/friday-flow/manifest.yml; then
  echo
  echo "O manifest.yml tem agora o id real da app. Guarde-o no GitHub:"
  echo "  git add apps/friday-flow/manifest.yml && git commit -m \"Id real da app FRIDAY Flow\" && git push"
fi
