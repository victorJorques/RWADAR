import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../rwadar-site/assets/acceso-privado.js',import.meta.url),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function entorno(){
  let state='valid',erased=0;const requests=[],destinations=[];
  const context=vm.createContext({window:{addEventListener(){}},
    document:{documentElement:{replaceChildren(){erased++;}},addEventListener(){}},
    location:{hash:'',pathname:'/',search:'',replace:path=>destinations.push(path),assign:path=>destinations.push(path)},
    sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},setInterval(){},URLSearchParams,
    fetch:async(path,options)=>{
      requests.push({path,options});
      if(path.endsWith('/datos'))return {ok:true,status:200,json:async()=>[{id:'cuenta-a'}]};
      assert.equal(path,'/api/acceso/sesion');
      if(state==='network')throw new TypeError('Raw network details must stay private');
      if(typeof state==='number')return {ok:false,status:state};
      if(state==='json-error')return {ok:true,status:200,json:async()=>{throw new SyntaxError('invalid JSON');}};
      if(state==='body-network')return {ok:true,status:200,json:async()=>{throw new TypeError('Response stream interrupted');}};
      const usuario=state==='changed'?{id:'cuenta-b'}:state==='malformed'?{id:42}:{id:'cuenta-a'};
      return {ok:true,status:200,json:async()=>({autenticada:true,usuario})};
    }});
  vm.runInContext(source,context);
  return {bridge:context.window.RWADAR_ACCESO,requests,destinations,erased:()=>erased,setState:next=>{state=next;}};
}

for(const failure of [503,'network','body-network',429])test(`200 → ${failure} bloquea lectura y escritura sin expulsar; después recupera`,async()=>{
  const e=entorno();await tick();assert.equal(e.bridge.usuario().id,'cuenta-a');
  e.setState(failure);
  await assert.rejects(e.bridge.verificar(),error=>error.reintentable===true&&/Reintenta/.test(error.message));
  const before=e.requests.filter(r=>r.path.endsWith('/datos')).length;
  await assert.rejects(e.bridge.datos('/mi_perfil?select=*'),error=>error.reintentable===true);
  await assert.rejects(e.bridge.datos('/vigilancia',{method:'POST',body:'{}'}),error=>error.reintentable===true);
  assert.equal(e.requests.filter(r=>r.path.endsWith('/datos')).length,before,'No private request may escape failed verification');
  assert.equal(e.bridge.usuario().id,'cuenta-a');assert.equal(e.erased(),0);assert.deepEqual(e.destinations,[]);
  e.setState('valid');assert.equal((await e.bridge.verificar()).id,'cuenta-a');
  assert.equal((await e.bridge.datos('/mi_perfil?select=*'))[0].id,'cuenta-a');
  assert.equal(e.requests.some(r=>r.path.endsWith('/salir')),false);
});

for(const failure of [401,403,'changed','malformed','json-error'])test(`rechazo definitivo ${failure} elimina identidad y privados`,async()=>{
  const e=entorno();await tick();e.setState(failure);
  await assert.rejects(e.bridge.verificar(),error=>error.reintentable!==true);
  assert.equal(e.bridge.usuario(),null);assert.equal(e.erased(),1);assert.deepEqual(e.destinations,['/']);
});
