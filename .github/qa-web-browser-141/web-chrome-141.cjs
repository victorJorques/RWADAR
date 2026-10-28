'use strict';
// Ubuntu CI only. No dependencies, manual Cookie headers, screenshots or secrets in output.
const fs=require('node:fs'),fsp=fs.promises,path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const ORIGIN=process.env.RWADAR_QA_WEB_ORIGIN||'https://rwadar.pages.dev',UID='8871c88e-b0af-415b-9346-dcceb182c2ac',MARKER='ba8cb4645588067ff77ef11a';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function requireQa(env){
  if(!['https://rwadar.pages.dev','https://revision.rwadar.pages.dev'].includes(ORIGIN))throw Error('qa_identity_rejected');
  if(env.QA_ACCOUNT_ACK!=='CONFIRMED_TEST_ACCOUNT'||env.QA_USER_ID!==UID||env.QA_ACCOUNT_MARKER!==MARKER||
     env.RWADAR_QA_EMAIL!==`vcicrack+rwadar-qa-${MARKER}@gmail.com`||typeof env.RWADAR_QA_PASSWORD!=='string'||env.RWADAR_QA_PASSWORD.length<12)throw Error('qa_identity_rejected');
}
function statusOnly(event){
  if(event.method!=='Network.responseReceived')return null;
  try {const u=new URL(event.params.response.url),status=event.params.response.status;
    return u.origin===ORIGIN&&['/api/acceso/entrar','/api/acceso/sesion','/api/acceso/salir','/api/acceso/datos'].includes(u.pathname)&&Number.isInteger(status)?{route:u.pathname.split('/').at(-1),status}:null;
  }catch{return null;}
}
function runtimeExceptionOnly(event,secrets=[]){
  if(event?.method!=='Runtime.exceptionThrown')return null;
  const raw=event.params?.exceptionDetails?.exception?.description;
  if(typeof raw!=='string')return null;
  const line=raw.split('\n',1)[0].slice(0,512);
  let match=/^ReferenceError: ([A-Za-z_$][A-Za-z0-9_$]{0,63}) is not defined$/.exec(line);
  if(match){const identifier=secrets.some(s=>s&&match[1].includes(s))?'redacted':match[1];return {type:'ReferenceError',identifier};}
  match=/^ReferenceError: Cannot access '([A-Za-z_$][A-Za-z0-9_$]{0,63})' before initialization$/.exec(line);
  if(match){const identifier=secrets.some(s=>s&&match[1].includes(s))?'redacted':match[1];return {type:'ReferenceError',identifier,beforeInitialization:true};}
  match=/^TypeError: Cannot read properties of (null|undefined) \(reading '([A-Za-z_$][A-Za-z0-9_$]{0,63})'\)$/.exec(line);
  if(match){const property=secrets.some(s=>s&&match[2].includes(s))?'redacted':match[2];return {type:'TypeError',receiver:match[1],property};}
  return null;
}
function domState(document,window,expectedId){
  const state={bridgeMatchesQA:false,buttonPresent:false,buttonEnabled:false,panelShow:false,pfInversionesexists:false,headingtextpresent:false};
  try{state.bridgeMatchesQA=window.RWADAR_ACCESO?.usuario()?.id===expectedId;}catch{}
  try{const button=document.getElementById('btnCuenta');state.buttonPresent=!!button;state.buttonEnabled=!!button&&!button.disabled;}catch{}
  try{state.panelShow=!!document.getElementById('perfilPanel')?.classList.contains('show');}catch{}
  try{state.pfInversionesexists=!!document.getElementById('pfInversiones');}catch{}
  try{state.headingtextpresent=!!document.getElementById('perfilCuerpo')?.textContent.includes('Mis inversiones');}catch{}
  return state;
}
async function waitChromePort(profile,chrome,report,{readFile=fsp.readFile.bind(fsp),now=Date.now,sleep=pause,spawnFailed=()=>false}={}){
  const deadline=now()+30000;
  const diagnosis=()=>({exitCode:Number.isInteger(chrome.exitCode)?chrome.exitCode:null,signal:typeof chrome.signalCode==='string'&&/^SIG[A-Z0-9]{1,16}$/.test(chrome.signalCode)?chrome.signalCode:null});
  while(now()<deadline){
    if(spawnFailed()||chrome.exitCode!=null||chrome.signalCode!=null){report.chromeStartup=diagnosis();throw Error('chrome_exited_before_cdp');}
    try{const port=Number((await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);if(Number.isInteger(port)&&port>0&&port<65536)return port;}catch{}
    await sleep(Math.min(250,Math.max(0,deadline-now())));
  }
  report.chromeStartup=diagnosis();throw Error('chrome_start_failed');
}
function mainAccountReady(document,window,expectedId){
  const button=document.getElementById('btnCuenta');
  return window.RWADAR_ACCESO?.usuario()?.id===expectedId&&!!button&&button.disabled===false&&button.getAttribute('aria-label')==='Mis inversiones y mi cuenta';
}
class CDP{
  constructor(socket,onEvent=()=>{}){
    this.socket=socket;this.id=0;this.pending=new Map();
    socket.addEventListener('message',event=>{
      let message;try{message=JSON.parse(String(event.data));}catch{return;}
      if(!message.id){onEvent(message);return;}const pending=this.pending.get(message.id);if(!pending)return;
      this.pending.delete(message.id);clearTimeout(pending.timer);message.error?pending.reject(Error('cdp_command_failed')):pending.resolve(message.result);
    });
    const stop=()=>{for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('cdp_disconnected'));}this.pending.clear();};
    socket.addEventListener('close',stop);socket.addEventListener('error',stop);
  }
  call(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id,timer=setTimeout(()=>{this.pending.delete(id);reject(Error('cdp_timeout'));},8000);
    this.pending.set(id,{resolve,reject,timer});try{this.socket.send(JSON.stringify({id,method,params}));}catch{clearTimeout(timer);this.pending.delete(id);reject(Error('cdp_send_failed'));}});}
  async evaluate(expression){const result=await this.call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error('page_evaluation_failed');return result.result?.value;}
}
async function run(env=process.env){
  const report={status:'failed',origin:ORIGIN,realChrome:false,credentialsRecorded:false,manualCookieHeaders:false,httpStatuses:[],runtimeErrors:[],checks:{},logoutLocal:false};
  let chrome,socket,cdp,profile;const deadline=Date.now()+120000;
  const phase=name=>{report.phase=name;};
  try{
    phase('validate-qa-and-runtime');requireQa(env);if(process.platform!=='linux'||Number(process.versions.node.split('.')[0])!==22)throw Error('linux_node22_required');
    profile=await fsp.mkdtemp(path.join(os.tmpdir(),'rwadar-chrome-qa-'));
    phase('start-chrome');chrome=cp.spawn('/usr/bin/google-chrome',['--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-sync','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','about:blank'],{stdio:'ignore'});
    let spawnFailed=false;chrome.on('error',()=>{spawnFailed=true;});
    phase('wait-chrome-devtools-port');const port=await waitChromePort(profile,chrome,report,{spawnFailed:()=>spawnFailed});
    phase('connect-loopback-cdp');
    const list=await fetch(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(4000)}).then(r=>r.json());
    const endpoint=list.find(t=>t.type==='page'&&t.url==='about:blank')?.webSocketDebuggerUrl;
    if(typeof endpoint!=='string'||!endpoint.startsWith(`ws://127.0.0.1:${port}/devtools/page/`))throw Error('loopback_cdp_required');
    socket=new WebSocket(endpoint);await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('cdp_open_timeout')),4000);socket.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});socket.addEventListener('error',()=>{clearTimeout(timer);reject(Error('cdp_open_failed'));},{once:true});});
    cdp=new CDP(socket,event=>{const result=statusOnly(event);if(result&&report.httpStatuses.length<128)report.httpStatuses.push(result);const error=runtimeExceptionOnly(event,[env.RWADAR_QA_EMAIL,env.RWADAR_QA_PASSWORD]);if(error&&report.runtimeErrors.length<16)report.runtimeErrors.push(error);});
    await cdp.call('Page.enable');await cdp.call('Runtime.enable');await cdp.call('Network.enable');report.realChrome=true;
    async function wait(expression,limit=30000){const end=Math.min(deadline,Date.now()+limit);while(Date.now()<end){try{if(await cdp.evaluate(expression))return;}catch{}await pause(200);}throw Error('browser_observation_timeout');}
    const sessionExpression=`(async()=>{if(location.origin!==${JSON.stringify(ORIGIN)})return {status:0,same:false};const r=await fetch('/api/acceso/sesion',{credentials:'same-origin',cache:'no-store',redirect:'error'});let j={};try{j=await r.json();}catch{}return {status:r.status,same:j.autenticada===true&&j.usuario?.id===${JSON.stringify(UID)}};})()`;
    phase('open-access-form');await cdp.call('Page.navigate',{url:ORIGIN+'/acceso?volver=%2F'});
    phase('wait-access-form');await wait(`location.origin===${JSON.stringify(ORIGIN)}&&document.readyState==='complete'&&!!document.getElementById('formulario')&&!!document.getElementById('correo')`);
    phase('submit-login-form');let credentials={email:env.RWADAR_QA_EMAIL,password:env.RWADAR_QA_PASSWORD};
    await cdp.evaluate(`(()=>{const d=${JSON.stringify(credentials)};const e=document.getElementById('correo'),p=document.getElementById('clave');e.value=d.email;p.value=d.password;e.dispatchEvent(new Event('input',{bubbles:true}));p.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('formulario').requestSubmit();return true;})()`);credentials=null;
    phase('wait-home-return');await wait(`location.origin===${JSON.stringify(ORIGIN)}&&location.pathname==='/'`);
    report.checks.formReturnedHome=true;
    phase('verify-browser-cookie-session');let session=await cdp.evaluate(sessionExpression);report.checks.browserCookieSession=session.status===200&&session.same;if(!report.checks.browserCookieSession)throw Error('browser_cookie_session_failed');
    phase('wait-main-account-ready');await wait('('+mainAccountReady.toString()+')(document,window,'+JSON.stringify(UID)+')');
    phase('click-open-investments');await cdp.evaluate(`document.getElementById('btnCuenta').click();true`);
    phase('wait-investments-panel');await wait(`document.getElementById('perfilPanel')?.classList.contains('show')&&document.getElementById('perfilCuerpo')?.textContent.includes('Mis inversiones')`);
    report.checks.investmentsPanelOpened=true;
    phase('reload-home');const beforeReload=await cdp.evaluate('performance.timeOrigin');await cdp.call('Page.reload',{ignoreCache:true});
    phase('wait-reloaded-account');await wait(`performance.timeOrigin!==${JSON.stringify(beforeReload)}&&window.RWADAR_ACCESO?.usuario()?.id===${JSON.stringify(UID)}`);
    phase('verify-reloaded-cookie-session');session=await cdp.evaluate(sessionExpression);report.checks.reloadRetainsAccount=session.status===200&&session.same;
    report.checks.loginHttp200=report.httpStatuses.some(s=>s.route==='entrar'&&s.status===200);
    if(Object.values(report.checks).some(value=>value!==true))throw Error('browser_check_failed');
    phase('completed');report.status='passed';
  }catch(error){report.failedPhase=report.phase;report.failureCode=['qa_identity_rejected','linux_node22_required','chrome_start_failed','chrome_exited_before_cdp','loopback_cdp_required','cdp_open_timeout','cdp_open_failed','cdp_timeout','cdp_disconnected','cdp_command_failed','cdp_send_failed','page_evaluation_failed','browser_observation_timeout','browser_cookie_session_failed','browser_check_failed'].includes(error.message)?error.message:'browser_check_failed';if(cdp){try{report.domDiagnostics=await cdp.evaluate('('+domState.toString()+')(document,window,'+JSON.stringify(UID)+')');report.domDiagnosticsAvailable=true;}catch{report.domDiagnosticsAvailable=false;}}}
  finally{
    if(cdp){try{const result=await cdp.evaluate(`(async()=>{if(location.origin!==${JSON.stringify(ORIGIN)})return {ok:false};document.querySelectorAll('input[type=password]').forEach(p=>p.value='');const r=await fetch('/api/acceso/salir',{method:'POST',credentials:'same-origin',cache:'no-store',redirect:'error',headers:{'Content-Type':'application/json'},body:'{}'});const j=await r.json();return {ok:r.status===200&&j.cerrado===true&&j.cierreRemoto===true};})()`);report.logoutLocal=result?.ok===true;}catch{}}
    if(socket)try{socket.close();}catch{}
    if(chrome&&chrome.exitCode===null){chrome.kill('SIGTERM');await Promise.race([new Promise(resolve=>chrome.once('exit',resolve)),pause(2000)]);if(chrome.exitCode===null){chrome.kill('SIGKILL');await pause(250);}}
    if(profile){const parent=await fsp.realpath(os.tmpdir()),resolved=await fsp.realpath(profile);if(path.dirname(resolved)!==parent||!path.basename(resolved).startsWith('rwadar-chrome-qa-'))throw Error('temporary_profile_cleanup_rejected');await fsp.rm(resolved,{recursive:true,force:true});}
    if(report.status==='passed'&&!report.logoutLocal){report.status='failed';report.failureCode='local_logout_not_confirmed';}
  }
  return report;
}
module.exports={CDP,statusOnly,requireQa,runtimeExceptionOnly,domState,waitChromePort,mainAccountReady,run};
if(require.main===module)run().then(report=>{fs.mkdirSync('evidence-private',{recursive:true});fs.writeFileSync('evidence-private/web-chrome-141-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(report.status!=='passed')process.exitCode=1;}).catch(()=>{console.log('{"status":"failed","failureCode":"safe_cleanup_failed"}');process.exitCode=1;});
