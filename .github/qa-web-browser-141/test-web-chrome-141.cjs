'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{CDP,statusOnly,requireQa}=require('./web-chrome-141.cjs');
test('only fixed own QA is accepted before launching any browser',()=>{
  assert.throws(()=>requireQa({}),/qa_identity_rejected/);
  const env={QA_ACCOUNT_ACK:'CONFIRMED_TEST_ACCOUNT',QA_USER_ID:'8871c88e-b0af-415b-9346-dcceb182c2ac',QA_ACCOUNT_MARKER:'ba8cb4645588067ff77ef11a',RWADAR_QA_EMAIL:'vcicrack+rwadar-qa-ba8cb4645588067ff77ef11a@gmail.com',RWADAR_QA_PASSWORD:'LOCAL_MOCK_ONLY_123'};
  requireQa(env);assert.throws(()=>requireQa({...env,RWADAR_QA_EMAIL:'another@example.invalid'}),/qa_identity_rejected/);
});
test('network report keeps only fixed routes and status, never credentials/query/headers',()=>{
  const response={url:'https://rwadar.pages.dev/api/acceso/sesion?secret=NEVER_PRINT',status:200,headers:{Cookie:'NEVER_PRINT'}};
  const result=statusOnly({method:'Network.responseReceived',params:{response}});
  assert.deepEqual(result,{route:'sesion',status:200});assert.ok(!JSON.stringify(result).includes('NEVER_PRINT'));
  assert.equal(statusOnly({method:'Network.responseReceived',params:{response:{...response,url:'https://other.invalid/api/acceso/sesion'}}}),null);
});
test('CDP transport correctly pairs command results and suppresses arbitrary protocol errors',async()=>{
  class Socket extends EventTarget{send(raw){const {id,method}=JSON.parse(raw);queueMicrotask(()=>this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(method==='Runtime.evaluate'?{id,result:{result:{value:true}}}:{id,error:{message:'NEVER_PRINT'}})})));}}
  const cdp=new CDP(new Socket());assert.equal(await cdp.evaluate('true'),true);
  await assert.rejects(cdp.call('NoSuchMethod'),error=>error.message==='cdp_command_failed'&&!error.message.includes('NEVER_PRINT'));
});
