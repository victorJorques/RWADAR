<!-- Copia de 2026-11-20-v2/DECISIONES-COORDINADOR.md para las pruebas de la entrega 2026-11-20.2; sin nombres de personas. -->
# Decisiones del coordinador · entrega 2026-11-20

Claude, 20/11/2026. Puesta al día pedida por [el responsable del proyecto] a las 16:51 UTC: «Actualiza
las fichas y la información de RWAdar, ofertas, noticias, todo antes de las 12
de la noche» y, a las 16:54 UTC, «el valor de mercado con el gráfico también,
todo actualizado al momento de ahora».

**Base:** la publicada `434217eb-9b7f-1cd9-a851-fbde7bced2bf` (entrega
`2026-11-13`), leída como visitante a las 16:52 UTC (`lectura-publica/`). Sus
cifras caducan hoy a las 24:00 UTC.

**Fuentes de estas decisiones:** `vigia.json` (16:52 UTC), `expedientes/`,
`grupos/*/resumen-*.md` y `revision-independiente/`. En cada grupo revisó un
agente distinto del que investigó. Solo entra lo `confirmado` o lo
`confirmado_con_cambios`, con las correcciones obligatorias aplicadas. Cerrado
a las 17:20 UTC.

## 1. Lo general

- **Etiqueta `2026-11-20`.** Las mismas 22 ofertas, en las mismas colecciones
  (8 / 13 / 1). Ni altas ni retiradas: entrega con el motor.
  - `verificadaEl = 2026-11-20` y `vigenciaDias = 7`: el último día vigente
    es el **27/11/2026**.
- **Radar:** `verificadoEl = 2026-11-20`, 69 de 69
  (`radar-contraste-2026-11-20.json`, capturas de las 16:57 UTC). La ficha de
  la entidad de Spiko en REGAFI cargó hoy con datos; solo la de pasaportes se
  leyó por la API pública del mismo registro a las 16:58 UTC, con la misma
  huella que el 13/11 (`cambios-radar.json`, `radar-manual/`). No cambia
  ninguna dirección ni ningún texto.
- **Rutas legítimas:** `comprobar-rutas.mjs` a las 16:52 UTC (Midas docs
  abierta de nuevo; FSMA de Crypto.com con versión solo técnica).
- **Noticias:** 5 «importantes» (la más reciente del 18/11) y ninguna de «Hoy»
  (`rwadar-app/data/noticias-diarias/2026-11-20/`), con la skill de la mañana:
  editor y verificador independientes, pase 1 «conforme», validación y
  pruebas. Se publican en `rwadar-site/datos/noticias-v2.json` y, sin
  «imagen», en `noticias.json`.
- **Tokenización:** «Tokenización diaria» del 20/11 (15:58 UTC) en
  `datos-tokenizacion`; se vuelve a lanzar justo antes de publicar, a petición
  de [el responsable del proyecto] («al momento de ahora»).

## 2. Por oferta (antes → ahora)

- **Spiko Letras del Tesoro Euro:** rentabilidad **2,40 % → 2,35 %** (VL del
  19/11, 1,063276 €; 31 días, 19/10 → 19/11; API `monthlyYield` 0.0235,
  recalculado 2,350 %). Métrica: «Rentabilidad publicada · 31 días ·
  19/11/2026: 2,35 %».
- **Spiko Letras del Tesoro Dólar:** **3,98 % → 3,97 % en USD** (VL del 19/11,
  1,103445 $; 19/10 → 19/11; recalculado 3,967 %). Siguen los conflictos ya
  avisados.
- **Spiko Smart Cash Euro:** sigue en **2,84 %**, con la VL del 20/11
  (1,017886 €; recalculado 2,837 % a 7 días). Se mantiene el aviso de acceso
  (nadie confirma ni niega su venta en España).
  **Corrección obligatoria del revisor:** la métrica «Supervisor» pasa a
  «AMF (Francia): n.º SCV20260075, según el certificado de la AMF del
  23/02/2026; el 20/11/2026 el fondo ya no aparece en la base pública de la
  AMF (GECO) · Spiko SICAV inscrita en la CNMV (n.º 2380); la CNMV no muestra
  qué fondos de la SICAV están dados de alta en España». Igual en el claim del
  expediente. En `documentacion-ofertas.json` se quita la fecha 17/02/2026 y
  «(ficha pública en GECO …)» y la URL de la ficha GECO c124199, que ya no se
  publica.
