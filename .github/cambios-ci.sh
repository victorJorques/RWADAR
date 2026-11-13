#!/usr/bin/env bash
# =====================================================================
# RWAdar · ¿este PR necesita la batería de pruebas?
# ---------------------------------------------------------------------
# Lo usa el paso «Ver si el PR cambia algo más que documentación» de
# .github/workflows/ci.yml. Escribe dos líneas, «pruebas=true|false» y
# «sello=true|false», en $GITHUB_OUTPUT (si existe) y al final de la salida.
#
#   bash .github/cambios-ci.sh            compara HEAD^1 con HEAD (en un PR,
#                                         la unión con la base y su padre)
#   bash .github/cambios-ci.sh BASE CABEZA
#
# pruebas=false (se salta la batería) solo si el PR cambia nada más que
# docs/**, archivos .md de la raíz y el sello
# (rwadar-app/data/relanzamiento/estado.json), y ninguno de esos documentos
# lo leen las pruebas o la compuerta de publicación: si alguno aparece
# escrito entero en un probar-*, un *.test.* o en los cuatro archivos de la
# compuerta, corre todo.
#
# sello=true si, además, el PR cambia el sello: entonces ci.yml no corre la
# batería entera, sino el trabajo «sello» (las pruebas de la batería que
# leen estado.json y la misma compuerta que «Publicar web»). Un sello nunca
# queda sin validar. Con pruebas=true, sello=false: la batería ya lo cubre.
#
# Lanzado a mano (sin evento pull_request), o si no se puede ver qué
# cambia, corre todo: pruebas=true, sello=false.
#
# Que las pruebas escriban entera la ruta de cada documento que leen lo exige
# .github/flujos.test.mjs: si una prueba la arma por piezas
# (path.join(raiz, 'docs', …)), falla, porque aquí no se vería.
# Pruebas: node --test .github/flujos.test.mjs
# =====================================================================
set -euo pipefail

BASE="${1:-HEAD^1}"
CABEZA="${2:-HEAD}"
SELLO_RUTA=rwadar-app/data/relanzamiento/estado.json

# Escribe «PRUEBAS SELLO» (por ejemplo, «false true»).
decidir() {
  local lista archivo pruebas=false sello=false
  if [ "${GITHUB_EVENT_NAME:-}" != pull_request ]; then
    echo "Lanzado a mano: se pasa todo." >&2
    echo "true false"; return
  fi
  if ! lista="$(git -c core.quotePath=false diff --no-renames --name-only "$BASE" "$CABEZA")"; then
    echo "No se pudo ver qué cambia: se pasa todo." >&2
    echo "true false"; return
  fi
  while IFS= read -r archivo; do
    [ -n "$archivo" ] || continue
    if [ "$archivo" = "$SELLO_RUTA" ]; then
      sello=true; echo "Cambia el sello: $archivo" >&2; continue
    fi
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
        rwadar-app/auditar-relanzamiento.mjs "$SELLO_RUTA" \
        rwadar-publicar.js rwadar-publicacion-segura.js || codigo=$?
      if [ "$codigo" -eq 0 ]; then
        pruebas=true; echo "Lo leen las pruebas o la compuerta: $archivo" >&2
      elif [ "$codigo" -ne 1 ]; then
        pruebas=true; echo "No se pudo buscar quién lee $archivo (git grep, código $codigo): se pasa todo." >&2
      fi
    fi
    if [ "$pruebas" = true ]; then echo "Cambia: $archivo" >&2; break; fi
  done <<< "$lista"
  if [ "$pruebas" = true ]; then
    sello=false
  elif [ "$sello" = true ]; then
    echo "Solo el sello (y documentación): en vez de la batería, el trabajo «sello»." >&2
  else
    echo "Solo documentación: se salta la batería de pruebas." >&2
  fi
  echo "$pruebas $sello"
}

RESULTADO="$(decidir)"
read -r PRUEBAS SELLO <<< "$RESULTADO"
case "$PRUEBAS $SELLO" in
  "true false"|"false true"|"false false") ;;
  *) echo "Resultado imposible ($RESULTADO): se para." >&2; exit 1 ;;
esac
if [ -n "${GITHUB_OUTPUT:-}" ]; then printf 'pruebas=%s\nsello=%s\n' "$PRUEBAS" "$SELLO" >> "$GITHUB_OUTPUT"; fi
printf 'pruebas=%s\nsello=%s\n' "$PRUEBAS" "$SELLO"
