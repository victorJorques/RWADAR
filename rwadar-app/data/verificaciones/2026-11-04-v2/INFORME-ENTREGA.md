# Entrega del catálogo 2026-11-04 · arreglos de datos

Preparada el 04/11/2026 por Claude en el worktree
`/home/user/RWADAR/.claude/worktrees/catalogo-1104`, rama
`claude/catalogo-2026-11-04` (sale de `origin/main`, 081fc27; sin push).
**Nada aplicado en Supabase, nada publicado, sin OTA, ningún workflow lanzado.**
Estado: **preparada y probada en local; revisada por un corrector independiente y corregidos sus tres hallazgos (§7).**

Solo datos: la web la arreglan otras ramas (dejar de enlazar direcciones de API, etc.).

## 1. De dónde parte, etiqueta y SHA

- **Lectura como visitante** (REST de Supabase con la clave publicable) el
  **04/11/2026 a las 19:07:11 UTC**: publicada la `f2732257-206d-48ce-2067-c7e19fa33002`
  (entrega 2026-11-03.7, con los textos de la .8 ya aplicados), 26 plataformas,
  24 ofertas (8 principales / 13 de reventa / 3 en camino), lote del 03/11.
  Guardada en `lectura-publica/`. `preparar-entrega.mjs` comprueba que la
  documentación, las fuentes actuales y la verificación de las 26 plataformas
  leídas hoy son exactamente las de la base local `2026-11-03.7-v2`, y que ARTEX y
  Toucan están como se leyeron.
- **Etiqueta: `2026-11-04`** (la que elegiría `npm run catalogo`: es la primera
  del día). Es una entrega documental posterior al radar: el cargador la admite
  porque la documentación revisada más reciente es del 04/11. **El radar, las
  cifras y la vigencia siguen siendo del 03/11** (el lote vence el 11/11, igual
  que la .7); no se alarga ningún plazo.
- **Revisión nueva:** `cf79e4a4-f828-96ce-681b-ae69c3d1b81b`.
- **SHA-256 de `rwadar-app/data/importaciones/catalogo-2026-11-04-v2/aplicar-y-aprobar.sql`:
  `85e848edc433efa6d1a240a16438e9ccfbce5061ef9be53444f81a4e081df464`.**
  `preparar-entrega.mjs` lo reproduce byte a byte.

## 2. Qué cambia

### 2.1 Rótulos de «Datos con su fecha» (228 referencias en 21 ofertas)

Las referencias que llevaban el nombre interno del campo pasan a su rótulo. El
resto de la etiqueta (la fecha) y el valor, la fuente y las fechas no cambian.

| Antes | Después | Veces |
|---|---|---|
| `precio · consulta …` | Precio · consulta … | 41 |
| `accesoEspana · …` | Acceso desde España · … | 20 |
| `minimo · …` | Mínimo de inversión · … | 20 |
| `salida · …` | Salida · … | 20 |
| `comisiones · …` | Comisiones · … | 19 |
| `derecho · …` | Qué se adquiere · … | 19 |
| `riesgos · …` | Riesgos · … | 19 |
| `estado · …` | Estado de la oferta · … | 18 |
| `custodia · …` | Custodia · … | 17 |
| `entidad · …` | Entidad que comercializa · … | 12 |
| `rentabilidad · …` | Rentabilidad · … | 7 |
| `supervision · …` | Supervisión · … | 3 |
| `actividad · …` | Operaciones recientes · … | 2 |
| `patrimonio · …` | Patrimonio y partícipes · … | 2 |
| `accesoEspana_particulares`, `divisa`, `fiscalidad`, `folleto`, `kyc`, `recaudado`, `regimen`, `salida_instantanea`, `umbral` | Acceso desde España (particulares), Moneda y tipo de cambio, Fiscalidad, Folleto, Verificación de identidad, Recaudado, Régimen legal, Reembolso inmediato, Umbral mínimo de financiación | 1 cada una |

