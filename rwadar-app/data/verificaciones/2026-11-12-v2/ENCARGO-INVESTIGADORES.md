# Encargo común · investigación del catálogo · 12 de noviembre de 2026

Víctor lo pidió el 12/11/2026 a las 00:28 UTC: «Tendrás que actualizar la
información a hoy y acelerar porque no te ha dado tiempo a hacerlo en un día».

**Lo publicado hoy** (leído como visitante el 12/11 a las 00:30 UTC, en
`lectura-publica/`): revisión `24b5f7de` (entrega `2026-11-11`), con 25
plataformas, 22 ofertas (8 principales, 13 de reventa y 1 en camino) y 5
descartadas. Las cifras son del **11/11**.

**Es una puesta al día rápida, no una investigación desde cero.** Ayer se
revisaron a fondo las 22 ofertas (`../2026-11-11-v2/`:
`DECISIONES-COORDINADOR.md`, `expedientes/`, `revision-independiente/`).

Hoy:

1. **Vuelve a abrir hoy la fuente primaria** de cada dato de la tarjeta y de
   cada aviso con fecha o dato del día de tus fichas, y di qué cambia. Si no
   cambia nada, dilo con la fuente y la hora de la consulta de hoy.
2. Comprueba que los documentos sean los mismos (SHA-256 frente a los de
   ayer) y que no haya advertencias nuevas de la CNMV.
3. **Para las webs que bloquean:**
   - usa las rutas legítimas ya verificadas de
     `.claude/skills/investigacion-catalogo/acceso/ACCESO-FUENTES.md`;
   - el comprobador dio 76/76 vivas a las 00:30 UTC;
   - no se elude ningún control.
4. **Sé rápido:** Víctor quiere el ciclo terminado hoy. No repitas lo que ya
   está bien documentado ayer si la fuente dice lo mismo: basta con la consulta
   de hoy, su hora y su SHA-256.

**Pendientes de ayer, a resolver hoy con fuente primaria:**

- **mTBILL (grupo principales):**
  - Rentabilidad anualizada de 30 días a partir del oráculo en cadena del
    emisor (ruta en ACCESO-FUENTES §2.1), con fecha de la ronda, y el
    contraste con rwa.xyz y DefiLlama.
  - Di si el KID en español permite decir que el valor ya va neto de la
    comisión de rendimiento del 5 %, y con qué literal.
  - Propón el texto de la métrica con su aviso: rentabilidad pasada, en USD,
    sin descontar el 0,07 % del reembolso inmediato ni el cambio EUR/USD.
  - Revisa si el conflicto de los límites de reembolso (25 % frente a 15 %)
    sigue igual. Si es así, el estado sigue en `fuentes_en_conflicto`.
- **Brickwise (grupo brickwise):**
  - Propón un aviso común a las 11 fichas: no consta si una orden de venta
    de varias participaciones se puede comprar en parte, más la comisión del
    1,5 % del comprador (ACCESO-FUENTES §2.4).
  - Para cada ficha, la orden de venta más barata publicada hoy (precio y
    cantidad) en la API pública.
- **Crypto.com (grupo vigilancia):** el motivo exacto por el que no se admite
  (KID solo dentro de la app; CNMV n.º 4485; CySEC 344/17; App Store ES),
  según ACCESO-FUENTES §2.6.

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

- la publicada: `../2026-11-11-v2/escaparate-publicacion.json`;
- su documentación: `../2026-11-11-v2/documentacion-ofertas.json`;
- su último expediente: `../2026-11-11-v2/expedientes/<slug>.json`.

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
`no_admitir` con el motivo concreto. Mejor ninguna que una dudosa.

Entrega: los expedientes, `grupos/<grupo>/resumen-<grupo>.md` e
`inventario-consultas.json`. Tu respuesta final es breve.
