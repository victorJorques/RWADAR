# Revisión independiente · entrega 2026-11-05.2 (salen BILLA y Casa de Outeiro; Spiko y Pax Gold corregidos)

**Veredicto: `aprobado_con_cambios`.** El SQL se puede aplicar tal cual. Hace
lo que se pidió y nada más:

- inserta la revisión nueva en `rwadar_catalogo`;
- cambia una sola columna de `public.plataformas` (la web de Pax Gold), con su
  guarda antes y su comprobación después;
- aprueba la revisión al final.

Frente a la publicada `cede1f27`, las otras 22 ofertas son idénticas sentencia a
sentencia. El ensayo en PGlite sale correcto y el ensayo «después de aplicar»,
repetido por mí en una copia aparte, también.

Hay **un cambio obligatorio, solo de documentación**. No toca el SQL ni su
SHA-256. El registro de la retirada de Casa de Outeiro dice que solo un
documento cita el 31/03/2027, y hay dos (§6.2).

- Revisión nueva: `88d5a757-3481-f70e-dc7c-6272704a00b3`
  (huella `88d5a7573481f70edc7c6272704a00b3963248fcf32943caba65a10b86f789a8`).
- Guarda sobre la publicada: `cede1f27-b5eb-36d3-e223-eb4155df2572`
  (huella `cede1f27b5eb36d3e223eb4155df257228fc98e517776cefa0693a0657088823`), entrega 2026-11-05.
- **SHA-256 de `aplicar-y-aprobar.sql`: `24073c9f5afdbf74191fcf95e38d625bbd62c0fb4d9cf09a70115255fe51ba19`**
  (el de la carpeta de trabajo, el de `HEAD` y el de `origin/claude/catalogo-2026-11-05-2` son el mismo).
- SHA-256 de `catalogo.sql`: `0e4a6476e69705b2d009853688d3a8909b20d6c10f3c1e6eef75201bfd2f1a3c`.
- SHA-256 de `comprobacion-retiradas.json` `c62ed909…b19c`, de `cambios-radar.json`
  `a8c746ba…4122` y de `cambios-plataformas.json` `95a72c83…901c`: los mismos que
  cita `contraste-2026-11-05.2.json`.
- Revisor: Claude, 05/11/2026, de 17:40 a 18:05 UTC. No preparé esta entrega.
  Solo leí:
  - en Supabase, una lectura como visitante (GET con la clave publicable);
  - no publiqué nada ni lancé ningún flujo;
  - no hice commits en el repositorio (los ensayos fueron en dos `git clone`
    del scratchpad).
  - `git status` de la carpeta de trabajo quedó como estaba, salvo este archivo.

## 1. Qué ejecuté y qué salió

| Comprobación | Resultado |
|---|---|
| `preparar-entrega.mjs` en la carpeta de trabajo | Reproduce los archivos byte a byte: `git status` sigue limpio y el SHA-256 sigue siendo `24073c9f…ba19`. |
| `comprobar-entrega.mjs` (PGlite, 45 s) | `"resultado": "correcto"`. Son 22 pruebas: 12 de funcionamiento y 10 casos de fallo que no dejan nada a medias. Solo cambió la hora de `pruebas-locales.json` (17:38:40Z → 17:45:09Z). Lo devolví con `git checkout`. |
| `despues-de-aplicar.mjs` en la carpeta de trabajo, antes de aplicar | Se niega («el catálogo sincronizado no es la revisión 88d5a757…») y no toca nada. |
| Ensayo «después de aplicar» en un `git clone` del scratchpad | Ver §7. Todo en verde: `npm test` sale con código 0 y el 404 del worker funciona. |
| `npm test` antes de aplicar, en otro `git clone` | Código 0 en 2 min 5 s. Base de datos: todas con 0 fallidas. Web: 601. Fichas: 71. Precarga: 32. Móvil: 410 correctas y 2 omitidas de 412. Acceso: 146. Herramientas: «fichas.json: 22 fichas (22 con foto)», «Transparencia al día: 24 ofertas» (hasta aplicar sigue la de la publicada) y «Diferencias: 0». Después, `git status` de esa copia quedó limpio: lo que se genera coincide con lo que hay en el commit. |
| gitleaks 8.30.1 sobre `git archive HEAD` con `rwadar-app/gitleaks.toml` | Comprobé el SHA del paquete (`551f6fc8…70eb`, el mismo que exige `ci.yml`). Escaneó 104,66 MB: «no leaks found». |
| Lectura como visitante, 17:54:31–17:54:34 UTC | Siguen publicadas 24 ofertas de la `cede1f27` (8/13/3), con Casa de Outeiro, BILLA y Hausera en camino. Pax Gold sigue con la web `https://paxos.com/paxgold`, el aval NYDFS y ninguna fuente propia. La guarda pasaría ahora. |

## 2. Inventario de `aplicar-y-aprobar.sql`

Separé las sentencias con un analizador propio. Respeta las comillas, los
comentarios y los bloques `$…$`. Después clasifiqué cada sentencia por su
forma y por la tabla en la que escribe.

### 291 sentencias (la 2026-11-05 tenía 286)

