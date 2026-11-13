# Revisión independiente de cumplimiento · entrega 2026-11-13

Revisión de cumplimiento normativo: MiFID II, MiCA, Reglamento (UE) 2017/1129
de folletos, Reglamento (UE) 2020/1503 de financiación participativa, régimen
piloto DLT, Circular 2/2020 de la CNMV y Ley 6/2023 de los Mercados de Valores.
No monté esta entrega. Solo lectura: no toqué Supabase ni ningún servicio en
línea (solo GET a páginas públicas), no publiqué, no lancé flujos y no hice
commit. En el repositorio solo he escrito este archivo. Mis guiones y salidas
están en la carpeta temporal de la sesión
(`/tmp/claude-0/-home-user-RWADAR/84924379-8a81-58f1-bb90-7eb9775e4d36/scratchpad/entrega-1311/revisor-cumplimiento/`),
fuera de Git. Revisor: Claude, 13/11/2026, de 14:10 a 14:35 UTC.

## Veredicto: `aprobado_con_cambios`

**No aplicar el SQL de hoy tal cual** (`aplicar-y-aprobar.sql`, SHA-256
`7be64e861af7ba2895f07cedbb73a1e85a9dec055412aa27081e20a401d16961`, que sigue
siendo ese a las 14:12 UTC). Hay dos correcciones obligatorias:

- **O1 · Pottendorfer (cambia el SQL).** La orden de venta de 73 € en la que se
  basa el mínimo nuevo **ya no existe**. La busqué tres veces en la API pública
  de Brickwise (14:16:58, 14:18:36 y 14:29:09 UTC): la venta más barata vuelve
  a ser 80 € en un lote de 11, la orden de menor importe vuelve a ser 1 × 115 €
  (116,73 € con el 1,5 %) y hay 106 participaciones en venta, no 107. Publicar
  hoy «Desde 73 € la participación (13/11)» daría como entrada un precio que ya
  no se puede pagar. El montador, el revisor de Brickwise y las revisiones de
  contenido (R2) y de SQL (R1) ya dejaron escrito que, si la orden desaparecía,
  había que rehacer la entrega con la venta más barata de ese momento. Ha
  desaparecido.
- **O2 · Datos personales en una copia que ya está en Git (no cambia el SQL).**
  Es la C1 de la revisión de SQL, y a las 14:22 UTC seguía sin hacer: la copia
  de la web de Profitus lleva dos nombres de personas físicas, un correo personal
  de trabajo y un teléfono directo.

Lo demás cumple:

- Ningún texto nuevo o re-fechado presenta como hecho lo que solo dice el
  emisor, ni promete rentabilidad, garantía o liquidez.
- Las tres rentabilidades que cambian (Spiko: 2,40 %, 3,98 % en USD y 2,84 %)
  llevan base, fuente, fecha y «no garantizado», y a las 14:16 UTC seguían
  siendo las últimas que publica Spiko.
- El acceso desde España no cambia en ninguna ficha, y cada «Sí» se apoya en
  una fuente primaria que lo dice. Las he vuelto a leer hoy. Una de ellas, la
  tabla de países de Spiko, se actualizó después de las 09:27 UTC; España
  sigue igual.
- El botón al proveedor queda igual que lo publicado: 5 «Ver oferta en X» y 17
  «Ir a la web del proveedor (sales de RWAdar)».
- Ninguna entidad de las fichas tiene advertencias de la CNMV: busqué 30 nombres
  en las cuatro listas. Solo salen los dos clones de siempre (Amundi y
  Payward), que no son las entidades de las fichas.
- El SQL, los datos públicos y lo que va a Git después de aplicar no llevan
  datos de personas físicas. El único caso es el de la O2.

Coincido con la revisión de contenido y con la de SQL en lo demás. Sus
recomendaciones sobre Hausera (18/11), los lotes de Brickwise y las
rentabilidades esperadas de reventa siguen en pie (§8).

## 1. Qué hice

- **Leí** `DECISIONES-COORDINADOR.md`, `INFORME-ENTREGA.md`, las revisiones de
  SQL y de contenido de hoy, los cuatro informes de `revision-independiente/`,
  los textos de las 22 ofertas de `escaparate-publicacion.json` y
  `documentacion-ofertas.json`, y la revisión de cumplimiento del 12/11.
- **Comparé campo a campo** las 22 ofertas de la entrega (escaparate y
  documentación) con las publicadas (`2026-11-12-v2/`): 474 hojas solo cambian
  de fecha y 78 de contenido. Revisé las 78 una a una (§2).
- **La regla del botón**, en el código y en su origen:
  - `rwadar-fichas.js`, líneas 199–216 y 298 (fichas fijas);
  - `rwadar-site/assets/rwadar-20260820.js`, líneas 2592–2596 y 2964–2968
    (web);
  - `rwadar-movil/componentes/Ofertas.js`, líneas 407 y 455–458 (app);
  - `rwadar-site/assets/ficha-pagina-20261022.js`, líneas 40–51 (lo que cambia
    la ficha fija al abrirla);
  - punto 5.3 de `docs/legal/REVISION-LEGAL-AVISOS-ACADEMY-2026-11-06.md`,
    línea 438.
