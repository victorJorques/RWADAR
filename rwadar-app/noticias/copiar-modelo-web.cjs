'use strict';
/* Copia el motor de «Noticias del sector» (rwadar-movil/lib/noticias-sector.js)
   a la web, envuelto como el de la tokenización:
   assets/noticias-sector-modelo-20261110.js expone window.RWAdarNoticiasModelo.
   Una sola fuente para la web, la app y el generador.
     node rwadar-app/noticias/copiar-modelo-web.cjs              (escribe)
     node rwadar-app/noticias/copiar-modelo-web.cjs --comprobar  (solo mira) */
const fs = require('node:fs');
const path = require('node:path');
const raiz = path.resolve(__dirname, '../..');
const ORIGEN = path.join(raiz, 'rwadar-movil/lib/noticias-sector.js');
const DESTINO = path.join(raiz, 'rwadar-site/assets/noticias-sector-modelo-20261110.js');
function envoltorio(canon) {
  return "(function () { 'use strict'; const module={exports:{}};\n" + canon + '\nwindow.RWAdarNoticiasModelo=module.exports; })();\n';
}
function alDia() {
  return fs.existsSync(DESTINO) && fs.readFileSync(DESTINO, 'utf8') === envoltorio(fs.readFileSync(ORIGEN, 'utf8'));
}
if (require.main === module) {
  if (process.argv.includes('--comprobar')) {
    if (!alDia()) { console.error('Motor web de las noticias desactualizado: node rwadar-app/noticias/copiar-modelo-web.cjs'); process.exitCode = 1; }
    else console.log('Motor de las noticias: web y app idénticos.');
  } else {
    fs.writeFileSync(DESTINO, envoltorio(fs.readFileSync(ORIGEN, 'utf8')));
    console.log('Copiado a rwadar-site/assets/noticias-sector-modelo-20261110.js.');
  }
}
module.exports = { envoltorio, alDia, ORIGEN, DESTINO };
