import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../rwadar-site/sw.js',import.meta.url),'utf8');
const ORIGEN='https://rwadar.pages.dev';

/* IndexedDB mínimo: una base con almacenes clave → valor, asíncrono como el de verdad. */
function crearIndexedDB({falla=false}={}){
 const bases=new Map();
 return {bases,open(nombre){
  const peticion={};
  setImmediate(()=>{
   if(falla){peticion.error=new Error('sin IndexedDB');if(peticion.onerror)peticion.onerror();return;}
   let base=bases.get(nombre);const nueva=!base;
   if(!base){base=new Map();bases.set(nombre,base);}
   peticion.result={createObjectStore(n){base.set(n,new Map());},close(){},
    transaction(n){const datos=base.get(n),tx={};
     tx.objectStore=()=>({get(k){const r={};setImmediate(()=>{r.result=datos.get(k);if(r.onsuccess)r.onsuccess();
       setImmediate(()=>{if(tx.oncomplete)tx.oncomplete();});});return r;},put(v,k){datos.set(k,v);}});
     return tx;}};
   if(nueva&&peticion.onupgradeneeded)peticion.onupgradeneeded();
   if(peticion.onsuccess)peticion.onsuccess();
  });
  return peticion;
 }};
}
function worker({ventanas=[],sinInsignia=false,idbFalla=false}={}){
 const handlers=new Map(),events=[],mostradas=[],abiertas=[],insignias=[],mensajes=[],cerradas=[];let matches=0,navigations=0;
 const pendingNavigation=new Promise(()=>{});
 const client={url:ORIGEN+'/',navigate(){navigations++;return pendingNavigation;}};
 const notificacionesVisibles=[{tag:'rwadar-3',close(){cerradas.push('rwadar-3');}},{tag:'otra-app',close(){cerradas.push('otra-app');}}];
 const indexedDB=crearIndexedDB({falla:idbFalla});
 const context=vm.createContext({URL,indexedDB,self:{
   location:new URL(ORIGEN+'/sw.js'),
   addEventListener:(kind,fn)=>handlers.set(kind,fn),
   skipWaiting:async()=>{events.push('skipWaiting');},
   navigator:sinInsignia?{language:'es-ES'}:{language:'es-ES',setAppBadge:async n=>{insignias.push(n);},clearAppBadge:async()=>{insignias.push(0);}},
   registration:{showNotification:async(titulo,opciones)=>{mostradas.push({titulo,...opciones});},getNotifications:async()=>notificacionesVisibles},
   clients:{claim:async()=>{events.push('claim');},
    matchAll:async opciones=>{matches++;if(opciones&&opciones.type==='window')return ventanas;return [client];},
    openWindow:async url=>{abiertas.push(url);return null;}}},
   caches:{keys:async()=>['rwadar-vold','another-app-cache','rwadar-vacceso-obligatorio-20261023'],delete:async name=>{events.push('delete:'+name);return true;}}});
 vm.runInContext(source,context);
 function dispatch(kind,extra={}){let work;handlers.get(kind)({waitUntil:promise=>{work=promise;},...extra});assert.ok(work&&typeof work.then==='function');return work;}
 const push=datos=>dispatch('push',{data:datos===undefined?null:{json:()=>JSON.parse(typeof datos==='string'?datos:JSON.stringify(datos))}});
 const contador=()=>indexedDB.bases.get('rwadar-avisos')?.get('contador')?.get('sin-leer');
 return {handlers,events,dispatch,push,mostradas,abiertas,insignias,mensajes,cerradas,contador,matches:()=>matches,navigations:()=>navigations};
}
test('activate removes only own cache prefix, claims clients and resolves despite a pending client navigation',{timeout:1000},async()=>{
 const w=worker();await w.dispatch('activate');
 assert.deepEqual(w.events,['delete:rwadar-vold','delete:rwadar-vacceso-obligatorio-20261023','claim']);
 assert.equal(w.matches(),0);assert.equal(w.navigations(),0);
 assert.equal(w.events.some(event=>event.includes('another-app-cache')),false);
});
test('installation still skips waiting and never registers a fetch cache handler; it now listens to push, clicks and page messages',async()=>{
 const w=worker();await w.dispatch('install');assert.deepEqual(w.events,['skipWaiting']);
 assert.deepEqual([...w.handlers.keys()],['install','activate','push','notificationclick','message']);assert.equal(w.handlers.has('fetch'),false);
});
test('push: siempre enseña la notificación del contrato, sube el contador de IndexedDB y el número del icono, y avisa a la página',async()=>{
 const pagina={url:ORIGEN+'/',postMessage(m){pagina.recibidos.push(m);},recibidos:[]};
 const w=worker({ventanas:[pagina]});
 await w.push({v:1,titulo:'2 fichas nuevas en el radar de RWAdar',texto:'Consulta en el radar qué ha entrado.',url:ORIGEN+'/#emisiones',etiqueta:'rwadar-12'});
 assert.deepEqual(JSON.parse(JSON.stringify(w.mostradas)),[{titulo:'2 fichas nuevas en el radar de RWAdar',body:'Consulta en el radar qué ha entrado.',
  icon:'/icono-192.png',tag:'rwadar-12',data:{url:ORIGEN+'/#emisiones'}}]);
 assert.equal('badge' in w.mostradas[0],false,'sin «badge»: con un icono opaco Chrome en Android pinta un cuadrado blanco');
 assert.equal(w.contador(),1);assert.deepEqual(w.insignias,[1]);
 assert.deepEqual(JSON.parse(JSON.stringify(pagina.recibidos)),[{tipo:'aviso-nuevo'}]);
 await w.push({v:1,titulo:'Lección nueva',texto:'Ya está la lección 7.',url:'/academy/',etiqueta:'rwadar-13'});
 assert.equal(w.contador(),2);assert.deepEqual(w.insignias,[1,2]);
 assert.equal(w.mostradas[1].data.url,ORIGEN+'/academy/','una ruta propia se completa con el origen');
});
test('push: con una carga rara, sin datos o con un enlace ajeno, también enseña una notificación propia y segura',async()=>{
 const w=worker();
 await w.push('esto no es JSON');
 await w.push(undefined);
 await w.push({v:2,titulo:'Versión desconocida',texto:'x'});
 await w.push({v:1,titulo:'Hola\u2028<b>',texto:'Mira esto',url:'https://evil.test/robar',etiqueta:'<script>'});
 await w.push({v:1,titulo:'Enlace raro',texto:'x',url:'javascript:alert(1)',etiqueta:'rwadar-1'});
 assert.equal(w.mostradas.length,5,'una notificación por push, siempre');
 for(const n of w.mostradas.slice(0,3)){
  assert.equal(n.titulo,'RWAdar');assert.equal(n.body,'Tienes un aviso nuevo en RWAdar.');
  assert.equal(n.tag,'rwadar-aviso');assert.equal(n.data.url,ORIGEN+'/');
 }
 assert.equal(w.mostradas[3].titulo,'Hola <b>','sin separadores de línea; el texto de una notificación no se interpreta como HTML');
 assert.equal(w.mostradas[3].tag,'rwadar-aviso');assert.equal(w.mostradas[3].data.url,ORIGEN+'/','enlace ajeno: a Inicio');
 assert.equal(w.mostradas[4].data.url,ORIGEN+'/');
 assert.equal(w.contador(),5);
});
test('push: sin Badging API ni IndexedDB la notificación sale igual',async()=>{
 const w=worker({sinInsignia:true,idbFalla:true});
 await w.push({v:1,titulo:'Aviso',texto:'Texto',url:ORIGEN+'/',etiqueta:'rwadar-9'});
 assert.equal(w.mostradas.length,1);assert.deepEqual(w.insignias,[]);
});
test('notificationclick: cierra la notificación; un enlace ajeno abre Inicio y uno propio abre su página',async()=>{
 const w=worker();let cerrada=0;
 await w.dispatch('notificationclick',{notification:{close(){cerrada++;},data:{url:'https://evil.test/robar'}}});
 assert.equal(cerrada,1);assert.deepEqual(w.abiertas,[ORIGEN+'/']);
 await w.dispatch('notificationclick',{notification:{close(){cerrada++;},data:{url:ORIGEN+'/academy/'}}});
 assert.equal(cerrada,2);assert.deepEqual(w.abiertas,[ORIGEN+'/',ORIGEN+'/academy/']);
 await w.dispatch('notificationclick',{notification:{close(){cerrada++;},data:null}});
 assert.deepEqual(w.abiertas.at(-1),ORIGEN+'/');
});
test('notificationclick: con RWAdar ya abierta, la enfoca y la lleva al aviso sin abrir otra ventana',async()=>{
 const visitas=[];
 const pestana={url:ORIGEN+'/',focus:async()=>pestana,navigate:async url=>{visitas.push(url);return pestana;},postMessage(){}};
 const otra={url:'https://otra.web/',focus:async()=>{throw new Error('no');},postMessage(){}};
 const w=worker({ventanas:[otra,pestana]});
 await w.dispatch('notificationclick',{notification:{close(){},data:{url:ORIGEN+'/#emisiones'}}});
 assert.deepEqual(visitas,[ORIGEN+'/#emisiones']);assert.deepEqual(w.abiertas,[]);
 // Un enlace ajeno, con la pestaña abierta: va a Inicio (la misma URL): solo se enfoca.
 await w.dispatch('notificationclick',{notification:{close(){},data:{url:'https://evil.test/'}}});
 assert.deepEqual(visitas,[ORIGEN+'/#emisiones']);assert.deepEqual(w.abiertas,[]);
});
test('notificationclick: un aviso (?avisos=1) con la portada abierta le pide que abra la lista de avisos, con la baja, sin recargar',async()=>{
 const visitas=[],mensajes=[];
 const pestana={url:ORIGEN+'/#emisiones',focus:async()=>pestana,navigate:async url=>{visitas.push(url);return pestana;},postMessage(m){mensajes.push(m);}};
 const w=worker({ventanas:[pestana]});
 await w.dispatch('notificationclick',{notification:{close(){},data:{url:ORIGEN+'/?avisos=1#emisiones'}}});
 assert.deepEqual(JSON.parse(JSON.stringify(mensajes)),[{tipo:'abrir-avisos'}]);assert.deepEqual(visitas,[]);assert.deepEqual(w.abiertas,[]);
 // Sin la web abierta: se abre en la lista de avisos.
 const sola=worker();
 await sola.dispatch('notificationclick',{notification:{close(){},data:{url:ORIGEN+'/?avisos=1'}}});
 assert.deepEqual(sola.abiertas,[ORIGEN+'/?avisos=1']);
 // Abierta en otra página (la Academy, sin campana): se lleva a la portada.
 const academia={url:ORIGEN+'/academy/',focus:async()=>academia,navigate:async url=>{visitas.push(url);return academia;},postMessage(m){mensajes.push(m);}};
 const otra=worker({ventanas:[academia]});
 await otra.dispatch('notificationclick',{notification:{close(){},data:{url:ORIGEN+'/?avisos=1'}}});
 assert.deepEqual(visitas,[ORIGEN+'/?avisos=1']);assert.equal(mensajes.length,1);
});
test('mensajes de la página: «avisos-vistos» pone el contador a 0, quita el número y las notificaciones de RWAdar; «avisos-pendientes» lo iguala',async()=>{
 const w=worker();
 await w.push({v:1,titulo:'A',texto:'a',url:ORIGEN+'/',etiqueta:'rwadar-1'});
 await w.push({v:1,titulo:'B',texto:'b',url:ORIGEN+'/',etiqueta:'rwadar-2'});
 assert.equal(w.contador(),2);
 await w.dispatch('message',{data:{tipo:'avisos-pendientes',n:4}});
 assert.equal(w.contador(),4);assert.deepEqual(w.insignias,[1,2],'el número del icono lo pone la página, no se repite');
 await w.dispatch('message',{data:{tipo:'avisos-vistos'}});
 assert.equal(w.contador(),0);assert.equal(w.insignias.at(-1),0,'clearAppBadge');
 assert.deepEqual(w.cerradas,['rwadar-3'],'solo las de RWAdar');
 // Lo que no es del contrato no hace nada.
 for(const data of [null,'avisos-vistos',{tipo:'avisos-pendientes',n:-1},{tipo:'avisos-pendientes',n:1.5},{tipo:'otro'}]){
  let llamado=false;w.handlers.get('message')({data,waitUntil(){llamado=true;}});assert.equal(llamado,false,JSON.stringify(data));
 }
 await w.dispatch('message',{data:{tipo:'avisos-pendientes',n:500}});
 assert.equal(w.contador(),99,'como mucho 99');
});
