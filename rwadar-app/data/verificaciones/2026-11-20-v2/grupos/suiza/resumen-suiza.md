# Grupo suiza · 20/11/2026

Revisé las tres fichas publicadas de los portales de Aktionariat: **aktionariat**
(principal), **boss-info** y **switzerlend** (reventa). Consulta entre las
16:54 y las 17:03 UTC.

## Cómo lo hice

- **Vigía** (`vigia.json`, 16:52:42Z, base `2026-11-13-v2`): sirve para hoy.
  Para mis tres fichas no da ningún «cambia» ni ningún «no se pudo leer». Las
  cifras que da como «no cambia» (precio del emisor, recompra, mínimos, venta
  más barata, última operación de Boss Info y fondos de recompra de
  Switzerlend), los tres PDF con la misma huella y las seis búsquedas de la CNMV
  van re-fechados con su hora y su SHA-256, marcados `segunVigia: true`.
- **A mano** (lo que el vigía no cubre): las API de los tres portales (ajustes,
  libro de órdenes e historial completo de operaciones), las condiciones del
  portal (§9.1, acceso Suiza + EEE), el aviso legal de Aktionariat, las páginas
  de inversores de Boss Info y de LEND, el Token Holder Agreement de DAKS, el
  Registration Agreement de LEND, Zefix, PolyReg, el registro de autorizados de
  FINMA y su lista de advertencias, las páginas renderizadas (portada, invest y
  trade de cada portal) y lecturas propias en cadena (comisión, mercado abierto
  y saldos de los contratos de venta).

## Qué cambia en cada ficha

**Aktionariat:** nada de fondo. El emisor sigue vendiendo a 7,25 CHF. El mínimo
sigue en 500 CHF por transferencia y el acceso en Suiza + EEE. El emisor no
recompra y no hay operaciones nuevas desde el 31/10. La venta más barata entre
accionistas sigue en 6,20 ZCHF (356 acciones). Solo bajan las acciones en venta
a 6,25 (de 1.389 a 1.135), que no salen en la tarjeta. Las fechas de «Precio
del emisor», «Supervisor» y del aviso de vendedores por debajo del emisor pasan
al 20/11. Decisión: **actualizar** (sigue en principales).

**Boss Info:** nada de fondo. El emisor sigue a 8,50 y nadie le compra desde el
29/06/2026. La última operación sigue siendo la del 05/11 (1 acción a 8,40). La
venta más barata sigue en 8,40 × 103 y el emisor no recompra. Único cambio: ha
desaparecido la orden de compra de 1.500 acciones a 6,51, y ahora solo hay un
comprador (1.000 a 7,30). Tampoco sale en la tarjeta. Las fechas del mínimo, de
«Supervisor», del aviso del precio y de «Última operación» pasan al 20/11.
Decisión: **actualizar** (reventa).

**Switzerlend:** nada cambia. El emisor sigue a 68,0105 y su última venta fue
el 07/10. El libro está igual (compra 59 × 4, venta más barata 67 × 15). La
recompra sigue apagada con 0,03 ZCHF, y sigue el choque entre la web de LEND
(«puedes revender al Brokerbot») y el contrato. Las fechas del mínimo, de
«Supervisor» y de los avisos de recompra y de precio pasan al 20/11. Decisión:
**actualizar** (reventa).

Las cifras de 12 meses de los expedientes se recalcularon con la ventana de hoy
(Aktionariat 22 compras al emisor, Switzerlend 15). Bajan solo porque salen de
la ventana operaciones de noviembre de 2025. No van en la tarjeta.

## Registros y advertencias

- FINMA, registro de autorizados: ninguna de las tres sociedades. Las
  respuestas son idénticas a las del 13/11 (controles Maerki Baumann y Sygnum =
  1).
- PolyReg: solo Switzerlend está afiliada (blanqueo, no supervisión prudencial).
- FINMA, lista de advertencias: 2.407 entradas, ninguna de estas sociedades.
- CNMV: sin advertencias (según el vigía, 6 búsquedas).
- Zefix: las tres fichas son idénticas a las del 13/11.

## Bloqueos y límites

- No se probó el registro ni el KYC (prohibido).
- No se publica cuánto queda del tope de 100.000 € para el EEE.
- En Boss Info y Switzerlend el acceso desde España sale de la plantilla común
  de condiciones del portal, no de la web propia del emisor.
- Hoy no se abrió la pestaña «Sell». La comisión del 1,9 % se apoya en la API
  (mismo SHA-256 que el 13/11) y en `tradingFeeBips()=190`, leído hoy en
  cadena.
- La página publicada marca boss-info y switzerlend con
  `estadoRevision: no_verificable` y `disponibleEs: null`. Lo segundo es por la
  regla de la base de datos para «secundario». Lo primero lo decide la entrega,
  no este grupo.

No hay candidatas en este grupo hoy.
