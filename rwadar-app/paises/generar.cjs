'use strict';
/* Disponibilidad por país (27/11/2026). Una sola fuente para la web y la app:
   - rwadar-editorial-source/paises/paises.json → rwadar-movil/lib/paises-contenido.js (datos, CommonJS)
   - rwadar-movil/lib/disponibilidad-pais.js (lógica) + los datos → rwadar-site/assets/disponibilidad-pais-20261127.js
     (window.RWAdarDisponibilidad), como el motor de la calculadora.
     node rwadar-app/paises/generar.cjs              (escribe)
     node rwadar-app/paises/generar.cjs --comprobar  (solo mira; npm test) */
const fs = require('node:fs');
const path = require('node:path');
const raiz = path.resolve(__dirname, '../..');
const ORIGEN = path.join(raiz, 'rwadar-editorial-source/paises/paises.json');
const DATOS = path.join(raiz, 'rwadar-movil/lib/paises-contenido.js');
const LOGICA = path.join(raiz, 'rwadar-movil/lib/disponibilidad-pais.js');
const WEB = path.join(raiz, 'rwadar-site/assets/disponibilidad-pais-20261127.js');

function contenidoDatos() {
  const p = JSON.parse(fs.readFileSync(ORIGEN, 'utf8'));
  const codigos = Object.keys(p.paises).sort();
  const orden = idioma => codigos.slice().sort((a, b) => p.paises[a][idioma].localeCompare(p.paises[b][idioma], idioma));
  const datos = { paises: p.paises, grupos: p.grupos, ordenEs: orden('es'), ordenEn: orden('en') };
  return "'use strict';\n/* GENERADO por rwadar-app/paises/generar.cjs desde rwadar-editorial-source/paises/paises.json: no se edita a mano. */\nmodule.exports = " +
    JSON.stringify(datos) + ';\n';
}
function contenidoWeb(datos) {
  return "(function () { 'use strict'; const DATOS=(function(){const module={exports:{}};\n" + datos.replace("'use strict';\n", '') +
    "\nreturn module.exports;})(); const require=n=>{if(n==='./paises-contenido')return DATOS;throw new Error(n)}; const module={exports:{}};\n" +
    fs.readFileSync(LOGICA, 'utf8') + '\nwindow.RWAdarDisponibilidad=module.exports; })();\n';
}
function alDia() {
  const d = contenidoDatos();
  return fs.existsSync(DATOS) && fs.readFileSync(DATOS, 'utf8') === d && fs.existsSync(WEB) && fs.readFileSync(WEB, 'utf8') === contenidoWeb(d);
}
if (require.main === module) {
  if (process.argv.includes('--comprobar')) {
    if (!alDia()) { console.error('Países o motor de disponibilidad desactualizados: node rwadar-app/paises/generar.cjs'); process.exitCode = 1; }
    else console.log('Disponibilidad por país: web y app idénticas.');
  } else {
    const d = contenidoDatos();
    fs.writeFileSync(DATOS, d); fs.writeFileSync(WEB, contenidoWeb(d));
    console.log('Escritos rwadar-movil/lib/paises-contenido.js y rwadar-site/assets/disponibilidad-pais-20261127.js.');
  }
}
module.exports = { contenidoDatos, contenidoWeb, alDia };
