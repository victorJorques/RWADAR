// 5S: separar fuentes reutilizables, vigilar tamaños y conservar una salida cerrada.
// Las alertas de tamaño orientan la siguiente extracción; no justifican borrar
// históricos, muestras protegidas ni relajar la compuerta de publicación.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const raiz=path.dirname(fileURLToPath(import.meta.url));
const {ARCHIVOS_PUBLICABLES}=require('./rwadar-publicacion-segura');
const {leerCatalogo,leerBloquesCatalogo}=require('./rwadar-fichas');
const leer=p=>fs.readFileSync(path.join(raiz,p),'utf8');
const catalogo=leerCatalogo();
const snapshot='assets/catalogo-publico-20261022.js';
assert(ARCHIVOS_PUBLICABLES.includes(snapshot),'snapshot fuera de lista cerrada');
assert.deepEqual(leerBloquesCatalogo(leer('rwadar-site/'+snapshot)),
  {plataformas:catalogo.plataformas,ofertas:catalogo.ofertas,fuera:catalogo.fuera});
assert(!/^const (?:P|FUERA|EMI)=\[/m.test(leer('rwadar-site/assets/rwadar-20260820.js')),
  'el comportamiento no debe duplicar las colecciones del catálogo');
function revisarDato(valor,ruta='catalogo') {
  if(typeof valor==='string') assert(!/https?:\/\/claude\.ai(?:\/|$)/i.test(valor),'enlace privado en '+ruta);
  if(!valor || typeof valor!=='object') return;
  for(const [campo,dato] of Object.entries(valor)) {
    if(campo==='patrocinada') assert.equal(dato,false,'patrocinio no autorizado: '+ruta);
    if(campo==='puntuacion') assert.equal(dato,null,'puntuación de inversión no autorizada: '+ruta);
    revisarDato(dato,ruta+'.'+campo);
  }
}
revisarDato(catalogo);
let fuentes=0;
for(const nombre of ARCHIVOS_PUBLICABLES.filter(n=>n.endsWith('.css'))){
  const css=leer('rwadar-site/'+nombre);
  assert(!/data:(?:application\/font|font\/)[^,]*base64,/i.test(css),nombre+': fuente duplicada en CSS');
  for(const m of css.matchAll(/url\(\/?(assets\/fuentes\/([a-z0-9-]+-([a-f0-9]{12})\.woff2))\)/g)){
    assert(ARCHIVOS_PUBLICABLES.includes(m[1]),'fuente fuera de lista cerrada: '+m[1]);
    const bytes=fs.readFileSync(path.join(raiz,'rwadar-site',m[1]));
    assert.equal(bytes.subarray(0,4).toString(),'wOF2');
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex').slice(0,12),m[3]);
    const salida=path.join(raiz,'rwadar-publicado',m[1]);
    assert(fs.existsSync(salida),'falta fuente en salida: '+m[1]);
    assert(bytes.equals(fs.readFileSync(salida)),'el publicador alteró bytes binarios: '+m[1]);
    fuentes++;
  }
}
assert.equal(fuentes,6,'portada, Academy y fichas deben reutilizar seis referencias a tres fuentes');
const presupuestos=[
  ['rwadar-site/assets/rwadar-20260820.css',180000],
  ['rwadar-site/assets/rwadar-20260820.js',450000],
  ['rwadar-movil/App.js',110000],
  ['probar-web.mjs',240000],
];
const pendientes=presupuestos.filter(([p,max])=>fs.statSync(path.join(raiz,p)).size>max);
console.log(`OK orden: ${fuentes} referencias locales a tres fuentes inmutables; salida binaria idéntica.`);
for(const [p,max] of pendientes) console.log(`AVISO 5S: ${p} supera ${Math.round(max/1024)} KiB. Extraer por responsabilidad en un cambio probado, sin copiar datos a mano.`);
if(process.argv.includes('--estricto') && pendientes.length) process.exitCode=1;
