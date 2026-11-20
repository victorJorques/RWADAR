# Revisión independiente · grupo suiza · 20/11/2026

Revisor independiente (no preparé los expedientes). Abrí yo mismo las fuentes
entre las **17:03:53 y las 17:05:43 UTC** del 20/11/2026. Copias en
`revision-independiente/fuentes/suiza/` (inventario en
`inventario-revisor.json`; crudos en `crudo/`, fuera de Git).

**Veredicto global: aprobado.** Las tres fichas (aktionariat, boss-info,
switzerlend) se pueden «actualizar» como propone el investigador. No hay
cambios críticos, ni admisiones, ni retiradas. Todo lo que comprobé hoy
coincide con los expedientes y con el vigía.

## Qué comprobé, ficha por ficha

### Aktionariat (principales) · confirmado

- **Mínimo 500 CHF por transferencia.**
  `https://shares.aktionariat.com/api/brokerbotsettings?ticker=DAKS` (17:03:54Z):
  `bankTransferLimit: {enabled: true, min: 500}`, `onlyBuySide: true`,
  `disabledSellText: «the sell-side of the Brokerbot will remain disabled for the foreseeable future»`.
  SHA-256 `e0fccbb9…`, **idéntico al del vigía**.
- **Precio y recompra en cadena.** eth_call a `0x2f2c…350b`, bloque 26457681
  (17:04:51Z): `getPrice() = 7,25`, `settings() = 1` (recompra apagada). Igual
  que el vigía (bloque 26457619).
- **Venta más barata entre accionistas.** `getOrderBook {"company":77}`
  (17:04:21Z): asks 6,20 × 356; 6,25 × **1.135**; 6,80 × 40; 6,90 × 10;
  7,20 × 1.000; 8,50 × 1. Bids 6,10 × 10 … 1,00 × 20 (8 niveles). Coincide con
  el vigía (6,20 × 356) y con el expediente (incluido el cambio no publicado
  de 1.389 a 1.135 a 6,25). El SHA-256 difiere del vigía solo por el campo
  `whenUpdated` (marca de hora); el contenido es el mismo.
- **Actividad.** `getTrades` limit 5000 (17:04:23Z): 1.231 operaciones,
  SHA-256 `6f9b3656…`, el mismo que dio el investigador. Última compra al
  emisor 31/10/2026 (1 acción a 7,25). En la ventana 20/11/2025–20/11/2026: 22
  compras al emisor (5.783 acciones) y 52 entre accionistas (3.445): recalculado
  por mí, coincide.
- **Comisión 1,9 % a quien vende.** `secondarymarketsettings?ticker=DAKS`
  (17:03:56Z): `buyerFeeRate 0, sellerFeeRate 0.019` (SHA-256 `13275473…`,
  igual al del investigador). En cadena, el mercado `0x2b0f…6a9c` devuelve 190
  (comisión en puntos básicos) y 1 (abierto).
- **Acceso desde España.** `https://www.aktionariat.com/disclaimer`
  (17:03:57Z): «exclusively addressed to persons domiciled or resident in
  Switzerland or the EEA … limited to a total of €100,000». SHA-256 igual al
  del investigador (`bfadda50…`). Mismo texto en Investor Page Terms §9.1,
  «Version 1.0 • October 30, 2026».
- **Riesgo:** disclaimer «a loss of up to the entire capital invested may occur».
- **Supervisor:** FINMA autorizados «Aktionariat» = 0 resultados (17:05:33Z,
  SHA-256 `5bc7a552…`, igual que el investigador); control «Sygnum» = 1.
- **Documento:** Registration Agreement PDF (17:04:03Z) SHA-256 `9b4ebb70…`,
  **igual que el vigía**.
- **CNMV:** «Aktionariat» → «No hay datos disponibles» (17:04:05Z).

### Boss Info (reventa) · confirmado

- **Mínimo.** `brokerbotsettings?ticker=BOSS` (17:03:55Z):
  `bankTransferLimit min 100`, `cryptoPaymentsLimit min 9`. SHA-256 de la
  descarga `9a97fd74…`, **igual que el vigía**. Precio en cadena
  `getPrice() = 8,50197` (bloque 26457681): 2 acciones = 17,00 ZCHF, 1 acción no
  llega a 9. Confirma «unos 17 ZCHF».
- **Recompra:** `settings() = 1` en `0x3e73…4e69`; `disabledSellText`:
  «Aktuell ist der Ankauf von Aktien aufgrund eines Wartungsfensters
  deaktiviert». Ojo: el contrato tiene 2.491 ZCHF, pero la recompra está
  desactivada; el aviso «el emisor no recompra ahora» es correcto.
- **Libro** (17:04:22Z): solo una compra, 7,30 × 1.000; una venta, 8,40 × 103.
  Confirma que la orden 6,51 × 1.500 ya no está.
- **Última operación:** `getTrades` limit 5 (17:04:25Z), SHA-256 `2c23fd6b…`,
  **igual que el vigía**: 05/11/2026 13:35:35Z, 1 acción a 8,4. Historial
  completo (319 operaciones, SHA-256 `f02ec19d…`, igual al investigador):
  última compra al emisor el 29/06/2026; 12 meses: 10 al emisor (448), 71 entre
  accionistas (52.146). Coincide.
- **Comisión:** `sellerFeeRate 0.019` (SHA-256 `5aaeee13…`, igual); en cadena
  190 y abierto.