- **Calculé con el código real** (`resumenOferta` de
  `rwadar-movil/lib/ficha-editorial.js` y `comprobacionesOferta` y
  `datosTarjetaOferta` de `rwadar-movil/lib/transparencia.js`, cargado con Babel
  como en sus pruebas) el acceso, la supervisión, el documento para España, el
  botón y la tarjeta de las 22 fichas:
  - con lo publicado (base del 12/11 y el `transparencia.json` de ahora,
    `ae3ed55e…9f62`), el 13/11;
  - con la entrega y el `transparencia.json` que deja `despues-de-aplicar.mjs`
    en el ensayo del montador (`8666d60c…7956`), el 13/11 a las 14:00, el 20/11
    a las 23:30 y el 21/11 a las 00:30 UTC;
  - con la entrega y el `transparencia.json` de ahora (lo que se ve entre
    aplicar el SQL y publicar la web y la OTA).

  También leí el botón y el bloque «Antes de invertir» de las 22 fichas fijas
  que generó el ensayo. En la copia del ensayo, la entrega y el código que usé
  son los mismos bytes que en la carpeta de trabajo; solo cambia la línea 146 de
  `rwadar-20260820.js`, la tabla de transparencia que reescribe
  `transparencia.mjs`.
- **Consultas propias de hoy** (solo GET, páginas públicas): el libro de órdenes
  de Brickwise (tres veces), la API de Spiko, su tabla de países, su página de
  restricciones y su web en español, los registros de la CNMV (Spiko Finance,
  Spiko SICAV, Robinhood Europe, Payward, Effecta y sus agentes, la ERIR de
  Ursus-3, la lista de plataformas de financiación participativa y la de
  proveedores de criptoactivos), las condiciones de los portales suizos, la
  página de disponibilidad de xStocks de Kraken, la ficha de Alicante 3 de
  Hausera, el registro de emisores de fichas referenciadas a activos de ESMA,
  las cuatro listas de advertencias de la CNMV y el texto consolidado de la
  Circular 2/2020 en el BOE.
- **Barrido de datos personales** en los 250 archivos que van a Git: los 224 de
  la carpeta del ciclo y de `importaciones/catalogo-2026-11-13-v2/`, las tres
  noticias de la web y la app, y el `transparencia.json` y las 22 fichas fijas
  del ensayo (lo que va a Git después de aplicar). Busqué correos, teléfonos,
  tratamientos, cargos junto a un nombre, nombres de pila de un diccionario
  (paquete `gender-guesser`, solo en la carpeta temporal), nombres en
  mayúsculas y direcciones de cartera.

## 2. Ficha por ficha (lo que cambia)

### 2.1 Pottendorfer Straße 62 (reventa): no cumple → O1

- **Lo que publicaría la entrega:**
  - mínimo «Desde 73 € la participación en reventa (13/11)», y en la tarjeta de
    la web y la app «Mínimo Desde 73 € la participación (13/11)»;
  - «Venta más barata · 13/11/2026: 73,00 € por participación (1 a ese precio,
    orden del 12/11/2026)»;
  - «Orden de venta de menor importe · 13/11/2026: 1 participación a 73,00 €
    (74,10 € con el 1,5 %)»;
  - «Participaciones en venta · 13/11/2026: 107».
- **Lo que hay ahora.** API pública de Brickwise
  `https://api.app.brickwise.at/api/v1/assets` (14:16:58, 14:18:36 y 14:29:09
  UTC; las tres veces el mismo archivo, SHA-256 `3493ef71…d29c`; por la mañana
  era `d04d417f…`), ficha `AT0000A324B4`:
  - la venta más barata es **80 € × 11, en una sola orden creada el
    08/02/2026**;
  - la orden de menor importe es **1 × 115 €, 116,73 € con el 1,5 %**;
  - la mejor oferta de compra sigue en 19 € × 3 (06/11/2025);
  - ninguna orden abierta a 73 €.

  `https://api.app.brickwise.at/api/v2/assets` (mismas horas, SHA-256
  `6b1b2572…a78d`) lo confirma: `"lowestOfferPrice":80` y
  `"availableBricksSecondary":106`. La API solo enseña órdenes abiertas: no se
  sabe si la de 73 € se compró o se retiró. Da igual para lo que se publica.
- **Las otras 10 fichas de Brickwise siguen exactamente como en la entrega**
  (las tres lecturas): venta más barata, orden de menor importe, participaciones
  en venta y mejor compra, ficha a ficha.
- **Por qué es obligatorio.** El mínimo es el dato más visible de la tarjeta.
  La Circular 2/2020 pide que la información sobre el coste sea «clara, exacta,
  suficiente y actualizada» (anexo, I.5) y que no cree «expectativas
  desproporcionadas o falsas» (anexo, I.6) (BOE, texto consolidado,
  `https://www.boe.es/buscar/act.php?id=BOE-A-2020-14107`, leído a las 14:29:19
  UTC). RWAdar no está obligado por la Circular, pero la adopta como vara de
  medir (revisión legal del 06/11, punto 5.3) y tiene su propia regla: una cifra
  que no se puede comprobar no se publica. El «(13/11)» no salva el texto: quien
  lo lea hoy entenderá que hoy puede entrar por 73 €, y la entrada real más
  pequeña es 116,73 € (o 893,20 € si compra el lote de 11 a 80 €).
- **Lo demás de la ficha cumple:** los avisos (solo reventa, acceso sin
  confirmar, riesgo 6 de 7 y posible pérdida total, compra parcial no
  confirmada, 1,5 % del comprador) y el botón «sales de RWAdar».

