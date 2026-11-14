# Edición de noticias · Inicio · 13/11/2026

Analista y redactor jefe: Claude, 13/11/2026 (mañana). Archivo:
`noticias-2026-11-13.json` (5 noticias: **ninguna de «Hoy»** y 5 de «Lo más
importante», de los últimos 30 días, desde el 14/10/2026). Misma forma que
`2026-11-12-v2/noticias/noticias-2026-11-12.json`: mismas claves y en el mismo
orden (comprobado por programa, también en `en`), `imagen` de
`rwadar-editorial-source/noticias/fotos.json`, y `titulo` de 60 caracteres
como mucho en los dos idiomas (el más largo, 60).

Comprobado en local (sin publicar nada):
- `validarNoticias()` de `rwadar-movil/lib/noticias-sector.js` lo acepta (5).
- Las 5 claves de `imagen` existen en `fotos.json`: `alerta-fraude`,
  `acciones-eeuu`, `instituciones-ue`, `bolsa-madrid`, `regulador-espana`
  (cinco fotos distintas).
- Sin nombres de personas físicas (castellano ni inglés): el texto es el ya
  verificado el 12/11, sin nombres.

Criterios, por orden: 1) que afecte a lo que un particular en España puede
comprar o a su protección; 2) que venga del regulador o del emisor; 3) que
mueva el sector de forma medible; 4) que sea reciente. Fuera: rumores,
opiniones, precios de criptomonedas, notas sin fuente primaria y autobombo.

**Hora de la consulta (importante).** Barrido y fuentes desde las 08:29:50
UTC del 13/11 (09:29 en Madrid); búsquedas y comprobaciones hasta las 08:40
UTC aprox. A esa hora la CNMV aún no ha publicado lo del día 13 (sus avisos
en la lista reciente salen entre las 11:35 y las 14:00, hora de Madrid). **Si se publica por la
tarde, conviene repetir antes el barrido de las notas de prensa de la CNMV y
de ESMA**: si hay una advertencia nueva del 13/11, sería la candidata natural
a «Hoy».

## Hoy (12 y 13/11): ninguna

No hay ningún hecho del 12 o el 13/11 con fuente primaria que cumpla los
criterios (ver el barrido y «Qué quedó fuera»). No se fuerza. Lo más cercano:
- La CNMV no publicó ninguna nota de prensa el 12/11: la lista sigue
  empezando por «11/11/2026 13:00 Advertencias de entidades no registradas en
  supervisores internacionales» (misma huella que ayer, `d733d993…`).
- ESMA no publica nada desde el 09/11 (ETSG).
- Lo que sí hubo el 12/11 (prensa del sector) no tiene fuente primaria o no
  afecta al particular en España (ver abajo).

## Lo más importante (últimos 30 días)

Las cinco vienen de ayer, con la fuente vuelta a abrir hoy: **misma huella
SHA-256 en todos los PDF y en la ERIR de Minos**. Texto sin cambios salvo lo
indicado en la n.º 1; `consultadaEl` pasa a 2026-11-13.

1. **La CNMV difunde advertencias de supervisores europeos sobre 11 entidades
   no registradas (11/11).** Ayer era «Hoy»; hoy pasa a «importante» (sigue
   siendo protección del inversor y lo más reciente del regulador). PDF con la
   misma huella (`e781ed72…`); sigue «la web de la CNMV ofrece un buscador de
   entidades advertidas».
   - Único cambio de texto: el titular pierde «Otras», que remitía al aviso
     del 10/11 (que no está en esta edición). Ahora: «11 firmas sin registro:
     avisos de tres países de la UE» (54) · «11 unregistered firms flagged in
     three EU countries» (51). Mismos datos, misma fuente.
     `tituloInformativo`, `resumen` y `porQueImporta` (los corregidos en la
     verificación del 12/11) no cambian.
