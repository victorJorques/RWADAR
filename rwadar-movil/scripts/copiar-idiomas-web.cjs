'use strict';
// Dos copias derivadas del mismo motor/diccionario. Sin catálogo, red ni build.
const fs=require('node:fs');
const path=require('node:path');
const raiz=path.resolve(__dirname,'../..');
const entradas=[['idioma.js','idioma-20261022.js'],['idioma-en.js','idioma-en-20261022.js']];
let diferencias=0;
for(const [nombre,salida]of entradas){
  const bytes=fs.readFileSync(path.join(raiz,'rwadar-movil/lib',nombre));
  const destino=path.join(raiz,'rwadar-site/assets',salida);
  if(fs.existsSync(destino)&&bytes.equals(fs.readFileSync(destino)))continue;
  diferencias++;
  if(!process.argv.includes('--comprobar'))fs.writeFileSync(destino,bytes);
}
if(process.argv.includes('--comprobar')&&diferencias){console.error('Idioma web desactualizado: ejecutar node rwadar-movil/scripts/copiar-idiomas-web.cjs');process.exitCode=1;}
else console.log('Motor y diccionario ES/EN web/móvil idénticos.');
