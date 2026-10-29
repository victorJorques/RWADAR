'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {cpuFramesOnly,cpuDiagnosticOnly}=require('./web-chrome-141.cjs');
const origin=process.env.RWADAR_QA_WEB_ORIGIN||'https://rwadar.pages.dev';
const frame=(id,name,hits,url=origin+'/assets/rwadar-20260820.123456abcdef.js',line=0)=>
  ({id,hitCount:hits,callFrame:{functionName:name,url,lineNumber:line}});

test('CPU report keeps at most six local asset function/line/hit counts and no profile data',()=>{
  const nodes=Array.from({length:10},(_,i)=>frame(i+1,'localFunction'+i,i+1));
  const out=cpuFramesOnly({nodes,samples:[]});
  assert.equal(out.length,6);assert.deepEqual(out.map(x=>x.hits),[10,9,8,7,6,5]);
  for(const row of out){assert.deepEqual(Object.keys(row),['function','line','hits']);assert.equal(row.line,1);}
  assert(!JSON.stringify(out).includes('/assets/'));assert(!JSON.stringify(out).includes('callFrame'));
});

test('CPU report excludes untrusted names, origins, query/hash URLs and known secret identifiers',()=>{
  const secret='LOCAL_SECRET_123';
  const nodes=[frame(1,'validLocal',2),frame(2,'fetch("NEVER_PRINT")',999),
    frame(3,'secretQuery',999,origin+'/assets/x.js?token=NEVER_PRINT'),
    frame(4,'secretHash',999,origin+'/assets/x.js#NEVER_PRINT'),
    frame(5,'external',999,'https://external.invalid/assets/x.js'),
    frame(6,'authRoute',999,origin+'/api/acceso/sesion'),
    frame(7,secret,999),frame(8,'secretAsset',999,origin+'/assets/'+secret+'.js'),
    frame(9,'invalidPosition',999,origin+'/assets/x.js',-1)];
  assert.deepEqual(cpuFramesOnly({nodes},[secret]),[{function:'validLocal',line:1,hits:2}]);
  assert.deepEqual(cpuFramesOnly({nodes:'NEVER_PRINT'}),[]);
  const sampled=frame(10,'',undefined);assert.deepEqual(cpuFramesOnly({nodes:[sampled],samples:[10,10]}),[{function:'anonymous',line:1,hits:2}]);
});

test('Profiler diagnostic failure keeps the run failed and issues no execution interruption or data call',async()=>{
  const calls=[],report={status:'failed',failureCode:'browser_observation_timeout'};
  await cpuDiagnosticOnly({async call(method){calls.push(method);throw Error('NEVER_PRINT');}},report,['LOCAL_SECRET_123']);
  assert.deepEqual(calls,['Profiler.stop']);assert.equal(report.status,'failed');
  assert.equal(report.failureCode,'browser_observation_timeout');assert.equal(report.cpuProfileAvailable,false);
  assert.deepEqual(report.cpuHotFrames,[]);assert(!JSON.stringify(report).includes('NEVER_PRINT'));
});
