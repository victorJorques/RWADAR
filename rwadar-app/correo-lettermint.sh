#!/usr/bin/env bash
# =====================================================================
# RWAdar · correo por Lettermint: prueba real y bajas guardadas allí
# ---------------------------------------------------------------------
# Lo usa el flujo «Correo Lettermint (prueba y bajas)»
# (.github/workflows/correo-lettermint.yml), un paso por llamada:
#
#   comprobar      valida la acción y las entradas (ACCION, CONFIRMAR,
#                  DESTINATARIO, REMITENTE, EVENTO) y deja en GITHUB_ENV lo
#                  que usan los pasos siguientes.
#   rest-cerrada   comprueba que la API REST pública de Supabase NO expone
#                  los esquemas net ni vault: pide net.http_request_queue y
#                  vault.decrypted_secrets y exige PGRST106, con la dirección
#                  y la clave publicable que ya lleva la web
#                  (rwadar-acceso/compilar.cjs). Sin ningún secreto.
#   remitente      lee RWADAR_REMITENTE de Vault en una transacción de solo
#                  lectura (db/31_correo_lettermint_remitente.sql).
#   enviar-prueba  manda dos correos de prueba a DESTINATARIO: uno por la
#                  ruta de servicio (la de por defecto) y otro por la de
#                  difusión (route "broadcast"), los dos sin seguimiento de
#                  aperturas ni clics. Enseña el código HTTP y el message_id.
#   listar-bajas   pide a Lettermint (Team API, GET /v1/suppressions) las
#                  bajas por «unsubscribe» de las rutas de difusión y las
#                  deja en un archivo temporal. Solo enseña recuentos.
#   aplicar-bajas  aplica cada una en RWAdar con rwadar_novedades.baja_por_correo
#                  (db/31_correo_lettermint_baja.sql). Solo enseña recuentos.
#   limpiar        borra el archivo temporal de las bajas.
#
# Nunca imprime los tokens, la dirección de la base ni ningún correo de
# usuario: los tokens van a curl por la entrada estándar (-H @-) y los
# correos a psql como variables (-v). Nunca con el rastreo de bash (xtrace).
#
# Pruebas: rwadar-app/probar-avisos-registrados.mjs (dobles de curl y psql,
# y el SQL en PGlite).
# =====================================================================
set -euo pipefail
export LC_ALL=C
# Conexión a la base siempre cifrada, como en el env de los flujos: con el
# «prefer» de libpq, alguien en medio que rechace TLS haría seguir sin cifrar.
export PGSSLMODE="${PGSSLMODE:-require}"

cd "$(dirname "${BASH_SOURCE[0]}")/.."
D=rwadar-app/db
TEMPORAL="${RUNNER_TEMP:-${TMPDIR:-/tmp}}"
LETTERMINT=https://api.lettermint.co/v1
TAB=$'\t'
# Una dirección sencilla (la misma que «guardar-correo»): sin nombre ni <>.
CORREO_SIMPLE='^[A-Za-z0-9._%+-]+@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$'
# Las de Lettermint, en jq: los caracteres que admite la base (31) y nada de
# espacios, tabuladores ni saltos de línea.
CORREO_JQ='\A[a-z0-9.!#$%&'"'"'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+\z'
FECHA_JQ='\A[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,9})?(?:Z|[+-][0-9]{2}:[0-9]{2})\z'
# El mismo pie que los avisos (34): el titular, sin su nombre (está en el
# aviso legal), con la dirección postal que pide Lettermint en cada correo.
PIE_TEXTO='Te escribe RWAdar, un radar independiente de plataformas de tokenización. Responsable: el titular de RWAdar, Plaza Generalitat, s/n, 46600 Alzira (Valencia), España.
Aviso legal: https://rwadar.pages.dev/privacidad#aviso-legal'
BAJA_MAILTO='<mailto:rwadares@gmail.com?subject=Baja%20de%20los%20avisos%20de%20RWAdar>'

