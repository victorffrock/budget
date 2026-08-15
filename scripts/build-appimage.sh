#!/bin/sh
# Gera o AppImage a partir de desktop/ sem baixar nem executar binários externos.
#
# Uso:
#   cd app && npm install && npm run build && cd ..
#   cd desktop && npm install && ../scripts/build-appimage.sh
#
# Resultado: desktop/dist/Somador de Contas-<versao>.AppImage

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

echo "==> Gerando AppImage com electron-builder"
npm run dist

set -- dist/*.AppImage
if [ "$1" = "dist/*.AppImage" ]; then
  echo "ERRO: electron-builder não gerou um AppImage"
  exit 1
fi

echo
echo "Pronto: $1"
echo "Sem FUSE, execute: $1 --appimage-extract-and-run"
