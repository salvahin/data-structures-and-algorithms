#!/usr/bin/env bash
# Crea las veinte carpetas de la serie dentro del directorio actual.
# Uso:
#   cd repaso-cpp
#   bash crear-estructura.sh
#
# Git no versiona carpetas vacías, así que este script no las commitea:
# cada carpeta aparece en tu repositorio cuando pongas el ejercicio dentro.

set -e

carpetas=(
  r00-compilacion r01-vscode r02-tipos r03-entrada-salida
  r04-control-flujo r05-funciones r06-depurador r07-string
  r08-punteros r09-clases r10-constructores r11-multiarchivo
  r12-errores r13-memoria r14-operadores r15-herencia
  r16-polimorfismo r17-plantillas r18-vector r19-stl
)

for c in "${carpetas[@]}"; do
  mkdir -p "$c"
done

echo "Listas ${#carpetas[@]} carpetas en $(pwd)"
echo "Siguiente paso: copia .gitignore y README.md aquí, y haz tu primer commit."
