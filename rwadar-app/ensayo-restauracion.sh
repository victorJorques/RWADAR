#!/usr/bin/env bash
# =====================================================================
# RWAdar · ensayo de restauración de una copia de seguridad
# ---------------------------------------------------------------------
# Descifra una copia hecha por copia-seguridad.sh y la restaura en un
# Postgres DE USAR Y TIRAR de esta misma máquina (nunca en Supabase ni en
# nada en línea), para comprobar que de verdad se puede recuperar. Enseña
# solo cuántas filas tiene cada tabla, nunca filas ni correos (ni en su
# salida ni en el registro del propio servidor de ensayo). Al terminar,
# salga bien o mal, lo borra todo: la base de ensayo, los roles de
# imitación que haya creado y el archivo descifrado.
#
# Lo usa el workflow `.github/workflows/ensayo-restauracion.yml` con un
# postgres:17 del propio runner. A mano, con un Postgres 17 en tu equipo:
#
#   COPIA_CLAVE='...' PGHOST=localhost PGPORT=5432 PGUSER=postgres \
#     bash rwadar-app/ensayo-restauracion.sh carpeta-de-la-copia
#
# La carpeta es el artefacto copia-rwadar-N descomprimido (o la ruta del
# .dump.gpg). Se conecta con las variables PG* de siempre (PGHOST, PGPORT,
# PGUSER, PGPASSWORD) y se niega si PGHOST no es esta máquina. El usuario
# tiene que poder crear bases y roles (en un Postgres de usar y tirar, el
# superusuario postgres). Guía: docs/COPIAS-DE-SEGURIDAD.md
# =====================================================================
set -euo pipefail
umask 077

ENTRADA="${1:-}"
BD="${ENSAYO_BD:-rwadar_ensayo_restauracion}"
# Tablas que tienen que existir y tener filas.
IMPRESCINDIBLES="${ENSAYO_IMPRESCINDIBLES:-public.plataformas public.fuentes rwadar_catalogo.revisiones auth.users}"
# Roles de Supabase a los que se refieren las políticas de la copia
# (`... to anon, authenticated`). Sin ellos, Postgres no deja crearlas.
ROLES_IMITACION="anon authenticated service_role"

fallo() { echo "ERROR: $*" >&2; exit 1; }

[ -n "$ENTRADA" ] || fallo "uso: bash rwadar-app/ensayo-restauracion.sh CARPETA-DE-LA-COPIA (o ARCHIVO.dump.gpg)"
[ -n "${COPIA_CLAVE:-}" ] || fallo "falta COPIA_CLAVE (la contraseña con la que se cifró la copia)"
for programa in gpg pg_restore psql sha256sum awk; do
  command -v "$programa" >/dev/null || fallo "no está instalado $programa"
done
[[ "$BD" =~ ^[a-z_][a-z0-9_]*$ ]] || fallo "nombre de base de ensayo no válido: $BD"

