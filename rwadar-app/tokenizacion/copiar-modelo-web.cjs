'use strict';
/* Copia el motor de «La tokenización en el mundo» (rwadar-movil/lib/tokenizacion.js)
   a la web, envuelto como la cartera: assets/tokenizacion-modelo-20261110.js
   expone window.RWAdarTokenizacionModelo. Una sola fuente para web, app y servidor.
     node rwadar-app/tokenizacion/copiar-modelo-web.cjs              (escribe)
     node rwadar-app/tokenizacion/copiar-modelo-web.cjs --comprobar  (solo mira) */
const fs = require('node:fs');
const path = require('node:path');
const raiz = path.resolve(__dirname, '../..');
const ORIGEN = path.join(raiz, 'rwadar-movil/lib/tokenizacion.js');
const DESTINO = path.join(raiz, 'rwadar-site/assets/tokenizacion-modelo-20261110.js');
function envoltorio(canon) {
  return "(function () { 'use strict'; const module={exports:{}};\n" + canon + '\nwindow.RWAdarTokenizacionModelo=module.exports; })();\n';
}
function alDia() {
  return fs.existsSync(DESTINO) && fs.readFileSync(DESTINO, 'utf8') === envoltorio(fs.readFileSync(ORIGEN, 'utf8'));
}
if (require.main === module) {
  if (process.argv.includes('--comprobar')) {
    if (!alDia()) { console.error('Motor web de la tokenización desactualizado: node rwadar-app/tokenizacion/copiar-modelo-web.cjs'); process.exitCode = 1; }
    else console.log('Motor de la tokenización: web y app idénticos.');
  } else {
    fs.writeFileSync(DESTINO, envoltorio(fs.readFileSync(ORIGEN, 'utf8')));
    console.log('Copiado a rwadar-site/assets/tokenizacion-modelo-20261110.js.');
  }
}
module.exports = { envoltorio, alDia, ORIGEN, DESTINO };
