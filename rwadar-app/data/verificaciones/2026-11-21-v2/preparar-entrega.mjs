// Entrega «2026-11-21» · datos y SQL de la entrega (sin red, reproducible).
// Lo propio de hoy está en decisiones.json; las guardas, en el motor (.claude/skills/investigacion-catalogo/entrega/).
//   node rwadar-app/data/verificaciones/2026-11-21-v2/preparar-entrega.mjs
import { ejecutar } from '../../../../.claude/skills/investigacion-catalogo/entrega/motor.mjs';
await ejecutar('preparar', import.meta.url, process.argv.slice(2));