| N.º | Sentencia | Tabla | Notas |
|---:|---|---|---|
| 1 | `begin isolation level serializable` | — | |
| 1 | `do $guarda$` | Lee `rwadar_catalogo.publicacion_v2` y `public.catalogo_publicacion` (las dos `for update`), y `rwadar_catalogo.revisiones` | Solo `select` y `raise`. Ver §3. |
| 1 | `insert … values … on conflict (id) do nothing` | `rwadar_catalogo.revisiones` | 25 plataformas, 22 ofertas y `{"principales":8,"secundario":13,"en_camino":1}`. |
| 69 | `insert … on conflict (revision_id,id) do nothing` | `rwadar_catalogo.fuentes` | Las 67 de antes, idénticas, más `spiko-cnmv-iic` y `spiko-cnmv-lps`. |
| 25 | `insert … select … from public.plataformas where slug=… on conflict (revision_id,plataforma_id) do nothing` | `rwadar_catalogo.plataformas` | `public.plataformas` solo se lee. |
| 107 | `insert … select … on conflict do nothing` | `rwadar_catalogo.plataforma_fuentes` | 105 de antes y 2 nuevas: `acceso` de Spiko con las dos fichas de la CNMV. |
| 25 | ídem | `rwadar_catalogo.alertas` | Idénticas. |
| 35 | ídem | `rwadar_catalogo.alerta_fuentes` | Idénticas. |
| 22 | `insert … values … on conflict (revision_id,slug) do nothing` | `rwadar_catalogo.ofertas` | Las 22 con `verificada_el '2026-11-05'`. Ni BILLA ni Casa de Outeiro. |
| 1 | `do $plataformas_guarda$` | Lee `public.plataformas` (`perform … for update`) y `public.fuentes` | Pax Gold tiene que estar columna a columna como se leyó hoy (con la web vieja o ya con la nueva) y sin fuentes propias. Tiene que haber 25 plataformas en el radar y 5 descartadas. |
| 1 | `update public.plataformas set web = 'https://www.paxg.com/' where slug = 'pax-gold' and web = 'https://paxos.com/paxgold'` | `public.plataformas` | **La única escritura fuera de `rwadar_catalogo`.** |
| 1 | `do $plataformas_comprobar$` | Lee `public.plataformas` y `public.fuentes` | Comprueba que la web quedó nueva, que lo demás sigue igual y que las cuentas son 25 y 5. |
| 1 | `do $aprobar$` | Cuenta en `rwadar_catalogo` y hace `update rwadar_catalogo.revisiones set estado='aprobada' … where id = v and estado = 'borrador'` | Exige **25 / 22 / 8 / 13 / 1**, ninguna de las dos retiradas y las 2 fuentes nuevas. Después exige que la revisión sea publicable y que quede publicada. |
| 1 | `commit` | — | |

- **Cada inserción, con su revisión.** Las 284 inserciones llevan
  `'88d5a757-…'::uuid` como primer literal. Ninguna lleva entre comillas otro
  UUID.
  - `88d5a757-…` aparece 287 veces: 284 en las inserciones, 2 en la guarda y 1
    en la aprobación.
  - `cede1f27-…` aparece 4 veces: 1 en la cabecera y 3 en la guarda.
  - La huella `cede1f27…8823` aparece 1 vez, en la guarda.
- **Lo que no hay** fuera de los literales:
  - DDL: `create`, `alter`, `drop`, `truncate`;
  - borrados (`delete`);
  - permisos: `grant`, `revoke`, `set role`;
  - Auth ni Storage: `auth.`, `storage.`;
  - funciones: `security definer`, `execute`, `copy`.

  Los cuatro `do` son bloques anónimos y no crean nada.
- **Efectos indirectos, de disparadores que ya existen:**
  - en `public.plataformas`, `plataformas_actualizada` pone
    `actualizada_el = now()` en la fila de Pax Gold;
  - `plataformas_cambio_estado` y `plataformas_arrastran_emisiones` son
    `after update of estado` y no saltan, porque el `set` no toca `estado`;
  - en `rwadar_catalogo.revisiones`, `fijar_publicacion_v2` y
    `sincronizar_publicacion_catalogo` mueven el puntero a `88d5a757` y dejan
    `retirado = false`, como en todas las entregas.
- **`catalogo.sql`** tiene 286 sentencias: `begin`, las mismas 284 inserciones
  y `commit`. No aprueba ni toca `public.*`.
- **Precedente:** ya hubo `update public.plataformas` con guarda en las
  entregas 2026-11-03.8, 2026-11-04 y 2026-11-04.2, aplicadas con el mismo
  flujo «Aplicar catálogo» (psql con `ON_ERROR_STOP=1`).

## 3. La guarda

