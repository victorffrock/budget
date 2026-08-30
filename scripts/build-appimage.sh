#!/bin/sh
# Gera o AppImage a partir de desktop/ com runtime estático (sem dependência de FUSE).
#
# Para criar um AppImage atualizável pelo Gear Lever, defina
# APPIMAGE_UPDATE_INFORMATION com a origem de atualização do seu repositório.
#
# Uso:
#   cd app && npm install && npm run build && cd ..
#   cd desktop && npm install && ../scripts/build-appimage.sh x86_64
#
# O alvo precisa corresponder à arquitetura da máquina que executa o script.
# Os alvos suportados são x86_64 e aarch64. Quando omitido, ele é detectado.
#
# Resultado estável: desktop/dist/Budget-<versão>-<arquitetura>.AppImage.
# Resultado de teste: desktop/dist/Budget-test-<arquitetura>.AppImage.
# Com APPIMAGE_UPDATE_INFORMATION, também é gerado o respectivo .zsync.

set -eu

cd "$(dirname "$0")/../desktop"

REQUESTED_ARCH="${1:-${BUDGET_APPIMAGE_ARCH:-}}"
HOST_MACHINE="$(uname -m)"
BUILD_CHANNEL="${BUDGET_BUILD_CHANNEL:-}"

if [ -z "$BUILD_CHANNEL" ]; then
  # Ao gerar localmente na branch de testes, o AppImage deve se identificar
  # como tal sem exigir que a pessoa configure uma variável manualmente.
  if [ "$(git branch --show-current 2>/dev/null || true)" = "test" ]; then
    BUILD_CHANNEL=test
  else
    BUILD_CHANNEL=stable
  fi
fi

case "$BUILD_CHANNEL" in
  stable|test) ;;
  *)
    echo "ERRO: canal de build inválido: $BUILD_CHANNEL"
    exit 1
    ;;
esac

normalize_arch() {
  case "$1" in
    x86_64|amd64|x64) printf '%s\n' x86_64 ;;
    aarch64|arm64) printf '%s\n' aarch64 ;;
    *) return 1 ;;
  esac
}

if [ -z "$REQUESTED_ARCH" ]; then
  REQUESTED_ARCH="$HOST_MACHINE"
fi

if ! APPIMAGE_ARCH="$(normalize_arch "$REQUESTED_ARCH")"; then
  echo "ERRO: arquitetura não suportada: $REQUESTED_ARCH"
  echo "Use x86_64 ou aarch64."
  exit 1
fi

if ! HOST_ARCH="$(normalize_arch "$HOST_MACHINE")"; then
  echo "ERRO: arquitetura da máquina não suportada: $HOST_MACHINE"
  exit 1
fi

if [ "$APPIMAGE_ARCH" != "$HOST_ARCH" ]; then
  echo "ERRO: o AppImage $APPIMAGE_ARCH precisa ser gerado em um runner $APPIMAGE_ARCH."
  echo "Use o workflow do GitHub Actions ou execute o script em uma máquina nativa."
  exit 1
fi

case "$APPIMAGE_ARCH" in
  x86_64)
    ELECTRON_ARCH=x64
    RUNTIME_ARCH=x64
    APPIMAGETOOL_ARCH=x86_64
    APPIMAGETOOL_SHA256=ed4ce84f0d9caff66f50bcca6ff6f35aae54ce8135408b3fa33abfc3cb384eb0
    ;;
  aarch64)
    ELECTRON_ARCH=arm64
    RUNTIME_ARCH=arm64
    APPIMAGETOOL_ARCH=aarch64
    APPIMAGETOOL_SHA256=f0837e7448a0c1e4e650a93bb3e85802546e60654ef287576f46c71c126a9158
    ;;
esac

HTML_SRC="../app/budget.html"
if [ ! -f "$HTML_SRC" ]; then
  echo "ERRO: não encontrei $HTML_SRC"
  echo "Rode antes: cd app && npm install && npm run build"
  exit 1
fi

if [ ! -f ./preload.js ]; then
  echo "ERRO: falta desktop/preload.js"
  exit 1
fi

cp -f "$HTML_SRC" ./index.html
echo "==> HTML copiado para desktop/index.html ($(wc -c < index.html) bytes)"