Por oferta (rótulos): Aktionariat 13, Hinterstoder 13, Drautalresidenz 13,
Cohotel 13, GreenPoint 13, Klagenfurt 13, Billa 15, Randhartingergasse 11,
Spiko Letras euro 11, Plüddemanngasse 12, Pottendorfer 12, Schwarzer Weg 12,
Sonnleithnergasse 12, Stallhofstraße 12, Robinhood 10, Casa de Outeiro 9,
Prosegur 9, Spiko Letras dólar 9, BOSS Info 8, SwitzerLend 6, mTBILL 2.
Cada antes → después, en `contraste-2026-11-04.json` (`rotulos`).

**Generador arreglado:** diccionario completo (los 67 campos de todos los
expedientes) en `rwadar-app/rotulos-referencias.js`. Lo usan
`2026-11-02-v2/preparar-lote.mjs` (la línea que lo causó) y `montar-revision.mjs`
(el que monta las entregas de `npm run catalogo`): este convierte cualquier
rótulo interno que arrastre y **falla si aparece un campo sin rótulo**. Las
entregas publicadas no se tocan: sus archivos siguen igual y la cadena de PGlite
de las anteriores pasa.

### 2.2 Fuentes que eran direcciones de API (39 referencias en 18 ofertas, y 2 del radar)

El dato se leyó en la API ese día; la página nueva es donde una persona lo ve,
con el valor del día en que la abra. El valor y su fecha no cambian; el alcance
de la referencia lo dice. Esas 18 fichas quedan con la documentación revisada
el 04/11. **Solo se cambia una referencia si la página enseña ese mismo dato;**
si enseña otra medida u otra cifra, o el dato solo va en la configuración que
carga y no se ve, la referencia conserva la API (§3). La decisión es por
referencia, no por dirección de API. Cada página, comprobada hoy con curl y, si pinta los datos con
JavaScript, con Chrome sin interfaz (`fuentes-para-personas.json`, con el
literal visto).

| Oferta | Antes (API) | Después (página) |
|---|---|---|
| Aktionariat | `shares.aktionariat.com/api/secondarymarkets/getTrades` (405) | `shares.aktionariat.com/trade` («All Trades … 31 Oct 2026 / 11:56 Direct Investment 7.25 ZCHF 1 DAKS») |
| BOSS Info | `shares.bossinfo.com/api/secondarymarkets/getTrades` (405) | `shares.bossinfo.com/trade` («28 Sep 2026 / 11:32 Secondary Trade 6.70 ZCHF 474 BOSS») |
| SwitzerLend | `shares.lend.ch/api/secondarymarkets/getTrades` (405) | `shares.lend.ch/trade` («7 Oct 2026 / 13:34 Direct Investment 68.01 ZCHF 10 LENDS») |
| SwitzerLend | `…/api/brokerbotsettings?ticker=LENDS` | `shares.lend.ch/invest` («Price per LENDS 68.01 CHF») |
| Spiko Letras del Tesoro euro (×3) | `public-api.spiko.io/v0/…/EUTBL/{yield,latest,totals}` | `data.spiko.io/eutbl/` (AUM, usuarios, rentabilidad a 30 días, último valor liquidativo) |
| Spiko Letras del Tesoro dólar (×3) | `…/USTBL/{yield,latest,totals}` | `data.spiko.io/ustbl/` |
| Spiko Smart Cash euro | `…/eurSAFO/yield` | `data.spiko.io/safo-eur` («30d yield 2.84%») |
| Casa de Outeiro | `saas-pfp-base-api.token-city.com/…/slug/casa-de-outeiro/expand/…` (JSON) | `aliuscap.com/projects/casa-de-outeiro` («Recaudado 1.121.000,00 €… Umbral de éxito 2.000.000,00 €») |
| Kraken xStocks (lista de fuentes) | `registers.esma.europa.eu/solr/…&wt=json` | el buscador de ESMA que la ficha ya enlazaba (hay que buscar el LEI) |
| 9 inmuebles de Brickwise (Hinterstoder, Drautalresidenz, Klagenfurt, Randhartingergasse, Plüddemanngasse, Pottendorfer, Schwarzer Weg, Sonnleithnergasse, Stallhofstraße): rentabilidad esperada, precio de referencia («Preis pro Anteil» = `sharePrice`) y participaciones disponibles en reventa | `api.app.brickwise.at/api/v2/assets` y `bwrealestate.app.brickwise.at/api/v1/asset/<ISIN>` | `www.brickwise.at/assets/<isin>` (p. ej. Hinterstoder «4,85% p.a. … € 72,00 … 258») |
| Randhartingergasse, Pottendorfer y Sonnleithnergasse: solo «Precio más bajo en mercado secundario» | `api.app.brickwise.at/api/v2/assets` | `app.brickwise.at/desktopWeb/marketplace` («Preis pro Anteil ab € 78,00», «ab € 78,00» y «ab € 75,00»; la página del inmueble enseña el precio de referencia, no el más bajo) |
| Billa: solo «Rentabilidad» | `bwrealestate.app.brickwise.at/api/v1/asset/AT0000A3SE89` | `app.brickwise.at/desktopWeb/marketplace` («5,07 % p.a.»; no tiene página propia: 404) |
| Radar · Spiko (licencia y acceso) | dos consultas `www.regafi.fr/api/explore/…` (JSON) | `www.regafi.fr/pages/fiche-banque/?refine.id_referentiel=751211` («Codes CIB 19183 Depuis le 15/12/2025 … Passeports en Europe … ESPAGNE … Libre prestation de services») |

