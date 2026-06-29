/* ══════════════════════════════════════════════════════════════
   HUDA — Prayer Module (Prayer Times, Qiblah, Prayer Guide)
   ══════════════════════════════════════════════════════════════ */

window.PrayerModule = (() => {
  let prayerTimesData = null;
  let countdownInterval = null;
  let nextPrayer = null;
  
  // ── Initialization for Prayer Times ──
  async function initPrayerTimes() {
    updateDateInfo();
    
    // Check if we have manual location saved
    const manualLoc = getSavedLocation();
    if (manualLoc) {
      loadPrayerTimesByCity(manualLoc.city, manualLoc.country);
    } else {
      // Try Geolocation
      try {
        const pos = await window.HudaAPI.getUserLocation();
        loadPrayerTimesByCoords(pos.lat, pos.lon);
      } catch (err) {
        document.getElementById('prayerLocationText').textContent = 'Location access denied. Please enter manually.';
      }
    }
  }

  function getSavedLocation() {
    try {
      const saved = localStorage.getItem('huda_location');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  }

  function getSettings() {
    const method = document.getElementById('calcMethod').value || 4;
    const school = document.getElementById('asrMethod').value || 0;
    return { method, school };
  }

  // ── Load Data ──
  async function loadPrayerTimesByCoords(lat, lon) {
    document.getElementById('prayerLocationText').textContent = 'Location: Detected automatically';
    const settings = getSettings();
    try {
      prayerTimesData = await window.HudaAPI.getPrayerTimes(lat, lon, settings.method, settings.school);
      renderPrayerTimes();
    } catch (err) {
      console.error(err);
      window.HudaApp.showToast('Failed to load prayer times', 'error');
    }
  }

  async function loadPrayerTimesByCity(city, country) {
    document.getElementById('prayerLocationText').textContent = `Location: ${city}, ${country}`;
    const settings = getSettings();
    try {
      prayerTimesData = await window.HudaAPI.getPrayerTimesByCity(city, country, settings.method, settings.school);
      // Save manual location
      localStorage.setItem('huda_location', JSON.stringify({ city, country }));
      renderPrayerTimes();
    } catch (err) {
      console.error(err);
      window.HudaApp.showToast('Failed to load prayer times for this location', 'error');
    }
  }

  async function setManualLocation() {
    const city = document.getElementById('manualCity').value.trim();
    const country = document.getElementById('manualCountry').value.trim();
    if (city && country) {
      await loadPrayerTimesByCity(city, country);
      const modal = document.getElementById('prayerSettingsModal');
      if (modal) modal.classList.add('hidden');
      window.HudaApp.showToast('Location saved!', 'success');
    } else {
      window.HudaApp.showToast('Please enter both city and country', 'error');
    }
  }

  function refreshPrayerTimes() {
    const manualLoc = getSavedLocation();
    if (manualLoc) {
      loadPrayerTimesByCity(manualLoc.city, manualLoc.country);
    } else {
      window.HudaAPI.getUserLocation().then(pos => {
        loadPrayerTimesByCoords(pos.lat, pos.lon);
      }).catch(() => {
        window.HudaApp.showToast('Location required to update times', 'error');
      });
    }
  }

  // ── Render Prayer Times ──
  function renderPrayerTimes() {
    if (!prayerTimesData) return;
    
    const timings = prayerTimesData.timings;
    if (!timings) return;
    const container = document.getElementById('prayerTimesContainer');
    if (!container) return;
    
    const prayers = [
      { name: 'Fajr', time: timings.Fajr, icon: '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8"></path><path d="M12 14v8"></path><path d="M4.93 4.93l5.66 5.66"></path><path d="M13.41 13.41l5.66 5.66"></path><path d="M2 12h8"></path><path d="M14 12h8"></path><path d="M4.93 19.07l5.66-5.66"></path><path d="M13.41 10.59l5.66-5.66"></path></svg>' },
      { name: 'Sunrise', time: timings.Sunrise, icon: '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8"></path><path d="M4.93 10.93l2.83 2.83"></path><path d="M2 18h20"></path><path d="M16.24 13.76l2.83-2.83"></path><path d="M8 22h8"></path></svg>' },
      { name: 'Dhuhr', time: timings.Dhuhr, icon: '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>' },
      { name: 'Asr', time: timings.Asr, icon: '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M5 5l1.5 1.5"></path><path d="M17.5 17.5L19 19"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M5 19l1.5-1.5"></path><path d="M17.5 6.5L19 5"></path></svg>' },
      { name: 'Maghrib', time: timings.Maghrib, icon: '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 18a5 5 0 0 0-10 0"></path><line x1="12" y1="2" x2="12" y2="9"></line><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"></line><line x1="1" y1="18" x2="3" y2="18"></line><line x1="21" y1="18" x2="23" y2="18"></line><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"></line><line x1="23" y1="22" x2="1" y2="22"></line><polyline points="16 5 12 9 8 5"></polyline></svg>' },
      { name: 'Isha', time: timings.Isha, icon: '<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>' }
    ];
    
    container.innerHTML = '';
    
    const now = new Date();
    nextPrayer = null;
    let nextPrayerTimeMs = Infinity;
    
    prayers.forEach(prayer => {
      // Parse time (format HH:mm)
      const [h, m] = prayer.time.split(':').map(Number);
      const prayerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      
      // Convert to 12h format for display
      const displayTime = format12Hour(h, m);
      
      const el = document.createElement('div');
      el.className = 'prayer-time-card';
      
      // Determine if this is the next prayer
      if (prayerDate > now && prayerDate.getTime() < nextPrayerTimeMs && prayer.name !== 'Sunrise') {
        nextPrayer = prayer;
        nextPrayerTimeMs = prayerDate.getTime();
      }
      
      // Adhan state
      const adhanState = localStorage.getItem(`huda_adhan_${prayer.name}`) !== 'off'; // default on
      const bellOn = `<svg class="svg-icon" style="width: 1.2rem; height: 1.2rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;
      const bellOff = `<svg class="svg-icon" style="width: 1.2rem; height: 1.2rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path><path d="M18 8a6 6 0 0 0-9.33-5"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
      
      const alarmBtn = prayer.name !== 'Sunrise' ? 
        `<button class="alarm-toggle-btn" onclick="window.PrayerModule.toggleAlarm('${prayer.name}', this)" style="background:none; border:none; cursor:pointer; color: ${adhanState ? 'var(--color-emerald)' : 'var(--color-text-muted)'}; opacity: 0.8; padding: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
           ${adhanState ? bellOn : bellOff}
         </button>` : '<div style="width: 1.2rem; padding: 4px;"></div>';

      el.innerHTML = `
        <div class="flex items-center gap-4">
          <div class="prayer-icon">${prayer.icon}</div>
          <div class="prayer-name">${prayer.name}</div>
        </div>
        <div class="flex items-center gap-3">
          <div class="prayer-time">${displayTime}</div>
          ${alarmBtn}
        </div>
      `;
      container.appendChild(el);
    });
    
    // If no next prayer today, it means next is Fajr tomorrow
    if (!nextPrayer) {
      nextPrayer = prayers[0];
      const [h, m] = nextPrayer.time.split(':').map(Number);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(h, m, 0);
      nextPrayerTimeMs = tomorrow.getTime();
    }
    
    // Highlight next prayer card
    const cards = container.querySelectorAll('.prayer-time-card');
    cards.forEach(card => {
      if (card.querySelector('.prayer-name').textContent === nextPrayer.name) {
        card.classList.add('current');
      }
    });
    
    document.getElementById('nextPrayerName').textContent = nextPrayer.name;
    startCountdown(nextPrayerTimeMs);
  }

  function getQiblaDirection(lat, lng) {
    const makkahLat = 21.4225;
    const makkahLng = 39.8262;

    const latRad = lat * Math.PI / 180;
    const makkahLatRad = makkahLat * Math.PI / 180;
    const dLng = (makkahLng - lng) * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(makkahLatRad);
    const x = Math.cos(latRad) * Math.sin(makkahLatRad) - Math.sin(latRad) * Math.cos(makkahLatRad) * Math.cos(dLng);
    
    let qibla = Math.atan2(y, x) * 180 / Math.PI;
    return (qibla + 360) % 360;
  }
  
  function toggleAlarm(prayerName, btnEl) {
    let currentState = localStorage.getItem(`huda_adhan_${prayerName}`) !== 'off'; // true if on
    let newState = !currentState;
    localStorage.setItem(`huda_adhan_${prayerName}`, newState ? 'on' : 'off');
    
    // Update icon
    const bellOn = `<svg class="svg-icon" style="width: 1.2rem; height: 1.2rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;
    const bellOff = `<svg class="svg-icon" style="width: 1.2rem; height: 1.2rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path><path d="M18 8a6 6 0 0 0-9.33-5"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    
    btnEl.innerHTML = newState ? bellOn : bellOff;
    btnEl.style.color = newState ? 'var(--color-emerald)' : 'var(--color-text-muted)';
    
    // Add brief animation
    btnEl.style.transform = 'scale(1.2)';
    setTimeout(() => btnEl.style.transform = 'scale(1)', 200);
  }

  function format12Hour(h, m) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hours = h % 12 || 12;
    const mins = m < 10 ? '0' + m : m;
    return `${hours}:${mins} ${ampm}`;
  }

  function updateDateInfo() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('todayDateInfo').textContent = now.toLocaleDateString(undefined, options);
  }

  function startCountdown(targetTimeMs) {
    if (countdownInterval) clearInterval(countdownInterval);
    
    const el = document.getElementById('prayerCountdown');
    if (!el) return;

    function update() {
      const now = Date.now();
      const diff = targetTimeMs - now;
      
      if (diff <= 0) {
        el.textContent = '00:00:00';
        clearInterval(countdownInterval);
        
        // Play Adhan if enabled globally AND for this specific prayer
        const adhanSelect = document.getElementById('adhanAlert');
        const isGlobalEnabled = adhanSelect && adhanSelect.value === '1';
        
        // nextPrayer represents the prayer that JUST arrived
        const isPrayerEnabled = nextPrayer && localStorage.getItem(`huda_adhan_${nextPrayer.name}`) !== 'off';

        if (isGlobalEnabled && isPrayerEnabled && nextPrayer.name !== 'Sunrise') {
          const adhanAudio = document.getElementById('adhanAudioPlayer');
          if (adhanAudio) {
            const voice = localStorage.getItem('huda_adhan_voice') || 'makkah';
            let url = 'https://media.blubrry.com/muslim_central_adhan/content.blubrry.com/muslim_central_adhan/Adhan_Makkah.mp3';
            if (voice === 'madinah') url = 'https://media.blubrry.com/muslim_central_adhan/content.blubrry.com/muslim_central_adhan/Adhan_Madinah.mp3';
            else if (voice === 'alaqsa') url = 'https://media.blubrry.com/muslim_central_adhan/content.blubrry.com/muslim_central_adhan/Adhan_Al_Aqsa.mp3';
            
            // Fajr specific adhan
            if (nextPrayer.name === 'Fajr') {
              url = 'https://archive.org/download/adhan.recordings.from.doha.qatar/Adhan_Doha_Qatar_01_Fajr_Adhan.mp3';
            }
            
            adhanAudio.src = url;
            adhanAudio.play().catch(e => console.error("Adhan play blocked:", e));
            
            const adhanModal = document.getElementById('adhanPlayingModal');
            const nameDisplay = document.getElementById('adhanPrayerNameDisplay');
            if (nameDisplay) nameDisplay.textContent = nextPrayer.name;
            if (adhanModal) {
              adhanModal.classList.remove('hidden');
            }
          }
        }

        // Refresh after a minute to get next day's times if needed
        setTimeout(refreshPrayerTimes, 60000);
        return;
      }
      
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      el.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    
    update();
    countdownInterval = setInterval(update, 1000);
  }

  // 🧭 Initialization for Qiblah 🧭
  let currentAlpha = 0;
  let targetAlpha = 0;
  let qiblahDirection = 0;
  let isAligned = false;
  let compassAnimFrame = null;

  function animateCompass() {
    currentAlpha += (targetAlpha - currentAlpha) * 0.1; // Smooth interpolation
    const ring = document.getElementById('compassContainer');
    if (ring) {
      ring.style.transform = `rotate(${-currentAlpha}deg)`;
      
      // Check alignment (within 5 degrees)
      let diff = Math.abs((currentAlpha % 360) - (qiblahDirection % 360));
      if (diff > 180) diff = 360 - diff;
      
      if (diff < 5) {
        if (!isAligned) {
          isAligned = true;
          ring.style.boxShadow = '0 0 80px rgba(212, 175, 55, 0.6), inset 0 0 50px rgba(212, 175, 55, 0.4)';
          ring.style.borderColor = 'rgba(212, 175, 55, 0.8)';
          if (navigator.vibrate) navigator.vibrate(50);
        }
      } else {
        if (isAligned) {
          isAligned = false;
          ring.style.boxShadow = '0 0 50px rgba(16,185,129,0.1), inset 0 0 30px rgba(0,0,0,0.5)';
          ring.style.borderColor = 'rgba(16,185,129,0.3)';
        }
      }
    }
    compassAnimFrame = requestAnimationFrame(animateCompass);
  }

  async function initQiblah() {
    try {
      const pos = await window.HudaAPI.getUserLocation();
      const data = await window.HudaAPI.getQiblahDirection(pos.lat, pos.lon);
      
      qiblahDirection = data.direction; // Bearing in degrees
      
      document.getElementById('qiblahStatus').textContent = 'Qiblah bearing from True North:';
      document.getElementById('qiblahDegrees').innerHTML = `${qiblahDirection.toFixed(1)}&deg;`;
      
      // Animate needle
      const needle = document.getElementById('compassNeedle');
      if (needle) {
        needle.style.transform = `translateX(-50%) rotate(${qiblahDirection}deg)`;
      }
      
      // Device orientation (for mobile)
      if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (e) => {
          let alpha = null;
          // Check for iOS webkitCompassHeading
          if (e.webkitCompassHeading) {
            alpha = e.webkitCompassHeading;
          } else if (e.alpha !== null) {
            // Android/standard
            alpha = 360 - e.alpha; 
          }
          
          if (alpha !== null) {
            targetAlpha = alpha;
          }
        }, true);
      } else if (window.DeviceOrientationAbsoluteEvent) {
        window.addEventListener('deviceorientationabsolute', (e) => {
          if (e.alpha !== null) targetAlpha = 360 - e.alpha;
        }, true);
      }
      
      if (!compassAnimFrame) {
        animateCompass();
      }
      
    } catch (err) {
      document.getElementById('qiblahStatus').textContent = 'Location access denied. Cannot calculate Qiblah.';
      document.getElementById('qiblahDegrees').textContent = '---°';
    }
  }

  // ── Initialization for Prayer Guide ──
  function initGuide() {
    showGuide('wudu');
  }

  function showGuide(type) {
    // Update tabs
    document.querySelectorAll('#prayerGuideTabs .tab').forEach(el => {
      el.classList.toggle('active', el.dataset.guide === type);
    });
    
    const container = document.getElementById('prayerGuideContent');
    const imamContainer = document.getElementById('imamModeContainer');
    
    if (type === 'imam') {
      container.innerHTML = '';
      container.style.display = 'none';
      renderImamSelector();
      return;
    }
    
    container.style.display = '';
    if (imamContainer) imamContainer.innerHTML = '';
    container.innerHTML = '';
    
    let content = '';
    
    if (type === 'wudu') {
      content = `
        <div class="prayer-step">
          <div class="step-number">1</div>
          <div class="step-content">
            <div class="step-title">Intention & Bismillah</div>
            <div class="step-description">Make the intention (in your heart) to perform Wudu. Then say:</div>
            <div class="step-arabic">بِسْمِ اللَّهِ</div>
            <div class="step-transliteration">Bismillāh (In the Name of Allah)</div>
            <div class="step-evidence">📖 "There is no Wudu for him who does not mention Allah's Name upon it." (Abu Dawud 101, Sahih)</div>
          </div>
        </div>
        <div class="prayer-step">
          <div class="step-number">2</div>
          <div class="step-content">
            <div class="step-title">Wash Hands</div>
            <div class="step-description">Wash both hands up to the wrists three times, ensuring water reaches between the fingers.</div>
          </div>
        </div>
        <div class="prayer-step">
          <div class="step-number">3</div>
          <div class="step-content">
            <div class="step-title">Rinse Mouth & Nose</div>
            <div class="step-description">Take water into your mouth and nose with the right hand, rinse, and expel it using the left hand. Do this three times.</div>
            <div class="step-evidence">📖 Based on the description of the Prophet's Wudu by 'Uthman (Bukhari 159)</div>
          </div>
        </div>
        <div class="prayer-step">
          <div class="step-number">4</div>
          <div class="step-content">
            <div class="step-title">Wash Face</div>
            <div class="step-description">Wash your entire face three times. From the hairline to the chin, and from ear to ear.</div>
          </div>
        </div>
        <div class="prayer-step">
          <div class="step-number">5</div>
          <div class="step-content">
            <div class="step-title">Wash Arms</div>
            <div class="step-description">Wash your right arm completely up to and including the elbow, three times. Then do the same for the left arm.</div>
          </div>
        </div>
        <div class="prayer-step">
          <div class="step-number">6</div>
          <div class="step-content">
            <div class="step-title">Wipe Head & Ears</div>
            <div class="step-description">With wet hands, wipe your head from front to back and back to front once. Then wipe the inside of your ears with your index fingers and the outside with your thumbs.</div>
          </div>
        </div>
        <div class="prayer-step">
          <div class="step-number">7</div>
          <div class="step-content">
            <div class="step-title">Wash Feet</div>
            <div class="step-description">Wash your right foot completely up to and including the ankle, three times. Ensure water reaches between the toes. Repeat for the left foot.</div>
            <div class="step-evidence">📖 Qur'an 5:6 — "O you who have believed, when you rise to [perform] prayer, wash your faces and your forearms to the elbows and wipe over your heads and wash your feet to the ankles."</div>
          </div>
        </div>
        <div class="prayer-step">
          <div class="step-number">8</div>
          <div class="step-content">
            <div class="step-title">Supplication after Wudu</div>
            <div class="step-arabic">أَشْهَدُ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ</div>
            <div class="step-transliteration">Ash-hadu an lā ilāha illallāhu waḥdahu lā sharīka lah, wa ash-hadu anna Muḥammadan 'abduhu wa rasūluh.</div>
            <div class="step-translation" style="font-size: var(--text-sm); margin-top: var(--space-2); color: var(--color-text-secondary);">"I bear witness that none has the right to be worshipped except Allah, alone without partner, and I bear witness that Muhammad is His slave and Messenger."</div>
            <div class="step-evidence">📖 "Whoever performs Wudu well... and says this, the eight gates of Paradise will be opened for him." (Muslim 234)</div>
          </div>
        </div>
      `;
    } else if (type === 'salah') {
      content = `
        <div class="prayer-step">
          <div class="step-number">1</div>
          <div class="step-content">
            <div class="step-title">Takbiratul Ihram</div>
            <div class="step-description">Face the Qiblah, make the intention in your heart, raise your hands to your earlobes/shoulders, and say:</div>
            <div class="step-arabic">اللَّهُ أَكْبَرُ</div>
            <div class="step-transliteration">Allāhu Akbar (Allah is the Most Great)</div>
          </div>
        </div>
        <div class="prayer-step">
          <div class="step-number">2</div>
          <div class="step-content">
            <div class="step-title">Opening Supplication & Fatiha</div>
            <div class="step-description">Place your right hand over your left on your chest. Recite the opening dua, seek refuge in Allah, say Bismillah, and recite Surah Al-Fatiha (mandatory). Follow with another Surah if it's the 1st or 2nd rak'ah.</div>
            <div class="step-evidence">📖 "There is no prayer for the one who does not recite the Opening of the Book [Al-Fatiha]." (Bukhari 756)</div>
          </div>
        </div>
        <div class="prayer-step">
          <div class="step-number">3</div>
          <div class="step-content">
            <div class="step-title">Ruku' (Bowing)</div>
            <div class="step-description">Say Allahu Akbar and bow, placing hands on knees with a straight back. Say 3 times:</div>
            <div class="step-arabic">سُبْحَانَ رَبِّيَ الْعَظِيمِ</div>
            <div class="step-transliteration">Subḥāna Rabbiyal-'Aẓīm (Glory to my Lord the Exalted)</div>
          </div>
        </div>
        <div class="prayer-step">
          <div class="step-number">4</div>
          <div class="step-content">
            <div class="step-title">Rising from Ruku'</div>
            <div class="step-description">Stand up straight and say:</div>
            <div class="step-arabic">سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ</div>
            <div class="step-transliteration">Sami'allāhu liman ḥamidah (Allah hears whoever praises Him)</div>
            <div class="step-description" style="margin-top: var(--space-2);">Then say:</div>
            <div class="step-arabic">رَبَّنَا وَلَكَ الْحَمْدُ</div>
            <div class="step-transliteration">Rabbanā wa lakal-ḥamd (Our Lord, to You be all praise)</div>
          </div>
        </div>
        <div class="prayer-step">
          <div class="step-number">5</div>
          <div class="step-content">
            <div class="step-title">Sujud (Prostration)</div>
            <div class="step-description">Say Allahu Akbar and prostrate, touching forehead, nose, both palms, knees, and toes to the ground. Say 3 times:</div>
            <div class="step-arabic">سُبْحَانَ رَبِّيَ الأَعْلَى</div>
            <div class="step-transliteration">Subḥāna Rabbiyal-A'lā (Glory to my Lord the Most High)</div>
          </div>
        </div>
        <div class="prayer-step">
          <div class="step-number">6</div>
          <div class="step-content">
            <div class="step-title">Sitting between Sujud</div>
            <div class="step-description">Say Allahu Akbar and sit up. Say:</div>
            <div class="step-arabic">رَبِّ اغْفِرْ لِي رَبِّ اغْفِرْ لِي</div>
            <div class="step-transliteration">Rabbighfir lī, Rabbighfir lī (My Lord forgive me, my Lord forgive me)</div>
            <div class="step-description" style="margin-top: var(--space-2);">Then perform a second Sujud like the first. This completes one Rak'ah.</div>
          </div>
        </div>
        <div class="prayer-step">
          <div class="step-number">7</div>
          <div class="step-content">
            <div class="step-title">Tashahhud (Sitting)</div>
            <div class="step-description">After the 2nd (and final) rak'ah, sit and recite the Tashahhud (Attahiyyaat). In the final rak'ah, also send blessings upon the Prophet ﷺ (Salawat) and make dua.</div>
            <div class="step-evidence">📖 Bukhari 831 (Tashahhud wording)</div>
          </div>
        </div>
        <div class="prayer-step">
          <div class="step-number">8</div>
          <div class="step-content">
            <div class="step-title">Tasleem (Concluding)</div>
            <div class="step-description">Turn your head to the right and say:</div>
            <div class="step-arabic">السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ</div>
            <div class="step-transliteration">As-salāmu 'alaykum wa raḥmatullāh (Peace and mercy of Allah be upon you)</div>
            <div class="step-description" style="margin-top: var(--space-2);">Then turn your head to the left and repeat it. The prayer is now complete.</div>
          </div>
        </div>
      `;
    } else {
      content = `
        <div class="card mb-4 text-center">
          <h4 style="font-weight: 600; color: var(--color-emerald-light); margin-bottom: var(--space-2);">The 12 Sunnah Rawatib</h4>
          <p style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-4);">"Whoever prays twelve rak'ahs during the day and night, a house will be built for him in Paradise." (Muslim 728)</p>
          
          <div class="grid grid-2 gap-4 text-left">
            <div class="p-4" style="background: var(--color-bg-tertiary); border-radius: var(--radius-lg);">
              <div style="font-weight: 700; margin-bottom: var(--space-2);">Fajr</div>
              <div style="font-size: var(--text-sm);"><strong>2</strong> Rak'ahs before Fard</div>
            </div>
            <div class="p-4" style="background: var(--color-bg-tertiary); border-radius: var(--radius-lg);">
              <div style="font-weight: 700; margin-bottom: var(--space-2);">Dhuhr</div>
              <div style="font-size: var(--text-sm);"><strong>4</strong> Rak'ahs before Fard<br><strong>2</strong> Rak'ahs after Fard</div>
            </div>
            <div class="p-4" style="background: var(--color-bg-tertiary); border-radius: var(--radius-lg);">
              <div style="font-weight: 700; margin-bottom: var(--space-2);">Maghrib</div>
              <div style="font-size: var(--text-sm);"><strong>2</strong> Rak'ahs after Fard</div>
            </div>
            <div class="p-4" style="background: var(--color-bg-tertiary); border-radius: var(--radius-lg);">
              <div style="font-weight: 700; margin-bottom: var(--space-2);">Isha</div>
              <div style="font-size: var(--text-sm);"><strong>2</strong> Rak'ahs after Fard</div>
            </div>
          </div>
        </div>
        <div class="card text-center">
          <h4 style="font-weight: 600; color: var(--color-gold-light); margin-bottom: var(--space-2);">Witr Prayer</h4>
          <p style="font-size: var(--text-sm); color: var(--color-text-secondary);">An odd number of rak'ahs (1, 3, 5, etc.) performed after Isha and before Fajr. It is a highly emphasized Sunnah.</p>
        </div>
      `;
    }
    
    container.innerHTML = content;
  }

  function stopAdhan() {
    const adhanAudio = document.getElementById('adhanAudioPlayer');
    if (adhanAudio) {
      adhanAudio.pause();
      adhanAudio.currentTime = 0;
    }
    const adhanModal = document.getElementById('adhanPlayingModal');
    if (adhanModal) {
      adhanModal.classList.add('hidden');
    }
  }

  function changeAdhanVoice(voice) {
    localStorage.setItem('huda_adhan_voice', voice);
  }

  function toggleMasterAdhan(val) {
    localStorage.setItem('huda_adhan_master', val);
  }

  // ══════════════════════════════════════════════════════════════
  //  IMAM MODE — Full Real-Time Guided Prayer with Speech
  // ══════════════════════════════════════════════════════════════

  const IMAM_PRAYERS = {
    fajr:    { name: 'Fajr',    rakahs: 2, silent: false },
    dhuhr:   { name: 'Dhuhr',   rakahs: 4, silent: true },
    asr:     { name: 'Asr',     rakahs: 4, silent: true },
    maghrib: { name: 'Maghrib', rakahs: 3, silent: false },
    isha:    { name: 'Isha',    rakahs: 4, silent: false },
    witr:    { name: 'Witr',    rakahs: 3, silent: false }
  };

  const POSITIONS = {
    standing:    { emoji: '🧍', label: 'Standing (Qiyām)' },
    bowing:      { emoji: '🙇', label: 'Bowing (Rukūʿ)' },
    prostrating: { emoji: '🤲', label: 'Prostrating (Sujūd)' },
    sitting:     { emoji: '🧎', label: 'Sitting (Julūs)' }
  };

  // ── Arabic Texts ──
  const TEXTS = {
    takbir: {
      arabic: 'اللَّهُ أَكْبَرُ',
      translit: 'Allāhu Akbar',
      translation: 'Allah is the Greatest'
    },
    openingDua: {
      arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ، وَلَا إِلَهَ غَيْرُكَ',
      translit: "Subḥānaka Allāhumma wa biḥamdika, wa tabāraka-smuka, wa ta'ālā jadduka, wa lā ilāha ghayruk",
      translation: 'Glory be to You O Allah and praise be to You. Blessed is Your Name and exalted is Your Majesty. There is no god but You.'
    },
    taawwudh: {
      arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ ﷽',
      translit: "A'ūdhu billāhi min ash-shayṭānir-rajīm. Bismillāhir-Raḥmānir-Raḥīm",
      translation: 'I seek refuge in Allah from the accursed Satan. In the Name of Allah, the Most Gracious, the Most Merciful.'
    },
    fatiha: {
      arabic: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَالَمِينَ ﴿٢﴾ ٱلرَّحْمَنِ ٱلرَّحِيمِ ﴿٣﴾ مَالِكِ يَوْمِ ٱلدِّينِ ﴿٤﴾ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴿٥﴾ ٱهْدِنَا ٱلصِّرَاطَ ٱلْمُسْتَقِيمَ ﴿٦﴾ صِرَاطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ ﴿٧﴾',
      translit: "Al-ḥamdu lillāhi Rabbil-'ālamīn. Ar-Raḥmānir-Raḥīm. Māliki yawmid-dīn. Iyyāka na'budu wa iyyāka nasta'īn. Ihdinaṣ-ṣirāṭal-mustaqīm. Ṣirāṭalladhīna an'amta 'alayhim, ghayril-maghḍūbi 'alayhim wa laḍ-ḍāllīn.",
      translation: 'All praise is due to Allah, Lord of the worlds. The Most Gracious, the Most Merciful. Master of the Day of Judgment. You alone we worship, and You alone we ask for help. Guide us to the straight path. The path of those whom You have blessed, not of those who earned Your anger, nor of those who went astray.'
    },
    ameen: {
      arabic: 'آمِين',
      translit: 'Āmīn',
      translation: 'O Allah, accept our prayer'
    },
    ikhlas: {
      arabic: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ ﴿١﴾ ٱللَّهُ ٱلصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ﴿٤﴾',
      translit: "Qul Huwallāhu Aḥad. Allāhuṣ-Ṣamad. Lam yalid wa lam yūlad. Wa lam yakun lahu kufuwan aḥad.",
      translation: 'Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born. Nor is there to Him any equivalent.'
    },
    rukuDua: {
      arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ، سُبْحَانَ رَبِّيَ الْعَظِيمِ، سُبْحَانَ رَبِّيَ الْعَظِيمِ',
      translit: "Subḥāna Rabbiyal-'Aẓīm (×3)",
      translation: 'Glory be to my Lord, the Most Great (×3)'
    },
    risingFromRuku: {
      arabic: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ، رَبَّنَا وَلَكَ الْحَمْدُ',
      translit: "Sami'allāhu liman ḥamidah. Rabbanā wa lakal-ḥamd",
      translation: 'Allah hears whoever praises Him. Our Lord, to You be all praise.'
    },
    sujudDua: {
      arabic: 'سُبْحَانَ رَبِّيَ الأَعْلَى، سُبْحَانَ رَبِّيَ الأَعْلَى، سُبْحَانَ رَبِّيَ الأَعْلَى',
      translit: "Subḥāna Rabbiyal-A'lā (×3)",
      translation: 'Glory be to my Lord, the Most High (×3)'
    },
    sittingBetweenSujud: {
      arabic: 'رَبِّ اغْفِرْ لِي، رَبِّ اغْفِرْ لِي',
      translit: 'Rabbighfir lī, Rabbighfir lī',
      translation: 'My Lord, forgive me. My Lord, forgive me.'
    },
    tashahhud: {
      arabic: 'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلاَمُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلاَمُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
      translit: "At-Taḥiyyātu lillāhi waṣ-ṣalawātu waṭ-ṭayyibāt. As-salāmu 'alayka ayyuhan-Nabiyyu wa raḥmatullāhi wa barakātuh. As-salāmu 'alaynā wa 'alā 'ibādillāhiṣ-ṣāliḥīn. Ash-hadu an lā ilāha illallāh, wa ash-hadu anna Muḥammadan 'abduhu wa rasūluh.",
      translation: 'All greetings, prayers, and good deeds are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah. I bear witness that there is no god but Allah, and I bear witness that Muhammad is His servant and Messenger.'
    },
    salawat: {
      arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ، اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
      translit: "Allāhumma ṣalli 'alā Muḥammadin wa 'alā āli Muḥammad, kamā ṣallayta 'alā Ibrāhīma wa 'alā āli Ibrāhīm, innaka Ḥamīdun Majīd. Allāhumma bārik 'alā Muḥammadin wa 'alā āli Muḥammad, kamā bārakta 'alā Ibrāhīma wa 'alā āli Ibrāhīm, innaka Ḥamīdun Majīd.",
      translation: 'O Allah, send blessings upon Muhammad and upon the family of Muhammad, as You sent blessings upon Ibrahim and the family of Ibrahim. Indeed You are Praiseworthy, Glorious. O Allah, bless Muhammad and the family of Muhammad, as You blessed Ibrahim and the family of Ibrahim. Indeed You are Praiseworthy, Glorious.'
    },
    duaBeforeSalam: {
      arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ جَهَنَّمَ، وَمِنْ عَذَابِ الْقَبْرِ، وَمِنْ فِتْنَةِ الْمَحْيَا وَالْمَمَاتِ، وَمِنْ شَرِّ فِتْنَةِ الْمَسِيحِ الدَّجَّالِ',
      translit: "Allāhumma innī a'ūdhu bika min 'adhābi Jahannam, wa min 'adhābil-qabr, wa min fitnatil-maḥyā wal-mamāt, wa min sharri fitnatil-Masīḥid-Dajjāl.",
      translation: 'O Allah, I seek refuge in You from the punishment of Hellfire, from the punishment of the grave, from the trials of life and death, and from the evil of the trial of the False Messiah.'
    },
    tasleemRight: {
      arabic: 'السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ',
      translit: "As-salāmu 'alaykum wa raḥmatullāh",
      translation: 'Peace and mercy of Allah be upon you (turning right)'
    },
    tasleemLeft: {
      arabic: 'السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ',
      translit: "As-salāmu 'alaykum wa raḥmatullāh",
      translation: 'Peace and mercy of Allah be upon you (turning left)'
    }
  };

  // Speed multipliers (base durations in ms)
  const IMAM_SPEEDS = { slow: 1.6, medium: 1.0, fast: 0.6 };
  let imamSpeed = 'medium';

  // Imam state
  let imamState = {
    active: false,
    paused: false,
    prayer: null,
    steps: [],
    currentStep: 0,
    timer: null,
    overlay: null
  };

  // ── Build prayer steps for a given prayer ──
  function buildPrayerSteps(prayerKey) {
    const prayer = IMAM_PRAYERS[prayerKey];
    const steps = [];
    const totalRakahs = prayer.rakahs;
    const isSilentPrayer = prayer.silent; // Dhuhr/Asr fully silent

    for (let r = 1; r <= totalRakahs; r++) {
      const isFirst = r === 1;
      const isLastRakah = r === totalRakahs;
      const isFirstTwo = r <= 2;
      // Silent in rak'ahs 3+ for loud prayers, or ALL rak'ahs for Dhuhr/Asr
      const isSilent = isSilentPrayer || r > 2;

      // 1. Takbiratul Ihram (only rak'ah 1)
      if (isFirst) {
        steps.push({ rakah: r, title: 'Takbīratul Iḥrām', position: 'standing', text: TEXTS.takbir, duration: 3000, silent: false });
      } else {
        // Standing takbir for subsequent rak'ahs
        steps.push({ rakah: r, title: `Rak'ah ${r} — Rising with Takbīr`, position: 'standing', text: TEXTS.takbir, duration: 2500, silent: false });
      }

      // 2. Opening Dua (only rak'ah 1)
      if (isFirst) {
        steps.push({ rakah: r, title: 'Opening Supplication (Duʿāʾ al-Istiftāḥ)', position: 'standing', text: TEXTS.openingDua, duration: 10000, silent: isSilent });
      }

      // 3. Ta'awwudh + Bismillah
      steps.push({ rakah: r, title: "Ta'awwudh & Bismillāh", position: 'standing', text: TEXTS.taawwudh, duration: 6000, silent: isSilent });

      // 4. Surah Al-Fatiha
      steps.push({ rakah: r, title: 'Sūrah Al-Fātiḥah', position: 'standing', text: TEXTS.fatiha, duration: 18000, silent: isSilent });

      // Ameen after Fatiha
      steps.push({ rakah: r, title: 'Āmīn', position: 'standing', text: TEXTS.ameen, duration: 2500, silent: isSilent });

      // 5. Additional Surah (only rak'ahs 1 & 2)
      if (isFirstTwo) {
        steps.push({ rakah: r, title: 'Sūrah Al-Ikhlāṣ', position: 'standing', text: TEXTS.ikhlas, duration: 10000, silent: isSilent });
      }

      // 6. Takbir for Ruku
      steps.push({ rakah: r, title: 'Takbīr — Going to Rukūʿ', position: 'standing', text: TEXTS.takbir, duration: 2500, silent: false });

      // 7. Ruku
      steps.push({ rakah: r, title: 'Rukūʿ (Bowing)', position: 'bowing', text: TEXTS.rukuDua, duration: 8000, silent: false });

      // 8. Rising from Ruku
      steps.push({ rakah: r, title: 'Rising from Rukūʿ', position: 'standing', text: TEXTS.risingFromRuku, duration: 5000, silent: false });

      // 9. Takbir for first Sujud
      steps.push({ rakah: r, title: 'Takbīr — Going to Sujūd', position: 'standing', text: TEXTS.takbir, duration: 2500, silent: false });

      // 10. First Sujud
      steps.push({ rakah: r, title: 'First Sujūd (Prostration)', position: 'prostrating', text: TEXTS.sujudDua, duration: 8000, silent: false });

      // 11. Sitting between sujud
      steps.push({ rakah: r, title: 'Sitting between Sujūd', position: 'sitting', text: TEXTS.sittingBetweenSujud, duration: 5000, silent: false });

      // 12. Second Sujud
      steps.push({ rakah: r, title: 'Second Sujūd (Prostration)', position: 'prostrating', text: TEXTS.sujudDua, duration: 8000, silent: false });

      // 13. Tashahhud (after 2nd rak'ah and final rak'ah)
      const needsTashahhud = (r === 2 && totalRakahs > 2) || isLastRakah;
      if (needsTashahhud) {
        steps.push({ rakah: r, title: 'Tashahhud (At-Taḥiyyāt)', position: 'sitting', text: TEXTS.tashahhud, duration: 15000, silent: false });
      }

      // 14. Final rak'ah extras
      if (isLastRakah) {
        steps.push({ rakah: r, title: 'Ṣalawāt upon the Prophet ﷺ', position: 'sitting', text: TEXTS.salawat, duration: 16000, silent: false });
        steps.push({ rakah: r, title: 'Duʿāʾ before Salām', position: 'sitting', text: TEXTS.duaBeforeSalam, duration: 12000, silent: false });
        steps.push({ rakah: r, title: 'Taslīm — Turning Right', position: 'sitting', text: TEXTS.tasleemRight, duration: 4000, silent: false });
        steps.push({ rakah: r, title: 'Taslīm — Turning Left', position: 'sitting', text: TEXTS.tasleemLeft, duration: 4000, silent: false });
      }
    }
    return steps;
  }

  // ── Render prayer selector ──
  function renderImamSelector() {
    const container = document.getElementById('imamModeContainer');
    if (!container) return;

    const prayers = [
      { key: 'fajr',    emoji: '🌅', label: 'Fajr',    info: '2 Rak\'ahs' },
      { key: 'dhuhr',   emoji: '☀️', label: 'Dhuhr',   info: '4 Rak\'ahs' },
      { key: 'asr',     emoji: '🌤️', label: 'Asr',     info: '4 Rak\'ahs' },
      { key: 'maghrib', emoji: '🌅', label: 'Maghrib', info: '3 Rak\'ahs' },
      { key: 'isha',    emoji: '🌙', label: 'Isha',    info: '4 Rak\'ahs' },
      { key: 'witr',    emoji: '🤲', label: 'Witr',    info: '3 Rak\'ahs' }
    ];

    container.innerHTML = `
      <div class="imam-selector">
        <div class="imam-selector-title">🕌 Imam Mode</div>
        <div class="imam-selector-subtitle">Select a prayer to begin a full guided recitation experience with voice.</div>
        <div class="imam-prayer-grid">
          ${prayers.map(p => `
            <button class="imam-prayer-option" onclick="window.PrayerModule.startImamPrayer('${p.key}')">
              <span class="prayer-emoji">${p.emoji}</span>
              <span class="prayer-label">${p.label}</span>
              <span class="prayer-rakah">${p.info}</span>
            </button>
          `).join('')}
        </div>
        <div class="imam-speed-selector">
          <label>⏱ Speed:</label>
          <button class="imam-speed-btn${imamSpeed === 'slow' ? ' active' : ''}" onclick="window.PrayerModule.setImamSpeed('slow')">Slow</button>
          <button class="imam-speed-btn${imamSpeed === 'medium' ? ' active' : ''}" onclick="window.PrayerModule.setImamSpeed('medium')">Medium</button>
          <button class="imam-speed-btn${imamSpeed === 'fast' ? ' active' : ''}" onclick="window.PrayerModule.setImamSpeed('fast')">Fast</button>
        </div>
      </div>
    `;
  }

  function setImamSpeed(speed) {
    imamSpeed = speed;
    // Re-render selector to update active state
    renderImamSelector();
  }

  // ── Start Imam Prayer ──
  function startImamPrayer(prayerKey) {
    const prayer = IMAM_PRAYERS[prayerKey];
    if (!prayer) return;

    imamState = {
      active: true,
      paused: false,
      prayer: prayer,
      prayerKey: prayerKey,
      steps: buildPrayerSteps(prayerKey),
      currentStep: 0,
      timer: null,
      overlay: null
    };

    createImamOverlay();
    renderImamStep();
    scheduleNextStep();
  }

  // ── Create the full-screen overlay ──
  function createImamOverlay() {
    // Remove any existing overlay
    const existing = document.getElementById('imamOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'imamOverlay';
    overlay.className = 'imam-overlay';
    overlay.innerHTML = `
      <div class="imam-topbar">
        <div class="imam-prayer-name">🕌 ${imamState.prayer.name}</div>
        <div class="imam-rakah-info" id="imamRakahInfo">Rak'ah 1 of ${imamState.prayer.rakahs}</div>
        <button class="imam-stop-btn" onclick="window.PrayerModule.stopImamPrayer()">✕ Stop</button>
      </div>
      <div class="imam-content" id="imamContent">
        <!-- Step content rendered dynamically -->
      </div>
      <div class="imam-progress-area">
        <div class="imam-progress-bar-container">
          <div class="imam-progress-bar" id="imamProgressBar" style="width: 0%"></div>
        </div>
        <div class="imam-step-counter" id="imamStepCounter">Step 1 of ${imamState.steps.length}</div>
      </div>
      <div class="imam-controls">
        <button class="imam-ctrl-btn" id="imamPrevBtn" onclick="window.PrayerModule.imamPrev()" title="Previous">⏮</button>
        <button class="imam-ctrl-btn primary" id="imamPlayPauseBtn" onclick="window.PrayerModule.imamTogglePause()" title="Pause">⏸</button>
        <button class="imam-ctrl-btn" id="imamNextBtn" onclick="window.PrayerModule.imamNext()" title="Next">⏭</button>
      </div>
    `;

    document.body.appendChild(overlay);
    imamState.overlay = overlay;

    // Prevent background scroll
    document.body.style.overflow = 'hidden';
  }

  // ── Render current step ──
  function renderImamStep() {
    if (!imamState.active) return;
    const step = imamState.steps[imamState.currentStep];
    if (!step) { finishImamPrayer(); return; }

    const content = document.getElementById('imamContent');
    const pos = POSITIONS[step.position] || POSITIONS.standing;

    const silentBadge = step.silent ?
      '<div class="imam-silent-badge">🔇 Recited silently</div>' : '';

    // Animate transition
    content.classList.add('stepping');
    setTimeout(() => {
      content.innerHTML = `
        <div class="imam-position">${pos.emoji}</div>
        <div class="imam-position-label">${pos.label}</div>
        <div class="imam-step-title">${step.title}</div>
        ${silentBadge}
        <div class="imam-arabic">${step.text.arabic}</div>
        <div class="imam-transliteration">${step.text.translit}</div>
        <div class="imam-translation">${step.text.translation}</div>
      `;
      content.classList.remove('stepping');
    }, 200);

    // Update rak'ah info
    const rakahInfo = document.getElementById('imamRakahInfo');
    if (rakahInfo) rakahInfo.textContent = `Rak'ah ${step.rakah} of ${imamState.prayer.rakahs}`;

    // Update progress
    const pct = ((imamState.currentStep + 1) / imamState.steps.length) * 100;
    const bar = document.getElementById('imamProgressBar');
    if (bar) bar.style.width = pct + '%';
    const counter = document.getElementById('imamStepCounter');
    if (counter) counter.textContent = `Step ${imamState.currentStep + 1} of ${imamState.steps.length}`;

    // Update prev button state
    const prevBtn = document.getElementById('imamPrevBtn');
    if (prevBtn) prevBtn.disabled = imamState.currentStep === 0;

    // Speak Arabic text if not silent
    if (!step.silent) {
      speakArabic(step.text.arabic);
    }
  }

  // ── Speech Synthesis ──
  function speakArabic(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = imamSpeed === 'slow' ? 0.7 : imamSpeed === 'fast' ? 1.0 : 0.85;
    utterance.pitch = 0.95;
    utterance.volume = 1;

    // Try to find an Arabic voice
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang && v.lang.startsWith('ar'));
    if (arabicVoice) utterance.voice = arabicVoice;

    window.speechSynthesis.speak(utterance);
  }

  // ── Timer / auto-advance ──
  function scheduleNextStep() {
    if (!imamState.active || imamState.paused) return;
    clearTimeout(imamState.timer);

    const step = imamState.steps[imamState.currentStep];
    if (!step) return;

    const duration = Math.round(step.duration * IMAM_SPEEDS[imamSpeed]);
    imamState.timer = setTimeout(() => {
      if (!imamState.active || imamState.paused) return;
      imamState.currentStep++;
      if (imamState.currentStep >= imamState.steps.length) {
        finishImamPrayer();
      } else {
        renderImamStep();
        scheduleNextStep();
      }
    }, duration);
  }

  // ── Controls ──
  function imamTogglePause() {
    if (!imamState.active) return;
    imamState.paused = !imamState.paused;

    const btn = document.getElementById('imamPlayPauseBtn');
    if (imamState.paused) {
      clearTimeout(imamState.timer);
      window.speechSynthesis && window.speechSynthesis.pause();
      if (btn) btn.innerHTML = '▶️';
    } else {
      window.speechSynthesis && window.speechSynthesis.resume();
      if (btn) btn.innerHTML = '⏸';
      scheduleNextStep();
    }
  }

  function imamNext() {
    if (!imamState.active) return;
    clearTimeout(imamState.timer);
    window.speechSynthesis && window.speechSynthesis.cancel();

    imamState.currentStep++;
    if (imamState.currentStep >= imamState.steps.length) {
      finishImamPrayer();
    } else {
      renderImamStep();
      if (!imamState.paused) scheduleNextStep();
    }
  }

  function imamPrev() {
    if (!imamState.active || imamState.currentStep === 0) return;
    clearTimeout(imamState.timer);
    window.speechSynthesis && window.speechSynthesis.cancel();

    imamState.currentStep--;
    renderImamStep();
    if (!imamState.paused) scheduleNextStep();
  }

  function stopImamPrayer() {
    imamState.active = false;
    clearTimeout(imamState.timer);
    window.speechSynthesis && window.speechSynthesis.cancel();

    const overlay = document.getElementById('imamOverlay');
    if (overlay) {
      overlay.style.animation = 'none';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';
      setTimeout(() => overlay.remove(), 300);
    }
    document.body.style.overflow = '';
  }

  function finishImamPrayer() {
    imamState.active = false;
    clearTimeout(imamState.timer);
    window.speechSynthesis && window.speechSynthesis.cancel();

    const content = document.getElementById('imamContent');
    if (content) {
      content.innerHTML = `
        <div class="imam-complete">
          <div class="imam-complete-icon">🕌</div>
          <div class="imam-complete-title">Prayer Complete</div>
          <div class="imam-complete-subtitle">
            May Allah accept your ${imamState.prayer.name} prayer.<br>
            <em>Taqabbal Allāhu minnā wa minkum</em>
          </div>
          <button class="imam-complete-btn" onclick="window.PrayerModule.stopImamPrayer()">✓ Close</button>
        </div>
      `;
    }

    // Update progress to 100%
    const bar = document.getElementById('imamProgressBar');
    if (bar) bar.style.width = '100%';
    const counter = document.getElementById('imamStepCounter');
    if (counter) counter.textContent = 'Complete!';

    // Hide controls
    const controls = imamState.overlay && imamState.overlay.querySelector('.imam-controls');
    if (controls) controls.style.display = 'none';
  }

  // Pre-load voices (needed for some browsers)
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  return {
    initPrayerTimes,
    refreshPrayerTimes,
    setManualLocation,
    initQiblah,
    initGuide,
    showGuide,
    toggleAlarm,
    stopAdhan,
    changeAdhanVoice,
    toggleMasterAdhan,
    startImamPrayer,
    stopImamPrayer,
    setImamSpeed,
    imamTogglePause,
    imamNext,
    imamPrev
  };
})();
