#!/usr/bin/env bash
# =====================================================================
# RWAdar · copia de seguridad cifrada de la base de datos
# ---------------------------------------------------------------------
# Hace una copia de lo que no se puede volver a generar desde el
# repositorio: las cuentas (auth), los datos de la app (public), el
# catálogo editorial (rwadar_catalogo) y los avisos a registrados
# (rwadar_novedades: permisos, bajas, móviles y colas; las suscripciones de
# las notificaciones web, sin datos: ver ARGS). La cartera de cada
# cuenta (rwadar_cuentas_privadas) NO entra todavía por defecto, a propósito:
# ver ESQUEMAS más abajo y docs/COPIAS-DE-SEGURIDAD.md. La cifra con una
# contraseña y comprueba que se puede descifrar y leer antes de darla por
# buena.
#
# Lo usa el workflow `.github/workflows/copia-seguridad.yml`, pero
# también funciona a mano desde Git Bash o Linux:
#
#   SUPABASE_DB_URL='postgresql://...' COPIA_CLAVE='...' \
#     bash rwadar-app/copia-seguridad.sh carpeta-de-salida
#
# Para probar si se puede copiar la cartera, sin cambiar la copia de cada
# noche: COPIA_ESQUEMAS_EXTRA=rwadar_cuentas_privadas (lo pone el workflow
# cuando se elige «habituales-y-cartera»).
#
# Necesita pg_dump, pg_restore y psql de la misma versión mayor que el
# servidor (17 hoy) y gpg. Nunca imprime la dirección, la contraseña ni
# ninguna fila: de las tablas protegidas solo enseña cuántas filas tienen.
# =====================================================================
set -euo pipefail

SALIDA="${1:-copia-rwadar}"
# Un esquema que todavía no existe (rwadar_novedades antes de aplicar la 30)
# no rompe la copia: sin --strict-names, pg_dump solo falla si NINGÚN
# esquema de la lista existe (manual de pg_dump, --strict-names). No añadir
# --strict-names mientras haya esquemas pendientes de aplicar.
# rwadar_cuentas_privadas (cartera) queda fuera por defecto a propósito:
# carteras lleva FORCE ROW LEVEL SECURITY y, si postgres no puede saltársela,
# pg_dump falla entero (también la copia previa de «Aplicar catálogo»).
# Se prueba con COPIA_ESQUEMAS_EXTRA. Ver COPIAS-DE-SEGURIDAD.md.
ESQUEMAS="${COPIA_ESQUEMAS:-public rwadar_catalogo auth rwadar_novedades}"
# Tablas sin las cuales la copia no sirve. Si falta alguna, se para.
IMPRESCINDIBLES="${COPIA_IMPRESCINDIBLES:-public plataformas|public fuentes|rwadar_catalogo revisiones|auth users}"

fallo() { echo "ERROR: $*" >&2; exit 1; }

# Esquemas añadidos a mano (por ejemplo la cartera, para probarla). Solo
# nombres sencillos en minúscula, sin repetir los que ya están.
read -r -a LISTA <<< "$ESQUEMAS"
read -r -a EXTRA <<< "${COPIA_ESQUEMAS_EXTRA:-}"
for e in "${EXTRA[@]}"; do
  case " ${LISTA[*]} " in *" $e "*) ;; *) LISTA+=("$e") ;; esac
done
for e in "${LISTA[@]}"; do
  [[ "$e" =~ ^[a-z_][a-z0-9_]*$ ]] || fallo "nombre de esquema no válido: $e"
done
[ "${#LISTA[@]}" -gt 0 ] || fallo "no hay ningún esquema que copiar"
ESQUEMAS="${LISTA[*]}"

[ -n "${SUPABASE_DB_URL:-}" ] || fallo "falta SUPABASE_DB_URL (dirección de la base con su contraseña)"
[ -n "${COPIA_CLAVE:-}" ]     || fallo "falta COPIA_CLAVE (contraseña con la que se cifra la copia)"
[ "${#COPIA_CLAVE}" -ge 16 ]  || fallo "COPIA_CLAVE debe tener al menos 16 caracteres"
command -v pg_dump >/dev/null    || fallo "no está instalado pg_dump"
command -v pg_restore >/dev/null || fallo "no está instalado pg_restore"
command -v psql >/dev/null       || fallo "no está instalado psql"
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
for e in "${LISTA[@]}"; do ARGS+=(--schema="$e"); done
# Las suscripciones de las notificaciones web (la dirección de entrega y las
# claves de cada navegador) y sus envíos entran sin datos, solo la tabla: se
# pueden volver a crear (al pulsar «Activar» el navegador se suscribe otra vez)
# y así no pasan en claro por las máquinas de GitHub, que hoy no tienen
# contrato de encargo (anexo legal del 12/11/2026, C3). Un patrón de exclusión
# que no encuentra nada (antes de la 32) no hace fallar a pg_dump.
ARGS+=(--exclude-table-data=rwadar_novedades.suscripciones_web --exclude-table-data=rwadar_novedades.envios_web)

# Consultas de solo lectura al catálogo de la base: nombres y recuentos,
# nunca filas.
consulta() { psql "$URL" -X -q -A -t -v ON_ERROR_STOP=1 "$@" < /dev/null; }

