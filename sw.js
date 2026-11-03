/* RECONÉCTATE: solo se guardan archivos públicos de la app; no se cachean registros personales. */
const CACHE = 'reconectate-shell-10-0-v1';
const PRE_CACHE = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRE_CACHE)));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for (const name of await caches.keys()) {
      if (name.startsWith('reconectate-shell-') && name!==CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;  // Nunca interceptar YouTube ni servicios ajenos.
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request);
        if(response.ok && response.type==='basic') {
          const cache=await caches.open(CACHE);
          await cache.put('./index.html',response.clone());
        }
        return response;
      }catch(err){
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }
  if(PRE_CACHE.some(path=>new URL(path,self.registration.scope).href===url.href)){
    event.respondWith(caches.match(request).then(hit=>hit||fetch(request)));
  }
});
