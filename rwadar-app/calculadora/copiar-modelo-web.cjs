'use strict';
/* Copia el motor de «Calcula tus números» (rwadar-movil/lib/calculadora.js)
   a la web, envuelto como el de la tokenización: assets/calculadora-modelo-20261111.js
   expone window.RWAdarCalculadoraModelo. Una sola fuente para la web y la app.
     node rwadar-app/calculadora/copiar-modelo-web.cjs              (escribe)
     node rwadar-app/calculadora/copiar-modelo-web.cjs --comprobar  (solo mira) */
const fs = require('node:fs');
const path = require('node:path');
const raiz = path.resolve(__dirname, '../..');
const ORIGEN = path.join(raiz, 'rwadar-movil/lib/calculadora.js');
const DESTINO = path.join(raiz, 'rwadar-site/assets/calculadora-modelo-20261111.js');
function envoltorio(canon) {
  return "(function () { 'use strict'; const module={exports:{}};\n" + canon + '\nwindow.RWAdarCalculadoraModelo=module.exports; })();\n';
}
function alDia() {
  return fs.existsSync(DESTINO) && fs.readFileSync(DESTINO, 'utf8') === envoltorio(fs.readFileSync(ORIGEN, 'utf8'));
}
if (require.main === module) {
  if (process.argv.includes('--comprobar')) {
    if (!alDia()) { console.error('Motor web de la calculadora desactualizado: node rwadar-app/calculadora/copiar-modelo-web.cjs'); process.exitCode = 1; }
    else console.log('Motor de la calculadora: web y app idénticos.');
  } else {
    fs.writeFileSync(DESTINO, envoltorio(fs.readFileSync(ORIGEN, 'utf8')));
    console.log('Copiado a rwadar-site/assets/calculadora-modelo-20261111.js.');
  }
}
module.exports = { envoltorio, alDia, ORIGEN, DESTINO };