- **Acceso desde España:** `https://shares.bossinfo.com/investor-page-terms`
  (17:03:58Z) es el mismo archivo que el de Aktionariat (SHA-256 `c77ab1ca…`),
  §9.1 Suiza + EEE, tope 100.000 €. FAQ del emisor (17:04:01Z): la lista de
  países excluidos no incluye España.
- **Supervisor:** FINMA «Boss Info» = 0 (17:05:34Z, SHA-256 igual).
- **CNMV:** «Boss Info» → «No hay datos disponibles» (17:04:07Z).

### Switzerlend (reventa) · confirmado

- **Mínimo:** `brokerbotsettings?ticker=LENDS` (17:03:55Z) `min 0` en ambos
  medios; SHA-256 `d55580ec…`, el mismo que leyó el vigía. Precio en cadena
  `getPrice() = 68,0105` en `0x8d90…9b65`: «1 acción (68,01 CHF)» es correcto.
- **Recompra:** `settings() = 5` (0x1 + 0x4, sin 0x2) y saldo ZCHF del contrato
  0,03177 (bloque 26457681). **Igual que el vigía** (0,03 ZCHF).
- **Web frente a contrato:** `https://lend.ch/de/investor-relations`
  (17:03:59Z): «Du kannst an den Brokerbot zurückverkaufen, sofern dieser über
  genügend Liquidität verfügt». El conflicto sigue. El PDF del Token
  Shareholder Agreement (17:04:02Z) da SHA-256 `89647998…`, **igual que el
  vigía**.
- **Libro** (17:04:22Z): compra 59 × 4; ventas 67 × 15, 67,5 × 10, 67,9 × 25,
  68 × 150. Coincide.
- **Actividad:** 94 operaciones (SHA-256 `97a527d4…`, igual); última compra al
  emisor 07/10/2026 (10 acciones); 12 meses: 15 al emisor (54), 2 entre
  accionistas (2). Coincide.
- **Comisión:** `sellerFeeRate 0.019`; en cadena 190 y abierto.
- **Acceso:** mismas Investor Page Terms §9.1 (SHA-256 `c77ab1ca…`).
- **Supervisor:** FINMA «Switzerlend» = 0 (17:05:35Z); PolyReg
  `{"result": "true", "name": "Switzerlend AG"}` (17:04:04Z, SHA-256 `d7ca18f4…`,
  igual).
- **FINMA, lista de advertencias** (17:05:43Z): 2.407 entradas; ninguna
  contiene «Aktionariat», «Boss Info», «Switzerlend» ni «lend.ch».
- **CNMV:** «Switzerlend» → «No hay datos disponibles» (17:05:20Z).

## Muestreo de lo re-fechado con el vigía

Todos los datos marcados `segunVigia: true` en los tres expedientes están en
`vigia.json` como «no cambia»; ninguno como «cambia» ni «no se pudo leer».
Reabrí más de dos de ellos y coinciden:

| Dato | Vigía | Hoy (revisor) |
|---|---|---|
| Mínimo DAKS (brokerbotsettings) | `e0fccbb9…` | `e0fccbb9…` 17:03:54Z |
| Mínimo BOSS (brokerbotsettings) | `9a97fd74…` | `9a97fd74…` 17:03:55Z |
| Última operación BOSS (getTrades limit 5) | `2c23fd6b…` | `2c23fd6b…` 17:04:25Z |
| PDF LENDS Token Agreement | `89647998…` | `89647998…` 17:04:02Z |
| PDF DAKS Registration Agreement | `9b4ebb70…` | `9b4ebb70…` 17:04:03Z |
| Precios y recompra en cadena | 7,25 / 8,50197 / 68,0105; settings 1/1/5; 0,03 ZCHF | iguales, bloque 26457681 |
| Ventas más baratas | 6,20×356 / 8,40×103 / 67×15 | iguales (SHA distinto solo por `whenUpdated`) |
| CNMV (3 búsquedas) | sin advertencias | «No hay datos disponibles» (SHA distinto: página dinámica) |

## Tarjetas (resumenTarjeta)

Los nueve textos están en castellano llano, tienen 120 caracteres o menos
(el más largo, 118), no prometen nada, no dicen «por participación» y están
respaldados por las fuentes de hoy. En reventa no hay rentabilidad ni precio
principal; los 68,01 CHF y los «unos 17 ZCHF» son precio del emisor, con fecha,
no precio de reventa. Los cambios de fecha (13/11 → 20/11) en métricas y avisos
son correctos.

## Datos personales

Los expedientes, el resumen, el inventario y las copias de texto del grupo no
tienen nombres de personas ni datos personales. **Sí los hay en los crudos**
(fuera de Git): el `disabledSellText` de `boss-info-brokerbotsettings.json`
trae un correo personal de contacto, y la ficha de Zefix y las páginas HTML de
Boss Info traen nombres. No llegan a ninguna copia que vaya a Git ni a la
tarjeta. En mi propia copia recorté el correo.

## Bloqueos

- No se probó registro ni KYC (prohibido).
- No se publica cuánto queda del tope de 100.000 € del EEE.
- En Boss Info y Switzerlend, el acceso desde España sale de la plantilla común
  de condiciones del portal, no de la web propia del emisor (la FAQ de Boss
  Info no excluye a España).
- No abrí la pestaña «Sell» renderizada; la comisión la confirman la API y la
  lectura en cadena.

## Correcciones obligatorias

Ninguna. Recomendación (no obligatoria): no subir a Git los crudos de Boss Info
sin recortar el correo personal del `disabledSellText`. Si alguna vez se cita
ese texto en la ficha, basta con la primera frase.
