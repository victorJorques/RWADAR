# Revisión de contenido · entrega «2026-11-20» (SQL 4380fcf3…)

Revisor independiente de contenido y tarjetas (no investigó ni montó esta
entrega). Trabajo hecho el 20/11/2026 entre las 20:59 y las 21:12 UTC sobre
`aplicar-y-aprobar.sql` SHA-256 `4380fcf33f557b1b3e3771bb4071b457fc2de03700352d38320da978208dffe6`
(revisión `c8727d7d-cd09-d2cf-d3dc-da3158fe6812`), que parte de la publicada
`434217eb-9b7f-1cd9-a851-fbde7bced2bf`.

## Veredicto

**Aprobada con cambios.** Lo que entra de DECISIONES §1–§6 está bien puesto y
las cifras que abrí hoy en su fuente coinciden con lo publicado. Antes de
aplicar hay que volver a montar con A22 (§8), A23–A25 (§9) y una cita falsa
del KID que sigue en dos fichas de Brickwise (A20). Las seis correcciones
obligatorias van abajo con el cambio exacto.

## Qué he comprobado yo (hechos con hora UTC)

### Tarjetas: `resumenOferta` con las 22 fichas (20/11 21:00 UTC)

Ejecuté `rwadar-site/assets/ficha-editorial-20261022.js` con cada oferta de
`escaparate-publicacion.json` y su `documentacion-ofertas.json`. Lo que
enseña la tarjeta en corto (web y app comparten este código):

| Ficha | Mínimo | España | Estado |
|---|---|---|---|
| Spiko Letras Euro | 1 € | Disponible (dato 06/11) | Datos con fuente y fecha |
| Spiko Letras Dólar | 1 USD | Disponible (dato 06/11) | Datos con fuente y fecha |
| Spiko Smart Cash Euro | 1 € | Disponible (dato 06/11) | Datos con fuente y fecha |
| Robinhood | 1 € | Disponible | Datos con fuente y fecha |
| mTBILL | (oculto) | Sin confirmar | Las fuentes no coinciden |
| Prosegur Digital Gold | 1 gramo de oro | Disponible | Datos con fuente y fecha |
| Aktionariat | 500 CHF por transferencia bancaria | Disponible | Datos con fuente y fecha |
| Kraken xStocks | 1 € | Disponible | Datos con fuente y fecha |
| Boss Info | 100 CHF por transferencia al emisor; en cripto, desde 2 acciones (unos 17 ZCHF el 20/11) | Disponible | Reventa |
| Switzerlend | 1 acción (68,01 CHF el 20/11) | Disponible | Reventa |
| Brickwise (11) | «Desde N € la participación en reventa (20/11)» | Sin confirmar | Reventa |
| Hausera | Desde 100 € en Alicante 3, según su documento de emisión (20/11); preventa abierta desde el 18/11. | Sin confirmar | Anuncio documentado |

- En reventa y próximas no sale ni rentabilidad ni precio principal
  (`rentabilidad` y `precio` nulos en las 14). En ningún mínimo aparece «por
  participación/token/acción».
- Con el reloj del 27/11 las 22 siguen vigentes, y con el del 28/11 pasan a
  «Revisión pendiente · cifras ocultas» (`vigenciaDias` 7).
- Fichas web del ensayo (`…/scratchpad/ensayo-2026-11-20/rwadar-site/ofertas/`,
  22 páginas): los textos nuevos salen tal cual. «Lo esencial» se rellena con
  JavaScript a partir de `resumenOferta` (sin JavaScript la página enseña el
  texto prudente por defecto). Esto ya era así antes y no lo cambia esta
  entrega.

### Enlaces (`probar-enlaces.mjs`, 20/11 21:00 UTC)

Probé 136 direcciones y 123 responden bien. Las 13 restantes:

- 6 de Midas dan 403 con desafío de Cloudflare. Ya estaban vistas.
- 6 de la CNMV dan 500 al comprobador. También estaban vistas.
- 1 da **404**: `https://midas.app/assets/main-DOxid0Zj.js` (A22). La cita la
  referencia «Acceso desde España · consulta 01/11/2026» de mTBILL, y en la
  ficha se ve como «Abrir fuente ↗» y en la lista de fuentes.

Las direcciones nuevas responden 200:
- Condiciones Finales de mTBILL en GitBook: 1.248.073 bytes.
- KID en español de mTBILL: 154.610 bytes.
- ANTx en l-p-a.com: 1.085.449 bytes.

La ficha GECO c124199 de Smart Cash también responde 200 (37.542 bytes) y
sigue en la lista de fuentes visible.

### Fuentes primarias abiertas hoy (muestreo, más de 4 cifras)

- **Spiko, API pública** (21:02:13–21:02:17 UTC):
  - `share-classes/EUTBL/yield`: `"monthlyYield":"0.0245"` (actualizado a las
    17:18:23 UTC). `net-asset-values/EUTBL/latest`: `"day":"2026-11-22"`,
    `"value":"1.063496"`. Coincide con el 2,45 % y con «VL calculada el
    20/11/2026, que Spiko fecha el 22/11/2026».
  - USTBL: `"monthlyYield":"0.04"`, VL `1.103573` USD del 2026-11-20.
    Coincide con el 4,00 % en USD.
  - eurSAFO (Smart Cash): `"monthlyYield":"0.0284"`, VL `1.017886` € del
    2026-11-20. Coincide con el 2,84 %.
- **mTBILL, oráculo** `0x056339C0…2E5b` (`latestRoundData`, 21:02:26 UTC):
  - ronda 498: `answer 107890125`, `updatedAt 2026-11-20T11:41:35Z`, es decir,
    1,0789 USD;
  - ronda 475: `107534190`, del 2026-10-16T13:47:47Z;
  - (1,07890125 / 1,07534190 − 1) × 365 / 34,91 = **3,46 %**. Coinciden el
    valor, la rentabilidad y la ventana «del 16/10 al 20/11/2026».
- **Brickwise, API** `api.app.brickwise.at/api/v2/assets` (21:02:37 UTC). Las
  11 fichas coinciden en la venta más barata y en las participaciones en
  venta:
  - Pottendorfer: `lowestOfferPrice 81`, `availableBricksSecondary 96`;
  - Cohotel: 110 y 59;
  - Plüddemanngasse: 75 y 335;
  - Sonnleithnergasse: 75 y 97;
  - Klagenfurt: 95 y 299;
  - Gratwein: 68,8 y 315;
  - Schwarzer Weg: 69,9 y 298;
  - Drautal: 70 y 147;
  - Randhartingergasse: 78 y 188;
  - Hinterstoder: 75 y 252;
  - GreenPoint: 102 y 347.
- **Hausera:**
  - `hausera.io/page-data/propiedad/alicante_3/page-data.json` (21:03:20 UTC)
    dice `"status":"PRESALE"`, `"presaleDate":"18/11/2026"`,
    `"startDate":"25/11/2026"` y `"priceToken":100`.
  - El documento de emisión (Drive `1cpWVN3J…`, SHA-256 `9170562a579f34c2…`,
    21:03:35 UTC) dice «El periodo de suscripción se iniciará el 25/11/2026 y
    se extenderá hasta el 30/6/2027» y «Precio unidad mínima de compra 100 €».
    Coinciden el resumen (A17), la métrica y el mínimo.
