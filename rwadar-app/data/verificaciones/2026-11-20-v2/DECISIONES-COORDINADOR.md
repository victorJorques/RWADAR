# Decisiones del coordinador · entrega 2026-11-20

Claude, 20/11/2026. Puesta al día pedida por Víctor a las 16:51 UTC: «Actualiza
las fichas y la información de RWAdar, ofertas, noticias, todo antes de las 12
de la noche» y, a las 16:54 UTC, «el valor de mercado con el gráfico también,
todo actualizado al momento de ahora».

**Base:** la publicada `434217eb-9b7f-1cd9-a851-fbde7bced2bf` (entrega
`2026-11-13`), leída como visitante a las 16:52 UTC (`lectura-publica/`). Sus
cifras caducan hoy a las 24:00 UTC.

**Fuentes de estas decisiones:** `vigia.json` (16:52 UTC), `expedientes/`,
`grupos/*/resumen-*.md` y `revision-independiente/`. En cada grupo revisó un
agente distinto del que investigó. Solo entra lo `confirmado` o lo
`confirmado_con_cambios`, con las correcciones obligatorias aplicadas. Cerrado
a las 17:20 UTC.

## 1. Lo general

- **Etiqueta `2026-11-20`.** Las mismas 22 ofertas, en las mismas colecciones
  (8 / 13 / 1). Ni altas ni retiradas: entrega con el motor.
  - `verificadaEl = 2026-11-20` y `vigenciaDias = 7`: el último día vigente
    es el **27/11/2026**.
- **Radar:** `verificadoEl = 2026-11-20`, 69 de 69
  (`radar-contraste-2026-11-20.json`, capturas de las 16:57 UTC). La ficha de
  la entidad de Spiko en REGAFI cargó hoy con datos; solo la de pasaportes se
  leyó por la API pública del mismo registro a las 16:58 UTC, con la misma
  huella que el 13/11 (`cambios-radar.json`, `radar-manual/`). No cambia
  ninguna dirección ni ningún texto.
- **Rutas legítimas:** `comprobar-rutas.mjs` a las 16:52 UTC (Midas docs
  abierta de nuevo; FSMA de Crypto.com con versión solo técnica).
- **Noticias:** 5 «importantes» (la más reciente del 18/11) y ninguna de «Hoy»
  (`rwadar-app/data/noticias-diarias/2026-11-20/`), con la skill de la mañana:
  editor y verificador independientes, pase 1 «conforme», validación y
  pruebas. Se publican en `rwadar-site/datos/noticias-v2.json` y, sin
  «imagen», en `noticias.json`.
- **Tokenización:** «Tokenización diaria» del 20/11 (15:58 UTC) en
  `datos-tokenizacion`; se vuelve a lanzar justo antes de publicar, a petición
  de Víctor («al momento de ahora»).

## 2. Por oferta (antes → ahora)

- **Spiko Letras del Tesoro Euro:** rentabilidad **2,40 % → 2,35 %** (VL del
  19/11, 1,063276 €; 31 días, 19/10 → 19/11; API `monthlyYield` 0.0235,
  recalculado 2,350 %). Métrica: «Rentabilidad publicada · 31 días ·
  19/11/2026: 2,35 %».
- **Spiko Letras del Tesoro Dólar:** **3,98 % → 3,97 % en USD** (VL del 19/11,
  1,103445 $; 19/10 → 19/11; recalculado 3,967 %). Siguen los conflictos ya
  avisados.
- **Spiko Smart Cash Euro:** sigue en **2,84 %**, con la VL del 20/11
  (1,017886 €; recalculado 2,837 % a 7 días). Se mantiene el aviso de acceso
  (nadie confirma ni niega su venta en España).
  **Corrección obligatoria del revisor:** la métrica «Supervisor» pasa a
  «AMF (Francia): n.º SCV20260075, según el certificado de la AMF del
  23/02/2026; el 20/11/2026 el fondo ya no aparece en la base pública de la
  AMF (GECO) · Spiko SICAV inscrita en la CNMV (n.º 2380); la CNMV no muestra
  qué fondos de la SICAV están dados de alta en España». Igual en el claim del
  expediente. En `documentacion-ofertas.json` se quita la fecha 17/02/2026 y
  «(ficha pública en GECO …)» y la URL de la ficha GECO c124199, que ya no se
  publica.
