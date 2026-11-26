import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');
function worker({failPath}={}){
 const handlers={},storage=new Map(),requests=[];
 const caches={
  async open(name){
   if(!storage.has(name))storage.set(name,new Map());
   const entries=storage.get(name);
   return {async match(key){return entries.get(key)?.clone()},async put(key,value){entries.set(key,value.clone())}};
  },
  async keys(){return [...storage.keys()]},async delete(name){return storage.delete(name)},
 };
 const self={location:{origin:'https://shalom.test'},clients:{async claim(){}},skipWaiting(){self.skipped=true},addEventListener(name,callback){handlers[name]=callback}};
 vm.runInNewContext(source,{self,caches,URL,Response,Set,Error,
  importScripts(){self.SHALOM_BUILD={version:'test',precache:['/','/?view=bible','/?view=saved','/?view=devocional','/offline.html','/_next/static/app.js','/manifest.webmanifest']};},
  async fetch(path,options){requests.push({path,options});if(path===failPath)throw Error('Network unavailable');return new Response('public shell')},
 });
 return {handlers,storage,caches,requests,self};
}
test('private APIs, mutations, RSC and other origins always bypass the worker',()=>{
 const {handlers}=worker();
 const paths=['/api/session','/api/study','/api/profile','/api/auth/login','/api/accounts','/api/attendance','/api/devotions/transcribe','/api/devotions/private-id/audio'];
 for(const path of paths)handlers.fetch({request:new Request('https://shalom.test'+path),respondWith(){assert.fail(path+' must not be intercepted')}});
 for(const method of ['POST','PUT','PATCH','DELETE','HEAD'])handlers.fetch({request:new Request('https://shalom.test/bible/PSA.json',{method}),respondWith(){assert.fail(method+' must be network-only')}});
 for(const headers of [{RSC:'1'},{'Next-Router-Prefetch':'1'}])handlers.fetch({request:new Request('https://shalom.test/',{headers}),respondWith(){assert.fail('RSC must be network-only')}});
 handlers.fetch({request:new Request('https://example.com/bible/PSA.json'),respondWith(){assert.fail('External origin must be network-only')}});
 handlers.fetch({request:new Request('https://shalom.test/perfil'),respondWith(){assert.fail('Private resources must not enter runtime cache')}});
 handlers.fetch({request:new Request('https://shalom.test/manifest.webmanifest'),respondWith(){assert.fail('Installation branding must bypass even a legacy manifest cache entry')}});
});
test('installation precaches only anonymous public resources and waits for update consent',async()=>{
 const {handlers,requests,self}=worker();let installed;
 handlers.install({waitUntil(value){installed=value}});await installed;
 assert.ok(requests.length>0);assert.ok(requests.every(({options})=>options.credentials==='omit'));
 assert.ok(requests.every(({path})=>!path.startsWith('/api/')&&path!=='/perfil'));
 assert.equal(self.skipped,undefined);
 handlers.message({data:{type:'APPLY_UPDATE'}});assert.equal(self.skipped,true);
});
test('activation removes obsolete shells and preserves user downloads',async()=>{
 const {handlers,storage,caches}=worker();
 for(const name of ['shalom-shell-old','shalom-shell-test','shalom-bible-rv1909-v1','unrelated-cache'])await caches.open(name);
 let activated;handlers.activate({waitUntil(value){activated=value}});await activated;
 assert.equal(storage.has('shalom-shell-old'),false);
 for(const name of ['shalom-shell-test','shalom-bible-rv1909-v1','unrelated-cache'])assert.equal(storage.has(name),true);
});

test('redownload reports real progress and preserves existing downloads and study caches',async()=>{
 const {handlers,caches,storage,requests}=worker();
 await caches.open('shalom-bible-rv1909-v1');await caches.open('shalom-study-other');
 const messages=[];let work;
 handlers.message({data:{type:'REFRESH_SHELL'},ports:[{postMessage(message){messages.push(message)},close(){}}],waitUntil(value){work=value}});await work;
 assert.equal(messages.at(-1).type,'COMPLETE');
 assert.equal(messages.at(-2).done,messages.at(-2).total);
 assert.ok(requests.every(({options})=>options.credentials==='omit'&&options.cache==='reload'));
 assert.ok(storage.has('shalom-bible-rv1909-v1')&&storage.has('shalom-study-other'));
 assert.equal(storage.has('shalom-shell-test-staging'),false);
 assert.ok((await (await caches.open('shalom-shell-test')).match('/')).ok);
});

test('failed redownload retains the working shell and never activates an update',async()=>{
 const {handlers,caches,storage,self}=worker({failPath:'/offline.html'});
 const current=await caches.open('shalom-shell-test');await current.put('/',new Response('previous shell'));
 const messages=[];let work;
 handlers.message({data:{type:'REFRESH_SHELL'},ports:[{postMessage(message){messages.push(message)},close(){}}],waitUntil(value){work=value}});await work;
 assert.equal(messages.at(-1).type,'ERROR');
 assert.equal(await (await current.match('/')).text(),'previous shell');
 assert.equal(storage.has('shalom-shell-test-staging'),false);
 assert.equal(self.skipped,undefined);
});
