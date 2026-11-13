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