2. **Suplemento del folleto de los Stock Tokens de Robinhood Assets (Jersey)
   (09/11).** Lo más cercano a lo que se compra desde España. PDF con la
   misma huella (`978eea67…`); sigue «proportionately reducing» (3 veces). La
   página española (robinhood.com/eu/es/invest/, HTML dinámico, huella nueva
   `8a68dc0f…`) sigue diciendo «Explora más de 2.000 Classic Stock Tokens…».
   El registro de folletos de ESMA no trae documentos nuevos de Robinhood
   desde el 12/11.
3. **El Consejo quiere subir a 300.000 millones el tope del régimen piloto
   DLT (Coreper, 04/11).** ST 13779/1/26 REV 1 (`757b8851…`) y ST 14900/26
   (`54f5eeef…`) con la misma huella; sigue «EUR 300 billion». Las notas de
   prensa del Consejo (RSS del 13/11) y la búsqueda no traen ningún acuerdo
   con el Parlamento: sigue siendo una posición.
4. **La CNMV autoriza Bit2Me STX (nota del 28/10).** Nota (`e09fadd3…`) y
   lista de ESMA (`8f223820…`) con la misma huella. La prensa sigue situando
   la primera emisión (bono de Valorix) en diciembre, sin fuente primaria: no
   se pone, y sigue siendo cierto que no consta ninguna emisión con documento
   público para particulares.
5. **La CNMV propone atender las quejas contra proveedores de criptoactivos y
   plataformas de financiación participativa (15/10).** Nota con la misma
   huella (`289265b2…`); sigue «hasta el 16 de noviembre». Dentro de los 30
   días y con el plazo vivo hasta el lunes 16/11. **Ojo:** a partir del 17/11
   el «Comentarios hasta el 16/11» queda vencido; la próxima edición debe
   sacarla o reescribir el resumen.

## Qué quedó fuera

- **Pagarés de Prosegur Cash en registro DLT (06/11).** Estaba ayer y sigue
  siendo cierta (ERIR con la misma huella, `6d7eb7cb…`; siguen los 500.000
  euros y el aviso de la CNMV). Sale porque, sin «Hoy», las seis de ayer
  pasaban a «importante» y el máximo es 5: es la que menos afecta al lector
  (no consta documento público ni venta a particulares), es decir, la que
  peor cumple el criterio 1. Es la sustituta natural si se repone una.
- **Advertencia de la CNMV del 10/11 (clones de XTB y PJT).** Sigue válida
  (PDF con la misma huella, `d6d617a4…`). Fuera por la misma razón que ayer:
  no repetir dos avisos de fraude con la misma foto; la del 11/11 es la más
  reciente.
- **Gemini vende sus negocios del Reino Unido y Europa a KAST (CoinDesk,
  12/11).** Solo cita a «una persona conocedora»; Gemini no comenta; sin nota
  de prensa ni documento del emisor. Además, Gemini ya anunció en febrero el
  cierre de esos negocios. Sin fuente primaria: fuera.
- **Banco Nacional Checo, pruebas de emisión de bonos en DLT (Ledger
  Insights, 12-13/11).** Prueba de banco central con un banco comercial; no
  es para particulares y el artículo no enlaza fuente primaria.
- **OKX e ICE, mercado de valores tokenizados desde el 23/11 (Ledger
  Insights, 11/11).** Solo para «eligible US customers», bajo la exención de
  la SEC: EE. UU.
- **DTCC añade Solana a su servicio de tokenización para 2027 (12/11),
  custodia de activos digitales de Deutsche Bank, Clearstream:** industria
  mayorista o EE. UU.; no cambian nada para el particular en España.
- **Registro MiCA de ESMA (CSV, actualizado el 10-13/11):** el único cambio
  español reciente es ABANCA (autorizada por la CNMV el 06/11, como
  custodia y transmisión de órdenes de criptoactivos), ya descartada el
  10/11 y el 11/11: cripto, no activos reales tokenizados.
- **BOE del 12/11:** una resolución de la CNMV de 29/10 con la sanción por
  una infracción grave impuesta a una persona física. No es del sector y no
  damos nombres. **BOE del 13/11:** nada del sector.
