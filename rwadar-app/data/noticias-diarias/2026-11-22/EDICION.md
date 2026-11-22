# Edición de noticias · 22/11/2026 (domingo, segundo ciclo manual) · notas del editor

Editor: un subagente de IA, en el segundo ciclo manual del día por las
órdenes de la dirección «Yo no veo noticias distintas» y «Pero noticias
reales y verificadas eh y cúrrate más las fotos anda que sean reales».
Archivos entregados: `editor/noticias-2026-11-22.json` (7 noticias:
**ninguna de «Hoy»** y 7 de «Lo más importante») y `editor/titulares.json`.
Guía de titulares leída entera y atada por su SHA-256 (`728b4c59…`, la de
hoy, con el apartado de fotos reales).

**En una frase:** entran dos noticias nuevas (el aviso alemán del token
ficticio que se promociona por WhatsApp, que pasa a ser la portada, y las
carteras en un solo token de Ondo), no sale ninguna, y seis de las siete
llevan ahora una foto real de la biblioteca en vez de una escena de IA.

Comprobado por programa antes de entregar:
- `comprobar-fuentes`: «Fuentes de la edición: 7/7 responden».
- `validar --fase editor`: «13 reglas bien» (salida 0), a la primera.
- `revisarEdicion()` del modelo, con las claves de `fotos-noticias.json`:
  sin errores y sin avisos.

Aviso de transparencia: quien redacta es un modelo de IA de Anthropic, y la
edición mantiene la noticia del token de Kraken que sigue a la acción de
Anthropic. Esa noticia no se ha tocado (mismo texto que esta mañana), se
ciñe a la página de Kraken, va en clave de aviso (no te da acciones) y no
valora a la empresa. Conviene que la dirección lo tenga en cuenta.

## Qué miré

1. El barrido del programa (`barrido.json`, 07:19:15 a 07:19:22 UTC) y sus
   copias en bruto: 7 fuentes, **ningún elemento nuevo del sector desde hoy**.
   La CNMV sigue con el aviso del 18/11 como lo último; ESMA, con lo del
   18/11 (fuera de lo que importa a un particular); el BOE no tiene edición
   (domingo, 404 «sin edición»); Consejo, BCE y EBA solo traen cosas fuera
   del sector; la Comisión no da elementos. Las cinco fuentes de la edición
   publicada responden con HTTP 200 (`deNoticias`).
2. Las 9 candidatas de los analistas (`pistas/candidatas.json`), como datos,
   con sus matices del verificador escéptico.
3. Yo mismo, entre las 07:22:32 y las 07:26:29 UTC, con la misma petición
   normal que usa el programa (el `fetch` de Node a través de su función
   `pedirFuente`, sin cookies ni nada que eluda un bloqueo; un intento por
   URL). Detalle en `inventario-consultas.txt` (13 consultas):
   - Las cinco fuentes publicadas. Los dos PDF de la CNMV (`6b1d350e…`,
     `d80481e5…`) y el suplemento de Robinhood (`978eea67…`) dan **la misma
     huella** que el barrido y la edición publicada: dicen lo mismo. Las
     páginas de Kraken y de xStocks cambian su código en cada carga (otras
     huellas), pero su **texto visible es idéntico** al de la copia del
     barrido de hoy y al de la copia del programa en `comprobar-fuentes`
     (lo comparé línea a línea).
   - Siete fuentes de candidatas: BaFin (WhatsApp, 19/11), BaFin (webs que
     suplantan a una empresa, 20/11), BaFin (circular 15/2026, 19/11), Ondo
     (17/11), FSMA (20/11), SEC (19/11) y CSSF (17/11).
   - La nota de la CNMV del 28/10 sobre Bit2Me STX (`e09fadd3…`, la misma
     huella que el 20 y el 21/11), para decidir si volvía.
4. Las fotos de la biblioteca (`fotos.json`): leí la descripción de cada
   foto real y miré las tomas de las que podía usar; comprobé que todas las
   que elijo están en `rwadar-site/datos/fotos-noticias.json` con su crédito.

## Hoy (21 y 22/11): ninguna

No hay nada del sector con fuente primaria del 21 ni del 22/11 (fin de
semana): ni en el barrido ni entre las candidatas, que son del 17, 19 y
20/11. No se fuerza ninguna.

## Lo más importante (últimos 30 días, desde el 23/10)

El máximo es ahora 8. Quedan 7, en este orden (el del motor: de la más nueva
a la más antigua; a igual fecha, el orden del archivo):