- **Spiko (las tres), VL del 20/11:** los dos fondos de Letras publican VL
  nueva hacia las 18:00 UTC. Si la entrega se monta o se aplica después, se
  vuelve a leer la API y se fecha con la VL del 20/11 (corrección del
  revisor), con su revisión.
- **mTBILL:** valor por token **1,0777 → 1,0789 USD** (ronda 498 del oráculo,
  20/11 11:41:35 UTC); rentabilidad pasada de 5 semanas **3,45 % → 3,46 %**
  (16/10 → 20/11, rondas 475 → 498, misma regla de ventana); etiqueta de la
  métrica y aviso, «del 16/10 al 20/11/2026». Sigue el conflicto de
  reembolso 25 % / 15 % (`fuentes_en_conflicto`).
- **Kraken xStocks:** el resumen pasa de «más de 130 acciones y ETF de EE. UU.»
  a «más de 1.000 acciones y ETF de EE. UU.» (Kraken UE, en español y en
  inglés «1,000+», 16:58 UTC). Sin condiciones finales con España (las del
  19/11, ANTx, solo Liechtenstein y Suiza): el aviso se mantiene.
- **Robinhood y Prosegur Digital Gold:** sin cambios; solo la fecha.
- **Brickwise (11):** las 11 siguen solo en reventa y con vendedores.
  - **Pottendorfer:** mínimo **80 € → 81 €** («Desde 81 € la participación en
    reventa (20/11)»; 1 participación, orden del 15/11; 82,22 € con el 1,5 %);
    mejor compra 19 → 64 €; en venta 106 → 96.
  - **Cohotel:** mínimo **102 € → 110 €** («Desde 110 € la participación en
    reventa (20/11)»; 35 participaciones en 2 órdenes); menor importe 1 a
    120 € (121,80 €).
  - Las otras nueve: mismo mínimo, fecha 20/11, y los cambios del vigía
    confirmados en «Participaciones en venta», «Mejor oferta de compra» y
    «Orden de venta de menor importe» (ver `expedientes/` y
    `revision-independiente/brickwise.md`).
- **Aktionariat, Boss Info y Switzerlend:** sin cambios de fondo; solo las
  fechas.
- **Hausera (en camino):** Alicante 3 con **preventa abierta desde el 18/11**;
  la oferta pública sigue anunciada para el 25/11/2026. Aviso: «El 20/11/2026,
  con la preventa ya abierta, Alicante 3 aún no estaba inscrita en el
  registro de la CNMV». Sigue «en camino».

## 3. Lo que no entra

- **Candidatas:** ninguna (Prosegur Cash pagarés, Securitize Stocks,
  Profitus/Axiology, Valorix, CANDO1, Crypto.com Tokenized Stocks y Hausera
  Alicante 3 como oferta propia): a todas les falta algo esencial respaldado
  hoy por fuente primaria. Motivos en `expedientes/candidata-*.json`.

## 4. Correcciones de las revisiones de grupo

- Spiko Smart Cash Euro, «Supervisor» (arriba, §2).
- Copias con nombres de personas físicas (`mtbill-ft.txt`, la copia renderizada
  de la página de particulares de Spiko): fuera de Git, en `crudo/`. El PR
  sale de una rama limpia (squash) para que tampoco queden en la historia de
  `main`.
- Spiko Letras, VL del 20/11 (arriba, §2).

## 5. Pendiente para el próximo ciclo

- Hausera: el 25/11 empieza la suscripción de Alicante 3; el texto «la
  suscripción empieza el 25/11» quedará viejo ese día.
- Spiko Smart Cash: por qué la AMF dejó de publicar la ficha GECO.

## 6. Auditoría completa (petición de [el responsable del proyecto] a las 17:12 UTC: «Revisa todas las ofertas e información bien»)

Auditores independientes (no investigaron ni montaron) abrieron hoy la fuente
de cada dato visible de cada ficha (`auditoria/<ámbito>.md`). Entran estas
correcciones, todas con URL, literal y hora de hoy en su informe:

