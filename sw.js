/* Our Story service worker: always try the network first so new versions show up right away,
   and fall back to the saved copy only when offline. */
const CACHE='our-story-v1.4.51';
const FILES=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const same=new URL(req.url).origin===location.origin;
  e.respondWith(fetch(req,same?{cache:'no-cache'}:undefined).then(r=>{if(r&&r.ok&&same){const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp))}return r}).catch(()=>caches.match(req).then(h=>h||caches.match('index.html'))))});
