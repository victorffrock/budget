#!/bin/sh
# Confere a identidade que permite ao Gear Lever manter a instalação de teste
# independente da instalação estável do Budget.

set -eu

if [ "$#" -ne 1 ]; then
  echo "Uso: verify-test-appimage.sh CAMINHO-DO-APPIMAGE"
  exit 1
fi

APPIMAGE="$1"
if [ ! -x "$APPIMAGE" ]; then
  echo "ERRO: AppImage ausente ou sem permissão de execução: $APPIMAGE"
  exit 1
fi

APPIMAGE_DIR="$(cd "$(dirname "$APPIMAGE")" && pwd)"
APPIMAGE="$APPIMAGE_DIR/$(basename "$APPIMAGE")"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT HUP INT TERM

(
  cd "$WORK_DIR"
  "$APPIMAGE" --appimage-extract >/dev/null
)

DESKTOP_ENTRY="$WORK_DIR/squashfs-root/br.com.victorferreirafranco.budget.test.desktop"
test -f "$DESKTOP_ENTRY"
test -f "$WORK_DIR/squashfs-root/budget-test.png"
grep -Fx 'Name=Budget Test' "$DESKTOP_ENTRY" >/dev/null
grep -Fx 'Icon=budget-test' "$DESKTOP_ENTRY" >/dev/null
grep -Fx 'StartupWMClass=br.com.victorferreirafranco.budget.test' "$DESKTOP_ENTRY" >/dev/null

echo "Identidade independente do AppImage de teste validada."
