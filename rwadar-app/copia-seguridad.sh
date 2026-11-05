#!/usr/bin/env bash
# =====================================================================
# RWAdar · copia de seguridad cifrada de la base de datos
# ---------------------------------------------------------------------
# Hace una copia de lo que no se puede volver a generar desde el
# repositorio: las cuentas (auth), los datos de la app (public), el
# catálogo editorial (rwadar_catalogo), la cartera de cada cuenta
# (rwadar_cuentas_privadas) y los avisos a registrados (rwadar_novedades:
# permisos, bajas, móviles y colas). La cifra con una contraseña y
# comprueba que se puede descifrar y leer antes de darla por buena.
#
# Lo usa el workflow `.github/workflows/copia-seguridad.yml`, pero
# también funciona a mano desde Git Bash o Linux:
#
#   SUPABASE_DB_URL='postgresql://...' COPIA_CLAVE='...' \
#     bash rwadar-app/copia-seguridad.sh carpeta-de-salida
#
# Necesita pg_dump y pg_restore de la misma versión mayor que el servidor
# (17 hoy) y gpg. Nunca imprime la dirección ni la contraseña.
# =====================================================================
set -euo pipefail

SALIDA="${1:-copia-rwadar}"
# Un esquema que todavía no existe (rwadar_novedades antes de aplicar la 30)
# no rompe la copia: sin --strict-names, pg_dump solo falla si NINGÚN
# esquema de la lista existe (manual de pg_dump, --strict-names). No añadir
# --strict-names mientras haya esquemas pendientes de aplicar.
# rwadar_cuentas_privadas (cartera) queda fuera a propósito: carteras lleva
# FORCE ROW LEVEL SECURITY y, si postgres no puede saltársela, pg_dump falla
# entero (también la copia previa de «Aplicar catálogo»). Ver COPIAS-DE-SEGURIDAD.md.
ESQUEMAS="${COPIA_ESQUEMAS:-public rwadar_catalogo auth rwadar_novedades}"
# Tablas sin las cuales la copia no sirve. Si falta alguna, se para.
IMPRESCINDIBLES="${COPIA_IMPRESCINDIBLES:-public plataformas|public fuentes|rwadar_catalogo revisiones|auth users}"

fallo() { echo "ERROR: $*" >&2; exit 1; }

[ -n "${SUPABASE_DB_URL:-}" ] || fallo "falta SUPABASE_DB_URL (dirección de la base con su contraseña)"
[ -n "${COPIA_CLAVE:-}" ]     || fallo "falta COPIA_CLAVE (contraseña con la que se cifra la copia)"
[ "${#COPIA_CLAVE}" -ge 16 ]  || fallo "COPIA_CLAVE debe tener al menos 16 caracteres"
command -v pg_dump >/dev/null    || fallo "no está instalado pg_dump"
command -v pg_restore >/dev/null || fallo "no está instalado pg_restore"
command -v gpg >/dev/null        || fallo "no está instalado gpg"

URL="$SUPABASE_DB_URL"
case "$URL" in *sslmode=*) ;; *\?*) URL="$URL&sslmode=require" ;; *) URL="$URL?sslmode=require" ;; esac
# Supabase local o un Postgres de pruebas no usan TLS.
case "$URL" in *@localhost*|*@127.0.0.1*) URL="${URL/sslmode=require/sslmode=disable}" ;; esac

mkdir -p "$SALIDA"
TRABAJO="$(mktemp -d)"
trap 'rm -rf "$TRABAJO"' EXIT
FECHA="$(date -u +%Y%m%d-%H%M)"
NOMBRE="rwadar-$FECHA.dump"

ARGS=()
for e in $ESQUEMAS; do ARGS+=(--schema="$e"); done

echo "1/4 · Copiando esquemas: $ESQUEMAS"
pg_dump "$URL" --format=custom --compress=9 --no-owner --no-privileges \
  "${ARGS[@]}" --file="$TRABAJO/$NOMBRE"

echo "2/4 · Comprobando que la copia se puede leer"
pg_restore --list "$TRABAJO/$NOMBRE" > "$TRABAJO/indice.txt"
IFS='|' read -r -a TABLAS <<< "$IMPRESCINDIBLES"
for t in "${TABLAS[@]}"; do
  grep -q " TABLE DATA $t " "$TRABAJO/indice.txt" || fallo "la copia no contiene los datos de: $t"
done
TABLAS_CON_DATOS="$(grep -c ' TABLE DATA ' "$TRABAJO/indice.txt" || true)"
echo "    $TABLAS_CON_DATOS tablas con datos; imprescindibles presentes."

echo "3/4 · Cifrando (AES-256)"
gpg --batch --yes --quiet --pinentry-mode loopback --passphrase-fd 3 \
  --symmetric --cipher-algo AES256 --s2k-digest-algo SHA512 --s2k-count 65011712 \
  --output "$SALIDA/$NOMBRE.gpg" "$TRABAJO/$NOMBRE" 3<<< "$COPIA_CLAVE"

echo "4/4 · Comprobando que se descifra igual"
gpg --batch --quiet --pinentry-mode loopback --passphrase-fd 3 \
  --decrypt --output "$TRABAJO/descifrado.dump" "$SALIDA/$NOMBRE.gpg" 3<<< "$COPIA_CLAVE"
cmp -s "$TRABAJO/$NOMBRE" "$TRABAJO/descifrado.dump" || fallo "la copia descifrada no coincide"

( cd "$SALIDA" && sha256sum "$NOMBRE.gpg" > "$NOMBRE.gpg.sha256" )
{
  echo "Copia de RWAdar · $FECHA UTC"
  echo "Esquemas: $ESQUEMAS"
  echo "Tablas con datos: $TABLAS_CON_DATOS"
  echo "Tamaño cifrado: $(wc -c < "$SALIDA/$NOMBRE.gpg") bytes"
  echo "Cómo restaurarla: docs/COPIAS-DE-SEGURIDAD.md"
} > "$SALIDA/LEEME.txt"

echo "Hecho: $SALIDA/$NOMBRE.gpg"
