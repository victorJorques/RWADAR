# Decisiones del coordinador · entrega 2026-11-05

Claude, 05/11/2026. Ciclo pedido por Víctor («Hazme la investigación de hoy de
las ofertas, y actualiza la web y la app»). Base: la publicada `723968ce`
(entrega `2026-11-04.2`), leída como visitante a las 07:56 UTC
(`lectura-publica/`).

Fuentes de estas decisiones: `expedientes/`, `grupos/*/resumen-*.md` y los
informes de `revision-independiente/` (un revisor distinto por grupo).
**Solo entra lo que el revisor dejó `confirmado` o `confirmado_con_cambios`,
con sus correcciones obligatorias aplicadas. Lo `rechazado` no entra, salvo
cuando el propio revisor da el texto que lo sustituye.**

## 1. Lo general

- **Etiqueta `2026-11-05`.** Las 24 ofertas, revisadas hoy con fuentes
  primarias: `verificadaEl = 2026-11-05`, `vigenciaDias = 7` (vencen el 12/11).
  Las mismas 24, en las mismas colecciones (8 / 13 / 3). Sin altas ni retiradas.
- **Radar:** `verificadoEl = 2026-11-05` con `radar-contraste-2026-11-05.json`
  (67/67; dos fuentes de REGAFI leídas por su API porque la página daba 502:
  `cambios-radar.json`, `verificacionesManuales`). La fuente `paxg-web` pasa a
  `https://www.paxg.com/` y cambian los textos de PAX Gold de `cambios-radar.json`.
  El resto del radar no cambia.
- **Estados de revisión:** no cambian (principales `actual`, mTBILL
  `fuentes_en_conflicto`, reventa y próximas `no_verificable`, como exige la
  base de datos para las documentales).
- **Avisos:** cada aviso publicado se comprobó hoy (los informes lo dicen
  uno a uno) y pasa a `verificadaEl = 2026-11-05`. Los que llevan fecha o dato
  del día se reescriben con el dato de hoy (abajo).
- **Tres datos de la tarjeta** (referencias con etiqueta fija «Mínimo de
  inversión», «Acceso desde España», «Salida»/«Reembolso»): los publicados se
  conservan con `fechaConsulta = 2026-11-05` salvo los que cambian abajo.
- **Brickwise, formato del mínimo en reventa:** «Desde X € la participación en
  reventa (05/11)». El revisor propuso «… por participación …», pero el lector
  de la tarjeta (`ficha-editorial-20261022.js`, `resumenOferta`) descarta un
  mínimo cuyo valor contenga «por participación»: dejaría la tarjeta sin
  mínimo. «la participación» dice lo mismo y no deja de verse. Tampoco se dice
  «1 participación», que el revisor pidió quitar (no siempre hay una orden de
  una sola).
- **`transparencia.json`** (textos cortos y comprobaciones de la tarjeta) se
  pone al día **después de aplicar** el SQL, en `despues-de-aplicar.mjs`
  (fecha 05/11, mínimos cortos nuevos, motivos corregidos), para que la web
  publicada nunca enseñe una fecha que el catálogo en línea aún no tiene.

## 2. Por oferta (antes → ahora)

### Spiko Letras del Tesoro Euro
- Rentabilidad 2,34 % → **2,39 %** (rendimiento neto anualizado de 31 días que
  publica Spiko, VL del 04/11/2026, consultado el 05/11/2026). Métrica,
  literal y referencia «Rentabilidad publicada · 31 días».
- Quitar de la ficha las cifras viejas que el revisor señaló: «Último NAV
  publicado» y «NAV publicado» (1,0597 €, 28/09), «Valor liquidativo ·
  22/10/2026» (1,0613 €), «Patrimonio gestionado · 22/10/2026» (467,94 M€) y
  «Patrimonio y partícipes · consulta 01/11/2026» (444,52 M€).
- `transparencia.json`, `documentoEspana.motivo`: no presentar «el fondo ya
  existía cuando su SICAV se inscribió» como prueba (revisor). Texto nuevo:
  «KID oficial en español para todo inversor; la SICAV figura en la CNMV
  (n.º 2380) y la tabla de países de Spiko marca España.»