- **ETSG (BCE, Comisión y ESMA, 09/11).** Misma razón que ayer (industria
  mayorista). La página sigue: «The deadline for submitting applications is
  27 November 2026».
- **Amundi, clase tokenizada del fondo Core STOXX Europe 600 (05/11).**
  Descartada desde el 10/11: dirigida a «institutional clients and digital
  platforms», sin ISIN, KID ni distribuidor para particulares.
- **BCE:** el 13/11 solo un discurso («Made in Europe», 08:20 CET): opinión,
  fuera. **Comisión (FISMA):** el 11 y el 12/11, competitividad bancaria y
  auditoría de sostenibilidad: nada del sector. **EBA:** la última alerta
  sigue siendo del 09/11.

## Barrido de fuentes primarias (13/11, desde las 08:29:50 UTC)

Todo con curl y su agente de usuario. Copias en `fuentes/` (los originales) y
`fuentes/barrido/` (HTML, PDF y crudo no van a Git). Hora, HTTP y huella de
cada consulta en `inventario-consultas.txt`.

| Dónde | Qué se miró | Resultado del 12 y 13/11 |
|---|---|---|
| CNMV, notas de prensa (`aldia/notasprensa`) | lista, página 1 | nada nuevo: misma página que ayer (`d733d993…`); la última es del 11/11 13:00 |
| CNMV, ERIR (lista, Minos, Ursus-3, Securitize) | inscripciones TRD | mismas huellas que ayer: nada nuevo |
| ESMA, noticias (web y RSS) | lista | la última sigue siendo la del 09/11 (ETSG); RSS con la misma huella |
| ESMA, lista de infraestructuras DLT | PDF | sin cambios (`8f223820…`) |
| ESMA, registro de folletos (API Solr) | aprobados desde el 12/11, sin condiciones finales | 14 documentos (DNB, Emirates NBD, LEG, Allianz, Danske, EDP, BMW, Alfa Laval, Gjensidige, Abertis, NAB, BNZ…): ninguno de tokenización. Condiciones finales: las 400 de la muestra son de emisores habituales (Goldman Sachs, Morgan Stanley, Mintos…) |
| ESMA, registro MiCA de proveedores (CSV) | altas y cambios recientes | en España solo ABANCA (06/11), ya vista |
| BOE (API de datos abiertos) | sumarios del 12 y 13/11 | 12/11: una sanción de la CNMV a una persona física; 13/11: nada |
| Consejo de la UE (RSS de notas de prensa) | 12 y 13/11 | nada del régimen piloto ni de mercados de capitales |
| Comisión, FISMA (noticias) | 11 y 12/11 | nada del sector |
| BCE (RSS) | 12 y 13/11 | un discurso del 13/11; nada más |
| EBA (RSS) | 12 y 13/11 | nada nuevo (misma huella) |
| Ledger Insights (portada y RSS) y CoinDesk (RSS) | pistas, no fuentes | Gemini y KAST, Banco Nacional Checo, OKX e ICE, DTCC y Solana, Deutsche Bank: fuera (ver arriba) |
| Búsqueda web (WebSearch, modo estándar) | CNMV y tokenización en noviembre; valores tokenizados en Europa el 12/11; acciones tokenizadas para particulares en la UE; régimen piloto DLT y Parlamento; «12 de noviembre de 2026» y tokenización; fondos y bonos tokenizados el 12/11; Bit2Me STX y Valorix; avisos de ESMA sobre acciones tokenizadas | nada del 12 o el 13/11 con fuente primaria |

El RSS de notas de prensa de la CNMV da 403; se usa la lista web, que abre.

## Fuentes de las noticias, vueltas a abrir hoy

