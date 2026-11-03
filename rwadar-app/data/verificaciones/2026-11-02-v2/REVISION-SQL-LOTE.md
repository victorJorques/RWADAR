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

## 3. Contenido de las 23 fichas

**Conjunto.** El SQL inserta exactamente los 23 slugs de `propuesta-tarjetas.json` (6/14/3). Ninguna de las 28
retiradas aparece en el SQL, en las fichas ni en la documentación (ni como slug ni citada).

**Comparación tarjeta a tarjeta con la propuesta** (script propio). Las diferencias encontradas son las
transformaciones documentadas en `preparar-lote.mjs`:

- en todas: aviso general «Referencia editorial gratuita…» al principio; `url` añadida a `fuentesActuales`;
  `verificadaEl` 02/11, `vigenciaDias` 1, `precio` null, `patrocinada` false;
- reventa y en camino: `rentabilidad` y `disponibleEs` a null, `estadoRevision` `no_verificable`, fuera las
  métricas «Precio de referencia / Venta más barata / Mejor compra / Rentabilidad publicada / Precio del emisor /
  Última operación / Última compra / Venta»; en Brickwise y en Boss Info/Switzerlend, aviso «los precios cambian…»;
- Spiko: rentabilidad y métrica rehechas con `lecturas/spiko-*-yield.json` (EUTBL 0,0235 → 2,35 %; USTBL 0,0413 →
  4,13 %; `updatedAt` 30/10/2026);
- Aktionariat: «Precio del emisor · 02/11/2026» y «Venta: solo a otros accionistas; el emisor no recompra»;
  Casa de Outeiro y Billa: contador de campaña con fecha 02/11. Esas fechas están respaldadas por lecturas
  propias del 02/11 en `../2026-11-01-v2/revision-independiente/` (REVISION-AKTIONARIAT 16:28–16:35Z;
  REVISION-CAMBIOS-CRITICOS, Alius 16:32:45Z; REVISION-BRICKWISE).

**Cifras frente a claims.** Cada número visible (resumen, rentabilidad, métricas, avisos) se buscó en los claims
`respaldado`/`respaldado_con_alcance` de `../2026-11-01-v2/expedientes/<slug>.json`. Todo aparece salvo:

- mTBILL: 0,07 % y 15 %/50 % están en claims `en_conflicto` (la ficha lo dice: `estadoRevision`
  `fuentes_en_conflicto` y aviso de límites contradictorios); 5,78 M€ es «EUR 5’778’815.22» de un claim respaldado;
  **1,0769 USD · 02/11/2026** sale de la lectura del oráculo (ronda 486) de REVISION-CAMBIOS-CRITICOS; el expediente
  se quedó en 1,0768 USD del 30/10. Respaldado, pero fuera del expediente (ver R2).
- Restos sin importancia: «62» de «Green-Point 62 GmbH»/«Straße 62», «2057» (contrato BILLA), «04/11» y «01/11»
  en textos fechados.

**Las 6 principales, a fondo.**

| Ficha | disponibleEs | estado | Rentabilidad | Comprobado |
|---|---|---|---|---|
| Spiko Letras del Tesoro Euro | true | actual | 2,35 % (31 días, 30/10) | KID 0,25 %, 0/0 %, riesgo 1/7, corte 11:30, CNMV 2380; avisos de capital y reembolso limitado al 10 % |
| Spiko Letras del Tesoro Dólar (alta) | true | actual | 4,13 % en USD (30/10) | 1 USD mínimo, riesgo de cambio en métrica, aviso y literal; GECO AMF; CNMV 2380 es la SICAV (no desglosa compartimentos) y Spiko lista España para T-Bills Dollar |
| Classic Stock Tokens (alta) | true | actual | — | derivado sin propiedad ni voto, contraparte única, sin FGI, 0,10 %, KID 7/7 y «1 año» (releído el 02/11), CNMV LPS 5299, suspensión del cierre |
| mTBILL | true | fuentes_en_conflicto | — (null por el estado) | emisor no supervisado, crédito subordinado, patrimonio negativo, pérdida total, conflicto FT/KID explícito, sin secundario |
| Prosegur Digital Gold | true | actual | — | LBMA +4 % / −6 %, no supervisado, la autorización MiCA no cubre el token, recompra 1–7 días |
| Aktionariat | true | actual | — | 7,25 CHF fijo (02/11), recompra cerrada, sin folleto/KID, ZCHF, vendedores a 6,20 ZCHF (02/11), tope EEE 100 000 € |

