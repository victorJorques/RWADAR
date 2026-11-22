# Edición de noticias · 22/11/2026 (domingo, ciclo manual) · notas del editor

Editor: un subagente de IA (ciclo manual por la orden de la dirección «Yo no
veo noticias distintas»). Archivos entregados: `editor/noticias-2026-11-22.json`
(5 noticias: **ninguna de «Hoy»** y 5 de «Lo más importante») y
`editor/titulares.json`. Guía de titulares leída entera y atada por su SHA-256
(`ef8916de…`, la misma de ayer).

**En una frase:** entra el token de Anthropic que Kraken ofrece en el EEE
(ANTx, 19/11), que pasa a ser la portada, y sale la autorización de Bit2Me STX
(28/10), la más antigua; las otras cuatro siguen con el mismo texto, y la de
xStocks cambia de foto.

Comprobado por programa antes de entregar:
- `comprobar-fuentes`: «Fuentes de la edición: 5/5 responden».
- `validar --fase editor`: «13 reglas bien» (salida 0), a la primera.
- `revisarEdicion()`: sin errores y sin avisos.

Aviso de transparencia: quien redacta es un modelo de IA de Anthropic. La
noticia de ANTx se eligió con los criterios de EDITOR.md (lo que cambia para
un particular en España), se ciñe a lo que dice la página de Kraken, va en
clave de aviso (no te da acciones) y no valora a la empresa. Conviene que la
dirección lo tenga en cuenta al leerla.

## Qué miré

1. El barrido del programa (`barrido.json`, 00:17:33 a 00:17:43 UTC) y sus
   copias en bruto. No marca ningún elemento nuevo del sector desde el 21/11:
   la CNMV sigue con el aviso del 18/11 como lo último; ESMA, con lo del
   18/11; el BOE no tiene edición hoy (domingo, 404 «sin edición»); Consejo,
   BCE y EBA traen solo cosas fuera del sector; la Comisión no da elementos.
   Las cinco fuentes de la edición publicada responden con HTTP 200.
2. Las 9 candidatas de los analistas (`pistas/candidatas.json`), como datos.
   Abrí yo mismo ocho de sus fuentes (la de la SEC no; ver abajo).
3. Yo mismo, con el `fetch` de Node y petición normal (como el programa),
   entre las 01:29:30 y las 01:34:02 UTC (detalle en
   `inventario-consultas.txt`): las cinco fuentes de la edición publicada que
   quedan, la de Bit2Me STX que sale y las de las candidatas.
   - Los tres PDF de la CNMV y el suplemento de Robinhood dan **la misma
     huella** que el barrido de hoy y que la edición publicada: dicen lo mismo.
   - La nota de xStocks da otra huella en cada carga (la página cambia su
     código), pero su **texto visible es idéntico** en mi copia, en la del
     barrido de hoy y en la del 21/11 por la tarde (lo comparé línea a línea).
   - La página de Kraken también cambia su código en cada carga: mi copia
     (`5b400373…`) y la del programa (`795c55b4…`) tienen huellas distintas y
     **el mismo texto visible**.
4. La ficha de xStocks del catálogo publicado (`kraken-xstocks`: «No son las
   acciones: dependen de la solvencia del emisor. Los vende Kraken UE desde
   Chipre»), para que la noticia nueva no diga nada contrario a ella.

## Hoy (21 y 22/11): ninguna

No hay nada del sector con fuente primaria del 21 ni del 22/11 (fin de
semana), y ninguna candidata es de esos días (son del 17, 19 y 20/11). No se
fuerza ninguna.

## Lo más importante (últimos 30 días, desde el 23/10)