| Exigencia | Cómo lo hace | ¿Cumple? |
|---|---|---|
| Transacción serializable | `begin isolation level serializable;` es la primera sentencia | Sí |
| La publicada es la `cede1f27` (o ya la nueva) | `select revision_id … from publicacion_v2 where unica for update`; da error si es `null` o no está en (`cede1f27…`, `88d5a757…`) | Sí |
| La `cede1f27` tiene su huella y está aprobada | Si la publicada es la `cede1f27`, exige `contenido_sha256 = 'cede1f27…8823'` y `estado = 'aprobada'` | Sí. PGlite lo prueba con otra huella. |
| El catálogo no está retirado | `retirado is distinct from false`, que también cubre que falte la fila | Sí |
| Fecha | «Revisión futura» si `current_date < '2026-11-05'`; «Lote caducado» si `current_date > '2026-11-12'` | Sí. Las fichas valen hasta el 12/11 y caducan el 13/11. Lo prueban los lectores de la web y de la app. |
| Identidad del destino | Da error si ya existe `88d5a757` con otra huella o retirada | Sí |
| Pax Gold | Las 15 columnas con datos (todas menos `id`, `creada_el` y `actualizada_el`), comparadas con lo leído hoy; ninguna fila en `public.fuentes` | Sí. Son las mismas columnas que devuelve `select=*` por REST. |

Al repetirlo no pasa nada:

- las inserciones no hacen nada;
- el `update` de Pax Gold no encuentra `web = 'https://paxos.com/paxgold'`;
- la aprobación no encuentra la revisión en `borrador`.

El ensayo lo prueba: aplicado dos veces, ni siquiera cambia `actualizada_el`.

## 4. Diferencias frente a la 2026-11-05 (`cede1f27`)

Comparé los dos aplicadores sentencia a sentencia, con las dos revisiones
cambiadas por un marcador. **280 sentencias son idénticas.** Solo 6 están en la
vieja y 11 en la nueva:

| Solo en la `cede1f27` | Solo en la `88d5a757` |
|---|---|
| guarda sobre la `723968ce` | guarda sobre la `cede1f27` y su huella, con tope el 12/11 |
| `revisiones`: 24 ofertas y en camino 3 | `revisiones`: 22 ofertas y en camino 1; nuevo `origen` (menciona las dos fichas de la CNMV) |
| `plataformas` de Spiko con el texto viejo | `plataformas` de Spiko con el texto nuevo (abajo) |
| `ofertas`: `casa-de-outeiro` | `fuentes`: `spiko-cnmv-iic` y `spiko-cnmv-lps` |
| `ofertas`: `terreno-con-arrendamiento-billa` | `plataforma_fuentes`: `acceso` de Spiko con esas dos |
| `$aprobar$` con 24 y 3 | `$plataformas_guarda$`, `update` de Pax Gold y `$plataformas_comprobar$`; `$aprobar$` con 22 y 1, sin las dos retiradas y con las 2 fuentes |

- **Las 22 ofertas que se quedan** tienen la sentencia byte a byte igual. Solo
  cambia el UUID de la revisión. Así que tampoco cambian sus cifras, avisos,
  documentación, fechas ni vigencia. En PGlite, las vistas públicas de las 22
  son iguales salvo `revision_id`, `ofertas_esperadas` y
  `colecciones_esperadas`, y las tarjetas se ven igual.
- **Las otras 24 plataformas del radar**, las 25 alertas, las 35 fuentes de
  alertas y las 67 fuentes que ya estaban son idénticas.
- **Spiko, «Quién puede acceder»:** se cambia la frase «No hemos comprobado en
  la CNMV que el fondo se comercialice en España, ni llegamos a darnos de alta.»
  por «La CNMV tiene inscritas a SPIKO SICAV como IIC extranjera (n.º 2380, con
  Aldana Capital como comercializadora) y a Spiko Finance como empresa de
  inversión en libre prestación (n.º 5325), pero no muestra qué compartimentos
  de la SICAV están dados de alta en España. No llegamos a darnos de alta.» Lo
  de la AMF y el REGAFI sigue igual. El estado de acceso no cambia
  (`confirmado_condicionado`).
- **`public.plataformas`:** en PGlite solo cambian `pax-gold.web` y
  `pax-gold.actualizada_el`. No cambian `public.fuentes`, `cambios_estado`,
  avisos ni emisiones.
- **Desviación declarada: dos fuentes de la CNMV, no una.** El encargo hablaba
  de `spiko-cnmv-iic`. El texto nuevo afirma además que la CNMV inscribe a
  Spiko Finance (n.º 5325), y la ficha de la SICAV no lo muestra. Por eso
  `spiko-cnmv-lps` hace falta. Si no estuviera, esa frase no tendría fuente.
  **La acepto.** El diff de `comprobaciones-fuentes.json` son exactamente las
  dos claves nuevas (más la coma de la línea anterior).

## 5. Las fuentes de Pax Gold y de Spiko, abiertas por mí

- **https://www.paxg.com/**, leída a las 17:45:19 UTC: HTTP 200, 666.931 bytes,
  SHA-256 `fe75a802…6a12`. Es el mismo SHA que la copia del autor de las
  17:07:25. Dice:
  - «PAXG is issued by Paxos Trust Company, N.A., a U.S. national trust bank
    regulated by the Office of the Comptroller of the Currency.»
  - «For EU visitors: PAXG is currently not available to residents of the
    European Union.»
  - El pie dice «© 2026 Paxos Trust Company, N.A.».

  Es la web oficial de PAXG. La dirección vieja, `https://paxos.com/paxgold`,
  redirige a `https://www.paxos.com/assets/paxg`. **La entrega solo cambia el
  enlace y no afirma nada más sobre Pax Gold**, así que no dice nada que esa web
  no muestre.
