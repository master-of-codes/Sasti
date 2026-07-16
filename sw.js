const CACHE_NAME = 'Shastika-puzzle-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './celebration.js',
  ...Array.from({length: 200}, (_, i) => `./assets/images/stage_${i+1}.jpeg`)
];

// Install event - cache assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - cache-first for static assets, network-first for pages
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request).then((resp) => {
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, respClone));
        return resp;
      }).catch(() => caches.match(e.request) || caches.match('./index.html'))
    );
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then((resp) => resp || fetch(e.request).then((netResp) => {
      if (netResp.ok) {
        const clone = netResp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
      }
      return netResp;
    }))
  );
});