**Spiko (`auditoria/spiko.md`; 99 datos comprobados):**
- A1 · **Letras del Tesoro Euro: 2,35 % → 2,45 %.** Spiko publicó la VL nueva
  a las 17:18 UTC (API `monthlyYield` 0.0245; VL 1,063496 €, calculada el
  20/11 y fechada por Spiko el 22/11 porque cubre el fin de semana;
  recalculado 22/10 → 22/11, 31 días: 2,452 %). Métrica «Rentabilidad
  publicada · 31 días · 20/11/2026: 2,45 %»; literal y referencia con
  `fechaDato` 2026-11-20 (no 22/11) y el alcance que propone el informe.
  Sustituye a la cifra de §2.
- A2 · **Letras del Tesoro Dólar: 3,97 % → 4,00 % en USD** (API 0.04 a las
  17:18 UTC; VL del 20/11, 1,103573 $; recalculado 20/10 → 20/11: 4,002 %).
  Métrica «Rentabilidad publicada · 31 días · 20/11/2026 · en USD: 4,00 %».
  Sustituye a la cifra de §2.
- A3 · Las tres de Spiko, referencia «Acceso desde España»: `fechaDato`
  2026-11-13 (la tabla de disponibilidad dice «Last updated: November 13,
  2026»); en Smart Cash, el alcance pasa a «(13/11/2026)» con el texto del
  informe.
- A4 · Smart Cash, referencia «Aprobación del compartimento» y descripción:
  el texto exacto del informe (certificado de la AMF del 23/02/2026,
  `fechaDato` 2026-02-23, fuente SAFO_Letter_EN.pdf; sin la fecha 17/02/2026
  ni la ficha GECO c124199, que ya no se publica).
- A5 · Letras Euro y Dólar, métrica «Supervisor»: «AMF (fondo) · Spiko SICAV
  inscrita en la CNMV para su comercialización (n.º 2380); la CNMV no detalla
  sus fondos uno a uno».

**Acciones, oro y letras (`auditoria/acciones-oro-tesoro.md`; 95 datos):**
- A6 · Kraken xStocks, descripción: «más de 130 acciones» → «más de 1.000
  acciones y ETF de EE. UU.» (igual que el resumen).
- A7 · Kraken xStocks, referencia «Dividendos»: `fechaDato` 2026-11-11 y
  alcance «Preguntas frecuentes de Kraken sobre xStocks, actualizadas el
  11/11/2026.» (el valor no cambia).
- A8 · Kraken xStocks: añadir como fuente las condiciones finales de ANTx del
  19/11/2026 (l-p-a.com, CH1588667217) en la referencia «Países de oferta
  (condiciones finales)», `fechaDato` 2026-11-19.
- A9 · Robinhood, aviso nuevo: «Producto complejo según su KID: puedes perder
  todo lo invertido.» (KID ES, SHA-256 84f4f0a8…: «perder la totalidad de su
  inversión», «instrumento financiero complejo»).
- A10 · mTBILL, aviso del conflicto: añadir «Las comisiones tampoco
  coinciden: las Condiciones Finales permiten hasta 0,2 % al suscribir de
  forma inmediata y hasta 0,05 % al reembolsar; el KID no cobra entrada ni
  reembolso estándar.»
- A11 · mTBILL, fuentes de la tarjeta: añadir las Condiciones Finales y el KID
  en español del CDN de GitBook (responden 200; las páginas de Midas dan 403).
- A12 · Prosegur Digital Gold, métrica «Custodia»: «Oro separado de los bienes
  de Prosegur, en un inventario conjunto de los clientes (sin lingote
  asignado)».

No entran (recomendaciones de claridad sin dato falso): «Riesgo KID» de las
Letras, mínimo en euros de la clase USD (ya avisado), «Entidad que
comercializa» de mTBILL.

Copias de la API de Spiko para A1 y A2 (consultadas a las 17:31 UTC, mismas
cifras que vio el auditor a las 17:21 UTC):
`grupos/spiko/fuentes/api-20-11-tarde/` (`yield-EUTBL.json` SHA-256
02a03185…, `yield-USTBL.json` 859689c2…, `nav-latest-EUTBL.json` 98a9113d…,
`nav-latest-USTBL.json` 6591d431…). La serie de VL para el recálculo se lee de
`net-asset-values/<clase>` como en el expediente.

