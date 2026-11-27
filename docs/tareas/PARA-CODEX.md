# Traspaso entre Codex y Claude

Cada sesión que cambie algo añade una entrada **arriba del todo**: qué hizo,
en qué commits, qué pruebas pasó y qué queda pendiente. Así la otra
herramienta sabe dónde está todo sin tener que adivinarlo.

---

## 27 de noviembre de 2026 (54) · Claude · Disponibilidad por país: RWAdar internacional (web, app y catálogo 2026-11-27.3) · PUBLICADO

- **Orden de Víctor:** escaparate internacional. Se detecta el país de conexión (Cloudflare `/cdn-cgi/trace`, sin
  permiso de ubicación); el usuario elige su país de residencia y el elegido manda. Hay cuatro estados: Disponible,
  Con requisitos, No disponible y Sin confirmar. Nunca se da un país por disponible solo porque no aparezca excluido.
  Todas las ofertas siguen a la vista; si una no se puede desde el país elegido, la tarjeta avisa «No disponible desde
  {país}» en amarillo. Filtro opcional «Solo las disponibles en tu país».
- **Inicio:** justo bajo la portada, «¿Cuál es tu país de residencia?» con Confirmar; después, el país con sus cifras
  y «Cambiar país». Debajo, «Ofertas por país» con bandera y nombre, sin recuentos (Víctor). Portada con fondo liso.
- **Ficha:** sección «Disponibilidad por país», con el estado en tu país, la nota, los países admitidos, excluidos y
  con requisitos, y las fuentes plegadas, con cita y fecha.
- **Criterios:**
  - El 1 es «Se contrata hoy desde tu país de residencia».
  - El 2 y el 3 son «Referencia España»: fuera de España no deciden la Selección.
- **Motor común:**
  - `rwadar-movil/lib/disponibilidad-pais.js` y `paises-contenido.js`, con 251 países ES/EN.
  - La web lleva una copia generada (`rwadar-site/assets/disponibilidad-pais-20261127.js`) que hace
    `rwadar-app/paises/generar.cjs`; `--comprobar` va en `npm test`.
  - País del usuario: `pais-usuario-20261127.js` en la web y `lib/pais-usuario.js` en la app.
- **Datos:**
  - Van en `documentacion.disponibilidad` de cada oferta: `admitidos`, `excluidos` (`*` = todos los demás),
    `conRequisitos`, `fuentes` con literal y fecha, y `nota`/`notaEn`. Grupos `UE` y `EEE`.
  - Sin migración de esquema.
  - Liqi y Amundi no publican a quién admiten: llevan solo una nota, sin reglas, y quedan «Sin confirmar».
- **Catálogo `2026-11-27.3`:**
  - Revisión `cf150c1e` sobre la `38ee1fa9`. PR #226; «Aplicar catálogo» 46027507390.
  - Lectura después de aplicar: 73 plataformas y 40 ofertas (24/13/3), las 40 con su disponibilidad.
  - Las cifras no cambian (vigía: 77 cifras iguales).
  - Sincronización, fichas y sello: PR #227. Con el catálogo caducado, el país dice «Sin confirmar» (web y app).
- **Procedimiento:** sección «Disponibilidad por país» en la skill `investigacion-catalogo`, con el tipo de cambio
  `disponibilidad` del motor. Si la base la tiene, el montaje se para cuando una oferta no la lleva o no es válida.
- **Pendiente:**
  - El correo de novedades sigue apagado (dominio, Lettermint y la casilla del alta oculta): el aviso de hoy salió sin
    correo, por decisión de Víctor.
  - La disponibilidad se comprueba en cada ciclo, como el resto de la ficha.

## 27 de noviembre de 2026 (53) · Claude · Catálogo 2026-11-27.2: todo en una entrega (8 ofertas, 8 plataformas, fichas comprobadas hoy) y noticias b · PUBLICADO

- **Órdenes de Víctor:** «Mételo todo en 1 entrega y acuérdate del gancho de las notis»; «el resto pon que está
  verificado hasta el día de hoy»; ante las candidatas del consolidado sin revisar, «esperar y meter todo»; y «las más
  nuevas van primero» (entrada 52).
- **Catálogo `2026-11-27.2`** (revisión `38ee1fa9`, sobre la `529a54f7`; «Aplicar catálogo» 46001049129; lectura como
  visitante después de aplicar: 73 plataformas y 40 ofertas 24/13/3). 29 de las 32 ofertas publicadas, comprobadas
  hoy (`refechar.py`: solo fechas de consulta; Liqi, ALTERNA y mTBILL conservan el 26/11). 8 ofertas nuevas (HWK 1365,
  Tokinvest plata y Great Hampton Street, HSBC clase SD, MUFG Kioicho en camino, USTNT de EX.IO, Taikang en OSL y
  devolo en CONDA) y 8 plataformas (HWK 1365, HSBC, Daiwa Securities, EX.IO, OSL, CONDA, 1exchange y Pruv). Fuera, con
  motivo en `2026-11-27.2-v2/altas.py`: Mesh CCS (oferta cerrada el 03/10), BAGEY, TPLUS/ULTRA, Lofty, Midas mWIN/mGLO,
  Touchstone, fondos de Pruv y de 1exchange, INANAM, Tidefront y otras.
- **Una revisión independiente:** 5 bloqueantes y 10 menores, corregidos (detalle en
  `docs/INVESTIGACION-CATALOGO-2026-11-27.md`). Imágenes rehechas: la plata (letras inventadas) y la portada de CONDA
  (personas).
- **Noticias, edición b:** entran Canadá (CSA) y Suiza (BNS); salen SBI Solana y BCE estándares DLT. `titulares.json`
  lleva las propuestas de la edición a en las tres que heredaba del mismo día (`validar --publicada` no admite
  «heredado» del mismo día).
- **Tras aplicar (PR #222):** sincronización, transparencia (comprobaciones al 27/11 solo si su fuente se leyó hoy; 20
  conservan el 26/11), lectura `lectura-despues-de-aplicar/` y sello. Tres pruebas que suponían una sola fecha de
  comprobación o menos de 8 ofertas con cifra, generalizadas sin quitar comprobaciones (`probar-fichas.cjs`,
  `calculadora.test.cjs`, `ofertas-presentacion.test.cjs`).
- **Publicado:** «Publicar web» revisión 46006593041 y producción 46006919605, comprobadas en vivo a 390 y 1366 px;
  OTA Android 46006597525 (`comprobar-ota-compatible`: ok, 1.4.2(24)); «Avisar novedad» 46007259314: «El lingote de
  plata más grande del mundo, HSBC y una fundición de 1365: 8 ofertas nuevas». Sin aviso de noticias: ya se avisó hoy.
- **Pendiente:** la rama de cerrojo `claude/cerrojo-ciclo-2026-11-27` sigue sin borrar (Víctor: GitHub › Branches o
  «Limpiar ramas»). Las tarjetas re-fechadas valen hasta el 04/12; las tres del 26/11, hasta el 03/12.

## 27 de noviembre de 2026 (52) · Claude · Plataformas: «Más nuevas primero» en la web y la app · PUBLICADO (PR #223)

- **Orden de Víctor:** «las más nuevas van primero… en plataformas». PR #223, publicado con la web y la OTA de la
  entrada 53. La comprobación `altas.mjs --comprobar` va dentro de `probar-web.mjs` (no en `package.json`, que el
  guardián de OTA trata como cambio nativo).
- **Fecha de alta por plataforma, como hecho:** `rwadar-editorial-source/plataformas/altas.json` (slug → `anadidaEl`
  y `lote`), validado y generado por `altas.mjs`. La fecha es la del primer lote del repositorio
  (`rwadar-app/data/verificaciones/<lote>/radar-canonico-26.json`) en que aparece; el script lo comprueba. Catálogo
  inicial: 2026-09-21 (25); altas del 26/11 (.3 y .4): 32; del 27/11: 8. Más 8 anotadas a mano con `lote: null` y su
  `origen` (la entrega del 27/11 aún fuera de main): 1exchange, conda, daiwa-securities, ex-io, hsbc, hwk-1365, osl y
  pruv. Genera el bloque `altas-plataformas` de `rwadar-20260820.js` y `rwadar-movil/lib/altas-plataformas-contenido.js`.
  `npm test` ejecuta `altas.mjs --comprobar`: falla si una plataforma del catálogo no tiene fecha o si las salidas no
  están al día. **En cada ciclo con altas**: `node rwadar-editorial-source/plataformas/altas.mjs` (las toma del lote;
  añadido al paso 4 de la skill `investigacion-catalogo` y a `entrega/despues.mjs`). Cambia la app, así que pide OTA;
  sin OTA, las altas nuevas salen en la app al final de la lista hasta la siguiente.
- **Web:** `filtered()` ordena por fecha de alta (más nueva primero; empate por nombre; sin fecha, al final por
  nombre) y hay un selector «Más nuevas primero / Por nombre (A-Z)» (`#fOrd`) en la barra de filtros; «Limpiar
  filtros» conserva el orden. La rejilla pre-renderizada sale en ese orden (`rwadar-publicar.js` comprueba la rejilla
  en el orden de `filtered()` y que sea P entera). Matriz y radar, igual.
- **App:** `lib/orden-plataformas.js` (copia de la web); `App.js` ordena `visibles` con él. Diccionario EN: «Ordenar
  plataformas» y «Por nombre (A-Z)».
- **Pruebas:** 5 nuevas en `probar-web.mjs` y la de portadas ajustada al nuevo orden (sin quitar comprobaciones);
  `rwadar-movil/tests/orden-plataformas.test.cjs` (3). `npm test` en verde.
- **Pendiente:** revisar, PR y publicar web + OTA cuando Víctor lo diga.

## 27 de noviembre de 2026 (51) · Claude · Informe de investigación global del 27/11: 8 plataformas nuevas, radar comprobado, noticias y gráfico · PUBLICADO

- **Orden de Víctor:** «Nueva actualización de la app y web… Compruébala y haz la actualización pertinente. Añade lo
  nuevo y retira lo caducado. Actualiza gráfico y noticias también». Sobre Poloniex: «intenta leer la noticia, no la
  descartes directamente».
- **Catálogo `2026-11-27`** (revisión `529a54f7`, sobre la `7f745c7d`; «Aplicar catálogo» 45981185468; lectura como
  visitante después de aplicar: 65 plataformas y 32 ofertas 17/13/2). Altas (8, solo radar): Libeara, HashKey RWA,
  Obligate, Colb, M3Sixty, Hastra, Backpack Securities y OnRe. Fuera, con motivo en `plataformas.py`: Sygnum y
  Matrixdock (403), Estate Protocol, Kapital DX y Pitch, Goldfinch (ya descartada) y los fondos de gestoras sin
  plataforma propia. Ninguna oferta nueva ni retirada: vigía (solo dos cifras de reventa de Brickwise que no tocan
  tarjetas) y relectura con navegador de las 11 internacionales (Liqi, ALTERNA y Amundi no se dejaron leer: conservan
  el 26/11).
- **Radar entero comprobado hoy:** el contrato exige la misma fecha en todas las fuentes, así que se capturaron y
  contrastaron las 109 de antes (`comprobar-radar.mjs`: 106 + 3 a mano en `cambios-radar.json`: REGAFI por API,
  OCC con navegador, Amundi con WebFetch). Por eso el lote vale hasta el 04/12, mientras que las ofertas conservan
  su fecha (26/11) y sus tarjetas caducan el 03/12. La transparencia conserva `revisadoEl` 26/11. Dos pruebas que
  suponían la misma fecha para lote y ofertas cuentan ahora desde la más reciente (`rwadar-acceso/calculadora.test.mjs`
  y `rwadar-movil/tests/ofertas-presentacion.test.cjs`), sin quitar comprobaciones.
- **Cómo:** `2026-11-27-v2/plataformas.py` → `altas.json`; `preparar-entrega.mjs`, `comprobar-entrega.mjs` (PGlite:
  19 pruebas, 8 casos de fallo) y `despues-de-aplicar.mjs` adaptados de la `.4`. Una revisión independiente (orden
  «una sola revisión»): SQL y re-fechado bien; 6 textos de plataformas afinados (decían más que su fuente); SQL rehecho
  y diff normalizado comprobado (solo esas 6). Portadas con RealVisXL (se rehicieron 3: billetes con letras y retrato,
  un casco con letras y un cielo teatral).
- **Noticias del 27/11** (`noticias-diarias/2026-11-27/`): Poloniex abre 16 acciones y ETF tokenizados, el Banco de
  Japón y los cinco retos de la tokenización, coinIX en 21X; vuelve la del BCE sobre garantías; salen Singapur (web en
  mantenimiento, no se pudo confirmar), World Gold Council y Franklin. El primer verificador quitó Poloniex (su descarga
  simple solo trae el armazón; el anuncio se carga con JavaScript); por la orden de Víctor, la edición pasó entera a un
  verificador nuevo con la nota de abrir con navegador esas webs: conforme. La primera verificación queda fuera de Git.
  Freedom/Binance no entra (Binance pide un control anti-bots).
- **Gráfico:** «Tokenización diaria» lanzado a mano a las 09:31 UTC (45974420090): foto real del 27/11 (CoinGecko,
  09:24 UTC; su cambio de 24 h salió anómalo y quedó en blanco por la regla de integridad). Si ya hay foto del día, el
  de la tarde no hace nada.
- **Publicado:** PR #216 (entrega y noticias) y #217 (sincronización y sello); `npm test` en verde y CI en verde.
  «Publicar web» revisión 45984479776 y producción 45984945192, comprobadas en vivo con Chromium a 390 y 1366 px
  (32/65, «Revisado el 27/11», las 8 fichas y portadas en 200, noticias y serie del 27/11, sin errores salvo el 401
  normal de «sin sesión»). **Sin OTA:** no cambia nada que la app lleve dentro. «Avisar novedad»: plataformas nuevas y
  noticias nuevas del día.
- **Pendiente:** Brickwise (Stallhofstraße y Drautalresidenz) en el próximo ciclo de ofertas; la rama de cerrojo
  `claude/cerrojo-ciclo-2026-11-27` no se pudo borrar desde la sesión: que Víctor la borre en GitHub › Branches o lance
  «Limpiar ramas» con `confirmar: BORRAR` e `incluir_cerrojos: si` (las noticias automáticas están apagadas, así que hoy
  no frena nada).

## 26 de noviembre de 2026 (50) · Claude · 25 plataformas del radar del informe de Codex (sección 09), con portada propia · PUBLICADO

- **Orden de Víctor:** «añade las 30 plataformas del radar de Codex», «las que verifiques que son reales; si pide
  aceptar cookies, acéptalas»; «publícalo todo»; **sin agentes**. Sobre las portadas: «el camino raro verde bosque no
  me gusta, parece IA».
- **Catálogo `2026-11-26.4`** (revisión `7f745c7d`, sobre la `25b54edc`; «Aplicar catálogo» 45905680316; lectura
  como visitante después de aplicar: 57 plataformas y 32 ofertas 17/13/2). Solo plataformas, ninguna oferta cambia.
  Altas (25): Raíz, Tokeniza, Etherfuse, HATOR, Real Tokn, Bloktok, Bit2Me STX, Assetera, Estating, Seturion,
  DigiShares, Ctrl Alt, DigiFT, SDAX, Terazo, Luxivana, TangibleX, Tokinvest, PRYPCO Mint, Mesh, Oaksvale, Cradle,
  Shard, Caliber y OKXICE; regiones nuevas `africa` y `oriente-medio`. Fuera, con motivo en `plataformas.py`: AndX,
  Expedit, Tokenia, PropertyHandle, Mercado Bitcoin y WisdomTree (403), DAMREV (429), RedSwan, Binaryx y NewEarthX.
- **Cómo:** `2026-11-26.4-v2/plataformas.py` → `altas.json` (comprueba que cada frase está en la copia de hoy de
  `fuentes/`; lector con aceptación de cookies del 26/11). `preparar-entrega.mjs`, `comprobar-entrega.mjs` (PGlite: 20
  pruebas y 9 fallos que no dejan nada) y `despues-de-aplicar.mjs` adaptados de la `.3` para una entrega sin ofertas y
  con varias regiones. 30 fuentes nuevas en `comprobaciones-fuentes.json`. En la copia de Caliber se taparon los datos
  de contacto de personas (anotado en `lecturas-2026-11-26.json`).
- **Portadas:** 25 con RealVisXL (`portadas.json` guarda prompt y semilla elegida). Se rehicieron con luz normal y
  colores apagados HATOR (el camino del cafetal), SDAX, Seturion, Shard y Cradle, y las que repetían encuadre (Bit2Me
  STX, Terazo, PRYPCO Mint). En escritorio las tarjetas usan la inicial; la portada se ve en móvil.
- **App:** `idioma-en` (web y app, idénticos) suma «África», «Oriente Medio» y «Varias». La prueba
  `rwadar-movil/tests/radar-portada.test.cjs` comparaba el lienzo con 1 cifra fija; ahora toma las cifras del
  catálogo, como pedía su comentario (hay categorías con más de 9). La comprobación de 320 a 767 px con 2 cifras ya
  existía y no cambia.