1. **Nueva y portada: Kraken ofrece un token de Anthropic que no te da
   acciones** (página de Kraken de la salida a bolsa de Anthropic con xStocks;
   fuente de la empresa, primaria). URL: `https://www.kraken.com/es/ipo/anthropic`.
   Fecha 19/11/2026: la página dice «Incluida en el listado · Nov 19 · Primer
   día de trading» y «Ya disponible para hacer trading»; el año sale de sus
   metadatos (última publicación 2026-11-19T19:13 UTC) y de su descripción
   («Anthropic ya cotiza en Nasdaq»). Citas literales que la respaldan (texto
   visible en castellano):
   - «Los xStocks de OPV son renta variable tokenizada que ofrece únicamente
     exposición al precio, no propiedad directa.»
   - «Los xStocks son valores tokenizados emitidos por Backed Assets (JE)
     Limited ("BAJL") conforme a un folleto registrado en la UE, que ofrecen
     únicamente exposición al precio, sin derechos de voto ni de dividendos.»
   - «Los xStocks de OPV los ofrece en el EEE Payward Europe Digital Solutions
     (CY) Limited ("PEDSL-CY"), autorizada y regulada por la Comisión de
     Valores y Bolsa de Chipre (CySEC)…» y «Se aplican restricciones
     geográficas.»
   - «Precio de la OPV · $83.00 · Precio final de la oferta por acción»,
     «Exchange · Nasdaq · Ticker: ANT» y, en la tabla, «ANTx · Anthropic ·
     xStocks · Trading disponible».
   - «Tienes acceso al precio de oferta institucional más un spread del 5%,
     aunque pueden aplicarse otras comisiones.» y «El valor de la renta
     variable tokenizada (xStocks) puede bajar o subir después del listado.»
   Por qué entra: es el producto tokenizado nuevo más relevante de la semana
   para un particular en España: lo ofrece en el EEE la firma de Kraken que ya
   está en el catálogo, sobre una salida a bolsa muy seguida, y lo que hay que
   saber es que no te hace accionista. Lo que la fuente solo afirma Kraken (la
   salida a bolsa y su precio) va con «según Kraken». No digo que se pueda
   comprar «desde España»: la página habla del EEE y de restricciones
   geográficas, y así lo pongo. No meto lo de otros emisores (un token de Ondo
   sobre la misma acción) porque no está en esta fuente. El 5 % era para quien
   pidió entrar en la salida a bolsa (el plazo cerró el 18/11), y así se dice
   («se pagaba»). La página es comercial; el texto se queda en el aviso y no
   invita a comprar. Uso la URL con `/es/`: la misma página sin `/es/` me
   sirvió otra variante (la de acciones de EE. UU., sin xStocks), y la de
   `/es/` es la que lleva el texto citado. Sin personas.
2. **Oro y acciones sin folleto: tres avisos llegan de Alemania** (CNMV,
   18/11). PDF `6b1d350e…`, el mismo.
3. **9 firmas sin registro; dos imitan a firmas registradas** (CNMV, 16/11).
   PDF `d80481e5…`, el mismo.
4. **xStocks lanza tokens de más de 200 empresas europeas** (xStocks, 11/11).
   Texto visible idéntico (ver arriba).
5. **Robinhood: el emisor podrá restarte Stock Tokens por costes** (09/11).
   PDF `978eea67…`, el mismo.

Las cuatro que siguen conservan `id`, `fecha`, `fuente.url` y todo su texto;
solo cambia `consultadaEl` (pasa a 2026-11-22, porque su fuente responde y
dice lo mismo) y, en xStocks, la foto (ver «Fotos»).

## Cuál sale y por qué

**Sale «España ya tiene dos mercados de valores tokenizados»** (CNMV,
28/10, Bit2Me STX). El máximo de «Lo más importante» es 5 y la edición ya
tenía 5, así que para que entre ANTx tiene que salir una. Es la más antigua
(25 días; el 28/11 saldría sola por la ventana de 30 días) y la que menos
deja hacer hoy a un particular: se autoriza el mercado, no una emisión, y no
consta ninguna para particulares. Su fuente sigue diciendo lo mismo
(`e09fadd3…`): no sale por error, sino por sitio.

Solo cambio una: con 5 plazas y nada para «Hoy», comparé cada candidata con
la publicada más débil, y solo ANTx le gana. La siguiente en la cola, si se
libera una plaza, sería el aviso alemán del token ficticio por WhatsApp.

## Qué quedó fuera y por qué

- **Robinhood, condiciones finales de tokens ligados a Anthropic** (PDF del
  emisor de Jersey, colgado el 18/11 y fechado el 19/11; abierto,
  `8cebdfa5…`): es el mismo hecho que ANTx y no caben dos noticias del mismo
  estreno. Elegí la de Kraken porque es lo que un particular en España puede
  usar de verdad (plataforma del catálogo, oferta en el EEE por una firma
  autorizada en Chipre); estos tokens de Jersey se ofrecen a través de un
  oferente autorizado que hoy es una sociedad de las Islas Vírgenes
  Británicas, y la emisión solo consta como «prevista».
- **Alemania avisa de un token ficticio que se promociona por WhatsApp**
  (BaFin, 19/11; abierto, `e4c3bb1e…`): aviso real y útil, pero va dirigido a
  inversores en Alemania, no dice nada de España y el token es una cripto, no
  un activo real tokenizado. Para entrar tendría que sacar el aviso de la
  CNMV del 18/11, que también es de Alemania pero lo difunde el supervisor
  español para inversores en España. La página cita el alias de una persona;
  no lo uso.