- **Spiko (las tres), VL del 20/11:** los dos fondos de Letras publican VL
  nueva hacia las 18:00 UTC. Si la entrega se monta o se aplica después, se
  vuelve a leer la API y se fecha con la VL del 20/11 (corrección del
  revisor), con su revisión.
- **mTBILL:** valor por token **1,0777 → 1,0789 USD** (ronda 498 del oráculo,
  20/11 11:41:35 UTC); rentabilidad pasada de 5 semanas **3,45 % → 3,46 %**
  (16/10 → 20/11, rondas 475 → 498, misma regla de ventana); etiqueta de la
  métrica y aviso, «del 16/10 al 20/11/2026». Sigue el conflicto de
  reembolso 25 % / 15 % (`fuentes_en_conflicto`).
- **Kraken xStocks:** el resumen pasa de «más de 130 acciones y ETF de EE. UU.»
  a «más de 1.000 acciones y ETF de EE. UU.» (Kraken UE, en español y en
  inglés «1,000+», 16:58 UTC). Sin condiciones finales con España (las del
  19/11, ANTx, solo Liechtenstein y Suiza): el aviso se mantiene.
- **Robinhood y Prosegur Digital Gold:** sin cambios; solo la fecha.
- **Brickwise (11):** las 11 siguen solo en reventa y con vendedores.
  - **Pottendorfer:** mínimo **80 € → 81 €** («Desde 81 € la participación en
    reventa (20/11)»; 1 participación, orden del 15/11; 82,22 € con el 1,5 %);
    mejor compra 19 → 64 €; en venta 106 → 96.
  - **Cohotel:** mínimo **102 € → 110 €** («Desde 110 € la participación en
    reventa (20/11)»; 35 participaciones en 2 órdenes); menor importe 1 a
    120 € (121,80 €).
  - Las otras nueve: mismo mínimo, fecha 20/11, y los cambios del vigía
    confirmados en «Participaciones en venta», «Mejor oferta de compra» y
    «Orden de venta de menor importe» (ver `expedientes/` y
    `revision-independiente/brickwise.md`).
- **Aktionariat, Boss Info y Switzerlend:** sin cambios de fondo; solo las
  fechas.
- **Hausera (en camino):** Alicante 3 con **preventa abierta desde el 18/11**;
  la oferta pública sigue anunciada para el 25/11/2026. Aviso: «El 20/11/2026,
  con la preventa ya abierta, Alicante 3 aún no estaba inscrita en el
  registro de la CNMV». Sigue «en camino».

## 3. Lo que no entra

- **Candidatas:** ninguna (Prosegur Cash pagarés, Securitize Stocks,
  Profitus/Axiology, Valorix, CANDO1, Crypto.com Tokenized Stocks y Hausera
  Alicante 3 como oferta propia): a todas les falta algo esencial respaldado
  hoy por fuente primaria. Motivos en `expedientes/candidata-*.json`.

## 4. Correcciones de las revisiones de grupo

- Spiko Smart Cash Euro, «Supervisor» (arriba, §2).
- Copias con nombres de personas físicas (`mtbill-ft.txt`, la copia renderizada
  de la página de particulares de Spiko): fuera de Git, en `crudo/`. El PR
  sale de una rama limpia (squash) para que tampoco queden en la historia de
  `main`.
- Spiko Letras, VL del 20/11 (arriba, §2).

## 5. Pendiente para el próximo ciclo

- Hausera: el 25/11 empieza la suscripción de Alicante 3; el texto «la
  suscripción empieza el 25/11» quedará viejo ese día.
- Spiko Smart Cash: por qué la AMF dejó de publicar la ficha GECO.