**Suiza y Hausera (`auditoria/suiza-hausera.md`; 58 datos, 8 PDF con la misma
huella, 29 enlaces que responden):**
- A13 · Aktionariat, aviso nuevo: «Son acciones de una empresa que no cotiza
  en bolsa: puedes perder todo el dinero invertido.» (aktionariat.com/disclaimer,
  17:25:44 UTC: «a loss of up to the entire capital invested may occur»).
- A14 · Boss Info, el mismo aviso nuevo (bossinfo.com, investor tokens,
  17:25:45 UTC: «Ein Wertverlust bis 100% des eingesetzten Kapitals ist
  möglich.»).
- A15 · Switzerlend, el mismo aviso nuevo (lend.ch/en/investor-relations,
  17:25:46 UTC: «Equity can lose value, including entirely.»).
- A16 · Boss Info, referencia «Última operación»: la fuente sigue siendo la
  portada https://shares.bossinfo.com/ (la API getTrades responde 405 a una
  petición normal y no está entre las fuentes de la ficha); valor «8,40 ZCHF
  (1 acción, 05/11/2026)», que la portada muestra hoy («Last trade • 5 Nov
  2026»).
- A17 · Hausera, resumen: «… tiene la preventa abierta desde el 18/11 y la
  suscripción anunciada del 25/11/2026 al 30/06/2027.» (documento de emisión:
  «El periodo de suscripción se iniciará el 25/11/2026 y se extenderá hasta el
  30/6/2027»), para que no quede viejo el 25/11, dentro de la vigencia.

No entran (claridad): «Clase» de Switzerlend, mínimo en cripto de Aktionariat
y el alcance de las referencias antiguas de Boss Info (eran ciertas en su
fecha).

**Radar (`auditoria/radar-plataformas.md`; 226 datos de las 30 fichas):** 14
correcciones obligatorias y 6 recomendadas, casi todas en los textos «aval» y
«nota» de julio y agosto (por ejemplo, Swarm «opera bajo licencia de BaFin»,
que BaFin no confirma; Lofty «oferta registrada»; Franklin Templeton
«Minorista» para un fondo que no se vende en la UE). **No entran en esta
entrega:** esos textos no son de la revisión del catálogo, sino de la tabla
base `plataformas` de Supabase (`rwadar-app/db/02_seed.sql`). Cambiarlos es
SQL fuera de «Aplicar catálogo», que esta orden no cubre. Se lo explico a
[el responsable del proyecto] con la propuesta para hacerlo en cuanto lo autorice.

**Brickwise (`auditoria/brickwise-a.md` y `brickwise-b.md`; 303 datos de las
11 fichas):**
- A18 · En las 11 fichas de reventa, quitar de las referencias («Datos con su
  fecha») las de rentabilidad y reparto: «Distribución anual prevista
  anunciada», «Distribución anual esperada · 22/10/2026», «Rentabilidad por
  alquiler esperada (API de la app) · 22/10/2026», «Rentabilidad · consulta
  01/11/2026» y «Próxima distribución esperada · 22/10/2026» (que daba el
  15/11/2026, ya pasado; hoy la app dice 15.12.2026), donde estén. La reventa
  no lleva rentabilidad (norma de las tarjetas) y varias fichas tienen el
  aviso «la rentabilidad no se muestra», que esas referencias contradicen.
- A19 · Randhartingergasse: quitar la referencia «Participaciones disponibles
  en emisión (API) · 22/10/2026: 374 de 2.670» (la emisión cerró el
  15/09/2022; la API da `stage: secondary`).
- A20 · Citas del KID en alemán mal copiadas, en las fichas donde estén
  (`auditoria/brickwise-a.md`): «Custodia · consulta 01/11/2026» pasa al
  literal del KID «Die Verwaltung und Übertragung der Token hat
  eigenverantwortlich durch den Anleger zu erfolgen.» y «Qué se adquiere ·
  consulta 01/11/2026» empieza por «Das Produkt läuft endlos/ewig
  ("Perpetual")…» (el KID no dice «Genussscheine»). Y la errata «comprobado
  el30/09/2026» → «comprobado el 30/09/2026» donde esté.
