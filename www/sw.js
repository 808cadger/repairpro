// sw.js — AutoRepairIQ Pro Service Worker
// Aloha from Pearl City! 🌺

const CACHE_NAME = 'ariq-v6';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './share.js',
  './api-client.js',
  './avatar-widget.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Network-first for API calls, cache-first for assets
  if (event.request.url.includes('api.anthropic.com') || event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetching = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetching;
    })
  );
});