APP_VERSION="$(node -p "require('./package.json').version")"
if [ "$BUILD_CHANNEL" = test ]; then
  APPIMAGE_ARTIFACT_NAME="Budget-test-${APPIMAGE_ARCH}.\${ext}"
  APPIMAGE="$(pwd)/dist/Budget-test-${APPIMAGE_ARCH}.AppImage"
  # Gear Lever identifica aplicativos pela entrada .desktop do AppImage. As
  # substituições abaixo isolam completamente o canal de testes: ele recebe
  # outro appId, outro arquivo .desktop, executável e ícone próprios.
  set -- \
    "--$ELECTRON_ARCH" \
    "--config.artifactName=$APPIMAGE_ARTIFACT_NAME" \
    "--config.extraMetadata.budgetBuildChannel=test" \
    "--config.extraMetadata.desktopName=br.com.victorferreirafranco.budget.test" \
    "--config.appId=br.com.victorferreirafranco.budget.test" \
    "--config.productName=Budget Test" \
    "--config.linux.executableName=budget-test" \
    "--config.linux.icon=assets/icon-test.png"
else
  APPIMAGE_ARTIFACT_NAME="Budget-\${version}-${APPIMAGE_ARCH}.\${ext}"
  APPIMAGE="$(pwd)/dist/Budget-${APP_VERSION}-${APPIMAGE_ARCH}.AppImage"
  set -- \
    "--$ELECTRON_ARCH" \
    "--config.artifactName=$APPIMAGE_ARTIFACT_NAME" \
    "--config.extraMetadata.budgetBuildChannel=stable"
fi

echo "==> Gerando AppImage $APPIMAGE_ARCH com runtime estático"
npm run dist -- "$@"

if [ ! -f "$APPIMAGE" ]; then
  echo "ERRO: electron-builder não gerou $APPIMAGE"
  exit 1
fi

chmod +x "$APPIMAGE"
test -x "$APPIMAGE"

if [ "$BUILD_CHANNEL" = test ]; then
  ../scripts/verify-test-appimage.sh "$APPIMAGE"
fi

if [ -z "${APPIMAGE_UPDATE_INFORMATION:-}" ]; then
  echo
  echo "Pronto: $APPIMAGE"
  echo "Sem metadados de atualização (defina APPIMAGE_UPDATE_INFORMATION para incluí-los)."
  exit 0
fi

if ! command -v zsyncmake >/dev/null 2>&1; then
  echo "ERRO: zsyncmake é necessário para gerar o arquivo .zsync"
  exit 1
fi

CACHE_DIR="${ELECTRON_BUILDER_CACHE:-$HOME/.cache/electron-builder}"
STATIC_RUNTIME="$(find "$CACHE_DIR/appimage@1.0.3" -type f -path "*/runtimes/runtime-$RUNTIME_ARCH" -print -quit)"
if [ -z "$STATIC_RUNTIME" ]; then
  echo "ERRO: runtime estático $RUNTIME_ARCH do electron-builder não encontrado"
  exit 1
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT HUP INT TERM

APPIMAGETOOL="$WORK_DIR/appimagetool-$APPIMAGETOOL_ARCH.AppImage"
curl --fail --location --proto '=https' --tlsv1.2 --retry 3 \
  --output "$APPIMAGETOOL" \
  "https://github.com/AppImage/appimagetool/releases/download/1.9.1/appimagetool-$APPIMAGETOOL_ARCH.AppImage"
printf '%s  %s\n' \
  "$APPIMAGETOOL_SHA256" \
  "$APPIMAGETOOL" | sha256sum --check --status -
chmod +x "$APPIMAGETOOL"

(
  cd "$WORK_DIR"
  "$APPIMAGE" --appimage-extract >/dev/null
)

REPACKED_APPIMAGE="$WORK_DIR/$(basename "$APPIMAGE")"
(
  cd "$WORK_DIR"
  APPIMAGE_EXTRACT_AND_RUN=1 "$APPIMAGETOOL" \
    --runtime-file "$STATIC_RUNTIME" \
    --comp zstd \
    --updateinformation "$APPIMAGE_UPDATE_INFORMATION" \
    "$WORK_DIR/squashfs-root" "$(basename "$REPACKED_APPIMAGE")"
)

test -s "$REPACKED_APPIMAGE"
test -s "$REPACKED_APPIMAGE.zsync"
mv -f "$REPACKED_APPIMAGE" "$APPIMAGE"
mv -f "$REPACKED_APPIMAGE.zsync" "$APPIMAGE.zsync"
chmod +x "$APPIMAGE"
test -x "$APPIMAGE"

echo
echo "Pronto: $APPIMAGE"
echo "Metadados de atualização e arquivo .zsync gerados."
