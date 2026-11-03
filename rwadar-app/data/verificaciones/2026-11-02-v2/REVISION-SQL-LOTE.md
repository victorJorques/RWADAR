# Revisión independiente del lote de catálogo del 02/11/2026

- Revisor: Claude (no preparó el lote). Revisión iniciada el 02/11/2026 y reanudada el 03/11/2026.
- Alcance: solo lectura y comprobaciones locales. Nada contra Supabase ni servicios remotos, sin publicar ni hacer commits.
- Archivos: `rwadar-app/data/verificaciones/2026-11-02-v2/` y `rwadar-app/data/importaciones/catalogo-2026-11-02-v2/`
  (commit de partida `a5ef05a`; fotos y fichas en `5e27762`).

## 0. Huellas de partida (antes de reproducir)

| Archivo | SHA-256 |
|---|---|
| aplicar-y-aprobar.sql | `de62690a5c13cfbedee83cf109c939604e86be17458fc4c18b71690b4c44c4aa` |
| catalogo.sql | `284082cddc4d105ad817ee6c8ef1d14f4a1a9f147fa5c8f25643bc84063db7c1` |
| revision.json | `566cbaaaf2fec3a51da8b98156c44975a8328f3aac21c1f6278c4766e91a1006` |
| escaparate-publicacion.json | `a7f6d49a9887b4ca55245db2d51142194df0162903f822831aed62754a6b005d` |
| documentacion-ofertas.json | `f83adbba0526220d86bd725fc57ac10f630803958ba255c7850af771f2630a3c` |
| radar-canonico-26.json | `313fcce396d4b0735144c137b6f19efaa8c9789a4b7ac1f1ac2e0d8afd18edd7` |
| radar-contraste-2026-11-02.json | `7ae19cef178edf655d8e7f368dfa0aaed310460b1232ce0f2f0574f7f4af8091` |

Revisión nueva: `16040307-b226-5c59-2635-4f77d6ed8698` (hash `16040307b2265c5926354f77d6ed86983390f1e90c219950c8c14fe7becea4fe`).
Revisión anterior prevista: `c406fa37-a1d3-281c-117a-95819762cfcf`.

## 1. Inventario completo de `aplicar-y-aprobar.sql`

Método: un analizador propio separa sentencias por `;` respetando comillas simples, identificadores,
bloques `$etiqueta$` y comentarios (no búsqueda de palabras). 378 294 caracteres, **294 sentencias**:

| # | Sentencia | Tabla | Forma |
|---:|---|---|---|
| 1 | `begin isolation level serializable` | — | — |
| 1 | `do $guarda$` | lee `rwadar_catalogo.publicacion_v2`, `public.catalogo_publicacion`, `rwadar_catalogo.revisiones` (con `for update`) | solo lectura y bloqueo de fila |
| 1 | INSERT | `rwadar_catalogo.revisiones` | `values … on conflict (id) do nothing` |
| 69 | INSERT | `rwadar_catalogo.fuentes` | `values … on conflict (revision_id,id) do nothing` |
| 26 | INSERT | `rwadar_catalogo.plataformas` | `select … from public.plataformas where slug='…' on conflict (revision_id,plataforma_id) do nothing` |
| 109 | INSERT | `rwadar_catalogo.plataforma_fuentes` | `select … from public.plataformas where slug='…' on conflict do nothing` |
| 26 | INSERT | `rwadar_catalogo.alertas` | ídem |
| 36 | INSERT | `rwadar_catalogo.alerta_fuentes` | ídem |
| 23 | INSERT | `rwadar_catalogo.ofertas` | `values … on conflict (revision_id,slug) do nothing` |
| 1 | `do $aprobar$` | cuenta filas y `update rwadar_catalogo.revisiones set estado='aprobada' … where id = v and estado='borrador'` | única actualización |
| 1 | `commit` | — | — |

- Todas las inserciones llevan la misma revisión `16040307-…`; no aparece ningún otro UUID de revisión en ellas.
  La única tabla leída fuera de `rwadar_catalogo` es `public.plataformas` (solo `select id … where slug=`).
