const CACHE_NAME = 'todo-cache-v1';
const urlsToCache = [
  "/",
  "/index.html",
  "/styles.css",
  "/main.js",
  "/icons/icon192x192.png",
  "/icons/icon512x512.png",
];

// Instalar y cachear
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activar y limpiar caches viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar peticiones y responder desde cache o red
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si está en cache, lo devuelve
      if (response) {
        return response;
      }
      // Si no, lo pide a la red y lo guarda
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    }).catch(() => {
      // Opcional: devolver un fallback si falla todo
      return caches.match('/index.html');
    })
  );
});