falla() { echo "$*"; exit 1; }
correo_simple() { local c="${1-}"; (( ${#c} <= 254 )) && [[ "$c" =~ $CORREO_SIMPLE ]]; }
token_valido() { local t="${1-}"; (( ${#t} >= 20 && ${#t} <= 1024 )) && ! [[ "$t" =~ [^!-~] ]]; }
resumen() { if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then printf '%s\n' "$@" >> "$GITHUB_STEP_SUMMARY"; fi; }
# Lo que se enseña de una respuesta de Lettermint: solo texto visible y corto.
detalle() { jq -r 'if type == "object" then ((.message // .error // "") | tostring) else "" end' "$1" 2>/dev/null \
  | tr -cd '[:print:]' | cut -c1-200 || true; }

comprobar() {
  : "${GITHUB_ENV:?falta GITHUB_ENV}"
  local accion="${ACCION:-}" confirmar="${CONFIRMAR:-}" evento="${EVENTO:-workflow_dispatch}"
  local destinatario="${DESTINATARIO:-}" remitente="${REMITENTE:-}"
  case "$accion" in
    prueba-correo|sincronizar-bajas) ;;
    *) falla "Acción no válida: elige prueba-correo o sincronizar-bajas." ;;
  esac
  if [ "$evento" = schedule ]; then
    # El horario solo existe si Víctor creó la variable RWADAR_BAJAS_LETTERMINT_DIARIO = si.
    [ "$accion" = sincronizar-bajas ] || falla "Por horario solo se hace sincronizar-bajas."
  elif [ "$confirmar" != AVISOS ]; then
    if [ "$accion" = prueba-correo ]; then
      falla "prueba-correo manda dos correos de verdad: escribe AVISOS en «confirmar»."
    fi
    falla "sincronizar-bajas cambia la base (da de baja en RWAdar a quien se dio de baja en Lettermint): escribe AVISOS en «confirmar»."
  fi
  if [ "$accion" = prueba-correo ]; then
    correo_simple "$destinatario" \
      || falla "prueba-correo necesita en «destinatario» una dirección de correo válida, sin nombre ni <>."
    if [ -n "$remitente" ]; then
      correo_simple "$remitente" \
        || falla "«remitente» debe ser una dirección de correo válida, sin nombre ni <> (o vacío para usar el de Vault)."
    fi
    { echo "ACCION=$accion"; echo "DESTINATARIO=$destinatario"; echo "REMITENTE=$remitente"; } >> "$GITHUB_ENV"
    echo "Acción: prueba-correo. Remitente: ${remitente:-el guardado en Vault (RWADAR_REMITENTE)}."
  else
    echo "ACCION=$accion" >> "$GITHUB_ENV"
    [ -z "$destinatario$remitente" ] || echo "(«destinatario» y «remitente» solo valen para prueba-correo: aquí no se usan.)"
    echo "Acción: sincronizar-bajas."
  fi
}

rest_cerrada() {
  local fuente=rwadar-acceso/compilar.cjs url clave esquema tabla codigo pgrst mensaje respuesta
  url="$(sed -n "s/^ *SUPABASE_URL: '\([^']*\)',\$/\1/p" "$fuente")"
  clave="$(sed -n "s/^ *SUPABASE_PUBLISHABLE_KEY: '\([^']*\)',\$/\1/p" "$fuente")"
  [[ "$url" =~ ^https://[a-z0-9]{20}\.supabase\.co$ ]] \
    || falla "No encuentro una sola dirección de Supabase con forma válida en $fuente."
  [[ "$clave" =~ ^sb_publishable_[A-Za-z0-9_-]{10,200}$ ]] \
    || falla "No encuentro una sola clave publicable de Supabase con forma válida en $fuente."
  respuesta="$(mktemp "$TEMPORAL/rwadar-rest.XXXXXX")"
  # Se pide una TABLA de cada esquema, no la raíz /rest/v1/: desde el 08/04/2026
  # Supabase cierra la raíz a las claves que no son secretas antes de llegar a
  # PostgREST (supabase.com/changelog/42949), así que allí nunca vuelve PGRST106.
  echo "API REST pública de Supabase ($url/rest/v1/<tabla>), con la clave publicable de la web:"
  for esquema in net vault; do
    case "$esquema" in net) tabla=http_request_queue ;; vault) tabla=decrypted_secrets ;; esac
    codigo="$(curl -sS --proto '=https' --globoff --max-time 20 -o "$respuesta" -w '%{http_code}' \
      -H "apikey: $clave" -H "Accept-Profile: $esquema" -H 'Accept: application/json' \
      "$url/rest/v1/$tabla" < /dev/null)" || codigo=000
    [[ "$codigo" =~ ^[0-9]{3}$ ]] || codigo=000
    pgrst="$(jq -r 'if type == "object" then ((.code // "") | tostring) else "" end' "$respuesta" 2>/dev/null || true)"
    [[ "$pgrst" =~ ^[A-Z0-9]{1,12}$ ]] || pgrst=""
    mensaje="$(jq -r 'if type == "object" then ((.message // .msg // .error // "") | tostring) else "" end' "$respuesta" 2>/dev/null \
      | tr -cd '[:print:]' | cut -c1-160 || true)"
    if [ "$pgrst" = PGRST106 ]; then
      echo "  $esquema ($tabla): no se expone (HTTP $codigo, PGRST106)"
      continue
    fi
    rm -f "$respuesta"
    if [ "$codigo" = 000 ]; then
      falla "No se pudo hablar con la API REST de Supabase al pedir $esquema.$tabla (HTTP 000: red o tiempo agotado). No se manda nada. Relanza el flujo; si se repite, mira https://status.supabase.com."
    elif { [ -z "$pgrst" ] && ! [[ "$codigo" =~ ^2 ]]; } || [[ "$pgrst" =~ ^PGRST3 ]]; then
      # Sin código PGRST la respuesta no viene de PostgREST: la cortó antes la
      # pasarela (clave, ruta o caída). PGRST3xx es un rechazo de la clave. Ni
      # una ni otra dicen si el esquema se expone o no.
      falla "Supabase no dejó llegar la petición de $esquema.$tabla a los datos (HTTP $codigo, código «${pgrst:-ninguno}»: «${mensaje:-sin mensaje}»). Con eso no se sabe si el esquema «$esquema» está expuesto o no. No se manda nada. Si es 401, la clave publicable de $fuente ya no vale; si no, pide a Claude o a Codex que lo mire."
    fi
    falla "La API REST pública NO rechaza el esquema «$esquema» (HTTP $codigo, código «${pgrst:-ninguno}»; se esperaba PGRST106). No se manda nada. En Supabase, la Data API solo debe exponer public y graphql_public: revísalo antes de seguir."
  done
  rm -f "$respuesta"
  resumen "**API REST de Supabase:** net y vault no se exponen (PGRST106)."
}

remitente() {
  : "${SUPABASE_DB_URL:?Falta el secreto de GitHub SUPABASE_DB_URL}"
  : "${GITHUB_ENV:?falta GITHUB_ENV}"
  local valor
  valor="$(psql "$SUPABASE_DB_URL" -X -q -At -v ON_ERROR_STOP=1 -f "$D/31_correo_lettermint_remitente.sql" < /dev/null)" \
    || falla "No se pudo leer el remitente de Vault (falló psql)."
  correo_simple "$valor" \
    || falla "No hay un RWADAR_REMITENTE válido en Vault. Haz antes «guardar-correo» en el flujo «Avisos a registrados (base)» o escribe el remitente en «remitente»."
  echo "REMITENTE=$valor" >> "$GITHUB_ENV"
  echo "Remitente (de Vault): $valor"
}

enviar_prueba() {
  local token="${LETTERMINT_API_TOKEN:-}" destinatario="${DESTINATARIO:-}" remitente="${REMITENTE:-}"
  [ -n "$token" ] \
    || falla "Falta el secreto de GitHub LETTERMINT_API_TOKEN (Settings → Secrets and variables → Actions): es el token de PROYECTO de Lettermint."
  token_valido "$token" \
    || falla "El secreto LETTERMINT_API_TOKEN no tiene forma de token (20 a 1024 caracteres visibles, sin espacios)."
  correo_simple "$destinatario" || falla "Falta un destinatario válido."
  correo_simple "$remitente" || falla "Falta un remitente válido (ni escrito ni en Vault)."

  local dir; dir="$(mktemp -d "$TEMPORAL/rwadar-prueba.XXXXXX")"
  # shellcheck disable=SC2064
  trap "rm -rf '$dir'" EXIT
  local fallos=0 ruta nombre asunto texto html clave codigo id estado sandbox info
  echo "Dos correos de prueba a $destinatario, desde «RWAdar <$remitente>», sin seguimiento:"
  resumen "**Correos de prueba** a $destinatario, desde RWAdar <$remitente>:" "" \
    "| Ruta | HTTP | message_id | Estado |" "| --- | --- | --- | --- |"
  for ruta in "" broadcast; do
    if [ -z "$ruta" ]; then nombre="ruta de servicio (la de por defecto)"; else nombre="ruta de difusión (broadcast)"; fi
    asunto="RWAdar · prueba de correo por la $nombre"
    texto="Esto es una prueba del correo de RWAdar, enviada a mano desde GitHub por la $nombre.

En el original del mensaje comprueba que no hay píxel ni imágenes de seguimiento, que este enlace llega sin reescribir: https://rwadar.pages.dev/ y que lleva la cabecera List-Unsubscribe.

$PIE_TEXTO"
    html="<p>Esto es una prueba del correo de RWAdar, enviada a mano desde GitHub por la $nombre.</p><p>En el original del mensaje comprueba que no hay píxel ni imágenes de seguimiento, que este enlace llega sin reescribir: <a href=\"https://rwadar.pages.dev/\">rwadar.pages.dev</a> y que lleva la cabecera List-Unsubscribe.</p><p style=\"color:#555;font-size:12px\">Te escribe RWAdar, un radar independiente de plataformas de tokenización. Responsable: el titular de RWAdar, Plaza Generalitat, s/n, 46600 Alzira (Valencia), España (<a href=\"https://rwadar.pages.dev/privacidad#aviso-legal\" style=\"color:#555\">aviso legal</a> · <a href=\"https://rwadar.pages.dev/privacidad\" style=\"color:#555\">privacidad</a>).</p>"
    jq -n --arg from "RWAdar <$remitente>" --arg to "$destinatario" --arg asunto "$asunto" \
      --arg texto "$texto" --arg html "$html" --arg baja "$BAJA_MAILTO" --arg ruta "$ruta" \
      '{from: $from, to: [$to], reply_to: ["rwadares@gmail.com"], subject: $asunto, text: $texto, html: $html,
        headers: {"List-Unsubscribe": $baja}, settings: {track_opens: false, track_clicks: false}}
       + (if $ruta == "" then {} else {route: $ruta} end)' > "$dir/cuerpo.json"
    clave="$(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen)"
    codigo="$(curl -sS --proto '=https' --globoff --max-time 30 -o "$dir/respuesta.json" -w '%{http_code}' -X POST \
      -H 'Content-Type: application/json' -H 'Accept: application/json' -H @- \
      --data-binary @"$dir/cuerpo.json" "$LETTERMINT/send" \
      <<< "x-lettermint-token: $token"$'\n'"Idempotency-Key: $clave")" || codigo=000
    [[ "$codigo" =~ ^[0-9]{3}$ ]] || codigo=000
    id="$(jq -r 'if type == "object" then ((.message_id // "") | tostring) else "" end' "$dir/respuesta.json" 2>/dev/null || true)"
    [[ "$id" =~ ^[A-Za-z0-9._@:+=/-]{1,200}$ ]] || id="(sin message_id)"
    estado="$(jq -r 'if type == "object" then ((.status // "") | tostring) else "" end' "$dir/respuesta.json" 2>/dev/null || true)"
    [[ "$estado" =~ ^[a-z_]{1,30}$ ]] || estado="-"
    sandbox="$(jq -r 'if type == "object" and .sandbox == true then "si" else "no" end' "$dir/respuesta.json" 2>/dev/null || echo no)"
    echo "  $nombre: HTTP $codigo · message_id $id · estado $estado"
    resumen "| ${ruta:-servicio (por defecto)} | $codigo | $id | $estado |"
    [ "$sandbox" != si ] || echo "    (el proyecto está en modo Sandbox: Lettermint lo simula y no lo entrega)"
    if [ "$codigo" != 202 ]; then
      fallos=$((fallos + 1))
      info="$(detalle "$dir/respuesta.json")"
      info="${info//"$token"/[token]}"
      [ -z "$info" ] || echo "    Lettermint dice: $info"
      case "$codigo" in
        401) echo "    El token de proyecto no vale (falta, caducó o es de otro proyecto)." ;;
        403) echo "    Lettermint no deja enviar con este proyecto (permiso o función no disponible)." ;;
        404|422) if [ -n "$ruta" ]; then echo "    ¿La ruta de difusión no se llama «broadcast»? Mira su slug en Lettermint › proyecto › Routes."; fi ;;
        429) echo "    Demasiadas peticiones: vuelve a lanzarlo en unos minutos." ;;
        000) echo "    Sin respuesta de Lettermint (red o tiempo agotado)." ;;
      esac
    fi
  done
  if [ "$fallos" -gt 0 ]; then
    falla "$fallos de 2 correos no fueron aceptados (se esperaba HTTP 202)."
  fi
  echo "Los dos aceptados (202 = Lettermint los acepta; la entrega se ve en su panel)."
  echo "Ahora, en el buzón, abre el original de cada uno: sin píxel, enlace sin reescribir, cabecera List-Unsubscribe y, en el de difusión, qué añade Lettermint (RUNBOOK, «Encender el correo», paso 10)."
}