| Noticia | Fuente | Hora UTC | HTTP | SHA-256 (inicio) | ¿Igual que el 12/11? |
|---|---|---|---|---|---|
| 1 | CNMV, advertencia de supervisores internacionales del 11/11 (PDF) | 08:29:50 | 200 | `e781ed720cec8611` | sí |
| 2 | Suplemento RHJ del 09/11 (PDF) | 08:29:50 | 200 | `978eea67a47d5bb6` | sí |
| 2 | robinhood.com/eu/es/invest/ | 08:29:50 | 200 | `8a68dc0f8250d574` | HTML dinámico; el texto «Explora más de 2.000 Classic Stock Tokens» sigue |
| 3 | Consejo, ST 13779/1/26 REV 1 (PDF) | 08:29:50 | 200 | `757b8851957af55c` | sí |
| 3 | Consejo, ST 14900/26 (PDF) | 08:29:50 | 200 | `54f5eeefda10ae00` | sí |
| 4 | CNMV, nota del 28/10 (PDF) | 08:29:50 | 200 | `e09fadd373bf3621` | sí |
| 4 | ESMA, lista de infraestructuras DLT (PDF) | 08:29:50 | 200 | `8f223820d3223598` | sí |
| 5 | CNMV, nota del 15/10 (PDF) | 08:29:50 | 200 | `289265b26b53f727` | sí |
| fuera | CNMV, ERIR de Minos Securities (Prosegur) | 08:29:50 | 200 | `6d7eb7cbca433bc8` | sí |
| fuera | CNMV, advertencia del 10/11 (PDF) | 08:29:50 | 200 | `d6d617a4766a5c43` | sí |
| fuera | ESMA, noticia ETSG | 08:29:50 | 200 | `2bb58dbaaeb8c777` | HTML dinámico; el plazo del 27/11 sigue |

Las horas de 08:29:50 son el arranque de la descarga en paralelo.

Nada de esto es una recomendación. Ninguna noticia da precios ni promete
rentabilidad. Falta la verificación independiente (`VERIFICACION.md`), que
no hace quien edita. Como el texto es el verificado ayer, basta con cotejar
el cambio de sección y de titular de la n.º 1 y las huellas.

**Para publicar** (no hecho aquí: lo decide el coordinador):
1. Repetir el barrido de la CNMV (notas de prensa) y de ESMA si se publica
   por la tarde.
2. Copiar el JSON a `rwadar-site/datos/noticias-v2.json`.
3. Ejecutar `node rwadar-app/noticias/noticias-v1.cjs` para el v1 sin
   «imagen» (ojo: escribe `rwadar-site/datos/noticias.json` incluso con
   `--help`).

## Barrido de la tarde (13/11, 14:10-14:20 UTC)

Repetido solo el barrido de lo nuevo del 12 y 13/11, con curl (agente por
defecto) y WebSearch en modo estándar. Copias en `fuentes/barrido/tarde/`
(no van a Git); hora, HTTP y huella al final de `inventario-consultas.txt`.

| Dónde | Hora UTC | Resultado |
|---|---|---|
| CNMV, notas de prensa (`aldia/notasprensa`) | 14:10:29 | **misma huella que por la mañana** (`d733d993…`): la primera sigue siendo «11/11/2026 13:00 Advertencias de entidades no registradas en supervisores internacionales». La página no está en caché: la portada de la CNMV sí cambió (`6ae4a7a4…`, con comunicaciones de emisores del 13/11 hasta las 13:35), pero ninguna nota de prensa ni advertencia nueva |
| CNMV, ERIR (lista) | 14:10:29 | misma huella (`1e2da762…`): ninguna inscripción nueva |
| ESMA, noticias (web y RSS) | 14:10:29 | RSS con la misma huella; en la web solo cambian identificadores de la página. La última sigue siendo la del 09/11 (ETSG) |
| ESMA, registro de folletos (API Solr, desde el 12/11, sin condiciones finales) | 14:10:29 | los mismos 14 documentos de la mañana; ninguno nuevo y ninguno de tokenización |
| BOE, sumario del 13/11 (API, `Accept: application/xml`) | 14:11:01 | misma huella (`f78b7ea7…`): nada del sector |
| Consejo de la UE (RSS) | 14:10:29 | las mismas seis primeras notas (comercio de emisiones, pesca, Comunidad Política Europea, Armenia): nada del régimen piloto ni de mercados de capitales |
| Comisión, FISMA (noticias) | 14:10:29 | el texto de la página no cambia (solo marcas internas) |
| BCE y EBA (RSS) | 14:10:29 | mismas huellas que por la mañana |
| Ledger Insights (RSS, pista) | 14:10:29 | misma huella: nada nuevo |
| WebSearch (estándar) | 14:12-14:16 | «CNMV advertencia 13 noviembre 2026»; «tokenización 13 de noviembre de 2026»; valores tokenizados para particulares en Europa el 13/11; ESMA y tokenización en noviembre; emisores del catálogo (Robinhood Stock Tokens, xStocks/Backed, Bit2Me STX y Valorix, Spiko): nada del 12 o el 13/11 con fuente primaria. Lo más reciente son cifras de xStocks del 09/11 en prensa (no del emisor) y la prensa que sigue situando la emisión de Valorix en diciembre, sin documento |

