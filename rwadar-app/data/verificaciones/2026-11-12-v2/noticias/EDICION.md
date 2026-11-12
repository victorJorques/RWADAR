# Edición de noticias · Inicio · 12/11/2026

Analista y redactor jefe: Claude, 12/11/2026 (madrugada). Archivo:
`noticias-2026-11-12.json` (6 noticias: 1 de «Hoy» y 5 de «Lo más
importante», de los últimos 30 días, desde el 13/10/2026). Misma forma que
`2026-11-11-v2/noticias/noticias-2026-11-11.json`: mismas claves y en el mismo
orden (comprobado por programa), `imagen` de
`rwadar-editorial-source/noticias/fotos.json`, y `titulo` de 60 caracteres
como mucho en los dos idiomas.

Comprobado en local (sin publicar nada):
- `validarNoticias()` de `rwadar-movil/lib/noticias-sector.js` lo acepta (6).
- Las 6 claves de `imagen` existen en `fotos.json`.
- Sin nombres de personas físicas (castellano ni inglés).

Criterios, por orden: 1) que afecte a lo que un particular en España puede
comprar o a su protección; 2) que venga del regulador o del emisor; 3) que
mueva el sector de forma medible; 4) que sea reciente. Fuera: rumores,
opiniones, precios de criptomonedas, notas sin fuente primaria y autobombo.

**Hora de la consulta (importante).** Barrido y fuentes entre las 00:32 y las
00:35 UTC del 12/11 (01:32–01:35 en Madrid). A esa hora el día 12 no ha
empezado para ningún regulador: «Hoy» solo puede traer hechos del 11/11. Si
se publica por la tarde, conviene repetir el barrido de la CNMV (notas de
prensa y ERIR) y de ESMA antes de publicar.

## Hoy (11 y 12/11): una

1. **La CNMV difunde advertencias de supervisores europeos sobre 11 entidades
   no registradas (11/11, 13:00).** Es el único hecho del 11 o el 12/11 con
   fuente primaria que cumple los criterios (ver el barrido).
   - PDF: «ADVERTENCIA DE ENTIDADES NO REGISTRADAS EN SUPERVISORES
     INTERNACIONALES · 11 de noviembre de 2026». Una página.
   - Once entidades, contadas en el PDF: seis de la FMA de Austria (Stig
     International Trading & Gemstone FZCO, Coinmindz, Vantex Bank, Bull
     Trade24 Ltd, Alliston-Westbury, Velmato Edge), cuatro de la AFM de
     Países Bajos (DirectValue, True Ability, Metacasp, Lion Capital) y una
     de BaFin de Alemania (Nexura VG).
   - Literal de la observación de BaFin: «BAFIN prohibió a Nexura VG ofrecer
     al público valores en forma de acciones de GoldRock Industries Ltd por
     no haber publicado el folleto informativo o documento equivalente
     requerido por la normativa de valores».
   - Literal del cierre: «la web de la CNMV ofrece un buscador de entidades
     advertidas». En eso se apoya el «por qué importa».
   - Por qué entra: protección del inversor, fuente del regulador, y el caso
     de BaFin (ofrecer valores sin folleto) es justo la señal de alarma que
     un lector de RWAdar debe saber ver en una emisión tokenizada.
   - Titular: «Otras 11 firmas sin registro: avisos de tres países de la
     UE» (60). «Tres países», no «la UE»: los avisos son de supervisores
     nacionales, no de una institución europea. `ambito` = «UE».
   - No digo «chiringuito» ni «clon»: el PDF no usa esas palabras para estas.

No meto más en «Hoy» por relleno. Ninguna otra fuente primaria trae nada del
sector del 11/11 (ver el barrido).

## Lo más importante (últimos 30 días)

Las cinco vienen del 11/11, con la fuente vuelta a abrir hoy: misma huella
SHA-256 en todos los PDF y en la página ERIR. Texto sin cambios; solo
`consultadaEl` pasa a 2026-11-12.

2. **Suplemento del folleto de los Stock Tokens de Robinhood Assets (Jersey)
   (09/11).** Lo más cercano a lo que se compra desde España. PDF con la
   misma huella (`978eea67…`); sigue «which may include proportionately
   reducing the number of Products held by…». La página española
   (robinhood.com/eu/es/invest/) sigue diciendo «Explora más de 2.000 Classic
   Stock Tokens…», en lo que se apoya el «por qué importa». El registro de
   folletos de ESMA no trae documentos nuevos de Robinhood desde el 11/11.
