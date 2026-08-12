#!/bin/sh
# Gera o AppImage a partir de desktop/.
#
# Uso:
#   cd app && npm install && python3 build.py && cd ..
#   cd desktop && npm install && ../scripts/build-appimage.sh
#
# Resultado: desktop/dist/SomadorDeContas-<versao>-x86_64.AppImage

set -e
cd "$(dirname "$0")/../desktop"

VERSION=$(node -p "require('./package.json').version")
TOOLS_DIR="../.tools"
mkdir -p "$TOOLS_DIR"

HTML_SRC="../app/somador-de-contas.html"
if [ ! -f "$HTML_SRC" ]; then
  echo "ERRO: não encontrei $HTML_SRC"
  echo "Rode antes: cd app && npm install && python3 build.py"
  exit 1
fi
cp -f "$HTML_SRC" ./index.html
echo "==> HTML copiado para desktop/index.html ($(wc -c < index.html) bytes)"

if [ ! -f ./preload.js ]; then
  echo "ERRO: falta desktop/preload.js"
  exit 1
fi

echo "==> 1/4  electron-builder (AppImage base)"
npx electron-builder --linux AppImage

BASE_APPIMAGE="dist/Somador de Contas-${VERSION}.AppImage"
if [ ! -f "$BASE_APPIMAGE" ]; then
  BASE_APPIMAGE=$(ls dist/*.AppImage 2>/dev/null | head -1)
fi
chmod +x "$BASE_APPIMAGE"

echo "==> 2/4  baixando appimagetool e runtime sem FUSE"
if [ ! -f "$TOOLS_DIR/appimagetool-x86_64.AppImage" ]; then
  curl -L -o "$TOOLS_DIR/appimagetool-x86_64.AppImage" \
    "https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-x86_64.AppImage"
  chmod +x "$TOOLS_DIR/appimagetool-x86_64.AppImage"
fi
if [ ! -f "$TOOLS_DIR/runtime-x86_64" ]; then
  curl -L -o "$TOOLS_DIR/runtime-x86_64" \
    "https://github.com/AppImage/type2-runtime/releases/download/continuous/runtime-x86_64"
fi

echo "==> 3/4  extraindo o AppDir"
rm -rf dist/squashfs-root
(cd dist && "./$(basename "$BASE_APPIMAGE")" --appimage-extract >/dev/null)

# Garante preload.js fora do asar (sandbox + path estável)
if [ -f dist/squashfs-root/resources/app.asar ]; then
  if [ ! -f dist/squashfs-root/resources/preload.js ]; then
    cp -f ./preload.js dist/squashfs-root/resources/preload.js
  fi
fi

echo "==> 4/4  reempacotando com o runtime novo"
OUT="dist/SomadorDeContas-${VERSION}-x86_64.AppImage"
ARCH=x86_64 "$TOOLS_DIR/appimagetool-x86_64.AppImage" --appimage-extract-and-run \
  --runtime-file "$TOOLS_DIR/runtime-x86_64" \
  --no-appstream \
  "dist/squashfs-root" "$OUT"

echo
echo "Pronto: $OUT"
