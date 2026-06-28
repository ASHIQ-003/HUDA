/* ══════════════════════════════════════════════════════════════
   HUDA — Tools Module (Zakat, Inheritance, Ramadan)
   ══════════════════════════════════════════════════════════════ */

window.ToolsModule = (() => {

  // ── Zakat Calculator ──
  const GOLD_NISAB_GRAMS = 85; 
  // For a real app, you'd fetch live gold prices. We'll use an approximate static value or let user define.
  // We'll define Nisab purely based on input if we want, or a hardcoded fallback.
  // For simplicity, let's assume Nisab = 5500 if user doesn't know.
  const FALLBACK_NISAB = 5500;

  function initZakat() {
    calculateZakat(); // initialize zeros
  }

  function calculateZakat() {
    const getVal = (id) => parseFloat(document.getElementById(id).value) || 0;
    
    const assets = 
      getVal('zakatCash') + 
      getVal('zakatGold') + 
      getVal('zakatStocks') + 
      getVal('zakatBusiness') + 
      getVal('zakatReceivables');
      
    const liabilities = getVal('zakatDebts');
    
    const netWealth = assets - liabilities;
    
    // In a real scenario, Nisab is based on current gold value. 
    // If they input gold value, we might try to estimate, but here we just use fallback.
    const nisab = FALLBACK_NISAB; 
    
    document.getElementById('zakatTotal').textContent = formatCurrency(assets);
    document.getElementById('zakatLiabilities').textContent = formatCurrency(liabilities);
    document.getElementById('zakatNet').textContent = formatCurrency(netWealth);
    
    const nisabStatus = document.getElementById('zakatNisabStatus');
    const amountEl = document.getElementById('zakatAmount');
    
    if (netWealth >= nisab) {
      nisabStatus.textContent = "Above Niṣāb";
      nisabStatus.className = "value badge badge-emerald";
      
      const zakatDue = netWealth * 0.025; // 2.5%
      amountEl.textContent = formatCurrency(zakatDue);
    } else {
      nisabStatus.textContent = "Below Niṣāb";
      nisabStatus.className = "value badge badge-muted";
      amountEl.textContent = "0.00";
    }
  }

  function formatCurrency(num) {
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ── Inheritance Calculator ──
  function initInheritance() {
    // Setup toggle logic for mutually exclusive heirs
    // e.g. If father is present, paternal grandfather is blocked
    const selects = document.querySelectorAll('.heir-select');
    selects.forEach(s => {
      s.addEventListener('change', updateHeirConstraints);
    });
  }

  function updateHeirConstraints() {
    // Basic logic for visual feedback
    const father = document.getElementById('heirFather').value;
    const grandfather = document.getElementById('heirGrandfather');
    if (father === '1') {
      grandfather.value = '0';
      grandfather.disabled = true;
    } else {
      grandfather.disabled = false;
    }
  }

  function calculateInheritance() {
    const getVal = (id) => parseFloat(document.getElementById(id).value) || 0;
    
    const estate = getVal('estateValue');
    let wasiyyah = getVal('estateWasiyyah');
    
    // Wasiyyah cannot exceed 1/3 of estate
    if (wasiyyah > estate / 3) {
      wasiyyah = estate / 3;
      window.HudaApp.showToast("Bequests capped at 1/3 of estate", "info");
      document.getElementById('estateWasiyyah').value = wasiyyah.toFixed(2);
    }
    
    const netEstate = estate - wasiyyah;
    
    if (netEstate <= 0) {
      document.getElementById('inheritanceResult').innerHTML = `
        <div class="card text-center p-8">No estate left to distribute.</div>
      `;
      return;
    }

    // This is a VERY simplified mock of Islamic inheritance (Faraid)
    // A complete engine requires complex rule trees (Aljabri algorithm etc).
    // For this prototype, we'll demonstrate a basic calculation for a common case.
    
    const gender = document.getElementById('deceasedGender').value;
    const spouse = document.getElementById('heirSpouse').value;
    const sons = getVal('heirSons');
    const daughters = getVal('heirDaughters');
    const father = getVal('heirFather');
    const mother = getVal('heirMother');
    
    let shares = [];
    let remainingFraction = 1.0;
    
    const hasChildren = (sons + daughters) > 0;
    
    // Spouse share
    if (spouse !== '0') {
      if (gender === 'male') {
        // Wives get 1/8 if children, 1/4 if no children
        const share = hasChildren ? (1/8) : (1/4);
        shares.push({ name: 'Wife/Wives', fraction: share, fractionText: hasChildren ? '1/8' : '1/4' });
        remainingFraction -= share;
      } else {
        // Husband gets 1/4 if children, 1/2 if no children
        const share = hasChildren ? (1/4) : (1/2);
        shares.push({ name: 'Husband', fraction: share, fractionText: hasChildren ? '1/4' : '1/2' });
        remainingFraction -= share;
      }
    }
    
    // Parents
    if (father === 1) {
      // Father gets 1/6 if children
      if (hasChildren) {
        shares.push({ name: 'Father', fraction: 1/6, fractionText: '1/6' });
        remainingFraction -= 1/6;
      } else {
        // Father gets rest (Ta'seeb) - handled later
      }
    }
    
    if (mother === 1) {
      // Mother gets 1/6 if children or multiple siblings, else 1/3
      const share = hasChildren ? (1/6) : (1/3);
      shares.push({ name: 'Mother', fraction: share, fractionText: hasChildren ? '1/6' : '1/3' });
      remainingFraction -= share;
    }
    
    // Children (Ta'seeb - the rest)
    if (sons > 0) {
      // Male gets twice the female
      const totalParts = (sons * 2) + daughters;
      const partValue = remainingFraction / totalParts;
      
      shares.push({ name: `${sons} Son(s)`, fraction: (partValue * 2 * sons), fractionText: 'Residue (2:1 ratio)' });
      if (daughters > 0) {
        shares.push({ name: `${daughters} Daughter(s)`, fraction: (partValue * daughters), fractionText: 'Residue (1:2 ratio)' });
      }
      remainingFraction = 0;
    } else if (daughters > 0) {
      // Daughters only
      let share = 0;
      let text = '';
      if (daughters === 1) {
        share = 1/2;
        text = '1/2';
      } else {
        share = 2/3;
        text = '2/3';
      }
      // Cannot give more than remaining
      share = Math.min(share, remainingFraction);
      shares.push({ name: `${daughters} Daughter(s)`, fraction: share, fractionText: text });
      remainingFraction -= share;
    }
    
    // If father is alive and no sons, he takes the rest
    if (father === 1 && sons === 0 && remainingFraction > 0) {
      shares.push({ name: 'Father (Residue)', fraction: remainingFraction, fractionText: 'Residue' });
      remainingFraction = 0;
    }

    // Render results
    let html = `<div class="card">
      <h4 style="font-weight: 600; margin-bottom: var(--space-4); border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-2);">Distribution Breakdown</h4>
      <div class="result-row" style="font-weight:700;"><span class="label">Net Estate to Distribute</span><span class="value">${formatCurrency(netEstate)}</span></div>
      <div class="divider"></div>
    `;
    
    shares.forEach(s => {
      const amount = netEstate * s.fraction;
      html += `
        <div class="result-row items-center mb-2">
          <div>
            <div style="font-weight: 600;">${s.name}</div>
            <div style="font-size: var(--text-xs); color: var(--color-text-muted);">Share: ${s.fractionText}</div>
          </div>
          <div class="value" style="color: var(--color-emerald-light); font-size: var(--text-lg);">${formatCurrency(amount)}</div>
        </div>
      `;
    });
    
    if (remainingFraction > 0.001) {
      html += `<div class="mt-4 p-3 badge badge-muted w-full text-center">Unallocated Residue: ${formatCurrency(netEstate * remainingFraction)}<br><small>Requires further heir analysis (e.g., siblings/uncles).</small></div>`;
    }
    
    html += `</div>`;
    document.getElementById('inheritanceResult').innerHTML = html;
  }

  // ── Ramadan Tools ──
  function initRamadan() {
    showRamadanTab('duas');
    generateFastingTracker();
    
    // If we have prayer times loaded, update Suhoor/Iftar
    const loc = window.PrayerModule ? window.PrayerModule.getSavedLocation : null;
    // In a real app we'd fetch the current month's calendar from Aladhan API.
    // For demo, we just show dummy times or current day times if available.
    
    const today = new Date();
    document.getElementById('suhoorTime').textContent = "04:30 AM";
    document.getElementById('iftarTime').textContent = "07:45 PM";
  }

  function showRamadanTab(tabId) {
    document.querySelectorAll('#page-ramadan .tab').forEach(el => {
      el.classList.toggle('active', el.dataset.ramadan === tabId);
    });
    
    document.querySelectorAll('.ramadan-tab-content').forEach(el => {
      el.style.display = 'none';
    });
    
    let target;
    if (tabId === 'duas') target = 'ramadanDuas';
    if (tabId === 'tracker') target = 'ramadanTracker';
    if (tabId === 'calendar') target = 'ramadanCalendar';
    
    if (target) document.getElementById(target).style.display = 'block';
  }

  function generateFastingTracker() {
    const grid = document.getElementById('fastingTracker');
    grid.innerHTML = '';
    
    // Assuming 30 days
    for (let i = 1; i <= 30; i++) {
      const isLastTen = i > 20;
      
      const dayEl = document.createElement('div');
      dayEl.className = `ramadan-day ${isLastTen ? 'last-ten' : ''}`;
      
      dayEl.innerHTML = `
        <div class="day-num">${i}</div>
        <div style="font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 2px;">
          ${isLastTen ? '⭐' : ''}
        </div>
      `;
      
      dayEl.onclick = () => {
        dayEl.classList.toggle('completed');
        if (dayEl.classList.contains('completed')) {
          dayEl.style.background = 'var(--color-emerald-glow)';
          dayEl.style.borderColor = 'var(--color-emerald)';
        } else {
          dayEl.style.background = '';
          dayEl.style.borderColor = '';
        }
      };
      
      grid.appendChild(dayEl);
    }
  }

  return {
    initZakat,
    calculateZakat,
    initInheritance,
    calculateInheritance,
    initRamadan,
    showRamadanTab
  };
})();
