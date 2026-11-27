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
  return "(function () { 'use strict'; const PAISES_CONTENIDO=(function(){const module={exports:{}};\n" + datos.replace("'use strict';\n", '') +
    "\nreturn module.exports;})(); const require=n=>{if(n==='./paises-contenido')return PAISES_CONTENIDO;throw new Error(n)}; const module={exports:{}};\n" +
    fs.readFileSync(LOGICA, 'utf8') + '\nwindow.RWAdarDisponibilidad=module.exports; })();\n';
}
/* Diccionario común ES→EN (rwadar-movil/lib/idioma-en.js, copiado a la web): nombres de países y grupos,
   estados y textos fijos de la disponibilidad por país, en un bloque marcado. Sin repetir claves que ya existan. */
const DICCIONARIO = path.join(raiz, 'rwadar-movil/lib/idioma-en.js');
const INI = '  // paises:inicio (GENERADO por rwadar-app/paises/generar.cjs)\n', FIN = '  // paises:fin\n';
const TEXTOS_EN = {
  'Disponible': 'Available', 'Con requisitos': 'With requirements', 'No disponible': 'Not available', 'Tu país': 'Your country', 'Cambiar': 'Change',
  'Tu país de residencia': 'Your country of residence', 'Solo las disponibles en tu país': 'Only those available in your country',
  'Detectado por tu conexión. Si resides en otro país, cámbialo.': 'Detected from your connection. If you live in another country, change it.',
  'Disponibilidad por país': 'Availability by country', 'Requisito:': 'Requirement:', 'Requisito': 'Requirement',
  'No hay información oficial suficiente para tu país. No suponemos que esté disponible solo porque no aparezca excluido.':
    'There is not enough official information for your country. We do not assume it is available just because it is not excluded.',
  'Países admitidos': 'Countries admitted', 'Países excluidos': 'Countries excluded',
  'Fuentes de la disponibilidad': 'Availability sources', 'Consultada el': 'Checked on', 'Disponibilidad comprobada el': 'Availability checked on',
  'Esta oferta todavía no tiene la comprobación por país.': 'This offer does not have the country check yet.',
  'La disponibilidad depende de tu país de residencia, no de dónde te conectes. Compruébala siempre en la fuente antes de decidir.':
    'Availability depends on your country of residence, not on where you connect from. Always check it at the source before deciding.',
  'Ofertas por país': 'Offers by country', 'Países donde se emiten u ofrecen las ofertas del radar.': 'Countries where the radar offers are issued or offered.', '¿Cuál es tu país de residencia?': 'What is your country of residence?', 'Así te decimos qué ofertas están a tu alcance. Verás todas las ofertas del mundo igualmente.': 'So we can tell you which offers are within your reach. You will still see every offer in the world.', 'Confirmar': 'Confirm', 'Cambiar país': 'Change country', 'Disponibles': 'Available', 'En el radar': 'On the radar', 'Ver fuentes': 'View sources', 'Detectado por tu conexión': 'Detected from your connection', 'Todos los demás países': 'All other countries', 'Se contrata hoy desde España (referencia)': 'Can be taken out today from Spain (reference)',
  'Lo que no aparece aquí queda sin confirmar: no suponemos que una oferta esté disponible en un país solo porque no esté excluido.': 'Anything not listed here is unconfirmed: we do not assume an offer is available in a country just because it is not excluded.',
  'Disponible, según la fuente': 'Available, according to the source', 'No disponible, según la fuente': 'Not available, according to the source',
  'Con requisitos, según la fuente': 'With requirements, according to the source', 'Todo el mundo': 'Worldwide',
  'Se contrata hoy desde tu país de residencia': 'Can be taken out today from your country of residence',
  'Se contrata hoy desde tu país de residencia.': 'Can be taken out today from your country of residence.',
  'Referencia España: autorizada por un supervisor de la UE e inscrita en la CNMV': 'Spain reference: authorised by an EU supervisor and registered with the CNMV',
  'Referencia España: la entidad está autorizada por un supervisor de la UE e inscrita en la CNMV.': 'Spain reference: the entity is authorised by an EU supervisor and registered with the CNMV.',
  'Referencia España: hay folleto o KID oficial para su venta en España': 'Spain reference: there is an official prospectus or KID for its sale in Spain',
  'Referencia España: tiene un documento oficial para su venta en España (folleto o KID).': 'Spain reference: it has an official document for its sale in Spain (prospectus or KID).',
  'Es una oferta principal y la fuente dice que se contrata desde tu país de residencia.': 'It is a main offer and the source says it can be taken out from your country of residence.',
  'La fuente dice que no se ofrece en tu país de residencia.': 'The source says it is not offered in your country of residence.',
  'Desde tu país, solo si cumples sus requisitos (los tienes en «Disponibilidad por país»).': 'From your country, only if you meet its requirements (see «Availability by country»).',
  'No consta en la fuente que se contrate desde tu país de residencia.': 'The source does not state that it can be taken out from your country of residence.',
};
function bloqueDiccionario() {
  const p = JSON.parse(fs.readFileSync(ORIGEN, 'utf8'));
  const base = fs.readFileSync(DICCIONARIO, 'utf8');
  const fuera = base.includes(INI) ? base.slice(0, base.indexOf(INI)) + base.slice(base.indexOf(FIN) + FIN.length) : base;
  const yaEsta = k => fuera.includes('\n  ' + JSON.stringify(k) + ':');
  const pares = new Map();
  for (const c of Object.keys(p.paises).sort()) pares.set(p.paises[c].es, p.paises[c].en);
  for (const g of Object.values(p.grupos)) pares.set(g.es, g.en);
  for (const [k, v] of Object.entries(TEXTOS_EN)) pares.set(k, v);
  const lineas = [...pares].filter(([k, v]) => k !== v && !yaEsta(k)).map(([k, v]) => '  ' + JSON.stringify(k) + ': ' + JSON.stringify(v) + ',\n');
  return { fuera, bloque: INI + lineas.join('') + FIN };
}
function diccionarioNuevo() {
  const { fuera, bloque } = bloqueDiccionario();
  const cierre = fuera.lastIndexOf('\n};');
  return fuera.slice(0, cierre + 1) + bloque + fuera.slice(cierre + 1);
}
function alDia() {
  const d = contenidoDatos();
  return fs.existsSync(DATOS) && fs.readFileSync(DATOS, 'utf8') === d && fs.existsSync(WEB) && fs.readFileSync(WEB, 'utf8') === contenidoWeb(d) &&
    fs.readFileSync(DICCIONARIO, 'utf8') === diccionarioNuevo();
}
if (require.main === module) {
  if (process.argv.includes('--comprobar')) {
    if (!alDia()) { console.error('Países o motor de disponibilidad desactualizados: node rwadar-app/paises/generar.cjs'); process.exitCode = 1; }
    else console.log('Disponibilidad por país: web y app idénticas.');
  } else {
    const d = contenidoDatos();
    fs.writeFileSync(DATOS, d); fs.writeFileSync(WEB, contenidoWeb(d)); fs.writeFileSync(DICCIONARIO, diccionarioNuevo());
    console.log('Escritos rwadar-movil/lib/paises-contenido.js y rwadar-site/assets/disponibilidad-pais-20261127.js.');
  }
}
module.exports = { contenidoDatos, contenidoWeb, alDia };
