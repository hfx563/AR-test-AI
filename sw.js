// ArLux Service Worker - Offline Support & Caching
const CACHE_NAME = 'arlux-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/js/chat.js',
  '/js/news.js',
  '/src/core/errorHandler.production.js',
  '/src/core/loadingManager.production.js',
  '/src/services/apiService.production.js',
  '/src/utils/validator.production.js',
  '/src/styles/production.components.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        return caches.match('/index.html');
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});
