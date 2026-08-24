#!/usr/bin/env bash
set -euo pipefail

# Gera a identidade que assina todas as versões Android do Budget. A chave
# nunca deve entrar no Git: guarde uma cópia criptografada fora deste projeto.
required=(
  BUDGET_KEYSTORE_OUTPUT
  BUDGET_ANDROID_KEYSTORE_PASSWORD
  BUDGET_ANDROID_KEY_PASSWORD
)

for variable in "${required[@]}"; do
  if [[ -z "${!variable:-}" ]]; then
    echo "Defina ${variable} antes de executar este script." >&2
    exit 2
  fi
done

: "${BUDGET_ANDROID_KEY_ALIAS:=budget-release}"

if [[ -e "$BUDGET_KEYSTORE_OUTPUT" ]]; then
  echo "A chave já existe em $BUDGET_KEYSTORE_OUTPUT; nada foi alterado." >&2
  exit 1
fi

umask 077
keytool -genkeypair \
  -keystore "$BUDGET_KEYSTORE_OUTPUT" \
  -storetype PKCS12 \
  -storepass "$BUDGET_ANDROID_KEYSTORE_PASSWORD" \
  -keypass "$BUDGET_ANDROID_KEY_PASSWORD" \
  -alias "$BUDGET_ANDROID_KEY_ALIAS" \
  -keyalg EC \
  -groupname 'CN=Victor Ferreira Franco, OU=Budget, O=Budget, C=BR' \
  -validity 10000

echo "Chave criada em $BUDGET_KEYSTORE_OUTPUT. Faça uma cópia criptografada fora do repositório."
