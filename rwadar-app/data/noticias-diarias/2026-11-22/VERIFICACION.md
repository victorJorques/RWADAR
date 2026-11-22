# Verificación de las noticias del 22/11/2026 (pase 1)

Verificador independiente: no escribí ni elegí estas noticias. He abierto yo
mismo cada fuente esta mañana y he leído entera cada noticia (titular,
resumen, «por qué te importa» y título informativo, en castellano y en
inglés) contra lo que dice la fuente.

- Edición verificada: `editor/noticias-2026-11-22.json`
- Su huella (SHA-256): `54c5ac8a05aa7b35837b2b1a58a853445f48d4113892fa976799a683ae0c1cec`
- Guía de titulares leída: `GUIA-TITULARES.md`, huella `728b4c59aa61ee47b0e3eaabc1a30e826866c9859f3c40e4777a675b4a57de6f` (la misma que cita `titulares.json`).

**Veredicto: conforme.** Las 7 noticias se confirman y no hace falta
ninguna corrección.

## Resumen

| # | Noticia | Fecha | Foto | Veredicto |
| --- | --- | --- | --- | --- |
| 1 | Token ficticio por WhatsApp: avisa el supervisor alemán (55 / 54 caracteres) | 19/11 | `real-sede-bafin-francfort` (foto real) | confirmada |
| 2 | Kraken ofrece un token de Anthropic que no te da acciones (57 / 57) | 19/11 | `acciones-eeuu` (escena de IA) | confirmada |
| 3 | Oro y acciones sin folleto: tres avisos llegan de Alemania (58 / 55) | 18/11 | `real-cnmv-entrada-edison` (foto real) | confirmada |
| 4 | Ondo: 60 % bolsa, 20 % oro y 20 % cripto en un solo token (57 / 54) | 17/11 | `real-pantalla-cotizaciones-grafico` (foto real) | confirmada |
| 5 | 9 firmas sin registro; dos imitan a firmas registradas (54 / 49) | 16/11 | `real-cnmv-sede-madrid` (foto real) | confirmada |
| 6 | xStocks lanza tokens de más de 200 empresas europeas (52 / 54) | 11/11 | `real-bolsa-francfort-toro-oso` (foto real) | confirmada |
| 7 | Robinhood: el emisor podrá restarte Stock Tokens por costes (59 / 57) | 09/11 | `real-bolsa-nueva-york-fachada` (foto real) | confirmada |

Lo que he comprobado en toda la edición:

- **Titulares**: todos de 60 caracteres o menos en las dos lenguas, sin punto
  final, sin «¡» ni «!» y sin palabras de promesa o exageración.
- **Sin personas**: he leído cada texto y no hay nombres de personas,
  tratamientos, correos ni teléfonos. El aviso alemán (noticia 1) y la nota de
  xStocks (6) sí nombran a una persona cada uno, y la edición no las nombra.
  Las citas de abajo tampoco.
- **Fotos**: las 7 son distintas. Las fotos reales (`fotos.realesEnApp` está
  en `true` en el config.json) tienen en `rwadar-site/datos/fotos-noticias.json`
  el mismo autor, la misma licencia y la misma página de Commons que en
  `fotos.json`. Ningún texto presenta la foto como foto del hecho.
- **Fechas**: cada una es la del documento de la fuente. No hay ninguna
  noticia en «Hoy» y ninguna fuente es de hoy ni de ayer, así que es lo
  correcto.
- **Lo que falta**: el barrido de esta mañana no trae nada nuevo de hoy ni de
  ayer (todas las fuentes tienen «nuevos» vacío; el BOE no tiene edición el
  domingo). No falta nada más importante.
- **Respecto a lo publicado ahora**: entran dos noticias nuevas (1 y 4). Las
  otras cinco tienen el mismo texto que lo publicado; solo cambian las fotos
  de cuatro, que pasan de escenas de IA a fotos reales del tema.

## Noticia por noticia

### 1 · Token ficticio por WhatsApp: avisa el supervisor alemán — confirmada

- Fuente: https://www.bafin.de/SharedDocs/Veroeffentlichungen/DE/Verbrauchermitteilung/unerlaubte/2026/meldung_2026_11_19_sapiovestis_capital_zorvantic_exchange.html
- Abierta el 2026-11-22T07:34:52.881Z (UTC), HTTP 200, SHA-256 `42592be161da2a1d95b4a686f6d84bdad7fe6899c917d6e28d67bfa617d6698e`.
  La página es dinámica: tiene el mismo tamaño que la que abrió el programa
  (87.197 bytes) pero otra huella, y el texto del aviso es el mismo.
