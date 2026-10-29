const test=require('node:test'),assert=require('node:assert/strict');
const {waitChromePort}=require('./web-chrome-141.cjs');
function clock(){let time=0;return {now:()=>time,sleep:async ms=>{time+=ms;},value:()=>time};}
test('Chrome DevTools may become ready after the former 10 second limit',async()=>{
  const c=clock(),report={};const port=await waitChromePort('/tmp/local-mock',{exitCode:null,signalCode:null},report,{...c,readFile:async()=>{if(c.now()<12000)throw Error('not-yet');return '9222\n/devtools/browser/mock\n';}});
  assert.equal(port,9222);assert.equal(c.value(),12000);assert.equal(report.chromeStartup,undefined);
});
test('startup deadline is exactly 30 seconds without a real sleep',async()=>{
  const c=clock(),report={};await assert.rejects(waitChromePort('/tmp/local-mock',{exitCode:null,signalCode:null},report,{...c,readFile:async()=>{throw Error('not-yet');}}),/chrome_start_failed/);
  assert.equal(c.value(),30000);assert.deepEqual(report.chromeStartup,{exitCode:null,signal:null});
});
test('early exit or signal is detected before reading the port and exposes no stderr',async()=>{
  for(const child of [{exitCode:42,signalCode:null},{exitCode:null,signalCode:'SIGABRT'}]){
    const report={};await assert.rejects(waitChromePort('/tmp/local-mock',child,report,{...clock(),readFile:async()=>{throw Error('Must never be read');}}),/chrome_exited_before_cdp/);
    assert.deepEqual(report.chromeStartup,{exitCode:child.exitCode,signal:child.signalCode});
  }
});
