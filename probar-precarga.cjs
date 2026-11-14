'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const {parse}=require('./rwadar-app/node_modules/acorn');
const {adelgazarJS}=require('./rwadar-adelgazar');
const {cargarRegistro,unirActivos,inventario,huellaInventario,validarBase,verificarHTTP,preparar,despliegueProduccion,identidadListaWrangler,comprobarAndroidCompatible,LECCION_INEXISTENTE}=require('./rwadar-precargar-imagenes');
const {academyPublicada}=require('./rwadar-acceso/compilar.cjs');
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
prueba('fotos de las noticias: la base las lleva todas y con los bytes de fotos.json',()=>{
  // Rediseño de Inicio (10/11/2026): el publicador copia la biblioteca a noticias-editoriales/.
  const fotos=archivos.filter(a=>/^noticias-editoriales\/[a-z0-9-]+\.webp$/.test(a.ruta));
  assert(fotos.length>=3,'El build local debe llevar las fotos de las noticias');
  const recalcular=()=>{const archivos=inventario(base);return {...sello,archivos,sha256:huellaInventario(archivos)};};
  const p=path.join(base,fotos[0].ruta), original=fs.readFileSync(p);
  try{
    fs.writeFileSync(p,Buffer.concat([original,Buffer.from('cambio')]));
    assert.throws(()=>validarBase(base,recalcular()),/Foto de noticia base distinta de fotos\.json/);
    fs.unlinkSync(p);
    assert.throws(()=>validarBase(base,recalcular()),/Falta la foto de una noticia base/);
    fs.writeFileSync(path.join(base,'noticias-editoriales/inventada.webp'),original);
    assert.throws(()=>validarBase(base,recalcular()),/Foto de noticia base distinta de fotos\.json/);
  }finally{fs.writeFileSync(p,original);fs.rmSync(path.join(base,'noticias-editoriales/inventada.webp'),{force:true});}
  assert.equal(validarBase(base,sello).sha256,sello.sha256);
});
prueba('fotos de las noticias: sus variantes de 480 y 960 valen en la base, una cambiada para, y una base sin variantes sigue valiendo',()=>{
  // Noticias que entran por los ojos (14/11/2026): noticias-editoriales/480/ y /960/, con las mismas reglas.
  const variantes=archivos.filter(a=>/^noticias-editoriales\/(?:480|960)\/[a-z0-9-]+\.webp$/.test(a.ruta));
  assert(variantes.length>=6,'El build local debe llevar las variantes de las fotos de las noticias');
  const recalcular=()=>{const archivos=inventario(base);return {...sello,archivos,sha256:huellaInventario(archivos)};};
  const p=path.join(base,variantes[0].ruta), original=fs.readFileSync(p);
  const copia=path.join(temporal,'variantes-base');
  try{
    fs.writeFileSync(p,Buffer.concat([original,Buffer.from('cambio')]));
    assert.throws(()=>validarBase(base,recalcular()),/Foto de noticia base distinta de fotos\.json/);
    fs.writeFileSync(p,original);
    fs.writeFileSync(path.join(base,'noticias-editoriales/480/inventada.webp'),original);
    assert.throws(()=>validarBase(base,recalcular()),/Foto de noticia base distinta de fotos\.json/);
    fs.rmSync(path.join(base,'noticias-editoriales/480/inventada.webp'));
    // Una base anterior (sin variantes) sigue valiendo.
    fs.mkdirSync(copia,{recursive:true});
    for(const w of ['480','960']) fs.renameSync(path.join(base,'noticias-editoriales',w),path.join(copia,w));
    assert.equal(validarBase(base,recalcular()).sha256,recalcular().sha256);
  }finally{
    for(const w of ['480','960']) if(fs.existsSync(path.join(copia,w))) fs.renameSync(path.join(copia,w),path.join(base,'noticias-editoriales',w));
    fs.writeFileSync(p,original);fs.rmSync(path.join(base,'noticias-editoriales/480/inventada.webp'),{force:true});
  }
  assert.equal(validarBase(base,sello).sha256,sello.sha256);
});
prueba('un alta ya añadida al manifiesto no invalida la base: el worker esperado sale de sus fichas',()=>{
  // El ciclo añade la ruta del alta al manifiesto antes de precargar su imagen.
  const selloArchivo=path.join(temporal,'sello-alta.json');fs.writeFileSync(selloArchivo,JSON.stringify(sello));
  const guion=`const path=require('node:path');const raiz=${JSON.stringify(raiz)};
    const ruta=require.resolve(path.join(raiz,'rwadar-fichas-manifiesto.js'));
    const original=require(ruta);require.cache[ruta].exports=Object.freeze([...original,'ofertas/alta-nueva.html']);
    const {construirWorker}=require(path.join(raiz,'rwadar-acceso/compilar.cjs'));
    if(!construirWorker().includes('ofertas/alta-nueva.html'))throw new Error('el manifiesto inyectado no llegó al worker');
    const {validarBase}=require(path.join(raiz,'rwadar-precargar-imagenes.js'));
    const sello=JSON.parse(require('node:fs').readFileSync(${JSON.stringify(selloArchivo)},'utf8'));
    process.stdout.write(validarBase(${JSON.stringify(base)},sello).sha256);`;
  const r=spawnSync(process.execPath,['-e',guion],{cwd:raiz,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);assert.equal(r.stdout,sello.sha256);
});
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
prueba('el contenido de las lecciones de la base sellada se valida aunque producción ya no enseñe sus bytes',()=>{
  // Con "acceso": "cuenta", verificarHTTP solo ve el 303 de cada lección; validarBase
  // revisa en la base su marca, título, canónica, robots, revisión legal y assets.
  const recalcular=()=>{const archivos=inventario(base);return {...sello,archivos,sha256:huellaInventario(archivos)};};
  const ruta='academy/'+academyPublicada().lecciones[0]+'.html', p=path.join(base,ruta), original=fs.readFileSync(p,'utf8');
  for(const [cambio,mutado] of [
    ['otra etiqueta robots',original.replace(/<meta name="robots" content="[^"]*">/,'<meta name="robots" content="index,follow">')],
    ['sin la fecha de revisión legal',original.replace(/Contenido revisado el <time datetime="[^"]+">/,'Contenido revisado el <time>')],
    ['sin la marca de lección',original.replace(/ data-academy-leccion="[^"]+"/,'')],
    ['vaciada','<!doctype html><title>Lección</title>'],
  ]) {
    assert.notEqual(mutado,original,cambio);
    try{
      fs.writeFileSync(p,mutado);
      assert.throws(()=>validarBase(base,recalcular()),new RegExp('Lecciones de la Academy incompletas en la base: '+ruta.replace(/[.]/g,'\\.')),cambio);
    }finally{fs.writeFileSync(p,original);}
  }
  // Candado del índice (revisión del 08/11/2026): sin sesión, academy/index.html llega
  // bloqueado. Si la base sellada lo trae abierto, sin inert o sin el script con huella,
  // validarBase lo rechaza aunque el sello se recalcule.
  const rutaIndice='academy/index.html', pIndice=path.join(base,rutaIndice), indiceOriginal=fs.readFileSync(pIndice,'utf8');
  for(const [cambio,mutado] of [
    ['abierto por defecto',indiceOriginal.replace('data-academy-candado data-estado="bloqueado"','data-academy-candado data-estado="abierto"')],
    ['contenido sin inert ni aria-hidden',indiceOriginal.replace(' data-academy-candado-contenido inert aria-hidden="true">',' data-academy-candado-contenido>')],
    ['sin el script del candado con huella',indiceOriginal.replace(/<script src="\/assets\/academy-candado-20261108\.[0-9a-f]{12}\.js"><\/script>\n?/,'')],
  ]) {
    assert.notEqual(mutado,indiceOriginal,cambio);
    try{
      fs.writeFileSync(pIndice,mutado);
      assert.throws(()=>validarBase(base,recalcular()),/Lecciones de la Academy incompletas en la base: academy\/index\.html no sale bloqueado/,cambio);
    }finally{fs.writeFileSync(pIndice,indiceOriginal);}
  }
  assert.equal(validarBase(base,sello).sha256,sello.sha256);
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
  // Producción simulada como el worker: con la Academy con cuenta, una lección
  // pedida sin sesión da 303 a /acceso con no-store; una «Próximamente» o una
  // inventada, 404 (desde el 06/11/2026 no queda ninguna «Próximamente»).
  const academy=academyPublicada();
  const conCuenta=academy.acceso==='cuenta'?academy.lecciones:[];
  let visitas=0;const pedidasLeccion=[],pedidas404=[];
  const produccion=(cambios={})=>async(url,init)=>{
    visitas++;const ruta=new URL(url).pathname;
    assert(!['/_headers','/_redirects','/_worker.js','/_routes.json'].includes(ruta),'No solicita configuración privada de Pages');
    const slug=ruta.match(/^\/academy\/([a-z0-9-]+)$/)?.[1];
    if(slug&&!academy.lecciones.includes(slug)){pedidas404.push([slug,init]);return cambios.pendiente?.(slug)||new Response('No encontrado',{status:404});}
    if(slug&&conCuenta.includes(slug)){
      pedidasLeccion.push(init);
      return cambios.leccion?.(slug)||new Response(null,{status:303,headers:{Location:'/acceso?volver=/academy/'+slug,'Cache-Control':'no-store'}});
    }
    const a=archivos.find(a=>'/'+a.ruta.replace(/(^|\/)index\.html$/,'$1').replace(/\.html$/,'')===ruta);
    return new Response(fs.readFileSync(path.join(base,a.ruta)),{status:200,headers:{'content-type':a.ruta.endsWith('.webp')?'image/webp':'application/octet-stream'}});
  };
  await verificarHTTP(base,archivos,produccion());
  prueba('GET verifica todos los recursos públicos, omite solo los cuatro archivos de configuración inaccesibles y pide una lección inventada (y las «Próximamente», si las hay)',
    ()=>{assert.equal(visitas,archivos.length-4+academy.pendientes.length+1);
      assert.deepEqual(pedidas404.map(([slug])=>slug),[...academy.pendientes,LECCION_INEXISTENTE]);
      assert(!archivos.some(a=>a.ruta===`academy/${LECCION_INEXISTENTE}.html`));
      assert(pedidas404.every(([,i])=>i.redirect==='manual'&&i.credentials==='omit'&&!i.headers.Cookie));});
  prueba('con "acceso": "cuenta", las 9 lecciones publicadas se comprueban por su 303 y no por sus bytes',()=>{
    assert.equal(academy.acceso,'cuenta');assert.equal(conCuenta.length,9);assert.equal(academy.pendientes.length,0);
    assert(conCuenta.every(slug=>archivos.some(a=>a.ruta===`academy/${slug}.html`)));
    // Sin cookies, sin seguir el 303 y como una página (Accept: text/html).
    assert.equal(pedidasLeccion.length,9);
    assert(pedidasLeccion.every(i=>i.redirect==='manual'&&i.credentials==='omit'&&i.headers.Accept==='text/html'&&!i.headers.Cookie));
  });
  const leccionBytes=slug=>new Response(fs.readFileSync(path.join(base,'academy',slug+'.html')),{status:200});
  for(const [nombre,cambios,error] of [
    ['una lección servida a cualquiera (puerta apagada en producción)',{leccion:leccionBytes},/no manda a entrar/],
    ['un 303 a otra vuelta',{leccion:()=>new Response(null,{status:303,headers:{Location:'/acceso?volver=/','Cache-Control':'no-store'}})},/no manda a entrar/],
    ['un 303 que se puede guardar',{leccion:slug=>new Response(null,{status:303,headers:{Location:'/acceso?volver=/academy/'+slug,'Cache-Control':'public, max-age=60'}})},/no manda a entrar/],
    ['una lección inventada servida con 200 (o una «Próximamente» publicada)',{pendiente:()=>new Response('<h1>Lección futura</h1>',{status:200})},/no da 404/],
  ]) {
    await assert.rejects(()=>verificarHTTP(base,archivos,produccion(cambios)),error);
    prueba(`la verificación de producción rechaza ${nombre}`,()=>{});
  }
  // Con "publico" (como antes del 05/11/2026), las lecciones vuelven a compararse por bytes.
  const publico={...academy,acceso:'publico'};
  await verificarHTTP(base,archivos,async(url,init)=>{
    const ruta=new URL(url).pathname,slug=ruta.match(/^\/academy\/([a-z0-9-]+)$/)?.[1];
    if(slug&&!academy.lecciones.includes(slug))return new Response('No encontrado',{status:404});
    const a=archivos.find(a=>'/'+a.ruta.replace(/(^|\/)index\.html$/,'$1').replace(/\.html$/,'')===ruta);
    return new Response(fs.readFileSync(path.join(base,a.ruta)),{status:200,headers:{'content-type':a.ruta.endsWith('.webp')?'image/webp':'application/octet-stream'}});
  },publico);
  await assert.rejects(()=>verificarHTTP(base,archivos,produccion(),publico),/HTTP 303/);
  prueba('con "acceso": "publico", una lección vuelve a exigir 200 y sus bytes exactos',()=>{});
  await assert.rejects(()=>verificarHTTP(base,[foto],async()=>new Response('HTML disfrazado',{status:200,headers:{'content-type':'text/html'}})));
  prueba('HTTP 200 con bytes incorrectos no acredita una imagen propia',()=>{});
  await assert.rejects(()=>verificarHTTP(base,[foto],async()=>new Response(fs.readFileSync(path.join(base,foto.ruta)),{status:200,headers:{'content-type':'text/html'}})));
  prueba('WebP con MIME HTML también falla cerrada',()=>{});
  console.log(`\n${correctas} pruebas de precarga correctas; sin SQL ni red remota.`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{
  if(path.dirname(temporal)!==raizTemporal||!path.basename(temporal).startsWith('rwadar-precarga-test-'))throw new Error('Ruta temporal de prueba rechazada');
  fs.rmSync(temporal,{recursive:true,force:true});
});
