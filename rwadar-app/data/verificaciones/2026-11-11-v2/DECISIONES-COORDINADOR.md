# Decisiones del coordinador · entrega 2026-11-11

Claude, 11/11/2026. Puesta al día pedida por Víctor («Actualiza las ofertas y
el gráfico y las noticias…»).

**Base:** la publicada `dfdc4c85-7f2f-fc4a-de27-a9f4a63f7656` (entrega
`2026-11-10`), leída como visitante a las 09:01 UTC (`lectura-publica/`).

**Fuentes de estas decisiones:** `expedientes/`, `grupos/*/resumen-*.md` y
`revision-independiente/`. En cada grupo revisó un agente distinto del que
investigó. Solo entra lo `confirmado` o lo `confirmado_con_cambios`, con las
correcciones obligatorias aplicadas.

## 1. Lo general

- **Etiqueta `2026-11-11`.** Las mismas 22 ofertas, en las mismas colecciones
  (8 / 13 / 1). Todas se revisaron hoy con sus fuentes primarias:
  `verificadaEl = 2026-11-11` y `vigenciaDias = 7`, así que el último día
  vigente es el **18/11/2026** y la guarda del SQL no deja aplicarla después.
  No hay altas ni retiradas.
- **Radar:** `verificadoEl = 2026-11-11`, 69 de 69
  (`radar-contraste-2026-11-11.json`). Las dos fuentes de REGAFI se leyeron por
  su API pública (`cambios-radar.json`, `verificacionesManuales`). No cambia
  ninguna dirección ni ningún texto, y no se toca `public.plataformas` ni
  `public.fuentes`.
- **Estados de revisión:** sin cambios. mTBILL sigue en
  `fuentes_en_conflicto`; reventa y próximas, en `no_verificable`.
- **Avisos:** se vuelven a fechar al 11/11 solo los que se han comprobado hoy.
  Los que llevan un dato del día se reescriben con el de hoy.
- **Tres datos de la tarjeta:** se conservan, con `fechaConsulta =
  2026-11-11`, salvo los que cambian abajo. En reventa, el mínimo va como
  «Desde X € la participación en reventa (11/11)».
- **`transparencia.json`:** se pone al día **después de aplicar**, con fecha
  11/11 solo donde el expediente de hoy volvió a consultar esa misma fuente.
  Además, el mínimo corto de Brickwise.

## 2. Por oferta (antes → ahora)

> Cerrado a las 10:10 UTC con las correcciones de los revisores (§5).

- **Spiko Letras del Tesoro Euro:** 2,44 % → **2,41 %**, valor liquidativo
  (VL) más reciente: (1,062738 / 1,060588)^(365/31) − 1. Cambian la métrica, el
  literal y la referencia.
- **Spiko Letras del Tesoro Dólar:** 4,09 % → **4,02 %** en USD, con la VL del
  10/11. Cambian la métrica, el literal y la referencia.
- **Spiko Smart Cash Euro:** sigue en **2,84 %**, ahora con la VL del 10/11.
  Cambian la métrica, el literal y la referencia. El aviso 2 se mantiene: nadie
  confirma ni niega hoy que el compartimento se comercialice en España.
- **mTBILL:** «Valor por token · 10/11/2026: 1,0777 USD (oráculo del emisor)».
  - Acceso en la tarjeta: «Sí: oferta pública en España para particulares». Se
    quita «la web de Midas incluye España entre sus países permitidos»: hoy no
    se puede volver a leer la web (§5, P2). Se apoya en las Condiciones
    Finales, ESMA y la CNMV, confirmados hoy.
  - Sigue en `fuentes_en_conflicto` y con la rentabilidad (APY) en `null`.
- **Brickwise, mínimos en reventa (11/11):**
  - Schwarzer Weg: 65 → **69,90 €**. La venta de 65 € ya no está.
  - Pottendorfer Straße 62: 74 → **73 €**.
  - Las otras 9 mantienen su precio y solo cambia la fecha.
  - En las referencias de la ficha, la mejor compra pasa de 35 a 60 € en
    Schwarzer Weg y de 46 a 56 € en Randhartingergasse.