- **CNMV, SPIKO SICAV** (`…/iic/iicextranjera?nif=N0401205J&lang=es`), a las
  17:45:44 UTC, con su pestaña `vista=18`:
  - «Información de vehículos de inversión extranjeros · SPIKO SICAV · Nº
    Registro oficial 2380 · 30/01/2026 · SICAV · FRANCIA»;
  - «IIC Comunitaria · IIC Sujeto a la directiva 2009/65/CE»;
  - en «Entidades comercializadoras»: «ALDANA CAPITAL, SOCIEDAD ANONIMA AGENCIA
    DE VALORES».

  Solo tiene dos pestañas, «Datos generales» y «Entidades comercializadoras».
  No hay ninguna lista de compartimentos ni de clases. El HTML mide lo mismo
  que la copia del autor (151.927 y 152.642 bytes), pero el SHA cambia en cada
  lectura porque la página lleva fichas de sesión. El texto es el mismo.
- **CNMV, Spiko Finance** (`…/esi/esisextranjeraslp?tipo=CLP&numero=5325&lang=es`),
  con `vista=17`:
  - «SPIKO FINANCE SASU · Empresas de Servicios de Inversión del Espacio
    Económico Europeo en Libre Prestación · 5325 · 14/01/2026»;
  - «Recepción y transmisión de órdenes … Participaciones y acciones en
    instituciones de inversión colectiva».

**Conclusión: el texto nuevo de Spiko dice solo lo que muestran las dos
fichas.** No afirma que el fondo se comercialice en España. Es lo que pedía la
corrección 2 de la revisión de la 2026-11-05.

## 6. Las retiradas

### 6.1 BILLA (`terreno-con-arrendamiento-billa`): respaldada por la fuente de hoy

Lo leí a las 17:46:25 UTC.

- **API v1** (`…/api/v1/asset/AT0000A3SE89`): SHA-256 `b66346d1…ff72`, el mismo
  que la relectura del autor de las 17:12. Dice `issueEndDate` =
  `issueEndDateOriginal` = `2026-05-15T22:00:00.000Z` (el 16/05 a las 00:00 en
  Viena) y `stage: primary`.
- **API v2** (`/api/v2/assets`): `bricks 6404` y `availableBricks 6322`, es
  decir, **82 suscritas**, a 100 € cada una (`sharePrice 100`).
- **Condiciones de la emisión** (PDF `staging.cdn.brickwise.at/50f3df2f-….pdf`):
  - «Mindestkapitalbedarf … EUR 500.000,00 („Funding-Schwelle“)»;
  - «Zeichnungsfrist … endet am 16.05.2026 um 23:59 Uhr».

  8.200 € es el 1,64 % del mínimo. El motivo es exacto.
- **Lo que no lo contradice:** el contrato permite prorrogar «hasta el triple
  del periodo original», pero no hay ninguna prórroga registrada. El registro
  también recoge que la app de Brickwise sigue enseñando el botón de compra.

### 6.2 Casa de Outeiro (`casa-de-outeiro`): respaldada, pero el registro omite un documento

Lo leí a las 17:46:25 UTC.

- **API de Token City/Alius** (`…/issuance/slug/casa-de-outeiro/expand/…`):
  SHA-256 `00af0e4d…13c5`, el mismo que el autor. Dice `campaign_status
  CAMPAIGN`, `campaign.end_date 2026-10-31`, `extend_days null`,
  `invested 1121000` y `minimum_revenue_money 2000000`.
- **Pestaña «Proceso»** (`…/issuance/71/tabs`): «hasta completar suscripción,
  con fecha límite el 31/10/2026» y «desde el 01/07/2026 hasta el 31/10/2026».

Con esto se sostiene que la campaña de la plataforma terminó el 31/10 sin
ampliación registrada y con 1.121.000 € de un mínimo de 2.000.000 €.

**Pero** en la lista `documents` de esa misma emisión, en la plataforma, hay
**dos** documentos del 30/10/2026 que dicen otra fecha:

- el 263, `26_10_30_Ficha Datos Fundamentales … v5`, que ya cita el registro:
  «Fecha límite: 31/03/2027» y «con fecha límite el 31/03/2027»;
- **el 264, `26_10_30_Anexo I y Anexo II Casa de Outeiro_v3`**, que **también
  dice «Fecha límite: 31/03/2027»** (líneas 71 y 221–222 del texto del PDF,
  descargado a las 17:52:19 UTC; SHA-256 del PDF `332e32c27aabd763…`).

Por eso dos frases del registro no son exactas:

- `comprobacion-retiradas.json` (motivo) y el §4 del `INFORME-ENTREGA.md`
  dicen «la ficha de datos del emisor del 30/10/2026 cita el 31/03/2027 …, pero
  **nada más lo confirma**». Los anexos de la misma fecha lo confirman.
