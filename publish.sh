#!/usr/bin/env bash
# Copia uno o más decks desde el proyecto local a este repo de publicación.
# Uso: ./publish.sh sesion-05 sesion-06
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
SRC="${SLIDES_SRC:-$REPO/../slides}"

[ -d "$SRC" ] || { echo "No encuentro la carpeta de slides: $SRC" >&2; exit 1; }
[ $# -gt 0 ] || { echo "Uso: $0 <carpeta-de-deck> [...]" >&2; exit 1; }

for deck in "$@"; do
  [ -f "$SRC/$deck/index.html" ] || { echo "No existe $SRC/$deck/index.html" >&2; exit 1; }
  rm -rf "${REPO:?}/$deck"
  cp -R "$SRC/$deck" "$REPO/"
  echo "copiado: $deck"
done

# Los decks comparten tema y scripts; se refrescan siempre.
for shared in css js; do
  rm -rf "${REPO:?}/$shared"
  cp -R "$SRC/$shared" "$REPO/"
done
echo "actualizados: css/ js/"
echo "Falta agregar la entrada en index.html y hacer commit."
