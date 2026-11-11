# Encargo común · investigación del catálogo · 11 de noviembre de 2026

Víctor lo pidió el 11/11/2026 hacia las 08:55 UTC: «Actualiza las ofertas y el
gráfico y las noticias…».

**Lo publicado hoy** (leído como visitante el 11/11 a las 09:01 UTC, en
`lectura-publica/`): revisión `dfdc4c85` (entrega `2026-11-10`), con 25
plataformas, 22 ofertas (8 principales, 13 de reventa y 1 en camino) y 5
descartadas. Las cifras son del **10/11**.

**Es una puesta al día, no una investigación desde cero.** El ciclo de ayer
revisó a fondo las 22 ofertas y unas 30 candidatas
(`../2026-11-10-v2/`: `DECISIONES-COORDINADOR.md`, `expedientes/`,
`revision-independiente/`). Hoy:

1. **Vuelve a abrir hoy la fuente primaria** de cada dato de la tarjeta y de
   cada aviso con fecha o dato del día de tus fichas, y di qué cambia:
   rentabilidades de Spiko, libros de órdenes de Brickwise, Aktionariat, Boss
   Info y Switzerlend, valor de mTBILL, estado de Hausera y las demás.
   Si no cambia nada, dilo con la fuente y la hora de la consulta de hoy.
2. Comprueba que los documentos sean los mismos (SHA-256 frente a los de
   ayer) y que no haya advertencias nuevas de la CNMV.
3. Lo demás, como ayer.

Las reglas son las del 01/11 y el 03/11
(`../2026-11-01-v2/ENCARGO-INVESTIGADORES.md`,
`../2026-11-03.3-v2/ENCARGO-INVESTIGADORES.md`) y las «Normas de las
tarjetas» de `docs/tareas/CICLO-DIARIO-CATALOGO.md`:

- el formato del expediente, con `resumenTarjeta` y `consulta` en horas reales;
- un expediente por ficha, en `expedientes/<slug>.json`, con `"grupo"`;
- copias de lo leído en `grupos/<grupo>/fuentes/` y los crudos en `crudo/`
  (fuera de Git);
- sin nombres de personas físicas;
- una cifra que no se pueda leer hoy queda en `null`;
- nunca «por participación» en el mínimo.

**Punto de partida de cada ficha:**

- la publicada: `../2026-11-10-v2/escaparate-publicacion.json`;
- su documentación: `../2026-11-10-v2/documentacion-ofertas.json`;
- su último expediente: `../2026-11-10-v2/expedientes/<slug>.json`.

**Candidatas a vigilar (grupo `vigilancia`)**, que ayer no entraron:

- los pagarés tokenizados de Prosegur Cash (ERIR de Minos, 06/11);
- Securitize Stocks (Securitize Europe, S.V.);
- los bonos digitales de Profitus/Axiology;
- el bono Valorix (Bit2Me STX);
- CANDO1 (Token City);
- Hausera Alicante 3, con preventa el 18/11.

Solo `admitir_propuesta` con **todo** lo esencial respaldado hoy por fuente
primaria: entidad y registro, oferta abierta hoy, acceso desde España como
particular, mínimo, salida, riesgos y documentos públicos. Si falta algo,
`no_admitir` con el motivo concreto. Mejor ninguna que una dudosa.

Entrega: los expedientes, `grupos/<grupo>/resumen-<grupo>.md` e
`inventario-consultas.json`. Tu respuesta final es breve.
