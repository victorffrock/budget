#!/bin/sh
# Gera o AppImage a partir de desktop/ com runtime estático (sem dependência de FUSE).
#
# Para criar um AppImage atualizável pelo Gear Lever, defina
# APPIMAGE_UPDATE_INFORMATION com a origem de atualização do seu repositório.
#
# Uso:
#   cd app && npm install && npm run build && cd ..
#   cd desktop && npm install && ../scripts/build-appimage.sh
#
# Resultado: desktop/dist/*.AppImage e, com APPIMAGE_UPDATE_INFORMATION,
#            desktop/dist/*.AppImage.zsync

set -eu

cd "$(dirname "$0")/../desktop"

HTML_SRC="../app/somador-de-contas.html"
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

echo "==> Gerando AppImage com runtime estático"
npm run dist

set -- dist/*.AppImage
if [ "$1" = "dist/*.AppImage" ]; then
  echo "ERRO: electron-builder não gerou um AppImage"
  exit 1
fi

APPIMAGE="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"

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
STATIC_RUNTIME="$(find "$CACHE_DIR/appimage@1.0.3" -type f -path '*/runtimes/runtime-x64' -print -quit)"
if [ -z "$STATIC_RUNTIME" ]; then
  echo "ERRO: runtime estático do electron-builder não encontrado"
  exit 1
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT HUP INT TERM

APPIMAGETOOL="$WORK_DIR/appimagetool-x86_64.AppImage"
curl --fail --location --proto '=https' --tlsv1.2 --retry 3 \
  --output "$APPIMAGETOOL" \
  "https://github.com/AppImage/appimagetool/releases/download/1.9.1/appimagetool-x86_64.AppImage"
printf '%s  %s\n' \
  "ed4ce84f0d9caff66f50bcca6ff6f35aae54ce8135408b3fa33abfc3cb384eb0" \
  "$APPIMAGETOOL" | sha256sum --check --status -
chmod +x "$APPIMAGETOOL"

(
  cd "$WORK_DIR"
  "$APPIMAGE" --appimage-extract >/dev/null
)

REPACKED_APPIMAGE="$WORK_DIR/$(basename "$APPIMAGE")"
APPIMAGE_EXTRACT_AND_RUN=1 "$APPIMAGETOOL" \
  --runtime-file "$STATIC_RUNTIME" \
  --comp gzip \
  --updateinformation "$APPIMAGE_UPDATE_INFORMATION" \
  "$WORK_DIR/squashfs-root" "$REPACKED_APPIMAGE"

test -s "$REPACKED_APPIMAGE"
test -s "$REPACKED_APPIMAGE.zsync"
mv -f "$REPACKED_APPIMAGE" "$APPIMAGE"
mv -f "$REPACKED_APPIMAGE.zsync" "$APPIMAGE.zsync"

echo
echo "Pronto: $APPIMAGE"
echo "Metadados de atualização e arquivo .zsync gerados."