### 2.2 Las otras 10 de Brickwise (reventa)

- Cambian solo fechas y, en tres, el número de participaciones en venta (Cohotel
  59, GreenPoint 347 y Schwarzer Weg 299) y la mejor compra de
  Randhartingergasse (64 €). Son hechos del libro de órdenes, con fecha y hora
  de lectura. Los volví a ver iguales a las 14:16 UTC.
- Ningún mínimo se presenta como precio de emisión («No es el precio de
  emisión» en el alcance). Ninguna ficha de reventa lleva `rentabilidad` ni
  `precio`.
- Avisos: posible pérdida total, solo reventa, acceso sin confirmar,
  documentación en alemán y compra parcial no confirmada. Cumplen.
- Siguen dos arrastres que no son de hoy: las rentabilidades esperadas en «Datos
  con su fecha» y los mínimos que solo se venden en lote (§8, R3 y R4).

### 2.3 Spiko: Letras Euro (2,40 %), Letras Dólar (3,98 % en USD) y Smart Cash (2,84 %)

- **Rentabilidades: cumplen.** Los tres literales dicen la base («Rendimiento
  neto anualizado de los últimos 31 días» o «Tipo que publica Spiko, ya
  descontadas sus comisiones»), la fuente (Spiko), la fecha del dato (VL del
  12/11/2026), la de consulta (13/11/2026) y «Variable y no garantizado» o «no
  es un tipo fijo ni está garantizado». En el Dólar, además, «No incluye la
  variación del euro frente al dólar».
- **Lo comprobé** en `https://public-api.spiko.io/v0/share-classes/<clase>/yield`
  y `…/net-asset-values/<clase>/latest` (14:16:42–14:16:46 UTC):
  - EUTBL: `"monthlyYield":"0.024"`, VL `"1.062803"` del 12/11;
  - USTBL: `"monthlyYield":"0.0398"`, VL `"1.102694"` del 12/11;
  - eurSAFO: `"dailyYield":"0.0284"`, VL `"1.017107"` del 12/11.

  Siguen siendo las últimas. La próxima cifra sale hoy a las 18:00 UTC (letras,
  `nextYieldTimestamp` 1794592800) y a las 19:30 UTC (Smart Cash, 1794598200).
- **Lo que dice la web y la ficha desmiente sigue en la web.** En
  `https://www.spiko.io/es/spiko-euro` (14:25:25 UTC) siguen «Interés a tipo
  fijo 2,84% Garantizado por contrapartes» y «Sociedad gestora Amundi Asset
  Management». Los avisos de Smart Cash lo atribuyen a la web y lo corrigen con
  el KID («no hay rentabilidad mínima garantizada»; la gestora es Twenty First
  Capital). Cumple.
- **Avisos:** capital no garantizado y límites de reembolso en las tres; riesgo
  de cambio en el Dólar; en Smart Cash, además, alta en España sin confirmar,
  riesgo de contraparte y la confusión de gestora. Cumplen.
- **Falta, como el 11 y el 12/11,** la frase de la Circular «las rentabilidades
  pasadas no constituyen un indicador fiable de las rentabilidades futuras»
  (anexo, II.6). No está en ninguna de las 22 fichas fijas del ensayo, ni en
  `rwadar-site/` ni en los componentes de la app. No es nuevo ni lo cambia esta
  entrega (§8, R5).
- **Acceso:** la corrección de los revisores está bien hecha (fecha del dato
  06/11 en las tres y «Tabla de disponibilidad de Spiko (06/11/2026)» en Smart
  Cash). La tabla ha vuelto a cambiar después (§4); España sigue igual.
- **Botón:** «Ver oferta en Spiko» en las tres, como hoy (§3).

### 2.4 Aktionariat, Boss Info y Switzerlend

- Cambian fechas, los avisos con dato del día y los mínimos de Boss Info («unos
  17 ZCHF el 13/11») y Switzerlend («68,01 CHF el 13/11»). Son hechos del libro
  y de la cadena, leídos hoy por el revisor de Suiza y el de contenido.
- **Boss Info, «Última operación · 13/11/2026»: cumple.** Fuente
  `https://shares.bossinfo.com/` (no la API que da 405). El alcance dice qué se
  comprobó y no promete nada.
- **Lo que dice el emisor va atribuido:** «Su web dice que el emisor recompra
  acciones si tiene liquidez, pero el acuerdo firmado no le obliga y el
  13/11/2026 la recompra seguía desactivada…» (Switzerlend).
- **Acceso: cumple** (§4).
- **Avisos.** Aktionariat lleva «Sin folleto ni KID: la oferta se acoge a
  umbrales de exención y el emisor no está supervisado». **Boss Info y
  Switzerlend siguen sin ese aviso** (tercera vez) y sin uno de pérdida del
  capital. Lo dicen la caja de transparencia («Vende el propio emisor suizo, sin
  licencia de un supervisor del EEE ni registro en la CNMV…»; «No hay folleto,
  KID ni ficha informativa…») y el bloque «Antes de invertir» de la ficha, y la
  vista tapa la métrica «Supervisor». No bloquea, porque el riesgo se ve en la
  ficha (§8, R6).
- **Botón:** «sales de RWAdar» en las tres.

### 2.5 Hausera (en camino)

