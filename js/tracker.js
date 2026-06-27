/* ══════════════════════════════════════════════════════════════
   HUDA — Habit Tracker Module (Muhasabah)
   Saves daily spiritual habits to localStorage
   ══════════════════════════════════════════════════════════════ */

window.TrackerModule = (() => {
  let currentDate = new Date();
  
  const habitsList = [
    { id: 'fajr', label: 'Fajr Prayer', type: 'fard' },
    { id: 'dhuhr', label: 'Dhuhr Prayer', type: 'fard' },
    { id: 'asr', label: 'Asr Prayer', type: 'fard' },
    { id: 'maghrib', label: 'Maghrib Prayer', type: 'fard' },
    { id: 'isha', label: 'Isha Prayer', type: 'fard' },
    
    { id: 'sunnah', label: '12 Rak\'ah Sunnah', type: 'sunnah' },
    { id: 'witr', label: 'Witr Prayer', type: 'sunnah' },
    
    { id: 'm_adhkar', label: 'Morning Adhkār', type: 'adhkar' },
    { id: 'e_adhkar', label: 'Evening Adhkār', type: 'adhkar' },
    
    { id: 'quran', label: 'Daily Qur\'an Portion', type: 'quran' },
  ];

  function init() {
    currentDate = new Date(); // reset to today when navigating here
    renderTracker();
  }

  function getDateKey(dateObj) {
    return `huda_tracker_${dateObj.getFullYear()}_${dateObj.getMonth() + 1}_${dateObj.getDate()}`;
  }

  function loadData(dateObj) {
    const key = getDateKey(dateObj);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {};
  }

  function saveData(dateObj, data) {
    const key = getDateKey(dateObj);
    localStorage.setItem(key, JSON.stringify(data));
  }

  function toggleHabit(habitId) {
    const data = loadData(currentDate);
    data[habitId] = !data[habitId];
    saveData(currentDate, data);
    renderTracker(); // re-render to update progress bars
  }

  function changeDate(daysOffset) {
    currentDate.setDate(currentDate.getDate() + daysOffset);
    renderTracker();
  }

  function isToday(dateObj) {
    const today = new Date();
    return dateObj.getDate() === today.getDate() &&
           dateObj.getMonth() === today.getMonth() &&
           dateObj.getFullYear() === today.getFullYear();
  }

  function renderTracker() {
    const container = document.getElementById('trackerContent');
    if (!container) return;
    
    // Update Header Text & Buttons
    const nextBtn = document.getElementById('trackerNextBtn');
    const dateDisplay = document.getElementById('trackerDateDisplay');
    
    if (isToday(currentDate)) {
      dateDisplay.textContent = 'Today';
      nextBtn.disabled = true;
    } else {
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      dateDisplay.textContent = currentDate.toLocaleDateString(undefined, options);
      nextBtn.disabled = false;
    }

    const data = loadData(currentDate);
    
    // Calculate progress
    let completed = 0;
    habitsList.forEach(h => {
      if (data[h.id]) completed++;
    });
    const progressPct = (completed / habitsList.length) * 100;
    
    // Build HTML
    let html = `
      <div class="card mb-6 text-center">
        <h4 style="font-weight: 600; margin-bottom: var(--space-2);">Daily Completion</h4>
        <div style="font-size: var(--text-2xl); font-weight: 700; color: var(--color-emerald-light); margin-bottom: var(--space-4);">
          ${Math.round(progressPct)}%
        </div>
        <div class="progress-bar-bg" style="height: 12px; background: var(--color-bg-secondary); border-radius: 6px; overflow: hidden;">
          <div style="height: 100%; width: ${progressPct}%; background: var(--color-emerald); transition: width 0.3s ease;"></div>
        </div>
      </div>
      
      <div class="grid grid-2 gap-4">
    `;

    // Grouping manually for aesthetic
    const groups = [
      { title: 'Obligatory Prayers (Fard)', type: 'fard', icon: '🕋' },
      { title: 'Sunnah Prayers', type: 'sunnah', icon: '🕌' },
      { title: 'Remembrance (Adhkār)', type: 'adhkar', icon: '📿' },
      { title: 'Qur\'an', type: 'quran', icon: '📖' },
    ];

    groups.forEach(group => {
      const groupHabits = habitsList.filter(h => h.type === group.type);
      
      html += `
        <div class="card p-4">
          <div class="flex items-center gap-2 mb-4 pb-2" style="border-bottom: 1px solid var(--color-border);">
            <span>${group.icon}</span>
            <h4 style="font-weight: 600;">${group.title}</h4>
          </div>
          <div class="flex-col gap-2">
      `;
      
      groupHabits.forEach(habit => {
        const isChecked = data[habit.id] ? 'checked' : '';
        html += `
          <label class="tracker-item ${isChecked ? 'completed' : ''}" style="display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); background: var(--color-bg-tertiary); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s;">
            <input type="checkbox" ${isChecked} onchange="window.TrackerModule.toggleHabit('${habit.id}')" style="width: 20px; height: 20px; accent-color: var(--color-emerald);">
            <span style="font-weight: 500;">${habit.label}</span>
          </label>
        `;
      });
      
      html += `</div></div>`;
    });

    html += `</div>`; // end grid
    container.innerHTML = html;
  }

  return {
    init,
    changeDate,
    toggleHabit
  };
})();