1. **Nueva y portada: «Token ficticio por WhatsApp: avisa el supervisor
   alemán»** (BaFin, aviso a consumidores del 19/11/2026; fuente del
   regulador, primaria). URL:
   `https://www.bafin.de/SharedDocs/Veroeffentlichungen/DE/Verbrauchermitteilung/unerlaubte/2026/meldung_2026_11_19_sapiovestis_capital_zorvantic_exchange.html`
   (mía `d3e73e42…`; la del programa, `42592be1…`, cambia el código y
   tiene el mismo texto visible). Fecha visible «19.11.2026». Citas
   literales que la respaldan:
   - «Nach Informationen der Finanzaufsicht Bafin wenden sich Unbekannte
     derzeit in WhatsApp-Gruppen und Chats an deutsche Anlegerinnen und
     Anleger. Diese sollen sich auf der Plattform Zorvantic Exchange Inc.
     anmelden, um dort den Krypto-Token „VLVI“ zu erwerben.»
   - «Insbesondere wird der Kauf eines fingierten Krypto-Tokens „VLVI“
     beworben.»
   - «Die Initiatoren der WhatsApp-Gruppen geben sich als US-amerikanische
     Organisation mit dem Namen „Sapiovestis Capital Investment Academy“
     aus.»
   - «… werden nicht von der Bafin beaufsichtigt. Es werden ohne Erlaubnis
     Kryptowerte-Dienstleistungen angeboten.»
   - «Der Bafin sind keine lizenzierten Institute bekannt, welche sich über
     WhatsApp-Gruppen an deutsche Anlegerinnen und Anleger wenden.»
   Por qué entra: es un aviso real y reciente de un supervisor de la UE
   sobre un engaño con un token que llega por grupos de chat, una forma de
   captar que también circula en España; da nombres de la plataforma y del
   token que el lector puede reconocer. Recojo los matices del verificador
   de los analistas: digo «inversores en Alemania», «BaFin no supervisa ni
   a los grupos ni a la plataforma» (no «no están supervisados»), «que dicen
   ser una academia de inversión de EE. UU.», el token «se promociona» (no
   «se vende») y no digo que el engaño «no sea solo alemán». La página cita
   el alias de una persona y un proyecto con su nombre: no los uso. El
   consejo final (comprobar en la CNMV si la entidad está autorizada) es
   prudencia genérica de RWAdar, como en las otras noticias de avisos.
2. **«Kraken ofrece un token de Anthropic que no te da acciones»** (Kraken,
   19/11). Sin cambios de texto; solo `consultadaEl` (ya era de hoy).
3. **«Oro y acciones sin folleto: tres avisos llegan de Alemania»** (CNMV,
   18/11). PDF `6b1d350e…`, el mismo. Cambia la foto (ver «Fotos»).
4. **Nueva: «Ondo: 60 % bolsa, 20 % oro y 20 % cripto en un solo token»**
   (blog oficial de Ondo Finance, 17/11/2026; fuente de la empresa,
   primaria). URL: `https://ondo.finance/blog/first-defined-outcome-intelligent-portfolio`
   (`37fcbb2e…`, la misma huella que la del programa). Fecha visible
   «Announcements • Nov 17, 2026». Citas literales:
   - «The mix is 60% US equities, 20% gold, and 20% crypto, with
     programmatic quarterly rebalancing back to the base weights.»
   - «Provides exposure to the S&P 500, Nasdaq-100, gold, bitcoin, and
     ether through tokenized ETFs, bringing exposure to the biggest names in
     traditional and digital finance in a single token.»
   - «The portfolio is built with 12 tokenized Buffer ETFs in equal
     weights, each designed to capture the upside to a cap of the S&P 500
     while buffering up to 100% of the downside.»
   - «Each ETF seeks to provide its buffer only to shareholders who hold it
     for its full outcome period (before fees and expenses).»
   - «This brings the Ondo Intelligent Portfolio lineup to nine portfolios,
     all available to eligible investors outside the U.S. across Ethereum,
     BNB Chain, and Solana.»
   Por qué entra: es un producto tokenizado nuevo de una plataforma del
   radar y de otro tipo que los de la edición (una cartera entera en un
   token, con cripto dentro), y la noticia va en clave de aviso: son
   productos complejos, el colchón de cada ETF tiene condiciones y la nota
   no dice si se venden en España ni cuánto cuestan. Recojo los matices:
   cada cartera es su propio token («cada una en un token»), el oro y la
   cripto van a través de ETF tokenizados, la condición del colchón se
   atribuye a cada ETF (no al token de la cartera) y no doy la cifra del
   100 % para no agrandar la protección. «No cita España ni cifra costes»:
   la nota solo dice que la lógica de comisiones está en los contratos, sin
   cifras. Ámbito «Mundo»: la oferta es para inversores fuera de EE. UU.
5. **«9 firmas sin registro; dos imitan a firmas registradas»** (CNMV,
   16/11). PDF `d80481e5…`, el mismo. Cambia la foto.
