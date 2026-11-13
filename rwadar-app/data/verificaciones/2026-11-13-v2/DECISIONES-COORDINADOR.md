# Decisiones del coordinador · entrega 2026-11-13

Claude, 13/11/2026. Puesta al día pedida por Víctor a las 08:25 UTC: «Actualiza
las noticias, las ofertas y el gráfico de la evolución de la tokenización a
hoy… lo más rápido posible pero que esté bien hecho».

**Base:** la publicada `a58dd22d-98a3-f94e-ba66-46898162215a` (entrega
`2026-11-12`), leída como visitante a las 08:27 UTC (`lectura-publica/`).

**Fuentes de estas decisiones:** `expedientes/`, `grupos/*/resumen-*.md` y
`revision-independiente/`. En cada grupo revisó un agente distinto del que
investigó. Solo entra lo `confirmado` o lo `confirmado_con_cambios`, con las
correcciones obligatorias aplicadas. Cerrado a las 09:00 UTC.

## 1. Lo general

- **Etiqueta `2026-11-13`.** Las mismas 22 ofertas, en las mismas colecciones
  (8 / 13 / 1).
  - `verificadaEl = 2026-11-13` y `vigenciaDias = 7`: el último día vigente
    es el **20/11/2026**.
- **Radar:** `verificadoEl = 2026-11-13`, 69 de 69
  (`radar-contraste-2026-11-13.json`). Las dos fuentes de REGAFI, por su API
  pública a las 08:52 UTC, con la misma huella que el 12/11
  (`cambios-radar.json`, `radar-manual/`). centrifuge.io/terms dio 403 en la
  primera pasada y se volvió a capturar con el mismo método a las 08:55 UTC.
  No cambia ninguna dirección ni ningún texto.
- **Rutas legítimas:** `comprobar-rutas.mjs`, 77 de 78 abiertas a las 08:28
  UTC.
- **Noticias:** 5 «importantes» y ninguna de «Hoy»
  (`noticias/noticias-2026-11-13.json`). Verificación independiente
  «conforme» (`noticias/VERIFICACION.md`). Se publican en
  `rwadar-site/datos/noticias-v2.json` y, sin «imagen», en `noticias.json`.
- **Tokenización:** «Tokenización diaria» n.º 6 (manual, 08:39 UTC) con la
  foto del 13/11 en `datos-tokenizacion`; «Publicar web» la incluye.

## 2. Por oferta (antes → ahora)

- **Spiko Letras del Tesoro Euro:** rentabilidad publicada **2,41 % → 2,40 %**
  (VL del 12/11, 1,062803 €; 31 días, del 12/10 al 12/11). Métrica:
  «Rentabilidad publicada · 31 días · 12/11/2026: 2,40 %».
- **Spiko Letras del Tesoro Dólar:** **4,02 % → 3,98 % en USD** (VL del 12/11,
  1,102694 $; 13/10 → 12/11, el 12/10 fue festivo en EE. UU.). Métrica:
  «Rentabilidad publicada · 31 días · 12/11/2026 · en USD: 3,98 %».
- **Spiko Smart Cash Euro:** sigue en **2,84 %**, ahora con la VL del 12/11
  (1,017107 €). Métrica: «Rentabilidad publicada · neta y variable ·
  12/11/2026: 2,84 %».
- **Las tres de Spiko (corrección del revisor):** el claim `accesoEspana` y la
  referencia «Acceso desde España» de `documentacion-ofertas.json` pasan al
  literal «Last updated: November 6, 2026» y `fechaDato` 2026-11-06; en Smart
  Cash, el alcance «Tabla de disponibilidad de Spiko (23/10/2026)» pasa a
  «(06/11/2026)».
- **mTBILL:** sin cambios. Sin ronda nueva del oráculo desde el 10/11; siguen
  3,45 % (06/10 → 10/11) y el conflicto de reembolso 25 % / 15 %
  (`fuentes_en_conflicto`). Solo cambia la fecha de verificación.
- **Robinhood, Kraken xStocks y Prosegur Digital Gold:** sin cambios; solo la
  fecha. (Kraken: condiciones finales nuevas 4GLDx, tampoco con España.)
- **Brickwise (11):**
  - **Pottendorfer:** mínimo **80 € → 73 €** («Desde 73 € la participación en
    reventa (13/11)»); orden de menor importe 1 × 73 € (**74,10 €** con el
    1,5 %); «Participaciones en venta» 107 con fecha 13/11.
  - **Cohotel:** «Participaciones en venta» 65 → **59** (13/11); mínimo 102 €.
  - **GreenPoint:** 351 → **347** (13/11); mínimo 102 €.
  - **Schwarzer Weg:** 300 → **299** (13/11); mínimo 69,90 €.
  - **Randhartingergasse:** mejor oferta de compra 56 € → **64 €** (orden del
    12/11); mínimo 78 €.
  - **Hinterstoder, Drautalresidenz, Klagenfurt, Plüddemanngasse,
    Sonnleithnergasse y Stallhofstraße:** mismas cifras; solo la fecha 13/11.
  - El aviso común (compra parcial no confirmada y 1,5 % del comprador) sigue
    igual.
- **Suizas (Aktionariat, Boss Info, Switzerlend):** sin cambios de fondo; las
  fechas pasan al 13/11 (Switzerlend: «1 acción (68,01 CHF el 13/11)»; Boss
  Info: «unos 17 ZCHF el 13/11»).
- **Hausera (en camino):** sin cambios; Alicante 3 mantiene la preventa del
  18/11 a las 09:00. Se re-fecha al 13/11.

## 3. Candidatas

Hoy no entra ninguna (todas `no_admitir`, confirmadas por el revisor):
pagarés de Prosegur Cash, Securitize Stocks, bonos de Profitus/Axiology,
Valorix, CANDO1 (exchange.token-city.com vuelve a cargar, pero sigue «En
estudio») y Crypto.com Tokenized Stocks (UE), sin KID público.

## 4. Correcciones de los revisores (obligatorias en la entrega)

- **Principales:** las de `accesoEspana` de Spiko (§2).
- **Suiza:** cada `consultadoUtc` de los expedientes de Aktionariat, Boss
  Info y Switzerlend pasa a la hora real de su consulta de hoy
  (`grupos/suiza/inventario-consultas.json`, 08:31–08:34 UTC); ninguna hora
  copiada del 12/11 puede llegar a la entrega. Boss Info: la referencia
  «Última operación · 13/11/2026» sigue con la fuente
  https://shares.bossinfo.com/ (no la API getTrades, que da 405).
- **Vigilancia:** recortados los nombres de personas físicas en las copias
  de Bit2Me y Profitus; los originales, solo en `crudo/` (fuera de Git).