- **Publicado:** PR #212 (entrega) y #213 (sincronización, sello `5dab6403`); `npm test` 1319/0 y CI en verde.
  «Publicar web» revisión 45910846716 y producción 45911179415, comprobadas en vivo con Chromium a 390 y 1366 px
  (revisión `7f745c7d`, 57/32, África y Oriente Medio, las 25 páginas y portadas en 200, sin errores); OTA Android
  45910859108 (`comprobar-ota-compatible`: ok, 1.4.2(24)); «Avisar novedad» 45911427742 (anuncio 17: «25 plataformas
  nuevas en el radar, con África y Oriente Medio por primera vez»). Cerrojo del ciclo borrado con «Limpiar ramas»
  45911558018.
- **Licencias (decisión de Víctor, 26/11):** «las licencias son cosa de cada plataforma». No se buscan en los registros
  de los supervisores; la ficha sigue diciendo lo que declara cada web y si lo hemos comprobado o no.
- **Pendiente:** fotos reales de Commons cuando deje de responder 429.

## 26 de noviembre de 2026 (49) · Claude · Altas internacionales del informe de Codex (11 ofertas, 7 plataformas), las nuevas primero, fotos realistas y noticias del 26/11 · PUBLICADO

- **Orden de Víctor:** añadir a la actualización el informe global de Codex del 26/11 verificado («RWAdar es
  internacional», «no descartes las internacionales», «pon las nuevas en primera portada»), noticias y gráfico;
  fotos «lo más realistas posibles, sin mucha edición», sin texto y sin repetir; **sin agentes** (todo a mano).
- **Catálogo `2026-11-26.3`** (revisión `25b54edc`, aplicada con «Aplicar catálogo» 45900639213; lectura como
  visitante 21:50 UTC): 32 plataformas y 32 ofertas (17/13/2). Altas: TOHKN IBER1, MMLTI1 y RNCRrev, Liqi, FINEXITY
  bono serie B, Groma, Neuberger Securitize HINC, BlackRock HKD Digital Liquidity, Amundi STOXX Europe 600 tokenizada;
  en camino, Franklin OnChain Euro Liquidity y el bono digital de Mitsui (ALTERNA). Plataformas nuevas: ALTERNA,
  Amundi, BlackRock, FINEXITY, Groma, Liqi y TOHKN (+ región `latinoamerica`). Fuente única: `2026-11-26.3-v2/altas.py`
  → `altas.json`; `preparar-entrega.mjs` (SQL con altas guardadas en `public.regiones`/`public.plataformas`),
  `comprobar-entrega.mjs` (PGlite, 20 pruebas y 9 fallos), `despues-de-aplicar.mjs` (lista cerrada, transparencia,
  **portadas** de plataforma) y `portadas.json`/`portadas.py`. Lo de Codex que **no** se tomó: retirar las 11 de
  Brickwise (sus órdenes se comprobaron), el detalle de HSBC RedCoin y las ~30 plataformas solo de radar (otro ciclo).
- **Orden por defecto:** «Más nuevas primero» en Ofertas (web `emiOrden='nuevas'`, app `ordenOfertas='nuevas'`).
  Con ese orden la lista va sin grupos ni bloque «Selección» (aparecen con «Las más al día primero»). Inicio enseña las
  6 más nuevas y el explicador de las 5 comprobaciones solo si alguna las pasa.
- **Fotos:** las 32 de las ofertas, rehechas con RealVisXL (estilo documental, sin HDR) y revisadas una a una: sin
  letras ni personas, ninguna escena repetida. `generar.mjs` solo recorta y da una nitidez ligera; `plantilla-foto.mjs`
  ya no gradúa ni pone viñeta ni grano en la foto limpia. Las fotos reales de Commons siguen sin poder bajarse desde
  aquí (429).
- **Pruebas adaptadas** (sin debilitarlas): `probar-verificacion.mjs` compara las plataformas antes y después (sin 30
  fijo); `probar-web.mjs` prueba la agrupación y la Selección con «Las más al día primero» y añade «por defecto, las
  más nuevas primero»; la portada admite la herramienta RealVisXL además de ImageGen.
- **Datos:** «No disponible…» explícito en las tres que no se contratan desde España (la tarjeta y la ficha dicen
  lo mismo); el título de Mitsui sin «&» (la página pasaba de 65 caracteres al escaparlo); mTBILL: BaFin releído hoy
  (su documentación da 403 y conserva el 21/11).
- **Noticias del 26/11** (`noticias-diarias/2026-11-26/`, verificación hecha por Claude en las fuentes, sin
  subagentes): Singapur (fondos no tradicionales), SBI Solana Global y oro digital mayorista; salen OKXICE, HSBC y
  BaFin. **Gráfico:** las 16 fotos de Codex cuadran con `datos-tokenizacion`, más la del 26/11.
- **Publicado:** PR #209 (entrega) y #210 (sincronización y sello `741046cd`); «Aplicar catálogo» 45900639213;
  «Publicar web» revisión 45902151896 y producción 45902460217, comprobadas en vivo con Chromium a 390 y 1366 px
  (revisión `25b54edc`, 32/32, «Más nuevas primero», las 18 fichas nuevas y sus portadas en 200, noticias del 26/11,
  gráfico hasta el 26/11, sin errores); OTA Android 45902154729 (`comprobar-ota-compatible`: ok, 1.4.2(24));
  «Avisar novedad» 45902738046 («11 inversiones nuevas de 7 países, algunas desde 100 dólares») y 45902825220
  (las 3 noticias del día). Ramas de la entrega borradas; la de cerrojo, con «Limpiar ramas».
- **Pendiente:** las ~30 plataformas solo de radar del informe de Codex (sección 09), hechas en la entrada 50; fotos reales de Commons para las
  ofertas cuando Commons deje de responder 429 (programa en `origin/claude/fotos-reales-ofertas`, a medias).

## 26 de noviembre de 2026 (48) · Claude · Catálogo re-verificado (vigente hasta el 03/12), Hausera fuera e integración de Codex · PUBLICADO

- **Integrado de Codex/ChatGPT:** #204 (noticias del 25/11) y #206 (integridad del gráfico). La prueba de 400 días de `rwadar-movil/tests/tokenizacion.test.cjs` se ajusta a la regla de #206. Vuestro lote `catalogo-2026-11-25-v2` **no se aplicó**: lo sustituyen las entregas de hoy (ver su `LEEME.md`).
- **Catálogo:** entrega `2026-11-26` (revisión `47b53d7d`, motor, 300 cambios con prueba; todo releído hoy como visitante) y `2026-11-26.2` (revisión `4601a164`, sale `hausera-proximas-ofertas`: Alicante 3 financiada). 21 ofertas (8/13/0), vigentes hasta el 03/12. Informe: `docs/INVESTIGACION-CATALOGO-2026-11-26.md`.
- **Sin agentes:** `rwadar-app/data/verificaciones/2026-11-26-v2/montar.py` genera expedientes y `decisiones.json` a partir de la entrega anterior, el vigía y `fuentes/releidas-2026-11-26.txt`; solo re-fecha lo que se leyó hoy. Sirve de modelo para un ciclo de puesta al día sin investigadores.
- **Retirada:** `2026-11-26.2-v2/` lleva su `preparar-entrega.mjs`, `comprobar-entrega.mjs` (PGlite) y `despues-de-aplicar.mjs`, adaptados del 05/11. `probar-fichas.cjs` ya no usa Hausera como ejemplo de ficha sin datos a favor (ninguna publicada está así: se prueba con una copia del catálogo).
- **Radar:** la documentación de Blocksquare para socios pide sesión; `blocksquare-terms` apunta a su web y cambian sus dos textos (`cambios-radar.json`, `comprobaciones-fuentes.json`).
- **Publicado:** Supabase (las dos entregas), web (revisión y producción), OTA Android y aviso «Avisar novedad».
- **Pendiente:** candidatas nuevas (no se buscaron); fotos reales de las ofertas (en `origin/claude/fotos-reales-ofertas`, 018c833d, a medias); #205 (borrador) sin decidir; GitHub pide a Víctor activar la verificación en dos pasos.

## 26 de noviembre de 2026 · ChatGPT · Integridad del gráfico (preparado, no publicado)

- Rama `chatgpt/grafico-integridad-2026-11-26`. Motor compartido y envoltorio web en commits `e4e1bb4` y `4394173`; regresiones en `72f3c6c`.
- El histórico real de `datos-tokenizacion` tiene 16 fotos, 10–25/11, y la serie anual 30 de 40 tokens (86,2 % de cobertura declarada). La semilla de main no es el histórico completo. El dato del 11/11 conserva +123,9998 % bruto: se normaliza a null al validar, sin cambiar su valor de mercado. Se evita que una lectura antigua desplace la última foto y que la variación de la categoría se atribuya a una muestra con huecos.
- Comprobaciones ejecutadas contra el motor y el histórico real: cinco condiciones dirigidas correctas; envoltorio web idéntico al motor. Se añaden pruebas al suite existente; no se ha ejecutado npm test completo ni verificado el despliegue. No se ha modificado main, rama de datos ni producción. Pendiente CI y revisión de interacción con #204 y #205.
- Mantener CoinGecko como metodología del gráfico existente hasta verificar licencia/API y diseñar una migración separada si procede. No mezclar con RWA.xyz.

---

## 22 de noviembre de 2026 (47) · Claude · Fotos reales de Wikimedia Commons en las noticias y «Lo más importante» hasta 8 · PUBLICADO

- **Publicado:**
  - #199: programa, más las 22 fotos importadas y miradas una a una.
  - OTA con los créditos (run 44996121393).
  - #200: `fotos.realesEnApp: true`, y el sello #201.
  - Web (44996305521 y 44997568664).
  - Edición b de las noticias del 22/11 (#202, merge `5caddf5b`; revisión
    44999590044 y producción 44999738500): 7 noticias, 6 con foto real.
  - «Avisar novedad»: «Las noticias, con fotos reales» (44999839534). El
    aviso de noticias nuevas no se repitió (ya hubo uno hoy).
  - Comprobado en vivo con Chromium a 390 y 1366 px: 6 créditos en /mercado/
    y 2 en Inicio, sin errores.
- **Importación (22 fotos):** el importador descarga ahora la miniatura
  estándar de 1920 px. Wikimedia limita con 429 los originales y los tamaños
  no estándar, y se esperó a que soltara. Acepta `thumb.wikimedia.org` como
  descarga. Quita los caracteres invisibles del autor y rechaza el «©
  European Union, <año en curso>» de la plantilla de la Comisión Europea. En
  `real-monedas-euro-bandera` se escribió a mano «Lukasz Kobus – European
  Commission, © European Union, 2023».
- **CI (dos tropiezos con el paso de Pillow):** primero `:all: ` sin comillas
  rompía el YAML. Después `--user` no lo veía `python3 -I`; ahora se instala
  con `sudo` en el Python del sistema, y probar-web lo comprueba.
- **Pendiente:** las fotos de las ofertas siguen siendo ilustraciones de IA.
  Para que sean reales hace falta permiso de cada plataforma, o fotos libres
  del lugar. Lo decide Víctor.

**Lo que dejó escrito el constructor antes de publicar:**


- **Orden de Víctor (22/11):** «Pero noticias reales y verificadas eh y
  cúrrate más las fotos anda que sean reales». Es el cambio de programa; las
  fotos las elige otro equipo (aquí no se importó ninguna al repositorio).
- **«Lo más importante» hasta 8:** `config.json` (`importanteMax` 8; el
  total sigue en 8), EDITOR.md, SKILL de `investigacion-catalogo` y una prueba
  nueva en `validar.test.mjs` (8 pasan; con 9, V-4 para).
- **Biblioteca, esquema 2:** `fotos.json` admite fotos reales (`"origen":
  "foto"`, `descripcion`, `fuente` de Commons, `licencia` de la lista cerrada,
  `autor`, `sinPersonas`). Las 23 de IA no se tocan. Lo comprueba
  `rwadar-noticias-editoriales.js` (acepta los esquemas 1 y 2).
- **Importador:** `rwadar-editorial-source/noticias/importar-foto.py` (API
  de Commons, agente genérico, pausa y espera si Commons da 429; licencias PD,
  CC0, CC BY y CC BY-SA 2.0–4.0; WebP sin metadatos en 1200/960/480). Prueba
  sin red: `probar-importar-foto.py` (en `npm test`, dentro de probar-web.mjs: el package.json de la raíz no se toca, o el guardián de la OTA pediría otro APK). Probado de
  verdad en una copia fuera del repositorio.
- **Créditos sin romper la app instalada:** `rwadar-site/datos/fotos-noticias.json`
  (se genera con `node rwadar-noticias-editoriales.js --creditos`; lo exigen
  `--comprobar`, el publicador y `comprobar-publicado.mjs`). Web e app: crédito
  corto debajo de cada tarjeta y en el detalle (enlace a Commons), texto
  alternativo con la descripción en /mercado/ y en el detalle, «Ilustración
  generada con IA» en las de IA y la nota que dice la verdad de las fotos que
  se ven (`notaFotos`). Sin el archivo, ningún crédito falso (las claves de IA
  van en el modelo: `FOTOS_IA`).
- **Textos:** GUIA-TITULARES §4 (dos columnas en la tabla: reales primero),
  VERIFICADOR, README de la biblioteca, privacidad y el párrafo de la novedad
  «noticias-foto».
- **Pruebas:** `npm test` entero en verde; después, con el CSS final,
  `npm run test:web` (738/738, con el importador) y
  `rwadar-acceso/noticias-sector.test.mjs` (13/13, en Chromium: crédito,
  texto alternativo, inglés, sin créditos y que nada se monte; esa última
  falla con el CSS de antes). `validar --publicada` y `--comprobar`, bien.
  Importación real de `File:Banco de España (Madrid) 06.jpg` (CC BY-SA 3.0,
  Luis García) en una copia fuera del repositorio: Commons dio 429 dos veces
  y el importador esperó y siguió.
- **Tras la revisión (una sola):**
  - **Interruptor `fotos.realesEnApp`** (`config.json` de noticias
    automáticas, hoy `false`): ninguna noticia publicada puede usar una foto
    real hasta que salga la OTA con los créditos (la app instalada las daría
    por IA y sin su autor). Lo paran el publicador
    (`comprobarFotosRealesEnApp`), `--comprobar` y la regla V-2 (con prueba en
    `validar.test.mjs` sobre una raíz con una foto real). Se pone a `true` en
    un PR aparte después de la OTA.
  - **Crédito con la licencia enlazada:** «Foto: autor · <licencia> · <Wikimedia
    Commons>», con la licencia como enlace a su texto (si tiene: el dominio
    público no) y Commons a la página del archivo (24 px, `_blank`, `noopener
    noreferrer`); en el detalle, «· recortada» / «· cropped». Web (JS y
    prepintado de Inicio) y app (dos Pressable en el detalle). El modelo da
    los trozos (`creditoFoto().partes`, `licenciaUrl`, `recorte`).
  - **Duplicados:** el importador compara el título normalizado, el que
    devuelve la API y el `sha256Original` antes de escribir nada; el
    comprobador de Node para si dos entradas reales tienen el mismo archivo o
    los mismos bytes.
  - **CI:** la prueba del importador ya no se salta sin Pillow (falla);
    `ci.yml` instala `Pillow==12.3.0` en las partes de base y probar-web
    exige que corran las 12 pruebas sin ninguna saltada.
  - **Textos:** novedades y privacidad ya no dicen que haya fotos reales (dicen
    qué lleva cada clase); «no son fotos de la noticia» / «they are not photos
    of the news». Fuera la entrada sin uso «Foto de la noticia: ver en
    Wikimedia Commons».
  - Importación real otra vez (copia fuera del repo, borrada): `File:Banco de
    España (Madrid) 06.jpg` entró; la misma con guiones bajos, rechazada; con
    el interruptor apagado `--comprobar` paró al usarla.
- **Pendiente:** commit y PR; importar las fotos reales (otro equipo: aún
  hay 0) y añadirlas a la tabla de la guía; la OTA con este cambio y, después,
  `fotos.realesEnApp: true`; sello nuevo de contenido antes de publicar; no
  lanzar «Avisar novedad» de fotos reales hasta que se vea alguna.

## 22 de noviembre de 2026 (46) · Claude · Noticias del 22/11 con búsqueda amplia y rama de cerrojo borrada · PUBLICADO

- **Orden de Víctor (22/11, 00:1x UTC):** «Yo no veo noticias distintas».
  Lo publicado era la edición del 21/11 (5 noticias, la más nueva del 18/11):
  el barrido de las 7 fuentes oficiales no daba nada nuevo y las noticias
  automáticas siguen apagadas desde el 18/11.
- **Rama de cerrojo:** `claude/cerrojo-ciclo-2026-11-21` frenaba el
  procedimiento («hay un ciclo manual en marcha»). Desde la sesión, `git push
  --delete` lo corta el proxy. «Limpiar ramas» primero solo listó (solo
  borraría esa; quedaban 18) y después se lanzó con `BORRAR` e
  `incluir_cerrojos: si` (runs 44965779623 y 44965824398).
- **Búsqueda amplia:** flujo de 6 analistas (supervisores de España y la UE,
  otros supervisores, catálogo, radar, mercados españoles y fraudes) con un
  verificador escéptico por candidata: 9 válidas del 17 al 20/11 y 1
  descartada. Se pasaron al editor como pistas (`<trabajo>/pistas/candidatas.json`,
  sin nombres de personas). Un límite de uso cortó 5 verificaciones; se
  retomaron con `resumeFromRunId` al renovarse.