- **KID de Brickwise** de las 5 fichas que el montador dejó fuera de A20
  (21:05:49 UTC):
  - Pottendorfer (`03bdd125…`), GreenPoint (`f6c7c7ff…`) y Cohotel
    (`da8e1df3…`) dicen de verdad «Die Verwaltung und Übertragung der Token
    erfolgt ausschließlich eigenverantwortlich durch den Anleger.». En
    GreenPoint y Cohotel el KID dice además «Jeder Token vermittelt dem
    Investor einen qualifiziert nachrangigen Rückzahlungsanspruch zum
    Endfälligkeitstag.». **Esas citas están bien y no hay que tocarlas.**
  - Randhartingergasse (`8c331bfe…`, SHA-256 `2aa7ac3cea28…`) y Hinterstoder
    (`3aa9bf9c…`, `ce890eafd164…`) dicen «Das Produkt läuft endlos/ewig
    ("Perpetual") und kann durch den Anleger nur dann gekündigt werden, wenn
    die Token nicht mehr in den Handel auf einem öffentlich zugänglichen
    Marktplatz einbezogen sind.» y hablan de «Genussrechts», no de
    «Genussscheine». **La ficha sigue citando «Genussscheine ... läuft
    endlos/ewig…» como literal: es falso** (corrección O5).