### 2.3 ARTEX · «Blockchains» (public.plataformas.cadenas)

- Antes: «Mercado regulado (MTF)» (no es una blockchain).
- Después: **«No usa blockchain»**.
- Fuente: `https://www.artexgm.com/faq` (Chrome sin interfaz, 04/11/2026): «ARTEX is
  not involved in non-fungible tokens (NFTs) nor does it rely on blockchain
  technology in any way for the time being»; compensación en SIX x-clear y
  liquidación en Euroclear y Clearstream. El campo no admite vacío (la web y la
  app lo exigen), así que dice lo que consta.

### 2.4 Toucan Protocol (public.plataformas y public.fuentes)

- **Fuente nueva:** ACR, `https://acrcarbon.org/news/acr-updates-program-rules-for-tokenization-of-carbon-credits/`,
  «ACR · prohíbe tokenizar sus créditos sin su autorización expresa», publicada
  el 30/05/2022, consultada el 04/11/2026 (curl, 200): «prohibit the tokenization
  of ACR carbon offset credits unless explicitly authorized by ACR».
- **Motivo, antes:** «El bloqueo no viene de Toucan, sino de los registros de
  carbono: Verra prohibió en 2022 tokenizar créditos ya retirados, y tanto Verra
  como el American Carbon Registry suspendieron la tokenización desde sus
  registros. Verra estudiaba entonces un estado «inmovilizado» que la
  permitiría. Toucan respaldó públicamente la decisión.»
- **Después:** «El bloqueo no viene de Toucan, sino de los registros de carbono:
  en mayo de 2022, Verra prohibió tokenizar créditos ya retirados y el American
  Carbon Registry prohibió tokenizar los suyos sin su autorización expresa.
  Verra estudiaba entonces un estado «inmovilizado» que permitiría tokenizarlos.
  Toucan respaldó públicamente la decisión de Verra.»
- **¿«Todavía sin resolver» sigue siendo cierto?** Ya no se publica: lo quitó la
  .8. Hoy (04/11/2026) no hay una fuente legible sobre el estado actual: la
  última página del ACR (su consulta de activos digitales, abierta en
  septiembre de 2022) no anuncia resultado ni levanta la prohibición, y la de
  Verra que lo diría (`verra.org/documents/verras-approach-to-third-party-crypto-instruments-and-tokens`)
  da 403 por la protección anti-bots: no se sortea ni se usa. Por eso el texto
  queda fechado en 2022 y no afirma nada de hoy. La etiqueta «Registro
  bloqueado» no cambia.
- «Suspendieron… desde sus registros» se apoyaba para Verra solo en S&P Global
  (403); ahora cada registro dice lo que dice su fuente legible.

## 3. Lo que no se pudo y por qué

