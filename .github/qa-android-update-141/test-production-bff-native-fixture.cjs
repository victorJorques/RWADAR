const test=require('node:test'),assert=require('node:assert/strict'),{run,preflight,decimal}=require('./production-bff-native-fixture.cjs');
const env={QA_ACCOUNT_ACK:'CONFIRMED_TEST_ACCOUNT',QA_USER_ID:'8871c88e-b0af-415b-9346-dcceb182c2ac',QA_ACCOUNT_MARKER:'ba8cb4645588067ff77ef11a',RWADAR_QA_EMAIL:'vcicrack+rwadar-qa-ba8cb4645588067ff77ef11a@gmail.com',RWADAR_QA_PASSWORD:'LOCAL_MOCK_ONLY_LONG',GITHUB_RUN_ID:'123'};
function fixture({wrong=false,oversized=false,http403=false}={}){
 const calls=[];const fetch=async(url,options)=>{
  const route=url.split('/').at(-1);calls.push(route);assert.equal(options.redirect,'manual');assert.equal(options.headers['User-Agent'],undefined);
  assert.ok(url.startsWith('https://rwadar.pages.dev/api/acceso/'));if(route!=='entrar')assert.equal(options.headers.Cookie,'__Host-rwadar-acceso=aaa.bbb.ccc');
  if(http403&&route==='entrar')return new Response('PRIVATE_SECRET',{status:403});
  if(route==='entrar')return Response.json({autenticada:true,usuario:{id:env.QA_USER_ID}},{headers:{'Set-Cookie':'__Host-rwadar-acceso=aaa.bbb.ccc; Path=/; HttpOnly; Secure; SameSite=Lax'}});
  if(route==='sesion')return Response.json({autenticada:true,usuario:{id:env.QA_USER_ID}});
  if(route==='salir')return Response.json({cerrado:true,cierreRemoto:true});
  if(oversized)return new Response('x'.repeat(128*1024+1));
  return Response.json({version:3,posiciones:[{nombre:wrong?'OTHER':'QA_APK23_CLOUD_123',moneda:'EUR',valoracion:{precio:'1.100000',origen:'manual'},movimientos:[{tipo:'compra',cantidad:'2',precio:'1',comision:'0'},{tipo:'cobro',importe:'0.10'}]}]});
 };return {fetch,calls};
}
test('fixed routes verify the real document and close only the own local BFF session',async()=>{
 const f=fixture(),result=await run(env,f.fetch);assert.equal(result.status,'passed');assert.ok(Object.values(result.proof).every(v=>v===true));assert.deepEqual(f.calls,['entrar','sesion','cartera','salir']);
});
test('bad fixture and oversized body still log out, without any sensitive error body',async()=>{
 for(const change of [{wrong:true},{oversized:true}]){const f=fixture(change),result=await run(env,f.fetch);assert.equal(result.status,'failed');assert.equal(result.cleanupConfirmed,true);assert.equal(f.calls.at(-1),'salir');assert.ok(!JSON.stringify(result).includes('PRIVATE_SECRET'));}
});
test('HTTP403 is a single attempt with static diagnosis and no credential output',async()=>{
 const f=fixture({http403:true}),result=await run(env,f.fetch);assert.deepEqual(f.calls,['entrar']);assert.deepEqual(result.failure,{route:'entrar',kind:'http',status:403});assert.ok(!JSON.stringify(result).includes('PRIVATE_SECRET'));
});
test('decimal comparison is exact and rejects floats/exponential values',()=>{
 assert.equal(decimal('0.10'),decimal('0.1'));assert.equal(decimal('9999999999999.999999'),9999999999999999999n);
 assert.throws(()=>decimal(1.1));assert.throws(()=>decimal('1e0'));
});

test('preflight probes only own login/session/local-logout and makes no fixture claims',async()=>{
 const f=fixture({wrong:true}),result=await preflight(env,f.fetch);
 assert.equal(result.status,'passed');assert.equal(result.scope,'preflight-auth-only');assert.equal(result.preflight,true);
 assert.deepEqual(f.calls,['entrar','sesion','salir']);assert.equal(result.cleanupConfirmed,true);
 assert.equal(result.proof.samePurchase,undefined);assert.equal(result.proof.sameManualPrice,undefined);
});