**Decisión: sin cambios en `noticias-2026-11-13.json`.** A las 14:10 UTC (15:10
en Madrid) la CNMV aún no ha publicado ninguna nota ni advertencia del 13/11,
y ningún otro organismo ni emisor del catálogo trae un hecho del 12 o el 13/11
con fuente primaria que cumpla los criterios. «Hoy» sigue vacío; no se fuerza.
Si la CNMV publica más tarde (algunos días lo hace hasta las 14:00 UTC), la
candidata natural a «Hoy» sería su advertencia, con la foto `alerta-fraude`
(y la del 11/11 tendría que cambiar de foto o salir).

## Adenda del 14/11/2026 · titulares y fotos con la guía nueva (SIN PUBLICAR)

Encargo de la dirección del 13/11: «que las noticias tengan titulares buenos y
se priorice lo visual y la imagen, que atraiga». Se aplica a esta edición la
guía nueva (`rwadar-editorial-source/noticias/GUIA-TITULARES.md`): 60
caracteres como mucho en las dos lenguas, lo que cambia para el lector
primero, verbo activo, cifra de la fuente y sin promesas; y una foto distinta
para cada noticia, elegida por tema de la biblioteca ampliada. Solo cambian
`titulo`, `en.titulo` e `imagen`: ningún dato, cifra, fecha, fuente, resumen ni
`tituloInformativo`. Redactó los titulares el diseñador de la mejora; los
comprobó otra sesión (el constructor), contra las fuentes abiertas de nuevo
el 14/11 a las 02:08-02:09 UTC: las seis dan 200 y **la misma huella** que el
13/11 y que la primera apertura del 14/11 (00:35 UTC), así que las citas
siguen ahí, letra a letra.

| Fuente | Hora UTC (14/11) | HTTP | Huella |
|---|---|---|---|
| CNMV, advertencias de supervisores internacionales (11/11) | 02:08:48 | 200 | `e781ed720cec8611` |
| Robinhood Assets (Jersey), suplemento del 09/11 | 02:08:53 | 200 | `978eea67a47d5bb6` |
| Consejo de la UE, ST 13779/1/26 REV 1 | 02:09:00 | 200 | `757b8851957af55c` |
| CNMV, Bit2Me STX (28/10) | 02:09:06 | 200 | `e09fadd373bf3621` |
| CNMV, consulta sobre reclamaciones (15/10) | 02:09:12 | 200 | `289265b26b53f727` |
| ESMA, lista de infraestructuras DLT | 02:09:18 | 200 | `8f223820d3223598` |

