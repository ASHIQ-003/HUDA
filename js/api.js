/* ══════════════════════════════════════════════════════════════
   HUDA — API Service Layer
   All external API calls consolidated here with caching
   ══════════════════════════════════════════════════════════════ */

window.HudaAPI = (() => {
  // ── API Base URLs ──
  const QURAN_API = 'https://api.alquran.cloud/v1';
  const ALADHAN_API = 'https://api.aladhan.com/v1';
  const HADITH_CDN = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1';

  // ── Cache ──
  const cache = {};
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  function getCached(key) {
    const item = cache[key];
    if (item && Date.now() - item.time < CACHE_DURATION) return item.data;
    // Also try localStorage for persistent cache
    try {
      const stored = localStorage.getItem('huda_cache_' + key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.time < CACHE_DURATION * 4) {
          cache[key] = parsed;
          return parsed.data;
        }
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  function setCache(key, data) {
    const item = { data, time: Date.now() };
    cache[key] = item;
    try {
      localStorage.setItem('huda_cache_' + key, JSON.stringify(item));
    } catch (e) {
      // Storage full, clear old caches to make room
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('huda_cache_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      
      // Try again
      try {
        localStorage.setItem('huda_cache_' + key, JSON.stringify(item));
      } catch (e2) {}
    }
  }

  // One-time cleanup for massive Quran caches that filled up localStorage previously
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('huda_cache_quran_surah_')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {}

  async function fetchJSON(url, cacheKey) {
    if (cacheKey) {
      const cached = getCached(cacheKey);
      if (cached) return cached;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (cacheKey) setCache(cacheKey, json);
      return json;
    } catch (err) {
      console.error(`API Error [${url}]:`, err);
      throw err;
    }
  }

  // ══════════════ QUR'AN API ══════════════

  async function getSurahList() {
    const data = await fetchJSON(`${QURAN_API}/surah`, 'surah_list');
    return data.data; // Array of 114 surahs
  }

  async function getSurah(number, edition = 'quran-uthmani') {
    const data = await fetchJSON(
      `${QURAN_API}/surah/${number}/${edition}`,
      `surah_${number}_${edition}`
    );
    return data.data;
  }

  async function getSurahWithTranslation(number) {
    const lang = window.I18nModule ? window.I18nModule.getLanguage() : 'en';
    const translationEdition = lang === 'ta' ? 'ta.tamil' : 'en.sahih';
    const reciter = localStorage.getItem('huda_quran_reciter') || 'ar.alafasy';
    const cacheKey = `quran_surah_audio_${number}_${lang}_${reciter}`;
    
    // Check cache manually since we use custom logic here
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // Fetch Arabic, Translation, and Audio in parallel
    const [arRes, transRes, audioRes] = await Promise.all([
      fetch(`${QURAN_API}/surah/${number}/quran-uthmani`),
      fetch(`${QURAN_API}/surah/${number}/${translationEdition}`),
      fetch(`${QURAN_API}/surah/${number}/${reciter}`)
    ]);
    
    if (!arRes.ok || !transRes.ok || !audioRes.ok) throw new Error('Failed to fetch surah data');
    
    const arData = await arRes.json();
    const transData = await transRes.json();
    const audioData = await audioRes.json();
    
    const result = [arData.data, transData.data, audioData.data];
    setCache(cacheKey, result);
    return result;
  }

  async function searchQuran(query) {
    const data = await fetchJSON(
      `${QURAN_API}/search/${encodeURIComponent(query)}/all/en.sahih`,
      null // Don't cache searches
    );
    return data.data;
  }

  // ══════════════ HADITH API ══════════════

  const HADITH_EDITIONS = {
    bukhari: { name: 'Sahih al-Bukhari', key: 'eng-bukhari', sections: 'bukhari' },
    muslim:  { name: 'Sahih Muslim', key: 'eng-muslim', sections: 'muslim' },
    abudawud: { name: 'Sunan Abu Dawud', key: 'eng-abudawud', sections: 'abudawud' },
    tirmidhi: { name: "Jami' at-Tirmidhi", key: 'eng-tirmidhi', sections: 'tirmidhi' },
    nasai:   { name: "Sunan an-Nasa'i", key: 'eng-nasai', sections: 'nasai' },
    ibnmajah: { name: 'Sunan Ibn Majah', key: 'eng-ibnmajah', sections: 'ibnmajah' },
    malik:   { name: 'Muwatta Malik', key: 'eng-malik', sections: 'malik' }
  };

  async function getHadithCollection(collection) {
    const edition = HADITH_EDITIONS[collection];
    if (!edition) throw new Error('Unknown collection: ' + collection);

    const lang = window.I18nModule ? window.I18nModule.getLanguage() : 'en';
    const editionKey = lang === 'ta' ? edition.key.replace('eng-', 'tam-') : edition.key;

    const cacheKey = `hadith_${collection}_${lang}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      // Try the primary CDN structure
      const data = await fetchJSON(
        `${HADITH_CDN}/editions/${editionKey}.json`,
        null
      );
      const result = data.hadiths || data;
      setCache(cacheKey, result);
      return result;
    } catch (err) {
      // Fallback: try min version
      try {
        const data = await fetchJSON(
          `${HADITH_CDN}/editions/${editionKey}.min.json`,
          null
        );
        const result = data.hadiths || data;
        setCache(cacheKey, result);
        return result;
      } catch (err2) {
        console.error('Hadith API fallback also failed:', err2);
        throw err2;
      }
    }
  }

  function getHadithEditions() {
    return HADITH_EDITIONS;
  }

  // ══════════════ PRAYER TIMES API (ALADHAN) ══════════════

  async function getPrayerTimes(lat, lon, method = 4, school = 0) {
    const today = new Date();
    const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    const data = await fetchJSON(
      `${ALADHAN_API}/timings/${dateStr}?latitude=${lat}&longitude=${lon}&method=${method}&school=${school}`,
      `prayer_${lat}_${lon}_${method}_${school}_${dateStr}`
    );
    return data.data;
  }

  async function getPrayerTimesByCity(city, country, method = 4, school = 0) {
    const today = new Date();
    const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    const data = await fetchJSON(
      `${ALADHAN_API}/timingsByCity/${dateStr}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}&school=${school}`,
      `prayer_city_${city}_${country}_${method}_${school}_${dateStr}`
    );
    return data.data;
  }

  async function getMonthlyCalendar(lat, lon, year, month, method = 4) {
    const data = await fetchJSON(
      `${ALADHAN_API}/calendar/${year}/${month}?latitude=${lat}&longitude=${lon}&method=${method}`,
      `calendar_${lat}_${lon}_${year}_${month}_${method}`
    );
    return data.data;
  }

  // ══════════════ QIBLAH API ══════════════

  async function getQiblahDirection(lat, lon) {
    const data = await fetchJSON(
      `${ALADHAN_API}/qibla/${lat}/${lon}`,
      `qiblah_${lat}_${lon}`
    );
    return data.data;
  }


  // ══════════════ HIJRI DATE API ══════════════

  async function getHijriDate() {
    const today = new Date();
    const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    const data = await fetchJSON(
      `${ALADHAN_API}/gToH?date=${dateStr}`,
      `hijri_${dateStr}`
    );
    return data.data.hijri;
  }

  // ══════════════ GEOLOCATION ══════════════

  function getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  // ══════════════ PUBLIC API ══════════════
  return {
    // Quran
    getSurahList,
    getSurah,
    getSurahWithTranslation,
    searchQuran,
    // Hadith
    getHadithCollection,
    getHadithEditions,
    // Prayer
    getPrayerTimes,
    getPrayerTimesByCity,
    getMonthlyCalendar,
    // Qiblah
    getQiblahDirection,
    // Hijri
    getHijriDate,
    // Location
    getUserLocation
  };
})();
