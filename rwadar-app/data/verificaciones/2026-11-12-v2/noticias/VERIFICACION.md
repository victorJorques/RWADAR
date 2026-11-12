# Verificación independiente · noticias de Inicio · 12/11/2026

Verificador: Claude (no eligió ni redactó las noticias). Archivo revisado:
`noticias-2026-11-12.json` (6 noticias: 1 de «Hoy» y 5 de «Lo más
importante»). Volví a abrir cada fuente con curl, con su propio agente de
usuario, entre las **00:36:24 y las 00:37:36 UTC** del 12/11/2026 (las
descargas en paralelo empezaron a las 00:36:24). Las copias de trabajo están
en el directorio temporal de la sesión, fuera del repositorio.

**Veredicto: con cambios.** 5 confirmadas y 1 corregida: en la n.º 1 solo
cambia el «por qué importa», en castellano y en inglés. No quito ninguna. La
corrección ya está aplicada al JSON, que pasa `validarNoticias()` de
`rwadar-movil/lib/noticias-sector.js` (6 noticias).

Respecto del 11/11, las noticias 2 a 6 solo cambian `consultadaEl` (lo he
comprobado por programa, clave a clave). Su texto es el que se verificó ayer
(`2026-11-11-v2/noticias/VERIFICACION.md`), y hoy sus fuentes dan la misma
huella SHA-256.

## Resumen

| # | id | Veredicto | Motivo corto |
|---|---|---|---|
| 1 | cnmv-advertencias-supervisores-ue-11-entidades | **corregir** («por qué importa», ES y EN) | Sin folleto no siempre es ilegal: la fuente habla del folleto «requerido» |
| 2 | robinhood-stock-tokens-suplemento | confirmada | PDF idéntico (`978eea67…`); FMA 09/11; «proportionately reducing…» |
| 3 | prosegur-cash-pagares-dlt | confirmada | ERIR idéntica (`6d7eb7cb…`); 06/11; 500.000 euros; aviso de la CNMV |
| 4 | consejo-ue-tope-regimen-piloto-dlt | confirmada | 6.000 → 300.000 millones (50 veces); no hay acuerdo con el Parlamento |
| 5 | cnmv-autoriza-bit2me-stx | confirmada | Nota del 28/10; ESMA da dos en España (Securitize y Bit2Me STX) |
| 6 | cnmv-reclamaciones-cripto-financiacion-participativa | confirmada | Proyecto de Circular; comentarios «hasta el 16 de noviembre de 2026» |

