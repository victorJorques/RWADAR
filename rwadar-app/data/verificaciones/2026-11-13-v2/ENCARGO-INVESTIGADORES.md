# Encargo común · investigación del catálogo · 13 de noviembre de 2026

Víctor lo pidió el 13/11/2026 a las 08:25 UTC: «Actualiza las noticias, las
ofertas y el gráfico de la evolución de la tokenización a hoy, optimízalo para
hacerlo lo más rápido posible pero que esté bien hecho».

**Lo publicado hoy** (leído como visitante el 13/11 a las 08:27 UTC, en
`lectura-publica/`): revisión `a58dd22d` (entrega `2026-11-12`), con 25
plataformas, 22 ofertas (8 principales, 13 de reventa y 1 en camino) y 5
descartadas. Las cifras son del **12/11**.

**Es una puesta al día rápida, no una investigación desde cero.** Ayer se
revisaron las 22 ofertas (`../2026-11-12-v2/`: `DECISIONES-COORDINADOR.md`,
`expedientes/`, `revision-independiente/`).

Hoy:

1. **Vuelve a abrir hoy la fuente primaria** de cada dato de la tarjeta y de
   cada aviso con fecha o dato del día de tus fichas, y di qué cambia. Si no
   cambia nada, dilo con la fuente y la hora de la consulta de hoy.
2. Comprueba que los documentos sean los mismos (SHA-256 frente a los de
   ayer) y que no haya advertencias nuevas de la CNMV.
3. **Para las webs que bloquean:**
   - usa las rutas legítimas ya verificadas de
     `.claude/skills/investigacion-catalogo/acceso/ACCESO-FUENTES.md`;
   - el comprobador dio 77 de 78 rutas abiertas a las 08:28 UTC (8 con
     versión nueva: compruébalas en tus fichas);
   - no se elude ningún control.
4. **Sé rápido:** Víctor quiere el ciclo terminado hoy y rápido. No repitas
   lo que ya está bien documentado ayer si la fuente dice lo mismo: basta con
   la consulta de hoy, su hora y su SHA-256.

**Pendientes de ayer, a resolver hoy con fuente primaria:**

- **Spiko (grupo principales):** las VL nuevas que se publicaron el 12/11
  (18:00 y 19:30 UTC) y las que haya hoy. Recalcula las tres métricas con la
  serie de VL de la API pública, con fecha de la VL.
- **mTBILL (grupo principales):** la rentabilidad pasada con la ronda más
  reciente del oráculo del emisor (misma regla que ayer: ventana sin festivo
  que cuente un día de más) y si el conflicto de los límites de reembolso
  (25 % frente a 15 %) sigue igual. Si es así, el estado sigue en
  `fuentes_en_conflicto`.
- **Brickwise (grupo brickwise):** para cada ficha, la orden de venta más
  barata publicada hoy (precio y cantidad) en la API pública; las 4 fichas
  que ayer se quedaron con su fecha anterior en «Participaciones en venta».
- **Hausera (grupo vigilancia):** Alicante 3 tenía preventa el 18/11:
  comprueba si sigue esa fecha y qué publica hoy.

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

- la publicada: `../2026-11-12-v2/escaparate-publicacion.json`;
- su documentación: `../2026-11-12-v2/documentacion-ofertas.json`;
- su último expediente: `../2026-11-12-v2/expedientes/<slug>.json`.

**Candidatas a vigilar (grupo `vigilancia`):**

- los pagarés tokenizados de Prosegur Cash;
- Securitize Stocks;
- los bonos de Profitus/Axiology;
- Valorix (Bit2Me STX);
- CANDO1 (Token City);
- Hausera Alicante 3, con preventa el 18/11;
- Crypto.com Tokenized Stocks (UE).

Solo `admitir_propuesta` con **todo** lo esencial respaldado hoy por fuente
primaria: entidad y registro, oferta abierta hoy, acceso desde España como
particular, mínimo, salida, riesgos y documentos públicos. Si falta algo,
`no_admitir` con el motivo concreto. Mejor ninguna que una dudosa. Una
candidata nueva necesita además imagen editorial y ficha el mismo día: si no
da tiempo con calidad, no se admite hoy.

Entrega: los expedientes, `grupos/<grupo>/resumen-<grupo>.md` e
`inventario-consultas.json`. Tu respuesta final es breve.
