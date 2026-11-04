const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { crearControladorBloqueoApp, useBloqueoApp } = require('../lib/desbloqueo-app');
const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222';
const key=id=>'rwadar.desbloqueo.v1.'+id;
function diferida() { let resolver; const promesa=new Promise(r=>{resolver=r;}); return {promesa,resolver}; }
function entorno({valores=new Map(),nivel=1,resultado={success:true},leer,guardar,autenticar,plataforma='ios',plazoMs,ahora}={}) {
  const llamadas=[];
  const local={async getEnrolledLevelAsync(){llamadas.push(['nivel']);return nivel;},
    async authenticateAsync(opciones){llamadas.push(['prompt',opciones]);return autenticar?autenticar():resultado;},
    async cancelAuthenticate(){llamadas.push(['cancelar']);}};
  const almacenamiento={async getItemAsync(clave){llamadas.push(['leer',clave]);return leer?leer(clave):(valores.get(clave)??null);},
    async setItemAsync(clave,valor){llamadas.push(['guardar',clave,valor]);if(guardar)await guardar(clave,valor);valores.set(clave,valor);}};
  const controlador=crearControladorBloqueoApp({almacenamiento,cargarAutenticacion:async()=>local,plataforma,plazoMs,ahora});
  return {controlador,llamadas,valores};
}