3. **Pagarés de Prosegur Cash en registro DLT (06/11).** La única emisión
   tokenizada nueva de una empresa española inscrita en la CNMV en la
   ventana. ERIR de Minos con la misma huella (`6d7eb7cb…`); siguen el
   importe (500.000 euros) y el aviso «no implica que la CNMV haya validado
   las condiciones de la emisión». Sigue sin documento público hallado.
4. **El Consejo quiere subir a 300.000 millones el tope del régimen piloto
   DLT (Coreper, 04/11).** ST 13779/1/26 REV 1 (`757b8851…`) y ST 14900/26
   (`54f5eeef…`) con la misma huella; sigue «EUR 300 billion». La búsqueda
   no encuentra ningún acuerdo con el Parlamento: sigue siendo una posición.
5. **La CNMV autoriza Bit2Me STX (nota del 28/10).** Nota (`e09fadd3…`) y
   lista de ESMA (`8f223820…`, sin cambios desde el 05/11) con la misma
   huella. La prensa sigue situando la primera emisión (bono de Valorix) en
   diciembre, sin fuente primaria: no se pone.
6. **La CNMV propone atender las quejas contra proveedores de criptoactivos y
   plataformas de financiación participativa (15/10).** Nota con la misma
   huella (`289265b2…`). Sigue dentro de los 30 días y el plazo de
   comentarios («hasta el 16 de noviembre») vence el lunes: sigue vivo.

## Qué quedó fuera

- **Advertencia de la CNMV del 10/11 (clones de XTB y PJT).** Era la de «Hoy»
  ayer y sigue siendo válida (PDF con la misma huella, `d6d617a4…`). Sale
  para no tener dos avisos de fraude seguidos con la misma foto: la del 11/11
  ocupa ese hueco y es la más reciente. Si se quiere reponer, el sustituto
  natural sería la de Prosegur (no es comprable por particulares).
- **ETSG (BCE, Comisión y ESMA, 09/11).** Industria mayorista; misma razón
  que ayer. La página sigue: «The deadline for submitting applications is
  27 November 2026». Puede volver el 27/11 si sale la lista de miembros.
- **ESMA, Q&A 2950 (16/10).** Misma razón que ayer: solo para plataformas de
  financiación participativa con cuota de acceso y sin plazo vivo. Página
  vuelta a abrir (`88faf098…`, HTML dinámico).
- **Amundi, clase tokenizada del fondo Core STOXX Europe 600 (05/11).** Ya
  descartada el 10/11: dirigida a «institutional clients and digital
  platforms», sin ISIN, KID ni distribuidor para particulares.
- **Comisión Europea, mesa redonda de expertos sobre tokenización (26/11).**
  Es un evento anunciado, no un hecho; solo hay agenda de terceros.
- **Prensa del 11/11 sin fuente primaria europea para el particular:** la
  SEC y los futuros perpetuos sobre acciones de Kalshi (Ledger Insights,
  11/11 19:50 UTC): EE. UU. y derivados.
- **CNMV, portada, otra información relevante del 11/11** (ACS, Repsol,
  MFE-Mediaforeurope, Banco Santander): cotizadas, no son del sector.
- **BOE del 11/11:** solo un contrato de servicios bancarios de la propia
  CNMV. Nada de valores tokenizados, cripto ni mercado de valores. El del
  12/11 aún no estaba publicado (404 a las 00:32 UTC).
- **BCE:** lo último son dos discursos del 10/11 (ya descartados ayer). Nada
  del 11/11. **EBA:** la última alerta es del 09/11. **ESMA:** la noticia más
  reciente sigue siendo la del ETSG (09/11).

## Barrido de fuentes primarias (12/11, 00:32–00:35 UTC)

Todo con curl y su agente de usuario. Copias en `fuentes/` (los originales) y
`fuentes/barrido/` (HTML, PDF y crudo no van a Git). Hora, HTTP y huella de
cada consulta en `inventario-consultas.txt`.

