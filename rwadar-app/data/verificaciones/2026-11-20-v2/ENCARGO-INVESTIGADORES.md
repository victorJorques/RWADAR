# Encargo común · investigación del catálogo · 20 de noviembre de 2026

Víctor lo pidió el 20/11/2026 a las 16:51 UTC: «Actualiza las fichas y la
información de RWAdar, ofertas, noticias, todo antes de las 12 de la noche».

**Lo publicado hoy** (leído como visitante el 20/11 a las 16:52 UTC, en
`lectura-publica/`): revisión `434217eb` (entrega `2026-11-13`), con 25
plataformas, 22 ofertas (8 principales, 13 de reventa y 1 en camino) y 5
descartadas. Las cifras son del **13/11**: caducan hoy, 20/11, a las 24:00 UTC.
**Hay que publicar antes de las 23:00 UTC.**

**Es una puesta al día, no una investigación desde cero.** El último ciclo
revisó las 22 ofertas (`../2026-11-13-v2/`: `DECISIONES-COORDINADOR.md`,
`expedientes/`, `revision-independiente/`). Han pasado 7 días: comprueba con
especial cuidado avisos, condiciones, acceso desde España y estado de cada
oferta, que el vigía no cubre.

**El vigía** (`vigia.json`, 16:52 UTC, 21,5 s) dio 30 cifras que cambian, 47
que no cambian, 50 documentos con la misma huella y 29 búsquedas de la CNMV
iguales:
- Spiko: VL nuevas (EUTBL 19/11, USTBL 19/11, eurSAFO 20/11) y rentabilidad
  de tarjeta EUTBL 2,40 → 2,35 %, USTBL 3,98 → 3,97 %;
- mTBILL: oráculo 1,0789 USD (20/11) y rentabilidad de 5 semanas 3,46 %;
- Brickwise: libro de órdenes de casi todas las fichas de reventa
  (Pottendorfer mínimo 80 → 81 €, Cohotel 102 → 110 €, varias «mejor compra»
  y «participaciones en venta»).

El comprobador de rutas (16:52 UTC) da versión nueva en
`cryptocom/fsma-foris` y `midas/control-midas-docs` abierta de nuevo (200):
léelas en el grupo que corresponda.

Hoy:

1. Parte del vigía (ver el flujo): confirma en la fuente primaria cada
   «cambia»; re-fecha lo que «no cambia»; abre a mano lo que no cubre.
2. **Sé rápido:** el ciclo tiene que estar publicado esta noche. No repitas
   lo que el 13/11 ya dejó bien documentado si la fuente dice lo mismo: basta
   con la consulta de hoy, su hora y su SHA-256.

**Pendientes a resolver hoy con fuente primaria:**

- **Spiko:** recalcula las tres métricas con la serie de VL de la API
  pública, con fecha de la VL. Smart Cash Euro: si la CNMV, la AMF o la
  gestora confirman o niegan su comercialización en España.
- **mTBILL:** rentabilidad con la ronda más reciente del oráculo (misma regla
  de ventana) y si el conflicto de límites de reembolso (25 % frente a 15 %)
  sigue; si sigue, `fuentes_en_conflicto`.
- **Kraken xStocks:** si el emisor publicó condiciones finales con España.
- **Brickwise:** para cada ficha, la orden de venta más barata de hoy (precio
  y cantidad) en la API pública.
- **Hausera (vigilancia):** Alicante 3 tenía preventa el 18/11 y suscripción
  desde el 25/11: qué pasó y qué publica hoy; su inscripción en la CNMV.

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

- la publicada: `../2026-11-13-v2/escaparate-publicacion.json`;
- su documentación: `../2026-11-13-v2/documentacion-ofertas.json`;
- su último expediente: `../2026-11-13-v2/expedientes/<slug>.json`.

**Candidatas a vigilar (grupo `vigilancia`):**

- los pagarés tokenizados de Prosegur Cash;
- Securitize Stocks;
- los bonos de Profitus/Axiology;
- Valorix (Bit2Me STX);
- CANDO1 (Token City);
- Hausera Alicante 3;
- Crypto.com Tokenized Stocks (UE) (FSMA con versión nueva hoy).

Solo `admitir_propuesta` con **todo** lo esencial respaldado hoy por fuente
primaria: entidad y registro, oferta abierta hoy, acceso desde España como
particular, mínimo, salida, riesgos y documentos públicos. Si falta algo,
`no_admitir` con el motivo concreto. Mejor ninguna que una dudosa. Una
candidata nueva necesita además imagen editorial y ficha el mismo día: si no
da tiempo con calidad, no se admite hoy.

Entrega: los expedientes, `grupos/<grupo>/resumen-<grupo>.md` e
`inventario-consultas.json`. Tu respuesta final es breve.