- `textoRetirada` dice «sin ampliación **publicada en la plataforma**». Los
  dos documentos están publicados en la plataforma, como documentos de la
  emisión. Lo que no hay es una ampliación **registrada en la campaña**: la
  API, la pestaña «Proceso» y `extend_days` siguen en el 31/10.

La retirada sigue en pie: la decidió Víctor de forma expresa, y la campaña
registrada está vencida y muy lejos de su mínimo. Lo que hay que corregir es el
registro (obligatorio 1). Ni este texto ni el motivo entran en el SQL, en la
huella ni en nada publicado.

### 6.3 El precedente de mF-ONE (2026-11-03.6)

Se sigue:

- la oferta sale de `rwadar_catalogo` en una revisión nueva;
- su ficha editorial (`fichas.json`, `fotos.json` y `fotos/<slug>.webp`) sale
  en el commit de la entrega. Lo comprobé en el diff: solo esas dos entradas y
  esos dos `.webp`;
- su página, su ruta de la lista cerrada, la transparencia y la ilustración
  publicada salen después de aplicar.

Hay una diferencia declarada: no hubo ronda de escépticos. El precedente la
usó para decidir si retirar. Aquí decide Víctor («Retirar las dos hoy»), y la
regla del ciclo pide una fuente citable y una decisión editorial expresa. Las
dos se cumplen.

## 7. `despues-de-aplicar.mjs` y el ensayo «después de aplicar»

Lo repetí en un `git clone` del scratchpad, con `node_modules` enlazados:

1. `comprobar-entrega.mjs --exportar=DIR`: correcto, con 23 pruebas y 10 casos
   de fallo.
2. `sincronizar.js` contra `ensayo-rest-simulado.cjs`: 25 plataformas, 5
   descartadas y 22 ofertas. `rwadar.csv` tiene 30 filas y solo cambia la de
   Pax Gold (`https://www.paxg.com/`).
3. `despues-de-aplicar.mjs`, la primera vez, hace 9 cambios:
   - lista cerrada de fichas: −2;
   - borra las dos páginas;
   - `transparencia.json`: −2 ofertas y lote `2026-11-05.2` con la revisión
     `88d5a757`;
   - `manifest.json`: −2;
   - borra los dos `oferta-*.webp`;
   - `EDITORIAL_OFERTA_POR_SLUG`: −2;
   - fixture de la app: −2.

   **La segunda vez dice «Nada que cambiar: ya estaba hecho.»**
4. `volcar-seed.js`: una línea, la web de Pax Gold. `transparencia.mjs`: 22
   ofertas. `rwadar-fichas.js`: 25 archivos. `/plataformas/pax-gold` lleva el
   botón «Ir a la web de Pax Gold ↗» y el JSON-LD con `https://www.paxg.com/`, y
   ya no nombra `paxos.com/paxgold`. `/plataformas/spiko` lleva el texto nuevo y
   los dos enlaces a la CNMV. El sitemap ya no tiene las dos.
5. `npm test`, con `lectura-despues-de-aplicar/` creada con lo exportado: código
   0 en 3 min 30 s.
   - base de datos: todas con 0 fallidas;
   - web: 601;
   - fichas: 69 (dos menos);
   - precarga: 32;
   - móvil: 410 correctas y 2 omitidas de 412;
   - acceso: 146;
   - herramientas: «fichas.json: 22 fichas (22 con foto)», «Transparencia al
     día: 22 ofertas», «Diferencias: 0».
6. `ensayo-404.mjs` (tras un commit solo en la copia):
   - `/ofertas/casa-de-outeiro` y `/ofertas/terreno-con-arrendamiento-billa`
     dan el 404 del worker (`noindex, nofollow`, `no-store`) y solo piden
     `/404`;
   - `/plataformas/artex-global-markets` da 301 a `/fuera-del-radar/…`;
   - las dos ilustraciones dan 404 en los 4 casos.

**Sobre el script:** lee el catálogo sincronizado y se niega si no es la
`88d5a757` con 25/22 (8/13/1), sin las dos, con Pax Gold en paxg.com y Spiko con
el texto y las fuentes nuevas. Comprueba el formato de cada archivo antes de
reescribirlo. Lo que borra es exactamente lo que dice. No es atómico: si una
comprobación fallara a mitad, lo ya escrito se quedaría. Como se puede
repetir, basta con corregir y volver a ejecutarlo. No bloquea.

## Cambios obligatorios