- **Se quedan con la dirección de API** (la web dejará de enlazarlas):
  - `https://api.app.brickwise.at/api/v1/assets` en 11 inmuebles de Brickwise: es
    el libro de órdenes (cuántas órdenes de compra y venta y a qué precio). Ni la
    página del inmueble ni el mercado lo enseñan; solo se ve dentro de la app.
  - **Aktionariat y BOSS Info, `…/api/brokerbotsettings`** (3 referencias cada
    una: los dos «Mínimo de inversión» y «Salida · consulta 01/11/2026»): el
    mínimo por transferencia (500 y 100 CHF) y el aviso de venta o compra
    desactivada solo van en la configuración que carga `/invest`; en pantalla
    no se ven, ni en `/invest` ni en `/trade`.
  - **Brickwise, `api.app.brickwise.at/api/v2/assets`** (12 referencias): Cohotel
    y GreenPoint «Precio» y «Estado de la oferta»; Billa «Precio de emisión»,
    «Participaciones disponibles en emisión», «Estado de la oferta» y «Riesgos»;
    Randhartingergasse «Precio de emisión» y «Participaciones disponibles en
    emisión»; Pottendorfer y Sonnleithnergasse «Participaciones disponibles en
    emisión». Ninguna página enseña ese dato tal cual: el mercado da otra medida
    (Cohotel «ab € 110,00» frente a 120; GreenPoint «ab € 100,00» frente a 95) y
    la página del inmueble, las disponibles en reventa (Randhartingergasse 558
    frente a 374 de la emisión). Cohotel, GreenPoint y Billa no tienen página
    propia.
  - **Brickwise, `bwrealestate…/api/v1/asset/<ISIN>`** de Cohotel y GreenPoint
    («Rentabilidad»): la API calcula 5,11 % y 6,43 %; el mercado enseña otra
    medida, la distribución esperada (5,57 % y 6,11 %).
  - Por eso Cohotel y GreenPoint no cambian de fuente en esta entrega.
- **No son API ni JSON, se conservan y quedan anotadas:**
  - `saas-pfp-base-api.token-city.com/…/document/263` (Casa de Outeiro): pese al
    nombre, devuelve el PDF del documento de la emisión.
  - `midas.app/assets/main-DOxid0Zj.js` (mTBILL, acceso desde España): es el
    código JavaScript de la web; ninguna página para personas dice «Public offer
    under the EU Prospectus Regulation» (`midas.app/mtbill` da 403; las de
    `docs.midas.app` no lo dicen). Merece otra fuente en la próxima investigación.
  - `docs.midas.app/llms-full.txt`, `midas.app/llms.txt` (texto plano oficial),
    `esma.europa.eu/…/CASPS.csv` (hoja CSV de ESMA, Prosegur) y
    `docs.blocksquare.io/…/terms-of-service.md` (Markdown): legibles.
- **Toucan:** el estado de hoy de Verra y del ACR no se pudo confirmar con una
  fuente legible (ver 2.4).
- **Observación para Víctor:** ARTEX no usa blockchain; está en el radar como
  mercado regulado de acciones de arte. Si debe seguir en un radar de
  tokenización es decisión editorial (no se toca aquí).

## 4. El SQL

Una transacción serializable, en este orden:

1. **Guarda:** la publicada es la `f2732257` (o ya la nueva) con su huella
   `f2732257206d…a7a9` y aprobada; catálogo no retirado; la revisión nueva no
   existe con otra huella.
2. El lote nuevo en `rwadar_catalogo` (revisión, 26 plataformas, 24 ofertas,
   fuentes y avisos), como borrador.
3. **public.plataformas / public.fuentes**, con su guarda: ARTEX y Toucan como
   antes o ya como quedarían; Toucan con sus 3 fuentes (dirección y título) o
   con las 4 (la del ACR con su título y sus fechas); la del ACR en ninguna otra
   plataforma; 4 descartadas; nada a medias. Luego 2 `update` (cadenas de ARTEX,
   motivo de Toucan) y 1 `insert` (fuente del ACR), y una comprobación.
4. **Aprobación** solo si el lote está completo (26 / 24 / 8-13-3) y es publicable.

Sin cambios de estado, avisos, esquema, permisos, cuentas ni funciones.

## 5. Pruebas