### Spiko Letras del Tesoro Dólar
- Rentabilidad 3,95 % → **3,99 %** en USD (VL del 04/11/2026). Métrica,
  literal y referencia.
- Referencia «Precio · consulta 01/11/2026»: su alcance decía que la cifra de
  GECO en euros «corresponde a la clase EUR no cubierta». Es falso: es la clase
  USD expresada en euros (revisor). Se corrige el alcance.
- `transparencia.json`: mismo cambio de motivo que el Euro.

### Spiko Smart Cash Euro
- Rentabilidad **2,84 %** con fecha nueva (VL del 04/11, consulta del 05/11).
  Métrica, literal y referencia.
- «Acceso desde España»: se conserva el texto publicado (el revisor exige
  registrar el cambio propuesto o mantener el publicado; se mantiene).
- Los siete avisos siguen vigentes (comprobados hoy).

### Robinhood Classic Stock Tokens
- Sin cambios críticos. Métrica «Salida» → «Vendes a Robinhood en la app, 24/5;
  puede suspender el cierre» (revisor: confirmado).

### Kraken xStocks
- Sin cambios: las condiciones finales siguen solo con Liechtenstein y Suiza;
  el primer aviso se queda.

### Prosegur Digital Gold
- Sin cambios en la tarjeta.

### mTBILL
- Métrica «Valor por token · 02/11/2026: 1,0769 USD» → «Valor por token ·
  04/11/2026: 1,0773 USD (oráculo del emisor)».
- Referencia nueva de la ficha (no de tarjeta): «Países de oferta según la web
  de Midas · consulta 05/11/2026», con España entre las 14 jurisdicciones
  permitidas del aviso v1.0.2 (mismas que las Condiciones Finales). Sin cambiar
  `estadoRevision` (sigue el conflicto de límites de reembolso).

### Aktionariat
- Comisión entre accionistas: 0 % → 0 % quien compra y **1,9 % quien vende**.
  Aviso nuevo: «Si vendes a otro accionista pagas una comisión del 1,9 %.»
- Aviso de vendedores por debajo del precio del emisor: «(6,20 ZCHF frente a
  7,25 CHF el 05/11/2026)».
- Métrica «Supervisor»: «Sin supervisión prudencial: no figura en el registro
  de autorizados de FINMA (05/11/2026)» (corrección obligatoria del revisor;
  no «Ninguno»).

### Boss Info (reventa)
- «Acceso desde España» (referencia de tarjeta): «Sí para comprar al emisor,
  según las condiciones del portal: Suiza y EEE, con tope total de 100.000 € en
  el EEE». El aviso «Acceso desde España no confirmado…» se sustituye por uno
  con lo mismo y la fuente (condiciones del portal §9.1, versión 30/10/2026).
- «Mínimo de inversión»: «100 CHF por transferencia al emisor; en cripto, desde
  2 acciones (unos 17 ZCHF el 05/11)» (corrección obligatoria).
- Comisión de venta entre accionistas del 1,9 % (aviso). Aviso nuevo: la FAQ
  del emisor explica el XCHF, pero el portal liquida en ZCHF (Frankencoin).
- Métrica «Supervisor» con la misma redacción que Aktionariat (05/11).

### Switzerlend (reventa)
- «Acceso desde España» como Boss Info. Se sustituye el aviso «el portal no
  publica países admitidos».
- Comisión de venta del 1,9 % (aviso).
- Aviso de la recompra: «desactivada y casi sin fondos (0,03 ZCHF) el
  05/11/2026», y que el acuerdo firmado no obliga al emisor a recomprar.
- Aviso nuevo: «Entre accionistas hay vendedores por debajo del precio del
  emisor (venta más barata 67,00 ZCHF el 05/11/2026).»
- «Mínimo de inversión»: 1 acción (68,01 CHF el 05/11).

### Brickwise, 11 de reventa
Mínimo (precio por participación de la venta más barata del día, API y app):