1. **Corregir el registro de la retirada de Casa de Outeiro.** Es solo
   documentación: no cambia el SQL, su SHA-256 `24073c9f…ba19` ni la huella
   `88d5a757…`.
   - En `comprobacion-retiradas.json` (`motivo`) y en el §4 del
     `INFORME-ENTREGA.md`, cambiar «pero nada más lo confirma» por algo como:
     «La ficha de datos fundamentales y sus anexos del 30/10/2026 (documentos
     263 y 264 de la emisión, en la plataforma) citan el 31/03/2027 como fecha
     límite, pero la campaña no lo recoge: la pestaña «Proceso», la API
     (`extend_days` vacío) y la web del emisor siguen en 31/10, y las
     condiciones de Alius limitan una campaña a 6 meses».
   - Añadir el documento 264
     (`https://saas-pfp-base-api.token-city.com/v3/dashboard/issuance/71/document/264`)
     a sus `fuentes`, con su literal «Fecha límite: 31/03/2027».
   - En `textoRetirada`, cambiar «sin ampliación publicada en la plataforma»
     por «sin ampliación registrada en la campaña».

   Después, volver a ejecutar `preparar-entrega.mjs`. Solo debe cambiar
   `contraste-2026-11-05.2.json` (el SHA de `comprobacion-retiradas.json` y el
   texto de la retirada). Hay que comprobar que `aplicar-y-aprobar.sql` sigue
   dando `24073c9f5afdbf74191fcf95e38d625bbd62c0fb4d9cf09a70115255fe51ba19`.

## Notas que no bloquean

1. **Pax Gold, «Por qué es fiable»** (`aval` en `public.plataformas`) sigue
   diciendo «bajo supervisión del regulador bancario de Nueva York (NYDFS)». Su
   web oficial dice hoy OCC (Paxos Trust Company, N.A.). Ya estaba publicado
   así y queda fuera de los tres cambios pedidos. Conviene corregirlo en la
   siguiente entrega, con su propia guarda y fuente (`paxg-occ` ya está en el
   radar).
2. **`spiko-cnmv-iic` no comprueba a Aldana Capital.** Su comprobación en
   `comprobaciones-fuentes.json` busca «SPIKO SICAV», «2380 … 30/01/2026» y
   «Entidades comercializadoras», pero el nombre de la comercializadora solo
   sale en la pestaña `vista=18`. Si mañana cambia la comercializadora, la
   comprobación del radar no lo verá. Se podría citar la URL con `&vista=18` o
   añadir un patrón «ALDANA CAPITAL» en una comprobación de esa pestaña.
3. **Frase del traspaso:** «22 comprobaciones y 10 casos de fallo». Las 22
   incluyen los 10 casos.
4. **Orden de merge con `claude/remates-1105`.** Esa rama sigue sin unir a
   `main` y toca:
   - `transparencia.json`, `manifest.json` y `rwadar-20260820.js`;
   - `fichas.json` y `fotos.json` (Hausera);
   - varias `rwadar-site/ofertas/*.html`.

   Uniendo cualquiera de las dos antes, la otra puede chocar en esos archivos.
   Después de aplicar, hay que volver a generar todo (`rwadar-fichas.js`,
   `transparencia.mjs` y `npm test`). Si cambia el formato,
   `despues-de-aplicar.mjs` falla y no reescribe nada a ciegas.
5. **La lectura final del flujo «Aplicar catálogo»** ordena `revisiones` por id
   (`order by 1 desc limit 2`) y no enseñará la `88d5a757`. Vale la lectura como
   visitante que pide el §5 del informe, guardada en
   `lectura-despues-de-aplicar/`. Hace falta también para que pase la prueba
   `ofertas-presentacion.test.cjs`.
6. **Las otras desviaciones declaradas son correctas:**
   - la prueba de la app ya no exige 24 fijas, sino las del lote y que el
     lector no deje ninguna fuera;
   - PGlite usa la copia fija `02_seed_radar_26.sql`, como la 2026-11-05;
   - se renombraron los dos campos `sha256Respuesta…`;
   - el punto de BILLA se queda en el mapa, que no enseña puntos sin oferta.

## Correcciones aplicadas después de la revisión

Las hizo Claude, el autor de la entrega (no el revisor), el 05/11/2026 entre
las 17:58 y las 18:20 UTC. Solo cambia documentación. **El SQL no cambia:**
`aplicar-y-aprobar.sql` sigue dando
`24073c9f5afdbf74191fcf95e38d625bbd62c0fb4d9cf09a70115255fe51ba19` (en la
carpeta de trabajo y en `HEAD`), `catalogo.sql` sigue dando `0e4a6476…1a3c`
y la revisión sigue siendo `88d5a757-3481-f70e-dc7c-6272704a00b3` con la huella
`88d5a757…89a8`. No se publicó nada, no se lanzó ningún flujo y no se tocó
Supabase.

### Antes de corregir: vuelvo a abrir las fuentes

| Fuente | Hora (UTC) | Qué devuelve |
|---|---|---|
| Documento 264 (`…/issuance/71/document/264`) | 17:58:44 | HTTP 200, `application/pdf`, 391.427 bytes, 7 páginas. SHA-256 `332e32c27aabd763e1607c1ebd91a17d00b569cb2bf2019d3d11e1fcc79e976b`: el mismo que el del expediente de la mañana (08:01:19Z) y el del revisor. En el texto del PDF, línea 71: «Fecha límite: 31/03/2027»; línea 76: «Madrid, 30 de octubre del 2026»; líneas 221–222: «Plazo para alcanzar el objetivo de la financiación: hasta completar suscripción, con fecha límite el 31/03/2027». |
| Documento 263 (`…/issuance/71/document/263`) | 17:58:43 | HTTP 200, 429.084 bytes. SHA-256 `147cd972…0de3`, el mismo de la mañana. Líneas 21 y 172: el 31/03/2027. |
| API de la emisión (`…/issuance/slug/casa-de-outeiro/expand/…`) | 17:58:58 | HTTP 200. SHA-256 `00af0e4d…13c5`, el mismo. `campaign_status CAMPAIGN`, `end_date 2026-10-31`, `extend_days null`, `invested 1121000`, `minimum_revenue_money 2000000`. En `documents`: el 263 («26_10_30_Ficha Datos Fundamentales Inversión-capital Casa de Outeiro_v5 (1).pdf») y el 264 («26_10_30_Anexo I y Anexo II Casa de Outeiro_v3.pdf»). |