test('por defecto desactivado, separado por UUID y sin iniciar prompts',async()=>{
  const e=entorno();await e.controlador.cambiarUsuario(A);
  assert.equal(e.controlador.estado().activado,false);assert.equal(e.controlador.estado().bloqueado,false);
  assert.deepEqual(e.llamadas,[['leer',key(A)]]);
  await e.controlador.cambiarUsuario(null);
  assert.equal(e.controlador.estado().preparando,false);assert.equal(e.controlador.estado().bloqueado,false);
  assert.equal((await e.controlador.activar()).ok,false);
  assert.equal(e.llamadas.length,1);
});
test('oculta contenido durante lectura y conserva bloqueo si estaba activado',async()=>{
  const lectura=diferida(),e=entorno({leer:()=>lectura.promesa});
  const pendiente=e.controlador.cambiarUsuario(A);
  assert.equal(e.controlador.estado().preparando,true);assert.equal(e.controlador.estado().bloqueado,true);
  lectura.resolver('1');await pendiente;
  assert.equal(e.controlador.estado().preparando,false);assert.equal(e.controlador.estado().activado,true);
  assert.equal(e.controlador.estado().bloqueado,true);
});
test('acepta PIN del sistema y solo guarda activación tras éxito explícito',async()=>{
  const prompt=diferida(),e=entorno({nivel:1,autenticar:()=>prompt.promesa});await e.controlador.cambiarUsuario(A);
  const pendiente=e.controlador.activar();await new Promise(r=>setImmediate(r));
  assert.equal(e.llamadas.some(x=>x[0]==='guardar'),false);
  const opciones=e.llamadas.find(x=>x[0]==='prompt')[1];
  assert.equal(opciones.disableDeviceFallback,false);assert.equal(opciones.cancelLabel,'Cancelar');
  assert.equal(opciones.requireConfirmation,true);
  prompt.resolver({success:true});assert.equal((await pendiente).ok,true);
  assert.equal(e.valores.get(key(A)),'1');assert.equal(e.controlador.estado().activado,true);
});
test('cancelar, fallar o no tener seguridad de sistema no activa ni persiste',async()=>{
  for(const opciones of [{resultado:{success:false,error:'user_cancel'}},{resultado:{success:false,error:'authentication_failed'}},{nivel:0}]) {
    const e=entorno(opciones);await e.controlador.cambiarUsuario(A);assert.equal((await e.controlador.activar()).ok,false);
    assert.equal(e.controlador.estado().activado,false);assert.equal(e.valores.has(key(A)),false);
    if(opciones.nivel===0)assert.equal(e.llamadas.some(x=>x[0]==='prompt'),false);
  }
});
test('cancelar no desbloquea y fondo/vuelta no lanzan prompts automáticos',async()=>{
  const e=entorno({valores:new Map([[key(A),'1']]),resultado:{success:false,error:'user_cancel'}});
  await e.controlador.cambiarUsuario(A);await e.controlador.desbloquear();assert.equal(e.controlador.estado().bloqueado,true);
  e.controlador.cambiarEstadoApp('background');e.controlador.cambiarEstadoApp('active');
  assert.equal(e.llamadas.filter(x=>x[0]==='prompt').length,1);assert.equal(e.controlador.estado().bloqueado,true);
});
test('el prompt no crea bucle al emitir inactive/active y bloquea al salir después',async()=>{
  const prompt=diferida(),e=entorno({valores:new Map([[key(A),'1']]),autenticar:()=>prompt.promesa});
  await e.controlador.cambiarUsuario(A);const pendiente=e.controlador.desbloquear();await new Promise(r=>setImmediate(r));
  e.controlador.cambiarEstadoApp('inactive');e.controlador.cambiarEstadoApp('active');
  assert.equal((await e.controlador.desbloquear()).ok,false);
  prompt.resolver({success:true});await pendiente;
  assert.equal(e.controlador.estado().bloqueado,false);assert.equal(e.llamadas.filter(x=>x[0]==='prompt').length,1);
  e.controlador.cambiarEstadoApp('background');assert.equal(e.controlador.estado().bloqueado,true);
  e.controlador.cambiarEstadoApp('active');assert.equal(e.controlador.estado().bloqueado,true);
});
test('lectura errónea o preferencia inválida cierra el paso y permite reintentar',async()=>{
  let fallar=true;
  const e=entorno({leer:async()=>{if(fallar)throw new Error('fixture');return null;}});
  await e.controlador.cambiarUsuario(A);assert.equal(e.controlador.estado().bloqueado,true);
  assert.equal(e.controlador.estado().preparando,false);assert.match(e.controlador.estado().mensaje,/Reintenta/);
  fallar=false;assert.equal((await e.controlador.desbloquear()).ok,true);assert.equal(e.controlador.estado().bloqueado,false);
  const corrupta=entorno({leer:async()=>'dato-corrupto'});await corrupta.controlador.cambiarUsuario(A);
  assert.equal(corrupta.controlador.estado().bloqueado,true);assert.equal(corrupta.controlador.estado().activado,false);
});
test('guardar fallido no anuncia activación ni desactiva protección anterior',async()=>{
  for(const anterior of [null,'1']) {
    const e=entorno({valores:new Map(anterior?[[key(A),anterior]]:[]),guardar:async()=>{throw new Error('fixture');}});
    await e.controlador.cambiarUsuario(A);assert.equal((await e.controlador.activar(!anterior)).ok,false);
    assert.equal(e.controlador.estado().activado,anterior==='1');
    if(anterior)assert.equal(e.controlador.estado().bloqueado,true);
  }
});
test('una autenticación tardía de A nunca desbloquea ni escribe la cuenta B',async()=>{
  const prompt=diferida(),e=entorno({valores:new Map([[key(A),'1'],[key(B),'1']]),autenticar:()=>prompt.promesa});
  await e.controlador.cambiarUsuario(A);const pendiente=e.controlador.desbloquear();await new Promise(r=>setImmediate(r));
  await e.controlador.cambiarUsuario(B);prompt.resolver({success:true});assert.equal((await pendiente).cancelada,true);
  assert.equal(e.controlador.estado().usuarioId,B);assert.equal(e.controlador.estado().bloqueado,true);
  assert.equal(e.llamadas.some(x=>x[0]==='guardar'),false);assert.equal(e.llamadas.filter(x=>x[0]==='cancelar').length,1);
});
test('lectura tardía y logout no resucitan otra cuenta',async()=>{
  const lectura=diferida(),e=entorno({leer:clave=>clave===key(A)?lectura.promesa:Promise.resolve('1')});
  const pendiente=e.controlador.cambiarUsuario(A);await e.controlador.cambiarUsuario(B);
  lectura.resolver(null);await pendiente;assert.equal(e.controlador.estado().usuarioId,B);assert.equal(e.controlador.estado().bloqueado,true);
  await e.controlador.cambiarUsuario(null);assert.equal(e.controlador.estado().bloqueado,false);assert.equal(e.controlador.estado().usuarioId,null);
});

test('desactivar exige otro éxito de sistema y persiste solo su propia preferencia',async()=>{
  const e=entorno({valores:new Map([[key(A),'1'],[key(B),'1']])});
  await e.controlador.cambiarUsuario(A);await e.controlador.desbloquear();
  assert.equal((await e.controlador.activar(false)).ok,true);
  assert.equal(e.llamadas.filter(x=>x[0]==='prompt').length,2);
  assert.equal(e.valores.get(key(A)),'0');assert.equal(e.valores.get(key(B)),'1');
  assert.equal(e.controlador.estado().activado,false);assert.equal(e.controlador.estado().bloqueado,false);
});
test('salir a background durante una cancelación conserva el bloqueo activado',async()=>{
  const prompt=diferida();let intentos=0;
  const e=entorno({valores:new Map([[key(A),'1']]),autenticar:()=>++intentos===1?{success:true}:prompt.promesa});
  await e.controlador.cambiarUsuario(A);await e.controlador.desbloquear();assert.equal(e.controlador.estado().bloqueado,false);
  const pendiente=e.controlador.activar(false);await new Promise(r=>setImmediate(r));
  e.controlador.cambiarEstadoApp('background');prompt.resolver({success:false,error:'user_cancel'});await pendiente;
  assert.equal(e.controlador.estado().activado,true);assert.equal(e.controlador.estado().bloqueado,true);
});

