import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const web=fs.readFileSync(new URL('../rwadar-site/assets/rwadar-20260820.js',import.meta.url),'utf8');
const bridge=fs.readFileSync(new URL('../rwadar-site/assets/acceso-privado.js',import.meta.url),'utf8');
const consentimiento=web.slice(web.indexOf('const VERSION_CONSENTIMIENTO_CORREO='),web.indexOf('/* correo-consentimiento:fin */'));
const cuenta=web.slice(web.indexOf('const Cuenta = (function(){'),web.indexOf('/* comunidad:inicio */'));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function deferred(){let resolve;const promise=new Promise(ok=>{resolve=ok;});return {promise,resolve};}

function entorno({failRoute='',network=false,pending=null,revokeAfter=Infinity,avisos=false}={}){
  const calls=[],destinations=[],panels=[],notices=[],nodes=new Map();let fail=!!failRoute,sessionCalls=0,erased=0;
  function node(id){
    if(!nodes.has(id))nodes.set(id,{innerHTML:'',value:'',handlers:new Map(),
      addEventListener(kind,fn){this.handlers.set(kind,fn);},setAttribute(){},removeAttribute(){},
      querySelectorAll(){return [];},classList:{contains:()=>false,add(){},remove(){}}});
    return nodes.get(id);
  }
  const context=vm.createContext({window:{addEventListener(){}},
    document:{getElementById:node,addEventListener(){},documentElement:{replaceChildren(){erased++;}}},
    location:{hash:'',pathname:'/',search:'',replace:path=>destinations.push(path),assign:path=>destinations.push(path)},
    sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},setInterval(){},URLSearchParams,
    SERVICIOS_USUARIO_DISPONIBLES:true,OPINIONES_DISPONIBLES:false,AVISOS_CORREO_DISPONIBLES:avisos,
    openPanel:id=>panels.push(id),closeAll(){},avisar:text=>notices.push(text),
    fetch:async(path,options)=>{
      calls.push({path,options});
      if(path.endsWith('/sesion')){
        sessionCalls++;if(pending)await pending.promise;
        if(sessionCalls>revokeAfter)return {ok:false,status:401,json:async()=>({error:'sesion_necesaria'})};
        return {ok:true,status:200,json:async()=>({autenticada:true,usuario:{id:'cuenta-a',correo:'prueba@ejemplo.test',correoConfirmadoEl:'2026-10-28T00:00:00Z'}})};
      }
      if(path.endsWith('/salir'))return {ok:true,status:200,json:async()=>({cerrado:true})};
      assert.equal(path,'/api/acceso/datos');const {ruta}=JSON.parse(options.body);
      if(fail&&ruta.startsWith(failRoute)){
        if(network)throw new TypeError('Network unavailable');
        return {ok:false,status:503,json:async()=>({error:'servicio_no_disponible'})};
      }
      const data=ruta.startsWith('/mi_perfil?')?[{id:'cuenta-a',nombre:'Nombre actual'}]:[];
      return {ok:true,status:200,json:async()=>data};
    }});
  vm.runInContext(bridge,context);
  vm.runInContext(consentimiento+'\n'+cuenta+'\nglobalThis.cuentaPrueba=Cuenta;',context);
  return {context,calls,destinations,panels,notices,node,erased:()=>erased,recover(){fail=false;}};
}

for(const failRoute of ['/mi_perfil?','/vigilancia?'])for(const network of [false,true]){
  test(`fallo ${network?'de red':'503'} en ${failRoute} conserva sesión y permite reintentar`,async()=>{
    const e=entorno({failRoute,network});await tick();
    assert.equal(e.context.cuentaPrueba.hay(),true);
    assert.equal(e.context.window.RWADAR_ACCESO.usuario().id,'cuenta-a');
    assert.equal(e.calls.some(c=>c.path.endsWith('/salir')),false);
    assert.deepEqual(e.destinations,[]);assert.equal(e.erased(),0);
    await e.context.cuentaPrueba.abrirGestion();
    const failed=e.node('perfilCuerpo').innerHTML;
    assert.match(failed,/Tu sesión sigue abierta/);assert.match(failed,/Reintentar datos de cuenta/);
    assert.doesNotMatch(failed,/Nombre actual/,'A partial old profile must not be shown after failure');
    e.recover();await e.node('pfReintentarCuenta').handlers.get('click')();await tick();
    assert.doesNotMatch(e.node('perfilCuerpo').innerHTML,/Tu sesión sigue abierta/);
    assert.match(e.node('perfilCuerpo').innerHTML,/Nombre actual/);
    assert.equal(e.context.cuentaPrueba.hay(),true);
    assert.equal(e.calls.some(c=>c.path.endsWith('/salir')),false);
  });
}

test('clic durante restauración espera la sesión y abre perfil sin volver a acceso',async()=>{
  const pending=deferred(),e=entorno({pending});
  const click=e.node('btnCuenta').handlers.get('click')();
  await tick();assert.deepEqual(e.destinations,[]);assert.deepEqual(e.panels,[]);
  assert.ok(e.notices.some(text=>text.includes('Comprobando tu sesión')));
  pending.resolve();await click;await tick();
  assert.equal(e.context.cuentaPrueba.hay(),true);
  assert.ok(e.panels.includes('perfilPanel'));assert.deepEqual(e.destinations,[]);
});

test('rechazo Auth vigente durante carga sí elimina la identidad y el acceso privado',async()=>{
  const e=entorno({revokeAfter:1});await tick();
  assert.equal(e.context.window.RWADAR_ACCESO.usuario(),null);
  assert.equal(e.context.cuentaPrueba.hay(),false);
  assert.ok(e.erased()>0);assert.ok(e.destinations.some(path=>path.startsWith('/acceso?volver=')));
  assert.equal(e.calls.some(c=>c.path.endsWith('/salir')),false,'An already revoked identity needs no logout mutation');
});

test('avisos apagados no consulta preferencias y conserva el acceso a la cuenta',async()=>{
  const disabled=entorno({avisos:false});await tick();
  assert.equal(disabled.context.cuentaPrueba.hay(),true);
  const routes=disabled.calls.filter(c=>c.path.endsWith('/datos')).map(c=>JSON.parse(c.options.body).ruta);
  assert.ok(routes.some(r=>r.startsWith('/mi_perfil?')));assert.ok(routes.some(r=>r.startsWith('/vigilancia?')));
  assert.equal(routes.some(r=>r.startsWith('/perfiles?')),false);
  assert.deepEqual(disabled.destinations,[]);
  const enabled=entorno({avisos:true});await tick();
  assert.ok(enabled.calls.filter(c=>c.path.endsWith('/datos')).some(c=>JSON.parse(c.options.body).ruta.startsWith('/perfiles?')));
});
