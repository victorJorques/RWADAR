# Revisión independiente · entrega 2026-11-03.7 (textos para el lector)

**Veredicto de la revisión: la entrega de datos se puede aplicar; nada
grave.** Pedía resolver tres puntos importantes antes de unir a `main` y
algunos menores baratos. Revisó la primera versión, la revisión `89e88b04`
(HEAD `b4d5fb1`). Las correcciones dan la revisión `bd1f873b`; lo que cambia
entre las dos está marcado «(corrección)» en el §3 de `INFORME-ENTREGA.md` y
tiene que verlo otra revisión antes de aplicar (paso 1 del §7).

- Revisor: Claude, 04/11/2026, otra sesión. Solo leyó: no tocó Supabase ni
  publicó nada, y el worktree quedó limpio. Ejecutó todo en copias del
  scratchpad.
- Corrector: Claude, 04/11/2026. Tampoco tocó nada en línea.

## 1. Lo que comprobó la revisión (sobre la 89e88b04)

- **Reproducible:** `preparar-entrega.mjs` en una copia de `b4d5fb1` da los
  13 archivos idénticos byte a byte (`aplicar-y-aprobar.sql` 168a5b0e…; con
  `--con-textos-plataformas`, 4d19d321…).
- **Datos intactos:** campo a campo frente a la .6, solo cambiaban los 51
  `detalle` previstos; documentación, manifiesto, cifras, fechas, fuentes,
  colecciones (8/13/3) y ofertas, iguales.
- **SQL:** las mismas sentencias que la .6, con `begin isolation level
  serializable`, guarda sobre la 344a86aa, solo inserciones en
  `rwadar_catalogo` y aprobación al final. `textos-plataformas.sql` con
  guarda e idempotente; los disparadores de `public.plataformas` solo saltan
  con `update of estado`. Los textos anteriores de la guarda coinciden con
  el snapshot de la última sincronización.
- **Pruebas:** `comprobar-entrega.mjs` correcto en las dos variantes;
  `npm test` en verde; guardián de la OTA en ok.
- **Hechos:** abrió las fuentes de lo que añade algo (Securitize Markets,
  Superstate, OpenEden, ADDX, Lofty, Outlier Media, BridgeDetroit). Ningún
  texto contradecía su fuente.

## 2. Hallazgos y qué se ha hecho

| Hallazgo | Gravedad | Qué se ha hecho |
|---|---|---|
| El cambio a «Importante» en la app (`141812b`) choca con `claude/remates`, que hace lo mismo mejor | importante | Deshecho en `dd1cef2`. El rótulo llega con remates; la OTA, después de unirla. |
| La fila 19 («Marketplace» → «Mercado de compraventa») no estaba en ninguna rama | importante | Hecha en el código de esta rama, solo en lo que se enseña (`c72b09b`, `37fc303`, `ca59546`): web, fichas fijas y app; «Marketplace» en inglés. Se une con remates sin conflictos de código. |
| Quedaba jerga: acceso de Spiko («onboarding»), Maple («en este corte») y Fireblocks («B2B… marketplace») | importante | Reescritos. Con la misma regla, también Courtyard (licencia, «marketplace»), OpenEden («permissioned»), Swarm («legibles», «FAQ», «contenido extraíble») y Reental («La FAQ declara…»). De 51 a 58 textos (`8caf488`). |
| La nota de RealT decía que «la mayor demanda» no estaba en las fuentes legibles, pero Outlier la atribuye a la ciudad | menor | Nota corregida: se quita por ser una valoración de la ciudad, no un dato. El texto, sin el superlativo, no cambia. |
| El aviso de ARTEX decía que faltaba confirmar su web y el alta, contra su nota y su acceso | menor | «No hemos podido confirmar que haya un instrumento que se negocie de verdad; hasta que lo confirmemos, su actividad figura como no verificable.» |
| Retoques de castellano (Midas, Blocksquare, Reental, Archax, ADDX, Centrifuge, Securitize, RealT) | menor | Hechos como proponía la revisión. En Archax, «a través de sociedades», sin «propias», que no dice la fuente. |
| No se leyó lo publicado antes de preparar (CICLO §1.2) | menor | Sigue sin leerse. El paso 4 del informe es compuerta obligatoria, con hora y resultado. |
| El informe solo estaba en el scratchpad | menor | `INFORME-ENTREGA.md` y este archivo, en esta carpeta. |
| Con `--con-textos-plataformas`, un fallo de esa guarda deshace también el lote | menor | Avisado en el paso 2 del informe, con la vuelta a la variante sin textos. |

## 3. Identidad tras las correcciones

- Revisión: `bd1f873b-95ec-2d2e-1fb5-17ccb505e283`
  (hash `bd1f873b95ec2d2e1fb517ccb505e2831b9bead5789891ac06b3c8f104014ad4`).
- Guarda sobre la publicada: `344a86aa-2c53-d2f0-fed4-5fdaadda33ad`.
- `aplicar-y-aprobar.sql`: `d57b5dbce55abfb80f227ef8e467b4e01c8679aa5c9fb9d507fa5f85391a2e2c`;
  con `--con-textos-plataformas`, `d2fecfefa50b43ae6d6e3e38fb328da893e9a842fbb049e6e54f432cc3306da1`.
- `textos-plataformas.sql`: `3c762ccd348edeb57fa674562a6a1a7c65a5752fe336cd203f8c10f1b4911acc`.
- `comprobar-entrega.mjs`: correcto en las dos variantes (14 OK).

## Segunda revisión independiente (04/11/2026, tarde)

Revisor aparte, sobre copias (`git archive`) y con las fuentes abiertas de nuevo
(WebFetch, curl o Chrome sin interfaz, sin saltar muros).

- **15 textos «(corrección)»:** 14 dicen lo mismo que su fuente. Centrifuge se
  retoca: «la licencia, si la hay, es del vehículo de cada fondo» afirmaba más
  que la fuente. Ahora dice «la licencia que pueda tener el vehículo de un fondo
  no es de Centrifuge» (fuente: «Neither Centrifuge nor any affiliated entity is
  licensed in your jurisdiction»).
- **Fila 19 («Mercado de compraventa»):** correcta. Solo cambia lo que se
  enseña; la base sigue guardando «Marketplace».
- **Variante con textos de `public.plataformas`:** no se aplica en esta
  entrega. El motivo nuevo de RealT dice más que su fuente. Reental, Toucan y
  RealT quedan para otra entrega.
- **Tras el retoque de Centrifuge** (variante sin textos):
  - revisión `f2732257-206d-48ce-2067-c7e19fa33002`, previa `344a86aa`;
  - `aplicar-y-aprobar.sql`
    `458c2bb64fb329c77a99d250f7b9fc274e85f42e2c24d05269a2b7c86db25810`;
  - 58 cambios y 24 ofertas (8/13/3). `comprobar-entrega.mjs`: correcto.

Esta sección sustituye a la revisión `bd1f873b` y al SHA `d57b5dbc` citados arriba.
