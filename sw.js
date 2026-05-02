const CACHE = 'inventario-fp-v1';
const SHELL = [
  './index.html',
  './css/styles.css',
  './js/config.js',
  './js/state.js',
  './js/api.js',
  './js/auth.js',
  './js/nav.js',
  './js/search.js',
  './js/home.js',
  './js/inventory.js',
  './js/modal-item.js',
  './js/modal-aulas.js',
  './js/modal-cats.js',
  './js/prestamos.js',
  './js/import.js',
  './js/docs.js',
  './js/docs-dpto.js',
  './favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, {cache:'reload'}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Las peticiones al API de Google Apps Script siempre van a la red
  if(url.includes('script.google.com') || url.includes('fonts.gstatic.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request)
        .then(res => {
          if(res && res.status === 200 && res.type !== 'opaque'){
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => {
          if(e.request.destination === 'document') return caches.match('./index.html');
        });
    })
  );
});
