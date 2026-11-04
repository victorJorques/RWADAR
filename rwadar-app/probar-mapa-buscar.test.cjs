'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const W=path.resolve(__dirname,'..'),R=fs.existsSync(path.join(W,'rwadar-site/assets/catalogo-publico-20261022.js'))?W:'C:/Users/vcicr/Downloads/rwadar-entrega-integral-20261022/integracion-140';
const U=require('../rwadar-site/assets/mapa-buscar-util-20261027.js');
const metadatos=JSON.parse(fs.readFileSync(path.join(W,'rwadar-site/assets/mapa-ubicaciones-20261027.json')));
const codigo=fs.readFileSync(path.join(W,'rwadar-site/assets/mapa-buscar-20261027.js'),'utf8');
const html=fs.readFileSync(path.join(W,'rwadar-site/index.html'),'utf8');
const snapshot=fs.readFileSync(path.join(R,'rwadar-site/assets/catalogo-publico-20261022.js'),'utf8');
const sandbox={};vm.createContext(sandbox);vm.runInContext(snapshot+';globalThis.ofertasPrueba=EMI;',sandbox);const ofertas=sandbox.ofertasPrueba;
/* Todo lo que se cuenta sale del catálogo publicado y del archivo de
   ubicaciones, no de cifras escritas a mano: al cambiar el catálogo la prueba
   sigue valiendo. */