Lo que dice el revisor se confirma: hay dos documentos del 30/10 con el
31/03/2027, y la campaña registrada sigue en el 31/10.

### Corrección 1 (a): el motivo, sin «nada más lo confirma»

- **`comprobacion-retiradas.json`, `motivo` de `casa-de-outeiro`.** Antes: «La
  ficha de datos del emisor del 30/10/2026 cita el 31/03/2027 como fecha
  límite, pero nada más lo confirma: …». Ahora: «Dos documentos de la emisión
  del 30/10/2026, publicados en la plataforma, citan el 31/03/2027 como fecha
  límite: la Ficha de Datos Fundamentales v5 (documento 263) y el Anexo I y
  Anexo II v3 (documento 264). Pero la campaña no lo recoge: la pestaña
  «Proceso» de Alius, la API (extend_days vacío) y la web del emisor siguen en
  el 31/10, y las condiciones de Alius limitan una campaña a 6 meses (del
  01/07/2026 al 31/03/2027 hay 9).»
- **`INFORME-ENTREGA.md`, §4.** El mismo cambio, en llano: dos documentos en la
  plataforma con el 31/03/2027 (el 263 y el 264), y la campaña no lo recoge.
- **Comprobación:** `rg "nada más lo confirma"` ya solo encuentra este archivo
  de revisión, que cita la frase vieja.

### Corrección 1 (b): el documento 264, entre las fuentes

- Se añade a `fuentes` de `casa-de-outeiro`, justo después del 263:
  - `url`: `https://saas-pfp-base-api.token-city.com/v3/dashboard/issuance/71/document/264`;
  - `horaUtc`: `2026-11-05T08:01:19Z`, la descarga del expediente de la mañana;
  - `de`: el expediente (con su nombre de archivo y su SHA-256), la revisión
    independiente de la mañana, este §6.2 y mi relectura de las 17:58:44Z;
  - `literal`: «Periodo de la oferta: Hasta completar suscripción. Fecha
    límite: 31/03/2027 · Madrid, 30 de octubre del 2026 · Plazo para alcanzar
    el objetivo de la financiación: hasta completar suscripción, con fecha
    límite el 31/03/2027».
- **Comprobación:** `preparar-entrega.mjs` exige que cada fuente tenga `url`
  https, `literal` y hora del 05/11, y que alguna salga del expediente de hoy.
  Pasa.

### Corrección 1 (c): `textoRetirada`

- Antes: «… terminó el 31/10/2026 sin ampliación publicada en la plataforma,
  …». Ahora: «Retirada el 05/11/2026: la campaña en Alius terminó el 31/10/2026
  sin ampliación registrada en la campaña, con 1.121.000 € de un mínimo de
  2.000.000 €.»
- **Comprobación:** el texto nuevo sale igual en `contraste-2026-11-05.2.json`.

### Dos frases más del mismo archivo, por el mismo motivo

No las pedía la revisión, pero decían lo mismo que se corrige:

- La fuente del documento 263 decía en `de` «(lo único que habla de otra
  fecha)». Ahora dice que es uno de los dos documentos de la emisión que citan
  otra fecha, y que el otro es el 264.
- `criterioComun` decía «sin prórroga publicada ni registrada». Para Casa de
  Outeiro, eso choca con los dos documentos publicados. Ahora dice «sin
  prórroga registrada en la campaña», que vale para las dos retiradas.

Las dos están en `comprobacion-retiradas.json`, que ya cambiaba. No llegan a
ningún otro archivo.

### `preparar-entrega.mjs`, dos veces

- **Primera vez:** salida `{"revisionId":"88d5a757-…","hash":"88d5a757…89a8",
  "sha256":"24073c9f…ba19","plataformas":25,"fuentesRadar":69,"ofertas":22,
  "colecciones":{"principales":8,"secundario":13,"en_camino":1}}`. `git status`
  solo añade `contraste-2026-11-05.2.json`, con dos líneas:
  - el SHA-256 de `comprobacion-retiradas.json`, de `c62ed909…b19c` a
    `0b744739cac9d19c8d55c8407e01bdca573f0c1845475970d6d4a104d53340d1`;
  - el texto de la retirada de Casa de Outeiro, el nuevo.
- **Segunda vez:** la misma salida. Comparé el SHA-256 de todos los archivos de
  `verificaciones/2026-11-05.2-v2/` y de `importaciones/catalogo-2026-11-05.2-v2/`
  antes y después: ninguno cambia.