- `comprobar-entrega.mjs` (PGlite, cadena 22/10 → 03/11.7, con los textos de la
  .8 que trae `02_seed.sql`): **correcto, 27 comprobaciones**, entre ellas:
  idempotente; publicada la nueva; 24 ofertas iguales salvo documentación (228
  rótulos, 39 fuentes, valores y fechas iguales) y fuentes actuales; 26
  plataformas iguales salvo «Blockchains» de ARTEX y el REGAFI de Spiko;
  `public.plataformas` y `public.fuentes` solo lo previsto; el lector de la web
  lo acepta y vence el 11/11; las 24 tarjetas se ven igual; la ficha fija de
  Toucan sale con el motivo y la fuente del ACR. **16 casos de fallo** que no
  dejan nada (otra publicada, otra huella, catálogo retirado, ARTEX distinto o
  descartado, motivo de Toucan anterior, fuentes de Toucan de más, de menos o
  con otro título, ACR con otro título, otras fechas o en otra plataforma,
  quinta descartada y tres «a medias») y uno que pasa sin tocar nada
  (`public.plataformas` ya como quedaría). Resultado en `pruebas-locales.json`.
- `preparar-entrega.mjs`: reproducible (mismo SHA en dos ejecuciones).
- `npm test` completo: ver el traspaso en `docs/tareas/PARA-CODEX.md`.

## 6. Pasos para aplicarla (coordinador, con la orden de Víctor)

1. Revisión independiente de este informe, `fuentes-para-personas.json`,
   `cambios-plataformas.json` y el SQL.
2. Unir a `main`.
3. Releer como visitante, con hora, que la publicada sigue siendo la `f2732257`.
4. «Aplicar catálogo» con `2026-11-04`.
5. Comprobar en línea: revisión `cf79e4a4…`, 26/24 (8/13/3); una referencia
   («Acceso desde España · consulta 01/11/2026»), Aktionariat con
   `shares.aktionariat.com/trade`, ARTEX «No usa blockchain», Toucan con 4
   fuentes.
6. `node rwadar-app/sincronizar.js`, `node rwadar-fichas.js`,
   `node rwadar-app/volcar-seed.js`, `transparencia.json` (revisión y lote
   nuevos, como tras la .7), `npm test`; sellar; «Publicar web». La app lee el
   catálogo de Supabase: no hace falta OTA para estos datos.

## 7. Corrección tras la revisión independiente (04/11/2026)

El revisor leyó como visitante a las 19:36:15 UTC (la publicada sigue siendo la
`f2732257`, idéntica a `lectura-publica/`) y encontró tres fallos. Corregidos:

1. **Brickwise (importante):** 15 referencias enlazaban a una página que enseña
   otra cifra u otra medida. Ahora se decide referencia a referencia
   (`fuentes-para-personas.json`: `seQuedan[].referencias` y una sustitución con
   `referencias`): 12 conservan la API (§3) y las 3 de «Precio más bajo en
   mercado secundario» enlazan el mercado de la app, que sí enseña «Preis pro
   Anteil ab» (Chrome sin interfaz, 04/11/2026: Randhartingergasse y
   Pottendorfer «ab € 78,00», Sonnleithnergasse «ab € 75,00»). Con el mismo
   criterio, también conservan la API «Participaciones disponibles en emisión»
   de Pottendorfer y Sonnleithnergasse («0 de 1.410» y «0 de 2.350»: la página
   enseña las disponibles en reventa).
2. **Aktionariat y BOSS Info (importante):** las 6 referencias del mínimo y del
   aviso de salida conservan `…/api/brokerbotsettings`; no se ven en `/invest`.
   Las que sí se ven (precio y «All Trades») siguen enlazando `/trade`.
3. **Toucan (menor):** «que la permitiría» → «que permitiría tokenizarlos».

Cuentas nuevas: 39 referencias en 18 ofertas (antes 59 en 20); Cohotel y
GreenPoint quedan sin cambio de fuente y con su fecha de revisión del 03/11.
Rótulos, ARTEX y el REGAFI, igual. Revisión nueva `cf79e4a4…`, SHA nuevo arriba
(§1); `preparar-entrega.mjs` lo reproduce y `comprobar-entrega.mjs` da correcto
(27 comprobaciones, 16 casos de fallo que no dejan nada). `npm test` completo:
salida 0 (base de datos 30 comprobaciones SQL y mapa 11/11; web 580; fichas 68;
precarga 32; móvil 409 correctas y 2 omitidas; acceso 144).
