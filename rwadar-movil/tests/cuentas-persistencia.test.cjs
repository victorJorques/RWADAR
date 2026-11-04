const test = require('node:test');
const assert = require('node:assert/strict');
const { crearControladorCuentas } = require('../lib/cuentas');
const { crearAlmacenSesion, CLAVE_SESION, MAX_REGISTRO_BYTES } = require('../lib/almacen-sesion');
const UID='11111111-1111-4111-8111-111111111111';
const correo='cuenta@ejemplo.test', clave='contraseña que nunca se guarda';
const user={id:UID,email:correo,email_confirmed_at:'2026-10-28T08:00:00Z'};
function entorno() {
  const valores=new Map(),clientes=[],llamadas=[],validos=new Set();let siguiente=0;
  const fallos={write:false,read:false,delete:false,auth:null,vigilancia:null,malLogin:false,refreshEspera:null};
  const seguro={
    async getItemAsync(k) { if(fallos.read)throw new Error('disco');return valores.get(k)??null; },
    async setItemAsync(k,v) { if(fallos.write)throw new Error('disco');valores.set(k,v); },
    async deleteItemAsync(k) { if(fallos.delete)throw new Error('disco');valores.delete(k); },
  };
  const almacen=crearAlmacenSesion({secureStore:seguro});
  const bien=data=>({data,error:null});
  function nuevaSesion(anterior) {
    if(anterior)validos.delete(anterior);
    const refresh_token='refresh-'+(++siguiente);validos.add(refresh_token);
    return {access_token:'acceso.no.persistir',refresh_token,user,expires_in:3600};
  }
  function crearCliente(opciones) {
    let session=null,listener=null;
    const cliente={opciones,
      auth:{
        async signInWithPassword(datos) { llamadas.push(['login',datos]);
          if(fallos.malLogin)return {data:null,error:{code:'invalid_credentials',status:400}};
          session=nuevaSesion();return bien({session,user}); },
        async refreshSession(datos) { llamadas.push(['refresh',datos]);
          if(fallos.refreshEspera)await fallos.refreshEspera;
          if(fallos.auth)return {data:null,error:fallos.auth};
          if(!validos.has(datos.refresh_token))return {data:null,error:{code:'refresh_token_not_found',status:400}};
          session=nuevaSesion(datos.refresh_token);return bien({session,user}); },
        async getUser() { llamadas.push(['getUser']);return fallos.auth?{data:null,error:fallos.auth}:bien({user}); },
        async getSession() { return bien({session}); },
        async signOut(datos) { llamadas.push(['logout',datos]);if(session)validos.delete(session.refresh_token);session=null;return bien({}); },
        onAuthStateChange(fn) { listener=fn;return {data:{subscription:{unsubscribe(){listener=null;}}}}; },
        async resetPasswordForEmail() { return bien({}); },
        dispose(){listener=null;},stopAutoRefresh(){},startAutoRefresh(){},
      },
      from(tabla) {
        const builder={select(){return builder;},eq(){return builder;},limit(){return builder;},
          then(resolve,reject){llamadas.push(['tabla',tabla]);return Promise.resolve(tabla==='mi_perfil'
            ?bien([{id:UID,nombre:'Cuenta'}]):fallos.vigilancia||bien([])).then(resolve,reject);}};
        return builder;
      },
      renovar() { const anterior=session.refresh_token;session=nuevaSesion(anterior);listener?.('TOKEN_REFRESHED',session);return session.refresh_token; },
      listener:()=>listener,
    };clientes.push(cliente);return cliente;
  }
  function controlador() { return crearControladorCuentas({modoLocal:false,cuentasRemotas:true,correoVerificado:true,
    crearCliente,almacenSesion:almacen,plazoMs:500}); }
  return {almacen,seguro,valores,clientes,llamadas,fallos,controlador};
}