Textos de aviso claros, sin promesas, todos `tono: warn` y `verificadaEl` 02/11. La línea «¿España? No» de
REVISION-AKTIONARIAT se refiere a Boss Info y Switzerlend (bajadas a reventa), no a Aktionariat.

**Muestra de reventa / en camino** (boss-info, mf-one, casa-de-outeiro, terreno-con-arrendamiento-billa, más
hausera-proximas-ofertas y las 11 de Brickwise de forma automática). Defectos encontrados:

1. **Billa: métrica duplicada.** Lleva dos «Suscrito / umbral»: «82 de 5.000 … (API 01/11/2026)» y la copia
   «(API 02/11/2026)». Causa: `metricasPara` solo quita las métricas que casan con `DINAMICAS` («Recaudado» sí,
   «Suscrito» no) y después añade la copia con la fecha cambiada. En Casa de Outeiro sale bien porque es «Recaudado».
2. **Billa: aviso con rentabilidad.** «El 5,07 % es una previsión del emisor sobre el nominal…» sigue en una ficha
   «en camino» a la que se le quitó la rentabilidad: la cifra queda suelta y contradice la regla del lote.
3. **Boss Info: precios del día sin fecha.** Aviso «El precio del emisor (8,50) está por encima de la mejor venta
   entre accionistas (8,40).» en reventa, donde el lote dice que se quitan los precios de mercado del día.
4. **mF-ONE: valor del oráculo en reventa.** Métrica «Valor por token · 30/10/2026: 1,1334 USD (oráculo)»; el
   filtro `DINAMICAS` no incluye «Valor por token». Está fechada y respaldada, pero incumple la misma regla.

`comprobar-lote.mjs` no detecta estos casos porque solo mira los campos `rentabilidad`, `precio` y
`disponible_es`, no el texto de métricas y avisos.

La documentación pública (`documentacion-ofertas.json`) conserva 186 referencias de lotes anteriores (desde el
21/09), todas con fecha de consulta, fuente y alcance; incluye cifras comerciales antiguas también en fichas
documentales (por ejemplo, Hausera 12,00 % anunciado el 21/10). Es historial fechado y no la tarjeta; no lo
considero bloqueo.

## 4. Radar

- `node …/comprobar-radar.mjs lecturas/capturas-radar-2026-11-02.json` → «69/69 fuentes dicen lo que respaldan»,
  y `radar-contraste-2026-11-02.json` sale con el mismo SHA-256 (`7ae19cef…`). Métodos: 56 navegador, 12 http,
  1 WebFetch. Capturas entre 17:01:27Z y 17:10:17Z del 02/11.
- `spiko-regafi` (REGAFI, entidad SIREN 980659585) se leyó por WebFetch: la captura no es el JSON en bruto sino un
  resumen escrito («Campos devueltos…: denomination "Spiko Finance"; … cib 19183 …»), sin bytes ni hash. Los dos
  patrones exigidos («Spiko Finance», «19183») están.
- **Valoración: aceptable para este lote**, porque el dato está corroborado por dos capturas en bruto del mismo
  día: `spiko-access` (navegador: «ACPR under no. 19183») y `spiko-regafi-pasaporte-es` (http, JSON de REGAFI:
  empresa de inversión, libre prestación en España desde el 08/01/2026). Reserva: la nota dice que «el proxy corta
  la conexión directa con regafi.fr», pero el mismo host respondió 200 por http a las 17:03:52Z. Conviene volver a
  capturarlo en bruto (R3).

## 5. Fechas y vigencia

- `verificadaEl` (23 fichas y todos sus avisos), `revisadaEl` (23), `fechaConsulta` (419 referencias, del 21/09 al
  02/11) y `consultadaEl` (69 fuentes): ninguna posterior al 02/11. Ningún `fechaDato` posterior a su consulta.
