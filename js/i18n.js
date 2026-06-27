/* ══════════════════════════════════════════════════════════════
   HUDA — Internationalization (i18n) Module
   Handles Language switching between English and Tamil
   ══════════════════════════════════════════════════════════════ */

window.I18nModule = (() => {
  let currentLang = localStorage.getItem('huda_lang') || 'en';

  const dict = {
    en: {
      'nav.home': 'Home',
      'nav.quran': 'Qur\'an',
      'nav.hadith': 'Hadith',
      'nav.prayerGuide': 'Prayer Guide',
      'nav.duas': 'Du\'ās',
      'nav.dhikr': 'Dhikr',
      'nav.tracker': 'Habit Tracker',
      'nav.tools': 'Tools',
      'nav.prayerTimes': 'Prayer Times',
      'nav.qiblah': 'Qiblah Direction',
      'nav.zakat': 'Zakat Calculator',
      'nav.inheritance': 'Inheritance',
      'nav.ramadan': 'Ramadan Tools',
      
      'home.welcome': 'Peace be upon you',
      'home.subtitle': 'Your companion for authentic Islamic guidance',
      
      'quran.play': 'Play',
      'quran.pause': 'Pause',
      'quran.search': 'Search Surahs...',
      
      'hadith.search': 'Search Hadiths...',
      
      'tracker.title': 'Habit Tracker (Muhāsabah)',
      'tracker.subtitle': '"The most beloved of deeds to Allah are those that are most consistent, even if it is small." (Bukhari)',
      
      'theme.dark': 'Dark Mode',
      'theme.light': 'Light Mode',
      
      'loading': 'Loading...',
      'error.network': 'Failed to load data. Please check your connection.'
    },
    ta: {
      'nav.home': 'முகப்பு',
      'nav.quran': 'குர்ஆன்',
      'nav.hadith': 'ஹதீஸ்',
      'nav.prayerGuide': 'தொழுகை வழிகாட்டி',
      'nav.duas': 'துஆக்கள்',
      'nav.dhikr': 'திக்ருகள்',
      'nav.tracker': 'பழக்க வழிகாட்டி',
      'nav.tools': 'கருவிகள்',
      'nav.prayerTimes': 'தொழுகை நேரங்கள்',
      'nav.qiblah': 'கிப்லா திசை',
      'nav.zakat': 'ஜகாத் கணக்கீட்டாளர்',
      'nav.inheritance': 'வாரிசுரிமை',
      'nav.ramadan': 'ரமலான் கருவிகள்',
      
      'home.welcome': 'உங்கள் மீது சாந்தி உண்டாகட்டும்',
      'home.subtitle': 'உண்மையான இஸ்லாமிய வழிகாட்டுதலுக்கான உங்கள் துணை',
      
      'quran.play': 'இயக்கு',
      'quran.pause': 'நிறுத்து',
      'quran.search': 'சூராக்களைத் தேடுங்கள்...',
      
      'hadith.search': 'ஹதீஸ்களைத் தேடுங்கள்...',
      
      'tracker.title': 'பழக்க வழிகாட்டி (முஹாஸபா)',
      'tracker.subtitle': '"அல்லாஹ்வுக்கு மிக விருப்பமான செயல்கள், அவை சிறியதாக இருந்தாலும் தொடர்ந்து செய்யப்படுபவையே." (புகாரி)',
      
      'theme.dark': 'இருண்ட பயன்முறை',
      'theme.light': 'ஒளி பயன்முறை',
      
      'loading': 'ஏற்றுகிறது...',
      'error.network': 'தரவை ஏற்ற முடியவில்லை. உங்கள் இணைய இணைப்பை சரிபார்க்கவும்.'
    }
  };

  function setLanguage(lang) {
    if (!dict[lang]) return;
    currentLang = lang;
    localStorage.setItem('huda_lang', lang);
    document.documentElement.lang = lang;
    
    // Set appropriate font stack
    if (lang === 'ta') {
      document.documentElement.classList.add('lang-ta');
    } else {
      document.documentElement.classList.remove('lang-ta');
    }

    applyTranslations();
    
    // Dispatch event so other modules (Quran, Hadith) can re-fetch data if they are active
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  function getLanguage() {
    return currentLang;
  }

  function t(key) {
    return dict[currentLang][key] || dict['en'][key] || key;
  }

  function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (el.tagName === 'INPUT' && el.type === 'text') {
        el.placeholder = t(key);
      } else {
        el.textContent = t(key);
      }
    });
  }

  function init() {
    applyTranslations();
    setLanguage(currentLang);
  }

  return {
    init,
    setLanguage,
    getLanguage,
    t
  };
})();
