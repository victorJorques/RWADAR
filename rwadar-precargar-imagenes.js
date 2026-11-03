'use strict';
/* Precarga editorial: añade exclusivamente WebP a un artefacto ya publicado.
   No construye la web, no aprueba SQL y no ofrece --sin-sincronizar. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const seguridad = require('./rwadar-publicacion-segura');
const {dimensionesWebp, FICHA_ANCHO, FICHA_ALTO, FICHA_BYTES_MAX, TEXTO_PROHIBIDO} = require('./rwadar-ofertas-editoriales');
const {leerBloquesCatalogo, validarCatalogoSnapshot} = require('./rwadar-fichas');
const {sincronizar} = require('./rwadar-app/sincronizar');
const {adelgazarJS} = require('./rwadar-adelgazar');
const {construirWorker, RUTAS: RUTAS_ACCESO} = require('./rwadar-acceso/compilar.cjs');
const PAGINAS_FICHAS = require('./rwadar-fichas-manifiesto');
const ARTEFACTOS_ACCESO = Object.freeze(['_worker.js','_routes.json']);
const RAIZ = __dirname;
const REGISTRO = 'rwadar-editorial-source/ofertas/precargas/manifest.json';
const ORIGEN = 'https://rwadar.pages.dev';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const shaValida = v => typeof v==='string' && /^[a-f0-9]{64}$/.test(v);
const idDespliegueValido = v => typeof v==='string' && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(v);
const slugValido = v => typeof v==='string' && v.length<=160 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
const rutaValida = v => typeof v==='string' && v.length<=240 &&
  /^(?:[a-z0-9_.-]+\/)*[a-z0-9_.-]+$/.test(v) && v.split('/').every(p=>p!=='.'&&p!=='..');
const claves = (v, esperadas) => assert(v && Object.keys(v).sort().join('|')===esperadas.sort().join('|'), 'Campos desconocidos o ausentes');
function archivoSeguro(base, relativa) {
  assert(rutaValida(relativa), 'Ruta no válida');
  let actual = path.resolve(base);
  assert(fs.lstatSync(actual).isDirectory() && !fs.lstatSync(actual).isSymbolicLink(), 'Directorio enlazado');
  for (const parte of relativa.split('/')) {
    actual = path.join(actual, parte);
    const estado = fs.lstatSync(actual);
    assert(!estado.isSymbolicLink(), 'Enlace no permitido');
  }
  assert(fs.lstatSync(actual).isFile(), 'Archivo no regular');
  return actual;
}
function inventario(base) {
  return seguridad.listarArchivosRegulares(base).map(ruta=>{
    const b=fs.readFileSync(archivoSeguro(base,ruta));
    return {ruta,bytes:b.length,sha256:sha(b)};
  });
}
function huellaInventario(archivos) {
  return sha(JSON.stringify([...archivos].sort((a,b)=>a.ruta<b.ruta?-1:a.ruta>b.ruta?1:0)));
}
function cargarRegistro(raiz=RAIZ) {
  const registro=JSON.parse(fs.readFileSync(archivoSeguro(raiz,REGISTRO),'utf8'));
  claves(registro,['versionEsquema','lotes']);
  assert(registro.versionEsquema===1 && Array.isArray(registro.lotes) && registro.lotes.length<=366, 'Registro de precargas no válido');
  const ids=new Set(), rutas=new Set(), publicables=[];
  for(const lote of registro.lotes) {
    claves(lote,['id','baseSha256','revisionAnterior','revisores','imagenes']);
    assert(slugValido(lote.id)&&!ids.has(lote.id)&&shaValida(lote.baseSha256), 'Lote o sello inválido'); ids.add(lote.id);
    assert(/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(lote.revisionAnterior), 'Revisión anterior inválida');
    assert(Array.isArray(lote.revisores)&&lote.revisores.length===2&&new Set(lote.revisores).size===2&&
      lote.revisores.every(r=>typeof r==='string'&&/^[\p{L}\p{N} ._-]{3,80}$/u.test(r)), 'Se requieren dos revisores identificados');
    assert(Array.isArray(lote.imagenes)&&lote.imagenes.length>0&&lote.imagenes.length<=1000, 'No hay imágenes revisadas');
    for(const i of lote.imagenes) {
      claves(i,['slug','archivo','bytes','sha256','ancho','alto','alt']);
      assert(slugValido(i.slug)&&i.archivo===`rwadar-editorial-source/ofertas/precargas/${lote.id}/oferta-${i.slug}.webp`, 'Ruta literal de imagen inválida');
      const salida=`ofertas-editoriales/oferta-${i.slug}.webp`;
      assert(!rutas.has(salida),'Imagen duplicada entre lotes'); rutas.add(salida);
      assert(shaValida(i.sha256)&&Number.isSafeInteger(i.bytes)&&i.bytes>1024&&i.bytes<=FICHA_BYTES_MAX&&
        i.ancho===FICHA_ANCHO&&i.alto===FICHA_ALTO, 'Huella o tamaño de imagen no válido');
      assert(typeof i.alt==='string'&&i.alt.length>=20&&i.alt.length<=400&&!/[\u0000-\u001f\u007f]/.test(i.alt)&&
        /^Ilustración editorial /u.test(i.alt)&&!TEXTO_PROHIBIDO.test(i.alt), 'Texto alternativo inválido');
      const origen=archivoSeguro(raiz,i.archivo), b=fs.readFileSync(origen), dimensiones=dimensionesWebp(b);
      assert(b.length===i.bytes&&sha(b)===i.sha256&&dimensiones.ancho===i.ancho&&dimensiones.alto===i.alto, 'WebP no coincide con el manifiesto');
      publicables.push({origen,salida,bytes:b.length,hashSha256:i.sha256,lote:lote.id});
    }
  }
  // No se incorporan archivos por extensión ni por enumeración del directorio.
  seguridad.validarArbolPublicable(path.join(raiz,'rwadar-editorial-source/ofertas/precargas'),
    ['manifest.json',...registro.lotes.flatMap(l=>l.imagenes.map(i=>i.archivo.replace('rwadar-editorial-source/ofertas/precargas/','')))]);
  return {registro,publicables};
}
function unirActivos(actuales, extras) {
  const resultado=[...actuales], porRuta=new Map(actuales.map(a=>[a.salida,a]));
  for(const extra of extras) {
    const anterior=porRuta.get(extra.salida);
    if(anterior) assert(anterior.bytes===extra.bytes&&anterior.hashSha256===extra.hashSha256,'La precarga cambia una imagen existente');
    else { resultado.push(extra);porRuta.set(extra.salida,extra); }
  }
  return resultado;
}
function comprobarCompuertas() {
  const manifiesto=JSON.parse(fs.readFileSync(path.join(RAIZ,'rwadar-app/data/relanzamiento/estado.json'),'utf8'));
  seguridad.comprobarEstadoLegalPublicacion(fs.readFileSync(path.join(RAIZ,'rwadar-site/privacidad.html'),'utf8'),{exigirDocumentado:true});
  seguridad.comprobarPreparacionRelanzamiento(manifiesto,{destino:'produccion'});
  seguridad.comprobarContenidoPerfilPublicacion({manifiesto,
    transparencia:fs.readFileSync(path.join(RAIZ,'rwadar-site/transparencia-comercial.html'),'utf8'),
    empresas:fs.readFileSync(path.join(RAIZ,'rwadar-site/para-empresas.html'),'utf8')});
  return seguridad.comprobarRevisionGitPublicable({raiz:RAIZ,manifiesto});
}
function catalogoBase(base) {
  return validarCatalogoSnapshot(leerBloquesCatalogo(fs.readFileSync(archivoCatalogo(base),'utf8')));
}
// Fichas que de verdad se desplegaron en la base, sacadas de su snapshot.
function fichasBase(c) {
  const slug=n=>String(n).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  return [...c.plataformas.map(p=>'plataformas/'+p.slug+'.html'),...c.ofertas.map(o=>'ofertas/'+o.slug+'.html'),
    ...c.fuera.map(f=>'fuera-del-radar/'+slug(f.n)+'.html')];
}
function rutasBaseObligatorias(base, excluirLote) {
  const reales=seguridad.listarArchivosRegulares(base), rutas=[...ARTEFACTOS_ACCESO];
  const fichasActuales=new Set(PAGINAS_FICHAS);
  for(const nombre of seguridad.ARCHIVOS_PUBLICABLES.filter(n=>!fichasActuales.has(n))) {
    if(/^assets\/.+\.(?:js|css)$/.test(nombre)) {
      const candidatos=reales.filter(n=>n.replace(/\.[a-f0-9]{12}(\.(?:js|css))$/,'$1')===nombre);
      assert(candidatos.length===1,'Falta un asset obligatorio o está duplicado: '+nombre);
      const candidato=candidatos[0], huella=candidato.match(/\.([a-f0-9]{12})\.(?:js|css)$/)?.[1];
      assert(huella&&sha(fs.readFileSync(archivoSeguro(base,candidato))).startsWith(huella),'Huella de asset incorrecta');
      rutas.push(candidato);
    } else rutas.push(nombre);
  }
  // Estas rutas se derivan del snapshot que realmente se desplegó, no del
  // inventario que se pretende sellar ni de las altas futuras de la fuente.
  const c=catalogoBase(base);
  rutas.push('cambios.html','metodologia.html','novedades.xml',...fichasBase(c));
  const manifiesto=JSON.parse(fs.readFileSync(archivoSeguro(base,'ofertas-editoriales/manifest.json'),'utf8'));
  assert(manifiesto.versionEsquema===2&&Array.isArray(manifiesto.archivos)&&manifiesto.archivos.length===4&&Array.isArray(manifiesto.fichas),'Manifiesto editorial base incompleto');
  rutas.push('ofertas-editoriales/manifest.json');
  const imagenes=[...manifiesto.archivos,...manifiesto.fichas];
  const nombres=new Set();
  for(const i of imagenes) {
    assert(/^[a-z0-9]+(?:-[a-z0-9]+)*\.webp$/.test(i.archivo)&&!nombres.has(i.archivo),'Ruta editorial base inválida');nombres.add(i.archivo);
    const ruta='ofertas-editoriales/'+i.archivo, b=fs.readFileSync(archivoSeguro(base,ruta));
    assert(i.bytes===b.length&&i.hashSha256===sha(b),'Imagen base difiere de su manifiesto');rutas.push(ruta);
  }
  // Los lotes anteriores siguen siendo obligatorios aunque una activación
  // SQL fallase: una precarga posterior no puede borrar esas imágenes.
  for(const i of cargarRegistro().publicables.filter(i=>i.lote!==excluirLote)) {
    const b=fs.readFileSync(archivoSeguro(base,i.salida));
    assert(b.length===i.bytes&&sha(b)===i.hashSha256,'Precarga anterior modificada');rutas.push(i.salida);
  }
  const obligatorias=new Set(rutas);
  for(const o of c.ofertas) assert(obligatorias.has('ofertas-editoriales/oferta-'+o.slug+'.webp'),'Falta imagen propia de una oferta base');
  return [...obligatorias].sort();
}
function validarBase(base, sello, {excluirLote}={}) {
  claves(sello,['versionEsquema','origen','commit','despliegueId','archivos','sha256']);
  assert(sello.versionEsquema===1&&sello.origen===ORIGEN&&/^[a-f0-9]{40}$/.test(sello.commit)&&
    idDespliegueValido(sello.despliegueId)&&Array.isArray(sello.archivos), 'Sello inválido');
  const rutas=new Set();
  for(const a of sello.archivos) {
    claves(a,['ruta','bytes','sha256']);
    assert(rutaValida(a.ruta)&&!rutas.has(a.ruta)&&Number.isSafeInteger(a.bytes)&&a.bytes>=0&&shaValida(a.sha256),'Inventario inválido');
    rutas.add(a.ruta);
    const original=a.ruta.replace(/\.[a-f0-9]{12}(\.(?:js|css))$/,'$1');
    assert(seguridad.ARCHIVOS_PUBLICABLES.includes(original)||ARTEFACTOS_ACCESO.includes(a.ruta)||/^ofertas-editoriales\/(?:manifest\.json|[a-z0-9-]+\.webp)$/.test(a.ruta),'Archivo base fuera de la lista cerrada');
  }
  for(const esencial of ['index.html','sw.js','_headers','_redirects',...ARTEFACTOS_ACCESO]) assert(rutas.has(esencial),'Base incompleta');
  const obligatorias=rutasBaseObligatorias(base,excluirLote);
  seguridad.validarArbolPublicable(base,obligatorias);
  assert.deepEqual([...rutas].sort(),obligatorias,'El sello omite o añade recursos frente al catálogo y las listas cerradas');
  assert.deepEqual(inventario(base),sello.archivos,'La base cambió después del sellado');
  assert(sello.sha256===huellaInventario(sello.archivos),'Sello no coincide');
  for(const config of ['_headers','_redirects']) assert(fs.readFileSync(path.join(base,config)).equals(fs.readFileSync(path.join(RAIZ,'rwadar-site',config))),'Configuración distinta de la fuente aprobada');
  // Estos dos archivos los genera el publicador: no basta con que un sello
  // recalculado acepte otros bytes, otro BFF o una exclusión de sus rutas.
  // El worker lleva dentro la lista de fichas publicadas. Se compila con las
  // fichas del snapshot de la base, no con el manifiesto del árbol: el ciclo
  // añade un alta al manifiesto antes de precargar su imagen.
  const accesoEsperado={'_worker.js':construirWorker(undefined,{fichas:fichasBase(catalogoBase(base))}),'_routes.json':JSON.stringify(RUTAS_ACCESO)+'\n'};
  for(const nombre of ARTEFACTOS_ACCESO) assert(fs.readFileSync(archivoSeguro(base,nombre)).equals(Buffer.from(accesoEsperado[nombre],'utf8')),
    'Artefacto de acceso distinto de la fuente aprobada: '+nombre);
  seguridad.validarOrigenPublicable(base);
  return sello;
}
function archivoCatalogo(base) {
  const nombres=seguridad.listarArchivosRegulares(base).filter(n=>/^assets\/catalogo-publico-20261022(?:\.[a-f0-9]{12})?\.js$/.test(n));
  assert(nombres.length===1,'Snapshot base ambiguo'); return path.join(base,nombres[0]);
}
async function verificarHTTP(base, archivos, fetchFn=globalThis.fetch) {
  let posicion=0;
  await Promise.all(Array.from({length:4},async()=>{
    while(posicion<archivos.length) {
      const a=archivos[posicion++];
      if(['_headers','_redirects',...ARTEFACTOS_ACCESO].includes(a.ruta))continue;
      const ruta='/'+a.ruta.replace(/(^|\/)index\.html$/,'$1').replace(/\.html$/,'');
      const r=await fetchFn(ORIGEN+ruta,{method:'GET',cache:'no-store',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(45000)});
      assert(r.status===200,`HTTP ${r.status} para ${ruta}`);
      const bytes=Buffer.from(await r.arrayBuffer());
      assert(bytes.length===a.bytes&&sha(bytes)===a.sha256,`Producción difiere en ${ruta}`);
      if(a.ruta.endsWith('.webp'))assert(/^image\/webp(?:;|$)/i.test(r.headers.get('content-type')||''),'Respuesta WebP no es imagen');
    }
  }));
}
function ejecutarWranglerLectura() {
  const args=['--yes','wrangler@4.125.0','pages','deployment','list','--project-name','rwadar','--environment','production','--json'];
  const opciones={cwd:RAIZ,encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:60000};
  return process.platform==='win32'
    ?execFileSync(process.env.ComSpec||'cmd.exe',['/d','/s','/c','npx '+args.join(' ')],opciones)
    :execFileSync('npx',args,opciones);
}
function identidadListaWrangler(salida) {
  const filas=JSON.parse(salida);
  assert(Array.isArray(filas)&&filas.length>0,'Wrangler no devolvió despliegues de producción');
  const primera=filas[0];
  assert(filas.every(f=>idDespliegueValido(f.Id)&&f.Environment==='Production'&&f.Branch==='main'&&
    f.Deployment===`https://${f.Id.slice(0,8)}.rwadar.pages.dev`),'Listado de producción inesperado');
  assert(typeof primera.Status==='string'&&/^(?:\d+ (?:seconds?|minutes?|hours?|days?|weeks?|months?|years?) ago|just now)$/.test(primera.Status),
    'El último despliegue de producción no consta terminado');
  return primera.Id;
}
async function despliegueProduccion(fetchFn=globalThis.fetch, entorno=process.env, cliFn=ejecutarWranglerLectura) {
  // Sólo credenciales vigentes suministradas al proceso. No busca historiales,
  // perfiles antiguos ni imprime el token. Si faltan, no puede publicar.
  const token=entorno.CLOUDFLARE_API_TOKEN, cuenta=entorno.CLOUDFLARE_ACCOUNT_ID;
  if(!token&&!cuenta) return identidadListaWrangler(cliFn());
  assert(typeof token==='string'&&token.length>=20&&typeof cuenta==='string'&&/^[a-f0-9]{32}$/.test(cuenta),
    'Las credenciales vigentes de Cloudflare están incompletas');
  const respuesta=await fetchFn(`https://api.cloudflare.com/client/v4/accounts/${cuenta}/pages/projects/rwadar`,
    {method:'GET',headers:{Authorization:'Bearer '+token},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(30000)});
  assert(respuesta.status===200,'No se puede leer el proyecto de producción');
  const cuerpo=await respuesta.json(), p=cuerpo.result, d=p?.canonical_deployment;
  assert(cuerpo.success===true&&p?.name==='rwadar'&&p.production_branch==='main'&&
    d?.environment==='production'&&d.latest_stage?.status==='success'&&idDespliegueValido(d.id),
    'Producción no tiene una identidad canónica comprobable');
  return d.id;
}
async function comprobarAndroidCompatible(fetchFn=globalThis.fetch) {
  const r=await fetchFn('https://api.github.com/repos/victorJorques/RWAdar-downloads/releases/latest',
    {method:'GET',headers:{Accept:'application/vnd.github+json'},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(30000)});
  assert(r.status===200,'No se puede comprobar el Android público actual');
  const release=await r.json(), version=/^v(\d+)\.(\d+)\.(\d+)$/.exec(release.tag_name||'');
  assert(version&&!release.draft&&!release.prerelease&&Number.isSafeInteger(release.id)&&
    (Number(version[1])>1||Number(version[1])===1&&Number(version[2])>=4),
    'Antes de activar más de 49 ofertas, latest debe ser Android 1.4.0 o posterior comprobado; 1.3.2 no es compatible');
  const nombres=['RWAdar.apk','SHA256SUMS.txt',`rwadar-android-${version.slice(1).join('')}-evidence.zip`];
  assert(Array.isArray(release.assets)&&nombres.every(nombre=>release.assets.some(a=>a.name===nombre&&a.size>0&&/^sha256:[a-f0-9]{64}$/.test(a.digest||''))),
    'La release Android carece de APK, sumas o evidencia pública identificada por SHA-256');
  return {id:release.id,version:release.tag_name};
}
async function comprobarCatalogoVivo(base, trabajo, revisionAnterior) {
  const codigo=fs.readFileSync(archivoCatalogo(base),'utf8'), anterior=leerBloquesCatalogo(codigo);
  const validado=validarCatalogoSnapshot(anterior);
  assert([...anterior.plataformas,...anterior.ofertas].every(f=>f.revisionId===revisionAnterior),'La revisión anterior no corresponde a la base');
  const jsPath=path.join(trabajo,'catalogo-consultado.js');fs.writeFileSync(jsPath,codigo);
  // Usa el lector/sincronizador completo, escribiendo SOLO en el directorio
  // temporal. Nunca altera rwadar-site ni permite saltarse la consulta remota.
  await sincronizar({jsPath,csvPath:path.join(trabajo,'consulta.csv'),versionEsquema:2,
    manifiesto:validado.manifiesto,permitirAmpliacion:true});
  assert.deepEqual(leerBloquesCatalogo(fs.readFileSync(jsPath,'utf8')),anterior,
    'El catálogo público ya cambió: no desplegar una base anterior ni activar este SQL');
}
function preparar(base, sello, lote, extras, destino) {
  validarBase(base,sello,{excluirLote:lote.id});
  assert(lote.baseSha256===sello.sha256,'El lote no fue revisado para esta base');
  const principales=sello.archivos.filter(a=>/^assets\/rwadar-20260820\.[a-f0-9]{12}\.js$/.test(a.ruta));
  assert(principales.length===1&&fs.readFileSync(path.join(base,principales[0].ruta),'utf8').includes('RUTAS_FICHAS_DESPLEGADAS'),
    'Primero publicar normalmente la compatibilidad de altas sobre el catálogo anterior');
  assert(!fs.existsSync(destino),'El directorio de salida ya existe');
  fs.mkdirSync(destino,{recursive:true});
  for(const a of sello.archivos) {
    const target=path.join(destino,a.ruta);fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.copyFileSync(archivoSeguro(base,a.ruta),target,fs.constants.COPYFILE_EXCL);
  }
  for(const a of extras) {
    assert(!sello.archivos.some(b=>b.ruta===a.salida),'La precarga solo añade; no sustituye imágenes');
    const target=path.join(destino,a.salida);fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.copyFileSync(a.origen,target,fs.constants.COPYFILE_EXCL);
  }
  const esperados=[...sello.archivos,...extras.map(a=>({ruta:a.salida,bytes:a.bytes,sha256:a.hashSha256}))].sort((a,b)=>a.ruta<b.ruta?-1:a.ruta>b.ruta?1:0);
  seguridad.validarArbolPublicable(destino,esperados.map(a=>a.ruta));
  assert.deepEqual(inventario(destino),esperados,'La salida cambia bytes fuera de las imágenes');
  return esperados;
}
async function main(args=process.argv.slice(2)) {
  assert(args.every(a=>['--sellar','--comprobar','--produccion','--verificar'].includes(a)||/^--(?:base|lote)=.+$/.test(a)),'Argumento desconocido');
  const modos=args.filter(a=>['--sellar','--comprobar','--produccion','--verificar'].includes(a));
  assert(modos.length===1&&new Set(args.map(a=>a.split('=')[0])).size===args.length,'Se requiere un único modo sin duplicados');
  const baseArg=args.find(a=>a.startsWith('--base='))?.slice(7);
  assert(baseArg,'Falta --base=<carpeta con artefacto y sello.json>');
  const carpeta=path.resolve(RAIZ,baseArg), relativo=path.relative(RAIZ,carpeta);
  assert(relativo&&!relativo.startsWith('..')&&!path.isAbsolute(relativo)&&relativo.split(path.sep)[0].startsWith('rwadar-entrega-'),'La base debe estar en una carpeta de evidencia dentro del repositorio');
  let directorio=RAIZ;
  for(const parte of relativo.split(path.sep)) {
    directorio=path.join(directorio,parte);
    assert(fs.lstatSync(directorio).isDirectory()&&!fs.lstatSync(directorio).isSymbolicLink(),'Directorio de evidencia enlazado');
  }
  const base=path.join(carpeta,'artefacto'), selloPath=path.join(carpeta,'sello.json');
  if(modos[0]==='--sellar') {
    assert(!args.some(a=>a.startsWith('--lote='))&&!fs.existsSync(selloPath),'Sello existente o lote indebido');
    const revision=comprobarCompuertas(), archivos=inventario(base);
    const despliegueId=await despliegueProduccion();
    const sello={versionEsquema:1,origen:ORIGEN,commit:revision.commitAprobado,despliegueId,archivos,sha256:huellaInventario(archivos)};
    validarBase(base,sello);
    const mainAsset=archivos.find(a=>/^assets\/rwadar-20260820\.[a-f0-9]{12}\.js$/.test(a.ruta));
    assert(mainAsset&&fs.readFileSync(path.join(base,mainAsset.ruta),'utf8')===adelgazarJS(fs.readFileSync(path.join(RAIZ,'rwadar-site/assets/rwadar-20260820.js'),'utf8')),
      'La base no contiene el comportamiento web aprobado actual');
    await verificarHTTP(base,archivos);assert.equal(await despliegueProduccion(),despliegueId,'Producción cambió durante el sellado');comprobarCompuertas();
    fs.writeFileSync(selloPath,JSON.stringify(sello,null,2)+'\n',{flag:'wx'});
    console.log(JSON.stringify({sellado:true,archivos:archivos.length,sha256:sello.sha256}));return;
  }
  const {registro,publicables}=cargarRegistro(), id=args.find(a=>a.startsWith('--lote='))?.slice(7);
  const lote=registro.lotes.find(l=>l.id===id);assert(lote,'El lote no está en el registro literal revisado');
  const sello=JSON.parse(fs.readFileSync(archivoSeguro(carpeta,'sello.json'),'utf8'));
  const extras=publicables.filter(a=>a.lote===id);
  const trabajo=fs.mkdtempSync(path.join(carpeta,'comprobacion-')), salida=path.join(trabajo,'publicado');
  const esperados=preparar(base,sello,lote,extras,salida);
  if(modos[0]==='--comprobar') {console.log(JSON.stringify({preparado:true,base:sello.archivos.length,imagenes:extras.length,salida}));return;}
  comprobarCompuertas();
  const pruebaPath=path.join(carpeta,'precarga-'+id+'.json');
  if(modos[0]==='--verificar') {
    const propia=JSON.parse(fs.readFileSync(archivoSeguro(carpeta,'precarga-'+id+'.json'),'utf8'));
    assert(propia.lote===id&&propia.baseSha256===sello.sha256&&idDespliegueValido(propia.despliegueId),'Falta identidad de la precarga propia');
    assert.equal(await despliegueProduccion(),propia.despliegueId,'Producción ya no es nuestra precarga; no activar SQL');
    const android=await comprobarAndroidCompatible();
    await verificarHTTP(salida,esperados);
    await comprobarCatalogoVivo(base,trabajo,lote.revisionAnterior);
    assert.equal(await despliegueProduccion(),propia.despliegueId,'Producción cambió durante la comprobación');
    const evidencia={verificado:true,origen:ORIGEN,lote:id,baseSha256:sello.sha256,revisionAnterior:lote.revisionAnterior,
      despliegueId:propia.despliegueId,android,comprobadoEl:new Date().toISOString(),imagenes:extras.map(a=>({ruta:a.salida,bytes:a.bytes,sha256:a.hashSha256}))};
    const archivo=path.join(trabajo,'verificacion.json');fs.writeFileSync(archivo,JSON.stringify(evidencia,null,2)+'\n',{flag:'wx'});
    console.log(JSON.stringify({...evidencia,evidencia:archivo}));return;
  }
  assert(!fs.existsSync(pruebaPath),'Ya existe una precarga propia: verificarla, no republicar ni revertir automáticamente');
  const android=await comprobarAndroidCompatible();
  assert.equal(await despliegueProduccion(),sello.despliegueId,'Producción ya no es la base sellada; puede contener otras precargas');
  await seguridad.comprobarConfiguracionAuth();
  await verificarHTTP(base,sello.archivos);
  await comprobarCatalogoVivo(base,trabajo,lote.revisionAnterior);
  comprobarCompuertas();
  assert.equal(await despliegueProduccion(),sello.despliegueId,'Producción cambió: detenerse antes de desplegar');
  // Validar otra vez inmediatamente antes de Wrangler. Sólo Pages rwadar/main.
  assert.deepEqual(inventario(salida),esperados);
  const comando=['--yes','wrangler@4.125.0','pages','deploy',salida,'--project-name',seguridad.PROYECTO_CLOUDFLARE,'--branch','main'];
  let publicado;
  if(process.platform==='win32') {
    const argumentos=comando.map(a=>'"'+a.replace(/"/g,'""')+'"').join(' ');
    // Todas las rutas proceden de RAIZ/base validada; no se acepta metacódigo.
    assert(!/[&|<>^%!\r\n]/.test(argumentos),'Ruta incompatible con cmd');
    publicado=execFileSync(process.env.ComSpec||'cmd.exe',['/d','/s','/c','npx '+argumentos],{cwd:RAIZ,encoding:'utf8',stdio:['ignore','pipe','pipe']});
  } else publicado=execFileSync('npx',comando,{cwd:RAIZ,encoding:'utf8',stdio:['ignore','pipe','pipe']});
  const urls=[...publicado.matchAll(/https:\/\/([a-f0-9]{8})\.rwadar\.pages\.dev/g)];
  assert(urls.length>0,'Wrangler no confirmó la URL de la precarga propia; no activar SQL');
  const prefijo=urls[urls.length-1][1], despliegueId=await despliegueProduccion();
  assert(despliegueId.startsWith(prefijo+'-'),'La producción canónica no es nuestra precarga; no activar SQL');
  fs.writeFileSync(pruebaPath,JSON.stringify({lote:id,baseSha256:sello.sha256,despliegueId,estado:'pendiente-verificacion'},null,2)+'\n',{flag:'wx'});
  await verificarHTTP(salida,esperados);
  await comprobarCatalogoVivo(base,trabajo,lote.revisionAnterior);
  assert.equal(await despliegueProduccion(),despliegueId,'Producción cambió tras la precarga; no activar SQL');
  const evidencia={verificado:true,origen:ORIGEN,lote:id,baseSha256:sello.sha256,despliegueId,android,comprobadoEl:new Date().toISOString(),archivos:esperados};
  fs.writeFileSync(path.join(trabajo,'evidencia.json'),JSON.stringify(evidencia,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({precargado:true,imagenes:extras.length,evidencia:path.join(trabajo,'evidencia.json')}));
}
module.exports={cargarRegistro,unirActivos,inventario,huellaInventario,validarBase,verificarHTTP,preparar,despliegueProduccion,identidadListaWrangler,comprobarAndroidCompatible,main};
if(require.main===module)main().catch(e=>{console.error('PRECARGA BLOQUEADA:',e.message);process.exitCode=1;});
