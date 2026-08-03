const CACHE_NAME = 'ersenbox-v2';
const STATIC_ASSETS = ['./', './index.html'];

// Install
self.addEventListener('install', (e) => {
  console.log('[SW] Install');
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (e) => {
  console.log('[SW] Activate');
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', (e) => {
  // AlQuran Cloud sayfalarını cache'le
  if (e.request.url.includes('alquran.cloud/mushaf')) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) {
          console.log('[SW] Cache hit:', e.request.url);
          return cached;
        }
        
        return fetch(e.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
          
          return response;
        }).catch(() => {
          console.log('[SW] Fetch failed, returning offline page');
          return caches.match('./index.html');
        });
      })
    );
    return;
  }
  
  // API istekleri
  if (e.request.url.includes('api.alquran.cloud')) {
    e.respondWith(
      fetch(e.request).then((response) => {
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        return caches.match(e.request);
      })
    );
    return;
  }
  
  // Diğer istekler
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request);
    })
  );
});