listar_bajas() {
  : "${GITHUB_ENV:?falta GITHUB_ENV}"
  local token="${LETTERMINT_TEAM_TOKEN:-}"
  [ -n "$token" ] \
    || falla "Falta el secreto de GitHub LETTERMINT_TEAM_TOKEN: un token DE EQUIPO de Lettermint (Team API, en los ajustes del equipo) que solo pueda leer las supresiones. El de proyecto (LETTERMINT_API_TOKEN) no sirve para esto."
  token_valido "$token" \
    || falla "El secreto LETTERMINT_TEAM_TOKEN no tiene forma de token (20 a 1024 caracteres visibles, sin espacios)."
  local dir; dir="$(mktemp -d "$TEMPORAL/rwadar-lista.XXXXXX")"
  # shellcheck disable=SC2064
  trap "rm -rf '$dir'" EXIT
  local archivo; archivo="$(mktemp "$TEMPORAL/rwadar-bajas.XXXXXX")"
  local base="$LETTERMINT/suppressions?filter%5Breason%5D=unsubscribe&filter%5Bscope%5D=route&page%5Bsize%5D=100"
  local url="$base" paginas=0 otras=0 codigo cursor n
  : > "$dir/crudo"
  while :; do
    paginas=$((paginas + 1))
    [ "$paginas" -le 100 ] || { rm -f "$archivo"; falla "Lettermint devuelve más de 100 páginas de bajas: revísalo a mano."; }
    codigo="$(curl -sS --proto '=https' --globoff --max-time 30 -o "$dir/pagina.json" -w '%{http_code}' \
      -H 'Accept: application/json' -H @- "$url" <<< "Authorization: Bearer $token")" || codigo=000
    [[ "$codigo" =~ ^[0-9]{3}$ ]] || codigo=000
    if [ "$codigo" != 200 ]; then
      rm -f "$archivo"
      case "$codigo" in
        401) falla "Lettermint rechaza el token de equipo (HTTP 401): falta, caducó o no es un token de equipo." ;;
        403) falla "El token de equipo no tiene permiso para leer las supresiones (HTTP 403): créalo con ese permiso." ;;
        429) falla "Demasiadas peticiones a Lettermint (HTTP 429): vuelve a lanzarlo en unos minutos." ;;
        *) falla "Respuesta inesperada de Lettermint al listar las bajas (HTTP $codigo). No se ha cambiado nada." ;;
      esac
    fi
    jq -e 'type == "object" and (.data | type) == "array"' "$dir/pagina.json" > /dev/null 2>&1 \
      || { rm -f "$archivo"; falla "Lettermint devolvió la lista de bajas con una forma inesperada. No se ha cambiado nada."; }
    # Solo las bajas («unsubscribe») de una ruta de difusión: así las guarda
    # Lettermint (ámbito de ruta, categoría «broadcast»). Cada una sale como
    # «correo<TAB>fecha»; lo que no tiene forma de correo o de fecha, como RARA.
    jq -r --arg correo "$CORREO_JQ" --arg fecha "$FECHA_JQ" '
      def baja: type == "object" and .type? == "email" and .reason? == "unsubscribe"
                and .scope? == "route" and .applies_to? == "broadcast";
      .data[] | select(baja)
      | ((.value // "") | tostring | ascii_downcase) as $c
      | ((.created_at // "") | tostring) as $f
      | if ($c | length) <= 254 and ($c | test($correo)) and ($f | test($fecha))
        then [$c, $f] | @tsv else "RARA" end' "$dir/pagina.json" >> "$dir/crudo"
    n="$(jq '[.data[] | select((type == "object" and .type? == "email" and .reason? == "unsubscribe"
                and .scope? == "route" and .applies_to? == "broadcast") | not)] | length' "$dir/pagina.json")"
    otras=$((otras + n))
    cursor="$(jq -r '(.next_cursor // "") | tostring | @uri' "$dir/pagina.json")"
    [ -n "$cursor" ] || break
    [[ "$cursor" =~ ^[A-Za-z0-9%._~-]{1,2000}$ ]] || { rm -f "$archivo"; falla "Lettermint devolvió un cursor de página con forma inesperada."; }
    url="$base&page%5Bcursor%5D=$cursor"
  done
  local raras; raras="$(grep -c '^RARA$' "$dir/crudo" || true)"
  { grep -v '^RARA$' "$dir/crudo" || true; } | sort -u > "$archivo"
  local total; total="$(grep -c "$TAB" "$archivo" || true)"
  { echo "BAJAS_ARCHIVO=$archivo"; echo "BAJAS_LETTERMINT=$total"; echo "BAJAS_RARAS=$raras"; } >> "$GITHUB_ENV"
  echo "Lettermint: $total bajas («unsubscribe») en rutas de difusión ($paginas página(s)); $otras supresiones de otro tipo no se tocan."
  resumen "**Bajas en Lettermint:** $total en rutas de difusión; $otras de otro tipo (no se tocan); $raras con forma rara."
  if [ "$raras" != 0 ] && [ "$total" = 0 ]; then
    falla "$raras bajas de Lettermint no tienen forma de correo o de fecha: revísalas a mano en su panel y aplícalas con rwadar_novedades.baja_por_correo."
  fi
}

