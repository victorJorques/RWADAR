# Grupo suiza · 21/11/2026

Revisé las tres fichas publicadas de los portales de Aktionariat:
**aktionariat** (principal), **boss-info** y **switzerlend** (reventa). Las
consultas fueron entre las 17:42 y las 17:57 UTC.

## La respuesta corta a lo que pide Víctor

| Ficha | ¿Sigue abierta? | ¿Puede invertir hoy un particular en España? | Qué cambia hoy |
|---|---|---|---|
| Aktionariat | Sí: el emisor vende a 7,25 CHF | **Sí**, según el aviso legal y las condiciones del portal (Suiza + EEE). Hay un tope de 100.000 € para todo el EEE y no se publica cuánto queda | **Hoy, a las 08:01–08:02 UTC, se vendieron 77 acciones entre accionistas a 6,10, 6,00 y 5,00 ZCHF.** El emisor sigue pidiendo 7,25. Hay que cambiar el aviso de precios |
| Boss Info | Sí: el emisor vende a 8,50 CHF (nadie le compra desde el 29/06/2026) | **Sí**, según las condiciones del portal (Suiza + EEE, mismo tope). La lista de países excluidos del emisor no incluye a España | Nada de fondo. Solo aparecen dos compras pequeñas en el libro |
| Switzerlend | Sí: el emisor vende a 68,01 CHF | **Sí**, según las condiciones del portal (Suiza + EEE, mismo tope) | Nada de fondo |

En las tres:

- hay que **registrarse en el portal** (no lo probé, está prohibido);
- **el emisor no recompra**: para vender hay que encontrar a otro accionista y
  cobrar en Frankencoin (ZCHF) con un monedero propio;
- **vender cuesta un 1,9 %**. Hoy lo vi en la propia página: al pulsar la
  pestaña «Sell» sale «Fee (1.9%)», y al comprar, «Fee (0%)». Antes solo
  estaba en la API y en el contrato.

## Cómo lo hice

- **Vigía** (`vigia.json`, 17:37:41Z, base `2026-11-20.2-v2`): sirve para hoy.
  Para mis tres fichas no da ningún «cambia» ni ningún «no se pudo leer».
  Las cifras «no cambia» (precio del emisor, recompra, mínimos, venta más
  barata, última operación de Boss Info y fondos de recompra de Switzerlend),
  los tres PDF con la misma huella y las seis búsquedas de la CNMV van
  re-fechados con su hora y su SHA-256, con la marca `segunVigia: true`.
- **A mano** (lo que el vigía no cubre):
  - las API de los tres portales (ajustes, libro de órdenes, historial
    completo y comisiones);
  - las condiciones del portal (§9.1, acceso Suiza + EEE; mismo archivo que el
    20/11);
  - el aviso legal y los términos de Aktionariat;
  - las páginas de inversores de Boss Info y de LEND (mismo texto que el
    20/11);
  - el Token Holder Agreement de DAKS, el Registration Agreement de LEND y el
    Token SHA de LEND (mismo SHA-256);
  - Zefix, PolyReg, el registro de autorizados de FINMA y su lista de
    advertencias;
  - las nueve páginas renderizadas (portada, invest y trade), más la pestaña
    «Sell» de cada portal;
  - lecturas propias en cadena: comisión, mercado abierto, saldos de los
    contratos de venta y los recibos de las tres ventas de DAKS de hoy.

## Qué cambia en cada ficha

**Aktionariat (principales): actualizar.**

- Hoy se vendieron 10 acciones a 6,10, 5 a 6,00 y 62 a 5,00 ZCHF entre
  accionistas. Lo comprobé también en la cadena de bloques: tres transacciones
  correctas en el contrato del mercado. El emisor sigue a 7,25 CHF, y la venta
  más barata sigue en 6,20 ZCHF (356 acciones).
- La demanda visible baja: la mejor compra pasa de 6,10 a 5,01 ZCHF, y las
  acciones pedidas, de 155 a 78.
- La portada del portal enseña ahora «Current Price CHF 5» y una
  capitalización de 8,9 millones de CHF. Son cifras de la última operación,
  no del precio del emisor.
- Aviso nuevo propuesto: «Entre accionistas se vende por debajo del precio
  del emisor (7,25 CHF): el 21/11/2026 la venta más barata era de 6,20 ZCHF y
  ese día se cruzaron 62 acciones a 5,00 ZCHF.»