6. **«xStocks lanza tokens de más de 200 empresas europeas»** (xStocks,
   11/11). Texto visible idéntico. Cambia la foto.
7. **«Robinhood: el emisor podrá restarte Stock Tokens por costes»** (FMA /
   Robinhood, 09/11). PDF `978eea67…`, el mismo. Cambia la foto.

Las cinco que siguen conservan `id`, `fecha`, `fuente.url` y todo su texto,
letra a letra; su fuente responde y dice lo mismo, así que `consultadaEl`
es de hoy. Solo cambia `imagen` en cuatro de ellas.

### Por qué la portada es el aviso de WhatsApp

Las dos noticias del 19/11 (WhatsApp y Kraken) tienen la misma fecha, así
que el orden lo decido yo. Pongo primero la nueva: responde a «no veo
noticias distintas», lleva la foto real más clara de su tema (la sede del
supervisor que firma el aviso) y así los dos avisos que vienen de Alemania
no quedan juntos (en medio va Kraken). Kraken sigue en las tres de Inicio.

### No sale ninguna, y por qué no hay octava

Con el máximo en 8 caben las cinco publicadas y dos nuevas sin quitar
ninguna; las cinco siguen siendo de los últimos 30 días y su fuente dice lo
mismo. No completo la octava plaza porque ninguna de las demás candidatas
llega al nivel (ver abajo) y no quiero rellenar.

## Qué quedó fuera y por qué

- **La SEC acusa a ocho sociedades de usar asesores y plataformas cripto
  falsos (19/11)**: con la petición normal del programa, la SEC responde
  **HTTP 403** (`d5d54c17…`, su norma de acceso automático). La comprobación
  del programa (V-12) la pararía, y no se elude ningún bloqueo. Además,
  víctimas y demanda son de EE. UU. y la lección es la misma que la de
  WhatsApp. Si se quisiera, haría falta otra fuente primaria que responda.
- **Luxemburgo avisa de una web que se hace pasar por una gestora (CSSF,
  17/11)**: con la petición del programa **agotó el plazo** (sin respuesta);
  el programa no podría abrirla. Además es una sola web, el aviso no dice
  qué ofrece ni a qué países se dirige, y lo de que busque a
  hispanohablantes sería una deducción nuestra.
- **Alemania avisa de webs que usan el nombre de una empresa real para
  ofrecer cripto (BaFin, 20/11; abierto, `1539724f…`)**: aviso real, pero
  la lección (comprobar el registro antes de enviar dinero) ya la da la
  noticia de la CNMV del 16/11 sobre clones; por su fecha (20/11) pasaría a
  ser la portada siendo un aviso menor sin relación con España, y
  pondría dos avisos de BaFin arriba.
- **Bélgica avisa de cinco «boiler rooms» (FSMA, 20/11; abierto,
  `c7aeb16f…`)**: firmas que actúan en Bélgica, sin relación con España ni
  con tokens; los consejos son el texto fijo de sus avisos. También pasaría
  a ser la portada por su fecha.
- **Circular 15/2026 de BaFin sobre la custodia de criptoactivos y valores
  tokenizados de los fondos (19/11; abierto, `b572211c…`)**: va dirigida a
  gestoras y depositarios alemanes; no cambia nada concreto para un
  particular en España.
- **Robinhood, condiciones finales de tokens de Jersey ligados a Anthropic
  (18-19/11)**: es el mismo estreno que la noticia de Kraken, y con el
  suplemento de Robinhood ya en la edición serían tres noticias casi del
  mismo tema; el único oferente que consta es una sociedad de las Islas
  Vírgenes Británicas. No la abrí porque no la iba a usar.
- **Kraken ANTx**: ya publicada (sigue).
- **Bit2Me STX (CNMV, 28/10), que salió esta mañana por falta de sitio**:
  pensé en devolverla ahora que caben 8. No vuelve: no es una noticia
  «distinta» para quien ya la vio hasta esta mañana, y su «España ya tiene
  dos mercados» (con Securitize) no está en la nota de la CNMV, que solo
  habla de Bit2Me STX; habría que reescribirla y volver a respaldarla.
- **Lo demás del barrido** (BOE, Consejo, BCE, EBA, Comisión): nada del
  sector.

## Titulares

- **WhatsApp (nuevo)**, tres propuestas por idioma:
  1. «Token ficticio por WhatsApp: avisa el supervisor alemán» (55) /
     «Fictitious token via WhatsApp: German supervisor warns» (54).
     **Elegido.**
  2. «Alemania avisa de un token ficticio en grupos de WhatsApp» (57) /
     «Germany warns of a fake token promoted in WhatsApp groups» (57). Pone
     primero el organismo y no lo que se encuentra el lector; además
     «Alemania» no es exactamente quien avisa (es su supervisor).
  3. «Grupos de WhatsApp que llevan a comprar un token ficticio» (57) /
     «WhatsApp groups that steer investors to a fictitious token» (58). Sin
     verbo principal ni quién lo dice: el «ficticio» queda sin atribuir.
  Por qué el elegido: lo primero es lo que puede llegarle al lector (un
  token ficticio por WhatsApp) y el sujeto es exacto (el supervisor alemán,
  sin la sigla BaFin, que no es conocida). Sin cifra porque la fuente no da
  ninguna. Sin promesas ni consejos.