- **Edición:** el editor metió «Kraken ofrece un token de Anthropic que no te
  da acciones» (19/11) y quitó la más antigua (28/10). Con «Lo más importante»
  limitado a 5 y «Hoy» solo para noticias de hoy o de ayer, las demás
  candidatas (avisos de BaFin, FSMA, CSSF y SEC; Ondo; Robinhood) no entraron.
  Verificador independiente «conforme» (pase 1).
- **Publicado:** #197 (merge `00847eb8`), «Publicar web» revisión
  (44972965854) y producción (44973034611), comprobadas en vivo, y aviso de
  noticia nueva («Noticia nueva del sector», run 44973110973).
- **Para decidir (Víctor):** si «Lo más importante» puede llevar más de 5 o si
  «Hoy» admite noticias de hasta 3 días en fines de semana. Hoy deja fuera
  avisos de fraude recientes que sí le importan a un particular. Y si se
  vuelven a encender las noticias automáticas de cada mañana.

## 21 de noviembre de 2026 (45) · Claude · Catálogo 2026-11-21: puesta al día completa · PUBLICADO

- **Orden de Víctor (21/11, 17:34 UTC):** al ver «Hausera · Desde 100 € en
  Alicante 3 (20/11)» en Próximas: «Y esta ya ha pasado… todos esos errores los
  tienes que corregir que el lunes tenemos una reunión muy importante». Sobre
  Brickwise: «Mantener con aviso». Después: «Termina».
- **Publicado:** #193 (entrega, merge `83e33dff`), «Aplicar catálogo» `2026-11-21`
  (run 44959062110), #194 (sincronización y sello), #195 (tarjeta, abajo; main
  = `84acdd7a`), «Publicar web» revisión y producción (run 44962460055), OTA
  Android (run 44960376699, base `fa30779f`) y «Avisar novedad» (aviso n.º
  10). En vivo: revisión `fe0cfaa8-9682-b729-69e2-9bb4f8587ce9`, verificada el
  21/11, 25 / 22 (8 / 13 / 1) / 5; caduca el 29/11 a las 00:00 UTC.
- **Ciclo:** vigía, 6 grupos con revisor independiente, auditoría completa (8
  auditores), motor, una revisión con tres lentes (11 obligatorias) y auditor
  final conforme. Detalle en `docs/INVESTIGACION-CATALOGO-2026-11-21.md` y
  `rwadar-app/data/verificaciones/2026-11-21-v2/`.
- **Vigía antes de aplicar (22:38 UTC):** Schwarzer Weg 18 tenía una orden
  nueva de 71,00 € (21:36 UTC). Se corrigió en `decisiones.json` (DECISIONES
  §9, copia `libro-ordenes-resumen-2026-11-21-2238.json`), con su auditor. Su
  único hallazgo (la hora de lectura «17:41–17:42» en dos alcances) se arregló
  a «22:38 UTC». `INFORME-ENTREGA.md` §9 y `VERIFICACION-ENTREGA.md` §9.
