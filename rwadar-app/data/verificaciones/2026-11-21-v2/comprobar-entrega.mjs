// Entrega «2026-11-21» · ensayo en PGlite (sin red) [--exportar=DIR].
// Lo propio de hoy está en decisiones.json; las guardas, en el motor (.claude/skills/investigacion-catalogo/entrega/).
//   node rwadar-app/data/verificaciones/2026-11-21-v2/comprobar-entrega.mjs
import { ejecutar } from '../../../../.claude/skills/investigacion-catalogo/entrega/motor.mjs';
await ejecutar('comprobar', import.meta.url, process.argv.slice(2));