- Los SHA-256 de `cambios-radar.json` (`a8c746ba…4122`) y de
  `cambios-plataformas.json` (`95a72c83…901c`) siguen igual. El de
  `comprobacion-retiradas.json` que cita la cabecera de esta revisión
  (`c62ed909…b19c`) ya no vale: ahora es `0b744739…40d1`, y es el que cita
  `contraste-2026-11-05.2.json`.

### `comprobar-entrega.mjs` (PGlite), en la carpeta de trabajo

`"resultado": "correcto"`, con 22 pruebas (12 de funcionamiento y 10 casos de
fallo que no dejan nada a medias), en 46,7 s. SHA-256 del aplicador:
`24073c9f…ba19`. Solo cambia la hora de `pruebas-locales.json` (17:38:40Z →
18:01:23Z). Esta vez se queda en el commit, porque es la ejecución de ahora.

`despues-de-aplicar.mjs` en la carpeta de trabajo, antes de aplicar: se niega
(«el catálogo sincronizado no es la revisión 88d5a757…») y no toca nada.

### Ensayo «después de aplicar», en una copia aparte

`git clone` de la carpeta en el commit de la corrección (`11139fe`), en el
scratchpad, con `node_modules` enlazados. Los mismos pasos que
`ensayo-despues.json`:

1. `comprobar-entrega.mjs --exportar=DIR`: correcto, con 23 pruebas y 10 casos
   de fallo.
2. `sincronizar.js` contra `ensayo-rest-simulado.cjs`: 25 plataformas, 5
   descartadas y 22 ofertas. `rwadar.csv` tiene 30 filas y solo cambia la de
   Pax Gold (`https://www.paxg.com/`).
3. `despues-de-aplicar.mjs`: los mismos 9 cambios (lista cerrada −2, las dos
   páginas borradas, `transparencia.json`, `manifest.json`, los dos `.webp`,
   `EDITORIAL_OFERTA_POR_SLUG` y el fixture de la app). **La segunda vez: «Nada
   que cambiar: ya estaba hecho.»**
4. `volcar-seed.js`: 25 en el radar, 5 descartadas; en `02_seed.sql` cambia una
   línea. `transparencia.mjs`: 22 ofertas. `rwadar-fichas.js`: 25 archivos.
   `/plataformas/pax-gold` lleva «Ir a la web de Pax Gold ↗» y ya no nombra
   `paxos.com/paxgold`. El sitemap ya no tiene las dos.
5. `npm test`, con `lectura-despues-de-aplicar/` hecha con lo exportado (22
   ofertas, todas de la `88d5a757`): **código 0 en 2 min 12 s**.
   - base de datos: todas con 0 fallidas;
   - web: 601;
   - fichas: 69;
   - precarga: 32;
   - móvil: 410 correctas y 2 omitidas de 412;
   - acceso: 146;
   - herramientas: «fichas.json: 22 fichas (22 con foto), catálogo
     2026-11-05.2-v2», «Transparencia al día: 22 ofertas con transparencia» y
     «Diferencias: 0».
6. `comprobar-ota-compatible.cjs --base c1f7106…`: `"ok":true`, runtime
   `1.4.1(23)`, `publicacionAutorizada: false`. (En la copia hubo que traer
   antes ese commit con `git fetch`, porque el clon no lo tenía.)
7. Commit solo en la copia y `ensayo-404.mjs`:
   - `/ofertas/casa-de-outeiro` y `/ofertas/terreno-con-arrendamiento-billa`
     dan el 404 del worker y solo piden `/404`;
   - `/plataformas/artex-global-markets` da 301 a
     `/fuera-del-radar/artex-global-markets`;
   - las dos ilustraciones dan 404 en los 4 casos.

El resultado es el mismo que el del autor y el del revisor. Era lo esperado:
ni `despues-de-aplicar.mjs` ni ninguna prueba leen `comprobacion-retiradas.json`.

### Nota 3, de paso

La frase del traspaso «22 comprobaciones y 10 casos de fallo» queda en
`PARA-CODEX.md` como «22 pruebas, de ellas 12 de funcionamiento y 10 casos de
fallo». El §6 del informe decía lo mismo («22 cosas y 10 casos de fallo»), y se
corrige igual.

### Lo que no se toca

- **`escaparate-publicacion.json`**, en `fuente.notaOrigen`, dice que las dos
  salen «con el plazo de su campaña vencido sin prórroga publicada». Para Casa
  de Outeiro es la misma imprecisión. No lo cambio:
  - ese texto lo escribe `preparar-entrega.mjs`, y la revisión exige que, al
    volver a ejecutarlo, solo cambie `contraste-2026-11-05.2.json`;
  - no entra en el SQL ni en la huella, y no llega a nada publicado (en el
    ensayo, después de aplicar, no aparece en `rwadar-site/` ni en
    `rwadar-movil/`).

  Se corrige en la próxima entrega que regenere ese archivo.
- Las notas 1 (el aval de Pax Gold) y 2 (comprobar a Aldana Capital) cambian
  datos del radar o del SQL. Quedan para otra entrega, con su guarda.