- A21 · Randhartingergasse y Hinterstoder (productos de capital,
  `participationRightEquity`): tarjeta «Acceso desde España» → «Sin
  confirmar: cuenta para residentes del EEE (España incluida); esta emisión
  pide número fiscal austriaco.» y aviso nuevo: «Para comprar esta emisión,
  quien no tributa en Austria debe dar antes un número fiscal austriaco: las
  rentas tributan en Austria y la ganancia al vender paga allí el impuesto
  inmobiliario (ImmoESt).» Fuente: ayuda de Brickwise «Wie sind die Erträge zu
  versteuern?» (17:23:20 UTC) y la app pública («Um in dieses Produkt
  investieren zu können, wird eine österreichische Steuernummer benötigt.»).

No entran (claridad o información adicional sin dato falso): avisos de la
retención KESt, mínimos «en lote de N», nueva redacción del aviso de
subordinación, vida útil de Cohotel, piso vacío de Randhartingergasse, «Precio
de emisión original» de Plüddemanngasse y la fuente del «Plazo» de GreenPoint
y Cohotel. Quedan anotadas para el próximo ciclo.

## 7. Orden de [el responsable del proyecto] de las 17:40 UTC

«Claro. Todo lo falso fuera y actualiza todo lo comentado y publica la
actualización; que no vuelvan a haber textos ni datos falsos.» Es la orden
expresa para, además del catálogo:
- arreglar el mercado en directo (migración 37: el alta de tokens agotaba la
  secuencia `smallint` de `rwadar_mercado.tokens`; error 2200H desde el 16/11
  03:33 UTC) y volver a sembrarlo;
- corregir los textos falsos del radar en la tabla base `plataformas`
  (migración 38, `TEXTOS-RADAR.md`);
- corregir los textos desfasados de la web (/cambios, privacidad, rótulos del
  mercado con fecha cuando el dato no es de hoy);
- y dejar la auditoría completa como paso fijo de cada ciclo
  (`.claude/workflows/auditoria-completa-catalogo.js` y la skill).

## 8. Enlaces de las 22 fichas (20:50 UTC, `probar-enlaces.mjs`, `enlaces-publicados-20-11.json`)

133 direcciones; 120 responden bien. De las 13 restantes:
- 6 de la CNMV dan 500 al comprobador (rechaza su agente) y 200 con una
  petición normal (comprobado a mano, 20:52 UTC): funcionan.
- 6 de Midas (midas.app y docs.midas.app) dan 403 con desafío anti-robots de
  Cloudflare: un visitante con navegador entra; no se elude. Por eso A11 añade
  las Condiciones Finales y el KID del CDN de GitBook, que sí responden.
- **A22 · mTBILL:** https://midas.app/assets/main-DOxid0Zj.js da **404** (un
  archivo antiguo de la web de Midas). Quitarlo de las fuentes y de la
  referencia que lo cite (si el motor no puede quitarlo de la lista
  «fuentes», que la referencia cite en su lugar el KID o las Condiciones
  Finales del CDN de GitBook y anotarlo en noAplicado).

## 9. Radar: lo que va en la revisión del catálogo (no en la tabla base)

Los textos base del radar van en la migración 38 (PR aparte). Estos tres
hallazgos de `auditoria/radar-plataformas.md` están en la capa verificada del
radar (licencia y acceso) y se cambian en esta entrega con
`cambios-radar.json` → `plataformas` (campos licenciaRegistro / acceso):
- A23 · Pax Gold, licencia: «… lista OCC de trust banks activos a 30/09/2026»
  → «a 31/10/2026» (lista OCC «Trust Banks Active As of 10/31/2026», charter
  25379, 17:16:15 UTC).
- A24 · Midas, acceso, aviso y licencia: ya no es cierto que no se obtuvieran
  los términos finales de mTBILL. Acceso: «Las condiciones finales de mTBILL
  (17/07/2026) incluyen España entre los países de la oferta pública y no
  prohíben la venta a minoristas del EEE. Eso no confirma que la web te deje
  darte de alta.»; quitar «que no hemos podido obtener» y «No se obtuvieron los
  términos finales vigentes de mTBILL», citando el PDF de las condiciones
  finales del CDN de GitBook (SHA-256 b1e58001…, 17:22:41 UTC).
- A25 · Reental, licencia: «Reental dice que su actividad en España no está
  sujeta a autorización ni registro previo de la CNMV.» (reental.co,
  17:16:14 UTC: «La actividad no está sujeta a autorización ni registro
  previo de la CNMV»).
Si el motor no admite alguno tal cual, a noAplicado con el motivo.
