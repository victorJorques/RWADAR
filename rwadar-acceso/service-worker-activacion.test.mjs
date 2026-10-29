import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../rwadar-site/sw.js',import.meta.url),'utf8');
function worker(){
 const handlers=new Map(),events=[];let matches=0,navigations=0;
 const pendingNavigation=new Promise(()=>{});
 const client={url:'https://rwadar.pages.dev/',navigate(){navigations++;return pendingNavigation;}};
 const context=vm.createContext({self:{
   addEventListener:(kind,fn)=>handlers.set(kind,fn),
   skipWaiting:async()=>{events.push('skipWaiting');},
   clients:{claim:async()=>{events.push('claim');},matchAll:async()=>{matches++;return [client];}}},
   caches:{keys:async()=>['rwadar-vold','another-app-cache','rwadar-vacceso-obligatorio-20261023'],delete:async name=>{events.push('delete:'+name);return true;}}});
 vm.runInContext(source,context);
 function dispatch(kind){let work;handlers.get(kind)({waitUntil:promise=>{work=promise;}});assert.ok(work&&typeof work.then==='function');return work;}
 return {handlers,events,dispatch,matches:()=>matches,navigations:()=>navigations};
}
test('activate removes only own cache prefix, claims clients and resolves despite a pending client navigation',{timeout:1000},async()=>{
 const w=worker();await w.dispatch('activate');
 assert.deepEqual(w.events,['delete:rwadar-vold','delete:rwadar-vacceso-obligatorio-20261023','claim']);
 assert.equal(w.matches(),0);assert.equal(w.navigations(),0);
 assert.equal(w.events.some(event=>event.includes('another-app-cache')),false);
});
test('installation still skips waiting and never registers a fetch cache handler',async()=>{
 const w=worker();await w.dispatch('install');assert.deepEqual(w.events,['skipWaiting']);
 assert.deepEqual([...w.handlers.keys()],['install','activate']);assert.equal(w.handlers.has('fetch'),false);
});