test('sesion segura: reinicio restaura con refresh rotado y revalida identidad y perfil sin contraseña',async()=>{
  const e=entorno(),a=e.controlador();assert.equal((await a.entrar({correo,clave})).ok,true);
  const guardada=await e.almacen.leer();assert.equal(guardada.usuarioId,UID);
  assert.doesNotMatch(e.valores.get(CLAVE_SESION),/contraseña|acceso\.no\.persistir|email|nombre/);
  a.destruir();const antes=e.llamadas.length,b=e.controlador();
  const resultado=await b.restaurar();assert.deepEqual(resultado,{ok:true,restaurada:true});
  assert.equal(b.estado().usuario.id,UID);assert.notEqual((await e.almacen.leer()).refreshToken,guardada.refreshToken);
  assert.deepEqual(e.llamadas.slice(antes).map(x=>x[0]),['refresh','getUser','tabla','tabla']);
  assert.equal(e.clientes.every(c=>c.opciones.mantenerSesion===true),true);b.destruir();
});

test('sesion segura: TOKEN_REFRESHED guarda la rotacion y se usa en el siguiente arranque',async()=>{
  const e=entorno(),a=e.controlador();await a.entrar({correo,clave});
  const token=e.clientes[0].renovar();assert.equal((await e.almacen.leer()).refreshToken,token);
  a.destruir();const b=e.controlador();assert.equal((await b.restaurar()).restaurada,true);
  assert.equal(e.llamadas.find(x=>x[0]==='refresh')[1].refresh_token,token);b.destruir();
});

test('sesion segura: logout elimina el refresh aunque falle delete; no reaparece al reiniciar',async()=>{
  const e=entorno(),a=e.controlador();await a.entrar({correo,clave});e.fallos.delete=true;
  const salida=a.salir();assert.equal(a.estado().usuario,null);assert.equal((await salida).ok,true);
  assert.equal(await e.almacen.leer(),null);assert.deepEqual(e.llamadas.find(x=>x[0]==='logout')[1],{scope:'local'});
  const antes=e.llamadas.length,b=e.controlador();assert.deepEqual(await b.restaurar(),{ok:true,restaurada:false});
  assert.equal(e.llamadas.length,antes);b.destruir();
});

test('sesion segura: revocacion real borra el guardado y no admite identidad',async()=>{
  const e=entorno(),a=e.controlador();await a.entrar({correo,clave});a.destruir();
  e.fallos.auth={status:401,code:'session_not_found'};const b=e.controlador();
  assert.equal((await b.restaurar()).ok,false);assert.equal(b.estado().usuario,null);assert.equal(await e.almacen.leer(),null);b.destruir();
});

test('sesion segura: corte de red conserva refresh sin dar acceso; un reintento restaura',async()=>{
  const e=entorno(),a=e.controlador();await a.entrar({correo,clave});a.destruir();
  const token=(await e.almacen.leer()).refreshToken;e.fallos.auth={status:503};const b=e.controlador();
  assert.equal((await b.restaurar()).ok,false);assert.equal(b.estado().estado,'sin-sesion');assert.equal(b.estado().usuario,null);
  assert.equal((await e.almacen.leer()).refreshToken,token);e.fallos.auth=null;
  assert.equal((await b.restaurar()).restaurada,true);b.destruir();
});

test('sesion segura: refrescar y catalogo ante 503 no expulsan una cuenta ya verificada',async()=>{
  const e=entorno(),a=e.controlador();await a.entrar({correo,clave});const token=(await e.almacen.leer()).refreshToken;
  e.fallos.auth={status:503};assert.equal((await a.refrescar()).ok,false);await assert.rejects(a.clienteCatalogo());
  assert.equal(a.estado().usuario.id,UID);assert.equal((await e.almacen.leer()).refreshToken,token);
  e.fallos.auth=null;assert.equal((await a.refrescar()).ok,true);a.destruir();
});

test('sesion segura: vigilancia no bloquea login ni admite filas ajenas; 401 sigue rechazandose',async()=>{
  for(const fallo of [{data:null,error:{status:503}},
    {data:[{usuario_id:'otro',plataforma_id:UID,plataformas:null}],error:null}]) {
    const e=entorno();e.fallos.vigilancia=fallo;const a=e.controlador();
    assert.equal((await a.entrar({correo,clave})).ok,true);assert.deepEqual(a.estado().vigiladas,[]);
    assert.match(a.estado().mensaje,/no se pudo cargar tu lista de seguimiento/);a.destruir();
  }
  const e=entorno();e.fallos.vigilancia={data:null,error:{status:401}};const a=e.controlador();
  assert.equal((await a.entrar({correo,clave})).ok,false);assert.equal(a.estado().usuario,null);a.destruir();
});