- Revisión: `verificado_el` 02/11 y `vigencia_dias` 7 por defecto → vigente hasta el 09/11 inclusive
  (`comprobar-lote.mjs` lo acepta el 09/11 y lo rechaza el 10/11).
- **Ojo a la vigencia de las cifras.** Las 23 fichas tienen `vigencia_dias = 1`. La vista pública solo enseña
  resumen, disponibilidad, rentabilidad, precio y métricas si `hoy ≤ verificada_el + 1`, es decir, el 02/11 y el
  03/11. Si se aplica el 04/11 o después, las 23 fichas saldrán con «Cifras pendientes de nueva revisión» desde el
  primer minuto.
- Spiko: la lectura del 02/11 (≈17:10Z) dio la cifra del 30/10, y la propia API anunciaba la siguiente para el
  **02/11 a las 18:00Z** (`nextYieldTimestamp` 1793642400). Hoy ya hay, casi seguro, una cifra más reciente. La
  ficha sigue siendo veraz porque dice «publicado el 30/10; consultado el 02/11».

## 6. Fotos maestras de las dos altas

Revisadas a resolución completa (1344 × 768, sin EXIF) y en una simulación del encuadre final (1280 × 880, posición
70 % 55 %). Copias PNG solo en el scratchpad de la sesión.