**«Hoy».** Solo la n.º 1, del 11/11. La lista de notas de prensa de la CNMV
(https://www.cnmv.es/portal/aldia/notasprensa, 00:36:24 UTC, HTTP 200)
empieza así: «11/11/2026 13:00 Advertencias de entidades no registradas en
supervisores internacionales · 10/11/2026 12:20 Advertencias de la CNMV de
entidades no registradas». No hay nada del 12/11, como es lógico a esa hora
(las 01:36 en Madrid). Es de verdad del 11/11. Si se publica por la tarde,
habría que repetir el barrido de la CNMV y de ESMA antes, como ya dice
`EDICION.md`.

**«Importante».** Van del 15/10 al 09/11: todas caen dentro de los últimos
30 días (desde el 13/10).

**Imágenes.** Las seis claves (`alerta-fraude`, `acciones-eeuu`,
`pagares-deuda`, `instituciones-ue`, `bolsa-madrid`, `regulador-espana`)
existen en `rwadar-editorial-source/noticias/fotos.json`.

**Personas.** El JSON no nombra a ninguna persona física, ni en castellano
ni en inglés. Solo salen empresas, entidades y organismos.

**Longitudes.** Ningún `titulo` pasa de 60 caracteres, en ningún idioma
(el más largo tiene 60). Todo lo demás cumple los máximos del validador.

## 1 · CNMV, advertencias de supervisores internacionales (11/11) · corregir el «por qué importa»

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bcdb0a20a-39bd-473f-9ddc-47ea5d982dab%7d
- 00:36:24 UTC · HTTP 200 · application/pdf · SHA-256 `e781ed720cec8611…`
  (la misma de `EDICION.md`) · una página · el PDF se creó el 11/11 a las
  11:56 UTC.
- Literal: «ADVERTENCIA DE ENTIDADES NO REGISTRADAS EN SUPERVISORES
  INTERNACIONALES · 11 de noviembre de 2026» y «La Comisión Nacional del
  Mercado de Valores (CNMV) hace públicas las advertencias recibidas a través
  de los supervisores internacionales sobre las entidades no registradas…».
- He contado las once entidades en el PDF:
  - Seis de «FMA - AUSTRIA»: Stig International Trading & Gemstone FZCO,
    Coinmindz, Vantex Bank, Bull Trade24 Ltd, Alliston-Westbury y Velmato
    Edge.
  - Cuatro de «AFM - PAISES BAJOS»: DirectValue, True Ability, Metacasp y
    Lion Capital.
  - Una de «BAFIN - ALEMANIA»: Nexura VG.
  - Seis, cuatro y una dan once. Son tres países y los tres son de la UE.
- Lo que dice la observación de BaFin: «BAFIN prohibió a Nexura VG ofrecer
  al público valores en forma de acciones de GoldRock Industries Ltd por no
  haber publicado EL FOLLETO INFORMATIVO O DOCUMENTO EQUIVALENTE REQUERIDO
  POR LA NORMATIVA DE VALORES». El resumen («prohibió a una de ellas ofrecer
  acciones al público por no haber publicado el folleto») es fiel. Son
  acciones de otra sociedad, pero el resumen no dice de quién, así que no
  hay error.
  - Nota: según un despacho alemán (mtrlegal.com) y la alerta de BaFin en
    IOSCO, la decisión de BaFin es del 23/10/2026. El texto ya cuenta bien
    las fechas: lo que es del 11/11 es que la CNMV la difunda («La CNMV
    difunde…»), y la prohibición va en pasado y sin fecha.
- Cierre del PDF: «Además, la web de la CNMV ofrece un buscador de entidades
  advertidas». En eso se apoya el consejo de buscar la entidad.
- **Por qué corrijo.** El «por qué importa» decía: «Ofrecer valores sin
  folleto es una señal de alarma, también en las emisiones tokenizadas».
  Dicho así, es demasiado general:
  - Hay ofertas legales sin folleto, por ejemplo por debajo del umbral de
    importe o dirigidas a inversores cualificados. Algunas emisiones
    tokenizadas españolas son así. La misma página trae una: los pagarés de
    Prosegur Cash, de los que «no hemos hallado documento público».
  - La fuente no habla de cualquier folleto, sino del que es «requerido por
    la normativa de valores».
  - Con el añadido, la frase dice lo que dice la fuente y ya no lleva a
    pensar que toda emisión sin folleto es un fraude.
  - Castellano:
    - Antes: «Ofrecer valores sin folleto es una señal de alarma, también en
      las emisiones tokenizadas. Antes de invertir, busca la entidad en el
      buscador de advertencias de la CNMV.»
    - Ahora: «Ofrecer valores al público sin el folleto exigido es una señal
      de alarma, también en las emisiones tokenizadas. Antes de invertir,
      busca la entidad en el buscador de advertencias de la CNMV.»
      (190 caracteres)
  - Inglés:
    - Antes: «Offering securities without a prospectus is a red flag,
      tokenised issues included. …»
    - Ahora: «Offering securities to the public without a required prospectus
      is a red flag, tokenised issues included. …» (180 caracteres)
- Titular: «Otras 11 firmas sin registro: avisos de tres países de la UE» (60).
  Dice lo mismo que la fuente: once entidades no registradas y avisos de
  supervisores de tres países. No usa «chiringuito» ni «clon», que el PDF
  tampoco usa para estas entidades. «Otras» remite a las advertencias
  anteriores de la CNMV, como la del 10/11, que ya no está en la lista: se
  entiende igual. En inglés: «11 more unregistered firms flagged in three EU
  countries» (55). Es fiel.
- Inglés del resumen: fiel. `tituloInformativo` (ES y EN): correcto.
- `fecha` 2026-11-11 y `seccion` «hoy»: correcto.

## 2 · Robinhood Assets (Jersey), suplemento del 09/11 · confirmada

- URL: https://cdn.robinhood.com/assets/robinhood/legal/rhj_base_prospectus_supplement_09_november_2026.pdf
- 00:36:24 UTC · HTTP 200 · application/pdf · SHA-256 `978eea67a47d5bb6…`
  (el mismo del 10 y el 11/11).
- Literales: «Supplement dated 09 November 2026» y «proportionately reducing
  the number of Products held by such Investors». La aprobación de la FMA
  del 09/11 y la notificación a España se comprobaron el 11/11 sobre este
  mismo PDF, que no ha cambiado ni un byte.
- Lo que vende Robinhood en España: https://robinhood.com/eu/es/invest/
  (00:36:24 UTC, HTTP 200; es HTML dinámico y su huella cambia,
  `b835e61f88953805…`). Sigue diciendo: «Explora más de 2.000 Classic Stock
  Tokens vinculados a NVIDIA, Microsoft, Apple, Vanguard S&P 500 ETF y
  más». Así que «solo vende hoy los «Classic»» se sostiene.
- Texto idéntico al verificado el 11/11. Es del 09/11: va bien en
  «importante».

## 3 · CNMV, ERIR de Minos Securities (Prosegur Cash) · confirmada

- URL: https://www.cnmv.es/portal/consultas/esi/erir_esi.aspx?nif=A23875529&lang=es
- 00:36:24 UTC · HTTP 200 · SHA-256 `6d7eb7cbca433bc8…` (la misma del
  11/11).
- Literal: «06/11/2026 PROSEGUR CASH, S.A. Inscribir en el Registro Oficial
  … a MINOS SECURITIES, A.V., S.A. como entidad responsable…». El importe,
  «500.000 euros», está en la misma entrada (verificado el 11/11, y la
  página es idéntica).
- Aviso: «no implica que la CNMV haya validado las condiciones de la emisión
  ni la información facilitada por el emisor».

## 4 · Consejo de la UE, tope del régimen piloto DLT · confirmada

- URL: https://data.consilium.europa.eu/doc/document/ST-13779-2026-REV-1/en/pdf
  - 00:36:24 UTC · HTTP 200 · SHA-256 `757b8851957af55c…` (la misma).
- ST 14900/26: https://data.consilium.europa.eu/doc/document/ST-14900-2026-INIT/en/pdf
  - 00:36:24 UTC · HTTP 200 · SHA-256 `54f5eeefda10ae00…` (la misma).
  - Incluye «13779/1/26 REV 1».
- Literales:
  - «all asset-specific caps should be withdrawn, whereas the aggregate cap
    should be raised to EUR 300 billion»
  - «value of financial instruments intermediated by a DLT market
    infrastructure of EUR 6 billion»
  - De 6.000 a 300.000 millones son 50 veces.
- ¿Sigue siendo una posición? Busqué en la web (modo estándar) un acuerdo
  provisional con el Parlamento en noviembre de 2026 y no aparece ninguno.
  «Falta pactarla con el Parlamento Europeo» sigue siendo cierto.

## 5 · CNMV autoriza Bit2Me STX · confirmada

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7be319e419-ac2f-4812-9d69-01ed76101aee%7d
- 00:36:24 UTC · HTTP 200 · application/pdf · SHA-256 `e09fadd373bf3621…`
  (la misma).
- Literales:
  - «La infraestructura, denominada Bit2MeSTX, será operada por Bit2Me
    Security Tokens Exchange STX, A.V., S.A.»
  - «En Bit2MeSTX se podrán negociar acciones y bonos representados en TRD».
- Lista de ESMA: https://www.esma.europa.eu/sites/default/files/2026-01/Authorised_DLT_Market_Infrastructures.pdf
  - 00:37:36 UTC · HTTP 200 · SHA-256 `8f223820d3223598…` (la misma).
  - Solo trae dos de «Spain»: «Securitize Europe DLT TSS» (26 November 2025)
    y «Bit2Me STX DLT TSS» (27 October 2026).
  - «España suma dos con Securitize» y «ESMA la registra con fecha
    27/10/2026» son correctos.

## 6 · CNMV, reclamaciones contra proveedores cripto y de financiación participativa · confirmada

- URL: https://www.cnmv.es/webservices/verdocumento/ver?t=%7bcff2b57d-5b54-44e2-98db-057d90acc64b%7d
- 00:36:24 UTC · HTTP 200 · application/pdf · SHA-256 `289265b26b53f727…`
  (la misma).
- Literales:
  - «15 de octubre de 2026»
  - «Los interesados podrán enviar comentarios hasta el 16 de noviembre de
    2026»
- El plazo sigue abierto y la nota está dentro de los 30 días.

Nada de esto es una recomendación. Ninguna noticia da precios ni promete
rentabilidad.