- Fuera de literales no hay `create`, `alter`, `drop`, `truncate`, `delete`, `grant`, `revoke`, `policy`,
  `function`, `trigger`, `auth.`, `storage.`, `set role`, `copy`, `execute` ni credenciales. Sin DDL, borrados,
  Auth, RLS/ACL ni funciones.
- `catalogo.sql` contiene las mismas 290 inserciones con `begin;`/`commit;`. El `diff` entre ambos son solo
  las 2+2 líneas de cabecera, el `begin` serializable, la guarda y la aprobación (42 líneas).
- Efectos indirectos al aprobar: los disparadores ya existentes en el esquema (`fijar_publicacion_v2` y
  `sincronizar_publicacion_catalogo`, migraciones del 30/09 y 01/10) mueven el puntero `publicacion_v2` y dejan
  `catalogo_publicacion.retirado=false` (ya era `false` por la guarda). El lote no crea ni cambia funciones.

**Guarda** (comprobada en PGlite con casos propios además de los del ensayo):

| Caso | Resultado | ¿queda la revisión nueva? |
|---|---|---|
| A. Sin publicación previa (puntero nulo) | rechazado «Publicación distinta… <NULL>» | no |
| B. Publicada la 22/10 (`349df4ef…`) en vez de `c406fa37…` | rechazado «Publicación distinta» | no |
| C. `catalogo_publicacion.retirado = true` | rechazado «Catálogo retirado o control ausente» | no |
| D. Fecha futura (simulada moviendo la fecha de la guarda) | rechazado «Revisión fechada en el futuro» | no |
| E. La revisión destino ya existe con otro hash | rechazado «otra identidad» | (solo la fila falsa del caso) |
| F. Partida correcta `c406fa37…` | aplicada; puntero = `16040307…`; estado `aprobada`; las dos revisiones anteriores siguen `aprobada` | sí |
| G. Volver a aplicar sobre la nueva | sin error ni cambios (la guarda admite la propia revisión nueva) | — |

La aprobación exige 26 plataformas, 23 ofertas y 6/14/3 por colección, y después que la revisión salga en
`revision_publicable_v2`; si no, `raise exception` y se deshace todo.

**SHA-256 del SQL final** (`aplicar-y-aprobar.sql`): `de62690a5c13cfbedee83cf109c939604e86be17458fc4c18b71690b4c44c4aa`.

Observación (no bloquea): la guarda de fecha solo impide aplicar **antes** del 02/11; no impide aplicarlo
después del 09/11, cuando el lote ya nacería caducado. Ver «Cambios recomendados».

## 2. Reproducción local

- `node rwadar-app/data/verificaciones/2026-11-02-v2/preparar-lote.mjs` (03/11 07:38 UTC) terminó sin error y
  reescribió sus 9 salidas (3 del SQL y 6 JSON) **byte a byte iguales**; los 17 archivos de ambas carpetas tienen el
  mismo SHA-256 antes y después y `git diff` queda vacío, también después del commit `5e27762` que tocó `fichas.json`/`fotos.json`.
  Salida: `revisionId 16040307-…`, 26 plataformas, 23 ofertas 6/14/3, EUTBL 2,35 %, USTBL 4,13 %.
- `node rwadar-app/data/verificaciones/2026-11-02-v2/comprobar-lote.mjs`: `"resultado":"correcto"`, idempotencia,
  lote anterior conservado, negativos `revision_anterior_incorrecta` y `oferta_ausente`, mismo SHA. Reescribe
  `pruebas-locales.json` solo con la hora (`ejecutadoEl`); lo he devuelto a su versión del commit.
- Aviso ajeno al lote: durante la revisión apareció modificado `rwadar-site/index.html` (precarga y pie
  «pendiente de renovar»). Coincide con otra sesión que estaba pasando la batería `probar-*.mjs`; ninguno de los
  scripts del lote escribe en `rwadar-site`. No lo he tocado.

_(Secciones siguientes en curso.)_
