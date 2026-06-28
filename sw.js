const CACHE_NAME = 'huda-cache-v6';
const DATA_CACHE_NAME = 'huda-data-cache-v6';

// App shell files that should be pre-cached
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/css/design-system.css',
  '/css/components.css',
  '/css/pages.css',
  '/js/app.js',
  '/js/api.js',
  '/js/i18n.js',
  '/js/quran.js',
  '/js/hadith.js',
  '/js/duas.js',
  '/js/prayer.js',
  '/js/tracker.js',
  '/js/search.js',
  '/js/tools.js',
  '/js/data.js',
  '/manifest.json'
];

self.addEventListener('install', (evt) => {
  // Force the new SW to activate immediately, replacing the old one
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching app shell');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (evt) => {
  // Delete ALL old caches on activation
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache:', key);
          return caches.delete(key);
        }
      }));
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  // Check if it's an API request (Quran API, Hadith API, Aladhan API)
  if (evt.request.url.includes('cdn.jsdelivr.net') || evt.request.url.includes('api.aladhan.com') || evt.request.url.includes('api.alquran.cloud')) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(evt.request)
          .then((response) => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(evt.request.url, response.clone());
            }
            return response;
          })
          .catch((err) => {
            // Network request failed, try to get it from the cache.
            return cache.match(evt.request);
          });
      })
    );
    return;
  }
  
  // For audio files, just fetch normally (don't cache large MP3s)
  if (evt.request.url.endsWith('.mp3') || evt.request.url.includes('translate_tts') || evt.request.url.includes('audio')) {
    evt.respondWith(fetch(evt.request));
    return;
  }

  // Network-first strategy for app shell (always try fresh, fallback to cache)
  evt.respondWith(
    fetch(evt.request).then(fetchRes => {
      // Got a fresh response, update the cache
      return caches.open(CACHE_NAME).then(cache => {
        cache.put(evt.request.url, fetchRes.clone());
        return fetchRes;
      });
    }).catch(() => {
      // Network failed, fallback to cache
      return caches.match(evt.request);
    })
  );
});