- **El aviso re-fechado es cierto.** «El 13/11/2026 Alicante 3 aún no estaba
  inscrita en el registro de la CNMV»: en la ERIR de Ursus-3
  (`https://www.cnmv.es/portal/consultas/esi/erir_esi?nif=A86796182&lang=es`,
  páginas 1 a 3, 14:19:48–14:19:57 UTC) figuran las SPV 2 a 8 y la «HAUSERA
  PROPERTY MANAGER SPV, S.A.»; no la SPV 11 (Alicante 3), ni la 9 ni la 10. La
  página avisa de que la inscripción «no implica que la CNMV haya validado las
  condiciones de la emisión».
- **Hausera sigue sin figurar** en la lista de proveedores de financiación
  participativa de la CNMV
  (`https://www.cnmv.es/portal/consultas/servicios-financiacion-participativa/listado-proveedores.aspx?lang=es`,
  14:20:27 UTC), como dice la ficha.
- **La ficha de Alicante 3 no ha cambiado**
  (`https://hausera.io/page-data/propiedad/alicante_3/page-data.json`, 14:25:46
  UTC, el mismo SHA-256 que por la mañana, `8f323413…5cfd`):
  `"status":"COMMINGSOON"`, `"presaleDate":"18/11/2026"`,
  `"startDate":"25/11/2026"`. Hausera anuncia `"roi":22`; RWAdar no lo enseña y
  dice «Las rentabilidades anunciadas son previsiones del promotor». Cumple.
- **El «Historial publicado» va atribuido al promotor** («ningún registro
  público las comprueba. No son una rentabilidad ni garantizan resultados»).
- **Lo que falla dentro de la vigencia** (no es nuevo): la preventa abre el
  18/11 y la ficha vale hasta el 20/11 (§8, R1).
- **Botón:** «sales de RWAdar».

### 2.6 mTBILL, Robinhood, Kraken xStocks y Prosegur Digital Gold (solo fechas)

- **Robinhood, Kraken y Prosegur:** volví a leer los registros que sostienen su
  «España: Sí» (§4). Prosegur Custodia de Activos Digitales sigue en la lista de
  proveedores de criptoactivos de la CNMV con fecha 30/06/2026 (PDF del mismo
  SHA-256 que guardó el grupo por la mañana, `188c6935…00b6`, 14:20:36 UTC). El
  aviso dice que esa autorización «no cubre este token de oro». Cumple.
- **Kraken:** sus avisos dicen que las condiciones finales no cubren su venta en
  España y que no hay documento oficial que explique en qué se basa. El botón
  sigue en «Ver oferta en Kraken» (§3 y §8, R2).
- **mTBILL:** sigue en «fuentes en conflicto», así que la vista tapa el 3,45 %;
  solo se ve el aviso. El aviso dice «no garantiza la futura», no la frase de la
  Circular (§8, R7). Avisos de riesgo completos: emisor no supervisado,
  conflicto de reembolso, riesgo de cambio, pérdida total y sin mercado
  secundario.

### 2.7 El radar

Solo fechas: 69 de 69 fuentes, ninguna dirección ni texto nuevo, ninguna
plataforma cambia de estado. `public.plataformas` no se toca. Nada que revisar
desde el cumplimiento.

## 3. Botón al proveedor (regla 5.3 del 06/11/2026)

El código pone «Ver oferta en X» solo si se cumplen todas estas condiciones:

- la oferta es principal, `disponibleEs` es verdadero y el acceso desde España
  es «sí», con fuente;
- la revisión está vigente (en la web y la app);
- `transparencia.json` tiene `supervisada` en «Sí» con la misma `verificadaEl`.

Si falta alguna, dice «Ir a la web del proveedor (sales de RWAdar)».

| Ficha | Acceso | Supervisada | Doc. para España | Botón (hoy y tras aplicar) |
|---|---|---|---|---|
| Spiko Euro y Spiko Dólar | sí | Sí | Sí | Ver oferta en Spiko |
| Spiko Smart Cash | sí | Sí | **No** | Ver oferta en Spiko |
| Robinhood Classic Stock Tokens | sí | Sí | Sí | Ver oferta en Robinhood Europe |
| Kraken xStocks | sí | Sí | **No** | Ver oferta en Kraken (Payward Europe Digital Solutions) |
| Prosegur Digital Gold y Aktionariat | sí | No | No | sales de RWAdar |
| mTBILL | sin comprobar | No | Sí | sales de RWAdar |
| Boss Info y Switzerlend | sí (reventa) | No | No | sales de RWAdar |
| Las 11 de Brickwise | sin confirmar | No | No | sales de RWAdar |
| Hausera | sin confirmar | No | No | sales de RWAdar |

- **Antes y después:** no cambia nada en las 22 fichas (acceso, supervisión,
  documento ni botón). Las 22 fichas fijas del ensayo dicen exactamente esos
  textos y todas llevan «Antes de invertir».
- **Tarjeta:** solo cambia el mínimo, en 13 (las 11 de Brickwise, Switzerlend y
  Hausera); en 12 solo la fecha y en Pottendorfer el precio (80 → 73 €, que es
  justo lo que hay que corregir, O1). España, igual en las 22.
- **El 20/11 a las 23:30 UTC** sale lo mismo. **El 21/11 a las 00:30 UTC** la
  web y la app ya no ponen ningún «Ver oferta»: las fichas caducan y la regla
  falla cerrada. La ficha fija también lo cambia al abrirse, pero solo con
  JavaScript (§8, R9).
