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
  - **Pottendorfer (corregido tras la revisión de la entrega, O1; ver §5):**
    mínimo **80 €, el mismo que lo publicado** («Desde 80 € la participación
    en reventa (13/11)»; a ese precio, 11 participaciones en una orden del
    08/02/2026); orden de menor importe 1 × 115 € (116,73 € con el 1,5 %), sin
    cambios; «Participaciones en venta» 107 → **106** (13/11); mejor compra
    19 € × 3 (06/11/2025), sin cambios. Es el libro leído a las 14:36:41 UTC
    (`correcciones-entrega/`). La orden de 1 × 73 € de las 08:30 UTC ya no
    existe.
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

## 5. Correcciones de la revisión de la entrega

Las escribe el montador el 13/11/2026 (14:36–14:45 UTC), porque las
correcciones obligatorias de las revisiones de la entrega lo piden.
**Confirmadas por el coordinador a las 15:25 UTC**, con la verificación final
«conforme» (`VERIFICACION-ENTREGA.md`: el SQL final `b6f0129c…e7b4`, revisión
`434217eb`, solo cambia la sentencia de Pottendorfer frente al revisado).

- **O1 (cumplimiento) · Pottendorfer.** La orden de 1 participación a 73 € en
  la que se basaban el mínimo y tres referencias ya no existe (el revisor de
  cumplimiento la buscó a las 14:16:58, 14:18:36 y 14:29:09 UTC). El montador
  volvió a leer la API pública de Brickwise justo antes de regenerar:
  - v1 `https://api.app.brickwise.at/api/v1/assets` a las 14:36:41 UTC,
    SHA-256 `3493ef7154650261601b851f4ba035313086253d5134e7c508cb26bc7648d29c`;
  - v2 `https://api.app.brickwise.at/api/v2/assets` a las 14:36:42 UTC,
    SHA-256 `6b1b2572dea8e79f12e27699336d40b8f712e6254e8b7f623ea43207097fa78d`.

  Son los mismos archivos que leyó el revisor, así que valen sus textos (§2).
  En los tres alcances del libro de Pottendorfer, la hora pasa a «(14:36
  UTC)». Las otras 10 fichas de Brickwise dan en esta lectura exactamente lo
  mismo que a las 08:30 UTC y se quedan con la de la mañana. El resumen sin
  direcciones está en
  `correcciones-entrega/libro-ordenes-resumen-2026-11-13-1436.json`. Las
  respuestas crudas están en `correcciones-entrega/crudo/`, fuera de Git.
- **O2 (cumplimiento) y C1 (SQL) · Datos personales en la copia de
  Profitus.** Recortados en
  `grupos/vigilancia/fuentes/profitus/nav-profitus-bonds-2026-11-13.txt` el
  nombre del fundador de Axiology (línea 124) y el nombre, el correo de
  trabajo y el teléfono directo de un empleado de Profitus (líneas 240, 244 y
  249). Con eso queda completo lo de §4 («Vigilancia»). No cambia el SQL.
- **R5 (SQL) · Lo que la entrega ya hacía y no estaba escrito aquí:**
  - En Boss Info, el alcance de «Última operación · 13/11/2026» cuenta la
    lectura en la cadena del revisor de Suiza (08:45:52 UTC: 8,2404 ZCHF para
    quien vendió y 0,1596 ZCHF de comisión). No se la atribuye al
    investigador.
  - En las fichas de Brickwise, la hora del libro de la mañana, «(08:30–08:33
    UTC)», va en los alcances de 30 referencias (tres por ficha, en 10
    fichas). En Pottendorfer va «(14:36 UTC)».
