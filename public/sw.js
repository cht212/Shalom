/* Only explicitly allowlisted public resources may enter Cache Storage. */
importScripts('/pwa-build.js');
const SHELL='shalom-shell-'+self.SHALOM_BUILD.version;
const BIBLE='shalom-bible-rv1909-v1';
const PUBLIC_PATHS=new Set(self.SHALOM_BUILD.precache.filter(path=>path!=='/'&&!path.startsWith('/?')));
const SHELL_URLS=['/','/?view=bible','/?view=saved','/?view=devocional'];
let repairing=false;

async function refreshShell(port){
 if(repairing){port.postMessage({type:'ERROR'});return}
 repairing=true;
 const staging=SHELL+'-staging';
 try{
  const cache=await caches.open(staging),paths=self.SHALOM_BUILD.precache;
  let done=0;
  for(let i=0;i<paths.length;i+=8){
   await Promise.all(paths.slice(i,i+8).map(async path=>{
    const response=await fetch(path,{credentials:'omit',cache:'reload'});
    if(!response.ok||response.redirected)throw Error('Public file unavailable');
    await cache.put(path,response);done++;
   }));
   port.postMessage({type:'PROGRESS',done,total:paths.length});
  }
  // Preserve the working shell until every replacement has downloaded successfully.
  const current=await caches.open(SHELL);
  for(const path of paths)await current.put(path,await cache.match(path));
  port.postMessage({type:'COMPLETE'});
 }catch{port.postMessage({type:'ERROR'})}
 finally{await caches.delete(staging);repairing=false;port.close()}
}

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(SHELL);
  // Fetch without session cookies; never cache a personalized page response.
  for(let i=0;i<self.SHALOM_BUILD.precache.length;i+=8){
   await Promise.all(self.SHALOM_BUILD.precache.slice(i,i+8).map(async path=>{
    const response=await fetch(path,{credentials:'omit',cache:path.startsWith('/_next/static/')?'force-cache':'reload'});
    if(!response.ok||response.redirected)throw Error('Public shell unavailable: '+path);
    await cache.put(path,response);
   }));
  }
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  // User downloads and study data have separate lifetimes from application code.
  for(const name of await caches.keys())if(name.startsWith('shalom-shell-')&&name!==SHELL)await caches.delete(name);
  await self.clients.claim();
 })());
});
self.addEventListener('message',event=>{
 if(event.data?.type==='APPLY_UPDATE')self.skipWaiting();
 if(event.data?.type==='REFRESH_SHELL'&&event.ports?.[0])event.waitUntil(refreshShell(event.ports[0]));
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname==='/manifest.webmanifest'||request.headers.has('RSC')||request.headers.has('Next-Router-Prefetch'))return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{
   try{return await fetch(request)}catch{
    const cache=await caches.open(SHELL);
    if(url.pathname==='/'){
     const view=url.searchParams.get('view');
     const key=SHELL_URLS.includes('/?view='+view)?'/?view='+view:'/';
     return await cache.match(key)||Response.error();
    }
    return await cache.match('/offline.html')||Response.error();
   }
  })());
  return;
 }
 if(/^\/bible\/(?:[A-Z0-9]{3}|books)\.json$/.test(url.pathname)&&!url.search){
  event.respondWith((async()=>{
   const cache=await caches.open(BIBLE),cached=await cache.match(url.pathname);
   if(cached)return cached;
   const response=await fetch(request);
   if(response.ok&&response.headers.get('content-type')?.includes('json')){
    await cache.put(url.pathname,response.clone());
   }
   return response;
  })());
  return;
 }
 const publicKey=url.pathname+url.search;
 if(PUBLIC_PATHS.has(publicKey)){
  event.respondWith((async()=>{
   const cache=await caches.open(SHELL);
   return await cache.match(publicKey)||fetch(request);
  })());
 }
});