- **Entre aplicar el SQL y publicar la web y la OTA** sale «sales de RWAdar» en
  las 22: el `transparencia.json` publicado es del 12/11 y el código exige la
  misma fecha. Falla cerrado.
- Ninguna ficha de reventa tiene `urlMercado`, así que ninguna enseña «Abrir
  mercado».

## 4. Acceso desde España

No cambia en ninguna ficha. Cada «Sí» se apoya en una fuente primaria que lo
dice, y la he vuelto a leer hoy:

- **Spiko (las tres):**
  - la tabla de países
    (`https://docs.spiko.io/documentation/product_overview/fund_availability/`,
    14:16:19 UTC, SHA-256 `05daf15f…64f7`) dice «🇪🇸 Spain ✅ ✅ ✅ ❌» (Smart
    Cash, T-Bills Euro, T-Bills Dollar y T-Bills Pound). **Ahora dice «Last
    updated: November 13, 2026.»**: a las 08:31 (investigador), 08:48 (revisor
    del grupo) y 09:27 UTC (revisión de contenido) decía «November 6, 2026».
    Frente a la copia del investigador solo desaparece la fila de Bélgica; la
    de España no cambia. Lo publicado («Disponible para residentes
    en España…», con fecha del dato 06/11) sigue siendo cierto. No hace falta
    corregirlo (§8, R8);
  - la página de restricciones de alta
    (`https://docs.spiko.io/documentation/product_overview/onboarding_restrictions/`,
    14:25:25 UTC) no nombra España;
  - el pasaporte de Spiko Finance en la CNMV
    (`https://www.cnmv.es/portal/consultas/esi/esisextranjeraslp?tipo=CLP&numero=5325&lang=es`,
    14:19:34 UTC): «SPIKO FINANCE SASU … 5325 14/01/2026»;
  - la SICAV en la CNMV
    (`https://www.cnmv.es/portal/consultas/iic/iicextranjera?nif=N0401205J&lang=es`,
    14:19:36 UTC): «SPIKO SICAV … 2380 30/01/2026 SICAV FRANCIA». La CNMV no
    enseña los compartimentos; el aviso 2 de Smart Cash lo dice.
- **Robinhood:**
  `https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp.aspx?tipo=CLP&numero=5299`
  (14:19:37 UTC): «ROBINHOOD EUROPE, UAB … 5299 21/04/2025».
- **Kraken:**
  - el pasaporte de quien lo vende,
    `https://www.cnmv.es/portal/Consultas/esi/esisextranjeraslp?tipo=CLP&numero=4474`
    (14:19:38 UTC): «PAYWARD EUROPE DIGITAL SOLUTIONS (CY) LIMITED … 4474
    05/01/2018»;
  - `https://support.kraken.com/articles/xstocks-availability` (14:24:05 UTC):
    «xStocks are not available in: United States, Australia, Canada, UK and
    Prohibited regions» y «If you are based in the EEA, you must complete and
    pass a questionnaire before gaining access to xStocks trading». España, como
    parte del EEE, entra; la ficha lo atribuye a Kraken («Según Kraken UE…») y
    avisa de que las condiciones finales no la citan.
- **Aktionariat, Boss Info y Switzerlend:**
  `https://shares.bossinfo.com/investor-page-terms` y
  `https://shares.lend.ch/investor-page-terms` (14:20:10–14:20:11 UTC, el mismo
  SHA-256 que el 12/11, `0764d616…82ff`, «Version 1.0 • October 30, 2026»),
  §9.1: «exclusively addressed to persons domiciled or resident in Switzerland
  or the EEA … The offer for persons from the EEA is limited to a total of
  €100,000.»; `https://www.aktionariat.com/disclaimer` (14:20:12 UTC) dice lo
  mismo.
- **Prosegur:** sociedad española, contrato en español para residentes del EEE.
  No cambia hoy.

Las demás dicen «Sin confirmar» o «Sin comprobar»: las 11 de Brickwise (Effecta
figura en la CNMV con el n.º 5003, pero en su pestaña de agentes, 14:20:26 UTC,
«No se han encontrado datos»: Brickwise no consta notificada), Hausera y mTBILL
(fuentes en conflicto).

## 5. Advertencias de la CNMV (búsqueda propia, 13/11/2026)

Buscador: `https://www.cnmv.es/portal/ResultadoBusqueda?tipo=<lista>&nombre=<nombre>`,
con las cuatro listas que acepta (`tipo=2` y `tipo=3` redirigen):

- `tipo=1`, advertencias de la CNMV sobre entidades no autorizadas (14:16:02–14:17:14 UTC);
- `tipo=4`, de reguladores extranjeros, no autorizadas (14:16:02–14:17:15 UTC);
- `tipo=5`, de reguladores extranjeros, otras advertencias (14:16:02–14:17:14 UTC);
- `tipo=6`, de reguladores extranjeros, todas (14:19:19–14:20:32 UTC).

Las 120 respuestas, HTTP 200. **Controles:** «Trading» en `tipo=1` (14:15:49
UTC) da «Página 1 de 16» y la primera advertencia es del 10/11/2026; en
`tipo=6`, del 11/11/2026. El buscador funciona y está al día.

**Sin resultados («No hay datos disponibles») en las cuatro listas.** 30
nombres: Spiko, Twenty First, Amundi, Midas, mTBILL, Aktionariat, DAKS, Boss
Info, Bossinfo, Switzerlend, Lend AG, lend.ch, Frankencoin, Brickwise, Effecta,
Brick Qogir, Brick Sagarmatha, BrickOne, Green Point, Green-Point, Cohotel,
Hausera, Holdtx, Ursus, Property Manager, Robinhood, Kraken, Payward, Backed y
Prosegur.

