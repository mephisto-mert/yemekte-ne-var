// ==============================================================================
// COOKLY — SERVICE WORKER FOR PROGRESSIVE WEB APP (PWA)
// Cache Strategy: Cache-First for static assets, Network-First for API calls
// ==============================================================================

const CACHE_NAME = 'cookly-static-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and cross-origin external API calls
  if (event.request.method !== 'GET') return;
  if (url.protocol.startsWith('chrome-extension')) return;

  // For Supabase, YouTube, or analytics requests: network only or network-first
  if (
    url.hostname.includes('supabase') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('googleapis.com') ||
    url.pathname.startsWith('/api')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Cache-First with Network Fallback for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Offline fallback to root
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