aplicar_bajas() {
  : "${SUPABASE_DB_URL:?Falta el secreto de GitHub SUPABASE_DB_URL}"
  local archivo="${BAJAS_ARCHIVO:-}" raras="${BAJAS_RARAS:-0}"
  if [ -z "$archivo" ] || [ ! -f "$archivo" ]; then
    falla "No está la lista de bajas: el paso que la pide a Lettermint no se hizo."
  fi
  local total aplicadas=0 ya=0 reapuntadas=0 sin=0 n=0 r correo fecha
  total="$(grep -c "$TAB" "$archivo" || true)"
  while IFS="$TAB" read -r correo fecha; do
    [ -n "$correo" ] || continue
    n=$((n + 1))
    # psql no lee la entrada estándar (< /dev/null): así no se come la lista.
    r="$(psql "$SUPABASE_DB_URL" -X -q -At -v ON_ERROR_STOP=1 \
      -v correo="$correo" -v suprimido_el="$fecha" \
      -f "$D/31_correo_lettermint_baja.sql" < /dev/null)" \
      || falla "Falló psql en la baja $n de $total. Las anteriores ya quedaron aplicadas; repite la acción (las ya aplicadas no se repiten)."
    case "$r" in
      aplicada) aplicadas=$((aplicadas + 1)) ;;
      ya_de_baja) ya=$((ya + 1)) ;;
      reapuntada) reapuntadas=$((reapuntadas + 1)) ;;
      sin_cuenta) sin=$((sin + 1)) ;;
      *) falla "Respuesta inesperada de la base en la baja $n de $total." ;;
    esac
  done < "$archivo"
  rm -f "$archivo"
  echo "Bajas de Lettermint en RWAdar (de $total): $aplicadas aplicadas ahora · $ya ya estaban de baja · $reapuntadas apuntadas otra vez después (no se tocan) · $sin sin cuenta en RWAdar."
  resumen "**Aplicadas en RWAdar:** $aplicadas ahora · $ya ya estaban de baja · $reapuntadas apuntadas otra vez después · $sin sin cuenta (de $total)."
  if [ "$reapuntadas" -gt 0 ]; then
    echo "  $reapuntadas se apuntaron de nuevo en RWAdar después de darse de baja en Lettermint: manda su permiso nuevo. Lettermint les seguirá bloqueando los anuncios por correo mientras su baja siga allí (quitarla es cosa de su panel, y solo si lo piden)."
  fi
  if [ "$raras" != 0 ]; then
    falla "Además, $raras bajas de Lettermint no tienen forma de correo o de fecha: revísalas a mano en su panel y aplícalas con rwadar_novedades.baja_por_correo."
  fi
}

limpiar() {
  case "${BAJAS_ARCHIVO:-}" in
    "$TEMPORAL"/rwadar-bajas.*) rm -f -- "$BAJAS_ARCHIVO" ;;
  esac
}

case "${1:-}" in
  comprobar) comprobar ;;
  rest-cerrada) rest_cerrada ;;
  remitente) remitente ;;
  enviar-prueba) enviar_prueba ;;
  listar-bajas) listar_bajas ;;
  aplicar-bajas) aplicar_bajas ;;
  limpiar) limpiar ;;
  *) falla "Uso: bash rwadar-app/correo-lettermint.sh comprobar|rest-cerrada|remitente|enviar-prueba|listar-bajas|aplicar-bajas|limpiar" ;;
esac