Las dos excepciones son los clones de siempre:

- «Amundi» (`tipo=4` y `tipo=6`): «12/02/2025 … AMUNDI BONDING SOLUTIONS
  LUXEMBOURG SA ISSUER PLC (CLONE) … CSSF (LUXEMBURGO)». No es la gestora
  delegada de Smart Cash.
- «Payward» (`tipo=5` y `tipo=6`): «19/03/2025 … PAYWARD LTD (CLONE) FSMA
  (BELGICA) … ESQUEMA DE RECOVERY ROOM». No es Payward Europe Digital Solutions
  (CY), n.º 4474.

Hoy no entra ninguna entidad nueva ni cambia el acceso de ninguna. No aparecer
en el buscador no significa estar autorizado. Además, el registro de emisores
de fichas referenciadas a activos de ESMA
(`https://www.esma.europa.eu/sites/default/files/2024-12/ARTZZ.csv`, 14:27:56
UTC) solo tiene la cabecera (§8, R10).

## 6. Datos personales

- **El SQL y los datos públicos no llevan datos de personas.** En
  `aplicar-y-aprobar.sql`, `catalogo.sql`, el escaparate y la documentación solo
  salen nombres de empresas y países. La cabecera y `aprobada_referencia` dicen
  «el responsable del proyecto».
- **Lo que va a Git después de aplicar** (el `transparencia.json` y las 22
  fichas fijas del ensayo) tampoco: solo el correo del propio proyecto.
- **En Git no hay PDF, HTML ni `crudo/`** del ciclo, por los dos `.gitignore`.
  El resumen del libro de órdenes del revisor de Brickwise no lleva direcciones
  de cartera (lo dice su nota y lo comprobé).
- **Lo que doy por bueno** (no es O2):
  - correos de empresas y organismos (atención al cliente, protección de datos,
    reclamaciones, cumplimiento) y teléfonos de empresas en KID y condiciones;
  - el marcador de formulario de Brickwise (un nombre ficticio alemán);
  - calles con nombre de persona (en el registro de ESMA y en direcciones de
    empresas) y el nombre del premio de periodismo del pie de página de la CNMV;
  - los nombres ya recortados de Bit2Me, Hausera y Prosegur Cash;
  - direcciones de contratos (tokens, Brokerbot, mercado y oráculo), no de
    personas, y un hash de transacción (la operación de Boss Info del 05/11) en
    el inventario del revisor de Suiza, que es el localizador de la prueba y no
    lleva direcciones de las partes;
  - el nombre de pila del responsable del proyecto en documentos internos del
    coordinador y de los revisores (`DECISIONES-COORDINADOR.md`,
    `ENCARGO-INVESTIGADORES.md`, `REVISION-ENTREGA-sql.md`,
    `revision-independiente/suiza.md`) y en el campo `decision` de
    `transparencia.json`, que no llega a la web ni a la app. Es el titular del
    repositorio y ya está en `AGENTS.md`.
- **El caso que no vale (O2):**
  `grupos/vigilancia/fuentes/profitus/nav-profitus-bonds-2026-11-13.txt`
  (commit `cccebe2`, ya en `origin/claude/sharp-babbage-m3bbbw`, no en `main`):
  - línea 124: nombre y apellido del fundador de una empresa (el mismo que se
    recortó en la línea 126);
  - línea 240: nombre y apellido de un empleado;
  - línea 244: su correo de trabajo con su nombre;
  - línea 249: su teléfono directo.

  Es el único archivo con esos datos (los busqué en los 250). La línea 291 es el
  teléfono de atención al cliente de la empresa: se queda. La copia de Bit2Me sí
  está recortada (líneas 65, 69 y 82). La lista «Recortados en las copias» de
  `grupos/vigilancia/resumen-vigilancia.md` no nombra ni la de Bit2Me ni la de
  Profitus.

## 7. Correcciones obligatorias

### O1 · Pottendorfer: rehacer la entrega con el libro de órdenes de ese momento (cambia el SQL)

**Problema.** El mínimo y tres referencias de
`vivienda-pottendorfer-stra-e-62-wr-neustadt` se basan en una orden de 1
participación a 73 € que ya no existe (§2.1). Aplicar este SQL publicaría un
mínimo que no se puede pagar.

**Corrección** (la coordinación decide el orden; el montador no edita
expedientes):

1. Volver a leer el libro de Brickwise justo antes de regenerar y dejar anotada
   la lectura con su hora y su SHA-256, por quien pueda escribirla (el
   investigador o el revisor de Brickwise, o la coordinación en DECISIONES §2).
2. Cambiar la línea de Pottendorfer de DECISIONES §2 por lo que diga esa
   lectura. Si sigue como a las 14:29 UTC, los textos son:
   - «Mínimo de inversión»: `Desde 80 € la participación en reventa (13/11)`;
     en su alcance, `a ese precio había 1 participación a la venta` pasa a `a
     ese precio había 11 participaciones a la venta` (el resto, igual);
   - «Venta más barata · 13/11/2026»: `80,00 € por participación (11 a ese
     precio, orden del 08/02/2026)`;
   - «Orden de venta de menor importe · 13/11/2026»: `1 participación a 115,00 €
     (116,73 € con el 1,5 %)`;
   - «Participaciones en venta · 13/11/2026»: `106`;
   - «Mejor oferta de compra · 13/11/2026»: sin cambios (`19,00 € (3
     participaciones, orden del 06/11/2025)`);
   - en los tres alcances del libro de Pottendorfer, la hora real de la nueva
     lectura en lugar de «(08:30–08:33 UTC)». Las otras 10 fichas se quedan con
     la suya.
