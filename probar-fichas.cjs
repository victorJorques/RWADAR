'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {construirSalidas,comprobar,esc,enlace,leerCatalogo,leerBloquesCatalogo,
  validarCatalogoSnapshot,validarRutasCatalogo}=require('./rwadar-fichas');
const {snapshotLocal,sanearIndiceLocal}=require('./rwadar-servir');
const {cargarFuentesLocales,construirSqlImportacion}=require('./rwadar-app/catalogo-publico');
const permitidas=require('./rwadar-fichas-manifiesto');
const {ARCHIVOS_PUBLICABLES}=require('./rwadar-publicacion-segura');
const raiz=__dirname;
const catalogo=leerCatalogo();
const salidas=construirSalidas();
let pruebas=0;
function verificar(nombre,fn){fn();pruebas++;console.log('OK '+nombre);}
verificar('fichas completas del manifiesto y tres destinos de método/novedades en lista cerrada',()=>{
  assert.equal(permitidas.filter(n=>n.startsWith('ofertas/')).length,catalogo.manifiesto.ofertasEsperadas);
  assert.equal(permitidas.filter(n=>n.startsWith('plataformas/')).length,catalogo.manifiesto.plataformasEsperadas);
  assert.equal(permitidas.filter(n=>n.startsWith('fuera-del-radar/')).length,catalogo.fuera.length);
  assert(permitidas.every(n=>ARCHIVOS_PUBLICABLES.includes(n)));
  assert.deepEqual(comprobar(),[]);
});
verificar('snapshot expandido requiere datos completos y revisión de cada ruta nueva',()=>{
  const ampliado=structuredClone(catalogo);
  ampliado.ofertas.push({...structuredClone(ampliado.ofertas.find(o=>o.coleccion==='principales')),
    slug:'prueba-nueva-oferta',titulo:'Nueva referencia sintética para pruebas'});
  ampliado.plataformas.push({...structuredClone(ampliado.plataformas[0]),
    slug:'prueba-nueva-plataforma',n:'Nueva plataforma sintética'});
  for(const fila of [...ampliado.plataformas,...ampliado.ofertas]){
    fila.ofertas_esperadas++;fila.plataformas_esperadas++;fila.colecciones_esperadas.principales++;
  }
  const completo=validarCatalogoSnapshot(ampliado);
  assert.equal(completo.ofertas.length,catalogo.manifiesto.ofertasEsperadas+1);
  assert.equal(completo.plataformas.length,catalogo.manifiesto.plataformasEsperadas+1);
  assert.throws(()=>construirSalidas({catalogo:completo}),/manifiesto cerrado/);
  const revisadas=[...permitidas,'ofertas/prueba-nueva-oferta.html','plataformas/prueba-nueva-plataforma.html'];
  validarRutasCatalogo(completo,revisadas);
  const salidaAmpliada=construirSalidas({catalogo:completo,paginasPermitidas:revisadas});
  assert(salidaAmpliada.has('ofertas/prueba-nueva-oferta.html'));
  assert(salidaAmpliada.has('plataformas/prueba-nueva-plataforma.html'));
  assert(salidaAmpliada.get('sitemap.xml').includes('/ofertas/prueba-nueva-oferta</loc>'));
  assert.throws(()=>validarRutasCatalogo(completo,[...revisadas,'../archivo-privado.html']),/no válido/);
  for(const alterar of [
    c=>{c.ofertas.pop();},c=>{c.plataformas.pop();},
    c=>{c.ofertas.at(-1).ofertas_esperadas--;},
    c=>{c.ofertas.at(-1).revisionId='00000000-0000-0000-0000-000000000000';},
    c=>{c.ofertas.at(-1).documentacion=null;},
    c=>{c.ofertas.at(-1).url='javascript:alert(1)';},
  ]){const incompleto=structuredClone(ampliado);alterar(incompleto);assert.throws(()=>validarCatalogoSnapshot(incompleto));}
  // Desde el 02/11/2026 un catálogo coherente más pequeño que el anterior se acepta
  // (retirada deliberada); sus páginas siguen limitadas a la lista cerrada revisada.
  assert.equal(validarCatalogoSnapshot(catalogo,{manifiesto:completo.manifiesto}).ofertas.length,
    catalogo.manifiesto.ofertasEsperadas);
});
verificar('el lector estático no ejecuta expresiones ni acepta propiedades activas del catálogo',()=>{
  for(const p of ['(()=>{throw Error("no ejecutar");})()','{get n(){throw Error("no ejecutar");}}','{...secreto}']){
    assert.throws(()=>leerBloquesCatalogo('const P=['+p+'];const EMI=[];const FUERA=[];'),
      /El catálogo/,p);
  }
  assert.deepEqual(leerBloquesCatalogo('const P=[{n:"dato"}]; const EMI=[]; const FUERA=[];'),
    {plataformas:[{n:'dato'}],ofertas:[],fuera:[]});
  for(const codigo of [
    'const P=[];const EMI=[];const FUERA=[];throw Error("no ejecutar");',
    'let P=[];const EMI=[];const FUERA=[];',
    'const P=[{n:"a",n:"b"}];const EMI=[];const FUERA=[];',
    'const P=[];const EMI=[];const FUERA=[];const EXTRA=[];',
    'const P=[];const EMI=[];',
  ]) assert.throws(()=>leerBloquesCatalogo(codigo));
});
verificar('servidor preparado crece con manifiesto cerrado y rechaza truncados o identidad falsa',()=>{
  const baseTemporal=path.join(raiz,'rwadar-entrega-20261022');
  fs.mkdirSync(baseTemporal,{recursive:true});
  const temporal=fs.mkdtempSync(path.join(baseTemporal,'fichas-'));
  try{
    // La entrega local es la de la revisión publicada; con varias entregas el mismo
    // día (AAAA-MM-DD.N) la fecha del lote ya no basta para encontrarla.
    const importacionesRaiz=path.join(raiz,'rwadar-app/data/importaciones');
    const etiquetaPublicada=fs.readdirSync(importacionesRaiz).map(d=>d.match(/^catalogo-(.+)-v2$/)?.[1]).filter(Boolean)
      .find(r=>{try{return JSON.parse(fs.readFileSync(path.join(importacionesRaiz,'catalogo-'+r+'-v2','revision.json'),'utf8'))
        .revisionId===(catalogo.ofertas[0].revisionId||catalogo.ofertas[0].revision_id);}catch{return false;}});
    const fecha=etiquetaPublicada||catalogo.revision,lote=fecha+'-v2';
    const carpeta=path.join(temporal,'rwadar-app/data/verificaciones',lote);
    const importaciones=path.join(temporal,'rwadar-app/data/importaciones','catalogo-'+lote);
    fs.mkdirSync(carpeta,{recursive:true});fs.mkdirSync(importaciones,{recursive:true});
    fs.mkdirSync(path.join(temporal,'rwadar-site/assets'),{recursive:true});
    fs.writeFileSync(path.join(temporal,'rwadar-site/assets/catalogo-publico-20261022.js'),
      'const P='+JSON.stringify(catalogo.plataformas)+';const EMI='+JSON.stringify(catalogo.ofertas)+';const FUERA='+JSON.stringify(catalogo.fuera)+';');
    const fuentes=cargarFuentesLocales(raiz,{revision:fecha,versionEsquema:2});
    const nueva={...structuredClone(fuentes.escaparate.ofertas.find(o=>o.coleccion==='principales')),
      slug:'prueba-nueva-oferta',titulo:'Nueva referencia sintética para pruebas'};
    fuentes.escaparate.ofertas.push(nueva);fuentes.manifiesto.ofertasEsperadas++;
    fuentes.manifiesto.coleccionesEsperadas.principales++;
    const identidad=construirSqlImportacion(fuentes);
    const revision={versionEsquema:2,revisionId:identidad.revisionId,hash:identidad.hash,fechaRadar:fuentes.radar.verificadoEl,
      plataformas:fuentes.manifiesto.plataformasEsperadas,ofertas:fuentes.manifiesto.ofertasEsperadas};
    const documentos=Object.fromEntries(fuentes.escaparate.ofertas.map(o=>[o.slug,o.documentacion]));
    const escribir=(nombre,valor)=>fs.writeFileSync(path.join(carpeta,nombre),JSON.stringify(valor));
    const guardarRevision=valor=>fs.writeFileSync(path.join(importaciones,'revision.json'),JSON.stringify(valor));
    escribir('radar-canonico-26.json',fuentes.radar);
    escribir('escaparate-publicacion.json',fuentes.escaparate);
    escribir('documentacion-ofertas.json',documentos);
    escribir('manifiesto-catalogo.json',{version_esquema:2,plataformas_esperadas:fuentes.manifiesto.plataformasEsperadas,
      ofertas_esperadas:fuentes.manifiesto.ofertasEsperadas,colecciones_esperadas:fuentes.manifiesto.coleccionesEsperadas});
    guardarRevision(revision);
    const preparado=snapshotLocal({raiz:temporal,lote});
    assert.equal(preparado.ofertas.length,catalogo.ofertas.length+1);
    assert(preparado.preparado);
    assert(preparado.plataformas.concat(preparado.ofertas).every(f=>f.ofertas_esperadas===preparado.ofertas.length));
    fuentes.escaparate.ofertas.pop();escribir('escaparate-publicacion.json',fuentes.escaparate);
    assert.throws(()=>snapshotLocal({raiz:temporal,lote}));
    fuentes.escaparate.ofertas.push(nueva);escribir('escaparate-publicacion.json',fuentes.escaparate);
    delete documentos[nueva.slug];escribir('documentacion-ofertas.json',documentos);
    assert.throws(()=>snapshotLocal({raiz:temporal,lote}));
    documentos[nueva.slug]=nueva.documentacion;escribir('documentacion-ofertas.json',documentos);
    guardarRevision({...revision,hash:'0'.repeat(64)});
    assert.throws(()=>snapshotLocal({raiz:temporal,lote}),/identidad/);
    assert.throws(()=>snapshotLocal({raiz:temporal,lote:'../'+lote}),/no válido/);
  }finally{
    assert(path.resolve(temporal).startsWith(path.resolve(baseTemporal)+path.sep) && path.basename(temporal).startsWith('fichas-'));
    fs.rmSync(temporal,{recursive:true,force:true});
  }
});
verificar('marcadores del servidor no conservan contadores antiguos al crecer',()=>{
  const html='<div id="grid"><!--pre:ini-->viejo<!--pre:fin--></div><div id="outlist"><!--pre:ini-->viejo<!--pre:fin--></div>'+
    '<span class="n">57</span><span class="l">Analizadas</span><span class="n oro" id="s1">27</span>'+
    '<span class="n menta" id="s3">19</span><span class="n coral" id="s4">8</span>';
  const saneado=sanearIndiceLocal(html);
  assert(!/>57<|>27<|>19<|>8</.test(saneado));assert.equal((saneado.match(/>—</g)||[]).length,4);
});
for(const [nombre,contenido] of salidas){
  if(!nombre.endsWith('.html')) continue;
  verificar(nombre+' tiene canonical propio, un h1 y metadatos sin venta',()=>{
    const ruta='/'+nombre.slice(0,-5);
    assert(contenido.includes('<link rel="canonical" href="https://rwadar.pages.dev'+ruta+'">'));
    const titulos=[...contenido.matchAll(/<h1\b([^>]*)>/g)];
    assert.equal(titulos.length,1);
    if(contenido.includes('data-ficha-consulta')){
      assert(titulos[0][1].includes('data-idioma-fuente="es"'));
      assert(titulos[0][1].includes('lang="es"'));
      assert(titulos[0][1].includes('translate="no"'));
    }
    const titulo=contenido.match(/<title>(.*?)<\/title>/s)[1];
    assert(titulo.length<=65,nombre+' título');
    assert(contenido.match(/name="description" content="([^"]*)"/)[1].length<=200,nombre+' descripción escapada');
    assert(!/<style\b|\sstyle\s*=|\son\w+\s*=/i.test(contenido));
    for(const match of contenido.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
      if(/src=/.test(match[1])) continue;
      assert(/application\/ld\+json/.test(match[1]));
      const ld=JSON.parse(match[2]);
      assert.equal(ld['@type'],'WebPage');
      assert(!/"@type":"(?:Offer|Product|AggregateRating)"|"price"/.test(match[2]));
      assert.equal(ld.url,'https://rwadar.pages.dev'+ruta);
    }
    assert(!/https?:\/\/claude\.ai/.test(contenido));
  });
}
verificar('importes no aparecen como condiciones vigentes sin ejecutar la guarda actual',()=>{
  const pagina=salidas.get('ofertas/spiko-letras-del-tesoro-euro.html');
  assert(/data-campo="minimo"[^>]*>Consulta la fuente/.test(pagina));
  assert(/data-campo="accesoEspana"[^>]*>Sin comprobar si se puede contratar desde España/.test(pagina));
  for(const campo of ['minimo','accesoEspana','costes','salida']){
    const atributos=pagina.match(new RegExp('<(?:dd|p)\\b([^>]*data-campo="'+campo+'"[^>]*)>'))?.[1] || '';
    assert(atributos.includes('data-idioma-fuente="es"'));
    assert(atributos.includes('lang="es"'));
    assert(atributos.includes('translate="no"'));
  }
  // LISTA-FINAL.md fila 44 (revisión de frases que pidió Víctor, 04/11/2026).
  assert(pagina.includes('El dato puede ser más antiguo'));
  assert(pagina.includes('No es una fotografía del activo real'));
});
verificar('la ficha abierta reevalúa la caducidad al volver y sin HTML de la fuente',()=>{
  const codigo=fs.readFileSync(path.join(raiz,'rwadar-site/assets/ficha-pagina-20261022.js'),'utf8');
  const campos=Object.fromEntries(['minimo','accesoEspana','salida','costes','estado'].map(n=>[n,{textContent:'',appendChild(){}}]));
  const oferta=leerCatalogo().ofertas.find(o=>o.slug==='spiko-letras-del-tesoro-euro');
  const pagina={dataset:{oferta:JSON.stringify(oferta)},querySelector:selector=>campos[selector.match(/"([^"]+)"/)[1]]};
  let volver,intervalo,reloj=new Date('2026-10-21T12:00:00Z');
  const api=require('./rwadar-movil/lib/ficha-editorial');
  const contexto={globalThis:{RWAdarFichaEditorial:{resumenOferta:o=>api.resumenOferta(o,[],reloj)}},
    document:{hidden:false,querySelector:()=>pagina,createElement:()=>({}),addEventListener:(e,fn)=>{if(e==='visibilitychange')volver=fn;}},
    window:{setInterval:fn=>{intervalo=fn;}}};
  vm.runInNewContext(codigo,contexto,{timeout:1000});
  assert.equal(typeof volver,'function');assert.equal(typeof intervalo,'function');
  reloj=new Date('2026-11-01T12:00:00Z');volver();
  assert.match(campos.minimo.textContent,/Sin mínimo vigente/);
  assert.match(campos.estado.textContent,/cifras ocultas/);
  assert(!codigo.includes('innerHTML'));
});
verificar('escape y enlaces bloquean inyección, credenciales y artefactos privados',()=>{
  assert.equal(esc('<img src=x onerror="x">'), '&lt;img src=x onerror=&quot;x&quot;&gt;');
  for(const u of ['javascript:alert(1)','https://u:p@example.com','https://claude.ai/code/artifact/x'])assert.equal(enlace(u),null);
});
verificar('la ficha fija enseña «Transparencia: lo que hemos comprobado» sin notas ni recomendación',()=>{
  const pagina=salidas.get('ofertas/robinhood-classic-stock-tokens.html');
  assert(pagina.includes('<h2 id="transparencia">Transparencia: lo que hemos comprobado</h2>'));
  assert(pagina.includes('Es una comprobación de la documentación, no una recomendación de inversión.'));
  assert.equal((pagina.match(/<li data-cumple="(?:si|no)">/g)||[]).length,5);
  assert(/<p data-campo="vigencia"[^>]*>Se comprueba al abrir la página/.test(pagina));
  assert(pagina.includes('Puntos fuertes, con su fuente'));
  assert(!/(?<![\d,.])[0-5]\s*\/\s*5(?!\d)/.test(pagina.replace(/<[^>]*>/g,' ')));
  const sinPuntos=salidas.get('ofertas/hausera-proximas-ofertas.html');
  assert(sinPuntos.includes('Transparencia: lo que hemos comprobado')&&!sinPuntos.includes('Puntos fuertes, con su fuente'));
});
// Corrección (03/11): la página fija enlaza la fuente de cada comprobación, con la misma fecha que la ficha
// de la web, y lo que escribe RWAdar se traduce (class="ui"); solo transparencia.json y el catálogo van como fuente.
verificar('la transparencia de la página fija lleva su fuente fechada y separa la interfaz del texto de la fuente',()=>{
  const pagina=salidas.get('ofertas/robinhood-classic-stock-tokens.html');
  const filas=[...pagina.matchAll(/<li data-cumple="(si|no)">([\s\S]*?)<\/li>/g)].map(m=>m[2]);
  assert.equal(filas.length,5);
  for(const i of [0,1,2,3])assert(/<a href="https:[^"]+" target="_blank" rel="noopener noreferrer"><span data-idioma-fuente="es"[^>]*>[^<]+<\/span> ↗<\/a> <span>· consultada el \d{2}\.\d{2}\.\d{4}<\/span>/.test(filas[i]),'fuente de la fila '+(i+1));
  assert(/<p data-campo="contratable" class="ui">Es una oferta principal y la fuente dice que se contrata desde España\.<\/p>/.test(filas[0]));
  assert(/<p data-idioma-fuente="es"[^>]*>[^<]+<\/p>/.test(filas[1]));
  assert(/<p data-campo="minimoSalida" class="ui"><span>Mínimo:<\/span> <span data-idioma-fuente="es"[^>]*>1 €<\/span>\. <span>Salida:<\/span> <span data-idioma-fuente="es"[^>]*>[^<]+<\/span>\.<\/p>/.test(filas[3]));
  assert(pagina.includes('<p class="ui">Es una comprobación de la documentación, no una recomendación de inversión.</p>'));
  assert(!/consulta \d{2}\/\d{2}\/\d{4}<\/span><\/p><\/li>/.test(pagina.slice(pagina.indexOf('id="transparencia"'))));
});
verificar('con la revisión vencida la página fija deja de afirmar que se contrata hoy y que el mínimo y la salida siguen documentados',()=>{
  const codigo=fs.readFileSync(path.join(raiz,'rwadar-site/assets/ficha-pagina-20261022.js'),'utf8');
  const fila=()=>{const marca={textContent:'✓ Sí'};return {dataset:{cumple:'si'},marca,querySelector:()=>marca};};
  const filas={contratable:fila(),minimoSalida:fila(),vigencia:fila()};
  const campos=Object.fromEntries(Object.entries(filas).map(([n,f])=>[n,{textContent:'',parentElement:f,appendChild(){}}]));
  const oferta=catalogo.ofertas.find(o=>o.slug==='robinhood-classic-stock-tokens');
  const pagina={dataset:{oferta:JSON.stringify(oferta)},querySelector:selector=>campos[selector.match(/"([^"]+)"/)[1]]};
  let volver,reloj=new Date(oferta.verificadaEl+'T12:00:00Z');
  const api=require('./rwadar-movil/lib/ficha-editorial');
  const contexto={globalThis:{RWAdarFichaEditorial:{resumenOferta:o=>api.resumenOferta(o,catalogo.plataformas,reloj)}},
    document:{hidden:false,querySelector:()=>pagina,createElement:()=>({}),addEventListener:(e,fn)=>{if(e==='visibilitychange')volver=fn;}},
    window:{setInterval:()=>{}}};
  vm.runInNewContext(codigo,contexto,{timeout:1000});
  assert.equal(filas.contratable.dataset.cumple,'si');assert.equal(filas.minimoSalida.dataset.cumple,'si');assert.equal(filas.vigencia.dataset.cumple,'si');
  reloj=new Date(Date.parse(oferta.verificadaEl+'T12:00:00Z')+9*864e5);volver();
  for(const n of ['contratable','minimoSalida','vigencia']){assert.equal(filas[n].dataset.cumple,'no',n);assert.equal(filas[n].marca.textContent,'✗ No',n);}
  assert.match(campos.contratable.textContent,/^Pendiente de volver a comprobar: la revisión semanal ha caducado\.$/);
  assert.match(campos.minimoSalida.textContent,/por volver a comprobar/);
});
verificar('RSS enlaza noticias estables y el sitemap contiene todas las fichas',()=>{
  const rss=salidas.get('novedades.xml'),mapa=salidas.get('sitemap.xml');
  assert(rss.startsWith('<?xml'));assert(rss.includes('<rss version="2.0">'));
  const guids=[...rss.matchAll(/<guid isPermaLink="true">(.*?)<\/guid>/g)].map(m=>m[1]);
  assert(guids.length>=3);assert.equal(guids.length,new Set(guids).size);
  for(const p of permitidas.filter(n=>n.endsWith('.html')))assert(mapa.includes('<loc>https://rwadar.pages.dev/'+p.slice(0,-5)+'</loc>'));
});
console.log(pruebas+' verificaciones de páginas y RSS correctas');