- Cita: «Insbesondere wird der Kauf eines fingierten Krypto-Tokens „VLVI“ beworben. Die Bafin hat in der Vergangenheit bereits mehrfach vor dieser Masche gewarnt. Der Bafin sind keine lizenzierten Institute bekannt, welche sich über WhatsApp-Gruppen an deutsche Anlegerinnen und Anleger wenden.»
- La fuente dice lo mismo que la noticia: unos desconocidos que se presentan
  como una organización de EE. UU. escriben en grupos y chats de WhatsApp a
  inversores en Alemania para que compren VLVI («fingiert», ficticio) en la
  plataforma Zorvantic Exchange; BaFin no supervisa ni a quienes organizan los
  grupos ni a la plataforma, se ofrecen servicios cripto sin permiso y no
  conoce entidades con licencia que contacten así. Fecha del aviso:
  19.11.2026. El consejo de comprobar en la CNMV es prudencia genérica.
- Foto: la sede de BaFin para un aviso de BaFin. Encaja.

### 2 · Kraken ofrece un token de Anthropic que no te da acciones — confirmada

- Fuente: https://www.kraken.com/es/ipo/anthropic
- Abierta el 2026-11-22T07:34:54.050Z (UTC), HTTP 200, SHA-256 `c8e8ffa4e8771acbf195e5bce79258b2983e8356a2d41185004fd3f8e90198b6`
  (página dinámica; el texto es el mismo).
- Cita: «Anthropic listed on Nasdaq on Nov 19. Trade ANTx 24/5 alongside 1,000+ xStocks. […] IPO xStocks are tokenized equities providing price exposure only — not direct ownership.»
- También consta en la página: precio de oferta de 83,00 dólares, emisor
  Backed Assets (JE) Limited, sin derechos de voto ni dividendos, en el EEE lo
  ofrece una firma del grupo autorizada por el supervisor de Chipre, con
  restricciones geográficas, y el precio de oferta más un 5 % («other fees may
  apply»). Texto igual al publicado.
- Foto: escena de IA de acciones. Las fotos reales de bolsa que quedan libres
  en la edición (la Bolsa de Madrid) engañarían para una salida a bolsa en el
  Nasdaq, así que la escena de IA es la elección correcta.

### 3 · Oro y acciones sin folleto: tres avisos llegan de Alemania — confirmada

- Fuente: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bb0c4a848-4bd7-40b7-9b28-8f013ad97bc4%7d
- Abierta el 2026-11-22T07:34:54.452Z (UTC), HTTP 200, SHA-256 `6b1d350e69c262faab5ab9ca1a14c88ce273f668b85909a1bac907da5f148820`
  (la misma huella que en el inventario y el barrido).
- Cita: «BAFIN ha prohibido a Uniox Gold LLC la oferta al público de oro físico por no haber publicado EL FOLLETO INFORMATIVO O DOCUMENTO EQUIVALENTE REQUERIDO POR LA NORMATIVA DE VALORES.»
- El documento, del 18 de noviembre de 2026, trae tres avisos de BaFin: una
  suspensión de una oferta de acciones, la prohibición de la oferta de oro y
  los indicios de una tercera oferta sin folleto. Menciona el buscador de
  entidades advertidas de la CNMV. Texto igual al publicado.
- Foto: la sede de la CNMV. Es la CNMV quien publica el documento y el resumen
  deja claro que las medidas son de BaFin. La foto de BaFin ya la lleva la
  noticia 1.

### 4 · Ondo: 60 % bolsa, 20 % oro y 20 % cripto en un solo token — confirmada

- Fuente: https://ondo.finance/blog/first-defined-outcome-intelligent-portfolio
- Abierta el 2026-11-22T07:34:56.037Z (UTC), HTTP 200, SHA-256 `d4502cc7e3fc3c085c87ebff260d15846e40094f876b37af474d4585f4f0cb4e`
  (página dinámica; el texto es el mismo).
