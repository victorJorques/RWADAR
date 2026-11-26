// Entrega «2026-11-26» · transparencia.json al día DESPUÉS de aplicar y sincronizar.
// Lo propio de hoy está en decisiones.json; las guardas, en el motor (.claude/skills/investigacion-catalogo/entrega/).
//   node rwadar-app/data/verificaciones/2026-11-26-v2/despues-de-aplicar.mjs
import { ejecutar } from '../../../../.claude/skills/investigacion-catalogo/entrega/motor.mjs';
await ejecutar('despues', import.meta.url, process.argv.slice(2));