- **Radar, para A23–A25** (21:07:55 UTC):
  - lista de la OCC: «Trust Banks Active As of 10/31/2026» y «25379 Paxos
    Trust Company, National Association»;
  - Condiciones Finales de mTBILL (GitBook, SHA-256 `b1e58001ec0f688a…`):
    «FINAL TERMS DATED 17 July 2026», «Countr(y)(ies) Where the Offer(s) to the
    Public Takes Place: Ireland, Malta, Austria, Belgium, Luxembourg, France,
    Italy, Spain, Poland, Romania, Netherlands, Sweden, Portugal, Germany» y
    «Prohibition of Sales to EEA Retail Investors: not applicable»;
  - reental.co: «La actividad no está sujeta a autorización ni registro previo
    de la CNMV debido a: Libertad de emisión (art. 34.1…».

### Avisos con fecha

Los avisos re-fechados al 20/11 se comprobaron hoy:
- Aktionariat, 6,20 ZCHF; Switzerlend, 67,00 ZCHF: libro de órdenes de las
  17:15:56 UTC, «Coincide» en `auditoria/suiza-hausera.md`.
- Switzerlend, 0,03 ZCHF; Boss Info, 8,40 ZCHF: en el expediente de hoy.
- Hausera, «aún no estaba inscrita»: en el expediente de hoy.

No encontré ningún aviso re-fechado sin comprobación de hoy. La lectura en
cadena de Boss Info del 13/11 sigue fechada el 13/11, tal como dice su
alcance.

## Ficha por ficha (22)

- **Spiko Letras Euro:**
  - 2,45 % y su literal (VL calculada el 20/11, fechada el 22/11) coinciden
    con la API;
  - «Supervisor» = A5 tal cual.
  - A3 no entra: la tarjeta sigue con el dato del 06/11 cuando la tabla dice
    «Last updated: November 13, 2026». No es falso, solo prudente.
    Recomendado.
- **Spiko Letras Dólar:** 4,00 % en USD (VL del 20/11) coincide; A5 tal cual.
- **Spiko Smart Cash Euro:**
  - 2,84 % con la VL del 20/11 coincide;
  - «Supervisor» = texto de §2 letra a letra;
  - A4 bien: la referencia cita SAFO_Letter_EN.pdf con fechaDato 2026-02-23 y
    la descripción ya no lleva el 17/02 ni GECO.
  - La dirección GECO c124199 sigue en la lista de fuentes visible porque el
    motor no la puede quitar. Recomendado.
- **Robinhood:** aviso A9 tal cual.
- **mTBILL:**
  - 1,0789 USD y 3,46 % coinciden con el oráculo;
  - el aviso A10 está bien, unido al de los límites de reembolso;
  - A11 bien (las dos direcciones responden 200);
  - **falta A22** (O1).
- **Prosegur Digital Gold:** «Custodia» = A12 tal cual.
- **Aktionariat, Boss Info, Switzerlend:**
  - avisos A13–A15 tal cual;
  - A16 bien: la fuente es la portada, con «8,40 ZCHF (1 acción, 05/11/2026)»;
  - «Supervisor» FINMA re-fechado, respaldado por la auditoría.
- **Kraken xStocks:**
  - A6 bien: resumen y descripción con «más de 1.000», sin «130»;
  - A7 bien: fechaDato 2026-11-11 y alcance exacto;
  - A8 bien: cita ANTx, con fechaDato 2026-11-19, y menciona LITEx.
- **Brickwise (11):**
  - mínimos y referencias de órdenes coinciden con la API;
  - A18 bien: ya no hay «Distribución…», «Rentabilidad…» ni «Próxima
    distribución…»;
  - A19 bien;
  - A20 bien en las 6 fichas de `brickwise-a.md`, y «Custodia» también en
    Randhartingergasse y Hinterstoder;
  - **falta «Qué se adquiere» en Randhartingergasse y Hinterstoder** (O5).
  - El aviso A21 (número fiscal austriaco) entró en las dos fichas.
  - No hay errata «el30/09» en ningún sitio.
- **Hausera:** resumen A17 tal cual; aviso y mínimo re-fechados y comprobados.
  Sigue «en camino».

## Correcciones obligatorias (cambio exacto)

**O1 · A22 · mTBILL, enlace 404.** En `decisiones.json`, `ofertas.mtbill.cambios`:

```json
{ "tipo": "referenciaQuita",
  "etiqueta": "Acceso desde España · consulta 01/11/2026",
  "antes": "mTBILL: Midas Software GmbH · «Public offer under the EU Prospectus Regulation» · offer: public" },
{ "tipo": "referenciaNueva",
  "despuesDe": "Países de oferta según la web de Midas · consulta 05/11/2026",
  "despues": {
    "etiqueta": "Países de oferta pública (condiciones finales)",
    "valor": "Countr(y)(ies) Where the Offer(s) to the Public Takes Place: Ireland, Malta, Austria, Belgium, Luxembourg, France, Italy, Spain, Poland, Romania, Netherlands, Sweden, Portugal, Germany",
    "fechaDato": "2026-07-17",
    "fuente": "https://3475141875-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FMndxFHqGeA4nzBBeKDTV%2Fuploads%2FUDquVH8yRhSxnVqxp0X4%2F20260714_mTBILL_FT_signed_final.pdf?alt=media",
    "alcance": "Condiciones finales de mTBILL del 17/07/2026 (copia en la documentación de Midas, SHA-256 b1e58001…): España está entre los países de la oferta pública y «Prohibition of Sales to EEA Retail Investors: not applicable». No confirman que la web te deje darte de alta." } }
```

Y en `noAplicado`, para mtbill: «quitar `https://midas.app/assets/main-DOxid0Zj.js`
de la lista de fuentes de la ficha: el motor no quita direcciones de
`documentacion.fuentes`». Si el coordinador prefiere no añadir la referencia
nueva, basta el `referenciaQuita`: lo obligatorio es que ninguna referencia
cite el 404.

**O2 · A23 · Pax Gold, licencia.** En `cambios-radar.json` → `plataformas`:

```json
"pax-gold": { "licenciaRegistro": {
  "antes": "Paxos Trust Company, National Association figura en la lista OCC de trust banks activos a 30/09/2026 (charter 25379). La autorización NYDFS de PAX Gold es un antecedente de 2019, no la única evidencia del estado actual.",
  "detalle": "Paxos Trust Company, National Association figura en la lista OCC de trust banks activos a 31/10/2026 (charter 25379). La autorización NYDFS de PAX Gold es un antecedente de 2019, no la única evidencia del estado actual.",
  "motivo": "La lista de la OCC enlazada dice hoy «Trust Banks Active As of 10/31/2026» y sigue con Paxos (charter 25379); comprobado el 20/11/2026 a las 17:16:15 y 21:07:55 UTC." } }
```

El contraste de hoy ya lo respalda (`paxg-occ`: «Trust Banks Active As of
10/31/2026»).

**O3 · A24 · Midas, acceso, licencia y aviso.**

```json
"midas": {
  "licenciaRegistro": {
    "antes": "La FMA de Liechtenstein aprobó el 17/07/2026 un nuevo folleto base de Midas Software GmbH, válido hasta el 17/07/2027 y notificado a la CNMV. Incluye mTBILL (ISIN CH1371002986) entre los productos que se siguen ofreciendo. Aprobar el folleto no es una licencia: el propio folleto dice que el emisor no está regulado por la FMA. No se obtuvieron los términos finales vigentes de mTBILL.",
    "detalle": "La FMA de Liechtenstein aprobó el 17/07/2026 un nuevo folleto base de Midas Software GmbH, válido hasta el 17/07/2027 y notificado a la CNMV. Incluye mTBILL (ISIN CH1371002986) entre los productos que se siguen ofreciendo. Aprobar el folleto no es una licencia: el propio folleto dice que el emisor no está regulado por la FMA.",
    "motivo": "Las condiciones finales de mTBILL son públicas (CDN de GitBook, SHA-256 b1e58001…, 17:22:41 y 21:07:55 UTC)." },
  "acceso": {
    "antes": "No se obtuvieron términos finales vigentes que permitan confirmar acceso minorista, mínimo de inversión o elegibilidad desde España.",
    "detalle": "Las condiciones finales de mTBILL (17/07/2026) incluyen España entre los países de la oferta pública y no prohíben la venta a minoristas del EEE. Eso no confirma que la web te deje darte de alta.",
    "motivo": "Condiciones finales: «Offer(s) to the Public … Spain …» y «Prohibition of Sales to EEA Retail Investors: not applicable» (21:07:55 UTC)." } }
```

El aviso del radar (`alertasCriticas`, código `terminos_finales_no_confirmados`)
dice «…lo deciden los términos finales vigentes de mTBILL, que no hemos podido
obtener.». Tiene que cambiar a la vez, o el radar se contradice. Texto nuevo:
«Que el folleto esté «aprobado por la FMA» no es un aval ni una licencia de
Midas: según el folleto base del 17/07/2026, la FMA solo revisa que esté
completo, se entienda y sea coherente, y el emisor no queda regulado por ella.
Si pueden entrar minoristas del EEE lo deciden las condiciones finales de
mTBILL; las del 17/07/2026 no lo prohíben, pero eso no confirma que la web te
deje darte de alta.»

El motor solo cambia `estadoOperativo`, `licenciaRegistro` y `acceso`. Por eso
hay que elegir una de dos:
- ampliar `preparar.mjs` para que acepte `alertasCriticas` por `codigo`, con
  `antes` y `detalle`;
- o dejar A24 entero en `noAplicado` (DECISIONES §9 lo permite) para no
  publicar acceso y aviso contradictorios.

La fuente del acceso seguirá siendo `midas-mtbill` (el folleto base), porque
el motor no añade fuentes al radar. Anotarlo en `noAplicado`.

**O4 · A25 · Reental, licencia.**

```json
"reental": { "licenciaRegistro": {
  "antes": "La fuente primaria localizada acredita una emisión española concreta con ERIR; no acredita una autorización general de Reental como empresa de servicios de inversión.",
  "detalle": "Reental dice que su actividad en España no está sujeta a autorización ni registro previo de la CNMV.",
  "fuentesAntes": ["reental-emision"],
  "fuentes": ["reental-web"],
  "motivo": "reental.co (17:16:14 y 21:07:55 UTC): «La actividad no está sujeta a autorización ni registro previo de la CNMV»." } }
```

No añadir `radar.literales` para `reental-web`: el contraste de las 16:57 UTC
no recogió esa frase.

Para O2–O4, la `nota` de `cambios-radar.json` dice «Hoy no cambia ninguna
dirección ni ningún texto del radar». Tiene que decir que cambian estos
textos, y debe seguir empezando por «Cambios del radar comprobados a mano el
20/11/2026.».

**O5 · A20 · cita falsa del KID en Randhartingergasse y Hinterstoder.** En
`ofertas.randhartingergasse-9-viena.cambios` y en
`ofertas.apartamento-vacacional-hinterstoder-50.cambios`:

```json
{ "tipo": "referencia",
  "etiqueta": "Qué se adquiere · consulta 01/11/2026",
  "antes": "Genussscheine ... läuft endlos/ewig (\"Perpetual\") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind.",
  "despues": { "valor": "Das Produkt läuft endlos/ewig (\"Perpetual\") und kann durch den Anleger nur dann gekündigt werden, wenn die Token nicht mehr in den Handel auf einem öffentlich zugänglichen Marktplatz einbezogen sind." } }
```

La web lo pinta como «Cita
literal de la fuente, en alemán» y ese KID no dice «Genussscheine», sino
«Genussrechts» (KID abiertos a las 21:05:49 UTC). Entra por la orden del
responsable de las 17:40 UTC (§7, «Todo lo falso fuera»). Hay que corregir
también la nota de `noAplicado` de A20: en Pottendorfer, GreenPoint y Cohotel
las citas publicadas **sí** están en su KID, así que no hay que cambiarlas.

**O6 · Registro.** Al volver a montar, `noAplicado` y el informe tienen que
recoger lo que quede fuera de O1–O5 y su motivo:
- la dirección del 404 en la lista de fuentes;
- la fuente del acceso de Midas;
- el aviso de Midas, si no entra.

## Recomendadas (no bloquean)

1. **A21, dato de tarjeta.** Cambiar «Acceso desde España» de Randhartingergasse
   y Hinterstoder a «Sin confirmar: cuenta para residentes del EEE (España
   incluida); esta emisión pide número fiscal austriaco.» (107 caracteres).
   Se puede hacer con el tipo `tarjeta`. La tarjeta seguiría diciendo «Sin
   confirmar», pero la ficha completa sería más precisa. Hoy no hay nada
   falso, y el aviso nuevo ya lo explica.
2. **Arreglos del motor.**
   - Que permita quitar una dirección de `documentacion.fuentes`: así salen el
     404 de mTBILL y la ficha GECO c124199 de Smart Cash.
   - Que permita un cambio de `tarjeta` que solo cambie la fecha o la nota
     (A3).
3. **GreenPoint y Cohotel.** Siguen enseñando «Distribuciones esperadas desde ·
   22/10/2026: 15/02/2024». No está en la lista A18, pero habla de repartos en
   una ficha de reventa. Quitarlo en el próximo ciclo.
4. **Brickwise.** «Mínimo de inversión · consulta 01/11/2026:
   Mindestzeichnungsbetrag: EUR 10x,xx», el mínimo de la emisión, se ve junto
   al mínimo de reventa. Puede confundir. Próximo ciclo.
5. **Mínimos en lote** (Cohotel, Plüddemanngasse, Sonnleithnergasse,
   Hinterstoder, Randhartingergasse). La venta más barata está en órdenes de
   varias participaciones; por ejemplo, Cohotel tiene 31 + 4 a 110 €, y la
   orden más pequeña es 1 a 120 €. Ya está decidido que no entra hoy, y la
   ficha avisa de que no consta que se pueda comprar una parte. Próximo ciclo.

## Calidad de la información para el lector

Es buena:
- Las cifras de hoy coinciden con su fuente: Spiko, mTBILL, las 11 de Brickwise
  y Hausera.
- Los textos nuevos están en castellano llano, sin promesas y con fechas
  DD/MM correctas.
- En las fichas de reventa ya no hay rentabilidades.
- Los avisos nuevos (complejidad del KID, empresas que no cotizan, número
  fiscal austriaco) explican riesgos reales en una frase.

Lo que el lector vería mal si se publica tal cual:
- un enlace roto en mTBILL;
- una cita alemana inventada en dos fichas de Brickwise;
- en el radar, que «no hemos podido obtener» las condiciones finales de mTBILL
  que la propia tarjeta de mTBILL ya cita;
- una lista de la OCC con fecha vieja;
- una licencia de Reental que no recoge lo que Reental dice de sí misma.

Todo eso se arregla con O1–O5.
