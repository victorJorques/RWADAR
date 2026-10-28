import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../rwadar-site/acceso.html',import.meta.url),'utf8');
const script=fs.readFileSync(new URL('../rwadar-site/assets/acceso.js',import.meta.url),'utf8');
const uid='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function browser({adopt=false,keepCookie=true,status=200,network=false,sessionUid=uid}={}){
  const nodes=new Map(),buttons=[],calls=[],destinations=[];let cookie=false;
  for(const [,tag,attrs]of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/g)){
    const id=attrs.match(/\bid="([^"]+)"/)?.[1],view=attrs.match(/\bdata-vista="([^"]+)"/)?.[1];
    if(!id&&!view)continue;
    const node={value:'',checked:false,disabled:false,textContent:'',hidden:/\bhidden\b/.test(attrs),dataset:{vista:view},events:{},
      addEventListener(kind,fn){this.events[kind]=fn;},reportValidity(){return true;},focus(){}};
    if(id)nodes.set(id,node);if(tag==='button'&&view)buttons.push(node);
  }
  const context=vm.createContext({
    document:{getElementById:id=>nodes.get(id),querySelectorAll:()=>buttons},
    sessionStorage:{getItem:()=>null,removeItem(){},setItem(){assert.fail('Do not persist credentials or tokens');}},
    localStorage:{setItem(){assert.fail('Do not persist credentials or tokens');}},
    location:{origin:'https://rwadar.pages.dev',pathname:'/acceso',search:'?volver=%2Facademy%2F',
      hash:adopt?'#access_token=local-test-only&type=signup':'',replace:path=>destinations.push(path)},
    history:{replaceState(){}},URL,URLSearchParams,AbortController,setTimeout:()=>0,clearTimeout(){},
    fetch:async(path,options)=>{
      calls.push({path,options});
      if(path.endsWith('/inspeccionar'))return Response.json({usuario:{id:uid,correo:'local@example.test'}});
      if(path.endsWith('/sesion')){
        assert.equal(options.method,'GET');assert.equal(options.credentials,'same-origin');
        assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error');assert.ok(options.signal);
        if(network)throw new TypeError('Sensitive network detail must not reach the UI');
        if(!cookie)return Response.json({error:'sesion_necesaria'},{status:401});
        return Response.json(status===200?{autenticada:true,usuario:{id:sessionUid}}:{error:'private backend detail'},{status});
      }
      assert.equal(path,'/api/acceso/'+(adopt?'adoptar':'entrar'));
      assert.equal(options.credentials,'same-origin');cookie=keepCookie;
      return Response.json({autenticada:true,usuario:{id:uid}});
    }
  });
  vm.runInContext(script,context);
  return {node:id=>nodes.get(id),calls,destinations,async enter(){
    if(adopt){await tick();await nodes.get('adoptar').events.click();}
    else{nodes.get('correo').value='local@example.test';nodes.get('clave').value='local-password-test';
      await nodes.get('formulario').events.submit({preventDefault(){}});}
  }};
}

function remains(e,adopt,code){
  assert.deepEqual(e.destinations,[]);
  assert.equal(e.node(adopt?'adoptar':'enviar').disabled,false);
  assert.equal(e.node(adopt?'identidad':'formulario').hidden,false);
  assert.match(e.node('estado').textContent,new RegExp(code));
  assert.doesNotMatch(e.node('estado').textContent,/Sensitive|private backend|cookie bloqueada/i);
}

test('200 y cookie conservada comprueba el mismo usuario antes de regresar',async()=>{
  for(const adopt of [false,true]){
    const e=browser({adopt});await e.enter();
    assert.deepEqual(e.destinations,['/academy/']);
    assert.equal(e.calls.at(-1).path,'/api/acceso/sesion');
    assert.equal(e.calls.filter(c=>c.path.endsWith('/sesion')).length,1);
  }
});

test('200 con cookie omitida y sesión401 conserva pantalla y controles',async()=>{
  for(const adopt of [false,true]){const e=browser({adopt,keepCookie:false});await e.enter();remains(e,adopt,'S401');}
});

test('503 o red en la confirmación conserva pantalla sin filtrar errores',async()=>{
  for(const adopt of [false,true])for(const options of [{status:503},{network:true}]){
    const e=browser({adopt,...options});await e.enter();remains(e,adopt,options.network?'SRED':'S503');
  }
});

test('otro usuario en sesión200 impide regresar aunque el POST haya entrado',async()=>{
  for(const adopt of [false,true]){const e=browser({adopt,sessionUid:other});await e.enter();remains(e,adopt,'SID');}
});
