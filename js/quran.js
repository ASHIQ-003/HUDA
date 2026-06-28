/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   HUDA ΓÇö Qur'an Module
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

window.QuranModule = (() => {
  // ΓöÇΓöÇ State ΓöÇΓöÇ
  let surahs = [];
  let currentSurahNumber = null;
  let surahData = null; // Contains both Arabic and English text
  
  // Audio state
  let audioPlayerEl;
  let isPlaying = false;
  let currentAyahIndex = 0;
  let audioUrls = [];
  let isPlayingBasmalah = false;
  let currentReciter = localStorage.getItem('huda_quran_reciter') || 'ar.alafasy';
  const reciterFolders = {
    'ar.alafasy': 'Alafasy_128kbps',
    'ar.mahermuaiqly': 'MaherAlMuaiqly128kbps',
    'ar.abdulbasitmurattal': 'Abdul_Basit_Murattal_192kbps',
    'ar.dosari': 'Yasser_Ad-Dussary_128kbps'
  };
  function getEveryAyahUrl(reciter, surah, ayah) {
    const folder = reciterFolders[reciter] || 'Alafasy_128kbps';
    const s = String(surah).padStart(3, '0');
    const a = String(ayah).padStart(3, '0');
    return `https://everyayah.com/data/${folder}/${s}${a}.mp3`;
  }
  let BASMALAH_AUDIO_URL = getEveryAyahUrl(currentReciter, 1, 1);

  // ΓöÇΓöÇ DOM Elements ΓöÇΓöÇ
  let surahListEl;
  let verseContainerEl;
  let surahSearchEl;

  // ΓöÇΓöÇ Initialization ΓöÇΓöÇ
  async function init() {
    if (surahs.length > 0) return; // Already initialized

    surahListEl = document.getElementById('surahList');
    verseContainerEl = document.getElementById('verseContainer');
    surahSearchEl = document.getElementById('surahSearch');
    audioPlayerEl = document.getElementById('quranAudioPlayer');

    if (surahSearchEl) {
      surahSearchEl.addEventListener('input', (e) => filterSurahs(e.target.value));
    }
    
    // Audio event listeners
    if (audioPlayerEl) {
      audioPlayerEl.addEventListener('ended', playNextAyah);
      audioPlayerEl.addEventListener('play', () => updatePlayButtonState(true));
      audioPlayerEl.addEventListener('pause', () => updatePlayButtonState(false));
    }

    try {
      surahs = await window.HudaAPI.getSurahList();
      renderSurahList(surahs);

      const lastRead = localStorage.getItem('huda_last_read');
      let defaultHtml = '';
      
      if (lastRead) {
        const bm = JSON.parse(lastRead);
        const s = surahs.find(x => x.number === bm.surah);
        if (s) {
          defaultHtml += `
            <div class="card mt-4 mb-6" style="background: linear-gradient(135deg, rgba(16,185,129,0.1), transparent); border-left: 4px solid var(--color-emerald); padding: var(--space-6); text-align: left; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h4 style="font-size: var(--text-sm); text-transform: uppercase; letter-spacing: 1px; color: var(--color-emerald); font-weight: 700; margin-bottom: var(--space-2);">Continue Reading</h4>
                <p style="font-size: var(--text-lg); font-weight: 600;">Surah ${s.englishName}, Ayah ${bm.ayah + 1}</p>
              </div>
              <button class="btn btn-primary" onclick="window.QuranModule.loadSurah(${bm.surah}).then(() => { setTimeout(() => document.getElementById('verse-${bm.ayah}').scrollIntoView({behavior: 'smooth', block: 'center'}), 500); })">Resume</button>
            </div>
          `;
        }
      }
      
      let bookmarks = [];
      try {
        const stored = localStorage.getItem('huda_bookmarks');
        if (stored) bookmarks = JSON.parse(stored);
      } catch(e) {}
      
      if (bookmarks.length > 0) {
        defaultHtml += `<div class="bookmarks-section mt-6 mb-6">
          <h4 style="font-size: var(--text-base); color: var(--color-text); font-weight: 600; margin-bottom: var(--space-4); border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-2);">My Bookmarks</h4>
          <div class="bookmarks-list" style="display: flex; flex-direction: column; gap: var(--space-3);">
        `;
        
        bookmarks.forEach((bm, idx) => {
          const s = surahs.find(x => x.number === bm.surah);
          if (s) {
            defaultHtml += `
              <div class="bookmark-item card" style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-4); cursor: pointer; transition: transform 0.2s;" onclick="window.QuranModule.loadSurah(${bm.surah}).then(() => { setTimeout(() => document.getElementById('verse-${bm.ayah}').scrollIntoView({behavior: 'smooth', block: 'center'}), 500); })">
                <div>
                  <h5 style="font-size: var(--text-base); font-weight: 600; color: var(--color-text);">Surah ${s.englishName}</h5>
                  <p style="font-size: var(--text-sm); color: var(--color-text-muted);">Ayah ${bm.ayah + 1}</p>
                </div>
                <button class="btn btn-icon sm" style="color: var(--color-danger);" onclick="event.stopPropagation(); window.QuranModule.deleteBookmark(${idx})" title="Remove Bookmark">
                  <svg class="nav-icon svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            `;
          }
        });
        
        defaultHtml += `</div></div>`;
      }
      
      if (!defaultHtml) {
        defaultHtml = `
          <div style="text-align: center; color: var(--color-text-muted); padding: var(--space-12);">
            <svg class="nav-icon svg-icon" style="width: 48px; height: 48px; margin: 0 auto var(--space-4); opacity: 0.2;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            <p>Select a Surah from the sidebar to begin reading.</p>
          </div>
        `;
      } else {
        defaultHtml += `
          <div style="text-align: center; color: var(--color-text-muted); padding: var(--space-8); font-size: var(--text-sm);">
            <p>Select a Surah from the sidebar to start a new reading session.</p>
          </div>
        `;
      }
      
      if (verseContainerEl) {
        verseContainerEl.innerHTML = defaultHtml;
      }
    } catch (err) {
      console.error("Failed to load surahs", err);
      if (surahListEl) surahListEl.innerHTML = `<div class="empty-state">Failed to load Qur'an data. Please check your connection.</div>`;
    }
  }

  // ΓöÇΓöÇ Render Surah List ΓöÇΓöÇ
  function renderSurahList(list) {
    if (!surahListEl) return;
    surahListEl.innerHTML = '';

    list.forEach(surah => {
      const item = document.createElement('div');
      item.className = `surah-item ${currentSurahNumber === surah.number ? 'active' : ''}`;
      item.onclick = () => loadSurah(surah.number);

      item.innerHTML = `
        <div class="surah-number"><span>${surah.number}</span></div>
        <div class="surah-info">
          <div class="surah-name-en">${surah.englishName}</div>
          <div class="surah-meaning">${surah.englishNameTranslation}</div>
        </div>
        <div class="surah-meta">
          <div class="surah-name-ar">${surah.name.replace('╪│┘Å┘ê╪▒┘Ä╪⌐┘Å ', '')}</div>
          <div class="surah-verses">${surah.numberOfAyahs} ayahs</div>
        </div>
      `;
      surahListEl.appendChild(item);
    });
  }

  function filterSurahs(query) {
    query = query.toLowerCase();
    const filtered = surahs.filter(s =>
      s.englishName.toLowerCase().includes(query) ||
      s.englishNameTranslation.toLowerCase().includes(query) ||
      s.number.toString() === query
    );
    renderSurahList(filtered);
  }

  // ΓöÇΓöÇ Load Surah ΓöÇΓöÇ
  async function loadSurah(number) {
    if (currentSurahNumber === number) return;

    // Update state & UI
    currentSurahNumber = number;
    const surahMeta = surahs.find(s => s.number === number);
    
    // Highlight list item
    document.querySelectorAll('.surah-item').forEach(el => el.classList.remove('active'));
    // We re-render the whole list to ensure the active class is set properly if it was filtered
    renderSurahList(surahs);

    // Update Header
    document.getElementById('surahTitleAr').textContent = surahMeta.name;
    document.getElementById('surahTitleEn').textContent = surahMeta.englishName;
    document.getElementById('surahInfoBar').innerHTML = `
      <span>≡ƒô£ ${surahMeta.revelationType}</span>
      <span>ΓÇó</span>
      <span>${surahMeta.numberOfAyahs} Verses</span>
      <span>ΓÇó</span>
      <button class="btn btn-sm btn-secondary" onclick="window.QuranModule.togglePlaySurah()" id="playSurahBtn">
        <span class="icon"><svg class="nav-icon svg-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span> Play
      </button>
    `;

    document.getElementById('quranControls').style.display = 'flex';
    document.getElementById('bismillahDisplay').style.display = (number !== 1 && number !== 9) ? 'block' : 'none';
    
    verseContainerEl.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><span class="loading-text">Loading verses...</span></div>`;
    
    // Stop any playing audio
    stopAudio();
    
    // Scroll to top
    verseContainerEl.parentElement.scrollTop = 0;

    if (window.innerWidth <= 768) {
      // Scroll past the sidebar on mobile
      verseContainerEl.scrollIntoView({ behavior: 'smooth' });
    }

    try {
      surahData = await window.HudaAPI.getSurahWithTranslation(number);
      renderVerses();
    } catch (err) {
      console.error("Failed to load surah verses", err);
      verseContainerEl.innerHTML = `<div class="empty-state">Failed to load verses. Please try again.</div>`;
    }
  }

  // ΓöÇΓöÇ Render Verses ΓöÇΓöÇ
  function renderVerses() {
    if (!surahData || surahData.length < 2) return;
    
    const arabicVerses = surahData[0].ayahs;
    const englishVerses = surahData[1].ayahs;
    const audioData = surahData[2] ? surahData[2].ayahs : [];
    
    audioUrls = arabicVerses.map(a => {
      // Fallback to EveryAyah direct generation always to ensure reliability
      return getEveryAyahUrl(currentReciter, currentSurahNumber, a.numberInSurah);
    });
    
    verseContainerEl.innerHTML = '';
    
    for (let i = 0; i < arabicVerses.length; i++) {
      const ar = arabicVerses[i];
      const en = englishVerses[i];
      
      // Remove basmalah from first verse of every surah (except Al-Fatiha)
      let arText = ar.text;
      if (i === 0 && currentSurahNumber !== 1) {
        arText = arText.replace(/^╪¿┘É╪│┘Æ┘à┘É ┘▒┘ä┘ä┘Ä┘æ┘ç┘É ┘▒┘ä╪▒┘Ä┘æ╪¡┘Æ┘à┘Ä┘░┘å┘É ┘▒┘ä╪▒┘Ä┘æ╪¡┘É┘è┘à┘É /, '');
      }

      const verseEl = document.createElement('div');
      verseEl.className = 'verse-card stagger-children';
      verseEl.id = `verse-${i}`;
      
      // Allow clicking a verse to play it
      verseEl.onclick = () => playAyahIndex(i);
      verseEl.style.cursor = 'pointer';
      
      verseEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-3);">
          <div class="verse-number">${ar.numberInSurah}</div>
          <div class="verse-reference" style="display: flex; gap: 8px; align-items: center;">
            <button onclick="window.QuranModule.saveBookmark(${currentSurahNumber}, ${i}); event.stopPropagation();" title="Bookmark Ayah" style="background: none; border: none; color: var(--color-emerald); cursor: pointer; padding: 4px; opacity: 0.7; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
              <svg class="nav-icon svg-icon" style="width: 1.2rem; height: 1.2rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            </button>
            <span class="ref-tag" style="background: var(--color-bg-secondary); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">
              <span class="play-icon"><svg class="nav-icon svg-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span> ${currentSurahNumber}:${ar.numberInSurah}
            </span>
          </div>
        </div>
        <div class="verse-arabic">${arText}</div>
        <div class="verse-translation">${en.text}</div>
      `;
      verseContainerEl.appendChild(verseEl);
    }
  }

  // ΓöÇΓöÇ Audio Controls ΓöÇΓöÇ
  function togglePlaySurah() {
    if (isPlaying) {
      pauseAudio();
    } else {
      if (currentAyahIndex >= audioUrls.length) currentAyahIndex = 0;
      
      const surahMeta = surahs.find(s => s.number === currentSurahNumber);

      // If we are starting from the very beginning, play Basmalah first
      if (currentAyahIndex === 0 && currentSurahNumber !== 1 && currentSurahNumber !== 9) {
        isPlayingBasmalah = true;
        audioPlayerEl.src = BASMALAH_AUDIO_URL;
        audioPlayerEl.play().catch(e => console.error("Basmalah playback failed", e));
        updatePlayButtonState(true);
        highlightVerse(-2); // -2 is a special code for Basmalah
        if (surahMeta) updateMediaSession(surahMeta, 0, true);
      } else {
        playAyahIndex(currentAyahIndex);
      }
    }
  }
  
  function updatePlayButtonState(playing) {
    isPlaying = playing;
    const btn = document.getElementById('playSurahBtn');
    const stickyBtn = document.getElementById('stickyPlayBtn');
    if (btn) {
      btn.innerHTML = playing ? `<span class="icon"><svg class="nav-icon svg-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg></span> Pause` : `<span class="icon"><svg class="nav-icon svg-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span> Play`;
    }
    if (stickyBtn) {
      stickyBtn.innerHTML = playing ? `<svg class="nav-icon svg-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>` : `<svg class="nav-icon svg-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    }
    
    const stickyPlayer = document.getElementById('stickyAudioPlayer');
    if (stickyPlayer) {
      stickyPlayer.style.display = (currentAyahIndex >= 0 || playing) ? 'block' : 'none';
      if (!playing && currentAyahIndex === 0 && !audioUrls[0]) {
          stickyPlayer.style.display = 'none';
      }
    }
    
    if (navigator.mediaSession) {
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    }
  }

  function updateMediaSession(surahMeta, index, isBasmalah = false) {
    if ('mediaSession' in navigator) {
      const reciterMap = {
        'ar.alafasy': 'Mishary Alafasy',
        'ar.mahermuaiqly': 'Maher Al-Muaiqly',
        'ar.abdulbasitmurattal': 'Abdul Basit (Murattal)',
        'ar.dosari': 'Yasser Ad-Dussary'
      };
      const reciterName = reciterMap[currentReciter] || 'Reciter';
      const ayahTitle = isBasmalah ? 'Basmalah' : `Ayah ${index + 1}`;
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: ayahTitle,
        artist: `${surahMeta.englishName} - ${reciterName}`,
        album: 'Huda - The Guidance',
        artwork: [
          { src: './logo.png', sizes: '192x192', type: 'image/png' },
          { src: './logo.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => togglePlaySurah());
      navigator.mediaSession.setActionHandler('pause', () => pauseAudio());
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrevAyah());
      navigator.mediaSession.setActionHandler('nexttrack', () => playNextAyah());
    }
  }

  function playAyahIndex(index) {
    if (!audioUrls || audioUrls.length === 0 || index >= audioUrls.length) return;
    
    isPlayingBasmalah = false;
    currentAyahIndex = index;
    audioPlayerEl.src = audioUrls[index];
    audioPlayerEl.play().catch(e => console.error("Audio playback failed", e));
    
    // Preload next ayah to eliminate pause
    if (index + 1 < audioUrls.length) {
      let preloader = document.getElementById('quranAudioPreloader');
      if (!preloader) {
        preloader = document.createElement('audio');
        preloader.id = 'quranAudioPreloader';
        preloader.style.display = 'none';
        document.body.appendChild(preloader);
      }
      preloader.src = audioUrls[index + 1];
      preloader.preload = 'auto';
    }
    
    highlightVerse(index);
    updatePlayButtonState(true);

    const surahMeta = surahs.find(s => s.number === currentSurahNumber);
    if (surahMeta) updateMediaSession(surahMeta, index, false);
    
    // Auto-save last read progress quietly
    autoSaveLastRead(currentSurahNumber, index);
  }

  function pauseAudio() {
    if (audioPlayerEl) audioPlayerEl.pause();
  }

  function stopAudio() {
    if (audioPlayerEl) {
      audioPlayerEl.pause();
      audioPlayerEl.currentTime = 0;
    }
    isPlaying = false;
    isPlayingBasmalah = false;
    currentAyahIndex = 0;
    updatePlayButtonState(false);
    highlightVerse(-1);
  }

  function playNextAyah() {
    if (isPlayingBasmalah) {
      isPlayingBasmalah = false;
      playAyahIndex(0);
      return;
    }
    
    if (currentAyahIndex < audioUrls.length - 1) {
      playAyahIndex(currentAyahIndex + 1);
    } else {
      // Finished surah
      stopAudio();
    }
  }

  function playPrevAyah() {
    if (currentAyahIndex > 0) {
      playAyahIndex(currentAyahIndex - 1);
    } else {
      stopAudio();
    }
  }

  function highlightVerse(index) {
    document.querySelectorAll('.verse-card').forEach(el => el.classList.remove('playing'));
    const bismillahDisplay = document.getElementById('bismillahDisplay');
    if (bismillahDisplay) bismillahDisplay.style.opacity = '1';

    if (index === -2) {
      // Highlighting Basmalah
      if (bismillahDisplay) {
        bismillahDisplay.style.opacity = '0.5';
        bismillahDisplay.style.transition = 'opacity 0.3s ease';
        // Make it glow a bit while playing
        bismillahDisplay.style.textShadow = '0 0 15px rgba(16, 185, 129, 0.5)';
      }
      
      const stickyName = document.getElementById('audioNowPlaying');
      const stickyAyah = document.getElementById('audioAyahNumber');
      if (stickyName) stickyName.textContent = "Bismillah";
      if (stickyAyah) stickyAyah.textContent = "";
      
      const stickyPlayer = document.getElementById('stickyAudioPlayer');
      if (stickyPlayer) stickyPlayer.style.display = 'block';
    } else if (index >= 0) {
      if (bismillahDisplay) bismillahDisplay.style.textShadow = 'none';
      
      const el = document.getElementById(`verse-${index}`);
      if (el) {
        el.classList.add('playing');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      const stickyName = document.getElementById('audioNowPlaying');
      const stickyAyah = document.getElementById('audioAyahNumber');
      const surahMeta = surahs.find(s => s.number === currentSurahNumber);
      if (stickyName && surahMeta) stickyName.textContent = surahMeta.englishName;
      if (stickyAyah && surahData) stickyAyah.textContent = `Ayah ${surahData[0].ayahs[index].numberInSurah}`;
      
      const stickyPlayer = document.getElementById('stickyAudioPlayer');
      if (stickyPlayer) stickyPlayer.style.display = 'block';
    } else {
      const stickyPlayer = document.getElementById('stickyAudioPlayer');
      if (stickyPlayer) stickyPlayer.style.display = 'none';
    }
  }

  // ΓöÇΓöÇ Font Size Controls ΓöÇΓöÇ
  function adjustFont(type, change) {
    const root = document.documentElement;
    if (type === 'arabic') {
      const currentSize = parseFloat(getComputedStyle(root).getPropertyValue('--arabic-size'));
      let newSize = currentSize + (change * 0.25);
      if (newSize > 3) newSize = 3;
      if (newSize < 1) newSize = 1;
      root.style.setProperty('--arabic-size', `${newSize}rem`);
    } else {
      const currentSize = parseFloat(getComputedStyle(root).getPropertyValue('--translation-size'));
      let newSize = currentSize + (change * 0.125);
      if (newSize > 1.5) newSize = 1.5;
      if (newSize < 0.75) newSize = 0.75;
      root.style.setProperty('--translation-size', `${newSize}rem`);
    }
  }

  // ΓöÇΓöÇ Navigation Controls ΓöÇΓöÇ
  function prevSurah() {
    if (currentSurahNumber > 1) {
      loadSurah(currentSurahNumber - 1);
    }
  }

  function nextSurah() {
    if (currentSurahNumber < 114) {
      loadSurah(currentSurahNumber + 1);
    }
  }

  // ΓöÇΓöÇ Reload Language ΓöÇΓöÇ
  function reloadLang() {
    if (currentSurahNumber) {
      const num = currentSurahNumber;
      currentSurahNumber = null; // Clear so it fetches again
      loadSurah(num);
    }
    if (surahs.length > 0) {
      renderSurahList(surahs);
    }
  }

  function saveBookmark(surahNumber, ayahIndex) {
    const bookmark = { surah: surahNumber, ayah: ayahIndex, timestamp: Date.now() };
    
    // Save to bookmarks array
    let bookmarks = [];
    try {
      const stored = localStorage.getItem('huda_bookmarks');
      if (stored) bookmarks = JSON.parse(stored);
    } catch(e) {}
    
    // Check if already exists to avoid duplicates
    const exists = bookmarks.findIndex(b => b.surah === surahNumber && b.ayah === ayahIndex);
    if (exists !== -1) {
      bookmarks.splice(exists, 1); // Remove if exists so we can add it fresh at the top
    }
    
    bookmarks.unshift(bookmark); // Add to beginning
    localStorage.setItem('huda_bookmarks', JSON.stringify(bookmarks));
    window.HudaApp.showToast(`Saved Bookmark for Surah ${surahNumber}, Ayah ${ayahIndex + 1}`, 'success');
    
    // Provide visual feedback
    const verseEl = document.getElementById(`verse-${ayahIndex}`);
    if (verseEl) {
      verseEl.style.transition = 'box-shadow 0.3s ease';
      verseEl.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.5)';
      setTimeout(() => verseEl.style.boxShadow = 'none', 1000);
    }
  }

  function deleteBookmark(index) {
    try {
      const stored = localStorage.getItem('huda_bookmarks');
      if (stored) {
        let bookmarks = JSON.parse(stored);
        bookmarks.splice(index, 1);
        localStorage.setItem('huda_bookmarks', JSON.stringify(bookmarks));
        
        // Re-render the initial view if we are on the default screen
        if (!currentSurahNumber) {
          init();
        }
      }
    } catch(e) {}
  }

  function autoSaveLastRead(surahNumber, ayahIndex) {
    const lastRead = { surah: surahNumber, ayah: ayahIndex, timestamp: Date.now() };
    localStorage.setItem('huda_last_read', JSON.stringify(lastRead));
  }

  function changeReciter(reciter) {
    localStorage.setItem('huda_quran_reciter', reciter);
    currentReciter = reciter;
    BASMALAH_AUDIO_URL = getEveryAyahUrl(currentReciter, 1, 1);
    
    if (currentSurahNumber && surahData) {
      const arabicVerses = surahData[0].ayahs;
      audioUrls = arabicVerses.map(a => {
        return getEveryAyahUrl(currentReciter, currentSurahNumber, a.numberInSurah);
      });
      
      if (isPlaying && audioPlayerEl) {
        if (isPlayingBasmalah) {
          audioPlayerEl.src = BASMALAH_AUDIO_URL;
        } else {
          audioPlayerEl.src = audioUrls[currentAyahIndex];
        }
        audioPlayerEl.play().catch(e => console.error("Playback failed", e));
      }
    }
  }

  return {
    init,
    loadSurah,
    stopAudio,
    playNextAyah,
    playPrevAyah,
    adjustFont,
    prevSurah,
    nextSurah,
    togglePlaySurah,
    reloadLang,
    saveBookmark,
    deleteBookmark,
    changeReciter
  };
})();