test('hook bloquea en el mismo render del UUID antes de ejecutar efectos',async()=>{
  const slots=[],efectos=[],pendientes=[];let indice=0;
  const react={useState(inicial){const i=indice++;if(!(i in slots))slots[i]=typeof inicial==='function'?inicial():inicial;return[slots[i],v=>{slots[i]=v;}];},
    useEffect(fn,deps){const i=indice++;if(!efectos[i]||deps.some((v,j)=>v!==efectos[i].deps[j]))pendientes.push(()=>{efectos[i]?.limpiar?.();efectos[i]={deps,limpiar:fn()};});}};
  const lecturas=[],seguro={WHEN_UNLOCKED_THIS_DEVICE_ONLY:99,async getItemAsync(clave,opciones){lecturas.push([clave,opciones]);return clave===key(B)?'1':null;}};
  const original=Module._load;
  Module._load=function(pedido,padre,principal){if(pedido==='react')return react;if(pedido==='react-native')return{AppState:{currentState:'active',addEventListener(){return{remove(){}};}}};if(pedido==='expo-secure-store')return seguro;return original.call(this,pedido,padre,principal);};
  function pintar(id){indice=0;return useBloqueoApp({usuarioId:id});}
  async function efectosPendientes(){while(pendientes.length)pendientes.shift()();await new Promise(r=>setImmediate(r));}
  try {
    const primero=pintar(A);assert.equal(primero.preparando,true);assert.equal(primero.bloqueado,true);assert.equal(lecturas.length,0);
    await efectosPendientes();assert.equal(pintar(A).bloqueado,false);
    const cambio=pintar(B);assert.equal(cambio.preparando,true);assert.equal(cambio.bloqueado,true);assert.equal(lecturas.length,1);
    await efectosPendientes();assert.equal(pintar(B).bloqueado,true);assert.equal(pintar(B).activado,true);
    assert.equal(lecturas[0][1].requireAuthentication,false);assert.equal(lecturas[0][1].keychainAccessible,99);
  } finally {Module._load=original;}
});

test('pantalla real tiene desbloqueo explícito, salida y error accesible sin PIN propio',()=>{
  const origen=path.resolve(__dirname,'../componentes/BloqueoApp.js');
  const raiz=process.env.RWADAR_TEST_DEPENDENCIES || path.resolve(__dirname,'..');
  const babel=require(require.resolve('@babel/core',{paths:[raiz]}));
  const jsx=require.resolve('@babel/plugin-transform-react-jsx',{paths:[raiz]});
  const commonjs=require.resolve('@babel/plugin-transform-modules-commonjs',{paths:[raiz]});
  const react={createElement(tipo,props,...children){return typeof tipo==='function'?tipo({...props,children}):{tipo,props:props||{},children};}};
  const m=new Module(origen,module);m.filename=origen;m.paths=module.paths;
  // BloqueoApp toma el radio de la guía (R.m) desde el 04/11: el simulador de tema lo trae vacío.
  m.require=pedido=>pedido==='react'?react:pedido==='react-native'?{ActivityIndicator:'ActivityIndicator',StyleSheet:{create:x=>x}}:pedido==='react-native-safe-area-context'?{SafeAreaView:'SafeAreaView'}:pedido==='./Idioma'?Object.fromEntries(['Pressable','ScrollView','Text'].map(k=>[k,k])):pedido==='../lib/tema'?{C:{},F:{},R:{},T:{}}:require(pedido);
  m._compile(babel.transformSync(fs.readFileSync(origen,'utf8'),{filename:origen,babelrc:false,configFile:false,plugins:[jsx,commonjs]}).code,origen);
  const nodos=arbol=>arbol&&typeof arbol==='object'?[arbol,...(arbol.children||[]).flat(Infinity).flatMap(nodos)]:[];
  let entradas=0,salidas=0;const props={mensaje:'Prueba de error',onDesbloquear:()=>entradas++,onSalir:()=>salidas++};
  const lista=nodos(m.exports.default(props));
  lista.find(n=>n.props.accessibilityLabel==='Desbloquear RWAdar').props.onPress();
  lista.find(n=>n.props.accessibilityLabel==='Cerrar sesión').props.onPress();
  assert.equal(entradas,1);assert.equal(salidas,1);assert.ok(lista.some(n=>n.props.accessibilityRole==='alert'));
  assert.equal(lista.some(n=>n.tipo==='TextInput'),false);
  const ocupado=nodos(m.exports.default({...props,preparando:true}));
  assert.equal(ocupado.find(n=>n.props.accessibilityLabel==='Desbloquear RWAdar').props.disabled,true);
});


