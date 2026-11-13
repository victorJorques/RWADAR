# Verificación independiente · noticias de Inicio · 13/11/2026

Verificador: Claude (no eligió ni redactó las noticias). Archivo revisado:
`noticias-2026-11-13.json` (5 noticias: ninguna de «Hoy» y 5 de «Lo más
importante»). He vuelto a abrir cada fuente con curl, con su propio agente de
usuario, en paralelo a las **08:34:35 UTC** del 13/11/2026 (todas con HTTP
200). Las copias de trabajo están en el directorio temporal de la sesión,
fuera del repositorio.

**Veredicto: conforme.** 5 confirmadas, ninguna corregida ni quitada. No he
tocado el JSON. Pasa `validarNoticias()` de `rwadar-movil/lib/noticias-sector.js`
(devuelve las 5, todas en `importante`).

**Qué cambia respecto del 12/11 (comprobado por programa, clave a clave,
contra `2026-11-12-v2/noticias/noticias-2026-11-12.json`):**
- `actualizadoEl` y el `consultadaEl` de las cinco pasan a 2026-11-13.
- N.º 1: `seccion` pasa de `hoy` a `importante`; el `titulo` pierde «Otras»
  («11 firmas sin registro: avisos de tres países de la UE») y el
  `en.titulo` pierde «more» («11 unregistered firms flagged in three EU
  countries»). Mismo dato: once entidades, tres países. Sin «Otras» el
  titular ya no remite al aviso del 10/11, que no está en esta edición: bien.
- Sale `prosegur-cash-pagares-dlt` (el máximo de «importante» es 5).
- Nada más: `resumen`, `porQueImporta`, `tituloInformativo`, `fuente`,
  `fecha` e `imagen` son los verificados ayer (`2026-11-12-v2/noticias/VERIFICACION.md`),
  con la corrección de la n.º 1 de ayer ya incorporada.

## Resumen

| # | id | Veredicto | Huella SHA-256 hoy (igual que el 12/11) |
|---|---|---|---|
| 1 | cnmv-advertencias-supervisores-ue-11-entidades | confirmada | `e781ed720cec8611` |
| 2 | robinhood-stock-tokens-suplemento | confirmada | `978eea67a47d5bb6` |
| 3 | consejo-ue-tope-regimen-piloto-dlt | confirmada | `757b8851957af55c` y `54f5eeefda10ae00` |
| 4 | cnmv-autoriza-bit2me-stx | confirmada | `e09fadd373bf3621` y ESMA `8f223820d3223598` |
| 5 | cnmv-reclamaciones-cripto-financiacion-participativa | confirmada | `289265b26b53f727` |

Las huellas coinciden con las de `EDICION.md` y `inventario-consultas.txt`:
los documentos son byte a byte los verificados ayer.

**«Hoy» vacío: correcto.** Lista de notas de prensa de la CNMV
(https://www.cnmv.es/portal/aldia/notasprensa, 08:34:35 UTC, HTTP 200, huella
`d733d993695b0f90`, la misma que ayer y que la del editor). Empieza así:
«11/11/2026 13:00 Advertencias de entidades no registradas en supervisores
internacionales · 10/11/2026 12:20 Advertencias de la CNMV de entidades no
registradas · 06/11/2026 11:40 …». Nada del 12 ni del 13/11. Noticias de ESMA
(https://www.esma.europa.eu/press-news/esma-news, 08:34:35 UTC, HTTP 200): la
primera sigue siendo «EU seeks nominations for stakeholder group on
tokenisation standards in finance 09/11/2026». No hay hecho del 12 o el 13/11
que deba ir en «Hoy»; no forzarlo es lo correcto. Como dice `EDICION.md`, si
se publica por la tarde hay que repetir el barrido de la CNMV (sus avisos
salen entre las 11:35 y las 14:00, hora de Madrid).

**«Importante».** Fechas del 15/10 al 11/11: todas dentro de los últimos 30
días (desde el 14/10). Ninguna es de «hoy» ni dice serlo.

**Imágenes.** Las cinco claves (`alerta-fraude`, `acciones-eeuu`,
`instituciones-ue`, `bolsa-madrid`, `regulador-espana`) son válidas: el
validador las acepta y aparecen en `rwadar-editorial-source/noticias/fotos.json`.
Son cinco fotos distintas.

**Personas.** Ningún nombre de persona física, ni en castellano ni en inglés:
solo empresas, entidades y organismos.

**Longitudes.** Títulos en castellano 54, 57, 58, 51 y 59 caracteres; en
inglés 51, 59, 49, 46 y 60. Ninguno pasa de 60.

## 1 · CNMV, advertencias de supervisores internacionales (11/11)

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bcdb0a20a-39bd-473f-9ddc-47ea5d982dab%7d
- 08:34:35 UTC · HTTP 200 · application/pdf · `e781ed720cec8611`.
- Literal: «11 de noviembre de 2026»; seis líneas «FMA - AUSTRIA» (Stig
  International Trading & Gemstone, Coinmindz, Vantex Bank, Bull Trade24
  Ltd, Alliston-Westbury, Velmato Edge), cuatro «AFM - PAISES BAJOS»
  (DirectValue, True Ability, Metacasp, Lion Capital) y una «BAFIN -
  ALEMANIA» (Nexura VG): 6 + 4 + 1 = 11, tres países de la UE. «BAFIN
  prohibió a Nexura VG ofrecer al público…» por no haber publicado el folleto
  requerido. «Además, la web de la CNMV ofrece un buscador de entidades
  advertidas.»
- Titular nuevo: «11 firmas sin registro: avisos de tres países de la UE» /
  «11 unregistered firms flagged in three EU countries». Fiel; el inglés
  traduce bien el castellano. Lo demás, como ayer.

## 2 · Suplemento de los Stock Tokens de Robinhood (09/11)

- URL: https://cdn.robinhood.com/assets/robinhood/legal/rhj_base_prospectus_supplement_09_november_2026.pdf
- 08:34:35 UTC · HTTP 200 · application/pdf · `978eea67a47d5bb6`.
- Literal: «Supplement dated 09 November 2026 to the Base Prospectus dated 25
  June 2026»; aprobado por la FMA de Liechtenstein «on 09 November 2026»;
  «(C) the Issuer is permitted to pass on certain fees and costs … which may
  include proportionately reducing the number of Products held by such
  Investors»; la lista de notificaciones incluye «Spain».
- https://robinhood.com/eu/es/invest/ (08:34:35 UTC, HTTP 200, HTML dinámico,
  huella `323b9be4b4f3f332`): sigue «Explora más de 2.000 Classic Stock
  Tokens vinculados a NVIDIA, Microsoft, Apple…». Respalda «En España,
  Robinhood solo vende hoy los «Classic»».

