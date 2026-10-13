const SHELL_CACHE='aeds-v9-0-1-shell';
const CONTENT_CACHE='aeds-v9-0-1-content';
const SHELL=['./','./index.html','./styles.css','./app.js','./content-core.js','./content-loader.js','./engine.js','./analytics.js','./cloud-config.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(SHELL_CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>!['aeds-v9-0-1-shell','aeds-v9-0-1-content'].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.pathname.includes('/data/questions/')){
    e.respondWith(caches.open(CONTENT_CACHE).then(async c=>{const hit=await c.match(e.request);if(hit)return hit;try{const r=await fetch(e.request);if(r.ok)c.put(e.request,r.clone());return r}catch(err){return new Response('',{status:503,statusText:'Pacote offline não baixado'})}}));return;
  }
  e.respondWith(fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(SHELL_CACHE).then(c=>c.put(e.request,copy));return resp}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});
