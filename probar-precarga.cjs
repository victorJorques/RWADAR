'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const {parse}=require('./rwadar-app/node_modules/acorn');
const {adelgazarJS}=require('./rwadar-adelgazar');
const {cargarRegistro,unirActivos,inventario,huellaInventario,validarBase,verificarHTTP,preparar,despliegueProduccion,identidadListaWrangler,comprobarAndroidCompatible}=require('./rwadar-precargar-imagenes');
const raiz=__dirname;
let correctas=0;
function prueba(nombre,fn){fn();correctas++;console.log('OK '+nombre);}
function funcionesWeb(codigo){
  const nombres=new Set(['EDITORIAL_OFERTA_POR_CATEGORIA','EDITORIAL_OFERTA_POR_SLUG','RUTAS_FICHAS_DESPLEGADAS',
    'imagenOfertaLocal','rutaFichaPublica','enlaceFichaPublicaHtml']);
  const nodos=parse(codigo,{ecmaVersion:'latest'}).body.filter(n=>n.type==='FunctionDeclaration'?nombres.has(n.id.name):
    n.type==='VariableDeclaration'&&n.declarations.some(d=>d.id.type==='Identifier'&&nombres.has(d.id.name)));
  const c=vm.createContext({});
  vm.runInContext("const P=[{slug:'spiko'}],EMI=[{slug:'spiko-letras-del-tesoro-euro'}];const textoLocal=v=>typeof v==='string'?v.trim():'';const escHtml=v=>String(v);"+
    nodos.map(n=>codigo.slice(n.start,n.end)).join('\n')+
    ';this.api={imagenOfertaLocal,rutaFichaPublica,enlaceFichaPublicaHtml,agregar:()=>EMI.push({slug:"alta-nueva"})};',c);
  return c.api;
}
for(const [nombre,codigo] of [['fuente',fs.readFileSync(path.join(raiz,'rwadar-site/assets/rwadar-20260820.js'),'utf8')],
  ['minificado',adelgazarJS(fs.readFileSync(path.join(raiz,'rwadar-site/assets/rwadar-20260820.js'),'utf8'))]]) {
  const api=funcionesWeb(codigo);
  prueba(nombre+': alta Infraestructura tiene imagen canónica y respaldo',()=>{
    const i=api.imagenOfertaLocal({catalogo:true,slug:'alta-nueva',categoria:'Infraestructura',titulo:'Alta editorial',documentacion:{imagenEditorialAlt:'Escena editorial propia de la oferta nueva'}});
    assert.equal(i.src,'/ofertas-editoriales/oferta-alta-nueva.webp');assert.match(i.respaldo,/capital-privado/);assert.match(i.alt,/Escena editorial propia/);
  });
  prueba(nombre+': no acepta slugs con ruta, query o tamaño excesivo',()=>{
    for(const slug of ['../fuga','oferta?url=https://otro.example','x'.repeat(161),'https://otro.example/foto','__proto__'])
      assert.equal(api.imagenOfertaLocal({catalogo:true,slug,categoria:'Inmobiliario'}),null);
  });
  prueba(nombre+': no usa URL remota arbitraria y conserva ilustración conocida',()=>{
    const i=api.imagenOfertaLocal({catalogo:true,slug:'spiko-letras-del-tesoro-euro',categoria:'Tesoro y fondos',imagen:'https://otro.example/foto.webp'});
    assert.equal(i.src,'/ofertas-editoriales/oferta-spiko-letras-del-tesoro-euro.webp');assert.match(i.alt,/Pasos:/);
    const nueva=api.imagenOfertaLocal({catalogo:true,slug:'alta-nueva',categoria:'Tesoro y fondos',titulo:'Título público',documentacion:{imagenEditorialAlt:'Texto\nno válido con controles'}});
    assert.match(nueva.alt,/Título público$/);assert.doesNotMatch(nueva.alt,/controles/);
  });
  prueba(nombre+': ampliación conserva diálogo sin enlaces a páginas no desplegadas',()=>{
    assert.equal(api.rutaFichaPublica('ofertas','spiko-letras-del-tesoro-euro'),'/ofertas/spiko-letras-del-tesoro-euro');
    api.agregar();assert.equal(api.rutaFichaPublica('ofertas','alta-nueva'),'');assert.equal(api.enlaceFichaPublicaHtml(''),'');
    assert.equal(api.rutaFichaPublica('plataformas','spiko'),'/plataformas/spiko');
  });
}
const raizTemporal=fs.realpathSync(require('node:os').tmpdir());
const temporal=fs.mkdtempSync(path.join(raizTemporal,'rwadar-precarga-test-'));
const dirRegistro=path.join(temporal,'rwadar-editorial-source/ofertas/precargas');
fs.mkdirSync(path.join(dirRegistro,'lote-prueba'),{recursive:true});
const base=path.join(temporal,'base');
fs.cpSync(path.join(raiz,'rwadar-publicado'),base,{recursive:true,errorOnExist:true,force:false});
const archivos=inventario(base), sello={versionEsquema:1,origen:'https://rwadar.pages.dev',commit:'a'.repeat(40),despliegueId:'11111111-1111-1111-1111-111111111111',archivos,sha256:huellaInventario(archivos)};
const fotoOriginal='ofertas-editoriales/oferta-spiko-letras-del-tesoro-euro.webp';
const foto=archivos.find(a=>a.ruta===fotoOriginal);
assert(foto,'Hace falta el build normal local para comprobar la precarga');
const imagen={slug:'alta-nueva',archivo:'rwadar-editorial-source/ofertas/precargas/lote-prueba/oferta-alta-nueva.webp',
  bytes:foto.bytes,sha256:foto.sha256,ancho:960,alto:660,alt:'Ilustración editorial de prueba local, no una candidata real'};