## 3 · Régimen piloto DLT: posición del Consejo (Coreper, 04/11)

- URL: https://data.consilium.europa.eu/doc/document/ST-13779-2026-REV-1/en/pdf
  (08:34:35 UTC, HTTP 200, `757b8851957af55c`) y
  https://data.consilium.europa.eu/doc/document/ST-14900-2026-INIT/en/pdf
  (08:34:35 UTC, HTTP 200, `54f5eeefda10ae00`).
- Literal: «… intermediated by a DLT market infrastructure of EUR 6 billion»
  y «… shall not exceed EUR 300 billion» (6.000 → 300.000 millones = 50
  veces); ST 14900/26: «General approach approved by Coreper. Part 2, on
  04.11.2026».
- Sigue siendo una posición: una búsqueda web (modo estándar, 13/11) no da
  ningún acuerdo con el Parlamento Europeo; el objetivo declarado es llegar a
  él a final de 2026.

## 4 · La CNMV autoriza Bit2Me STX (28/10)

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7be319e419-ac2f-4812-9d69-01ed76101aee%7d
- 08:34:35 UTC · HTTP 200 · application/pdf · `e09fadd373bf3621`.
- Literal: «28 de octubre de 2026»; «será operada por Bit2Me Security Tokens
  Exchange STX, A.V., S.A.»; «En Bit2MeSTX se podrán negociar acciones y
  bonos representados en TRD».
- Lista de ESMA
  (https://www.esma.europa.eu/sites/default/files/2026-01/Authorised_DLT_Market_Infrastructures.pdf,
  08:34:35 UTC, HTTP 200, `8f223820d3223598`): dos en España, «Securitize
  Europe DLT TSS … Spain … 26 November 2025» y «Bit2Me STX DLT TSS … Spain
  … 27 October 2026». Respalda «España ya tiene dos».
- «Por ahora no consta ninguna [emisión] con documento público para
  particulares»: sigue siendo cierto. La prensa sitúa la primera (bono de
  Valorix) en diciembre y para «inversores elegibles», sin fuente primaria.

## 5 · La CNMV propone atender quejas contra plataformas cripto (15/10)

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bcff2b57d-5b54-44e2-98db-057d90acc64b%7d
- 08:34:35 UTC · HTTP 200 · application/pdf · `289265b26b53f727`.
- Literal: «LA CNMV INICIA LA CONSULTA DEL PROYECTO DE CIRCULAR…»;
  «servicios de criptoactivos y de financiación participativa»; «Los
  comentarios pueden enviarse por escrito hasta el próximo 16 de noviembre
  de 2026».
- El plazo sigue vivo hoy. **Aviso para la próxima edición:** a partir del
  17/11 «Comentarios hasta el 16/11» queda vencido: hay que sacarla o
  reescribir el resumen.

Nada de esto es una recomendación. Ninguna noticia da precios ni promete
rentabilidad.