3. En `despues-de-aplicar.mjs`, `BRICKWISE['vivienda-pottendorfer-stra-e-62-wr-neustadt']`
   pasa de `'73'` a `'80'`, para que el mínimo corto sea `Desde 80 € la
   participación (13/11)`. Adaptar también las comprobaciones de
   `preparar-entrega.mjs` que esperan 73 € (líneas 531, 537, 552, 554, 794–795 y
   959).
4. Regenerar (`preparar-entrega.mjs` dos veces), repetir `comprobar-entrega.mjs`
   y el ensayo de «después de aplicar», y pasar el SQL nuevo por la revisión de
   SQL y el auditor. Del contenido y del cumplimiento basta revisar la
   diferencia de Pottendorfer.
5. Si a esa hora la orden más barata vuelve a ser de 1 participación, comprobarla
   otra vez justo antes de aplicar (ya ha desaparecido dos veces en tres días).

Si la regeneración es después de las 18:00 UTC (letras) o de las 19:30 UTC
(Smart Cash), dejar las cifras de Spiko con la VL del 12/11, que ya están
revisadas y siguen siendo ciertas con su fecha, o actualizar las tres con una
revisión nueva. No mezclar.

### O2 · Datos personales en la copia de Profitus (no cambia el SQL)

**Problema.** §6. Las indicaciones del ciclo dicen: ningún nombre de persona
física en lo que va a Git. Además, el RGPD (art. 5.1.c) pide no guardar datos
que no hacen falta, y para la vigilancia de Profitus no hace falta ninguno de
estos cuatro.

**Corrección** (quien escribió la copia o la coordinación; es la C1 de la
revisión de SQL), en
`rwadar-app/data/verificaciones/2026-11-13-v2/grupos/vigilancia/fuentes/profitus/nav-profitus-bonds-2026-11-13.txt`:

1. Línea 124: el nombre y apellido que va entre «led by its founder, » y «, a
   former member» → `[nombre recortado]`.
2. Línea 240 (la línea entera es un nombre y apellido) → `[nombre recortado]`.
3. Línea 244 (correo personal de trabajo) → `[correo recortado]`.
4. Línea 249 (teléfono directo) → `[teléfono recortado]`. La línea 291 se queda.
5. Añadir esta copia y la de Bit2Me a «Recortados en las copias» de
   `grupos/vigilancia/resumen-vigilancia.md`.
6. Comprobar con `grep` que en la carpeta del ciclo, fuera de `crudo/`, ya no
   salen esos dos apellidos, ese correo ni ese teléfono.
7. Unir a `main` con *squash* para que su historia no lleve `cccebe2`.
   Reescribir la rama remota es decisión del responsable del proyecto.

Ninguna salida de `preparar-entrega.mjs` lee esa copia: no hace falta repetir
nada por esta corrección.

## 8. Recomendaciones (no bloquean)

- **R1 · Hausera, del 18/11 al 20/11.** La preventa de Alicante 3 abre el 18/11
  a las 09:00 (hora de la web, sin zona) y la ficha vale hasta el 20/11. Desde
  entonces quedan viejos «la preventa abre el 18/11», la sección «Próximas» y
  el «Es un anuncio: todavía no se puede contratar» de la web y la app (Circular
  2/2020, anexo, I.6: no dar «una apariencia distinta a la realidad sobre las
  características o duración de la oferta»). Coincido con la R1 de contenido: la
  siguiente entrega, antes del 18/11 a las 08:00 UTC, o mirar Hausera ese día.
  En la próxima, cambiar también «que pasen el test de idoneidad del emisor» por
  «que el emisor considere idóneos» (el «test de idoneidad» es el de MiFID II,
  art. 25.2).
- **R2 · Botón: alinear el código con la revisión legal 5.3 (tercera vez).** La
  revisión legal pide «sales de RWAdar» también donde el emisor no está
  supervisado; el código mira la entidad que lo vende. En Kraken el emisor
  (Backed Assets (JE)) no tiene autorización de un supervisor de la UE y las
  condiciones finales no cubren España; en Smart Cash el documento para España
  está en «No». Propuesta: exigir también `documentoEspana` en «Sí» para «Ver
  oferta en X» (web, fichas fijas y app). Necesita orden aparte y OTA.
- **R3 · Brickwise: mínimos que solo se venden en lote.** Con O1, Pottendorfer
  vuelve a ser un lote de 11 a 80 € (893,20 € con la comisión) y la entrada más
  pequeña es de 116,73 €. Pasa lo mismo en Sonnleithnergasse (11 × 75 €),
  Hinterstoder (5 × 75 €), Drautalresidenz (3 × 70 €) y Plüddemanngasse (2 ×
  75 €). Propuesta para la próxima decisión: `Desde 80 € (lote de 11, 13/11)`.
  Es la R3 del 12/11 y la R7 de contenido.
