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

> Borrador hecho con los expedientes. Se cierra con las correcciones de los
> revisores (§5).

- **Spiko Letras del Tesoro Euro:** 2,44 % → **2,41 %**, valor liquidativo
  (VL) más reciente: (1,062738 / 1,060588)^(365/31) − 1. Cambian la métrica, el
  literal y la referencia.
- **Spiko Letras del Tesoro Dólar:** 4,09 % → **4,02 %** en USD, con la VL del
  10/11. Cambian la métrica, el literal y la referencia.
- **Spiko Smart Cash Euro:** sigue en **2,84 %**, ahora con la VL del 10/11.
  Cambian la métrica, el literal y la referencia. El aviso 2 se mantiene: nadie
  confirma ni niega hoy que el compartimento se comercialice en España.
- **mTBILL:** «Valor por token · 10/11/2026: 1,0777 USD (oráculo del emisor)».
- **Brickwise, mínimos en reventa (11/11):**
  - Schwarzer Weg: 65 → **69,90 €**. La venta de 65 € ya no está.
  - Pottendorfer Straße 62: 74 → **73 €**.
  - Las otras 9 mantienen su precio y solo cambia la fecha.
  - En las referencias de la ficha, la mejor compra pasa de 35 a 60 € en
    Schwarzer Weg y de 46 a 56 € en Randhartingergasse.
- **Aktionariat, Boss Info y Switzerlend:** nada cambia de fondo. Las fechas
  del 10/11 pasan al 11/11 en «Precio del emisor», «Supervisor», los avisos con
  dato del día y el mínimo.
- **Robinhood, Kraken xStocks, Prosegur Digital Gold y Hausera:** sin
  cambios. Solo cambia la fecha de verificación.

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

(Pendiente: se rellena cuando terminen los revisores.)
