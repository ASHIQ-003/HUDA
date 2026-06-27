/* ══════════════════════════════════════════════════════════════
   HUDA — App Initialization, Routing & Navigation
   ══════════════════════════════════════════════════════════════ */

window.HudaApp = (() => {
  // ── State ──
  let currentPage = 'home';
  let sidebarOpen = false;

  // ── Page title mapping ──
  const PAGE_TITLES = {
    'home': 'Home',
    'quran': 'Qur\'an',
    'hadith': 'Sahih Hadith',
    'prayer-guide': 'Prayer Guide',
    'duas': 'Du\'ās',
    'adhkar': 'Dhikr',
    'prayer-times': 'Prayer Times',
    'qiblah': 'Qiblah Direction',
    'zakat': 'Zakat Calculator',
    'inheritance': 'Inheritance Calculator',
    'ramadan': 'Ramadan Tools',
    'search': 'Search Results',
    'tracker': 'Habit Tracker'
  };

  // ── Initialize ──
  function init() {
    // Register Service Worker for PWA (Offline Mode)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
          console.log('ServiceWorker registered with scope:', reg.scope);
        }).catch(err => {
          console.log('ServiceWorker registration failed:', err);
        });
      });
    }

    // Load Hijri date
    loadHijriDate();

    // Set up global search
    setupGlobalSearch();

    // Handle hash routing
    handleRoute();
    window.addEventListener('hashchange', handleRoute);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('globalSearch').focus();
      }
      if (e.key === 'Escape') {
        if (sidebarOpen) toggleSidebar();
      }
    });

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }

    // Listen for language changes to re-render dynamic content
    document.addEventListener('languageChanged', () => {
      // Re-trigger the init function for the current page so it re-renders
      triggerPageInit(currentPage, true);
    });
  }

  // ── Routing ──
  function handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const page = hash.split('/')[0] || 'home';
    if (PAGE_TITLES[page]) {
      showPage(page);
    } else {
      showPage('home');
    }
  }

  function navigateTo(page) {
    window.location.hash = page;
    if (sidebarOpen && window.innerWidth <= 768) {
      toggleSidebar();
    }
  }

  function showPage(page) {
    currentPage = page;

    // Hide all pages, show target
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    const targetPage = document.getElementById('page-' + page);
    if (targetPage) {
      targetPage.classList.add('active');
      // Re-trigger animation
      targetPage.style.animation = 'none';
      targetPage.offsetHeight; // reflow
      targetPage.style.animation = '';
    }

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    // Update header title
    document.getElementById('headerTitle').textContent = PAGE_TITLES[page] || 'Huda';

    // Trigger page-specific initialization
    triggerPageInit(page, false);
  }

  function triggerPageInit(page, forceReload = false) {
    switch (page) {
      case 'home':
        renderHomeWidgets();
        break;
      case 'quran':
        if (window.QuranModule) {
          if (forceReload) window.QuranModule.reloadLang();
          else window.QuranModule.init();
        }
        break;
      case 'hadith':
        if (window.HadithModule) {
          if (forceReload) window.HadithModule.reloadLang();
          else window.HadithModule.init();
        }
        break;
      case 'prayer-guide':
        if (window.PrayerModule) window.PrayerModule.initGuide();
        break;
      case 'duas':
        if (window.DuasModule) {
          if (forceReload) window.DuasModule.initDuas(); // Re-renders
          else window.DuasModule.initDuas();
        }
        break;
      case 'adhkar':
        if (window.DuasModule) {
          if (forceReload) window.DuasModule.reloadDhikr();
          else window.DuasModule.initAdhkar();
        }
        break;
      case 'prayer-times':
        if (window.PrayerModule) window.PrayerModule.initPrayerTimes();
        break;
      case 'qiblah':
        if (window.PrayerModule) window.PrayerModule.initQiblah();
        break;
      case 'zakat':
        if (window.ToolsModule) window.ToolsModule.initZakat();
        break;
      case 'ramadan':
        if (window.ToolsModule) window.ToolsModule.initRamadan();
        break;
      case 'tracker':
        if (window.TrackerModule) window.TrackerModule.init();
        break;
    }
  }

  function renderHomeWidgets() {
    const crWidget = document.getElementById('homeContinueReadingWidget');
    const bmWidget = document.getElementById('homeBookmarksWidget');
    if (!crWidget || !bmWidget) return;

    // Continue Reading
    let crHtml = '';
    const lastRead = localStorage.getItem('huda_last_read');
    if (lastRead) {
      try {
        const bm = JSON.parse(lastRead);
        // We might not have surah list loaded yet in app.js, so we display generic or wait.
        // But window.HudaAPI.getSurahList is cached.
        window.HudaAPI.getSurahList().then(surahs => {
          const s = surahs.find(x => x.number === bm.surah);
          if (s) {
            crWidget.innerHTML = `
              <div class="card mt-6 mb-6" style="background: linear-gradient(135deg, rgba(16,185,129,0.1), transparent); border-left: 4px solid var(--color-emerald); padding: var(--space-6); text-align: left; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h4 style="font-size: var(--text-sm); text-transform: uppercase; letter-spacing: 1px; color: var(--color-emerald); font-weight: 700; margin-bottom: var(--space-2);">Continue Reading</h4>
                  <p style="font-size: var(--text-lg); font-weight: 600;">Surah ${s.englishName}, Ayah ${bm.ayah + 1}</p>
                </div>
                <button class="btn btn-primary" onclick="window.HudaApp.navigateTo('quran'); setTimeout(() => { window.QuranModule.loadSurah(${bm.surah}).then(() => { setTimeout(() => document.getElementById('verse-${bm.ayah}').scrollIntoView({behavior: 'smooth', block: 'center'}), 500); }) }, 300);">Resume</button>
              </div>
            `;
            crWidget.style.display = 'block';
          }
        });
      } catch(e) {}
    } else {
      crWidget.style.display = 'none';
    }

    // Bookmarks
    let bmHtml = '';
    let bookmarks = [];
    try {
      const stored = localStorage.getItem('huda_bookmarks');
      if (stored) bookmarks = JSON.parse(stored);
    } catch(e) {}

    if (bookmarks.length > 0) {
      window.HudaAPI.getSurahList().then(surahs => {
        bmHtml += `<div class="bookmarks-section mb-6">
          <h4 style="font-size: var(--text-base); color: var(--color-text); font-weight: 600; margin-bottom: var(--space-4); border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-2);">My Bookmarks</h4>
          <div class="bookmarks-list" style="display: flex; flex-direction: column; gap: var(--space-3);">
        `;
        bookmarks.slice(0, 3).forEach((bm, idx) => { // show only top 3 on home
          const s = surahs.find(x => x.number === bm.surah);
          if (s) {
            bmHtml += `
              <div class="bookmark-item card" style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-4); cursor: pointer; transition: transform 0.2s;" onclick="window.HudaApp.navigateTo('quran'); setTimeout(() => { window.QuranModule.loadSurah(${bm.surah}).then(() => { setTimeout(() => document.getElementById('verse-${bm.ayah}').scrollIntoView({behavior: 'smooth', block: 'center'}), 500); }) }, 300);">
                <div>
                  <h5 style="font-size: var(--text-base); font-weight: 600; color: var(--color-text);">Surah ${s.englishName}</h5>
                  <p style="font-size: var(--text-sm); color: var(--color-text-muted);">Ayah ${bm.ayah + 1}</p>
                </div>
                <svg class="nav-icon svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--color-emerald); opacity: 0.5;"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
              </div>
            `;
          }
        });
        bmHtml += `</div></div>`;
        bmWidget.innerHTML = bmHtml;
        bmWidget.style.display = 'block';
      });
    } else {
      bmWidget.style.display = 'none';
    }
  }

  // ── Sidebar ──
  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    document.getElementById('sidebar').classList.toggle('open', sidebarOpen);
    document.getElementById('sidebarOverlay').classList.toggle('open', sidebarOpen);
  }

  // ── Hijri Date ──
  async function loadHijriDate() {
    try {
      const hijri = await window.HudaAPI.getHijriDate();
      const text = `${hijri.day} ${hijri.month.en} ${hijri.year} AH`;
      document.getElementById('hijriDateText').textContent = text;
    } catch (err) {
      document.getElementById('hijriDateText').textContent = 'Hijri Date';
    }
  }

  // ── Global Search ──
  function setupGlobalSearch() {
    const input = document.getElementById('globalSearch');
    let timeout;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = input.value.trim();
        if (query.length >= 2) {
          navigateTo('search');
          if (window.SearchModule) {
            window.SearchModule.performSearch(query);
          }
        }
      }
    });
  }

  // ── Toast Notification ──
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ── Init on DOM ready ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  // ── Public API ──
  return {
    init,
    navigateTo,
    toggleSidebar,
    showToast,
    getCurrentPage: () => currentPage
  };
})();

