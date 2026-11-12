# Decisiones del coordinador · entrega 2026-11-12

Claude, 12/11/2026. Puesta al día pedida por Víctor a las 00:28 UTC: «Tendrás
que actualizar la información a hoy y acelerar».

**Base:** la publicada `24b5f7de-2834-3e15-6ae4-62a6d9565161` (entrega
`2026-11-11`), leída como visitante a las 00:30 UTC (`lectura-publica/`).

**Fuentes de estas decisiones:** `expedientes/`, `grupos/*/resumen-*.md` y
`revision-independiente/`. En cada grupo revisó un agente distinto del que
investigó. Solo entra lo `confirmado` o lo `confirmado_con_cambios`, con las
correcciones obligatorias aplicadas.

## 1. Lo general

- **Etiqueta `2026-11-12`.** Las mismas 22 ofertas, en las mismas colecciones
  (8 / 13 / 1), salvo que se diga abajo.
  - `verificadaEl = 2026-11-12` y `vigenciaDias = 7`: el último día vigente
    es el **19/11/2026**.
- **Radar:** `verificadoEl = 2026-11-12`, 69 de 69
  (`radar-contraste-2026-11-12.json`). Las dos fuentes de REGAFI se leyeron
  hoy, a las 00:37 UTC, por su API pública (`cambios-radar.json`,
  `radar-manual/`). El pasaporte a España tiene la misma huella que el 10 y
  el 11/11. No cambia ninguna dirección ni ningún texto.
- **Rutas legítimas a las fuentes que bloquean:** `comprobar-rutas.mjs` dio
  76 de 76 a las 00:30 UTC.
- **Noticias:** 6 del 12/11 (`noticias/noticias-2026-11-12.json`), con su
  verificación independiente (`noticias/VERIFICACION.md`, «con cambios»
  aplicados).
  - Se publican en `rwadar-site/datos/noticias-v2.json` y, sin «imagen», en
    `noticias.json`.

## 2. Por oferta (antes → ahora)

> Cerrado a las 01:02 UTC con las cuatro revisiones independientes
> («aprobado con cambios» las cuatro).

- **Spiko Letras del Tesoro Euro y Dólar:** sin cambios.
  - 2,41 % y 4,02 %, con los mismos ficheros de la API que ayer.
  - El 11/11 fue festivo en Francia y no hubo VL nueva.
  - Solo cambia la fecha de verificación.
- **Spiko Smart Cash Euro:** sigue en 2,84 %, ahora con la VL del 11/11.
  - Literal: «valor liquidativo del 11/11/2026; consultado el 12/11/2026».
  - Métrica: «Rentabilidad publicada · neta y variable · 11/11/2026: 2,84 %».
- **mTBILL:**
  - **Rentabilidad: null → 3,45 % anual en USD.** Es la opción A del revisor:
    rentabilidad pasada del oráculo del emisor, de la ronda 468 (06/10/2026,
    1,07410723 USD) a la 492 (10/11/2026, 1,07768132 USD), 5 semanas.
    - **No 3,53 %:** esa ventana empezaba tras el festivo de EE. UU. del
      12/10 y contaba unos 29 días de interés en 28.
    - Contraste: rwa.xyz 3,44 %.
  - Métrica: «Rentabilidad pasada · 5 semanas hasta el 10/11/2026 · en USD:
    3,45 % anual».
  - Aviso nuevo: «La rentabilidad es pasada y la calcula RWAdar con el valor
    que publica el emisor (del 06/10 al 10/11/2026): está en dólares, no
    descuenta el 0,07 % del reembolso inmediato ni el cambio euro/dólar, y no
    garantiza la futura.»
  - Según el KID en español, el valor ya va neto de todas las comisiones,
    incluida la de rendimiento del 5 %.
  - Valor por token: sigue en 1,0777 USD (10/11). Estado:
    `fuentes_en_conflicto` (el conflicto de los límites de reembolso sigue
    igual). La vista pública seguirá tapando las cifras mientras dure.
  - En `documentacion-ofertas.json`, quitar las referencias antiguas de
    midas.app («APY observado 3,41 %» del 21/09 y «3,42 % · 7D APY» del
    30/09), para que la ficha no muestre tres rentabilidades.
- **Robinhood, Kraken xStocks y Prosegur Digital Gold:** sin cambios. Mismos
  documentos (SHA-256). Solo cambia la fecha de verificación.
- **Brickwise, mínimos en reventa (12/11):**
  - Fotovoltaica Cohotel: 110 → **102 €**.
  - Fotovoltaica GreenPoint: 100 → **102 €**.
  - Pottendorfer Straße 62: 73 → **80 €**.
  - Las otras 8 mantienen el precio y solo cambia la fecha a «(12/11)».
  - **Aviso común nuevo en las 11:** «Cada venta se anuncia con su precio y
    su número de participaciones; no consta que se pueda comprar solo una
    parte. El comprador paga además un 1,5 % de comisión.»
  - Importes con el 1,5 %, donde aparezcan: 96,43 € (Klagenfurt), 100,49 €
    (Plüddemanngasse) y 116,73 € (Pottendorfer), redondeados bien.
- **Aktionariat, Boss Info y Switzerlend:** nada cambia de fondo.
  - Se conservan los textos publicados de acceso y salida.
  - Pasan al 12/11: «Precio del emisor», «Supervisor», los avisos con dato
    del día y los mínimos.
    - Boss Info: «100 CHF por transferencia al emisor; en cripto, desde 2
      acciones (unos 17 ZCHF el 12/11)».
    - Switzerlend: «1 acción (68,01 CHF el 12/11)».
  - **Boss Info, «Última operación · 12/11/2026»:**
    - Fuente: https://shares.bossinfo.com/ (no la API POST getTrades, que da
      405).
    - Alcance: el portal, el historial igual byte a byte y la operación en
      cadena del 05/11/2026 a las 13:35:35 UTC.
    - El importe de 8,2404 ZCHF que recibió el vendedor se comprobó el 10/11
      y hoy no se releyó.
- **Hausera:** sin cambios de contenido. Alicante 3, preventa el 18/11 a las
  09:00; Alicante 2, financiada. Se refecha al 12/11 solo lo que se volvió a
  consultar hoy.

## 3. Candidatas

Hoy no entra ninguna (todas `no_admitir`, con su motivo):

- Pagarés de Prosegur Cash.
- Securitize Stocks.
- Bonos de Profitus/Axiology.
- Valorix.
- CANDO1.
- **Crypto.com Tokenized Stocks (UE).** Está autorizada para España (CNMV
  n.º 4485, CySEC 344/17) y anunciada en la App Store española, pero el KID
  solo se entrega dentro de la app (condiciones, 5.2): no hay KID público.

## 4. Correcciones de los revisores

Todas aplicadas:

- **Principales:**
  - mTBILL: 3,45 % y no 3,53 %; aviso con la ventana; quitar las
    referencias antiguas del APY.
  - Smart Cash: decir en el expediente que el 2,80 % y el 2,83 %
    recalculados son compuestos (simple: 2,76–2,80 %).
- **Brickwise:**
  - Los tres redondeos con el 1,5 %.
  - Los crudos (con nombres y direcciones de cartera) quedan fuera de Git
    por el `.gitignore` del día.
- **Suiza:** fuente y alcance de la referencia «Última operación» de Boss
  Info, como en §2.
- **Vigilancia:** recortados los tres nombres de personas físicas de la copia
  del blog de Bit2Me; el original queda solo en `crudo/`.