- **R4 · Brickwise: rentabilidades esperadas en fichas de reventa (quinta
  vez).** «Datos con su fecha» enseña, por ejemplo, «Rentabilidad por alquiler
  esperada (API de la app) · 22/10/2026: 4,22 %» en Pottendorfer, cuyo aviso dice
  que el alquiler terminó y que «la rentabilidad no se muestra» (Circular,
  anexo, I.7: lo secundario no puede contradecir lo principal). Y del 16 al
  20/11 «Próxima distribución esperada · 22/10/2026: 15/11/2026» será una fecha
  pasada en seis fichas. Quitarlas de las 11 en la próxima entrega.
- **R5 · Rentabilidades: la frase de la Circular y el periodo.** Añadir «Las
  rentabilidades pasadas no son un indicador fiable de las futuras» donde se
  enseñe una rentabilidad (hoy, las tres de Spiko), en el literal o en el código.
  En Smart Cash, decir el periodo y que está anualizada («Rentabilidad publicada
  · neta, variable y anualizada · 12/11/2026: 2,84 %»).
- **R6 · Boss Info y Switzerlend: el aviso que falta (tercera vez).** Añadir:
  «Sin folleto ni KID, y el emisor no está supervisado: su portal no dice en qué
  exención se apoya para vender en el EEE. Puedes perder lo que inviertas.».
  Si el coordinador lo acepta, puede entrar en la misma regeneración de O1.
  Robinhood y Aktionariat tampoco tienen un aviso propio de pérdida del capital
  (hoy lo cubren el riesgo 7 de 7 del KID y el bloque «Antes de invertir»).
- **R7 · mTBILL: el aviso de una rentabilidad que no se ve.** Cambiarlo por
  «RWAdar no enseña la rentabilidad de mTBILL mientras sus documentos no
  coincidan. La que calcula con el valor que publica el emisor (del 06/10 al
  10/11/2026) es pasada, está en dólares y no descuenta el 0,07 % del reembolso
  inmediato ni el cambio euro/dólar. Las rentabilidades pasadas no son un
  indicador fiable de las futuras.» (R2 del 12/11 y R8 de contenido).
- **R8 · Spiko: la tabla de países se actualizó hoy.** «Last updated: November
  13, 2026», sin cambios para España. No hace falta tocar nada. En la próxima
  entrega, fecha del dato 13/11 (o la que diga entonces).
- **R9 · Fichas fijas sin JavaScript.** La página `/ofertas/<slug>` sale con
  «Ver oferta en X» calculado con el día de la revisión y solo lo cambia el
  JavaScript al abrirla. Sin JavaScript, del 21/11 en adelante seguiría diciendo
  «Ver oferta en X» en las 5. Mejor generar «sales de RWAdar» por defecto y que
  el JavaScript lo cambie a «Ver oferta» solo si todo se cumple (que falle
  cerrado también sin JavaScript).
- **R10 · Prosegur Digital Gold y MiCA.** Falta un análisis de si el token es
  una ficha referenciada a activos (MiCA, art. 3.1.6, y título III). El registro
  de ESMA no tiene hoy ningún emisor. La ficha ya dice que la autorización de
  Prosegur no cubre el token; conviene dejar escrito el análisis.
- **R11 · Expedientes sin corregir.** Los tres suizos siguen con 79 de 82 horas
  copiadas del 12/11, y los de Spiko con «October 23». Lo publicado está bien,
  pero el expediente es la prueba: que los corrija quien los escribió, o que
  quede una nota en cada uno. Ojo: `preparar-entrega.mjs` comprueba que siguen
  así (R6 de la revisión de SQL).
- **R12 · Un comentario con el nombre de pila del responsable** en código
  público: `rwadar-site/assets/ficha-editorial-20261022.js`, línea 105 (y su
  copia `rwadar-movil/lib/ficha-editorial.js`). En el próximo cambio de código,
  «el responsable del proyecto».

## 9. Límites de esta revisión

- **No abrí los PDF** (KID, folletos, condiciones finales, documento de emisión
  de Hausera). Para su contenido me apoyo en los expedientes, en
  `revision-independiente/` y en las revisiones de hoy.
- **No volví a leer** los portales suizos por dentro, la cadena ni el oráculo de
  mTBILL: lo hicieron el revisor de Suiza y el de contenido entre las 08:40 y las
  09:41 UTC. Sí leí sus condiciones de acceso.
- **No repetí el ensayo ni `npm test`.** Usé, solo leyendo, la copia del ensayo
  del montador.
- **No leí Supabase.** Que lo publicado siga siendo la `a58dd22d` lo da la
  lectura del montador (08:27 UTC); hay que repetirla antes de aplicar.
- **No hice altas ni KYC.**
- **El buscador de la CNMV** busca por nombre y por trozo de nombre. No sustituye
  a una consulta formal.
- **El barrido de nombres no es exhaustivo.** Un nombre que no esté en el
  diccionario o con otra forma puede escaparse.
- **No revisé el contenido de las noticias**, que no son parte de esta entrega.
  Solo miré los datos personales de lo que va a Git.
- **RWAdar no está dentro del ámbito de la Circular 2/2020** (norma 4): es un
  medio sin comisiones ni publicidad. La uso como vara de medir porque la
  revisión legal del 06/11 la adopta (punto 5.3).
- **El libro de órdenes cambia a diario.** Mis lecturas de Brickwise son de las
  14:16 a las 14:29 UTC; hay que repetirla antes de regenerar y antes de aplicar.
