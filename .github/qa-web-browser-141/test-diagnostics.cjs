const test=require('node:test'),assert=require('node:assert/strict');
const {runtimeExceptionOnly,domState,statusOnly}=require('./web-chrome-141.cjs');
const event=description=>({method:'Runtime.exceptionThrown',params:{exceptionDetails:{exception:{description}}}});
test('runtime errors emit only structural identifier/property, never message tails or stacks',()=>{
  assert.deepEqual(runtimeExceptionOnly(event('ReferenceError: Cuenta is not defined\n at password=NEVER_EXPORT')), {type:'ReferenceError',identifier:'Cuenta'});
  assert.deepEqual(runtimeExceptionOnly(event("TypeError: Cannot read properties of null (reading 'addEventListener')\n at token=NEVER_EXPORT")),{type:'TypeError',receiver:'null',property:'addEventListener'});
  assert.deepEqual(runtimeExceptionOnly(event("ReferenceError: Cannot access 'Cuenta' before initialization")),{type:'ReferenceError',identifier:'Cuenta',beforeInitialization:true});
  assert.equal(runtimeExceptionOnly(event('Error: NEVER_EXPORT')),null);
  assert.equal(runtimeExceptionOnly(event("TypeError: Cannot read properties of null (reading 'secret@example.invalid')")),null);
  assert.deepEqual(runtimeExceptionOnly(event('ReferenceError: SECRET_VALUE is not defined'),['SECRET_VALUE']),{type:'ReferenceError',identifier:'redacted'});
});
test('DOM diagnostics returns only requested booleans and distinguishes disabled button from absent panel',()=>{
  const nodes={btnCuenta:{disabled:true},perfilPanel:{classList:{contains:kind=>kind==='show'}},pfInversiones:{textContent:'NEVER_EXPORT'},perfilCuerpo:{textContent:'Mis inversiones secret@example.invalid'}};
  const state=domState({getElementById:id=>nodes[id]},{RWADAR_ACCESO:{usuario:()=>({id:'same',email:'NEVER_EXPORT'})}},'same');
  assert.deepEqual(state,{bridgeMatchesQA:true,buttonPresent:true,buttonEnabled:false,panelShow:true,pfInversionesexists:true,headingtextpresent:true});
  assert.ok(Object.values(state).every(value=>typeof value==='boolean'));assert.ok(!JSON.stringify(state).includes('NEVER_EXPORT'));
});
test('private data endpoint reports status only, excluding cookies/query/body',()=>{
  const result=statusOnly({method:'Network.responseReceived',params:{response:{url:'https://rwadar.pages.dev/api/acceso/datos?secret=NEVER_EXPORT',status:503,headers:{Cookie:'NEVER_EXPORT'}}}});
  assert.deepEqual(result,{route:'datos',status:503});
});
