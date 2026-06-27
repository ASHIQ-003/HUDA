const CACHE_NAME = 'huda-cache-v4';
const DATA_CACHE_NAME = 'huda-data-cache-v4';

// App shell files that should be pre-cached
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
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
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching app shell');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
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

  // App shell fallback (Stale-while-revalidate for local files)
  evt.respondWith(
    caches.match(evt.request).then((response) => {
      return response || fetch(evt.request).then(fetchRes => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(evt.request.url, fetchRes.clone());
          return fetchRes;
        });
      });
    })
  );
});