test('iOS background real invalida el prompt tardio y exige un intento nuevo',async()=>{
  const prompt=diferida();let intentos=0;
  const e=entorno({valores:new Map([[key(A),'1']]),autenticar:()=>++intentos===1?prompt.promesa:{success:true}});
  await e.controlador.cambiarUsuario(A);
  const pendiente=e.controlador.desbloquear();await new Promise(r=>setImmediate(r));
  assert.equal(e.controlador.estado().ocupado,true);
  e.controlador.cambiarEstadoApp('background');e.controlador.cambiarEstadoApp('active');
  assert.equal(e.controlador.estado().bloqueado,true);
  assert.equal(e.controlador.estado().ocupado,false);
  assert.equal(e.llamadas.filter(x=>x[0]==='prompt').length,1);
  prompt.resolver({success:true});
  assert.equal((await pendiente).cancelada,true);
  assert.equal(e.controlador.estado().bloqueado,true);
  assert.equal(e.llamadas.filter(x=>x[0]==='cancelar').length,1);
  assert.equal((await e.controlador.desbloquear()).ok,true);
  assert.equal(e.controlador.estado().bloqueado,false);
  assert.equal(e.llamadas.filter(x=>x[0]==='prompt').length,2);
});


test('Android PIN Activity vuelve active antes del exito nativo y desbloquea',async()=>{
  const prompt=diferida(),e=entorno({plataforma:'android',nivel:1,valores:new Map([[key(A),'1']]),autenticar:()=>prompt.promesa});
  await e.controlador.cambiarUsuario(A);const pendiente=e.controlador.desbloquear();await new Promise(r=>setImmediate(r));
  e.controlador.cambiarEstadoApp('background');assert.equal(e.controlador.estado().bloqueado,true);
  assert.equal(e.controlador.estado().ocupado,true);assert.equal(e.llamadas.filter(x=>x[0]==='cancelar').length,0);
  e.controlador.cambiarEstadoApp('active');prompt.resolver({success:true});
  assert.equal((await pendiente).ok,true);assert.equal(e.controlador.estado().bloqueado,false);
  assert.equal(e.llamadas.filter(x=>x[0]==='prompt').length,1);
});
test('Android PIN exito antes de active espera sin mostrar contenido ni repetir prompt',async()=>{
  const prompt=diferida(),e=entorno({plataforma:'android',valores:new Map([[key(A),'1']]),autenticar:()=>prompt.promesa});
  await e.controlador.cambiarUsuario(A);const pendiente=e.controlador.desbloquear();await new Promise(r=>setImmediate(r));
  e.controlador.cambiarEstadoApp('background');prompt.resolver({success:true});await new Promise(r=>setImmediate(r));
  assert.equal(e.controlador.estado().bloqueado,true);assert.equal(e.controlador.estado().ocupado,true);
  e.controlador.cambiarEstadoApp('active');assert.equal((await pendiente).ok,true);
  assert.equal(e.controlador.estado().bloqueado,false);assert.equal(e.llamadas.filter(x=>x[0]==='prompt').length,1);
});
test('Android PIN cancelar y retornar sin exito nunca abre ni reinicia el prompt',async()=>{
  const prompt=diferida(),e=entorno({plataforma:'android',valores:new Map([[key(A),'1']]),autenticar:()=>prompt.promesa});
  await e.controlador.cambiarUsuario(A);const pendiente=e.controlador.desbloquear();await new Promise(r=>setImmediate(r));
  e.controlador.cambiarEstadoApp('background');e.controlador.cambiarEstadoApp('active');
  assert.equal(e.controlador.estado().bloqueado,true);assert.equal(e.controlador.estado().ocupado,true);
  prompt.resolver({success:false,error:'user_cancel'});assert.equal((await pendiente).ok,false);
  assert.equal(e.controlador.estado().bloqueado,true);assert.equal(e.controlador.estado().ocupado,false);
  assert.equal(e.llamadas.filter(x=>x[0]==='prompt').length,1);
});
test('Android PIN intento caducado no acepta exito tardio tras retornar',async()=>{
  let reloj=0;const prompt=diferida(),e=entorno({plataforma:'android',plazoMs:1000,ahora:()=>reloj,
    valores:new Map([[key(A),'1']]),autenticar:()=>prompt.promesa});
  await e.controlador.cambiarUsuario(A);const pendiente=e.controlador.desbloquear();await new Promise(r=>setImmediate(r));
  e.controlador.cambiarEstadoApp('background');reloj=1001;e.controlador.cambiarEstadoApp('active');
  assert.equal((await pendiente).ok,false);assert.equal(e.controlador.estado().bloqueado,true);
  prompt.resolver({success:true});await new Promise(r=>setImmediate(r));
  assert.equal(e.controlador.estado().bloqueado,true);assert.equal(e.controlador.estado().ocupado,false);
  assert.equal(e.llamadas.filter(x=>x[0]==='prompt').length,1);
});
