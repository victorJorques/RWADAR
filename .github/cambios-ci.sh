#!/usr/bin/env bash
# =====================================================================
# RWAdar · ¿este PR necesita la batería de pruebas?
# ---------------------------------------------------------------------
# Lo usa el paso «Ver si el PR cambia algo más que documentación» de
# .github/workflows/ci.yml. Escribe «pruebas=true» o «pruebas=false» en
# $GITHUB_OUTPUT (si existe) y como última línea de la salida.
#
#   bash .github/cambios-ci.sh            compara HEAD^1 con HEAD (en un PR,
#                                         la unión con la base y su padre)
#   bash .github/cambios-ci.sh BASE CABEZA
#
# Se salta la batería (false) solo si el PR cambia nada más que docs/** o
# archivos .md de la raíz, y ninguno de ellos lo leen las pruebas o la
# compuerta de publicación: si alguno aparece escrito entero en un probar-*,
# un *.test.* o en los cuatro archivos de la compuerta, corre todo. Lanzado a
# mano (sin evento pull_request), o si no se puede ver qué cambia, corre todo.
#
# Que las pruebas escriban entera la ruta de cada documento que leen lo exige
# .github/flujos.test.mjs: si una prueba la arma por piezas
# (path.join(raiz, 'docs', …)), falla, porque aquí no se vería.
# Pruebas: node --test .github/flujos.test.mjs
# =====================================================================
set -euo pipefail

BASE="${1:-HEAD^1}"
CABEZA="${2:-HEAD}"

decidir() {
  local lista archivo pruebas=false
  if [ "${GITHUB_EVENT_NAME:-}" != pull_request ]; then
    echo "Lanzado a mano: se pasa todo." >&2
    echo true; return
  fi
  if ! lista="$(git -c core.quotePath=false diff --no-renames --name-only "$BASE" "$CABEZA")"; then
    echo "No se pudo ver qué cambia: se pasa todo." >&2
    echo true; return
  fi
  while IFS= read -r archivo; do
    [ -n "$archivo" ] || continue
    case "$archivo" in
      docs/*) ;;
      */*) pruebas=true ;;
      *.md) ;;
      *) pruebas=true ;;
    esac
    if [ "$pruebas" = false ]; then
      # git grep: 0 lo encuentra, 1 no lo encuentra, otro código es un error
      # (y ante la duda, se pasa todo).
      local codigo=0
      git grep -q -F -e "$archivo" "$CABEZA" -- \
        ':(glob)**/probar-*' ':(glob)**/*.test.*' \
        rwadar-app/auditar-relanzamiento.mjs rwadar-app/data/relanzamiento/estado.json \
        rwadar-publicar.js rwadar-publicacion-segura.js || codigo=$?
      if [ "$codigo" -eq 0 ]; then
        pruebas=true; echo "Lo leen las pruebas o la compuerta: $archivo" >&2
      elif [ "$codigo" -ne 1 ]; then
        pruebas=true; echo "No se pudo buscar quién lee $archivo (git grep, código $codigo): se pasa todo." >&2
      fi
    fi
    if [ "$pruebas" = true ]; then echo "Cambia: $archivo" >&2; break; fi
  done <<< "$lista"
  [ "$pruebas" = true ] || echo "Solo documentación: se salta la batería de pruebas." >&2
  echo "$pruebas"
}

PRUEBAS="$(decidir)"
if [ -n "${GITHUB_OUTPUT:-}" ]; then echo "pruebas=$PRUEBAS" >> "$GITHUB_OUTPUT"; fi
echo "pruebas=$PRUEBAS"