| Dónde | Qué se miró | Resultado del 11 y 12/11 |
|---|---|---|
| CNMV, notas de prensa (`aldia/notasprensa`) | lista, página 1 | 11/11 13:00, advertencias de supervisores internacionales (noticia 1). Nada del 12/11 |
| CNMV, portada | otra información relevante | solo cotizadas (ACS, Repsol, MFE, Santander) |
| CNMV, ERIR (Minos, Ursus-3, Securitize) | inscripciones TRD | últimas del 06/11 (Minos y Ursus-3) y del 23/10 (Securitize): nada nuevo |
| ESMA, noticias (RSS) | lista | la última sigue siendo la del 09/11 (ETSG) |
| ESMA, lista de infraestructuras DLT | PDF | sin cambios (`8f223820…`) |
| ESMA, registro de folletos (API Solr) | aprobados desde el 11/11 | 11 documentos (BIL, SG Issuer, Morgan Stanley, Quintet, Edmond de Rothschild): ninguno de tokenización |
| BOE (API de datos abiertos) | sumarios del 11 y 12/11 | 11/11: nada del sector; 12/11: aún no publicado |
| BCE (RSS) | 11 y 12/11 | nada nuevo |
| EBA (RSS) | 11 y 12/11 | nada nuevo |
| Ledger Insights (RSS) | pista, no fuente | solo Kalshi y la SEC (EE. UU.) |
| Búsqueda web (WebSearch, modo estándar) | CNMV y tokenización en noviembre; acciones tokenizadas en Europa; régimen piloto DLT y ECOFIN; Amundi; avisos de ESMA sobre acciones tokenizadas; bonos tokenizados en España; Bit2Me STX; Comisión y tokenización; xStocks, Kraken y Robinhood | nada nuevo del 11 o 12/11 con fuente primaria |

No consultados hoy (sí ayer, sin novedades): listado MiCA de la CNMV, Banco de
España (cortaba la conexión), Consejo de la UE, sala de prensa (403).

## Fuentes de las noticias, vueltas a abrir hoy

| Noticia | Fuente | Hora UTC | HTTP | SHA-256 (inicio) | ¿Igual que el 11/11? |
|---|---|---|---|---|---|
| 1 | CNMV, advertencia de supervisores internacionales del 11/11 (PDF) | 00:32:52 | 200 | `e781ed720cec8611` | nueva |
| 2 | Suplemento RHJ del 09/11 (PDF) | 00:32:24 | 200 | `978eea67a47d5bb6` | sí |
| 2 | robinhood.com/eu/es/invest/ | 00:32:24 | 200 | `0d5837243c5afb4e` | HTML dinámico; el texto «Explora más de 2.000 Classic Stock Tokens» sigue |
| 3 | CNMV, ERIR de Minos Securities | 00:32:24 | 200 | `6d7eb7cbca433bc8` | sí |
| 4 | Consejo, ST 13779/1/26 REV 1 (PDF) | 00:32:24 | 200 | `757b8851957af55c` | sí |
| 4 | Consejo, ST 14900/26 (PDF) | 00:32:24 | 200 | `54f5eeefda10ae00` | sí |
| 5 | CNMV, nota del 28/10 (PDF) | 00:32:24 | 200 | `e09fadd373bf3621` | sí |
| 5 | ESMA, lista de infraestructuras DLT (PDF) | 00:32:24 | 200 | `8f223820d3223598` | sí |
| 6 | CNMV, nota del 15/10 (PDF) | 00:32:24 | 200 | `289265b26b53f727` | sí |
| fuera | CNMV, advertencia del 10/11 (PDF) | 00:32:24 | 200 | `d6d617a4766a5c43` | sí |
| fuera | ESMA, noticia ETSG | 00:32:24 | 200 | `1c0a05bd38fdbf7a` | HTML dinámico; el plazo del 27/11 sigue |

Las horas de 00:32:24 son el arranque de la descarga en paralelo (todas
terminaron antes de las 00:32:50).

Nada de esto es una recomendación. Ninguna noticia da precios ni promete
rentabilidad. Falta la verificación independiente (`VERIFICACION.md`), que
no hace quien edita.

**Para publicar** (no hecho aquí: lo decide el coordinador):
1. Copiar el JSON a `rwadar-site/datos/noticias-v2.json`.
2. Ejecutar `node rwadar-app/noticias/noticias-v1.cjs` para el v1 sin
   «imagen» (ojo: escribe `rwadar-site/datos/noticias.json` incluso con
   `--help`).