const puntosDocumentados=U.validar(metadatos);
const unidas=U.unir(ofertas,puntosDocumentados);
const porColeccion=c=>unidas.filter(f=>c==='todas'||f.oferta.coleccion===c).length;
const enCatalogo=ofertas.filter(o=>o.catalogo===true).length;
const descendientes=n=>(n.children||[]).flatMap(h=>[h,...descendientes(h)]);
const esperar=()=>new Promise(r=>setImmediate(r));
class Nodo{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.listeners={};this.attrs={};this.dataset={};this.hidden=false;this.disabled=false;this.value='';this.textContent='';}
 addEventListener(nombre,fn){(this.listeners[nombre]??=[]).push(fn);}
 async emitir(nombre,extra={}){for(const fn of this.listeners[nombre]||[])await fn({preventDefault(){},...extra});}
 appendChild(n){this.children.push(n);return n;}
 append(...ns){this.children.push(...ns);}
 replaceChildren(...ns){this.children=ns;}
 setAttribute(k,v){this.attrs[k]=String(v);}
 remove(){}
 querySelector(){return new Nodo('button');}
}
class Limites{
 constructor(puntos){this.minLat=Math.min(...puntos.map(p=>p[0]));this.maxLat=Math.max(...puntos.map(p=>p[0]));this.minLng=Math.min(...puntos.map(p=>p[1]));this.maxLng=Math.max(...puntos.map(p=>p[1]));}
 contains(p){return p[0]>=this.minLat&&p[0]<=this.maxLat&&p[1]>=this.minLng&&p[1]<=this.maxLng;}
 centro(){return {lat:(this.minLat+this.maxLat)/2,lng:(this.minLng+this.maxLng)/2};}
}
function entorno({falloDatos=false,sinGeolocalizacion=false,htmlDocumento=html,codigoDocumento=codigo,proyeccion=false}={}){
 const nodos=new Map([...htmlDocumento.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Nodo()]));
 nodos.get('buscarMapa').hidden=true;nodos.get('mapaExperiencia').hidden=true;
 const panel=htmlDocumento.match(/<div\b[^>]*\bid="buscarMapa"[^>]*>/)[0];
 nodos.get('buscarMapa').dataset.leafletCss=panel.match(/data-leaflet-css="([^"]*)"/)?.[1];
 nodos.get('buscarMapa').dataset.leafletJs=panel.match(/data-leaflet-js="([^"]*)"/)?.[1];
 const vistas=['lista','mapa'].map(v=>{const n=new Nodo('button');n.dataset.buscarVista=v;return n;});
 const geollamadas=[],red=[],scripts=[],mapas=[],observadores=[],teselas=[];
 const grupo={layers:[],addTo(){return this;},clearLayers(){this.layers=[];},addLayer(n){this.layers.push(n);}};
 const L={
  map(){const n={center:{lat:0,lng:0},zoom:2,zoomControl:{getContainer:()=>new Nodo()},handlers:{},
   on(nombre,fn){this.handlers[nombre]=fn;return this;},closePopup(){},
   ...(proyeccion?{getZoom(){return this.zoom;},project(p,z){return {x:p[1]*2**z,y:-p[0]*2**z};}}:{}),
   setView(p,z){this.center={lat:p[0],lng:p[1]};this.zoom=z;return this;},
   fitBounds(b){this.center=b.centro();return this;},getCenter(){return this.center;},
   getBounds(){return new Limites([[this.center.lat-1,this.center.lng-1],[this.center.lat+1,this.center.lng+1]]);},
   invalidateSize(){},remove(){},removeLayer(){}};mapas.push(n);return n;},
  tileLayer(url,opciones){red.push({url,opciones});const t={handlers:{},redibujos:0,addTo(){return this;},
   on(nombre,fn){this.handlers[nombre]=fn;return this;},redraw(){this.redibujos++;}};teselas.push(t);return t;},
  featureGroup:()=>grupo,latLngBounds:p=>new Limites(p),divIcon:x=>x,
  marker(p,opciones){return {p,opciones,bindPopup(contenido){this.popup=contenido;return this;}};},
  circleMarker(p){return {p,addTo(){return this;}};}
 };
 const documento={readyState:'complete',getElementById:id=>nodos.get(id),querySelectorAll:sel=>sel==='[data-buscar-vista]'?vistas:[],
  createElement:tag=>new Nodo(tag),head:new Nodo('head')};
 let contexto;
 documento.head.append=(...ns)=>{for(const n of ns){scripts.push(n.src||n.href);if(n.src)contexto.L=L;n.onload?.();}};
 const contextoBase={document:documento,URL,console,requestAnimationFrame:fn=>fn(),setTimeout,clearTimeout,
  MutationObserver:class{constructor(fn){observadores.push(fn);}observe(){}},
  navigator:{geolocation:sinGeolocalizacion?null:{getCurrentPosition(ok,error,opciones){geollamadas.push({ok,error,opciones});}}},
  fetch:async url=>{red.push({url});return {ok:!falloDatos,json:async()=>metadatos};},
  RWADARMapaUtil:U,EMI:ofertas,emiColeccion:'principales',CATALOGO_EMBEBIDO_BLOQUEADO:false,
  ofertaLocalValida:()=>true,coincideOfertaLocal:()=>true};
 contexto=vm.createContext(contextoBase);vm.runInContext(codigoDocumento,contexto);
 return {nodos,vistas,contexto,geollamadas,red,scripts,mapas,grupo,observadores,teselas};
}
test('las ubicaciones documentadas se unen solo con las ofertas del catálogo publicado, sin duplicar datos financieros',()=>{
 const puntos=puntosDocumentados,slugs=new Set(ofertas.filter(o=>o.catalogo===true).map(o=>o.slug));
 assert.ok(enCatalogo>0);assert.equal(puntos.length,metadatos.ubicaciones.length);
 assert.equal(unidas.length,puntos.filter(p=>slugs.has(p.slug)).length);
 assert.ok(unidas.length>0,'al menos una oferta publicada tiene ubicación documentada');
 assert.ok(unidas.every(f=>f.oferta.catalogo===true&&f.oferta.slug===f.ubicacion.slug));
 assert.equal(puntos.some(p=>p.slug==='reental-secundario-dania-beach-1'),false,'Dania/Austin exige adenda y consentimiento acreditados; no se ubica incondicionalmente');
 assert.equal(U.unir([{catalogo:true,slug:'inventada'}],puntos).length,0);
 assert.equal(U.unir([{slug:puntos[0].slug}],puntos).length,0);
 const hoy=new Date().toISOString().slice(0,10);
 for(const p of puntos){assert.ok(p.fechaConsulta<=hoy,'la consulta no es futura');assert.ok(!('precio'in p));assert.ok(!('rentabilidad'in p));assert.ok(!('evidenciaLocal'in p));}
});
test('contrato rechaza coordenadas, fuentes, precisiones y fechas falsas o ambiguas',()=>{
 const base=metadatos.ubicaciones[0];
 for(const cambios of [{lat:91},{lng:181},{lat:NaN},{lat:'47'},{precision:'sede'},{fuente:'javascript:alert(1)'},{fuente:'http://example.com'},
  {fechaConsulta:'2026-02-30'},{lugar:''},{slug:'x\" onclick=alert(1)'}]){
  assert.throws(()=>U.validar({version:1,ubicaciones:[{...base,...cambios}]}));
 }
 assert.throws(()=>U.validar({version:1,ubicaciones:[base,base]}));
});
test('distancia, antimeridiano, localidades sin acentos ni mayúsculas, grupos coincidentes y grupos que se taparían',()=>{
 assert.equal(U.distancia({lat:0,lng:0},{lat:0,lng:0}),0);
 assert.ok(Math.abs(U.distancia({lat:0,lng:0},{lat:0,lng:1})-111.195)<.01);
 assert.ok(U.distancia({lat:0,lng:179.9},{lat:0,lng:-179.9})<23);
 assert.equal(U.distancia(null,{lat:0,lng:0}),null);
 const filas=unidas;
 // Cada localidad de hoy se encuentra escrita sin acentos y en mayúsculas.
 for(const f of filas){const consulta=f.ubicacion.localidad.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  assert.ok(U.buscar(filas,consulta).some(x=>x===f),consulta);}
 assert.equal(U.normalizar('Viena'),U.normalizar('Wien'));assert.equal(U.normalizar('Vienna'),U.normalizar('Wien'));
 assert.equal(U.normalizar('Abu Dhabi'),U.normalizar('Abu Dabi'));
 assert.equal(U.buscar(filas,'una ciudad sin datos').length,0);
 const orden=U.ordenar(filas,{lat:48.2,lng:16.3});assert.ok(orden.every((f,i)=>i===0||orden[i-1].distanciaKm<=f.distanciaKm));
 // Mismo punto, mismo grupo: tantos grupos como coordenadas distintas.
 const grupos=U.agrupar(filas),claves=new Set(filas.map(f=>f.ubicacion.lat.toFixed(6)+','+f.ubicacion.lng.toFixed(6)));
 assert.equal(grupos.length,claves.size);assert.equal(grupos.flat().length,filas.length);
 assert.ok(grupos.every(g=>g.every(f=>f.ubicacion.lat===g[0].ubicacion.lat&&f.ubicacion.lng===g[0].ubicacion.lng)));
 // Lo que en pantalla quedaría a menos del radio va junto; lo lejano, aparte.
 const fila=(slug,lat,lng)=>({oferta:{slug},ubicacion:{lat,lng}}),px=u=>({x:u.lng,y:u.lat});
 const cerca=U.agruparCerca([fila('a',0,0),fila('b',0,10),fila('c',0,100)],px,40);
 assert.deepEqual(cerca.map(g=>g.map(f=>f.oferta.slug)),[['a','b'],['c']]);
 assert.equal(U.agruparCerca([fila('a',0,0),fila('b',0,30),fila('c',0,60)],px,40).flat().length,3);
});
test('la carga inicial y Mapa no cargan teselas ni piden posición; Cargar mapa activa la biblioteca local',async()=>{
 const e=entorno();assert.equal(e.red.length,0);assert.equal(e.scripts.length,0);assert.equal(e.geollamadas.length,0);
 await e.vistas[1].emitir('click');
 // Abrir Mapa solo pide el archivo propio de ubicaciones, para decir cuántas
 // ofertas se sitúan: ni OpenStreetMap, ni Leaflet, ni la posición.
 assert.deepEqual(e.red.map(r=>r.url),['/assets/mapa-ubicaciones-20261027.json']);
 assert.equal(e.scripts.length,0);assert.equal(e.geollamadas.length,0);
 assert.equal(e.nodos.get('emiLista').hidden,true);assert.equal(e.nodos.get('buscarMapa').hidden,false);
 await esperar();const cuenta=e.nodos.get('mapaPermisoCuenta');assert.equal(cuenta.hidden,false);
 assert.ok(cuenta.textContent.includes(String(porColeccion('todas')))&&cuenta.textContent.includes(String(enCatalogo)));
 await e.nodos.get('mapaCargar').emitir('click');assert.equal(e.mapas.length,1);assert.equal(e.geollamadas.length,0);
 assert.deepEqual(e.scripts,['/assets/leaflet-1.9.4.css','/assets/leaflet-1.9.4.js']);
 assert.equal(e.red.filter(r=>r.url.startsWith('https:')).length,1);
 const tiles=e.red.find(r=>r.url.startsWith('https:'));assert.equal(tiles.url,'https://tile.openstreetmap.org/{z}/{x}/{y}.png');
 assert.equal(tiles.opciones.referrerPolicy,'origin');assert.equal(tiles.opciones.keepBuffer,0);
 assert.equal(e.nodos.get('mapaResultados').children.length,porColeccion('todas'));
 await e.vistas[0].emitir('click');assert.equal(e.nodos.get('emiLista').hidden,false);
});
test('posición solo por botón, denegación recuperable, éxito ordena y quitar olvida la posición',async()=>{
 const e=entorno();await e.vistas[1].emitir('click');await e.nodos.get('mapaCargar').emitir('click');
 await e.nodos.get('mapaUbicacion').emitir('click');assert.equal(e.geollamadas.length,1);
 assert.equal(e.geollamadas[0].opciones.enableHighAccuracy,false);assert.equal(e.geollamadas[0].opciones.maximumAge,0);
 e.geollamadas[0].error({code:1});assert.match(e.nodos.get('mapaEstado').textContent,/No has dado permiso/);
 assert.equal(e.nodos.get('mapaUbicacion').disabled,false);
 await e.nodos.get('mapaUbicacion').emitir('click');e.geollamadas[1].ok({coords:{latitude:48.2,longitude:16.3,accuracy:140}});
 assert.match(e.nodos.get('mapaResultadosTitulo').textContent,/tu ubicación/);assert.equal(e.nodos.get('mapaQuitarUbicacion').hidden,false);
 assert.match(e.nodos.get('mapaMargen').textContent,/140\s*m/);
 await e.nodos.get('mapaQuitarUbicacion').emitir('click');assert.equal(e.nodos.get('mapaQuitarUbicacion').hidden,true);
 assert.doesNotMatch(e.nodos.get('mapaResultadosTitulo').textContent,/tu ubicación/);
 assert.equal(e.red.filter(r=>/latitude|longitude|48\.2|16\.3/.test(r.url)).length,0);
 assert.doesNotMatch(codigo,/localStorage|sessionStorage|watchPosition|sendBeacon|console\.(?:log|info)/);
});
test('zona local, vacío, filtros de colección, catálogo retirado y fallo del recurso conservan Lista',async()=>{
 const e=entorno();await e.vistas[1].emitir('click');await e.nodos.get('mapaCargar').emitir('click');const peticiones=e.red.length;
 const zonaReal=unidas[0].ubicacion.localidad;
 e.nodos.get('mapaZona').value=zonaReal;await e.nodos.get('mapaZonaForm').emitir('submit');
 assert.equal(e.nodos.get('mapaResultados').children.length,U.buscar(unidas,zonaReal).length);assert.equal(e.red.length,peticiones);
 e.nodos.get('mapaZona').value='una ciudad sin datos';await e.nodos.get('mapaZona').emitir('input');assert.equal(e.nodos.get('mapaResultados').children.length,0);
 assert.equal(e.nodos.get('mapaVacio').hidden,false);
 e.nodos.get('mapaColeccion').value='secundario';await e.nodos.get('mapaVerTodas').emitir('click');assert.equal(e.nodos.get('mapaResultados').children.length,porColeccion('secundario'));
 e.contexto.CATALOGO_EMBEBIDO_BLOQUEADO=true;e.observadores[0]();assert.equal(e.grupo.layers.length,0);assert.equal(e.nodos.get('mapaResultados').children.length,0);
 const fallo=entorno({falloDatos:true});await fallo.vistas[1].emitir('click');await fallo.nodos.get('mapaCargar').emitir('click');
 assert.equal(fallo.mapas.length,0);assert.equal(fallo.nodos.get('mapaCargar').disabled,false);assert.match(fallo.nodos.get('mapaEstado').textContent,/No se pudieron/);
 await fallo.vistas[0].emitir('click');assert.equal(fallo.nodos.get('emiLista').hidden,false);
});
test('Mapa parte de todas las colecciones, filtra cada una y devuelve Lista a su selección original',async()=>{
 const e=entorno();e.contexto.emiColeccion='principales';
 const pestañas=e.nodos.get('emiColecciones');pestañas.hidden=false;
 await e.vistas[1].emitir('click');assert.equal(pestañas.hidden,true);
 await e.nodos.get('mapaCargar').emitir('click');assert.equal(e.nodos.get('mapaResultados').children.length,porColeccion('todas'));
 // Cada fila dice de qué colección es (sin fijar la frase).
 for(const li of e.nodos.get('mapaResultados').children)assert.ok(descendientes(li).some(n=>n.className==='mapa-coleccion'&&n.textContent));
 for(const coleccion of ['principales','secundario','en_camino','todas']){
  e.nodos.get('mapaColeccion').value=coleccion;await e.nodos.get('mapaColeccion').emitir('change');
  assert.equal(e.nodos.get('mapaResultados').children.length,porColeccion(coleccion),coleccion);
  assert.equal(e.contexto.emiColeccion,'principales');
 }
 e.contexto.coincideOfertaLocal=o=>o.slug===unidas[0].oferta.slug;
 e.observadores[0]();assert.equal(e.nodos.get('mapaResultados').children.length,1);
 assert.equal(pestañas.hidden,true);
 await e.vistas[0].emitir('click');assert.equal(pestañas.hidden,false);assert.equal(e.contexto.emiColeccion,'principales');
 assert.equal(e.nodos.get('emiLista').hidden,false);
});
test('los marcadores que se taparían van juntos y se rehacen al cambiar el zoom; sin teselas, aviso y Reintentar',async()=>{
 const e=entorno({proyeccion:true});await e.vistas[1].emitir('click');await e.nodos.get('mapaCargar').emitir('click');
 const mapa=e.mapas[0],visibles=U.ordenar(unidas,null);
 const esperado=z=>U.agruparCerca(visibles,u=>mapa.project([u.lat,u.lng],z),40).length;
 assert.equal(e.grupo.layers.length,esperado(mapa.zoom));
 mapa.zoom=18;mapa.handlers.zoomend();assert.equal(e.grupo.layers.length,esperado(18));
 assert.ok(esperado(18)>=esperado(2),'al acercar no se juntan más marcadores');
 const t=e.teselas[0],sinTeselas=e.nodos.get('mapaSinTeselas');sinTeselas.hidden=true;
 t.handlers.loading();t.handlers.tileerror();t.handlers.load();assert.equal(sinTeselas.hidden,false);
 await e.nodos.get('mapaReintentar').emitir('click');assert.equal(sinTeselas.hidden,true);assert.equal(t.redibujos,1);
});
test('cabeceras limitan geolocalización a self y tiles al host elegido; publicación conserva script principal último',()=>{
 for(const ruta of ['rwadar-site/_headers','rwadar-acceso/compilar.cjs']){
  const s=fs.readFileSync(path.join(W,ruta),'utf8');assert.match(s,/geolocation=\(self\)/);assert.match(s,/camera=\(\)/);
  assert.match(s,/img-src 'self' data: https:\/\/tile\.openstreetmap\.org;/);assert.doesNotMatch(s,/unsafe-inline/);
 }
 const scripts=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/gi)].map(m=>m[1]);
 assert.equal(scripts.at(-1),'/assets/rwadar-20260820.js');assert.ok(scripts.indexOf('/assets/mapa-buscar-20261027.js')<scripts.indexOf('/assets/catalogo-publico-20261022.js'));
 assert.doesNotMatch(html,/<style\b|\sstyle\s*=|\son[a-z]+\s*=/i);
 const lista=fs.readFileSync(path.join(W,'rwadar-publicacion-segura.js'),'utf8');
 for(const recurso of ['mapa-buscar-20261027.js','mapa-buscar-util-20261027.js','mapa-buscar-20261027.css','mapa-ubicaciones-20261027.json','vendor/leaflet-1.9.4/license.txt'])assert.ok(lista.includes(recurso));
});
test('Leaflet local coincide con SRI oficial y conserva licencia',()=>{
 const b=nombre=>fs.readFileSync(path.join(W,'rwadar-site/assets',nombre==='LICENSE'?'vendor/leaflet-1.9.4/license.txt':nombre.replace('leaflet.','leaflet-1.9.4.')));
 assert.equal(crypto.createHash('sha256').update(b('leaflet.js')).digest('base64'),'20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=');
 assert.equal(crypto.createHash('sha256').update(b('leaflet.css')).digest('base64'),'p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=');
 assert.match(b('LICENSE').toString(),/Redistribution and use/);
});
test('las funciones reales del publicador versionan Leaflet; el HTML reescrito carga exclusivamente archivos que existen en la salida',async()=>{
 const {adelgazarJS,adelgazarCSS}=require(path.join(R,'rwadar-adelgazar.js'));
 const {nombreAssetVersionado}=require(path.join(R,'rwadar-publicacion-segura.js'));
 const referencias=new Map(),arbolGenerado=new Map();
 for(const nombre of ['assets/leaflet-1.9.4.js','assets/leaflet-1.9.4.css','assets/mapa-buscar-20261027.js','assets/mapa-buscar-util-20261027.js']){
  const fuente=fs.readFileSync(path.join(W,'rwadar-site',nombre),'utf8');
  const reducido=nombre.endsWith('.js')?adelgazarJS(fuente):adelgazarCSS(fuente);
  if(nombre.endsWith('.js'))assert.doesNotThrow(()=>new Function(reducido));
  const versionado='/'+nombreAssetVersionado(nombre,reducido);referencias.set('/'+nombre,versionado);arbolGenerado.set(versionado,reducido);
 }
 // Misma reescritura de referencias que usa construirSalida(), sin cambiarla.
 let publicado=html;for(const [antes,despues]of referencias)publicado=publicado.split(antes).join(despues);
 const e=entorno({htmlDocumento:publicado,codigoDocumento:arbolGenerado.get(referencias.get('/assets/mapa-buscar-20261027.js'))});
 await e.vistas[1].emitir('click');assert.equal(e.scripts.length,0);
 await e.nodos.get('mapaCargar').emitir('click');assert.equal(e.mapas.length,1);
 assert.equal(e.scripts.length,2);
 for(const ruta of e.scripts){assert.ok(arbolGenerado.has(ruta),'el recurso solicitado existe en el árbol generado');assert.match(ruta,/\.[a-f0-9]{12}\.(?:css|js)$/);}
 assert.deepEqual(e.scripts,[referencias.get('/assets/leaflet-1.9.4.css'),referencias.get('/assets/leaflet-1.9.4.js')]);
 const externo=entorno({htmlDocumento:html.replace('data-leaflet-js="/assets/leaflet-1.9.4.js"','data-leaflet-js="https://ajeno.invalid/leaflet.js"')});
 await externo.vistas[1].emitir('click');await externo.nodos.get('mapaCargar').emitir('click');
 assert.equal(externo.scripts.length,0);assert.match(externo.nodos.get('mapaEstado').textContent,/rutas locales/);
});
