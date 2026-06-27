/* ══════════════════════════════════════════════════════════════
   HUDA — Du'as and Adhkar Module
   ══════════════════════════════════════════════════════════════ */

window.DuasModule = (() => {
  
  // ── Du'as Initialization ──
  function initDuas() {
    const catsContainer = document.getElementById('duasCategories');
    catsContainer.innerHTML = '';
    
    const lang = window.I18nModule ? window.I18nModule.getLanguage() : 'en';

    window.HudaData.duas.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'category-card';
      card.onclick = () => showCategory(cat.id);
      
      const title = typeof cat.title === 'object' ? (cat.title[lang] || cat.title.en) : cat.title;
      
      card.innerHTML = `
        <div class="cat-icon">${cat.icon}</div>
        <div class="cat-title">${title}</div>
        <div class="cat-count">${cat.items.length} Supplication${cat.items.length !== 1 ? 's' : ''}</div>
      `;
      catsContainer.appendChild(card);
    });
    
    // Ensure categories view is shown
    document.getElementById('duasCategories').style.display = 'grid';
    document.getElementById('duasContent').style.display = 'none';
  }

  function showCategory(catId) {
    const cat = window.HudaData.duas.find(c => c.id === catId);
    if (!cat) return;
    
    document.getElementById('duasCategories').style.display = 'none';
    const content = document.getElementById('duasContent');
    content.style.display = 'block';
    
    const lang = window.I18nModule ? window.I18nModule.getLanguage() : 'en';
    const catTitle = typeof cat.title === 'object' ? (cat.title[lang] || cat.title.en) : cat.title;
    document.getElementById('duasCategoryTitle').innerHTML = `${cat.icon} ${catTitle}`;
    
    const list = document.getElementById('duasList');
    list.innerHTML = '';
    
    cat.items.forEach(dua => {
      const el = document.createElement('div');
      el.className = 'dua-card stagger-children';
      const translation = lang === 'ta' && dua.translation_ta ? dua.translation_ta : dua.translation;
      el.innerHTML = `
        <div class="dua-arabic">${dua.arabic}</div>
        <div class="dua-transliteration">${dua.transliteration}</div>
        <div class="dua-translation">${translation}</div>
        <div class="dua-reference">
          <span class="ref-icon">📖</span> ${dua.reference}
        </div>
      `;
      list.appendChild(el);
    });
  }

  function showCategories() {
    document.getElementById('duasContent').style.display = 'none';
    document.getElementById('duasCategories').style.display = 'grid';
  }

  // ── Adhkar Functionality  // State
  let currentAdhkarList = [];
  let currentAdhkarIndex = 0;
  let currentCount = 0;
  let userGoal = 'auto'; // 'auto', '33', '100', 'infinity'

  function initAdhkar() {
    showAdhkar('morning');
  }

  function showAdhkar(type) {
    // Update tabs
    document.querySelectorAll('#adhkarTabs .tab').forEach(el => {
      el.classList.toggle('active', el.dataset.adhkar === type);
    });
    
    currentAdhkarList = window.HudaData.adhkar[type] || [];
    currentAdhkarIndex = 0;
    currentCount = 0;
    
    if (currentAdhkarList.length > 0) {
      document.getElementById('adhkarCounterView').style.display = 'flex';
      renderCurrentDhikr();
    } else {
      document.getElementById('adhkarCounterView').style.display = 'none';
    }
  }

  function renderCurrentDhikr() {
    const dhikr = currentAdhkarList[currentAdhkarIndex];
    if (!dhikr) return;
    const lang = window.I18nModule ? window.I18nModule.getLanguage() : 'en';
    const translation = lang === 'ta' && dhikr.translation_ta ? dhikr.translation_ta : dhikr.translation;
    
    document.getElementById('adhkarArabic').textContent = dhikr.arabic;
    document.getElementById('adhkarTranslit').textContent = dhikr.transliteration;
    document.getElementById('adhkarTranslation').textContent = translation;
    document.getElementById('adhkarReference').innerHTML = `<span class="ref-icon">📖</span> ${dhikr.reference}`;
    
    currentCount = 0;
    updateCounterUI();
  }

  function getTargetCount() {
    if (userGoal === 'auto') return currentAdhkarList[currentAdhkarIndex].count || 1;
    if (userGoal === 'infinity') return Infinity;
    return parseInt(userGoal, 10);
  }

  function updateCounterUI() {
    const dhikr = currentAdhkarList[currentAdhkarIndex];
    const display = document.getElementById('adhkarCounter');
    const target = getTargetCount();
    
    display.textContent = currentCount;
    const targetText = target === Infinity ? '∞' : target;
    document.getElementById('adhkarTarget').textContent = `Tap to count • ${currentCount} / ${targetText}`;
    
    // Progress bar for overall list progress
    const total = currentAdhkarList.length;
    const progress = ((currentAdhkarIndex) / total) * 100;
    document.getElementById('adhkarProgressBar').style.width = `${progress}%`;
    
    // Check completion
    if (currentCount >= target && target !== Infinity) {
      display.style.borderColor = 'var(--color-success)';
      display.style.color = 'var(--color-success)';
      
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]); // Goal reached vibration
      }
      
      // Auto advance after small delay if not the last one
      if (userGoal === 'auto' && currentAdhkarIndex < currentAdhkarList.length - 1) {
        setTimeout(nextDhikr, 700);
      } else if (userGoal === 'auto') {
        // Finished all
        document.getElementById('adhkarProgressBar').style.width = '100%';
        window.HudaApp.showToast('Completed this session. Alhamdulillah.', 'success');
      }
    } else {
      display.style.borderColor = 'var(--color-emerald)';
      display.style.color = 'var(--color-emerald-light)';
    }
  }

  function incrementCount(event) {
    const target = getTargetCount();
    
    // Create ripple effect
    if (event) {
      const tapArea = event.currentTarget || document.querySelector('.adhkar-tap-area');
      const ripple = document.createElement('div');
      ripple.className = 'ripple';
      
      const rect = tapArea.getBoundingClientRect();
      const x = event.clientX ? (event.clientX - rect.left) : (rect.width / 2);
      const y = event.clientY ? (event.clientY - rect.top) : (rect.height / 2);
      
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x - size / 2}px`;
      ripple.style.top = `${y - size / 2}px`;
      
      tapArea.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }

    if (currentCount < target || target === Infinity) {
      currentCount++;
      
      if (navigator.vibrate) {
        navigator.vibrate(20); // Small haptic tap
      }
      
      // Pulse animation
      const display = document.getElementById('adhkarCounter');
      display.classList.remove('pulse');
      void display.offsetWidth; // trigger reflow
      display.classList.add('pulse');
      
      updateCounterUI();
    }
  }

  function prevDhikr() {
    if (currentAdhkarIndex > 0) {
      currentAdhkarIndex--;
      renderCurrentDhikr();
    }
  }

  function nextDhikr() {
    if (currentAdhkarIndex < currentAdhkarList.length - 1) {
      currentAdhkarIndex++;
      renderCurrentDhikr();
    }
  }

  function reloadDhikr() {
    if (currentAdhkarList && currentAdhkarList.length > 0) {
      renderCurrentDhikr();
    }
  }

  function setGoal(val) {
    userGoal = val;
    currentCount = 0;
    updateCounterUI();
  }

  function resetCount() {
    currentCount = 0;
    updateCounterUI();
  }

  return {
    initDuas,
    showCategories,
    initAdhkar,
    showAdhkar,
    incrementCount,
    prevDhikr,
    nextDhikr,
    reloadDhikr,
    setGoal,
    resetCount
  };
})();