- Cita: «The mix is 60% US equities, 20% gold, and 20% crypto, with programmatic quarterly rebalancing back to the base weights.»
- Fecha de la entrada: 17 de noviembre de 2026 («Nov 17, 2026» y
  `datePublished` 2026-11-17). La fuente respalda el resto: el reparto de
  BIG5on hecho con ETF tokenizados (bitcoin y ether son el 15 % y el 5 %),
  el reajuste cada trimestre, los 12 ETF de SPYSHIELDon con colchón y tope, y
  que el colchón de cada ETF solo vale para quien lo tiene todo su periodo.
  He buscado en la página entera: España no aparece y no hay ninguna cifra de
  costes, y habla de «eligible investors outside the U.S.». «Son productos
  complejos» es una advertencia de prudencia que se explica justo después con
  datos de la fuente.
- Foto: una pantalla de cotizaciones (de la Bolsa de Taiwán, según la
  biblioteca). Es del tema de acciones tokenizadas y no se presenta como foto
  del hecho. Encaja, aunque solo de forma genérica.

### 5 · 9 firmas sin registro; dos imitan a firmas registradas — confirmada

- Fuente: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bf3fcb37a-091d-4f8b-b217-60ba8b126e7e%7d
- Abierta el 2026-11-22T07:34:56.465Z (UTC), HTTP 200, SHA-256 `d80481e506caff1bf39324084e323d5f9c79a271ff902ad92ae42d8600bbd355`
  (la misma huella que en el inventario y el barrido).
- Cita: «La CNMV pone de manifiesto que dichas sociedades no figuran inscritas en el correspondiente registro de esta Comisión y, por tanto, no están autorizadas para prestar servicios de inversión u otras actividades sujetas a la supervisión de la CNMV.»
- He contado 9 entidades, del 16 de noviembre de 2026. Dos están marcadas
  como clon, una de una empresa de asesoramiento financiero y otra de una
  sociedad de capital riesgo, las dos registradas en España. Texto igual al
  publicado.
- Foto: la sede de la CNMV para un aviso de la CNMV. Encaja.

### 6 · xStocks lanza tokens de más de 200 empresas europeas — confirmada

- Fuente: https://xstocks.com/us/news/xstocks-brings-200-of-the-uk-and-eus-largest-companies-onchain
- Abierta el 2026-11-22T07:34:57.781Z (UTC), HTTP 200, SHA-256 `ba6657a630cebe0c704fb92662863a1256cfd285cb42f5adb76a9380736697c4`
  (página dinámica, con el mismo tamaño de 51.355 bytes; el texto es el mismo).
- Cita: «xStocks has launched its first regional markets, bringing tokenized equities for 200+ of the largest UK and EU-listed companies, and every constituent of the DAX 40.»
- Fecha de la nota: 11 de noviembre de 2026. La nota respalda también que
  hay respaldo 1:1, que solo da exposición económica y no la propiedad, que
  se venden en Kraken y en plataformas socias, que en la UE los ofrece una
  firma autorizada en Chipre y que «xStocks are not, nor will they be
  registered with any local securities regulators». Texto igual al publicado.
- Foto: el toro y el oso ante la Bolsa de Fráncfort, para una noticia con
  las 40 del DAX. Encaja bien.

### 7 · Robinhood: el emisor podrá restarte Stock Tokens por costes — confirmada

- Fuente: https://cdn.robinhood.com/assets/robinhood/legal/rhj_base_prospectus_supplement_09_november_2026.pdf
- Abierta el 2026-11-22T07:34:57.947Z (UTC), HTTP 200, SHA-256 `978eea67a47d5bb63f184a1efa419118166301ee94806e94f91f3fec710d29b9`
  (la misma huella que en el inventario y el barrido).
- Cita: «(C) the Issuer is permitted to pass on certain fees and costs charged to the Issuer in connection with an Underlying to Investors, which may include proportionately reducing the number of Products held by such Investors;»
- El suplemento lo aprobó la FMA de Liechtenstein el 09/11/2026. Los cambios
  valen para los productos ya emitidos desde esa fecha, los productos son
  «debt securities» y España está en la lista de países notificados. La
  versión consolidada del folleto del 25 de junio, que va adjunta, ya recogía
  que la filial europea de Robinhood sería participante autorizado. Texto
  igual al publicado.
- Foto: la fachada de la Bolsa de Nueva York, para unos tokens ligados a
  acciones y ETF de EE. UU. Encaja.