- **Ondo (nuevo)**, tres propuestas por idioma:
  1. «Ondo: 60 % bolsa, 20 % oro y 20 % cripto en un solo token» (57) /
     «Ondo: 60% stocks, 20% gold and 20% crypto in one token» (54).
     **Elegido.**
  2. «Ondo mete bolsa, oro y cripto en un solo token» (46) / «Ondo packs
     stocks, gold and crypto into a single token» (54). Dice lo mismo sin
     las cifras que da la fuente.
  3. «Carteras en un token de Ondo: no consta si llegan a España» (58) /
     «Ondo portfolios in one token: no word on Spain» (46). Pone delante lo
     que falta y no qué es el producto.
  Por qué el elegido: las cifras salen tal cual de la fuente («60% US
  equities, 20% gold, and 20% crypto») y explican en una línea por qué es
  un producto que mezcla riesgos; lo de España va en «Por qué te importa».
- **Kraken**: es el titular publicado y elegido esta mañana; copio sus tres
  propuestas de entonces (sin «heredado», porque la carpeta de hoy se
  sustituye con esta).
- **Las cuatro que siguen**: el titular es el publicado. Las dos de la CNMV
  y la de Robinhood llevan `"heredado": "2026-11-20"` y la de xStocks,
  `"heredado": "2026-11-21"` (esas carpetas tienen esos mismos elegidos; el
  programa lo comprueba).

## Fotos

Seis de siete son fotos reales de Wikimedia Commons (`"origen": "foto"`;
`fotos.realesEnApp` es `true`), todas distintas, todas con encaje propio y
ninguna genérica. Ninguna se presenta como foto del hecho: ni el titular ni
el resumen hablan de la imagen.

- **WhatsApp (portada): `real-sede-bafin-francfort`** («La sede de BaFin,
  el supervisor financiero de Alemania, en Fráncfort»). Es la sede del
  supervisor que firma el aviso.
- **Kraken: `acciones-eeuu`** (escena de IA, la de esta mañana). Es la
  única que no es real, a propósito: la acción de Anthropic cotiza en el
  **Nasdaq**, y las fotos reales del tema son la fachada de la **Bolsa de
  Nueva York** (otra bolsa: daría a entender que cotiza allí) y una pantalla
  de la **Bolsa de Taiwán** (tampoco). La guía pide que la foto no diga
  algo distinto de la noticia, así que queda la escena genérica de un
  escritorio de operaciones. Para otro día haría falta una foto real
  del edificio o la fachada del Nasdaq en Nueva York, sin personas.
- **CNMV 18/11: `real-cnmv-entrada-edison`** (el edificio Edison, sede de la
  CNMV, con su rótulo). Quien difunde los tres avisos es la CNMV. La sede
  de BaFin también encajaba, pero la lleva el aviso propio de BaFin.
- **Ondo: `real-pantalla-cotizaciones-grafico`** (una pantalla de
  cotizaciones con la línea del índice y tablas de precios). Ilustra
  carteras de ETF que siguen índices; la noticia no habla de ninguna bolsa
  concreta, así que la de la foto (Taiwán) no contradice nada. Mejor que la
  del oro (solo es un 20 %) o las escenas del móvil con una línea que sube.
- **CNMV 16/11: `real-cnmv-sede-madrid`** (la sede de la CNMV con su rótulo
  y las banderas de España y de la UE). Aviso de la CNMV sobre firmas sin
  registro en España.
- **xStocks: `real-bolsa-francfort-toro-oso`** (el toro y el oso ante la
  Bolsa de Fráncfort). La noticia trata de acciones europeas tokenizadas,
  entre ellas las 40 del índice alemán DAX, que cotizan en esa bolsa.
- **Robinhood: `real-bolsa-nueva-york-fachada`** (la fachada de la Bolsa de
  Nueva York). Los tokens van ligados a acciones y ETF de EE. UU. en
  general, sin una bolsa concreta, así que aquí sí encaja.

Fotos de IA que dejan de usarse: `alerta-fraude-3`, `pago-online`,
`bolsa-madrid` y `acciones-movil`. Ninguna foto se repite y ninguna lleva
el rojo de alarma en una noticia que no sea de riesgo.

Nada de esto es una recomendación.