# Tablas con protección FORCE ROW LEVEL SECURITY (hoy solo la cartera): ni
# su dueño las lee entero, solo un superusuario o un rol con BYPASSRLS.
# pg_dump desactiva la protección para leer (row_security = off) y, si el
# usuario no puede saltársela, falla con «query would be affected by
# row-level security policy». Es lo que queremos: NUNCA añadir
# --enable-row-security, que sacaría esas tablas vacías sin avisar. Aun así,
# más abajo se cuentan sus filas en la copia y en la base, y si la copia sale
# vacía con la base llena, se para.
PROTEGIDAS="$(psql "$URL" -X -q -A -t -F $'\t' -v ON_ERROR_STOP=1 -v esquemas="$ESQUEMAS" <<'SQL'
select n.nspname, c.relname, format('%I.%I', n.nspname, c.relname)
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
 where c.relkind in ('r', 'p') and c.relforcerowsecurity
   and n.nspname = any (string_to_array(:'esquemas', ' '))
 order by 1, 2;
SQL
)" || fallo "no se ha podido leer qué tablas tienen protección forzada"
SALTA_RLS=""
if [ -n "$PROTEGIDAS" ]; then
  SALTA_RLS="$(consulta -c "select case when rolsuper or rolbypassrls then 'sí' else 'no' end
                              from pg_catalog.pg_roles where rolname = current_user")" \
    || fallo "no se ha podido leer los permisos del usuario de la copia"
fi

echo "1/4 · Copiando esquemas: $ESQUEMAS"
if [ -n "$PROTEGIDAS" ]; then
  echo "    Con protección forzada (FORCE RLS): $(cut -f3 <<< "$PROTEGIDAS" | paste -sd ' ' -)"
  echo "    ¿Puede el usuario de la copia saltársela (superusuario o BYPASSRLS)? $SALTA_RLS"
fi
if ! pg_dump "$URL" --format=custom --compress=9 --no-owner --no-privileges \
       "${ARGS[@]}" --file="$TRABAJO/$NOMBRE"; then
  if [ "$SALTA_RLS" = no ]; then
    fallo "pg_dump no ha podido hacer la copia: el usuario de la copia no puede leer las tablas con protección forzada (le falta BYPASSRLS). Quita esos esquemas de la copia; qué hacer en docs/COPIAS-DE-SEGURIDAD.md"
  fi
  fallo "pg_dump no ha podido hacer la copia"
fi

echo "2/4 · Comprobando que la copia se puede leer"
pg_restore --list "$TRABAJO/$NOMBRE" > "$TRABAJO/indice.txt"
IFS='|' read -r -a TABLAS <<< "$IMPRESCINDIBLES"
for t in "${TABLAS[@]}"; do
  grep -q " TABLE DATA $t " "$TRABAJO/indice.txt" || fallo "la copia no contiene los datos de: $t"
done
TABLAS_CON_DATOS="$(grep -c ' TABLE DATA ' "$TRABAJO/indice.txt" || true)"
echo "    $TABLAS_CON_DATOS tablas con datos; imprescindibles presentes."

# Filas de una tabla dentro de la copia. Los datos pasan por awk, que solo
# los cuenta: no se escriben en ningún sitio ni se imprimen.
filas_en_copia() {
  pg_restore --data-only --schema="$1" --table="$2" --file=- "$TRABAJO/$NOMBRE" < /dev/null \
    | awk 'BEGIN { n = 0 } /^COPY / { dentro = 1; next } /^\\\.$/ { dentro = 0; next } dentro { n++ } END { print n }'
}
PROTEGIDAS_RESUMEN=""
if [ -n "$PROTEGIDAS" ]; then
  while IFS=$'\t' read -r esquema tabla cualificada; do
    grep -q " TABLE DATA $esquema $tabla " "$TRABAJO/indice.txt" \
      || fallo "la copia no contiene los datos de la tabla protegida $cualificada"
    en_copia="$(filas_en_copia "$esquema" "$tabla")" || fallo "no se han podido contar las filas de $cualificada en la copia"
    # Con row_security = off, la cuenta solo sale si el usuario de verdad ve
    # todas las filas; si la protección le afecta, la consulta falla.
    en_base="$(consulta -c "set row_security = off; select count(*) from $cualificada")" \
      || fallo "el usuario de la copia no puede leer entera $cualificada (le falta BYPASSRLS): la copia de esa tabla saldría vacía o a medias"
    echo "    $cualificada: $en_base filas en la base, $en_copia en la copia."
    if [ "$en_copia" -eq 0 ] && [ "$en_base" -gt 0 ]; then
      fallo "la copia de $cualificada ha salido vacía y en la base tiene $en_base filas: algo la ha filtrado. No vale."
    fi
    PROTEGIDAS_RESUMEN="$PROTEGIDAS_RESUMEN $cualificada=$en_copia"
  done <<< "$PROTEGIDAS"
fi

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
  echo "Sin datos, a propósito: rwadar_novedades.suscripciones_web y envios_web (notificaciones web; se vuelven a activar)"
  [ -z "$PROTEGIDAS_RESUMEN" ] || echo "Filas de las tablas con protección forzada:$PROTEGIDAS_RESUMEN"
  echo "Tamaño cifrado: $(wc -c < "$SALIDA/$NOMBRE.gpg") bytes"
  echo "Cómo restaurarla: docs/COPIAS-DE-SEGURIDAD.md"
} > "$SALIDA/LEEME.txt"

echo "Hecho: $SALIDA/$NOMBRE.gpg"
