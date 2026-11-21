# Encargo común · investigación del catálogo · 21 de noviembre de 2026

Víctor lo pidió el 21/11/2026 a las 17:34 UTC (18:34 en España), al ver en la
app la tarjeta de Próximas «Hausera · próximas ofertas · Mínimo: Desde 100 € en
Alicante 3 (20/11)»: «Y esta ya ha pasado por ejemplo es antigua, y no sé si ya
se puede seguir invirtiendo todos esos errores los tienes que corregir que el
lunes tenemos una reunión muy importante».

**Lo que pide, en concreto:**

1. Que no quede nada viejo ni pasado: fechas que ya pasaron, campañas cerradas,
   ofertas que ya no se pueden contratar.
2. Que en cada oferta quede claro, con fuente primaria de hoy, si un
   **particular residente en España puede invertir hoy** (sí, no o sin
   confirmar), y por qué.
3. Que las fechas de las tarjetas no confundan. Hoy «(20/11)» es el día en que
   se comprobó el dato, y se lee como si fuera la fecha de la oferta. En Próximas
   lo que importa es la fecha del evento (por ejemplo, «abre el 25/11»).

**Lo publicado hoy** (leído como visitante el 21/11 a las 17:36 UTC, en
`lectura-publica/`): revisión `94f7fd5d` (entrega `2026-11-20.2`), con 25
plataformas, 22 ofertas (8 principales, 13 de reventa y 1 en camino) y 5
descartadas. Las cifras son del **20/11** y caducan el 28/11 a las 00:00 UTC.

**Es una puesta al día, no una investigación desde cero.** El último ciclo
revisó las 22 ofertas con auditoría completa (`../2026-11-20-v2/`:
`DECISIONES-COORDINADOR.md`, `expedientes/`, `revision-independiente/`,
`auditoria/`). Comprueba con especial cuidado lo que pide Víctor: estado de
cada oferta, fechas y acceso desde España.

**El vigía** (`vigia.json`, 17:37 UTC, 45,8 s) dio 5 cifras que cambian, 72
que no cambian, 1 documento que cambia, 50 iguales y 2 búsquedas de la CNMV
que cambian:

- Spiko Euro (EUTBL): VL nueva del 22/11/2026 (1,063496 EUR); sin cifra
  publicada con la que comparar: léelo a mano.
- mTBILL: el PDF de condiciones finales (20260714_mTBILL_FT_signed_final.pdf)
  no tiene huella publicada: léelo como documento nuevo.
- Brickwise · Schwarzer Weg 18: mínimo 69,90 → 71,90 €; 298 → 297
  participaciones en venta.
- Hausera: las búsquedas «Hausera» y «Holdtx» en las advertencias de la CNMV
  pasan de «con resultados» a «sin advertencias»: compruébalo a mano (puede
  ser un cambio de la página de la CNMV, no del fondo).

Hoy:

1. Parte del vigía (ver el flujo): confirma en la fuente primaria cada
   «cambia», re-fecha lo que «no cambia» y abre a mano lo que no cubre.
2. **Sé rápido**, pero sin dejar nada sin mirar: acceso desde España, estado
   y fechas de cada oferta.

**Pendientes a resolver hoy con fuente primaria:**

- **Hausera · Alicante 3 (vigilancia y la ficha `hausera-proximas-ofertas`):**
  el 20/11 tenía la preventa abierta desde el 18/11 y la suscripción del 25/11
  al 30/06/2027. Hoy: qué dice su web (estado, fechas, botón), si ya se emitió
  algún token en Polygon, su inscripción en la CNMV y si un particular en
  España puede reservar o invertir hoy. Propón el texto de la tarjeta («mínimo
  corto», como mucho 40 caracteres) con la **fecha del evento**, no la de la
  consulta (por ejemplo, «Desde 100 € · abre el 25/11»), y lo mismo en los
  textos largos que digan «(20/11)» como si fuera una fecha de la oferta.
- **Brickwise · número fiscal austriaco:** Randhartingergasse 9 y Hinterstoder
  piden número fiscal austriaco (ya lo avisan). Para **cada** ficha de reventa
  de Brickwise: ¿lo exige para comprar? ¿Puede un particular residente en
  España sin él comprar hoy? Cita literal, URL y hora. Si no puede, propón
  `retirar_propuesta` (o «España: No», si la ficha debe quedarse) con el motivo.
  Y la orden de venta más barata de hoy (precio y cantidad) de cada una, en la
  API pública.
- **Spiko:** recalcula las tres métricas con la serie de VL de la API pública,
  con la fecha de la VL. Smart Cash Euro: si la CNMV, la AMF o la gestora
  confirman o niegan su comercialización en España.
- **mTBILL:** rentabilidad con la ronda más reciente del oráculo (misma regla
  de ventana), el PDF de condiciones finales y si el conflicto de límites de
  reembolso sigue; si sigue, `fuentes_en_conflicto`.
- **Robinhood, Kraken xStocks y Prosegur:** si siguen abiertas a particulares
  en España hoy. Kraken xStocks: el 11/11 lanzó tokens de más de 200 empresas
  de Reino Unido y la UE; mira si cambia algo de la ficha (condiciones finales,
  España).
- **Suizas (Aktionariat, BOSS Info, Switzerlend):** que sigan abiertas,
  comisiones y libro de órdenes de hoy.

Las reglas son las del 01/11 y el 03/11
(`../2026-11-01-v2/ENCARGO-INVESTIGADORES.md`,
`../2026-11-03.3-v2/ENCARGO-INVESTIGADORES.md`) y las «Normas de las
tarjetas» de `docs/tareas/CICLO-DIARIO-CATALOGO.md`:

- el formato del expediente, con `resumenTarjeta` y `consulta` en horas
  reales;
- un expediente por ficha, en `expedientes/<slug>.json`, con `"grupo"`;
- copias de lo leído en `grupos/<grupo>/fuentes/` y los crudos en `crudo/`
  (fuera de Git);
- sin nombres de personas físicas;
- una cifra que no se pueda leer hoy queda en `null`;
- nunca «por participación» en el mínimo.

**Punto de partida de cada ficha:**

- la publicada: `../2026-11-20.2-v2/escaparate-publicacion.json`;
- su documentación: `../2026-11-20.2-v2/documentacion-ofertas.json`;
- su último expediente: `../2026-11-20-v2/expedientes/<slug>.json` (y, si lo
  hay, `../2026-11-20.2-v2/expedientes/<slug>.json`, que es más nuevo).

**Candidatas a vigilar (grupo `vigilancia`):**

- los pagarés tokenizados de Prosegur Cash;
- Securitize Stocks;
- los bonos de Profitus/Axiology;
- Valorix (Bit2Me STX);
- CANDO1 (Token City);
- Crypto.com Tokenized Stocks (UE).

Solo `admitir_propuesta` con **todo** lo esencial respaldado hoy por fuente
primaria: entidad y registro, oferta abierta hoy, acceso desde España como
particular, mínimo, salida, riesgos y documentos públicos. Si falta algo,
`no_admitir` con el motivo concreto. Mejor ninguna que una dudosa. Una
candidata nueva necesita además imagen editorial y ficha el mismo día: si no
da tiempo con calidad, no se admite hoy.

Entrega: los expedientes, `grupos/<grupo>/resumen-<grupo>.md` e
`inventario-consultas.json`. Tu respuesta final es breve.