- **Aktionariat, Boss Info y Switzerlend:** nada cambia de fondo (opción (a)
  del revisor). Se conservan los textos publicados de acceso y salida. Las
  fechas del 10/11 pasan al 11/11 en «Precio del emisor», «Supervisor», los
  avisos con dato del día y el mínimo:
  - Aktionariat: los tres textos publicados de la tarjeta no llevan fecha, así
    que se quedan igual.
  - Boss Info: mínimo «100 CHF por transferencia al emisor; en cripto, desde 2
    acciones (unos 17 ZCHF el 11/11)».
  - Switzerlend: mínimo «1 acción (68,01 CHF el 11/11)».
- **Robinhood, Kraken xStocks, Prosegur Digital Gold y Hausera:** sin
  cambios. Solo cambia la fecha de verificación.
  - Hausera: el contrato de Alicante 2 acuñó hoy 51.960 tokens (5.196.000 €,
    el total), aunque la CNMV aún no lista la SPV 10. Se corrige el
    expediente; la tarjeta no cambia.

## 3. Candidatas

Hoy no entra ninguna. Sigue la vigilancia de:

- Hausera Alicante 3: preventa el 18/11 y sin inscripción en la ERIR de
  Ursus-3.
- Pagarés tokenizados de Prosegur Cash.
- Securitize Stocks.
- Profitus.
- Valorix: valorix.es no responde.
- CANDO1: exchange.token-city.com está en mantenimiento («Sistema deshabilitado
  temporalmente»).

## 4. Noticias

8 → 6 noticias (`noticias/noticias-2026-11-11.json`): 1 de «Hoy» y 5 de
«Lo más importante», con su verificación (`noticias/VERIFICACION.md`). Se
copian a `rwadar-site/datos/noticias-v2.json` y, sin «imagen», a
`noticias.json` para las apps ya instaladas.

## 5. Correcciones de los revisores

Tres revisores independientes, uno por grupo. Veredicto de los tres:
`aprobado_con_cambios`. Todas las obligatorias están aplicadas:

**Principales** (Spiko, mTBILL, Robinhood, Kraken y Prosegur):

- **P1. Spiko:** 2,41 %, 4,02 % y 2,84 % confirmados con la API, la AMF y la
  CNMV. Smart Cash solo vale con la VL del 10/11 si la entrega se monta antes
  de las 19:30 UTC del 11/11. Si no, se vuelve a leer la API y se fecha con la
  del 11/11.
- **P2. mTBILL:** el código de la web se leyó a las 09:26 UTC
  (`main-DWqV5Q2W.js`). A las 09:46 ya servía otro (`main-BAiQCjKx.js`). Lo
  intenté releer a las 10:01 UTC: midas.app y sus `/assets/` responden 403 a
  toda lectura automática (curl, navegador sin cabeza y WebFetch). Así que la
  frase sobre la web sale de la tarjeta y de «por qué destaca». En las
  referencias queda con su hora. Corregido en `expedientes/mtbill.json`.
- **P3. Copias:** recortados los nombres de los directores en las cuatro
  `backed-ft-*.txt`, también los trozos partidos y transliterados (107
  líneas). Los testimonios de la web de Spiko solo están en `crudo/`, que no
  va a Git (`.gitignore`).
- Robinhood, Kraken xStocks y Prosegur, confirmados por muestreo y sin
  cambios.

**Reventa** (Brickwise, Aktionariat, Boss Info y Switzerlend):

- Los 11 mínimos de Brickwise, confirmados (Schwarzer Weg 69,90 €;
  Pottendorfer 73 €; el resto solo cambia de fecha).
- **C1–C3. Suizas:** se conservan los textos publicados (opción (a)). En
  `cambiosRespectoPublicado`, el «antes» de `resumenTarjeta` tiene que ser el
  texto publicado: corregirlo al montar. Re-fechas y mínimos como en §2.
- **C4. Copias:** los 11 PDF del grupo, a `crudo/`, con el inventario al día.
  Ya está hecho.

**Vigilancia** (Hausera y candidatas):

- Hausera, confirmada. Corrección del suministro de los tokens aplicada al
  expediente y a `resumen-vigilancia.md`.
- No se admiten: pagarés de Prosegur Cash, Securitize Stocks, Profitus,
  Valorix y CANDO1 (este, `no_verificable`).
- Recomendada y ya aplicada: en el resumen, «ninguna emitida en
  noviembre de 2026» en lugar de «ninguna fechada en noviembre».
- **Copias:** recortados los tres nombres del blog de Bit2Me. El original solo
  queda en `crudo/`.

**Barrido final de datos personales** (`recorte/barrido.py` y
`recortar.py`): 2 nombres más recortados en reventa. Lo demás que señala son
nombres de empresas.