// ── Theme Module ──
window.ThemeModule = (() => {
  let currentTheme = localStorage.getItem('huda_theme') || 'dark';

  function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('huda_theme', theme);
    const btn = document.getElementById('themeToggleBtn');
    
    const sunIcon = `<svg class="nav-icon svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    const moonIcon = `<svg class="nav-icon svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark-mode');
      if (btn) btn.innerHTML = moonIcon;
    } else {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
      if (btn) btn.innerHTML = sunIcon;
    }
  }

  function toggleTheme() {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }

  function init() {
    if (!localStorage.getItem('huda_theme') && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      currentTheme = 'light';
    }
    setTheme(currentTheme);
  }

  return { init, setTheme, toggleTheme, getCurrentTheme: () => currentTheme };
})();

async function loadDailyInspiration() {
  const widget = document.getElementById('dailyInspirationWidget');
  if (!widget) return;
  try {
    const inspirations = [
      { ar: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", en: "Indeed, with hardship [will be] ease.", ref: "Qur'an 94:6" },
      { ar: "فَاذْكُرُونِي أَذْكُرْكُمْ", en: "So remember Me; I will remember you.", ref: "Qur'an 2:152" },
      { ar: "لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا", en: "Do not grieve; indeed Allah is with us.", ref: "Qur'an 9:40" },
      { ar: "وَاللَّهُ يَعْلَمُ وَأَنتُمْ لَا تَعْلَمُونَ", en: "And Allah knows, while you know not.", ref: "Qur'an 2:216" },
      { ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً", en: "Our Lord, give us in this world [that which is] good...", ref: "Qur'an 2:201" },
      { ar: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ", en: "And He is with you wherever you are.", ref: "Qur'an 57:4" }
    ];
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const selected = inspirations[dayOfYear % inspirations.length];
    
    document.getElementById('diArabic').textContent = selected.ar;
    document.getElementById('diTranslation').textContent = `"${selected.en}"`;
    document.getElementById('diReference').textContent = `- ${selected.ref}`;
    widget.style.display = 'block';
  } catch (e) {
    console.error("Failed to load daily inspiration", e);
  }
}

function initApp() {
  window.ThemeModule.init();
  if (window.I18nModule) {
    window.I18nModule.init();
    const langToggle = document.getElementById('languageToggle');
    if (langToggle) langToggle.value = window.I18nModule.getLanguage();
  }
  
  loadDailyInspiration();
  window.HudaApp.init(); // Need to expose init in HudaApp
}
