#!/usr/bin/env bash
# Lee el catálogo publicado como un visitante (REST de Supabase, solo GET, clave
# publicable del propio sitio) y lo guarda en la carpeta indicada.
# Uso: bash .claude/skills/investigacion-catalogo/leer-publico.sh <carpeta>
set -euo pipefail
DEST="${1:?carpeta de destino}"
RAIZ="$(git rev-parse --show-toplevel)"
mkdir -p "$DEST"
U="$(grep -rhoE 'https://[a-z0-9]{20}\.supabase\.co' "$RAIZ"/rwadar-site/assets/*.js | sort -u | head -1)"
K="$(grep -rhoE 'sb_publishable_[A-Za-z0-9_-]+' "$RAIZ"/rwadar-site/assets/*.js | sort -u | head -1)"
T0="$(date -u +%FT%TZ)"
get() { curl -sS --retry 4 --retry-delay 3 -H "apikey: $K" -H "Authorization: Bearer $K" "$U/rest/v1/$1" -o "$DEST/$2" -w "%{http_code} $2\n"; }
get 'catalogo_plataformas_publicas_v2?select=*' plataformas-v2.json
get 'catalogo_ofertas_publicas_v2?select=*' ofertas-v2.json
get 'plataformas?select=slug,nombre,estado,cadenas&order=slug' plataformas-todas.json
T1="$(date -u +%FT%TZ)"
echo "Lectura como visitante (clave publicable, REST de Supabase, solo GET): $T0 – $T1" > "$DEST/hora-lectura.txt"
node -e '
const d=process.argv[1], o=require(d+"/ofertas-v2.json"), p=require(d+"/plataformas-v2.json"), t=require(d+"/plataformas-todas.json");
const c={}; o.forEach(x=>c[x.coleccion]=(c[x.coleccion]||0)+1);
const r={revision:[...new Set([...o,...p].map(x=>x.revision_id))], plataformas:p.length, ofertas:o.length, colecciones:c,
  descartadas:t.filter(x=>x.estado==="descartada").map(x=>x.slug), verificadaEl:[...new Set(o.map(x=>x.verificada_el))]};
console.log(JSON.stringify(r)); require("fs").appendFileSync(d+"/hora-lectura.txt", "Resultado: "+JSON.stringify(r)+"\n");' "$(cd "$DEST" && pwd)"