fs.copyFileSync(path.join(base,fotoOriginal),path.join(temporal,imagen.archivo));
const registro={versionEsquema:1,lotes:[{id:'lote-prueba',baseSha256:sello.sha256,revisionAnterior:'34900000-0000-0000-0000-000000000000',revisores:['Revisor uno','Revisor dos'],imagenes:[imagen]}]};
const guardar=()=>fs.writeFileSync(path.join(dirRegistro,'manifest.json'),JSON.stringify(registro));guardar();
prueba('registro vacío de producción no inventa altas',()=>assert.equal(cargarRegistro().publicables.length,0));
prueba('manifiesto literal valida WebP, hash y dimensiones reales',()=>assert.equal(cargarRegistro(temporal).publicables.length,1));
prueba('rechaza campos desconocidos',()=>{imagen.url='https://otro.example';guardar();assert.throws(()=>cargarRegistro(temporal));delete imagen.url;guardar();});
prueba('rechaza un byte distinto aunque el archivo siga siendo WebP',()=>{imagen.sha256='0'.repeat(64);guardar();assert.throws(()=>cargarRegistro(temporal));imagen.sha256=foto.sha256;guardar();});
prueba('rechaza revisión, revisor o ruta que no estén declarados correctamente',()=>{
  const lote=registro.lotes[0];lote.revisores[1]=lote.revisores[0];guardar();assert.throws(()=>cargarRegistro(temporal));lote.revisores[1]='Revisor dos';
  const anterior=imagen.archivo;imagen.archivo='rwadar-site/index.html';guardar();assert.throws(()=>cargarRegistro(temporal));imagen.archivo=anterior;guardar();
});
prueba('archivo extra no puede viajar por compartir carpeta/extensión',()=>{
  const extra=path.join(dirRegistro,'extra.webp');fs.writeFileSync(extra,'extra');assert.throws(()=>cargarRegistro(temporal));fs.unlinkSync(extra);
});
prueba('base sellada valida el árbol completo incluida configuración',()=>assert.equal(validarBase(base,sello).sha256,sello.sha256));
prueba('Worker o rutas alterados siguen bloqueados aunque se recalcule el sello',()=>{
  const recalcular=()=>{const archivos=inventario(base);return {...sello,archivos,sha256:huellaInventario(archivos)};};
  for(const nombre of ['_worker.js','_routes.json']){
    const p=path.join(base,nombre),original=fs.readFileSync(p);
    try{
      fs.writeFileSync(p,nombre==='_worker.js'?Buffer.concat([original,Buffer.from('\n// BFF sustituido\n')]):
        JSON.stringify({version:1,include:['/*'],exclude:['/api/acceso/*']})+'\n');
      assert.throws(()=>validarBase(base,recalcular()),/Artefacto de acceso distinto/);
      fs.unlinkSync(p);assert.throws(()=>validarBase(base,recalcular()),/Base incompleta/);
    }finally{fs.writeFileSync(p,original);}
  }
});
prueba('los dos artefactos obligatorios no permiten incorporar otro JS con un sello nuevo',()=>{
  const p=path.join(base,'_worker-extra.js');
  try{
    fs.writeFileSync(p,'export default {fetch(){return new Response("sustituido")}};');
    const archivos=inventario(base),falso={...sello,archivos,sha256:huellaInventario(archivos)};
    assert.throws(()=>validarBase(base,falso),/fuera de la lista cerrada/);
  }finally{fs.unlinkSync(p);}
});
prueba('mutar HTML, JS o configuración invalida el sello',()=>{
  for(const a of archivos.filter(a=>['index.html','_headers','_redirects','sw.js'].includes(a.ruta)||/assets\/rwadar-20260820\./.test(a.ruta))) {
    const p=path.join(base,a.ruta), original=fs.readFileSync(p);fs.appendFileSync(p,' ');assert.throws(()=>validarBase(base,sello));fs.writeFileSync(p,original);
  }
});
prueba('sello recalculado no puede omitir ficha, fuente, JS o imagen propia',()=>{
  for(const a of archivos.filter(a=>a.ruta==='ofertas/spiko-letras-del-tesoro-euro.html'||
    a.ruta===fotoOriginal||/assets\/rwadar-20260820\./.test(a.ruta)||/\.woff2$/.test(a.ruta))) {
    const p=path.join(base,a.ruta), original=fs.readFileSync(p);fs.unlinkSync(p);
    const incompletos=inventario(base), falso={...sello,archivos:incompletos,sha256:huellaInventario(incompletos)};
    assert.throws(()=>validarBase(base,falso),'Debe rechazar la omisión de '+a.ruta);fs.writeFileSync(p,original);
  }
});
const extras=cargarRegistro(temporal).publicables;
prueba('precarga añade solo una WebP; todos los bytes base quedan idénticos',()=>{
  const salida=path.join(temporal,'salida'), esperados=preparar(base,sello,registro.lotes[0],extras,salida);
  assert.equal(esperados.length,archivos.length+1);
  assert.deepEqual(inventario(salida).filter(a=>a.ruta!=='ofertas-editoriales/oferta-alta-nueva.webp'),archivos);
});
prueba('otra base o intento de sustituir una imagen existente bloquean precarga',()=>{
  assert.throws(()=>preparar(base,sello,{...registro.lotes[0],baseSha256:'0'.repeat(64)},extras,path.join(temporal,'rechazada')));
  assert.throws(()=>preparar(base,sello,registro.lotes[0],[{...extras[0],salida:fotoOriginal}],path.join(temporal,'sustitucion')));
});
prueba('publicador normal conserva precargas y no permite cambiar imágenes anteriores',()=>{
  const anterior={salida:fotoOriginal,bytes:foto.bytes,hashSha256:foto.sha256};
  assert.equal(unirActivos([anterior],extras).length,2);
  assert.equal(unirActivos([anterior],[anterior]).length,1);
  assert.throws(()=>unirActivos([anterior],[{...anterior,hashSha256:'0'.repeat(64)}]));
});
prueba('flags de bypass remoto o destinos arbitrarios fallan antes de red',()=>{
  for(const args of [['--produccion','--sin-sincronizar'],['--preview'],['--produccion','--base=../fuga'],['--produccion','--project-name=otro']]) {
    const r=spawnSync(process.execPath,['rwadar-precargar-imagenes.js',...args],{cwd:raiz,encoding:'utf8'});assert.notEqual(r.status,0);assert.match(r.stderr,/PRECARGA BLOQUEADA/);
  }
});
(async()=>{
  const json=v=>new Response(JSON.stringify(v),{status:200,headers:{'content-type':'application/json'}});
  await assert.rejects(()=>despliegueProduccion(async()=>{throw Error('No debe consultar red');},{},()=>{throw Error('Sin sesión CLI');}));
  prueba('identidad Cloudflare desconocida bloquea sin intentar una publicación',()=>{});
  const fila={Id:sello.despliegueId,Environment:'Production',Branch:'main',Deployment:'https://11111111.rwadar.pages.dev',Status:'13 hours ago'};
  assert.equal(await despliegueProduccion(null,{},()=>JSON.stringify([fila])),sello.despliegueId);
  assert.throws(()=>identidadListaWrangler(JSON.stringify([{...fila,Status:'Deploying'}])));
  assert.throws(()=>identidadListaWrangler(JSON.stringify([{...fila,Branch:'otra'}])));
  prueba('CLI OAuth vigente identifica producción sin exigir ni leer nuevas credenciales',()=>{});
  const entorno={CLOUDFLARE_API_TOKEN:'credencial-ficticia-solo-prueba',CLOUDFLARE_ACCOUNT_ID:'1'.repeat(32)};
  const proyecto={success:true,result:{name:'rwadar',production_branch:'main',canonical_deployment:{id:sello.despliegueId,environment:'production',latest_stage:{status:'success'}}}};
  assert.equal(await despliegueProduccion(async()=>json(proyecto),entorno),sello.despliegueId);
  await assert.rejects(()=>despliegueProduccion(async()=>json({...proyecto,result:{...proyecto.result,name:'otro'}}),entorno));
  prueba('ID de proyecto, rama y despliegue canónico deben coincidir',()=>{});
  await assert.rejects(()=>comprobarAndroidCompatible(async()=>json({id:1,tag_name:'v1.3.2',draft:false,prerelease:false,assets:[]})));
  await assert.rejects(()=>comprobarAndroidCompatible(async()=>json({id:1,tag_name:'v1.4.0',draft:false,prerelease:false,assets:[]})));
  prueba('latest1.3.2 o Android140 sin evidencia no permiten activar altas',()=>{});
  assert.equal((await comprobarAndroidCompatible(async()=>json({id:1,tag_name:'v1.4.0',draft:false,prerelease:false,
    assets:['RWAdar.apk','SHA256SUMS.txt','rwadar-android-140-evidence.zip'].map(name=>({name,size:100,digest:'sha256:'+'1'.repeat(64)}))}))).version,'v1.4.0');
  prueba('release140 pública con APK, sumas y evidencia identificados supera guarda de compatibilidad',()=>{});
  let visitas=0;
  await verificarHTTP(base,archivos,async url=>{
    visitas++;const ruta=new URL(url).pathname;
    assert(!['/_headers','/_redirects','/_worker.js','/_routes.json'].includes(ruta),'No solicita configuración privada de Pages');
    const a=archivos.find(a=>'/'+a.ruta.replace(/(^|\/)index\.html$/,'$1').replace(/\.html$/,'')===ruta);
    return new Response(fs.readFileSync(path.join(base,a.ruta)),{status:200,headers:{'content-type':a.ruta.endsWith('.webp')?'image/webp':'application/octet-stream'}});
  });
  prueba('GET verifica todos los recursos públicos y omite solo los cuatro archivos de configuración inaccesibles',()=>assert.equal(visitas,archivos.length-4));
  await assert.rejects(()=>verificarHTTP(base,[foto],async()=>new Response('HTML disfrazado',{status:200,headers:{'content-type':'text/html'}})));
  prueba('HTTP 200 con bytes incorrectos no acredita una imagen propia',()=>{});
  await assert.rejects(()=>verificarHTTP(base,[foto],async()=>new Response(fs.readFileSync(path.join(base,foto.ruta)),{status:200,headers:{'content-type':'text/html'}})));
  prueba('WebP con MIME HTML también falla cerrada',()=>{});
  console.log(`\n${correctas} pruebas de precarga correctas; sin SQL ni red remota.`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{
  if(path.dirname(temporal)!==raizTemporal||!path.basename(temporal).startsWith('rwadar-precarga-test-'))throw new Error('Ruta temporal de prueba rechazada');
  fs.rmSync(temporal,{recursive:true,force:true});
});
