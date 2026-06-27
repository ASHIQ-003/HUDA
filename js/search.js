/* ══════════════════════════════════════════════════════════════
   HUDA — Global Search Module
   Search across Qur'an and loaded Hadith collections
   ══════════════════════════════════════════════════════════════ */

window.SearchModule = (() => {
  let currentResults = {
    quran: [],
    hadith: []
  };
  let currentQuery = '';

  async function performSearch(query) {
    if (!query || query.length < 2) return;
    currentQuery = query;
    
    document.getElementById('searchTitle').textContent = `Results for "${query}"`;
    document.getElementById('searchSubtitle').textContent = 'Searching authentic sources...';
    
    const container = document.getElementById('searchResults');
    container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><span class="loading-text">Searching...</span></div>`;
    
    // Reset tabs to All
    filterResults('all', false);

    try {
      // 1. Search Quran (via alquran.cloud)
      const quranRes = await window.HudaAPI.searchQuran(query);
      currentResults.quran = quranRes.matches || [];
      
      // 2. Search Hadith (local filter of currently loaded collection)
      // Since we don't have a global indexed search API for hadith without auth,
      // we'll simulate it by searching whatever collection is currently cached/loaded
      currentResults.hadith = [];
      const collections = ['bukhari', 'muslim']; // the major ones we prioritize
      
      for (const col of collections) {
        try {
          const data = await window.HudaAPI.getHadithCollection(col);
          if (data && data.length) {
            const matches = data.filter(h => h.text.toLowerCase().includes(query.toLowerCase()));
            // Limit to 20 per collection to avoid massive render blocking
            matches.slice(0, 20).forEach(m => {
              currentResults.hadith.push({
                collection: col,
                number: m.hadithnumber,
                text: m.text
              });
            });
          }
        } catch (e) {
          // ignore if not cached/loaded
        }
      }
      
      document.getElementById('searchSubtitle').textContent = 
        `Found ${currentResults.quran.length} verses and ${currentResults.hadith.length} hadiths`;
        
      renderResults('all');
      
    } catch (err) {
      console.error(err);
      container.innerHTML = `<div class="empty-state">Search failed. Please try again.</div>`;
    }
  }

  function filterResults(type, render = true) {
    document.querySelectorAll('#page-search .tab').forEach(el => {
      el.classList.toggle('active', el.dataset.search === type);
    });
    
    if (render) renderResults(type);
  }

  function renderResults(type) {
    const container = document.getElementById('searchResults');
    container.innerHTML = '';
    
    let toRender = [];
    
    if (type === 'all' || type === 'quran') {
      currentResults.quran.forEach(match => {
        toRender.push({
          type: 'quran',
          source: `Surah ${match.surah.englishName} (${match.surah.number}:${match.numberInSurah})`,
          icon: '📖',
          text: highlight(match.text, currentQuery),
          onclick: () => {
            window.HudaApp.navigateTo('quran');
            if (window.QuranModule) {
              window.QuranModule.loadSurah(match.surah.number);
            }
          }
        });
      });
    }
    
    if (type === 'all' || type === 'hadith') {
      currentResults.hadith.forEach(match => {
        const cname = match.collection === 'bukhari' ? 'Sahih al-Bukhari' : 'Sahih Muslim';
        toRender.push({
          type: 'hadith',
          source: `${cname}, Hadith ${match.number}`,
          icon: '📚',
          text: highlight(match.text, currentQuery),
          onclick: () => {
            window.HudaApp.navigateTo('hadith');
            if (window.HadithModule) {
              window.HadithModule.loadCollection(match.collection);
              setTimeout(() => {
                const searchEl = document.getElementById('hadithSearch');
                if (searchEl) {
                  searchEl.value = match.number;
                  searchEl.dispatchEvent(new KeyboardEvent('keypress', {'key':'Enter'}));
                }
              }, 500);
            }
          }
        });
      });
    }
    
    if (toRender.length === 0) {
      container.innerHTML = `<div class="empty-state">No results found for "${currentQuery}" in this category.</div>`;
      return;
    }
    
    toRender.forEach(item => {
      const card = document.createElement('div');
      card.className = 'search-result-card';
      card.onclick = item.onclick;
      card.innerHTML = `
        <div class="result-source"><span style="font-size: 1.2em;">${item.icon}</span> <strong style="color: var(--color-emerald-light);">${item.source}</strong></div>
        <div class="result-text">${item.text}</div>
      `;
      container.appendChild(card);
    });
  }

  function highlight(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^$\{()|[\\]\\\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  return {
    performSearch,
    filterResults
  };
})();