| | `spiko-letras-del-tesoro-dolar.webp` (`9b2ec7f0…b2b7`) | `robinhood-classic-stock-tokens.webp` (`104a5321…dd05`) |
|---|---|---|
| Escena | columnata neoclásica con escalinata, luz de atardecer, columna aislada a la izquierda | fachada neoclásica con columnas corintias al anochecer, farol encendido |
| Texto / rótulos | ninguno | **sí: el friso lleva una pseudoinscripción grabada** (caracteres ilegibles tipo «LIC'ITY…»), dentro del encuadre final, bajo el velo |
| Marcas, banderas, personas | ninguna (el remate de la columna es abstracto, no una figura) | ninguna |
| ¿Encaja con el activo? | sí: edificio federal genérico ↔ letras del Tesoro de EE. UU. | sí, como metáfora: fachada de bolsa ↔ derivados sobre acciones de EE. UU. |

`fichas.json` y `fotos.json` tienen ya solo las 23 fichas del lote (coinciden con el escaparate), y
`node rwadar-editorial-source/ofertas/generar.mjs --comprobar` pasa: «23 fichas (23 con foto), catálogo 2026-11-02-v2».
Ni lugar, ni pasos, ni conceptos tienen cifras, porcentajes, monedas ni promesas.

- Spiko Dólar: pasos «Abres cuenta con KYC / Compras participaciones / Pides el reembolso», correctos. Concepto y
  texto alternativo correctos. Lugar **«Tesoro de EE. UU.»**: es una institución, no un lugar, y puede leerse como
  que el emisor es el Tesoro. El resto de fichas usa el lugar del subyacente (mTBILL «Estados Unidos», Spiko Euro
  «Zona euro»). Recomiendo «Estados Unidos».
- Robinhood: pasos «Abres cuenta y test / Compras en euros / Cierras con la contraparte», correctos (el paso 3 ya
  va sin marca, como pidió REVISION-ALTAS). Lugar **«Bolsa de EE. UU.»**: da a entender que se compra en una bolsa
  estadounidense, cuando es un derivado OTC con Robinhood Europe (Vilna) como única contraparte. La propuesta
  revisada decía «Vilna · Lituania».
- Nota editorial: las fotos de Spiko Euro, Spiko Dólar y Robinhood son tres columnatas neoclásicas muy parecidas.
- Pendiente según el procedimiento (sección 4): montar las imágenes `oferta-<slug>.webp` de las dos altas,
  revisarlas, precargarlas y comprobarlas en producción **antes** de aplicar el SQL. Hoy no existen.

## 7. Veredicto

**SQL y lote: `aprobado_con_cambios`.** La estructura del SQL es correcta: solo inserciones editoriales de la
revisión nueva en 7 tablas de `rwadar_catalogo` más la aprobación, sin DDL, borrados, Auth, RLS/ACL, funciones ni
credenciales. La guarda serializable funciona en todas sus ramas, y el lote se reproduce byte a byte y pasa el
ensayo PGlite. Los cambios obligatorios son de contenido en 4 fichas documentales.

SHA-256 revisado de `aplicar-y-aprobar.sql`: `de62690a5c13cfbedee83cf109c939604e86be17458fc4c18b71690b4c44c4aa`.
Este SHA **no debe aplicarse**: los cambios obligatorios lo sustituyen por otro, que necesita su propia
comprobación.

### Cambios obligatorios (lote)

1. `terreno-con-arrendamiento-billa`: dejar una sola métrica «Suscrito / umbral» (la de «API 02/11/2026»). En
   `metricasPara`, quitar la original antes de añadir la copia con la fecha nueva.
2. `terreno-con-arrendamiento-billa`: quitar la cifra del aviso «El 5,07 % es una previsión…» (por ejemplo: «El
   reparto que anuncia el emisor es una previsión sobre el nominal; todavía no se ha pagado ningún reparto.»).
3. `boss-info`: quitar los precios del aviso «El precio del emisor (8,50) está por encima de la mejor venta entre
   accionistas (8,40).» (o quitar el aviso entero; ya existe el de «los precios cambian…»).
4. `mf-one`: quitar la métrica «Valor por token · 30/10/2026: 1,1334 USD (oráculo)» (añadir `Valor por token` a
   `DINAMICAS`), salvo que Víctor decida expresamente mantenerla.
5. Regenerar con `preparar-lote.mjs` (puede mantenerse la fecha 02/11, porque no entra ningún dato nuevo), repetir
   `comprobar-lote.mjs` y hacer una revisión breve del diff: solo deben cambiar esas 4 fichas, el hash, el
   `revisionId` y el SHA.

### Condición de fecha (obligatoria)

6. Con `vigencia_dias = 1`, las cifras, resúmenes y disponibilidad de las 23 fichas solo se ven el 02 y 03/11.
   **Aplicar como muy tarde hoy, 03/11.** Desde el 04/11 hay que regenerar con fecha nueva, lo que obliga a repetir
   el radar 69/69, las lecturas (Spiko, oráculo de mTBILL, Aktionariat, Outeiro, Billa) y la revisión.

### Imágenes

- Spiko Dólar: **aprobada**. Recomendado: lugar «Estados Unidos».
- Robinhood: **aprobada con cambios**:
  (a) repetir con otra semilla, o retocar el friso, para quitar la pseudoinscripción;
  (b) cambiar el lugar «Bolsa de EE. UU.» por «Estados Unidos» o «Vilna · Lituania».

### Recomendados (no bloquean)

- R1. Guarda con tope de fecha (`current_date > date '2026-11-03'` → `raise`) para que el lote no se pueda aplicar
  con las cifras ya ocultas.
- R2. Pasar a los expedientes, o a `lecturas/` del lote, las lecturas del 02/11 que hoy solo están en los `.md` de la
  revisión independiente: oráculo de mTBILL 1,0769 USD (ronda 486), Aktionariat 7,25 CHF / 6,20 ZCHF, Outeiro
  1.121.000 € y Billa 82/5.000.
- R3. Volver a capturar `spiko-regafi` en bruto (http o navegador) y corregir la nota sobre el proxy.
- R4. Guardar en `lecturas/spiko-*-yield.json` la hora de consulta. Si se aplica hoy, releer antes la API: la cifra
  del 30/10 tenía relevo anunciado para el 02/11 a las 18:00Z.
- R5. Añadir a `comprobar-lote.mjs` dos pruebas que habrían detectado los cambios 1 a 4: etiquetas de métrica
  duplicadas, y cifras de rentabilidad o precio del día en métricas o avisos de reventa y en camino.

Comprobaciones propias (scripts en el scratchpad, no en el repositorio): inventario de sentencias con analizador
de comillas y bloques `$…$`; casos negativos A–G de la guarda en PGlite; comparación tarjeta a tarjeta con la
propuesta; cruce de cifras con claims; fechas; simulación del encuadre de las fotos. No he ejecutado nada contra
Supabase ni contra servicios remotos, ni he publicado ni hecho commits.
