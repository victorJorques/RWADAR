'use strict';
// Dedicated QA only. Default Node22 HTTPS/TLS, no UA spoofing, retries or logs.
const UID='8871c88e-b0af-415b-9346-dcceb182c2ac',MARKER='ba8cb4645588067ff77ef11a',ORIGIN='https://rwadar.pages.dev';
const PROOF_KEYS=['productionBffObserved','sameExpectedAccount','sameUniqueName','sameCurrency','samePurchase','sameManualPrice','sameIncome','webLocalLogoutConfirmed'];
const PAIRS=new Set(['entrar:POST','sesion:GET','cartera:GET','salir:POST']);
function requireValue(value){if(!value)throw Error('qa_check_failed');}
function decimal(value){requireValue(typeof value==='string'&&/^\d{1,13}(?:\.\d{1,6})?$/.test(value));const [whole,fraction='']=value.split('.');return BigInt(whole)*1000000n+BigInt(fraction.padEnd(6,'0'));}
function compareFixture(doc,name){
 requireValue(Number.isInteger(doc?.version)&&doc.version>0&&doc.posiciones?.length===1);
 const p=doc.posiciones[0];requireValue(p.nombre===name&&p.moneda==='EUR');
 requireValue(p.valoracion?.origen==='manual'&&decimal(p.valoracion.precio)===decimal('1.1'));
 const moves=p.movimientos;requireValue(Array.isArray(moves)&&moves.length===2);
 const buys=moves.filter(m=>m.tipo==='compra'),income=moves.filter(m=>m.tipo==='cobro');requireValue(buys.length===1&&income.length===1);
 requireValue(decimal(buys[0].cantidad)===decimal('2')&&decimal(buys[0].precio)===decimal('1')&&decimal(buys[0].comision)===0n&&decimal(income[0].importe)===decimal('0.1'));
}
function ownQa(env){requireValue(env.QA_ACCOUNT_ACK==='CONFIRMED_TEST_ACCOUNT'&&env.QA_USER_ID===UID&&env.QA_ACCOUNT_MARKER===MARKER&&env.RWADAR_QA_EMAIL===`vcicrack+rwadar-qa-${MARKER}@gmail.com`&&typeof env.RWADAR_QA_PASSWORD==='string'&&env.RWADAR_QA_PASSWORD.length>=12);}
function readCookie(headers){
 const cookies=headers.getSetCookie();requireValue(cookies.length===1);
 const match=/^(__Host-rwadar-acceso=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+); Path=\/; HttpOnly; Secure; SameSite=Lax$/.exec(cookies[0]);requireValue(match);return match[1];
}
async function readJson(response){
 requireValue(Number(response.headers.get('content-length')||0)<=128*1024);
 const reader=response.body.getReader();let size=0;const chunks=[];
 try{for(;;){const item=await reader.read();if(item.done)break;size+=item.value.byteLength;if(size>128*1024){await reader.cancel();throw Error('qa_check_failed');}chunks.push(Buffer.from(item.value));}}finally{reader.releaseLock();}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
async function run(env=process.env,fetchImpl=fetch,{preflight=false}={}){
 let cookie='',ownVerified=false,lastRoute='entrar',failure=null,cleanupConfirmed=false;
 async function request(route,method='GET',data){
  requireValue(PAIRS.has(route+':'+method));lastRoute=route;
  let response;
  try{response=await fetchImpl(ORIGIN+'/api/acceso/'+route,{method,redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(10000),
    headers:{Origin:ORIGIN,'Content-Type':'application/json','X-RWAdar-Usuario':UID,...(cookie?{Cookie:cookie}:{})},...(data===undefined?{}:{body:JSON.stringify(data)})});}
  catch{if(!failure)failure={route,kind:'connection'};throw Error('qa_check_failed');}
  if(response.status!==200){if(!failure)failure={route,kind:'http',status:response.status};try{await response.body?.cancel();}catch{}throw Error('qa_check_failed');}
  if(route==='entrar')cookie=readCookie(response.headers);
  return readJson(response);
 }
 try{
  ownQa(env);const id=env.GITHUB_RUN_ID||'LOCAL_TEST';requireValue(/^(?:\d{1,20}|LOCAL_TEST)$/.test(id));
  const login=await request('entrar','POST',{correo:env.RWADAR_QA_EMAIL,clave:env.RWADAR_QA_PASSWORD});
  requireValue(login?.autenticada===true&&login.usuario?.id===UID);ownVerified=true;
  const session=await request('sesion');requireValue(session?.autenticada===true&&session.usuario?.id===UID);
  if(!preflight)compareFixture(await request('cartera'),'QA_APK23_CLOUD_'+id);
 }catch{if(!failure)failure={route:lastRoute,kind:'validation'};}
 finally{
  if(cookie&&ownVerified){try{const closed=await request('salir','POST',{});cleanupConfirmed=closed?.cerrado===true&&closed.cierreRemoto===true;if(!cleanupConfirmed&&!failure)failure={route:'salir',kind:'validation'};}catch{if(!failure)failure={route:'salir',kind:'connection'};}}
  cookie='';
 }
 if(failure||!cleanupConfirmed)return {status:'failed',failure:failure||{route:lastRoute,kind:'validation'},cleanupConfirmed};
 if(preflight)return {status:'passed',scope:'preflight-auth-only',preflight:true,proof:{productionBffObserved:true,sameExpectedAccount:true,webLocalLogoutConfirmed:true},cleanupConfirmed:true};
 return {status:'passed',proof:Object.fromEntries(PROOF_KEYS.map(key=>[key,true])),cleanupConfirmed:true};
}
const preflight=(env=process.env,fetchImpl=fetch)=>run(env,fetchImpl,{preflight:true});
module.exports={run,preflight,compareFixture,decimal,readCookie,PROOF_KEYS};
if(require.main===module){
 if(Number(process.versions.node.split('.')[0])!==22||!(process.argv.length===2||(process.argv.length===3&&process.argv[2]==='--preflight'))){console.log('{"status":"failed","failure":{"route":"entrar","kind":"validation"},"cleanupConfirmed":false}');process.exitCode=1;}
 else run(process.env,fetch,{preflight:process.argv[2]==='--preflight'}).then(result=>{console.log(JSON.stringify(result));if(result.status!=='passed')process.exitCode=1;}).catch(()=>{console.log('{"status":"failed","failure":{"route":"entrar","kind":"validation"},"cleanupConfirmed":false}');process.exitCode=1;});
}