# Solo un Postgres de esta máquina. libpq acepta listas de servidores
# («localhost,otro»), así que tampoco se admiten comas.
case "${PGHOST:-}" in
  localhost|127.0.0.1|::1|/*) ;;
  *) fallo "PGHOST tiene que ser esta máquina (localhost, 127.0.0.1 o una carpeta de socket). El ensayo nunca se hace en Supabase ni en otra base en línea." ;;
esac
[[ "$PGHOST" != *,* ]] || fallo "PGHOST no puede llevar varios servidores"
[ -z "${PGHOSTADDR:-}${PGSERVICE:-}${PGSERVICEFILE:-}" ] \
  || fallo "quita PGHOSTADDR, PGSERVICE y PGSERVICEFILE: pueden llevar la conexión a otro servidor"

# Que el Postgres de ensayo no apunte en SU registro los errores de este
# script. Si falla la carga de una tabla, Postgres escribe por defecto la fila
# entera («DETAIL: Failing row contains…», «CONTEXT: COPY …»), con correos y
# hashes de contraseñas. En GitHub ese registro se imprime entero en el paso
# «Stop containers» del contenedor de servicio, y se queda 90 días. Son
# ajustes de superusuario y valen solo para las conexiones de este script
# (psql y pg_restore leen PGOPTIONS); van al final para que manden. En el
# paso 2 se comprueba que el servidor los ha aceptado.
export PGOPTIONS="${PGOPTIONS:-} -c log_min_messages=panic -c log_min_error_statement=panic"

if [ -d "$ENTRADA" ]; then
  shopt -s nullglob
  CIFRADAS=("$ENTRADA"/rwadar-*.dump.gpg)
  shopt -u nullglob
  [ "${#CIFRADAS[@]}" -eq 1 ] \
    || fallo "en $ENTRADA tiene que haber una sola copia rwadar-*.dump.gpg (hay ${#CIFRADAS[@]})"
  CIFRADA="${CIFRADAS[0]}"
else
  CIFRADA="$ENTRADA"
fi
[ -f "$CIFRADA" ] || fallo "no existe la copia $CIFRADA"

psql_admin() { psql -X -q -A -t -v ON_ERROR_STOP=1 -d postgres "$@" < /dev/null; }
psql_bd()    { psql -X -q -A -t -v ON_ERROR_STOP=1 -d "$BD" "$@"; }

TRABAJO="$(mktemp -d)"
CREADA=no
ROLES_CREADOS=()
limpiar() {
  local codigo=$?
  set +e
  echo "Limpieza:"
  if [ "$CREADA" = si ]; then
    if psql_admin -c "drop database if exists \"$BD\" with (force)" >/dev/null 2>&1; then
      echo "    base de ensayo $BD borrada."
    else
      echo "AVISO: no se ha podido borrar la base de ensayo $BD; bórrala a mano." >&2
    fi
  fi
  for r in ${ROLES_CREADOS[@]+"${ROLES_CREADOS[@]}"}; do
    psql_admin -c "drop role if exists \"$r\"" >/dev/null 2>&1 \
      || echo "AVISO: no se ha podido borrar el rol de imitación $r" >&2
  done
  [ "${#ROLES_CREADOS[@]}" -eq 0 ] || echo "    roles de imitación borrados: ${ROLES_CREADOS[*]}."
  rm -rf "$TRABAJO" && echo "    archivo descifrado y temporales borrados."
  exit "$codigo"
}
trap limpiar EXIT

echo "1/5 · Comprobando y descifrando $(basename "$CIFRADA")"
if [ -f "$CIFRADA.sha256" ]; then
  ( cd "$(dirname "$CIFRADA")" && sha256sum --check --status "$(basename "$CIFRADA").sha256" ) \
    || fallo "la suma SHA-256 no coincide: la copia está dañada o la han cambiado"
  echo "    suma SHA-256 correcta."
else
  echo "    AVISO: no hay .sha256 junto a la copia; no se puede comprobar que esté entera."
fi
gpg --batch --quiet --no-symkey-cache --pinentry-mode loopback --passphrase-fd 3 \
  --decrypt --output "$TRABAJO/copia.dump" "$CIFRADA" 3<<< "$COPIA_CLAVE" \
  || fallo "no se ha podido descifrar: ¿COPIA_CLAVE es la contraseña de esta copia?"
pg_restore --list "$TRABAJO/copia.dump" > "$TRABAJO/indice.txt" || fallo "pg_restore no entiende la copia"
HECHA_EL="$(sed -n 's/^;[[:space:]]*Archive created at //p' "$TRABAJO/indice.txt" | head -n 1)"
VERSION_ORIGEN="$(sed -n 's/^;[[:space:]]*Dumped from database version: //p' "$TRABAJO/indice.txt" | head -n 1)"
mapfile -t ESQUEMAS_COPIA < <(awk '$4 == "SCHEMA" && $5 == "-" { print $6 }' "$TRABAJO/indice.txt" | sort -u)
[ "${#ESQUEMAS_COPIA[@]}" -gt 0 ] || fallo "la copia no trae ningún esquema"
ESQUEMAS="${ESQUEMAS_COPIA[*]}"
echo "    copia hecha el $HECHA_EL desde Postgres $VERSION_ORIGEN."
echo "    esquemas: $ESQUEMAS"
en_copia() { case " $ESQUEMAS " in *" $1 "*) return 0 ;; esac; return 1; }

echo "2/5 · Preparando un Postgres vacío con lo mínimo de Supabase"
VERSION_DESTINO="$(psql_admin -c "select current_setting('server_version')")" \
  || fallo "no se puede conectar con el Postgres de ensayo (PGHOST=$PGHOST). Hace falta un superusuario: el script le pide al servidor que no registre errores"
echo "    Postgres de ensayo: $VERSION_DESTINO"
[ "$(psql_admin -c "select current_setting('log_min_messages') || ' ' || current_setting('log_min_error_statement')")" = "panic panic" ] \
  || fallo "el Postgres de ensayo seguiría apuntando en su registro los errores de carga (con datos personales). No sigo."
echo "    el servidor no apunta en su registro los errores de este ensayo."
[ -z "$(psql_admin -c "select 1 from pg_catalog.pg_roles where rolname in ('supabase_admin', 'supabase_auth_admin') limit 1")" ] \
  || fallo "este Postgres tiene roles de Supabase: no parece uno de usar y tirar. No lo toco."
[ -z "$(psql_admin -c "select 1 from pg_catalog.pg_database where datname = '$BD'")" ] \
  || fallo "ya existe una base $BD en este Postgres; no la toco. Usa un Postgres limpio o bórrala tú."
psql_admin -c "create database \"$BD\"" >/dev/null
CREADA=si
for r in $ROLES_IMITACION; do
  if [ -z "$(psql_admin -c "select 1 from pg_catalog.pg_roles where rolname = '$r'")" ]; then
    atributos="nologin"
    [ "$r" != service_role ] || atributos="nologin bypassrls"
    psql_admin -c "create role \"$r\" $atributos" >/dev/null
    ROLES_CREADOS+=("$r")
  fi
done
echo "    roles de imitación creados: ${ROLES_CREADOS[*]:-ninguno (ya estaban)}."

# Imitaciones mínimas, SOLO para lo que la copia no trae. Las funciones de
# imitación no dan acceso a nada: devuelven siempre lo más prudente.
{
  echo "set client_min_messages = warning;"
  # pg_dump escribe «CREATE SCHEMA public» cuando se le pide ese esquema; en
  # una base recién creada ya existe (vacío), así que se quita antes.
  en_copia public && echo "drop schema public;"
  # Supabase guarda sus extensiones en el esquema extensions.
  if ! en_copia extensions; then
    echo "create schema extensions;"
    echo "create extension pgcrypto with schema extensions;"
    echo 'create extension "uuid-ossp" with schema extensions;'
  fi
  # Cartera (29): las políticas de public la llaman y la vista public.mi_cartera
  # lee su tabla. Si la copia no la trae, una imitación vacía.
  if ! en_copia rwadar_cuentas_privadas; then
    cat <<'SQL'
create schema rwadar_cuentas_privadas;
create function rwadar_cuentas_privadas.sesion_confirmada() returns boolean
  language sql stable as $$ select false $$;
create table rwadar_cuentas_privadas.carteras (
  usuario_id uuid primary key, version integer not null, documento jsonb not null,
  actualizada_el timestamptz not null default now());
SQL
  fi
  # Comunidad (27): dos restricciones de public.publicaciones la llaman.
  if ! en_copia rwadar_comunidad_privada; then
    cat <<'SQL'
create schema rwadar_comunidad_privada;
create function rwadar_comunidad_privada.sin_enlaces(p_texto text) returns boolean
  language sql immutable as $$ select true $$;
SQL
  fi
} > "$TRABAJO/imitacion.sql"
psql_bd -f "$TRABAJO/imitacion.sql" >/dev/null || fallo "no se han podido preparar las imitaciones de Supabase"

echo "3/5 · Restaurando con pg_restore"
set +e
pg_restore --verbose --dbname="$BD" --no-owner --no-privileges --no-tablespaces \
  --no-security-labels --no-publications --no-subscriptions \
  "$TRABAJO/copia.dump" < /dev/null 2> "$TRABAJO/pg_restore.log"
RESULTADO=$?
set -e
ERRORES="$(grep -c '^pg_restore: error:' "$TRABAJO/pg_restore.log" || true)"
if [ "$RESULTADO" -ne 0 ] || [ "$ERRORES" -gt 0 ]; then
  echo "    pg_restore ha fallado ($ERRORES errores). Qué objeto falló y por qué"
  echo "    (los mensajes de las cargas de datos se ocultan, podrían llevar datos):"
  # Solo las líneas propias de pg_restore: el objeto («from TOC entry») y la
  # primera línea del error. Nunca DETAIL, CONTEXT ni el texto de la orden.
  awk '
    /^pg_restore: from TOC entry / { datos = ($0 ~ /; [0-9]+ [0-9]+ TABLE DATA /); print "      " substr($0, 13, 200); next }
    /^pg_restore: error: / {
      if (datos) print "      error: (oculto: viene de una carga de datos)"
      else print "      " substr($0, 13, 300)
      next
    }
    /^pg_restore: warning: / { print "      " substr($0, 13, 300) }
  ' "$TRABAJO/pg_restore.log"
  fallo "la copia no se ha podido restaurar entera. Ver «Si el ensayo falla» en docs/COPIAS-DE-SEGURIDAD.md"
fi
echo "    pg_restore ha terminado sin errores."

echo "4/5 · Comprobando las tablas (solo recuentos)"
# Filas de cada tabla dentro de la copia: los datos pasan por awk, que solo
# los cuenta; no se guardan ni se imprimen.
pg_restore --data-only --file=- "$TRABAJO/copia.dump" < /dev/null | awk '
  /^COPY / { tabla = $2; n[tabla] += 0; dentro = 1; next }
  /^\\\.$/ { dentro = 0; next }
  dentro { n[tabla]++ }
  END { for (t in n) print t "\t" n[t] }
' | LC_ALL=C sort > "$TRABAJO/filas-copia.tsv"
psql_bd -F $'\t' -v esquemas="$ESQUEMAS" > "$TRABAJO/filas-restauradas.tsv" <<'SQL' || fallo "no se han podido contar las filas restauradas"
select format('%I.%I', n.nspname, c.relname),
       (xpath('/row/n/text()',
              query_to_xml(format('select count(*) as n from %I.%I', n.nspname, c.relname), false, true, '')))[1]::text::bigint
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
 where c.relkind in ('r', 'p') and not c.relispartition
   and n.nspname = any (string_to_array(:'esquemas', ' '))
 order by 1;
SQL
LC_ALL=C sort -o "$TRABAJO/filas-restauradas.tsv" "$TRABAJO/filas-restauradas.tsv"

# Tabla por tabla: lo restaurado tiene que coincidir con lo que trae la copia.
DESCUADRES="$(LC_ALL=C join -t $'\t' -a 1 -e FALTA -o 0,1.2,2.2 "$TRABAJO/filas-copia.tsv" "$TRABAJO/filas-restauradas.tsv" \
  | awk -F '\t' '$2 != $3 { print "      " $1 ": " $2 " en la copia, " $3 " restauradas" }')"
printf '    %-52s %10s\n' "tabla" "filas"
awk -F '\t' '{ printf "    %-52s %10s\n", $1, $2 }' "$TRABAJO/filas-restauradas.tsv"
TABLAS="$(grep -c '' "$TRABAJO/filas-restauradas.tsv" || true)"
FILAS="$(awk -F '\t' '{ s += $2 } END { print s + 0 }' "$TRABAJO/filas-restauradas.tsv")"
echo "    $TABLAS tablas, $FILAS filas en total."
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    echo "### Ensayo de restauración"
    echo
    echo "Copia hecha el $HECHA_EL (Postgres $VERSION_ORIGEN), restaurada en Postgres $VERSION_DESTINO."
    echo "$TABLAS tablas, $FILAS filas. Solo recuentos: ninguna fila sale de la máquina del ensayo."
    echo
    echo "| Tabla | Filas |"
    echo "|---|---:|"
    awk -F '\t' '{ printf "| `%s` | %s |\n", $1, $2 }' "$TRABAJO/filas-restauradas.tsv"
  } >> "$GITHUB_STEP_SUMMARY"
fi
[ -z "$DESCUADRES" ] || fallo "lo restaurado no coincide con la copia:
$DESCUADRES"
for t in $IMPRESCINDIBLES; do
  filas="$(awk -F '\t' -v t="$t" '$1 == t { print $2 }' "$TRABAJO/filas-restauradas.tsv")"
  [ -n "$filas" ] || fallo "no existe la tabla imprescindible $t"
  [ "$filas" -gt 0 ] || fallo "la tabla imprescindible $t está vacía"
done
echo "    imprescindibles con filas: $IMPRESCINDIBLES."
echo "    todas las tablas tienen las mismas filas que la copia."

echo "5/5 · Ensayo correcto: esta copia se puede restaurar. Ahora se borra todo."