- **Web (#195):** la línea «Mínimo · España» de la tarjeta se desplaza 16 px y
  recorta esa franja para esconder el «·». Un mínimo de dos líneas perdía sus
  primeras letras: Hausera a 390 px decía «suscripción sde el 25/11». Ahora
  lleva sangría francesa en `.escaparate-datos-linea>div` y en
  `#emiLista .escaparate-oferta .escaparate-datos-clave>div`, y el «·» lleva
  `text-indent:0`. Prueba en `probar-web.mjs` (735/735; falla con el CSS de
  antes). Por un `git add -A`, el borrador de
  `docs/INVESTIGACION-CATALOGO-2026-11-21.md` entró en ese mismo commit; se
  completa en este traspaso.
- **Detalle del flujo `entrega-catalogo`:** en la fase «cerrar», los `args`
  grandes (unos 25 KB) llegaron al guion como texto y paró con «args.etiqueta
  es obligatorio». Lo relancé desde la copia del guion de la sesión, con los
  argumentos dentro. Conviene que el guion acepte `args` como texto JSON
  (`typeof args === 'string' ? JSON.parse(args) : args`).
- **Próximo ciclo:** el 25/11 abre la suscripción de Alicante 3 (el 02/12, si
  llegó al 50 %); Spiko Smart Cash sin la ficha de la AMF; motor (mínimo en
  lote, quitar referencias duplicadas, cambiar el nombre de etiquetas, fuentes
  de Midas en el radar, avisar de erratas fáciles); Boss Info y Switzerlend
  (aviso y «principales»); Brickwise, el IRPF en España en el aviso del número
  fiscal.

## 21 de noviembre de 2026 (44) · Claude · Aviso a los usuarios cuando entran noticias nuevas · REGLA Y PROGRAMA

- **Orden de Víctor (21/11):** «Sii vale» a la propuesta de avisar solo cuando
  entren noticias nuevas de verdad, una vez al día como mucho y nunca si solo
  se vuelven a comprobar.
- **Programa:** `noticias-auto.mjs aviso-usuarios --fecha <f> --recientes
  <json>` compara la edición publicada (`rwadar-site/datos/noticias-v2.json`)
  con la que había en producción al empezar (la del cerrojo). Sin noticias
  nuevas, o si `/api/avisos/recientes` ya tiene uno de noticias de ese día
  (hora de España), sale con 3 y no se avisa. Si hay nuevas, deja en
  `<trabajo>/aviso-usuarios.json` el título («Noticia nueva del sector» o «N
  noticias nuevas del sector»), el texto (los titulares o, si alguno lleva una
  palabra que veta la base, un texto sin titulares) y el enlace (`/mercado/`).
  Función `avisoNoticiasNuevas` en `lib/flujo.mjs`, con su prueba en
  `pruebas/flujo.test.mjs` (80/80).
- **Normas:** `AGENTS.md` (excepción permanente de avisos y noticias
  automáticas), `CLAUDE.md`, la skill de noticias (paso 12 bis), su
  `ORDEN-TAREA.md` y el párrafo de noticias de `investigacion-catalogo`.
- **El 21/11 no hubo aviso:** la edición del día solo volvió a comprobar las 5
  noticias de ayer (`aviso-usuarios` da 3).

## 21 de noviembre de 2026 (43) · Claude · Inicio: cada oferta con su fecha más reciente · PUBLICADO

- **Publicado:** #183 (squash) y el sello #185 (merge, main = `e34e421e`);
  «Publicar web» revisión (run 44916584736) y producción (run 44917113684),
  OTA Android (run 44917116482) y «Avisar novedad» (aviso n.º 8, «Cada oferta,
  con su fecha más reciente»), todo en verde. En vivo, las seis tarjetas de
  Inicio dicen «Verificada el 20/11/2026».

- **Orden de Víctor (21/11):** en las ofertas de Inicio, en vez de cuándo se
  añadió (salía «Añadida el 03/11» estando a día 20), «lo que más actualizado
  esté, si la documentación la hemos actualizado o hemos añadido la ficha».
- **Regla (web `fechaTarjetaInicio`, app `fechaTarjeta` de
  `rwadar-movil/lib/recien-anadidas.js`):** la más reciente entre el alta
  («Añadida el»), la verificación del catálogo («Verificada el», solo con
  `estadoRevision === 'actual'`: una oferta con fuentes en conflicto o no
  verificable nunca dice «Verificada») y la revisión de su documentación
  («Actualizada el»). A igual fecha, en ese orden; las fechas futuras no
  cuentan; con el catálogo caducado o sin comprobar, ninguna. Sale en todas
  las tarjetas, no solo en las «Nueva». Inglés: «Verified on» y «Updated on».
- **Pruebas:** `probar-web.mjs` (fechas pintadas y casos límite) y
  `rwadar-movil/tests/recien-anadidas.test.cjs`. Web 734/734, app 690/690.
  Con el catálogo del 20/11, las seis tarjetas dicen «Verificada el 20/11/2026».
- **Revisión única:** 3 hallazgos (estado de revisión, fecha de la
  documentación, esta entrada), arreglados.

## 21 de noviembre de 2026 (42) · Claude · El catálogo se prepara solo y Víctor da el «dale» · TAREA PROGRAMADA

- **Orden de Víctor (21/11):** «Tú ve haciendo en automático si puedes» y,
  tras elegir entre «totalmente solo» y «con un toque tuyo», «Elegimos las dos
  entonces, y así yo te doy también la verificación y miramos que haya abuso
  también del Claude Code y todo».
- **Qué hay:** la tarea programada «Catálogo automático de RWAdar» (cada día a
  las 07:33, España) mira la caducidad con `node .github/vigilante.mjs
  --solo-web`; el vigilante programado no le sirve, porque GitHub lo retrasa
  hasta las 12-14 h UTC. Si al catálogo le quedan menos de 72 h, **prepara** el
  ciclo con la skill `investigacion-catalogo` en «modo preparar»: hasta el PR
  «Catálogo preparado del … (espera el «dale»)» con la CI en verde. No une ese
  PR ni ningún otro, y no lanza flujos que apliquen o publiquen. Después avisa a
  Víctor con una notificación (PR, etiqueta, agentes y minutos) y espera su
  «dale». Si el vigilante falla por otra cosa, solo diagnostica y avisa. Con la
  carpeta del repositorio sucia, no prepara: avisa.
- **Revisión única:** 11 hallazgos, todos arreglados en el mismo PR, incluidos
  los textos fijos «13/11» y «16:52 UTC» de
  `.claude/workflows/auditoria-completa-catalogo.js`.
- **Documentos:** `AGENTS.md` («Preparación automática», que sustituye la pausa
  del 22/10), `docs/INTERNO.md`, la cabecera de
  `docs/tareas/CICLO-DIARIO-CATALOGO.md`, el apartado «Modo preparar» de la
  skill y su texto exacto en
  `.claude/skills/investigacion-catalogo/ORDEN-AUTOMATICA.md`.
- **Sin cambios de permisos para publicar:** aplicar, publicar, enviar la OTA
  y avisar siguen necesitando la orden de Víctor («dale» o «haz la
  investigación»).

## 21 de noviembre de 2026 (41) · Claude · Campana de avisos publicada en la web y la app, y aviso enviado · PUBLICADO

- **Qué ve el usuario:** la campana arriba a la derecha, junto al «?», en la
  web (también sin cuenta) y en la app. Al abrir la lista y ver los avisos, el
  número baja a 0 y sigue en 0 al recargar.
- **Unión:** #179 (web) y #180 (app) con «squash»; #181, el sello sobre
  `cf27a3d5`, con «merge» (main = `fdfc3913`).
- **Arreglo antes de unir #180:** dos textos nuevos de la campana de la app
  («Avisos, ninguno sin leer» y «No se han podido cargar los avisos…») ya
  estaban en el diccionario inglés solo de la web; `probar-web.mjs` exige que
  no se repitan. Se quitaron de `idioma-en-avisos-20261112.js` y viven en el
  común (copia exacta del de la app) con la traducción que ya veía la web.
- **Publicado:** «Publicar web» revisión (run 44909495662) y producción
  (run 44910364762), las dos en verde; OTA Android (run 44910464422, base
  `fa30779…`, pruebas y compatibilidad en verde); «Avisar novedad» (run
  44910668016): aviso n.º 7 «Los avisos, en la campana de arriba», ya en
  `/api/avisos/recientes`.
- **Comprobado en vivo** (Chromium completo, 390 y 1366 px, sin cuenta):
  campana con «6», lista abierta, 0 tras abrir y 0 tras recargar, sin errores.
- **Ojo para pruebas con navegador:** el `chromium_headless_shell` de
  Playwright (153.0.8010.12) **se cuelga** («Target crashed») cuando un
  service worker llama a `navigator.setAppBadge`/`clearAppBadge`; con un
  service worker mínimo de 5 líneas pasa igual, y con el Chromium completo
  (`chromium.launch({ channel: 'chromium' })`) no. En la web real lo dispara
  «avisos-vistos» al abrir la campana. No es un fallo de RWAdar: para probar
  la web publicada con su service worker, usad `channel: 'chromium'` o
  `serviceWorkers: 'block'`.
- **Pendiente (decisión de Víctor):** lo de siempre (ramas con trabajo sin
  unir, reglas de `main`, Brickwise con NIF austriaco) y renovar el catálogo
  antes del 28/11.

## 21 de noviembre de 2026 (40) · Claude · Campana de avisos en la cabecera de la app · UNIDA (#180) · PUBLICADA (ver 41)

- **Orden de la dirección (21/11):** «que los avisos salgan en Inicio arriba a
  la derecha, al lado del interrogante» y «al leerlas, que desaparezca como que
  está pendiente». Esta es la parte de la app (`rwadar-movil/`); la web va en
  su propia rama.
- **Campana** (`componentes/CampanaAvisos.js`, `lib/campana-avisos.js`) al
  lado del «?» de la cabecera, mismo círculo y tamaño, con el dibujo de la
  campana de la web (`Icono nombre="campana"`). Globo con los sin leer (1-9,
  «9+»), solo si hay; etiqueta «Avisos, N sin leer» / «Avisos, ninguno sin
  leer» (y en inglés).
- **Al pulsarla**, la lista a pantalla completa con «Cerrar». Abrirla es
  verlos: se guardan como leídos, el globo baja a 0 y se quitan las
  notificaciones del sistema; los puntos «Sin leer» se quedan mientras sigue
  abierta. Cada aviso con «Abrir» (si tiene a dónde llevar) y, al final,
  «¿No quieres estos avisos?» hacia Perfil › Avisos. Una notificación que
  lleva a Inicio abre la lista.
- **Fuera:** la tarjeta «Avisos» de Inicio (`TarjetaAvisosInicio`) y su
  «Marcar como leídos». La insignia de la pestaña Inicio ya no cuenta avisos:
  solo los «cambios de lo que sigues» no vistos (se dan por vistos tras 1,5 s
  en pantalla).
- **Sin avisos de la cuenta** (interruptores apagados), la campana enseña los
  públicos de `/api/avisos/recientes`. Claves nuevas, por cuenta y borradas
  por «Borrar datos del dispositivo»:
  `rwadar.editorial.avisos.publicos.leidos.v1:<UUID>` y
  `rwadar.editorial.cambios.vistos.v1:<UUID>`.
- **Pruebas:** `npm --prefix rwadar-movil test` 689/689 (nuevas en
  `tests/campana-avisos.test.cjs` y las de la tarjeta de
  `tests/avisos-ui.test.cjs` sustituidas por las de la campana);
  `comprobar-ota-compatible.cjs --base fa30779` ok; diccionario web/móvil
  idéntico (`copiar-idiomas-web.cjs --comprobar`). Capturas a 390 px de la
  exportación web con datos simulados (no es un móvil físico).
- **Pendiente:** unir con la parte de la web, OTA y «Avisar novedad» cuando
  la dirección lo autorice.

## 21 de noviembre de 2026 (39) · Claude · Campana de avisos para todos, junto al «?», y fuera «Marcar como leídos» · UNIDA (#179) · PUBLICADA (ver 41)

- **Encargo de la dirección (21/11):** «que en la pestaña de notificaciones, al
  leerlas, desaparezca como que está pendiente» y «me gustaría que los avisos
  salieran en Inicio arriba a la derecha, al lado del interrogante». Esta
  entrada es la parte de la **web**; la de la app va en su propia rama.
- **Campana para todos** (`rwadar-site/assets/rwadar-20260820.js`): con sesión,
  los avisos de la cuenta como antes; sin sesión, los avisos publicados
  (`/api/avisos/recientes`, la lista de `?avisos=1`), pedidos solo cuando se
  sabe que no hay sesión. Mientras se comprueba la sesión, la campana sale sin
  número. Lo visto sin cuenta se guarda en el navegador en la clave nueva
  `rwadar.avisos.leidos.publicos.v1` (solo números de aviso, aparte de las de
  cada cuenta); la borra «Borrar lo guardado aquí» de Perfil y lo cuenta la
  privacidad (fila «Avisos leídos y número del icono»).
- **Sitio:** en el móvil, justo a la izquierda del «?», del mismo tamaño y
  forma; en escritorio, redonda y oscura en la cabecera. Globo 1-9 y «9+».
- **Abrirla es verlos** (con o sin cuenta): el número, el icono y el service
  worker bajan a 0 y los puntos de «Sin leer» se quedan mientras la lista sigue
  abierta. Sin sesión, al cargar con 0 no se borra ninguna notificación.
- **Fuera «Marcar como leídos»** de la bandeja de la cuenta: se da por vista
  cuando lleva 1,5 s en pantalla (IntersectionObserver; sin él, 1,5 s después
  de pintarse). El globo de la pestaña Perfil sigue contando solo los de la
  cuenta.
- **Pruebas:** `npm run test:web` 733 correctas, 0 fallidas; Chromium nuevo
  (sin sesión: campana junto al «?», lista, vistos, recarga, borrar, inglés y
  escritorio) y el de la cuenta ampliado (Perfil marca a los 1,5 s).
- **Pendiente:** unir con la rama de la app, rehacer el sello de `rwadar-site`,
  publicar la web y lanzar «Avisar novedad» (orden permanente) cuando se
  publique.

---

## 21 de noviembre de 2026 (38) · Claude · Cierre de la limpieza: ramas borradas, migración 39 aplicada y OTA de la app · HECHO

- **Orden de la dirección (21/11):** «Ábrela en móvil y lanza lo que se necesite
  para finalizar el trabajo».
- **App en tamaño de móvil (390 px):** exportación web de `main` con un sustituto
  de `expo-secure-store` solo para la prueba (en una copia aparte, fuera de Git)
  y sesión y datos simulados (sin tocar producción): acceso, Inicio (con la
  ventana de novedades), lista de Ofertas, una ficha, Plataformas, Academy y
  Perfil se abren sin errores de JavaScript. No es un móvil físico.
- **«Limpiar ramas»:** primero solo lista (112 se borrarían, 20 se quedan) y
  después con `BORRAR` e `incluir_cerrojos=si`: de 132 ramas quedan 18 (`main`,
  `datos-tokenizacion` y 16 con trabajo propio sin unir, que el flujo no toca).
  Fuera también `claude/cerrojo-ciclo-2026-11-20` y `-21`.
- **Migración 39 aplicada:** `ensayo-39` («ENSAYO CORRECTO», sin cambios),
  `aplicar-39` (copia cifrada; «RWAdar 35 OK: directo encendido, 2 relojes, 30
  tokens» y «RWAdar 39 OK») y `verificar-39` (solo lectura) en verde.
  `/api/tokenizacion/directo` responde 200 después.
- **OTA Android** con la limpieza de la app (base `fa30779`, runtime 1.4.2(24))
  enviada y en verde. Sin aviso a usuarios: no cambia nada visible.
- **Pendiente (decisión de la dirección):** las 16 ramas con trabajo sin unir,
  entre ellas cinco ajenas al producto que ahora son públicas (guía de Excel,
  BTC en papel, rivales de Mister, panel de control y 33 correos a empresas sin
  enviar); ajustes de GitHub (regla para `main`, aprobación de PR de forks),
  «Correo Lettermint» y «Gestión de Supabase»; arreglar el reloj de las vistas
  en `pglite.test.mjs`.

---

## 21 de noviembre de 2026 (37) · Claude · Limpieza del código y de GitHub en seis partes · SEIS PARTES UNIDAS (#172-#177) · nada nuevo para el usuario

- **Encargo (responsable del proyecto, 21/11):** «Soluciona y arregla todo lo
  de GitHub y limpia el código de la app y la web para que sea más fácil y
  productivo trabajar con el código y esté mejor hecho». Se hizo en seis
  partes que no se pisan; ninguna cambia lo publicado ni toca Supabase.
- **1 · Pruebas (#172).** La prueba que fallaba a veces
  (`probar-avisos-sin-cuenta.mjs`) lo hacía porque PGlite apuntaba dos sucesos
  en el mismo milisegundo y el orden quedaba al azar: ahora espera 2 ms entre
  ellos. Además ya no escribe en la migración versionada. Las 2 pruebas de la
  app que se saltaban corren con un lote inventado para la prueba: la app pasa
  a 0 saltadas.
- **2 · Archivos muertos (#173):** fuera `rwadar-version-codex/` (la copia de
  agosto), las 5 carpetas de pruebas viejas de `.github/`, los guiones de un
  día de `rwadar-app/` y los lotes de importación del 30/09: 151 archivos.
- **3 · Flujo «Limpiar ramas» (#174)**, solo a mano: sin la palabra BORRAR
  solo lista; borra solo las ramas que ya están dentro de `main` o que se
  unieron por squash con la misma punta; nunca `main`, `datos-tokenizacion`,
  una rama con un PR abierto ni la base de uno; los cerrojos de las noticias,
  solo con `incluir_cerrojos=si`. El paso final de la skill del catálogo lo
  cita.
- **4 · Migración 39 (#175):** el reloj del mercado en directo calculaba la
  espera tras fallos con tres exponentes sin tope; con 35-36 fallos seguidos la
  cuenta se salía del tipo y daba «interval out of range» en cada vuelta (576
  fallos del 18 al 20/11). La 39 pone el tope antes de multiplicar; las
  esperas son las mismas. Acciones nuevas en «Mercado en directo (base)»:
  `ensayo-39`, `aplicar-39` y `verificar-39`. **No está aplicada.** Explicación
  completa: [`MERCADO-DIRECTO-2026-11-14.md`](MERCADO-DIRECTO-2026-11-14.md) §5.2.
- **5 · App móvil (#176):** sin el modo local que nunca se encendía; la OTA ya
  no lleva dentro el escaparate de agosto (184 KB, se queda solo como dato de
  prueba); fuera 6 exportaciones que no usaba nadie, y un
  `rwadar-movil/LEEME.md` corto (el largo, en
  [`../archive/2026-11/LEEME-MOVIL-hasta-2026-11-21.md`](../archive/2026-11/LEEME-MOVIL-hasta-2026-11-21.md)).
  Va en la **próxima OTA**, que conviene abrir antes en un móvil de verdad.
- **6 · Cierre (este cambio):**
  - Fuera del árbol 13 carpetas de ciclos viejos de
    `rwadar-app/data/verificaciones/` (del 06/10 al 04/11, ninguna con
    expedientes) y 6 lotes de `rwadar-app/data/importaciones/` anteriores a
    la cadena de PGlite (que empieza el 22/10): 147 archivos que no lee nada.
    **Se queda `2026-10-23-v2`**: los últimos expedientes de 11 ofertas (en
    `2026-11-01-v2`, que el ciclo del catálogo manda leer) citan su radar como
    prueba. Qué se quitó en toda la limpieza y cómo recuperarlo:
    [`../archive/2026-11/VERIFICACIONES-ARCHIVADAS.md`](../archive/2026-11/VERIFICACIONES-ARCHIVADAS.md).
  - Nueve documentos de octubre (los de `docs/estrategia/`, dos revisiones de
    `docs/` y dos de `docs/tareas/`) a [`../archive/2026-10/`](../archive/2026-10/),
    con sus enlaces corregidos.
  - Este traspaso, partido: aquí quedan las entradas desde el 14/11; las
    anteriores, sin cambios salvo los enlaces, en
    [`../archive/2026-11/PARA-CODEX-hasta-2026-11-13.md`](../archive/2026-11/PARA-CODEX-hasta-2026-11-13.md).
    La ruta de este archivo no cambia.
  - Al día: `docs/INTERNO.md` (sin el aviso del 12/11, web publicada el 21/11,
    minutos de GitHub ya no aplica, sin identificadores de revisión),
    `AGENTS.md` y `README.md` (repositorio público, «Limpiar ramas», sin
    `rwadar-version-codex`), `docs/RUNBOOK.md` (ya no dice que el
    repositorio es privado) y `docs/LEEME.md` (enlaces al archivo).
- **GitHub:** el repositorio es público desde el 21/11 a las 09:50 UTC y
  «Automatically delete head branches» está activado.
- **Sin «Avisar novedad»:** ninguna parte publica nada nuevo para el usuario.
- **Pruebas de la parte 6:** `npm test` en verde (la web, 732 comprobaciones,
  las mismas que en `main`; la app, 680 de 680 y 0 saltadas);
  `node --test .github/*.test.mjs` 131 de 131; ninguna ruta quitada sale fuera
  de `docs/` y de los datos; ni «es privado» en `AGENTS.md` ni en
  `docs/INTERNO.md`; este archivo baja de 7.705 a unas 1.080 líneas; ningún
  enlace roto nuevo. `npm --prefix rwadar-app run test:motor-entrega`: 24 de
  25; falla `pglite.test.mjs` (la entrega del 12/11 ya caducó y el ensayo de
  ese día no), igual que en `main` sin este cambio (ya anotado en (33) y
  (35)). Causa: con `hoy` simulado, `comprobar.mjs` solo cambia
  `current_date` en la guarda del SQL; las vistas públicas siguen con la fecha
  real y esconden las cifras de una entrega caducada (`disponible_es` null).
  Arreglo pendiente: simular también el reloj de las vistas en PGlite. No va
  en la CI.
- **Pendiente para la dirección:**
  1. Borrar las ramas
     `claude/cerrojo-ciclo-2026-11-20` y `claude/cerrojo-ciclo-2026-11-21`
     (no corre prisa mientras la tarea de noticias siga desactivada, como lo
     está desde el 18/11). Si se vuelve a encender con esas ramas vivas, la
     mañana se para sola. Se puede hacer a mano en GitHub › Branches o con
     «Limpiar ramas» con BORRAR e `incluir_cerrojos=si`.
  2. Lanzar «Limpiar ramas»: primero sin escribir nada (solo lista), mirar la
     lista y después con BORRAR. Hay unas 10 ramas de copias intermedias que
     no están dentro de `main` (no las borra el flujo): confirmar que no se
     quieren y borrarlas a mano. Y decidir qué hacer con 5 ramas ajenas al
     producto que ahora son públicas (la de los correos a empresas sin
     enviar, cuanto antes).
  3. Aplicar la 39 con su orden: «Mercado en directo (base)» con `ensayo-39`,
     después `aplicar-39` y después `verificar-39`. Hasta entonces, el próximo
     corte largo de CoinGecko vuelve a provocar el mismo fallo.
  4. Ajustes de GitHub: una regla para `main` (Settings › Rules) que impida
     borrarla y el force-push y obligue a entrar por PR con la CI en verde;
     «Require approval for all external contributors» para las PR de forks
     (Settings › Actions); «Correo Lettermint» (quitar el programado o
     encender `RWADAR_BAJAS_LETTERMINT_DIARIO=si`) y «Gestión de Supabase»
     (crear el secreto `SUPABASE_ACCESS_TOKEN` o quitar el flujo).
  5. Antes de la próxima OTA, probarla en un móvil de verdad (lleva la parte
     5). Para el próximo APK, quitar `expo-status-bar` y `@expo/ngrok` de
     `rwadar-movil/package.json` (ahora bloquearía la OTA).

## 21 de noviembre de 2026 (36) · Claude · Repositorio público, entrega 2026-11-20.2 aplicada e Inicio por fecha de alta · PUBLICADO

- **GitHub sin minutos (21/11, 01:54 UTC):** el plan gratuito de Actions se
  agotó. Decisión de la dirección: hacer público el repositorio (Actions sin
  límite y gratis). Antes, revisión previa: el escáner de secretos sobre los
  1.120 commits del historial no encuentra ninguna clave real (pruebas,
  claves públicas y páginas de terceros), y los nombres completos de los dos
  colaboradores salen de los archivos actuales (PR #169). El historial no se
  reescribe: quedan en él los correos de los commits y esos nombres (lo aceptó
  la dirección). Hecho público a las 09:50 UTC; comprobado sin sesión.
- **Inicio (PR #167):** el carrusel «Ofertas» va de la más nueva a la más
  antigua (fecha de alta, 6 como mucho, sin huecos para las antiguas) y todas
  las tarjetas llevan «Mínimo · España», en la web y en la app.
- **Entrega 2026-11-20.2 (PR #168) aplicada** a las 10:05 UTC: revisión
  `94f7fd5d`, 22 ofertas y 25 plataformas; leída como visitante. Vigía antes de
  aplicar: Schwarzer Weg sube su venta más barata de 69,90 € a 71,90 € (la
  ficha lo dice con fecha 20/11; para el próximo ciclo), un documento de mTBILL
  y el VL de Spiko euro por leer, y la CNMV ya no da resultados para Hausera.
- **Publicado (21/11):** PR #170 (sincronizar y sello) unido; «Publicar web»
  revisión y producción a las 10:16 y 10:18 UTC, comprobadas a 390 y 1366
  (Inicio de la más nueva a la más antigua, frase nueva de Smart Cash, sin las
  fuentes caídas, mercado con «foto del 21/11, 02:50», directo 200); OTA
  Android (base `fa30779`) enviada a las 10:16 UTC; «Avisar novedad» «Inicio
  con las ofertas más recientes y fichas al día» a las 10:21 UTC, visible en
  `/api/avisos/recientes`.
- **Ofertas caducadas (orden del 21/11):** según la auditoría del 20/11 no hay
  ninguna; Randhartingergasse 9 y Hinterstoder piden número fiscal austriaco
  (ya lo avisan): quitarlas solo si lo pide la dirección.

## 21 de noviembre de 2026 (35) · Claude · Entrega 2026-11-20.2 revisada y lista para aplicar; GitHub sin minutos · APLICADA (ver 36)

- **Encargo (responsable del proyecto, 20/11, 22:30 UTC):** «Lo viejo que no
  valga obviamente quítalo». Carpetas: `rwadar-app/data/verificaciones/2026-11-20.2-v2/`
  y `rwadar-app/data/importaciones/catalogo-2026-11-20.2-v2/`. Parte de la
  publicada `eca89db7`. Revisión `94f7fd5d`, SQL `622881c1…87cb`.
- **73 cambios en 18 fichas:** dos fuentes fuera (mTBILL 404, GECO de Smart
  Cash), fecha del dato «Acceso desde España» de las tres de Spiko al 13/11 y
  68 referencias de «Datos con su fecha» superadas por un dato de hoy. Lo que se
  deja a propósito: `DECISIONES-COORDINADOR.md` e `INFORME-ENTREGA.md`.
- **Motor ampliado:** tipos `fuenteQuita` y `tarjetaFecha` (FORMATO.md, pruebas
  en motor.test.mjs); segunda entrega del mismo día; PGlite aplica la migración
  38 tras el lote 2026-11-20. `motor.test.mjs` + `flujo.test.mjs`: 24/24.
- **Revisión única** (SQL, contenido, cumplimiento): aprobada con cambios. Smart
  Cash dice ahora «ningún registro público confirma que este fondo esté dado de
  alta para venderse en España» (C1) y el informe se corrigió (S1/O1).
  `auditar`: una sola sentencia cambia, la pedida; PGlite correcto; sin
  secretos. Sin auditor, por la orden de una sola revisión
  (`VERIFICACION-ENTREGA.md`).
- **Disponibilidad de las ofertas (21/11):** según la auditoría del 20/11,
  ninguna de las 22 ha caducado ni desaparecido. Randhartingergasse 9 y
  Hinterstoder (Brickwise) piden número fiscal austriaco (ya lo avisan); quitar
  solo si lo pide la dirección.
- **Bloqueo:** desde el 21/11 a las 01:54 UTC, GitHub Actions no arranca ningún
  trabajo de la cuenta (sin máquina ni registro; GitHub sin incidencias): casi
  seguro, minutos del plan gratuito agotados. Falta: presupuesto en GitHub ›
  Billing o esperar al nuevo ciclo; después «Aplicar catálogo» con la fecha
  `2026-11-20.2`, sincronizar, sello, publicar web, OTA y «Avisar novedad».
- **Pendiente aparte:** PR #167 (Inicio: ofertas de la más nueva a la más
  antigua, web y app); `pglite.test.mjs` (12/11) ya fallaba antes; las ramas
  `claude/cerrojo-ciclo-2026-11-20` y `-21` no se pueden borrar desde estas
  sesiones (403): las borra la dirección en GitHub. Para no repetirlo, no crear
  ramas de cerrojo desde sesiones en la nube.

---

## 20 de noviembre de 2026 (34) · Claude · Mercado: «hoy» solo con datos de hoy y la categoría de CoinGecko con su nombre · SIN PUBLICAR

- **Encargo (Víctor, 20/11):** «lo viejo que no valga, quítalo… que no vuelvan
  a haber textos ni datos falsos». Hallazgos 4 y 5 de
  `rwadar-app/data/verificaciones/2026-11-20-v2/auditoria/sitio-web.md`.
- **Motor** (`rwadar-movil/lib/tokenizacion.js`, copiado a la web con
  `copiar-modelo-web.cjs`): `rotuloDato(tipo, dato, { idioma, ahora, incluidos })`
  decide el rótulo; `datoDeHoy` (día de España, Europe/Madrid, y no
  `foto-guardada`), `momentoEspana`, `textoCategoria` y `CATEGORIA_COINGECKO`
  («Tokenized Assets» = `tokenized-products`).
- **Web** (`mercado-20261111.js`) **y app** (`MercadoBolsa.js`): «Total de la
  categoría (foto del DD/MM, HH:MM)», «Valor el DD/MM (N mayores)», Inicio
  «copia del DD/MM, HH:MM» y el subtítulo de «Por tipo de activo» («Foto del
  DD/MM, HH:MM.» en vez de «Hoy.») cuando el dato no es de hoy o es una foto
  guardada; con datos de hoy, como antes. La línea de la fuente dice
  «categoría «Tokenized Assets»» y «Cómo se calcula», «tokens de la categoría
  «Tokenized Assets» de CoinGecko (N % del total de la categoría)» (sin el
  «hoy», que tampoco era seguro). Inglés en línea, como el resto del mercado.
- **Pruebas:** nueva en `rwadar-movil/tests/tokenizacion.test.cjs` (hoy, ayer,
  foto guardada, medianoche de Madrid, verano, otro año); actualizadas las de
  la app y las de Chromium (`rwadar-acceso/tokenizacion.test.mjs`,
  `mercado-fino-navegador.test.mjs`). `npm run test:web`, `npm --prefix
  rwadar-movil test` y OTA compatible (`ok:true`) en verde.
- **Pendiente:** publicar la web y enviar la OTA (cambia la app) cuando Víctor
  lo autorice, y después «Avisar novedad».

## 20 de noviembre de 2026 (33) · Claude · Ciclo del catálogo con auditoría completa, radar corregido y mercado en directo arreglado · PUBLICADO

- **Encargo (Víctor, 20/11):** «actualiza las fichas y la información de
  RWAdar, ofertas, noticias, todo antes de las 12 de la noche»; «revisa todas
  las ofertas e información bien»; «todo lo falso fuera… que no vuelvan a haber
  textos ni datos falsos»; «el valor de mercado con el gráfico… al momento»;
  «la investigación de nuevas ofertas, en profundidad».
- **Catálogo 2026-11-20** (revisión `eca89db7`, PR #163): 22 ofertas, válido
  hasta el 27/11. Investigación por grupos + auditoría completa de cada dato
  visible + una revisión de la entrega (3 lentes) + corrección + `auditar` +
  auditor final. Resumen: [`INVESTIGACION-CATALOGO-2026-11-20.md`](../INVESTIGACION-CATALOGO-2026-11-20.md).
- **Mercado en directo** (PR #161, migración 37): el alta de tokens agotaba la
  secuencia `smallint` (error 2200H desde el 16/11 03:33 UTC). Aplicada,
  sembrada y verificada; `/api/tokenizacion/directo` vuelve a 200.
- **Radar** (PR #162, migración 38, flujo nuevo «Textos del radar (base)»): 23
  plataformas con textos falsos o sin fuente corregidos, con revisión
  independiente; aplicada con copia antes.
- **Motor de la entrega:** cambia un aviso del radar por código (con guarda) y
  la guarda del orden de referencias compara etiqueta y valor.
- **Auditoría completa como paso fijo** (skill y
  `.claude/workflows/auditoria-completa-catalogo.js`).
- **Ofertas nuevas:** 14 expedientes (7 nuevos de la búsqueda en profundidad),
  ninguna admitida hoy, todas con revisión independiente.
- **Pendiente:** ver «Lo que queda» del informe. `pglite.test.mjs` del motor
  falla igual en main (no lo causa este ciclo). Las tareas de noticias
  automáticas del 15 al 18/11 no corrieron. Copias antiguas de 11-13/11 con
  `spiko-web-es-particulares-render.json` siguen en Git (revisar si llevan el
  nombre de un testimonio).

## 20 de noviembre de 2026 · Claude (montador) · Re-montaje de la entrega 2026-11-20 con la auditoría completa · SIN APLICAR NI PUBLICAR

- `rwadar-app/data/verificaciones/2026-11-20-v2/decisiones.json`: se conserva el
  montaje de las 17:19 UTC y se añaden las correcciones A1–A21 de
  `DECISIONES-COORDINADOR.md` §6 (Spiko con la VL del 20/11: 2,45 % y 4,00 %;
  avisos de pérdida total; Brickwise sin rentabilidades en «Datos con su fecha»;
  citas del KID; número fiscal austriaco; Kraken, mTBILL, Robinhood, Prosegur,
  Boss Info y Hausera). Serie de VL de Spiko leída a las 20:43 UTC en
  `grupos/spiko/fuentes/api-20-11-tarde/`.
- Revisión `c8727d7d-cd09-d2cf-d3dc-da3158fe6812`, SQL `4380fcf3…dffe6`
  (sustituye al `4418ad20…`). `preparar --repetir`, `comprobar` (PGlite, 19 + 6
  casos) y el ensayo «después de aplicar» en una copia aparte: ver
  `INFORME-ENTREGA.md` y `ensayo-despues.json`.
- No montables con el motor tal cual (en `noAplicado`): A3 (solo la fecha del
  dato de una tarjeta) y la tarjeta de A21 (la web enseña «Sin comprobar…» para
  cualquier «Sin confirmar…»). Sin commits: los hace el coordinador.
## 20 de noviembre de 2026 · Claude · Textos del radar corregidos (migración 38) · PREPARADO, SIN APLICAR

- **Encargo (orden de la dirección del 20/11, 17:40 UTC):** «Todo lo falso
  fuera… que no vuelvan a haber textos ni datos falsos». La auditoría del
  ciclo encontró falsos o sin fuente los textos de julio y agosto de la tabla
  base `public.plataformas` (aval, nota, acceso, cadenas, región y el motivo
  de dos descartadas).
- **Hecho (rama `claude/textos-radar-2026-11-20`, sobre
  `claude/catalogo-2026-11-20`):** `rwadar-app/db/38_textos_radar.sql` (una
  transacción, guarda y UPDATE por plataforma, repetible) y
  `38_textos_radar_verificar.sql` (solo lee; «RWAdar 38 OK: 23
  plataformas»); los mismos textos en `02_seed.sql` y
  `rwadar-movil/fixtures/escaparate-local.json` (la copia fija
  `pruebas/02_seed_radar_26.sql` no se toca: sus lotes antiguos esperan los
  textos de entonces);
  flujo «Textos del radar (base)» (`textos-radar-base.yml`: ensayo-38,
  aplicar-38 con TEXTOS y copia cifrada, verificar-38); prueba PGlite
  `rwadar-app/probar-textos-radar.mjs` (en `npm test` y en `partes-ci.mjs`).
  Antes, ahora y fuente: `rwadar-app/data/verificaciones/2026-11-20-v2/TEXTOS-RADAR.md`
  (datos en `textos-radar.json`).
- **Pruebas:** `probar-textos-radar.mjs` 29/29; `probar-avisos-registrados.mjs`; `flujos.test.mjs` 13/13;
  `probar-escaparate-local` 34/34, `probar-radar-canonico-local` 14/14,
  `probar-verificacion-local-ui` 13/13. No se corrió `npm test` entero.
- **Pendiente:** unir a main, `ensayo-38` y `aplicar-38` (no se ha tocado
  Supabase ni lanzado ningún flujo), «Publicar web» y el aviso de novedad.
  Fuera de este cambio (ver TEXTOS-RADAR.md): licencias y avisos de la capa de
  revisión (Pax Gold OCC 31/10, Midas condiciones finales, Reental), región
  «EE. UU. y España» de Reental (no existe), importe y acceso de Securitize,
  y añadir fuentes nuevas (domoblock.io/faq, documentación de Toucan).

---
## 20 de noviembre de 2026 · Claude · Mercado en directo: arreglo del corte del 16/11 (migración 37) · PREPARADO, SIN APLICAR

- **Qué pasaba:** desde el 16/11 03:33 UTC el directo no guardaba nada
  (`error_2200h`): las altas de tokens de la 35 gastaban un id de la
  secuencia `smallint` de `rwadar_mercado.tokens` por cada token propuesto,
  aunque existiera (~60 cada 5 min), hasta agotarla.
- **Arreglo:** `rwadar-app/db/37_mercado_directo_secuencia.sql` (+ copia en
  `supabase/migrations/20261120180000_…`), su verificador
  `37_mercado_directo_secuencia_verificar.sql` y las acciones `ensayo-37`,
  `aplicar-37` y `verificar-37` del flujo «Mercado en directo (base)».
  Prueba nueva: `rwadar-app/probar-mercado-directo-secuencia.mjs` (en
  `npm test` y `test:directo`).
- **Pendiente:** aplicarlo en producción con los pasos de
  `docs/tareas/MERCADO-DIRECTO-2026-11-14.md` §5.1 (ensayo-37 → aplicar-37 →
  verificar-37 → sembrar → estado a los 15 y 30 min).

## 14 de noviembre de 2026 (32) · Claude · Noticias del 14/11, recuadro «Activa los avisos» y notificaciones sin cuenta · TODO PUBLICADO Y ENCENDIDO

- **Encargos de la dirección (14/11):** «publícalo todo: las notificaciones,
  el gráfico, las noticias»; «que para activar las notificaciones salga el
  aviso al salir la ventana de novedades»; «que el gráfico y las noticias se
  actualicen automáticamente»; «que salga en iPhone y Android y que funcionen
  aunque no tengan cuenta o no hayan iniciado sesión».
- **Noticias del 14/11:** publicadas con la skill (editor, verificador pase 1
  «con_cambios», 2 correcciones del programa, pase 2 «conforme»), PR #154
  unido con «merge», «Publicar web» revisión y producción con comprobación en
  vivo. Por el camino, dos frenos: #150 (CI) y #153 (3 commits); la edición
  verificada no cambió (idéntica al byte).
- **Arreglo de la tarea de cada mañana (#152):** `sello.test.mjs` simulaba el
  día con la fecha fija `2026-11-14` en una copia del repositorio y chocaba con
  la edición real de ese día (la CI del PR de las noticias fallaba). La copia
  quita esa edición antes de simular. Ojo: un PR cuyo título empiece por
  «Noticias automáticas» lo trata la CI como el de la mañana (#151 se cerró
  por eso).
- **Tarea programada:** «Noticias automáticas de RWAdar», cada día a las
  08:32 (España), se despierta en la **sesión fija con el repositorio**
  («Noticias automáticas de RWAdar (sesión fija con el repositorio)», etiqueta
  `rwadar-noticias-automaticas`); su prueba de arranque pasó (repositorio,
  push en seco, GitHub, red, Skill y Agent). Rama de cada día:
  `claude/noticias-<fecha>`. La tarea antigua (sesión nueva sin repositorio)
  queda desactivada y renombrada «(antigua, sin repositorio; no usar)».
- **Gráfico:** el directo se actualiza solo cada 5 minutos (Supabase); la
  serie diaria la lanza GitHub (hoy, 13:39 UTC).
- **Recuadro «Activa los avisos» (#155, sello #156):** OTA n.º 33 y web n.º 105
  (revisión) y 106 (producción).
- **Notificaciones sin cuenta (#157, sello #158; detalle en (29)-(31) y en
  `AVISOS-SIN-CUENTA-2026-11-14.md`):** `ensayo-36` correcto en producción,
  `aplicar-36` (con copia antes y verificación), `activar-sin-cuenta`, web n.º
  107 (revisión) y 108 (producción), OTA n.º 34. Comprobado en vivo:
  `/api/avisos/texto` da `activo: true` (versión `sin-cuenta-v1-2026-11-14`);
  alta, estado, baja y que otra llave no ve ni borra la suscripción, contra la
  base real (alta de prueba dada de baja al momento). En Chromium sin pantalla
  no se pueden recibir notificaciones reales: falta la prueba en un iPhone (con
  la web en la pantalla de inicio) y en un Android.
- **Aviso a los usuarios** (orden permanente): anuncio n.º 4, «Avisos en el
  móvil, también sin cuenta», enlace a Perfil › Avisos.
- **Dato:** antes de esto solo había 2 navegadores con notificaciones (con
  cuenta); el ensayo-36 lo contó.
- **Riesgo aceptado para entregar hoy (S5 del anexo):** sin la cabecera
  secreta entre el servidor de la web y la base, alguien podría llamar a
  Supabase directamente y llenar los cupos de altas (300 por hora, 5 000
  navegadores): la gente de verdad vería «cupo» o «lleno». No filtra datos.
  El verificador 36 avisa; `apagar-sin-cuenta` lo corta. Hacer la cabecera es
  lo siguiente si se ve abuso.
- **Pendiente para la dirección:** probar en su iPhone (web en la pantalla de
  inicio → Perfil › Avisos → «Activar notificaciones en este móvil») y en un
  Android; si llega, nada más. Las ramas locales `aviso-activar-notificaciones`
  y `avisos-sin-cuenta` ya están unidas.

## 14 de noviembre de 2026 (31) · Claude · Notificaciones sin cuenta: arreglos de la revisión · SIN PUBLICAR (rama `avisos-sin-cuenta`, solo commit local)

- **Qué es:** la revisión única de las entradas 29 y 30 encontró 9 cosas; están
  arregladas en la misma rama. Nada publicado, nada aplicado en Supabase, sin
  flujos ni EAS. Resumen también en
  [`AVISOS-SIN-CUENTA-2026-11-14.md`](AVISOS-SIN-CUENTA-2026-11-14.md),
  «Arreglos de la revisión».
- **Base (36, las dos copias iguales):**
  - un fallo general nuestro ya no borra a nadie: en la web solo cuentan como
    fallo de la suscripción el 400 y el 413; -1 (nuestro servidor o el
    cifrado), 401 y 403 (VAPID o firma) dejan el envío «fallido» sin contar;
    en Expo, `MismatchSenderId` (credenciales de FCM) tampoco cuenta;
  - contra quien llama directamente a la base: máximo propio de la web
    `sin_cuenta_maximo_web` = 5 000 (el móvil sigue en 20 000) y tope de
    30 000 notificaciones web sin cuenta en 24 h (`sin_cuenta_tope_dia_web`,
    reintentos incluidos; llegado, espera y lo avisa). **La cabecera secreta
    no está hecha: Víctor tiene que decidirla antes de `activar-sin-cuenta`**
    (condición S5 del anexo);
  - la prueba llega a la app como `{tipo:'novedad', destino:'inicio'}` (la app
    no conocía 'prueba');
  - móvil, ni dos ni ninguno: el de sin cuenta espera a que `repartir()` haya
    repartido el anuncio y no sale si ese token ya estaba en una cuenta a la
    que se le repartió;
  - verificador 36: comprueba todo lo anterior y avisa (sin fallar) si el
    cupo de una hora se llenó en 7 días, si se llegó al tope diario o a un
    máximo, y con 10 o más bajas por fallos en 24 h; el «OK» dice cuántas
    notificaciones web y bajas por fallos hubo en 24 h. `procesar()` no
    cambia (sigue igual a la de la 33 más los cuatro bloques).
- **Web:** la ventana de novedades, cuando activa allí mismo, enseña a la vista
  «El servicio de tu navegador puede estar fuera de la UE…» debajo del botón,
  con «Privacidad» a `/privacidad#garantias-push` (anexo 7.3).
  `novedades-producto.json` **2026-11-14.4**: el tercer paso, «Si has entrado en
  tu cuenta (en la web o en la app)…» (copia de la app y ejemplo al día).
- **App:** con un texto nuevo del permiso, el estado `texto-nuevo` en vez de
  «Activadas», con «Activar…» otra vez (renueva la versión con el mismo
  token) y «Desactivar».
- **Legal:** privacidad §6 y registro A5: en la app, el origen «Perfil» es su
  primera pantalla sin sesión; registro A5 con los cupos y los borrados
  nuevos y el punto que faltaba; anexo 7.3 (la ventana) y 7.7 (S3 dónde se
  prueba cada cosa; S5 la cabecera secreta).
- **Pruebas:** `npm --prefix rwadar-app test` salida 0
  (`probar-avisos-sin-cuenta.mjs` 75 de 75, antes 72: fallos generales, tope
  diario, ni dos ni ninguno y 6 roturas más que el verificador detecta, 22 en
  total); `npm run test:web` salida 0 (probar-web 732 correctas);
  `npm --prefix rwadar-movil test` 693 correctas y 2 omitidas de siempre (2
  nuevas de `texto-nuevo`); `node --test rwadar-acceso/*.test.mjs` 367 de 367
  con Chromium (la ventana comprueba la frase junto al botón a 390 × 664 y
  360 × 640); `node --test .github/*.test.mjs` 119 de 119; guardián de OTA con
  la base `fa30779…` `ok:true`.
- **Orden para activarlo (cada paso con orden de Víctor):** decidir la
  cabecera secreta (S5) → `ensayo-36` → `aplicar-36` → `verificar-36` →
  `activar-sin-cuenta` → web en revisión → prueba en iPhone (web en la
  pantalla de inicio) y en Android con Chrome: `prueba-sin-cuenta` y ver que
  **llega**; al terminar, **«Desactivar» en la revisión** (cada notificación
  abre producción; si no, llegarían dos durante 180 días) → web en producción
  con la privacidad, y allí la prueba completa (tocarla abre la lista con la
  baja; «Desactivar») → OTA de Android y prueba en un Android físico (llega
  como novedad; sin sesión, la baja arriba) → «Avisar novedad» (tipo
  `novedad`, enlace `/novedades-rwadar/#avisos-movil`).

---

## 14 de noviembre de 2026 (30) · Claude · Notificaciones sin cuenta, parte 2: web, app y textos legales · SIN PUBLICAR (rama `avisos-sin-cuenta`, solo commit local)

- **Encargo de la dirección (14/11):** «que salga tanto en iPhone como en
  Android; muy importante que funcionen las notificaciones y los avisos aunque
  no tengan cuenta o no hayan iniciado sesión: que puedan activarlas», y el
  recuadro «Activa los avisos» de la ventana de novedades para incitar a
  activarlas. Parte 2 sobre la parte 1 (entrada 29). Contrato y resumen:
  [`AVISOS-SIN-CUENTA-2026-11-14.md`](AVISOS-SIN-CUENTA-2026-11-14.md), «Parte 2».
- **Web** (`rwadar-20260820.js`, interruptor `AVISOS_SIN_CUENTA_REMOTO`
  encendido; la base sigue apagada): Perfil › Avisos sin sesión con
  «Notificaciones en este móvil» (sin cuenta): el texto versionado que da el
  servidor, quién interviene, la información básica y «Activar…» en el mismo
  toque (permiso, service worker, suscripción, alta y notificación de
  muestra). iPhone sin la web instalada: los pasos y «Ver cómo añadirla».
  Base apagada: «todavía no están disponibles», sin pedir nada. Renovación al
  abrir, como mucho cada 12 h (marca local `rwadar.avisos.sin-cuenta.v1`, sin
  la dirección). `?avisos=1` sin sesión: los avisos publicados y «Desactivar
  las notificaciones de este móvil». Con sesión: una suscripción por
  navegador (activar con cuenta la reutiliza; «Desactivar» de la cuenta quita
  las dos; cerrar sesión o borrar la cuenta deja la de sin cuenta).
- **Ventana de novedades** (web y app): el recuadro arriba, antes de los
  puntos, y compacto (a la vista sin desplazar en 390 × 664 y 360 × 640). En
  la web, sin sesión, «Activar avisos» las activa ahí mismo con el texto
  versionado a la vista; en iPhone sin instalar, los pasos; si no, a Perfil ›
  Avisos. `novedades-producto.json` **2026-11-14.3** (sin campos nuevos; los
  pasos de `avisos-movil` sin «Entra en tu cuenta», con «No hace falta
  cuenta») y copia de la app al día.
- **App** (solo JS, `AVISOS_SIN_CUENTA_REMOTOS` encendido):
  `lib/avisos-sin-cuenta.js` y `componentes/AvisosSinCuenta.js` dentro de
  `AccesoObligatorio`, encima del formulario (token de Expo y
  `/api/avisos/movil`); renovación diaria al abrir (y baja si se quitó el
  permiso); abierta desde una notificación sin sesión, la baja arriba; con
  sesión, «Desactivar» del móvil también las quita y hay un botón solo para
  ellas; la ventana no las vuelve a pedir si ya están; «Borrar datos del
  dispositivo» da de baja primero. Privacidad de la app, un párrafo.
- **Legal:** privacidad (14/11/2026): §2 (la marca), §5, §6 «Notificaciones
  sin cuenta», §8, §9, §11 (art. 11) y §12 (ni activarlas sin cuenta siendo
  menor); sitemap al día. Registro de actividades, versión 9 (A5 «Sin
  cuenta»). Anexo, apartado 7 (condiciones S1-S4).
- **Pruebas:** `npm run test:web` salida 0 (probar-web 732 correctas, 9 de sin
  cuenta); `node --test rwadar-acceso/*.test.mjs` 367 de 367, Chromium incluido
  (nueva `avisos-sin-cuenta-navegador`: 4 pruebas por el worker de verdad);
  `npm --prefix rwadar-movil test` 691 correctas, 2 omitidas de siempre
  (nueva `avisos-sin-cuenta.test.cjs`: 11); `npm --prefix rwadar-app test`
  salida 0; `node --test .github/*.test.mjs` 119 de 119; guardián de OTA con la
  base `fa30779…` `ok:true`.
- **Pendiente (cada paso con orden de Víctor):** unir la rama (PR, CI y
  sello); `ensayo-36` → `aplicar-36` → `verificar-36`; web en revisión →
  `activar-sin-cuenta` → probar en un iPhone (web en la pantalla de inicio) y
  en un Android → `prueba-sin-cuenta`; web en producción con la privacidad;
  después la OTA (la app llama a `/api/avisos/movil` en producción); y el aviso
  de novedad («Avisos en el móvil, también sin cuenta»).

---

## 14 de noviembre de 2026 (29) · Claude · Notificaciones sin cuenta, parte 1: base (migración 36) y servidor · SIN PUBLICAR (rama `avisos-sin-cuenta`, solo commit local)

- **Encargo de la dirección (14/11):** «que salga tanto en iPhone como en
  Android; muy importante que funcionen las notificaciones y los avisos aunque
  no tengan cuenta o no hayan iniciado sesión: que puedan activarlas». Esta es
  la parte 1 (base y servidor); la parte 2 (web, app y textos legales) va
  aparte. Contrato entre las dos:
  [`AVISOS-SIN-CUENTA-2026-11-14.md`](AVISOS-SIN-CUENTA-2026-11-14.md).
- **Base, migración 36** (`rwadar-app/db/36_avisos_sin_cuenta.sql` y su copia
  `supabase/migrations/20261114180000_avisos_sin_cuenta.sql`). Solo añade y
  **nace apagada**. Tablas aparte, sin usuario (`sin_cuenta_web`,
  `sin_cuenta_movil`, sus colas y `historial_sin_cuenta`, solo añadir). API
  para anon (texto versionado `sin-cuenta-v1-2026-11-14`, alta, baja y estado
  de la web y del móvil, avisos publicados) con interruptor, versión, forma,
  cupos (300 altas nuevas por hora y 20 000 en total por canal), «misma
  dirección con otra clave auth se rechaza» y la baja siempre. Envío dentro de
  `procesar()` (la de la 33 más cuatro bloques `sin_cuenta_*`) reutilizando
  `webpush_encolar` y las cabeceras de Expo; no duplica si la cuenta ya lo
  recibe; borra por 404/410, DeviceNotRegistered o tres fallos seguidos.
  `limpiar()` = la de la 32 más `sin_cuenta_limpiar()` (90 días, 180 días y 3
  años). Scripts: `_verificar`, `_activar` (exige push y clave VAPID),
  `_apagar`, `_prueba` (solo con 5 suscripciones sin cuenta o menos);
  `fallo_cerrado.sql` también lo apaga.
- **Flujo `avisos-base.yml`:** `ensayo-36`, `verificar-36`, `aplicar-36`,
  `activar-sin-cuenta`, `apagar-sin-cuenta` y `prueba-sin-cuenta` (las que
  cambian la base, con copia y `AVISOS`); avisos de reaplicar la 36 tras
  `aplicar-30`, `-32` y `-33`. `.github/flujos.test.mjs`: cada acción con su
  caso y su SQL.
- **Servidor:** `rwadar-acceso/avisos-sin-cuenta-servidor.mjs` en
  `servidor.mjs` y `compilar.cjs`: `POST /api/avisos/web`,
  `POST /api/avisos/movil` (`alta|baja|estado`), `GET /api/avisos/texto` y
  `GET /api/avisos/recientes` (60 s en memoria). Origin igual o ninguno,
  `cross-site` 403, JSON ≤ 4 kB con claves exactas, sin cookies, límites por
  visitante nuevos (altas 20, bajas 60, estados 120 cada 10 min) e
  interruptor `AVISOS_SIN_CUENTA` **encendido** (decisión de la dirección; la
  base sigue apagada). Sin la cabecera secreta (decisión: no ahora).
- **Pruebas:** `probar-avisos-sin-cuenta.mjs` (72 correctas, en
  `npm test`, con el ensayo, aplicar, verificar y la prueba del flujo
  ejecutados de verdad con bash); `npm --prefix rwadar-app test` salida 0
  (las listas de acciones de las pruebas de la 30, 32, 33 y 34 al día);
  `rwadar-acceso/avisos-sin-cuenta.test.mjs` 15 de 15 y `compilar.test.mjs`
  14 de 14; `node --test .github/*.test.mjs` 119 de 119; `npm run test:web`
  (probar-web 723 correctas).
- **Pendiente (con orden de Víctor):** la parte 2 (web, app y textos legales);
  después, `ensayo-36` → `aplicar-36` → `verificar-36`, web en revisión →
  `activar-sin-cuenta` → probar en un iPhone y un Android →
  `prueba-sin-cuenta`; web en producción y OTA. Nada aplicado ni publicado.

---

## 14 de noviembre de 2026 (28) · Claude · Recuadro «Activa los avisos» en la ventana de novedades · SIN PUBLICAR (rama `aviso-activar-notificaciones`, solo commit local)

- **Encargo de la dirección (14/11):** «que para activar las notificaciones
  salga el aviso al salir la notificación de novedades al entrar a la app,
  para recordar e incitar a la gente a que las activen».
- **Qué cambia (web y app):** dentro de la ventana «Novedades de RWAdar»,
  debajo de los puntos, el recuadro **«Activa los avisos»** («Recibe cada
  novedad en el móvil, como un WhatsApp. Es gratis y puedes quitar los avisos
  cuando quieras.») con el botón **«Activar avisos»**: cierra la ventana (cuenta
  como vista) y lleva a Perfil › Avisos (web `/#perfil-avisos`; app
  `irAAvisosPerfil()`). Solo sale si en ese dispositivo las notificaciones
  no están ya activas (web: permiso y suscripción de push del navegador,
  `estadoAvisosNavegador` del modelo; app: el interruptor «Notificaciones en
  este móvil» y además «Avisos de novedades» encendido, `estadoAvisosMovil`
  de `lib/novedades-rwadar.js`); si no se sabe, sale. En el ordenador también
  sale (Perfil › Avisos explica que se activan desde el móvil y deja encender
  el correo de novedades). No pide permisos. Inglés en `UI` de la web y en el
  diccionario común (`lib/idioma-en.js`, copiado a la web).
- **JSON sin campos nuevos;** versión **2026-11-14.2** (la ventana vuelve a
  salir una vez a todos) y copia de la app al día.
- **Lo visto en la app, en una clave nueva** (`novedades.vista.v2`, en
  `lib/datos.js`): la OTA se aplica en el arranque siguiente, así que el
  primero tras publicar aún corre la versión vieja, que podía enseñar la
  2026-11-14.2 sin el recuadro y darla por vista. Si solo hay v1 y dice
  2026-11-14.2 o posterior, se lee como 2026-11-14: sale una vez más, con el
  recuadro. Se escribe también la v1 por si se vuelve atrás. **La OTA y la
  web se pueden publicar el mismo día** (mejor primero la OTA). Escrito en
  `NOVEDADES-RWADAR-2026-11-12.md`.
- **Pruebas:** `npm run test:web` (probar-web 723 correctas), `npm --prefix
  rwadar-movil test` (679 correctas, 2 omitidas de siempre),
  `novedades-producto-navegador` en Chromium (1 de 1: sale sin avisos, no
  sale con ellos, «Activar avisos» lleva a Perfil › Avisos y marca vista,
  320 px con letra al 200 %), guardián de OTA con la base `fa30779…`
  `ok:true`.

---

## 14 de noviembre de 2026 (27) · Claude · Ventana «Novedades» del 14/11 y noticias de cada mañana · PUBLICADO (OTA n.º 32, web n.º 101 revisión y n.º 102 producción, PR #147 y sello #148)

- **Encargo de la dirección (14/11):** «haz que las notificaciones salgan y lo
  nuevo que hemos puesto, que salga y publica». La notificación ya había
  salido (anuncio n.º 3, «El mercado, en directo, y noticias con foto», 12:12
  UTC, otra sesión). Faltaba que **la ventana que sale al abrir** la web y la
  app lo contara: seguía con lo del 12/11.
- **Qué cambia:** `novedades-producto.json` pasa a la versión **2026-11-14**
  (vuelve a salir una vez a todos): el mercado en directo (cada 5 minutos,
  pestaña «24 h»), las noticias con foto, los avisos en el móvil y la
  calculadora; el detalle conserva lo del 11 y el 12/11. Dos iconos nuevos
  (`grafico` y `noticias`) iguales en la web y en la app; la descripción de
  /novedades-rwadar/ al día. Pruebas actualizadas a la versión nueva (solo
  fechas y contenido de la edición; se añaden comprobaciones).
- **Una revisión** (un revisor independiente): sin bloqueos; 6 arreglos
  menores aplicados (descripción de la página, «crédito privado», «últimas
  24 horas», «tokenised», «hoy 4», y **con iconos nuevos, primero la OTA y
  después la web**, ya escrito en `NOVEDADES-RWADAR-2026-11-12.md`).
- **Pruebas:** `npm run test:web` (salida 0), `npm --prefix rwadar-movil test`
  (675 correctas, 2 omitidas de siempre), `novedades-producto-navegador` en
  Chromium (390 y 1366, en inglés también), guardián de OTA con la base
  `fa30779…` `ok:true`; CI del PR y del sello en verde.
- **Publicado y comprobado en vivo:** OTA n.º 32 (primero), «Publicar web»
  revisión (n.º 101) y producción (n.º 102). `https://rwadar.pages.dev/datos/novedades-producto.json`
  da `2026-11-14`; el directo responde 200 y la web lo usa
  (`data-mercado-origen="directo"`). No se envió otra notificación: la del
  12:12 ya anunciaba lo mismo.
- **Noticias de cada mañana (lo que fallaba):** la tarea abría cada mañana una
  sesión nueva **sin el repositorio** (ni el entorno «RWADAR noticias» que
  creó otra sesión lo clonaba). Arreglo preparado: una **sesión fija con el
  repositorio** («Noticias automáticas de RWAdar (sesión fija con el
  repositorio)», etiqueta `rwadar-noticias-automaticas`); su prueba de
  arranque salió bien (repositorio, push en seco, herramientas de GitHub,
  red, Skill y Agent). **Falta crear la tarea programada que la despierte a
  las 08:32**: el control de permisos bloqueó `create_trigger` dos veces y
  necesita la aprobación expresa de Víctor. La tarea anterior sigue
  desactivada (sin repositorio, no sirve). Las noticias del 14/11 no
  salieron.

> **Estado al cerrar el 14/11 (coordinador):** publicado y comprobado en vivo
> lo de (23) a (26). El directo responde 200 en `/api/tokenizacion/directo` y
> la web lo usa (`data-mercado-origen="directo"`). La tarea de las noticias
> existe, pero el ensayo de las 11:35 UTC paró sin hacer nada: la sesión nueva
> no trae el repositorio (el entorno «Rwadar Con Internet» no tiene
> `victorJorques/RWADAR` en Repositories) ni la herramienta add_repo. Hasta que
> Víctor lo añada en los ajustes del entorno, cada mañana frena y avisa sin
> publicar. Desde hoy rige en `CLAUDE.md`: una sola revisión del trabajo.

## 14 de noviembre de 2026 (26) · Claude · Noticias que entran por los ojos · PUBLICADO (web n.º 100, OTA n.º 31, PR #143)

- **Encargo de la dirección (13/11):** «que las noticias tengan titulares
  buenos y se priorice lo visual y la imagen, que atraiga». Es la tercera de
  las tres mejoras que se construyen a la vez (gráfico en directo, noticias
  solas con freno y esta); las une un integrador. Rama
  **`worktree-wf_1f50042c-37c-1`**, desde `main` en `a4a594f` (sellado). La
  empezó otra sesión, que se cortó cuando se reinició la máquina con dos
  commits hechos (`5d3053c` y `5c633b8`, rama `worktree-wf_dfb920ce-e87-3`);
  esta sesión los trajo, los revisó, arregló una prueba, midió, capturó y
  cerró. **SIN PUBLICAR NI ENCENDER**: ni push, ni flujos, ni Supabase, ni
  EAS, ni OTA. Plan y revisión del diseño, en el scratchpad de la sesión
  (`automatico/visual/PLAN.md` y `etapas-previas.json`).
- **Qué cambia, en llano:**
  1. **La primera noticia es una portada**: foto grande y, encima, sobre un
     velo oscuro, la categoría, «fuente · fecha» y el titular. Las demás, en
     tarjetas con su foto (dos columnas en el móvil; en escritorio, la portada
     ocupa dos columnas y dos filas y las tarjetas llevan el titular sobre la
     foto). Igual en Inicio, en «Mercado y noticias» (/mercado/, adonde lleva
     /noticias/) y en la app. Con la letra grande, la rejilla pasa sola a una
     columna (cortes en em) y la portada crece; ningún titular se corta. Se
     mantiene «Imágenes ilustrativas generadas con IA, no fotos de la
     noticia».
  2. **Las fotos pesan menos aunque se vean más grandes**: cada foto tiene
     tres tamaños (480, 960 y 1200 px; `srcset`/`sizes` en la web y
     `anchoFoto()` en la app) y cada pantalla baja el que necesita.
  3. **Inicio llega con las tres noticias ya escritas en el HTML publicado**
     (`rwadar-noticias-portada.js`): la foto de portada no espera al
     JavaScript. El JS no las rehace si son de la misma edición y la página
     está en castellano (firma FNV-1a de lo pintado en
     `data-nt-prepintado`); en inglés o con otra edición, sí.
     `rwadar-site/index.html` no se toca: la lista sigue vacía y con
     `hidden` en la fuente.
  4. **De 8 a 23 fotos** en la biblioteca, por temas (lista cerrada en
     `fotos.json`: 15 `temas`, cada uno con al menos una foto, y
     `genericas`). Cada toma se miró a tamaño completo; la sala de
     operaciones no se aprobó (los monitores salían con seudotexto). Hoja de
     contactos: `automatico/visual/capturas/biblioteca-23.png`.
  5. **Guía de titulares** (`rwadar-editorial-source/noticias/GUIA-TITULARES.md`)
     y lo medible de ella en el programa (`revisarEdicion()` del modelo): 60
     caracteres como mucho en las dos lenguas, sin frases de promesa, «¡»,
     emojis ni punto final (salvo abreviaturas), y una foto distinta y de la
     biblioteca para cada noticia. El publicador se para con un error y
     escribe los avisos. Es el punto de enganche de las noticias automáticas.
  6. **Titulares nuevos para la edición publicada del 13/11** (4 de 5
     cambian) y una foto distinta para cada noticia, comprobados contra sus
     fuentes abiertas de nuevo el 14/11 (misma huella que el 13/11); adenda
     en `rwadar-app/data/verificaciones/2026-11-13-v2/noticias/EDICION.md` y
     v1 regenerado. Ojo: la noticia 5 (consulta de la CNMV) admite
     comentarios hasta el 16/11; desde el 17/11 la edición siguiente tiene
     que quitarla o reescribirla.
- **Lo que pidió la revisión del diseño y cómo quedó** (las siete, hechas):
  1. (alta) **El cerrojo de la mañana y el `index.html` que ahora depende de
     la edición.** `sinNoticiasInicio(html)` deja el Inicio publicado como si
     no llevara noticias; probado (M39): dos ediciones distintas dan el mismo
     Inicio sin noticias, igual a la fuente. **Lo une el integrador** en
     `.claude/skills/noticias-automaticas/lib/produccion.mjs`
     (`compararArchivos`): para `index.html`, comparar
     `sinNoticiasInicio(local) === sinNoticiasInicio(producción)` en lugar de
     los sha256, con su mutación en esa rama.
  2. (media) **Falsos positivos de los titulares.** Error solo para las
     frases de promesa como palabras enteras, «¡» y «!»; las raíces sueltas
     («garantiz», «asegur», «oportunidad», «guarantee») son aviso; el punto
     final admite abreviaturas («EE. UU.», «S. A.»). Una prueba por cada
     falso positivo de la revisión.
  3. (media) **El camino entero del publicador, antes del PR.**
     `validaMarcadoEstricto` vive en `rwadar-noticias-portada.js` (el
     publicador la importa) y `prepararInicioPublicado(html, edición)` hace
     lo mismo que el publicador. **El integrador lo añade a V-17** de la
     mañana junto con `revisarEdicion(edición, { fotos })`. Ediciones de 1 y
     2 noticias: con 1, la portada a todo el ancho; con 2, la portada y una
     tarjeta sin hueco (web y app, probadas).
  4. (baja) **Firma** pura de lo pintado (FNV-1a), no la fecha.
  5. (baja) **Vuelta atrás**: ver abajo.
  6. (baja) **Volver a medir después de unir las tres ramas**: pendiente del
     integrador (ver «Para el integrador»).
  7. (baja) **Ritmo**: fotos en segundo plano desde el primer minuto; web y
     app a la vez; la biblioteca nueva, al final.
- **Arreglo de esta sesión:** `probar-precarga.cjs` (la prueba «la base las
  lleva todas») borraba la primera foto por orden alfabético y esperaba
  «Falta la foto de una noticia base». Con la biblioteca de 23, esa foto
  (`acciones-eeuu`) ya no la usa la edición, y que falte una foto que nadie
  usa está permitido: la prueba fallaba sin que hubiera un fallo. Ahora borra
  la foto de la primera noticia de la base. La regla no cambia.
- **Medidas de Inicio, antes (`a4a594f`) y después (esta rama)**, las dos
  construidas con `rwadar-publicar.js --local` y servidas con el worker local
  (sin comprimir, HTTP/1.1); `medir-inicio2.mjs`, mediana de 5 cargas,
  alternando antes y después en cada vista, con la máquina tranquila. Perfil
  lento: CPU × 4, 1,6 Mb/s y 150 ms.

  | Vista | Fotos de noticias al cargar | Total al cargar (rápido) | DCL lento | LCP rápido | LCP lento | Elemento del LCP |
  | --- | --- | --- | --- | --- | --- | --- |
  | 390 × 844 @2 | 266 → 73 kB (−73 %) | 1.962 → 1.779 kB (−9 %) | 10,6 → 9,7 s | 152 → 156 ms | 2.768 → 2.972 ms (+7 %) | el titular de arriba de Inicio, igual |
  | 1366 × 900 @1 | 266 → 73 kB (−73 %) | 2.270 → 2.015 kB (−11 %) | 10,8 → 10,0 s | 184 → 164 ms | 2.948 → 3.160 ms (+7 %) | igual |
  | 1024 × 1366 @2 | 266 → 153 kB (−43 %) | 2.447 → 2.167 kB (−11 %) | 11,1 → 10,5 s | 184 → 188 ms | 2.972 → 3.368 ms (**+13 %**) | pasa a ser la foto de portada |
  | 2560 × 1440 @1 | 266 → 73 kB (−73 %) | 2.394 → 2.087 kB (−13 %) | 10,9 → 10,1 s | 212 → 224 ms | 3.036 → 3.264 ms (+8 %) | pasa a ser la foto de portada |

  En el móvil, las tres fotos de Inicio pasan de 266 kB a 73 kB; la página
  entera baja entre un 9 y un 13 % y termina antes (DCL y load en el perfil
  lento, −5 a −9 %).
  **La meta del plan (LCP ≤ +10 % o 100 ms) se cumple en tres vistas y no en
  la tableta con el perfil lento (+13 %, +396 ms).** Por qué: en una tableta
  la foto de portada cabe en la primera pantalla y pasa a ser lo más grande
  (el LCP, que es justo lo que pide «lo visual primero»); se baja a la vez
  que el CSS que frena el primer pintado (161 kB sin comprimir) y le quita
  ancho de banda: el CSS principal acaba a los 2,6 s antes y a los 3,0 s
  después. Probé `fetchpriority="high"` y `"low"` en la foto (perfil lento,
  1024, 390 y 2560; `automatico/visual/c2/prioridad.log`): ninguno cambia la
  cascada en el servidor local, que reparte el ancho de banda por igual (con
  «low», la foto empieza igual a los 0,28 s), así que **no lo he añadido**.
  En producción (HTTP/2-3, que ordena por prioridad, y CSS comprimido) el CSS
  debería ir antes que la foto, **sin comprobar**. Si la dirección quiere la
  meta también en tableta: (a) aceptarlo y medir en vivo tras publicar;
  (b) una `<picture>` que en tableta con pantalla densa pida la foto de 960
  (−31 kB; unos −160 ms por la cuenta, sin medir) a cambio de algo de
  nitidez; (c) portada perezosa,
  que va contra «lazy salvo la portada». El integrador vuelve a medir tras
  unir las tres ramas (punto 6 de abajo).
- **Capturas a escala 2** (en `automatico/visual/capturas/`): antes y después
  de Inicio y de /mercado/ a 390 y 1366 (`antes-*`, `despues-*`; la página
  entera recortada al bloque, sin las capas fijas), la portada con una foto
  blanca (`despues-foto-blanca-*`: el titular se lee igual) y la letra del
  navegador a 32 px (`despues-letra32-inicio-390.png`: una columna, portada
  de 411 px, nada cortado). App con react-native-web (`capturas/app/`):
  Inicio y «Mercado y noticias» en castellano e inglés y la letra a 1,3
  (tarjetas en filas); antes, `antes-*`. En la app el arnés no agranda la
  letra (el sistema sí lo hace en el móvil): solo muestra el cambio de
  rejilla. Ningún desborde horizontal en ninguna vista.
- **Pruebas:**
  - `npm test` en la raíz: **salida 0** en una sola pasada (274 s): base (PGlite), web
    (publicador, `probar-web`, fichas, precarga), QR, móvil (661 correctas y
    las 2 saltadas de siempre), herramientas y acceso (337 correctas, **0
    saltadas**: las de Chromium corrieron en local).
  - **Mutaciones: 44 de 44 cazadas** (M1-M33, M37 y M38 del plan, con M15b
    y M18b, y M39-M45, que se añadieron al construir; M34-M36 son del
    integrador). Arnés:
    `automatico/visual/c2/mutar.mjs --con-construir` (deshace cada regla,
    corre la prueba que la vigila y la restaura); resultado en
    `c2/mutaciones.json`. Las cazan pruebas de Node (las ve la CI) salvo M27,
    que solo caza Chromium.
  - Guardián de OTA con la base `fa30779…`:
    `{"ok":true,"runtime":"1.4.2(24)",…}` (la app solo cambia JS).
  - `copiar-modelo-web.cjs --comprobar` (motor web y app idénticos) y
    `rwadar-noticias-editoriales.js --comprobar` (23 fotos, 46 variantes, 15
    temas).
  - gitleaks con `rwadar-app/gitleaks.toml` sobre los commits de la rama:
    sin hallazgos. Sin nombres de personas en lo añadido.
- **Para el integrador:**
  1. `produccion.mjs` (noticias automáticas): `index.html` con
     `sinNoticiasInicio()` (punto 1 de arriba), con su mutación.
  2. V-17 de la mañana: `revisarEdicion()` y `prepararInicioPublicado()`
     sobre la edición `editor`, `final` y `publicada` (punto 3), con la
     mutación M34 (la mañana sin V-17: un titular con «oportunidad única»
     frena antes del PR).
  3. Coherencias: `REGLAS_TITULAR.max` (60) = `config.titulares.maxCaracteres`
     (M35); `fotos.json.genericas` = `config.json.fotos.genericas` (M36:
     regulación → `regulador-espana`, mercado → `red-europea`, producto →
     `acciones-eeuu`, riesgo → `alerta-fraude`).
  4. Las pruebas de esta rama que leen la edición viva son de Node
     (`rwadar-acceso/noticias-sector.test.mjs`: «index.html publicado»,
     `rwadar-movil/tests/noticias-sector.test.cjs` y la de la precarga); las
     de Chromium usan la edición fija `rwadar-acceso/fixtures/noticias-visual.json`.
  5. Si la mañana trae una edición de prueba en `noticias-v2.json`, gana la
     más nueva y se le aplica la guía.
  6. **Repetir la medida de Inicio sobre la unión de las tres ramas** (el
     gráfico en directo añade una lectura en Inicio): `medir-inicio2.mjs`, las
     cuatro vistas, perfiles rápido y lento, mediana de 5, alternando antes
     y después (`automatico/visual/c2/medir-ab.sh`).
  7. Orden: esta rama va antes o a la vez que la mañana (la mañana necesita
     la guía). Publicar la web justo después de unir y sellar.
- **Vuelta atrás:** se pueden revertir el diseño (`noticias-sector-20261110.js`
  y `.css`, `mercado-20261111.css`, los dos `index.html`, el componente de la
  app) y el prepintado (la llamada en `rwadar-publicar.js`). **No se
  revierten** `rwadar-precargar-imagenes.js` (la base publicada ya llevará
  `noticias-editoriales/480/` y `960/`, y la regla antigua la rechazaría),
  `rwadar-noticias-editoriales.js`, la copia de las variantes de
  `rwadar-publicar.js`, `fotos.json` ni `fotos/` (las fotos publicadas no se
  cambian nunca). La regla de 60 caracteres se afloja en una línea
  (`REGLAS_TITULAR.max`), con su prueba. App: otra OTA con el JS anterior; la
  app nueva sigue funcionando con la web revertida (las variantes siguen
  publicadas).
- **Pendiente para la dirección:** ver las capturas, la hoja de contactos de
  las fotos nuevas y los titulares; dar la orden de publicar (PR, sello,
  «Publicar web» y, después, «OTA Android» con la base `fa30779…`: primero
  la web, para que las variantes existan cuando la app nueva las pida). Unos
  15-17 minutos de Actions, una vez; ningún gasto diario nuevo.
## 14 de noviembre de 2026 (25) · Claude · Gráfico en directo · ENCENDIDO (migración 35 aplicada 14/11 10:47 UTC, siembra y encendido 11:07, web n.º 98, OTA n.º 30, PR #141)

- **Entrega (14/11, rama `entrega-grafico`):** unida la rama del constructor
  con `merge --no-ff` sobre la rama de trabajo (al día con `main`) y
  aplicada la revisión adversarial de la construcción (7 puntos: 1 alta, 4
  medias, 2 bajas). **Queda LISTA PARA PUBLICAR la web, ENCENDER el directo
  y enviar la OTA**, en el orden del contrato (apartado 6); lo hace el
  coordinador. Aquí no se ha publicado, encendido ni subido nada.
  1. *(alta)* **La siembra para si un token de la diaria se queda sin
     historia** (`sembrar-directo.mjs`): antes seguía y lo guardaba con un
     solo dato; con figure-heloc (más de la mitad) no salía ninguna serie en
     24 h ni en 30 días. Ahora sale con código 3 sin escribir nada. Pruebas
     nuevas: el mayor sin sus dos historias y uno pequeño sin la de 5 min.
  2. *(media)* **Un directo sin ninguna serie ya no es un 200 vacío**: el
     servidor da 503 `directo_no_valido` y `validarDirecto` lo rechaza (así
     lo ven la alarma diaria y `comprobar-publicado`). Con una sola serie,
     sigue valiendo.
  3. *(media)* **Cualquier 404 es «apagado», sin aviso** (`motivoDirecto`):
     una web sin la ruta (OTA antes que la web, o una web anterior) ya no
     enseña el aviso falso a todos. `comprobar-publicado` y la alarma siguen
     exigiendo `directo_apagado`. Probado también en Chromium.
  4. *(media)* **Web: al refrescar, si la pestaña elegida se queda sin
     datos, la primera que sí** (como al empezar y como la app). Caso nuevo
     en Chromium: en «24 h», el directo cae y no hay fina → pasa a «1 S» con
     su gráfico y el aviso «día a día», sin «no disponible».
  5. *(media)* **`probar-coingecko` también pide la diaria publicada desde
     Supabase** (cambia `probar_pedir`/`probar_leer` en las dos copias de la
     35, idénticas) y **falla si no da 200**: así se ve antes de encender si
     Cloudflare no deja leerla. En el contrato, además, un segundo `estado` a
     los 25-30 minutos de encender.
  6. *(baja)* **No aplicado**: guardar 250 en vez de 60 cuadruplica el
     espacio (unos 25-35 MB en vez de 8,5) y no cubre el caso probable (un
     token recién añadido a la categoría). Lo que lo cubre: `sembrar` cuando
     cambie la lista de la diaria. Apuntado como pendiente en el contrato
     (apartado 7); con el punto 2, si pasa, salta la alarma.
  7. *(baja)* **Contrato al día**: la medida directo/diaria con fecha y
     cifras (−0,017 % a −0,027 %), y qué cambia en la fase 2 (respaldo día a
     día, «24 h» desactivada si el directo falla, adaptar
     `comprobar-publicado.mjs`, que exige la fina publicada).
  - **Pruebas de la entrega:** `npm test` entero en la raíz con salida 0
    (6 min; acceso 342/342 con Chromium, móvil 663 y las 2 omitidas de
    antes); Chromium del directo (390 y 1366) con los dos casos nuevos; base,
    regla y flujo del directo (21, 47 y 31 correctas); guardián de OTA con
    `--base fa30779…` `ok:true`; gitleaks sin hallazgos en los commits
    nuevos. **Mutaciones de los arreglos: 14 de 14 detectadas** (siembra
    ×2, sin series en el modelo ×2 y en el servidor ×2, 404 en el modelo,
    en la web y copia desactualizada, pestaña al refrescar, prueba de la
    diaria en la base ×2 y en el flujo ×2). Capturas a escala 2 de la web
    y de la app (con dos nuevas: «24 h» cuando el directo cae sin fina, y la
    app ante una web sin la ruta, sin aviso).

- **Encargo de la dirección (13/11):** «Supabase pregunta a CoinGecko cada 5
  minutos (una sola consulta para los 250 tokens) y guarda el punto. La web y
  la app lo leen directamente, sin publicar nada. La pestaña 24 h siempre está
  al día.» Construido sobre el diseño revisado (el plan del diseñador y los 14
  problemas que confirmó la revisión, todos aplicados). Rama
  `worktree-wf_44e63947-86f-1`, desde `main` en `ccedb52`. **SIN ENCENDER y
  SIN PUBLICAR**: ni Supabase, ni flujos, ni push, ni EAS, ni avisos.
  Contrato completo: [`MERCADO-DIRECTO-2026-11-14.md`](MERCADO-DIRECTO-2026-11-14.md).
- **Qué hace, en llano:**
  1. **La base (migración 35, nueva):** Supabase pide a CoinGecko una vez por
     ranura de 5 minutos (nunca dos a menos de 240 s), guarda el dato de cada
     token (los 60 mayores y los de la diaria) y rehace las dos series con la
     misma regla de hoy. Comprobado en PGlite: **idéntica** a
     `construirSerieFina` con la ejecución real del 13/11 (30 tokens, 289 y
     721 puntos, mismos «largos») y en 300 casos al azar con decimales.
  2. **Un corte del propio directo no culpa a CoinGecko** (lo más grave de la
     revisión): la edad de cada token solo cuenta en los cubos con lectura
     buena del directo o cubiertos por la siembra. Probado con cortes de 2 h,
     25 h y 73 h: nadie fuera ni en «largos» (la regla de hoy los habría
     marcado o tirado la serie) y la nota dice «El directo no pudo leer del …
     al …». Encender exige una siembra de menos de 30 minutos (la acción
     `encender` siembra antes en la misma ejecución).
  3. **El servidor de la web** sirve `/api/tokenizacion/directo` desde su
     memoria (como mucho una lectura de Supabase cada 5 minutos por copia),
     con la clave publicable y sin cookies; el formato es el de la fina
     publicada y pasa `validarSerieFina` sin cambios.
  4. **La web y la app** lo piden a la vez que la diaria; si vale, es lo que se
     pinta y la cifra grande, y todas las pestañas acaban en ella (los días que
     falten desde la diaria salen de la horaria del directo). La edad se mide
     con la hora del servidor (cabecera Date): un móvil con la hora mal puesta
     no lo rechaza. Si el directo está encendido y falla, la copia publicada
     con la línea «Ahora no se puede usar el dato en directo…» (en Inicio,
     «copia de las 16:05»); apagado, nada. Se refresca solo con la página a la
     vista o la app activa, sin cambiar de pestaña y esperando a la cruz.
  5. **Flujo nuevo «Mercado en directo (base)»** (ensayo, aplicar, verificar,
     probar CoinGecko desde Supabase, sembrar, encender, apagar, deshacer,
     estado), con DIRECTO en «confirmar». **Alarma** en el flujo diario (paso
     final): si el directo está encendido y no responde bien dos veces, el
     paso falla y GitHub avisa.
- **Arreglos de la revisión del diseño, uno a uno:** (1) cortes del propio
  directo → tabla `lecturas` y edad solo en cubos cubiertos; siembra < 30 min
  para encender. (2) `comprobar-publicado` acepta los 503 con código conocido
  (`.github/juzgar-directo.mjs`), con aviso. (3) «hoy» = día UTC del último
  dato, nunca la hora del aparato (pruebas a las 23:58, 00:01 y 00:06). (4)
  pruebas de la base en tres archivos de menos de 25 s cada uno (45 casos al
  azar en la CI; 300 en local), sin añadir partes a la CI. (5) alarma en el
  flujo diario y `diariaLeida` en el documento (más de 45 min → «atrasado»).
  (6) acción `probar-coingecko` desde la red de Supabase, agente de usuario
  fijo; la prueba del hueco de figure-heloc queda como condición obligatoria
  antes de encender. (7) tiempo transcurrido = el mayor de `performance.now()`
  y `Date.now()`; al volver a primer plano, se pide si pasaron más de 4 min.
  (8) esperas contadas desde la petición (Retry-After 900 → 15 min justos).
  (9) el freno «lista corta» solo con menos de 25 válidos o JSON roto; si
  falta figure-heloc, se guardan los demás. (10) `comparar-directo.mjs`
  compara el mismo instante. (11) memoria de 60 s si el dato ya pasó de su
  siguiente hora. (12) el último punto de una diaria vieja también sale de la
  horaria. (13) la clave Demo solo en `pedir()`; `estado` cuenta las llamadas
  del mes. (14) ranuras de 5 minutos más el mínimo de 240 s.
- **Dónde me aparto del plan:** la copia cifrada solo antes de `aplicar-35` y
  `deshacer` (las demás acciones solo tocan `rwadar_mercado`, que la copia no
  guarda): menos minutos de Actions. El archivo de prueba real lleva un trozo
  (6 y 3 tokens, 115 kB), no los 30: con 30 pesaría 2,4 MB; la ejecución
  entera se comprueba en local (`MERCADO_DIRECTO_REAL=…`).
- **Medido:** documento compacto ~13 kB (la fina publicada, 38 kB); 60 tokens
  con su retención, ~8,5 MB en PGlite; la regla, 0,1-0,3 s por serie en
  PGlite. Las tres pruebas de la base: unos 7, 8 y 6 s en esta máquina.
- **Archivos:** base `rwadar-app/db/35_mercado_directo{,_verificar,_encender,_apagar,_deshacer,_estado}.sql`
  y `rwadar-app/supabase/migrations/20261114090000_mercado_directo.sql`;
  siembra y vigilancia `rwadar-app/tokenizacion/{sembrar-directo,comparar-directo}.mjs`
  (y `pedirJSON` exportado de `serie-diaria.mjs`); pruebas
  `rwadar-app/probar-mercado-directo-{regla,base,flujo}.mjs`,
  `rwadar-app/mercado-directo-soporte.mjs`,
  `rwadar-app/tokenizacion/prueba-directo-20261113.json`; flujos
  `.github/workflows/mercado-directo-base.yml` y el paso nuevo de
  `tokenizacion-diaria.yml`; servidor `rwadar-acceso/{tokenizacion-servidor,servidor}.mjs`,
  `compilar.cjs`, `probar-worker-local.mjs`; `.github/{comprobar-publicado,juzgar-directo}.mjs`;
  modelo `rwadar-movil/lib/tokenizacion.js` (y su copia web); web
  `rwadar-site/assets/mercado-20261111.{js,css}`; app
  `rwadar-movil/lib/tokenizacion-serie-remota.js` y
  `rwadar-movil/componentes/MercadoBolsa.js`. Sin tocar `app.json`,
  `package.json` de la app, `scripts/`, `_headers`, `_routes.json`, el sello
  ni `rwadar-publicacion-segura.js`.
- **Pruebas:** `npm test` entero en la raíz con **salida 0** (6 min 17 s):
  la base del directo 21/21, 47/47 y 28/28 (8,5, 7,4 y 5,9 s); acceso
  342/342 (con el servidor, 8/8, y Chromium a 390 y 1366, es/en, con
  capturas a escala 2); móvil 663 (2 omitidas de antes). En local, además:
  la regla con la ejecución grabada entera (30 tokens) y 300 casos al azar,
  23/23. Guardián de OTA con `--base fa30779…`: `ok:true`, 1.4.2(24).
  gitleaks (`rwadar-app/gitleaks.toml`) sobre los commits nuevos: sin
  hallazgos. **Mutaciones: 57 de 57 detectadas** (arrastres, «>=», 1 %,
  «largos», último dato del cubo, hora de la respuesta, ranuras y 240 s,
  esperas y Retry-After, 60 mayores, limpieza, redondeo, orden de la suma,
  «primera», apagado, otra categoría, permisos, relojes, lista corta,
  `generado`, cobertura del directo, siembra reciente; en el modelo, tokens,
  20 min, 25 %, días rellenados, 23:00 del día anterior, `valorFuera`, punto
  de hoy, `generado`, aviso con apagado, costura, reloj del servidor, «hoy»,
  reloj que duerme, último punto de una diaria vieja; en el servidor,
  peticiones a la vez, 60 s, parámetros, sesión, tope de bytes, tokens, 21
  min, diaria sin leer; `comprobar-publicado`, la alarma, DIRECTO; y el
  respaldo, el aviso y el refresco en la web y la app). Pruebas de antes
  ajustadas (sin debilitar): la lista de exportaciones del worker
  (`compilar.test.mjs`), las rutas que pide `mercado-20261111.js`
  (`tokenizacion.test.mjs`), lo que el worker local pregunta a Supabase
  (`comprobar-publicado.test.mjs`) y el cargador por defecto de la app
  (`tokenizacion.test.cjs`: ahora el del directo).
- **Pendiente / para la dirección y el coordinador** (orden completo en el
  contrato, apartado 6):
  1. Antes de encender: la prueba del hueco de figure-heloc en una mañana
     laborable (07:00-12:30 UTC) y `probar-coingecko` 3-4 veces desde
     Supabase. Si salen muchos 429, la clave Demo (comprobar antes su tope
     mensual).
  2. PR a main, publicar la web (con la 35 sin aplicar, la ruta da 404
     «apagado» y todo sigue como hoy), `aplicar-35`, `encender`, OTA.
  3. Una semana de vigilancia y, si pasa, la fase 2: quitar las finas del
     flujo diario (unos 400 minutos de Actions al mes).
  4. `docs/INTERNO.md` se pone al día al encender.
  5. Choques con las otras dos ramas (noticias automáticas y noticias más
     visuales): esta entrada, `.github/partes-ci.mjs`, `rwadar-app/package.json`
     (`test`), `.github/comprobar-publicado.mjs`, `probar-worker-local.mjs`,
     `MercadoBolsa.js` y el CSS de /mercado/ (zonas distintas). Lo une el
     integrador.
## 14 de noviembre de 2026 (24) · Claude · Noticias del sector solas, con freno · tarea creada (trig_015P5b7guTMypbzynUu6HtMo, 08:32 Madrid); FALTA el repositorio en el entorno

- **Encargo de la dirección (13/11, respuesta expresa de Víctor):** «Cada
  mañana una sesión programada las escribe y las verifica. Si el verificador
  no encuentra problemas, se publican solas en la web y en la app; si
  encuentra alguno, no se publica nada y te aviso.» Rama
  **`worktree-wf_2b351839-8d5-1`** (desde `main` en `ccedb52`, con el
  borrador de `worktree-wf_e178936d-288-6`). Diseño y revisión adversarial:
  `PLAN.md` y `etapas-previas.json` del scratchpad de la sesión
  (`automatico/noticias/`). **Nada encendido ni publicado:** ni push, ni
  flujos, ni tareas programadas, ni Supabase, ni avisos. No toca contenido
  sellado (unir la rama no pide sello ni publicar) ni la app (guardián de la
  OTA `ok:true`, 1.4.2(24)).
- **Qué hay, en llano:** una skill nueva,
  [`.claude/skills/noticias-automaticas/`](../../.claude/skills/noticias-automaticas/SKILL.md),
  que una sesión nueva sin contexto sigue cada mañana a las 08:32 (España):
  1. **Cerrojo** (`noticias-auto.mjs cerrojo`): no hace nada si hay ciclo
     manual (rama `claude/cerrojo-ciclo-<fecha>`, que ahora pone y quita la
     skill `investigacion-catalogo`), un PR ajeno que toque la web, el
     catálogo, la base o la app, una ejecución manual en marcha, noticias de
     hoy ya publicadas, el catálogo a medias en Supabase, `main` sin pasar la
     compuerta, **el último sello revisado por una persona de hace más de 7
     días**, o **`main` distinto de producción** (construye `main` con el
     reloj de la última publicación y compara archivo a archivo, por
     SHA-256, todo `rwadar-publicado/`, y además lo sellado con git). Dice
     qué tiene que hacer la dirección y avisa, salvo en pausa o «ya
     publicadas».
  2. **Barrido** con un programa (CNMV, ESMA, BOE, Consejo, BCE, EBA y
     Comisión; `fuentes-barrido.json`): las críticas (CNMV y ESMA) caídas →
     freno. A Git solo va lo del sector y sin nada con forma de nombre (el
     BOE trae nombramientos a diario).
  3. **Editor** (subagente) con su encargo literal
     (`noticias-auto.mjs encargo --rol editor`): 3 propuestas de titular por
     idioma, la elegida y por qué, y la foto de la biblioteca que mejor
     encaja, sin repetir; si ninguna encaja, la genérica con lo que faltaría.
     Sus notas van a una carpeta de nombre aleatorio que el encargo del
     verificador no nombra.
  4. **El programa abre cada fuente** (`comprobar-fuentes`) y pasa **16
     reglas** (V-1 … V-16 en `lib/validar.mjs`).
  5. **Verificador** (otro subagente nuevo) con su encargo literal; su
     veredicto va atado al SHA-256 de la edición. «con_cambios» → el programa
     aplica solo esas correcciones (el «antes» letra a letra), valida otra
     vez y un **segundo pase** tiene que dar «conforme».
  6. **Un solo PR con las noticias y su sello**, unido con «merge» (nunca
     «squash»: rompe el sello, lo prueba la unión simulada). El sello
     automático solo cambia commit, huella y nota de `estado.json`, **nunca
     `actualizadoEl`** (la caducidad de 7 días sigue siendo de una persona).
     Antes de unir: base = `main`, cabeza = sello, solo archivos permitidos,
     CI en verde. «Publicar web» revisión y producción, comprobando antes y
     después que la ejecución publica el commit de unión (si no, se cancela),
     y comprobación en vivo byte a byte (JSON v2 y v1, cada foto por su
     SHA-256, Inicio y /mercado/).
  7. **El freno:** cualquier otra cosa → no se publica nada, resumen en
     llano y notificación (`noticias-auto.mjs resumen`). Nunca se avisa a
     usuarios.
- **Archivos:** `noticias-auto.mjs` (18 órdenes), `lib/` (cerrojo, barrido,
  validar, producción, flujo, personas, reloj), `config.json` (interruptor:
  `"activo"`), `fuentes-barrido.json`, `EDITOR.md`, `VERIFICADOR.md`,
  `ORDEN-TAREA.md` (texto exacto de la tarea, hora y encendido),
  `pruebas/` (78 pruebas), `ensayo.mjs`;
  `rwadar-app/data/noticias-diarias/LEEME.md`; `AGENTS.md` (la autorización
  permanente de Víctor del 13/11 solo para esto y lo que sigue necesitando su
  orden); `docs/INTERNO.md`; la skill `investigacion-catalogo` (rama de
  cerrojo, mismo procedimiento de titulares); `rwadar-app/package.json`
  (las pruebas de la skill y `validar --publicada` en `npm test`);
  `.github/partes-ci.mjs` (pesos, y las pruebas de la skill en el trabajo
  «Sello»: usan `estado.json`) y `.github/flujos.test.mjs` (lo vigila).
- **Arreglo que hacía falta:** la prueba 16 de
  `rwadar-movil/tests/noticias-sector.test.cjs` exigía «Council of the EU»
  entre las fuentes publicadas: se habría puesto en rojo sola (esa noticia sale
  de los 30 días el 04/12). Ahora comprueba la traducción de cada fuente
  publicada, sea cual sea (pasa con la edición de hoy y con una sin el
  Consejo; el caso del Consejo sigue probado con el ejemplo fijo).
- **Minutos de Actions** (medidos: PR #135 9 min facturados, #136 8, sello
  #137 3, «Publicar web» 1-2 cada una):
  - Construido (vía 2: un PR con noticias y sello): **11-13 al día, 330-390
    al mes**; un día frenado antes del PR, 0. Como hoy (dos PR) serían 14-16.
  - **Propuesto, sin construir** (vía 3, `PLAN.md` § 10.2): un trabajo
    «Noticias» en la CI para los PR que solo cambian las noticias y el sello
    (test:web, las pruebas de noticias de la web y la app, las de la skill,
    `validar --publicada` y la compuerta): **7-8 al día, 210-240 al mes**.
    Toca `cambios-ci.sh` (tercera salida `noticias=`), `ci.yml`,
    `partes-ci.mjs` y `flujos.test.mjs`: mejor en su propio PR, con el
    integrador del gráfico en directo (que también toca `.github/`).
- **Pruebas:** las 78 de la skill (`node --test
  .claude/skills/noticias-automaticas/pruebas/*.test.mjs`); **ensayo completo
  en local** (`node .claude/skills/noticias-automaticas/ensayo.mjs`): un
  «GitHub» de mentira (repositorio desnudo), la web servida por el worker
  local, fuentes locales, y 25 días (bueno, modo ensayo, verificador rechaza,
  con cambios y segundo pase conforme o no, cuatro validadores, verificación
  de otros bytes, CI falla, `main` se mueve, fuente crítica caída, fuente de
  una noticia caída, siete cerrojos, «Publicar web» de otro commit, revisión
  y producción que fallan); **32 mutaciones** que deshacen una regla cada una
  y hacen fallar su prueba.
- **Resultados (14/11, en este contenedor):** `npm test` entero en la raíz,
  **salida 0** (78 pruebas de la skill dentro; `validar --publicada` dice que
  la edición publicada aún no es automática); ensayo completo **25/25 días
  como se esperaba** (367 s; 16 push, todos al origin de ensayo; nada a
  GitHub ni a Cloudflare); mutaciones **32/32 cazadas** (guion `mutaciones.mjs`
  del scratchpad, sobre una copia del commit); guardián de la OTA
  `ok:true` (1.4.2(24)); gitleaks 8.30.1 con `rwadar-app/gitleaks.toml` sobre
  los commits de esta rama: **sin hallazgos** (sobre todo el historial salen
  los 4 de siempre, de commits del 05/11 que no son de esta rama). Capturas
  a escala 2 del día bueno servido por la «producción» local (Inicio y
  /mercado/ a 390 y 1366, con la noticia de «Hoy» del ensayo): carpeta
  `automatico/noticias/capturas/` del scratchpad.
- **Un fallo de verdad que encontró la construcción:** la regla de correos de
  V-11 tenía longitudes sin acotar y tardaba unos 20 s con una línea larga
  sin «@» (200 kB de notas); ahora 2 ms (`lib/personas.mjs`).
- **Para encender (lo hace el coordinador tras enseñárselo a Víctor):**
  `ORDEN-TAREA.md`. Obligatorio antes: añadir `victorJorques/RWADAR` a los
  repositorios del entorno «Rwadar Con Internet». Primero un disparo con
  «MODO ENSAYO»; el primer día real, vigilado.
- **Enganche con la mejora visual (para el integrador):** la mañana **frena
  si no existe `rwadar-editorial-source/noticias/GUIA-TITULARES.md`** (V-8
  exige su SHA-256 en `titulares.json`); las genéricas de `config.json`
  (`fotos.genericas`) tienen que existir en `fotos.json` y, si `fotos.json`
  declara las suyas (`genericas`, o `generica`/`categorias` por foto),
  coincidir (lo vigila una prueba); `titulares.maxCaracteres` (60) y
  `propuestasMin` (3) se alinean con la guía. Si la mejora visual añade
  campos a la noticia, V-13 frena hasta que estén en producción y en la OTA;
  si cambia la forma de servir las fotos (variantes, `srcset`), hay que
  ajustar `comprobarVivoUnaVez` en `lib/flujo.mjs` (pide
  `/noticias-editoriales/<clave>.webp` y compara con `fotos.json`).
- **Otros puntos de integración:** `main` tendrá commits de unión (solo los
  de las noticias); no encontré nada que dependa de la historia lineal. Las
  pruebas de `sello.test.mjs` hacen commits en una copia aparte (`git
  worktree`, sin ramas) y tardan unos 12-15 s aquí, con la máquina cargada;
  su peso en `partes-ci.mjs` es 15 s (las cinco partes siguen ≤ 40 s).

---

## Entradas anteriores

Las entradas hasta el 13 de noviembre de 2026 (desde el comienzo del traspaso)
están, sin cambios, en
[`../archive/2026-11/PARA-CODEX-hasta-2026-11-13.md`](../archive/2026-11/PARA-CODEX-hasta-2026-11-13.md).