- **Referencias viejas de la ficha que hay que quitar**, porque hoy ya son
  falsas o están pasadas: «Último cruce 6,25» de septiembre (está dos veces),
  «Último cruce secundario 30/09», «Última operación 14/10», la capitalización
  del 22/10, el libro del 01/11, las «operaciones recientes» del 01/11 y la
  verificación de identidad (ese campo ya no se publica). En su lugar van
  «Última compra al emisor (31/10/2026)», «Última operación entre accionistas
  (5,00 ZCHF, 21/11/2026)» y «Salida · 21/11/2026».
- El mínimo (500 CHF) y el acceso no cambian.

**Boss Info (reventa): actualizar.**

- No cambia nada de fondo: el emisor está a 8,50, la última operación es del
  05/11 (1 acción a 8,40), la venta más barata está en 8,40 × 103 y la mejor
  compra en 7,30 × 1.000.
- Aparecen dos compras pequeñas nuevas (5 a 5,00 y 10 a 3,00).
- El mínimo pasa de «unos 17 ZCHF el 20/11» a «unos 17 ZCHF, precio a 21/11».
  Así la fecha se lee como el día del precio y no como una fecha de la oferta.
- Hay que quitar de la ficha la capitalización del 22/10 (71,3 millones). Hoy
  el portal enseña otra (89,4 millones), y no ayuda a decidir. También sobran
  duplicados del 30/09 y del 01/11.

**Switzerlend (reventa): actualizar.**

- No cambia nada: el emisor está a 68,0105 y su última venta fue el 07/10. El
  libro sigue igual (compra 59 × 4, venta más barata 67 × 15). La recompra
  sigue apagada, con 0,03 ZCHF.
- Sigue el choque entre la web de LEND («puedes revender al emisor») y el
  contrato.
- El mínimo pasa de «1 acción (68,01 CHF el 20/11)» a «1 acción (68,01 CHF el
  21/11, precio del emisor)». El mínimo corto pasa de «1 acción (68,01 CHF,
  20/11)» a «1 acción (68,01 CHF a 21/11)». Se conserva «(68,01 CHF el …»
  porque el vigía lee de ahí el precio.
- «Clase» queda más exacta, según el Token SHA §2 (releído hoy, mismo
  SHA-256): «Preferente C1: en una venta o liquidación cobra hasta 53,72 CHF,
  después de las preferentes de rango superior». Esa preferencia es menor que
  el precio del emisor (68,01).
- Hay que quitar de la ficha referencias viejas o mal nombradas: los «cruces»
  del 25/09 eran compras al emisor, y sobran el libro del 01/11 (67,50, hoy
  67,00), «Total 408,07 CHF» como mínimo, la capitalización y los accionistas
  del 30/09.

En las tres fichas pasan al 21/11 las fechas de «Supervisor» y de los avisos
con fecha.

## Registros y advertencias

- **FINMA, registro de autorizados:** ninguna de las tres sociedades. Las
  respuestas son idénticas a las del 20/11. Controles: Maerki Baumann = 1 y
  Sygnum = 1.
- **PolyReg:** solo Switzerlend está afiliada. Eso es control de blanqueo, no
  supervisión financiera.
- **FINMA, lista de advertencias:** 2.407 entradas (la más reciente del
  13/11/2026). Ninguna es de estas sociedades.
- **CNMV:** sin advertencias, según el vigía (6 búsquedas).
- **Zefix:** las tres fichas son idénticas a las del 20/11.

## Algo que Víctor debe saber antes del lunes

En la lectura pública de hoy (`lectura-publica/ofertas-v2.json`), Boss Info y
Switzerlend salen con el resumen «Condiciones pendientes de nueva revisión»,
`estado_revision: no_verificable` y `disponible_es: null`. Les pasa también a
todas las demás de reventa y a Hausera; mTBILL sale con el mismo resumen y
`fuentes_en_conflicto`. Lo de `disponible_es` es una
regla de la base de datos para «secundario». El estado `no_verificable` lo
decide la entrega, no este grupo. Si en la web o la app se ve ese texto, al
visitante le parecerá que la ficha está rota, aunque hoy está comprobada.

## Bloqueos y límites

- No se probó el registro ni el KYC.
- No se publica cuánto queda del tope de 100.000 € para el EEE. El «sí» de
  España puede dejar de valer sin aviso si el tope se agota.
- En Boss Info y Switzerlend, el acceso desde España sale de la plantilla
  común de condiciones del portal, no de la web propia del emisor.
- No leí los estatutos de Switzerlend. No se puede precisar qué clases van
  por delante de C1.

No hay candidatas en este grupo hoy.