- **Alemania avisa de webs que suplantan a una empresa real para ofrecer
  cripto** (BaFin, 20/11; abierto, `28733909…`): la lección (comprobar el
  registro antes de enviar dinero) ya la da la noticia de la CNMV del 16/11
  sobre clones, y el aviso no dice nada de España.
- **Circular de la BaFin sobre la custodia de criptoactivos y valores
  tokenizados de los fondos** (19/11; abierto, `ce8a9645…`): es para gestoras
  y depositarios alemanes y no cambia nada para un particular en España.
- **Luxemburgo avisa de una web que se hace pasar por una gestora** (CSSF,
  17/11): con el `fetch` de Node (el mismo del programa) agotó el plazo; con
  curl, al reintentar, dio 200 (`67aa90ec…`). Además de ese riesgo para la
  comprobación del programa, es una sola web, el aviso no dice qué ofrece ni
  a qué países se dirige, y lo de que busque a hispanohablantes sería una
  deducción nuestra.
- **Bélgica avisa de cinco «boiler rooms»** (FSMA, 20/11; abierto,
  `c7aeb16f…`): firmas que actúan en Bélgica, sin relación con España ni con
  activos tokenizados.
- **Ondo lanza dos carteras en forma de token** (blog de Ondo, 17/11;
  abierto, `b5d41dd7…`): la página no dice si se pueden comprar desde España
  ni da comisiones; solo habla de inversores elegibles fuera de EE. UU.
- **La SEC acusa a ocho sociedades de usar asesores y plataformas cripto
  falsos** (19/11): no la abrí porque no la iba a usar: víctimas y demanda de
  EE. UU., no trata de activos tokenizados y, según los analistas, la SEC
  responde 403 a las peticiones automáticas, así que la comprobación del
  programa fallaría.
- **Lo demás del barrido** (BOE, Consejo, BCE, EBA, Comisión): nada del
  sector (ver arriba).

## Titulares

- **ANTx (nuevo)**: tres propuestas por idioma, distintas de verdad:
  1. «Kraken ofrece un token de Anthropic que no te da acciones» (57) /
     «Kraken offers an Anthropic token that gives you no shares» (57).
     **Elegido.**
  2. «Token de Anthropic en Kraken: precio sí, voto y dividendo no» (60) /
     «Anthropic token on Kraken: price yes, votes and dividends no» (60). Dice
     lo mismo de forma más ingeniosa y menos clara.
  3. «Anthropic sale a 83 dólares y Kraken vende un token ligado» (58) /
     «Anthropic lists at $83 and Kraken sells a linked token» (54). Tiene
     cifra, pero no dice qué cambia para el lector, «ligado» es vago y el
     precio solo lo afirma Kraken.
  Por qué el elegido: dice primero lo que cambia (Kraken ya ofrece un token
  que sigue a Anthropic) y la consecuencia que respalda la cita («únicamente
  exposición al precio, no propiedad directa»), con el sujeto exacto
  («ofrece», como «los ofrece en el EEE»). Sin promesas ni consejos. No lleva
  cifra porque la que hay (el precio de salida) no es lo que importa al
  lector; la del 5 % va en «Por qué te importa».
- **Las cuatro que siguen**: el titular es el publicado. Las tres de la CNMV
  y Robinhood llevan `"heredado": "2026-11-20"` (la carpeta de ese día tiene
  su `titulares.json` con esos mismos elegidos) y la de xStocks,
  `"heredado": "2026-11-21"`; copian sus propuestas tal cual.

## Fotos

Todas distintas y con encaje propio; ninguna genérica, así que ningún
«faltaria».

- **ANTx (portada): `acciones-eeuu`** (un escritorio de operaciones de noche
  con dos monitores con gráficos de bolsa genéricos). Es la foto más clara del
  tema «Acciones tokenizadas» y encaja con una acción del Nasdaq. Ayer la
  portada llevaba `alerta-fraude-3`, así que no se repite.
- **xStocks: pasa de `acciones-eeuu` a `bolsa-madrid`** (el horizonte de un
  distrito de negocios al atardecer, genérico, tema «Bolsas y mercados»). Ayer
  llevó `acciones-eeuu` solo porque `bolsa-madrid` la tenía Bit2Me STX; al
  salir esta, un distrito de negocios europeo encaja mejor con empresas de
  Reino Unido y la UE, y el escritorio de operaciones queda para la portada.
- Las demás se quedan como estaban: `alerta-fraude-3` (CNMV, 18/11),
  `pago-online` (CNMV, 16/11) y `acciones-movil` (Robinhood).

Nada de esto es una recomendación.