| # | Antes | Ahora (caracteres) | En qué se apoya |
|---|---|---|---|
| 1 (portada) | 11 firmas sin registro: avisos de tres países de la UE · *11 unregistered firms flagged in three EU countries* | **11 firmas sin registro: compruébalas antes de invertir** (54) · *11 unregistered firms: check them before you invest* (51) | CNMV, 11/11: advertencias «sobre las entidades no registradas» (6 de Austria, 4 de los Países Bajos y 1 de Alemania) y «la web de la CNMV ofrece un buscador de entidades advertidas». El consejo es la prudencia genérica que respalda la fuente (guía, regla 8). |
| 2 | Robinhood: su emisor podrá restar Stock Tokens por costes · *Robinhood Stock Tokens: the issuer may cut tokens for costs* | **Robinhood: el emisor podrá restarte Stock Tokens por costes** (59) · *Robinhood: the issuer may cut your Stock Tokens for costs* (57) | Suplemento, punto (1)(C): el emisor puede repercutir costes al inversor, «which may include proportionately reducing the number of Products held by such Investors». «Restarte»: lo que le puede pasar al lector, con el sujeto exacto (el emisor). |
| 3 | Mercados DLT: los Veintisiete piden un tope 50 veces mayor · *DLT markets: EU states want a cap 50 times higher* | **Mercados tokenizados: los 27 piden un tope 50 veces mayor** (57) · *Tokenised markets: EU states want a cap 50 times higher* (55) | Orientación general del Consejo: el tope agregado «of EUR 6 billion» … «should be raised to EUR 300 billion» (× 50). Sin la sigla DLT (regla 7). «Los 27» son los Estados del Consejo, como decía «los Veintisiete». |
| 4 | España ya tiene dos mercados de valores tokenizados | sin cambios (51 · 46): ya cumple | CNMV, 28/10, y lista de ESMA: dos infraestructuras españolas. |
| 5 | Quejas contra plataformas cripto: la CNMV quiere atenderlas | **La CNMV propone atender tus quejas contra plataformas cripto** (60); inglés sin cambios (60) | CNMV, 15/10: proyecto de Circular para «ampliar dicho procedimiento a las reclamaciones derivadas de la prestación de servicios de criptoactivos y de financiación participativa». «Propone»: es un proyecto en consulta (regla 6). Comentarios «hasta el próximo 16 de noviembre»: **desde el 17/11 la edición siguiente tiene que quitar o reescribir esta noticia.** |

Avisos del programa (`revisarEdicion()`), mirados a mano: en la 3, «27» y «50»
no están tal cual en el resumen (es la cuenta 300.000 / 6.000 y los Estados
del Consejo), como ya admitía la guía. Ningún error.

Fotos (una distinta por noticia, elegida por tema con la tabla de la guía;
la portada, con la más clara del suyo):

| # | Antes | Ahora | Por qué |
|---|---|---|---|
| 1 (portada) | `alerta-fraude` | `alerta-fraude` | Avisos y fraude: el móvil con la alarma roja es la más clara del tema. |
| 2 | `acciones-eeuu` | `acciones-movil` | Acciones tokenizadas: Robinhood es una app (móvil en una mesa, sin nada legible en la pantalla). |
| 3 | `instituciones-ue` | `instituciones-ue-2` | Regulación en la UE: una mesa redonda vacía, como los Estados del Consejo. |
| 4 | `bolsa-madrid` | `bolsa-madrid` | Bolsas y mercados en España. |
| 5 | `regulador-espana` | `documentos-consulta` | Consultas y reclamaciones: es una consulta pública (folios en blanco). |

Comprobado con `revisarEdicion()` (sin errores; fotos distintas y de la
biblioteca), `validarNoticias()`, el motor congelado de la app instalada
(`node rwadar-app/noticias/noticias-v1.cjs`, que regenera
`rwadar-site/datos/noticias.json` sin «imagen») y la construcción local de la
web (`rwadar-publicar.js --local`). `noticias-2026-11-13.json` de esta carpeta
queda igual que `rwadar-site/datos/noticias-v2.json`. **Sin publicar**: entra con la mejora,
cuando se publique; si para entonces hay una edición más nueva, se le aplica
la guía a esa y estos titulares quedan como ejemplos.