| Ficha | 03/11 | 05/11 |
|---|---|---|
| Plüddemanngasse 101 (Graz) | 80 | **75** |
| Sonnleithnergasse 2 (Viena) | 75 | 75 |
| Local de estanco (Klagenfurt) | 95 | 95 |
| Stallhofstraße 28 (Gratwein) | 69,90 | 69,90 |
| Schwarzer Weg 18 (Graz) | 69,90 | **66,67** |
| Drautalresidenz (Paternion) | 70 | 70 |
| Randhartingergasse 9 (Viena) | 78 | 78 |
| Hinterstoder 50 | 72 | **77** |
| Pottendorfer Straße 62 (Wr. Neustadt) | 78 | **74** |
| Fotovoltaica Greenpoint | 100 | 100 |
| Fotovoltaica Cohotel | 110 | 110 |

- «Acceso desde España» (las 11 y BILLA): «Sin confirmar: cuenta para
  residentes del EEE (España incluida); no consta que esta emisión se
  distribuya en España.» (revisor: confirmado).
- Avisos de alquiler con fecha (revisor): Plüddemanngasse «terminó el
  31/07/2024 y la API no informa de otro»; Sonnleithnergasse «la API fija el fin
  el 29/11/2026, pero su texto dice que terminó el 30/09/2023 por rescisión y
  que se busca inquilino»; Schwarzer Weg «terminó el 30/08/2023…»;
  Pottendorfer «terminó el 30/11/2025…»; Stallhofstraße y Randhartingergasse,
  sin cambios.
- Pottendorfer, «Salida»: «Primera cancelación a los 15 años de la emisión;
  antes, solo vendiendo en la app si hay comprador (1,5 % de comisión)».
- Referencias de la ficha con «mejor oferta de compra»: solo las que el revisor
  confirmó; en Pottendorfer (19,00 €) y Schwarzer Weg (35,00 €) se corrigen o
  se quitan, como pide el revisor.

### Terreno con arrendamiento BILLA (próxima)
- Métrica y aviso del umbral con fecha 05/11: 82 de 5.000 participaciones
  (1,64 % del mínimo de 500.000 €). Plazo vencido el 16/05/2026 sin prórroga en
  la API (aviso vigente). Desistimiento de 14 días, vigente.

### Casa de Outeiro (próxima)
- Métrica «Recaudado · 05/11/2026: 1.121.000 € de un mínimo de 2.000.000 €».
- Aviso del plazo: «La campaña en Alius tenía fin el 31/10/2026 y el 05/11/2026
  seguía sin días restantes ni ampliación, aunque la ficha de datos del 30/10
  cita el 31/03/2027. Confirma en Alius si sigue abierta antes de invertir.»

### Hausera · próximas ofertas
- Estado en el texto: preventa de Alicante 2 desde el 04/11; oferta pública
  anunciada para el 11/11/2026.
- «Mínimo de inversión»: «100 € según la FAQ de Hausera (05/11); las
  condiciones de Alicante 2 están en su documento de emisión, aún no público.»
  (texto del revisor, que rechazó «sin publicar»).
- Aviso: «Apuntarte a la preventa no te obliga, pero si firmas el acuerdo de
  reserva debes transferir el dinero en el plazo fijado. El 05/11/2026 el
  documento de emisión de Alicante 2 y su emisor no eran públicos.»
- El lugar de la ilustración (Orihuela Costa) no se cambia hoy: pide rehacer
  la imagen; queda anotado.

## 3. Candidatas

Ninguna se admite hoy: Bit2Me STX (bono Valorix, diciembre), Hausera ETI
(nota estructurada sin token), BeToken, Token City CANDO1 («en estudio»), OKX
Europe xStocks, Crypto.com Tokenized Stocks, Assetera/Ondo, Bybit EU y Franklin
grBENJI. Motivos en sus expedientes.

## 4. Datos personales

El revisor de `espana-proximas` señaló nombres de personas físicas (los
promotores que nombra la página pública de la campaña) en copias de Alius. Se
recortan en las copias de hoy antes de unir la rama. Las copias de
`2026-11-01-v2` y `2026-11-03.3-v2` que ya están en `main` tienen lo mismo:
pendiente aparte.
