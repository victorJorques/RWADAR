const test=require('node:test'),assert=require('node:assert/strict');
const {mainAccountReady}=require('./web-chrome-141.cjs');
test('main account button is actionable only after enabled authenticated Cuenta label',()=>{
  const state=(disabled,label,id='expected')=>mainAccountReady({getElementById:()=>({disabled,getAttribute:()=>label})},{RWADAR_ACCESO:{usuario:()=>({id})}},'expected');
  assert.equal(state(true,'Mis inversiones y mi cuenta'),false,'DOM presence and bridge login are insufficient while disabled');
  assert.equal(state(false,'Entrar o crear una cuenta para registrar mis inversiones'),false,'An enabled anonymous action is not authenticated readiness');
  assert.equal(state(false,'Mis inversiones y mi cuenta','another'),false);
  assert.equal(state(false,'Mis inversiones y mi cuenta'),true);
  assert.equal(mainAccountReady({getElementById:()=>null},{RWADAR_ACCESO:{usuario:()=>({id:'expected'})}},'expected'),false);
});