test('sesion segura: fallo de escritura impide prometer persistencia; cierre fallido se informa',async()=>{
  const e=entorno(),a=e.controlador();e.fallos.write=true;
  assert.equal((await a.entrar({correo,clave})).ok,false);assert.equal(a.estado().usuario,null);
  assert.match(a.estado().error,/almacenamiento seguro/);assert.equal(e.valores.size,0);
  e.fallos.write=false;await a.entrar({correo,clave});e.fallos.write=true;e.fallos.delete=true;
  assert.equal((await a.salir()).ok,false);assert.equal(a.estado().usuario,null);assert.match(a.estado().error,/almacenamiento seguro/);
  e.fallos.write=false;e.fallos.delete=false;assert.equal((await a.salir()).ok,true);assert.equal(await e.almacen.leer(),null);a.destruir();
});

test('sesion segura: login fallido de otra cuenta y clientes temporales no reemplazan el guardado',async()=>{
  const e=entorno(),a=e.controlador();await a.entrar({correo,clave});const guardada=await e.almacen.leer();
  e.fallos.malLogin=true;assert.equal((await a.entrar({correo:'otra@ejemplo.test',clave})).ok,false);
  assert.deepEqual(await e.almacen.leer(),guardada);await a.recuperar({correo});assert.equal(e.clientes.at(-1).opciones.mantenerSesion,false);
  assert.deepEqual(await e.almacen.leer(),guardada);e.fallos.malLogin=false;assert.equal((await a.restaurar()).restaurada,true);a.destruir();
});

test('sesion segura: refresh tardio no restaura despues de un cierre explicito',async()=>{
  const e=entorno(),a=e.controlador();await a.entrar({correo,clave});a.destruir();let continuar;
  e.fallos.refreshEspera=new Promise(resolve=>{continuar=resolve;});const b=e.controlador(),restauracion=b.restaurar();
  await new Promise(resolve=>setImmediate(resolve));await b.salir();continuar();
  assert.equal((await restauracion).cancelada,true);assert.equal(b.estado().usuario,null);assert.equal(await e.almacen.leer(),null);b.destruir();
});

test('almacen seguro: claves fijas, valores acotados, datos corruptos y CAS no sobreescriben otra sesion',async()=>{
  const e=entorno(),registro={usuarioId:UID,refreshToken:'guardado'};
  await e.almacen.guardar(registro);assert.deepEqual([...e.valores.keys()],[CLAVE_SESION]);
  await assert.rejects(e.almacen.guardar({...registro,refreshToken:'a'.repeat(MAX_REGISTRO_BYTES)}));
  assert.equal((await e.almacen.leer()).refreshToken,'guardado');
  assert.equal(await e.almacen.reemplazar({...registro,refreshToken:'otro'},{...registro,refreshToken:'incorrecto'}),false);
  assert.equal((await e.almacen.leer()).refreshToken,'guardado');
  e.valores.set(CLAVE_SESION,'{roto');await assert.rejects(e.almacen.leer());await e.almacen.borrar();assert.equal(await e.almacen.leer(),null);
});


test('almacen ASCII no requiere TextEncoder y rechaza Unicode o registros grandes',async()=>{
  const anterior=globalThis.TextEncoder;
  try {
    globalThis.TextEncoder=undefined;
    const e=entorno(),registro={usuarioId:UID,refreshToken:'refresh_ASCII-123'};
    await e.almacen.guardar(registro);assert.equal((await e.almacen.leer()).refreshToken,registro.refreshToken);
    await assert.rejects(e.almacen.guardar({...registro,refreshToken:'sesión'}));
    await assert.rejects(e.almacen.guardar({...registro,refreshToken:'x'.repeat(MAX_REGISTRO_BYTES)}));
    assert.equal((await e.almacen.leer()).refreshToken,registro.refreshToken);
  } finally { globalThis.TextEncoder=anterior; }
});

test('logout borra guardado aunque la pantalla cancele al desmontarse',async()=>{
  const e=entorno(),a=e.controlador();await a.entrar({correo,clave});
  const salida=a.salir();a.cancelar();await salida;
  assert.equal(await e.almacen.leer(),null);assert.equal(a.estado().usuario,null);a.destruir();
});
