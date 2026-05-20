/* ═══════════════════════════════════════════════
   LifeHub - Password Generator
   Premium Script
═══════════════════════════════════════════════ */

(() => {
  'use strict';

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function secureRandomInt(max) {
    if (!max || max <= 0) return 0;
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  }

  function secureChoice(chars) {
    if (!chars || !chars.length) return '';
    const list = Array.isArray(chars) ? chars : [...chars];
    return list[secureRandomInt(list.length)];
  }

  function secureShuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function nowTime() {
    return new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function safeParse(json, fallback) {
    try {
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  }

  function removeToneClasses(el) {
    if (!el) return;
    el.classList.remove('is-danger', 'is-success', 'is-warning');
  }

  // ─────────────────────────────────────────────
  // DOM
  // ─────────────────────────────────────────────
  const els = {
    passwordDisplay: $('passwordDisplay'),
    passwordText: $('passwordText'),
    passwordModeChip: $('passwordModeChip'),
    passwordPoolChip: $('passwordPoolChip'),

    copyBtn: $('copyBtn'),
    copyIcon: $('copyIcon'),
    generateBtn: $('generateBtn'),
    regenerateBtnTop: $('regenerateBtnTop'),
    toggleVisibilityBtn: $('toggleVisibilityBtn'),

    historyToggleBtn: $('historyToggleBtn'),
    surpriseBtn: $('surpriseBtn'),

    strengthScore: $('strengthScore'),
    strengthLabel: $('strengthLabel'),
    crackTime: $('crackTime'),
    strengthFill: $('strengthFill'),

    statLength: $('statLength'),
    statVariety: $('statVariety'),
    statEntropy: $('statEntropy'),
    statGenerated: $('statGenerated'),

    heroScore: $('heroScore'),
    heroEntropy: $('heroEntropy'),
    heroGenerated: $('heroGenerated'),

    lengthSlider: $('lengthSlider'),
    lengthValue: $('lengthValue'),

    randomPresetBtn: $('randomPresetBtn'),
    presetBtns: [...document.querySelectorAll('.preset-btn')],
    typeCards: [...document.querySelectorAll('.type-card')],

    requireEachType: $('requireEachType'),
    excludeSimilar: $('excludeSimilar'),
    avoidDuplicates: $('avoidDuplicates'),
    autoCopy: $('autoCopy'),

    excludeChars: $('excludeChars'),
    minUniqueChars: $('minUniqueChars'),

    qualityBadge: $('qualityBadge'),
    checkLength: $('checkLength'),
    checkTypes: $('checkTypes'),
    checkUnique: $('checkUnique'),
    checkEntropy: $('checkEntropy'),
    checkSymbols: $('checkSymbols'),

    poolSizeBadge: $('poolSizeBadge'),
    countUppercase: $('countUppercase'),
    barUppercase: $('barUppercase'),
    countLowercase: $('countLowercase'),
    barLowercase: $('barLowercase'),
    countNumbers: $('countNumbers'),
    barNumbers: $('barNumbers'),
    countSymbols: $('countSymbols'),
    barSymbols: $('barSymbols'),

    historyPanel: $('historyPanel'),
    historyList: $('historyList'),
    clearHistoryBtn: $('clearHistoryBtn'),

    statusMessage: $('statusMessage')
  };

  // ─────────────────────────────────────────────
  // Constants
  // ─────────────────────────────────────────────
  const CHARSETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?/`~'
  };

  const SIMILAR_CHARS = new Set(['0', 'O', 'o', '1', 'l', 'I', '|']);

  const PRESETS = {
    pin: {
      label: 'PIN',
      length: 6,
      types: ['numbers'],
      requireEachType: false,
      excludeSimilar: false,
      avoidDuplicates: false,
      autoCopy: false,
      minUniqueChars: 4
    },
    balanced: {
      label: 'Balanced',
      length: 16,
      types: ['uppercase', 'lowercase', 'numbers', 'symbols'],
      requireEachType: true,
      excludeSimilar: true,
      avoidDuplicates: false,
      autoCopy: false,
      minUniqueChars: 8
    },
    strong: {
      label: 'Strong',
      length: 20,
      types: ['uppercase', 'lowercase', 'numbers', 'symbols'],
      requireEachType: true,
      excludeSimilar: true,
      avoidDuplicates: true,
      autoCopy: false,
      minUniqueChars: 12
    },
    fortress: {
      label: 'Fortress',
      length: 32,
      types: ['uppercase', 'lowercase', 'numbers', 'symbols'],
      requireEachType: true,
      excludeSimilar: false,
      avoidDuplicates: true,
      autoCopy: false,
      minUniqueChars: 18
    },
    memorable: {
      label: 'Memorable',
      length: 14,
      types: ['uppercase', 'lowercase', 'numbers'],
      requireEachType: true,
      excludeSimilar: true,
      avoidDuplicates: false,
      autoCopy: false,
      minUniqueChars: 8
    }
  };

  const MODE_LABELS = {
    pin: 'PIN',
    balanced: 'Balanced',
    strong: 'Strong',
    fortress: 'Fortress',
    memorable: 'Memorable',
    custom: 'Custom',
    surprise: 'Surprise'
  };

  const STORAGE_KEYS = {
    history: 'lifehub-password-history-v2',
    historyVisible: 'lifehub-password-history-visible-v2',
    totalGenerated: 'lifehub-passwords-generated'
  };

  // ─────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────
  const state = {
    visible: true,
    currentPassword: '',
    history: [],
    mode: 'balanced',
    generatedCount: 0,
    lastAnalysis: null
  };

  let statusTimer = null;
  let copyTimer = null;

  // ─────────────────────────────────────────────
  // Theme
  // ─────────────────────────────────────────────
  function applySavedTheme() {
    const savedTheme = localStorage.getItem('lifehub-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // ─────────────────────────────────────────────
  // Status
  // ─────────────────────────────────────────────
  function setStatus(message, tone = 'neutral') {
    if (!els.statusMessage) return;

    clearTimeout(statusTimer);
    els.statusMessage.textContent = message;
    removeToneClasses(els.statusMessage);

    if (tone === 'danger') els.statusMessage.classList.add('is-danger');
    if (tone === 'success') els.statusMessage.classList.add('is-success');
    if (tone === 'warning') els.statusMessage.classList.add('is-warning');

    statusTimer = setTimeout(() => {
      removeToneClasses(els.statusMessage);
    }, 2400);
  }

  function pulsePasswordDisplay() {
    if (!els.passwordDisplay) return;
    els.passwordDisplay.classList.remove('flash-generate');
    void els.passwordDisplay.offsetWidth;
    els.passwordDisplay.classList.add('flash-generate');
  }

  function shakeDisplay() {
    if (!els.passwordDisplay) return;
    els.passwordDisplay.classList.remove('shake');
    void els.passwordDisplay.offsetWidth;
    els.passwordDisplay.classList.add('shake');
  }

  // ─────────────────────────────────────────────
  // Session History
  // ─────────────────────────────────────────────
  function loadHistory() {
    state.history = safeParse(sessionStorage.getItem(STORAGE_KEYS.history) || '[]', []);
  }

  function saveHistory() {
    sessionStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history));
  }

  function addToHistory(password, analysis) {
    state.history.unshift({
      password,
      time: nowTime(),
      score: analysis.score,
      label: analysis.levelLabel
    });

    if (state.history.length > 10) {
      state.history = state.history.slice(0, 10);
    }

    saveHistory();
    renderHistory();
  }

  function clearHistory() {
    state.history = [];
    saveHistory();
    renderHistory();
    setStatus('🗑️ تم مسح السجل', 'warning');
  }

  function renderHistory() {
    if (!els.historyList) return;

    if (!state.history.length) {
      els.historyList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <p class="empty-title">لسه مفيش سجل</p>
          <p class="empty-desc">أول ما تولّد كلمات مرور هتظهر هنا فورًا</p>
        </div>
      `;
      return;
    }

    els.historyList.innerHTML = state.history.map((item, index) => `
      <article class="history-entry">
        <div class="history-entry-top">
          <span class="history-index">#${index + 1} • ${item.label}</span>
          <span class="history-time">${item.time}</span>
        </div>

        <div class="history-password">${escapeHtml(item.password)}</div>

        <div class="history-actions">
          <button
            class="history-copy-btn"
            type="button"
            data-copy-password="${escapeAttribute(item.password)}"
          >
            📋 نسخ
          </button>
        </div>
      </article>
    `).join('');

    els.historyList.querySelectorAll('[data-copy-password]').forEach((btn) => {
      btn.addEventListener('click', () => {
        copyText(btn.getAttribute('data-copy-password'));
      });
    });
  }

  function loadHistoryVisibility() {
    const saved = sessionStorage.getItem(STORAGE_KEYS.historyVisible);
    if (saved === null) {
      setHistoryVisibility(window.innerWidth >= 1180);
      return;
    }
    setHistoryVisibility(saved === '1');
  }

  function setHistoryVisibility(visible) {
    if (!els.historyPanel || !els.historyToggleBtn) return;

    els.historyPanel.classList.toggle('is-hidden', !visible);
    sessionStorage.setItem(STORAGE_KEYS.historyVisible, visible ? '1' : '0');

    els.historyToggleBtn.innerHTML = visible
      ? '<span>📋</span><span>إخفاء السجل</span>'
      : '<span>📋</span><span>السجل</span>';
  }

  function toggleHistory() {
    const isHidden = els.historyPanel.classList.contains('is-hidden');
    setHistoryVisibility(isHidden);
  }

  // ─────────────────────────────────────────────
  // Totals
  // ─────────────────────────────────────────────
  function loadGeneratedCount() {
    const value = parseInt(localStorage.getItem(STORAGE_KEYS.totalGenerated) || '0', 10);
    state.generatedCount = Number.isNaN(value) ? 0 : value;
  }

  function incrementGeneratedCount() {
    state.generatedCount += 1;
    localStorage.setItem(STORAGE_KEYS.totalGenerated, String(state.generatedCount));

    // مفيد لو الصفحة الرئيسية لاحقاً بتقرأ مفتاح تاني
    localStorage.setItem('passwords_generated', String(state.generatedCount));
  }

  // ─────────────────────────────────────────────
  // Presets & Types
  // ─────────────────────────────────────────────
  function setActiveTypes(types) {
    els.typeCards.forEach((card) => {
      card.classList.toggle('active', types.includes(card.dataset.type));
    });
  }

  function getActiveTypes() {
    return els.typeCards
      .filter((card) => card.classList.contains('active'))
      .map((card) => card.dataset.type);
  }

  function setPresetActive(name) {
    els.presetBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.preset === name);
    });
    state.mode = name;
    updateModeChip();
  }

  function setCustomMode(label = 'custom') {
    els.presetBtns.forEach((btn) => btn.classList.remove('active'));
    state.mode = label;
    updateModeChip();
  }

  function updateModeChip() {
    if (!els.passwordModeChip) return;
    els.passwordModeChip.textContent = MODE_LABELS[state.mode] || 'Custom';
  }

  function applyPreset(name, options = {}) {
    const preset = PRESETS[name];
    if (!preset) return;

    els.lengthSlider.value = preset.length;
    els.lengthValue.textContent = String(preset.length);

    setActiveTypes(preset.types);

    els.requireEachType.checked = preset.requireEachType;
    els.excludeSimilar.checked = preset.excludeSimilar;
    els.avoidDuplicates.checked = preset.avoidDuplicates;
    els.autoCopy.checked = preset.autoCopy;
    els.minUniqueChars.value = preset.minUniqueChars;
    els.excludeChars.value = '';

    setPresetActive(name);

    if (!options.silent) {
      setStatus(`⚡ تم تطبيق وضع ${preset.label}`, 'success');
    }

    if (options.generate !== false) {
      generatePassword('preset');
    }
  }

  function applyRandomPreset() {
    const keys = Object.keys(PRESETS);
    const key = keys[secureRandomInt(keys.length)];
    applyPreset(key);
  }

  function applySurpriseSettings() {
    const allTypes = ['uppercase', 'lowercase', 'numbers', 'symbols'];
    const selected = allTypes.filter(() => Math.random() > 0.35);

    const types = selected.length ? selected : ['lowercase', 'numbers'];
    const length = clamp(10 + secureRandomInt(31), 10, 40);
    const minUnique = clamp(Math.round(length * (0.45 + Math.random() * 0.25)), 4, length);

    els.lengthSlider.value = length;
    els.lengthValue.textContent = String(length);

    setActiveTypes(types);

    els.requireEachType.checked = Math.random() > 0.25;
    els.excludeSimilar.checked = Math.random() > 0.4;
    els.avoidDuplicates.checked = Math.random() > 0.45;
    els.autoCopy.checked = false;
    els.excludeChars.value = '';
    els.minUniqueChars.value = minUnique;

    setCustomMode('surprise');
    setStatus('🎲 تم ضبط إعدادات مفاجِئة', 'success');
    generatePassword('surprise');
  }

  // ─────────────────────────────────────────────
  // Build Config
  // ─────────────────────────────────────────────
  function collectConfig() {
    const length = clamp(parseInt(els.lengthSlider.value, 10) || 16, 6, 64);
    const activeTypes = getActiveTypes();

    return {
      length,
      activeTypes,
      requireEachType: els.requireEachType.checked,
      excludeSimilar: els.excludeSimilar.checked,
      avoidDuplicates: els.avoidDuplicates.checked,
      autoCopy: els.autoCopy.checked,
      excludeChars: (els.excludeChars.value || '').trim(),
      minUniqueChars: clamp(parseInt(els.minUniqueChars.value, 10) || 1, 1, 64)
    };
  }

  function buildPools(config) {
    if (!config.activeTypes.length) {
      return { error: 'لازم تختار نوع أحرف واحد على الأقل' };
    }

    const manualExcluded = new Set([...config.excludeChars]);
    const byType = {};
    let fullPool = '';

    for (const type of config.activeTypes) {
      const base = [...(CHARSETS[type] || '')];

      const filtered = base.filter((char) => {
        if (config.excludeSimilar && SIMILAR_CHARS.has(char)) return false;
        if (manualExcluded.has(char)) return false;
        return true;
      });

      if (!filtered.length) {
        return {
          error: `النوع "${getTypeLabel(type)}" مفيش منه أحرف كفاية بعد الاستبعاد`
        };
      }

      byType[type] = filtered.join('');
      fullPool += filtered.join('');
    }

    fullPool = [...new Set(fullPool.split(''))].join('');

    return {
      byType,
      pool: fullPool
    };
  }

  function getTypeLabel(type) {
    const map = {
      uppercase: 'أحرف كبيرة',
      lowercase: 'أحرف صغيرة',
      numbers: 'أرقام',
      symbols: 'رموز'
    };
    return map[type] || type;
  }

  function pickChar(pool, usedMap, avoidDuplicates) {
    const chars = [...pool];
    if (!chars.length) return '';

    if (!avoidDuplicates) {
      const char = chars[secureRandomInt(chars.length)];
      usedMap[char] = (usedMap[char] || 0) + 1;
      return char;
    }

    let minCount = Infinity;
    let candidates = [];

    for (const char of chars) {
      const count = usedMap[char] || 0;
      if (count < minCount) {
        minCount = count;
        candidates = [char];
      } else if (count === minCount) {
        candidates.push(char);
      }
    }

    const chosen = candidates[secureRandomInt(candidates.length)];
    usedMap[chosen] = (usedMap[chosen] || 0) + 1;
    return chosen;
  }

  function generateCandidate(config, pools) {
    const usedMap = {};
    const chars = [];

    if (config.requireEachType) {
      for (const type of config.activeTypes) {
        chars.push(pickChar(pools.byType[type], usedMap, config.avoidDuplicates));
      }
    }

    while (chars.length < config.length) {
      chars.push(pickChar(pools.pool, usedMap, config.avoidDuplicates));
    }

    const password = secureShuffle(chars).join('');
    const uniqueCount = new Set(password).size;

    return { password, uniqueCount };
  }

  // ─────────────────────────────────────────────
  // Analyze
  // ─────────────────────────────────────────────
  function analyzePassword(password, pools) {
    const counts = {
      uppercase: 0,
      lowercase: 0,
      numbers: 0,
      symbols: 0
    };

    for (const char of password) {
      if (CHARSETS.uppercase.includes(char)) counts.uppercase += 1;
      else if (CHARSETS.lowercase.includes(char)) counts.lowercase += 1;
      else if (CHARSETS.numbers.includes(char)) counts.numbers += 1;
      else counts.symbols += 1;
    }

    const length = password.length;
    const uniqueCount = new Set(password).size;
    const varietyCount = Object.values(counts).filter((count) => count > 0).length;
    const poolSize = pools.pool.length || 1;
    const entropy = length * Math.log2(poolSize);

    const lengthScore = Math.min(30, Math.round(length * 1.6));
    const varietyScore = varietyCount * 8;
    const uniqueScore = Math.min(12, Math.round((uniqueCount / Math.max(length, 1)) * 12));
    const entropyScore = Math.min(18, Math.round(entropy / 6));

    let bonus = 0;
    if (counts.symbols > 0) bonus += 4;
    if (counts.numbers > 0) bonus += 2;
    if (length >= 20) bonus += 4;
    if (length >= 32) bonus += 4;

    const score = clamp(lengthScore + varietyScore + uniqueScore + entropyScore + bonus, 0, 100);

    const level = getLevelMeta(score, entropy);

    return {
      password,
      length,
      uniqueCount,
      varietyCount,
      entropy,
      score,
      poolSize,
      counts,
      levelLabel: level.label,
      levelColorA: level.colorA,
      levelColorB: level.colorB,
      crackTimeText: level.crackTime,
      qualityClass: level.qualityClass
    };
  }

  function getLevelMeta(score, entropy) {
    let label = 'ضعيف';
    let colorA = '#ef4444';
    let colorB = '#f97316';
    let qualityClass = 'weak';

    if (score < 40) {
      label = 'ضعيف جداً';
      colorA = '#ef4444';
      colorB = '#f97316';
      qualityClass = 'weak';
    } else if (score < 55) {
      label = 'ضعيف';
      colorA = '#f97316';
      colorB = '#f59e0b';
      qualityClass = 'weak';
    } else if (score < 70) {
      label = 'مقبول';
      colorA = '#f59e0b';
      colorB = '#eab308';
      qualityClass = 'medium';
    } else if (score < 85) {
      label = 'قوي';
      colorA = '#84cc16';
      colorB = '#10b981';
      qualityClass = 'strong';
    } else {
      label = 'حصن منيع';
      colorA = '#10b981';
      colorB = '#06b6d4';
      qualityClass = 'strong';
    }

    let crackTime = 'ثوانٍ معدودة';
    if (entropy >= 100) crackTime = 'مليارات السنين';
    else if (entropy >= 85) crackTime = 'آلاف السنين';
    else if (entropy >= 70) crackTime = 'سنوات طويلة';
    else if (entropy >= 55) crackTime = 'شهور إلى سنوات';
    else if (entropy >= 45) crackTime = 'أيام إلى شهور';
    else if (entropy >= 35) crackTime = 'دقائق إلى ساعات';

    return { label, colorA, colorB, crackTime, qualityClass };
  }

  // ─────────────────────────────────────────────
  // UI Render
  // ─────────────────────────────────────────────
  function renderPasswordText() {
    if (!els.passwordText) return;

    if (!state.currentPassword) {
      els.passwordText.textContent = 'اضغط توليد ✨';
      els.passwordText.classList.remove('masked');
      return;
    }

    if (state.visible) {
      els.passwordText.textContent = state.currentPassword;
      els.passwordText.classList.remove('masked');
    } else {
      els.passwordText.textContent = '•'.repeat(state.currentPassword.length);
      els.passwordText.classList.add('masked');
    }
  }

  function renderAnalysis(analysis) {
    state.lastAnalysis = analysis;

    els.strengthScore.textContent = String(analysis.score);
    els.strengthLabel.textContent = analysis.levelLabel;
    els.crackTime.textContent = analysis.crackTimeText;

    els.strengthFill.style.width = `${analysis.score}%`;
    els.strengthFill.style.background = `linear-gradient(90deg, ${analysis.levelColorA}, ${analysis.levelColorB})`;
    els.strengthFill.style.boxShadow = `0 0 22px ${analysis.levelColorA}55`;

    els.statLength.textContent = String(analysis.length);
    els.statVariety.textContent = `${analysis.varietyCount}/4`;
    els.statEntropy.textContent = `${Math.round(analysis.entropy)} bit`;
    els.statGenerated.textContent = String(state.generatedCount);

    els.heroScore.textContent = `${analysis.score}/100`;
    els.heroEntropy.textContent = `${Math.round(analysis.entropy)} bit`;
    els.heroGenerated.textContent = String(state.generatedCount);

    els.passwordPoolChip.textContent = `Pool: ${analysis.poolSize}`;
    els.poolSizeBadge.textContent = `Pool: ${analysis.poolSize}`;
  }

  function renderDistribution(analysis) {
    const total = Math.max(analysis.length, 1);

    const map = [
      ['uppercase', els.countUppercase, els.barUppercase],
      ['lowercase', els.countLowercase, els.barLowercase],
      ['numbers', els.countNumbers, els.barNumbers],
      ['symbols', els.countSymbols, els.barSymbols]
    ];

    map.forEach(([key, countEl, barEl]) => {
      const count = analysis.counts[key];
      if (countEl) countEl.textContent = String(count);
      if (barEl) barEl.style.width = `${(count / total) * 100}%`;
    });
  }

  function setQualityItem(el, pass) {
    if (!el) return;
    el.classList.remove('pending', 'pass', 'fail');
    el.classList.add(pass ? 'pass' : 'fail');

    const icon = el.querySelector('.quality-icon');
    if (icon) icon.textContent = pass ? '✓' : '✕';
  }

  function renderQuality(analysis) {
    const strongLength = analysis.length >= 12;
    const goodTypes = analysis.varietyCount >= 3;
    const goodUnique = analysis.uniqueCount >= Math.min(8, analysis.length);
    const goodEntropy = analysis.entropy >= 60;
    const helpfulMix = analysis.counts.symbols > 0 || analysis.counts.numbers > 0;

    setQualityItem(els.checkLength, strongLength);
    setQualityItem(els.checkTypes, goodTypes);
    setQualityItem(els.checkUnique, goodUnique);
    setQualityItem(els.checkEntropy, goodEntropy);
    setQualityItem(els.checkSymbols, helpfulMix);

    els.qualityBadge.classList.remove('weak', 'medium', 'strong');
    els.qualityBadge.classList.add(analysis.qualityClass);

    if (analysis.qualityClass === 'weak') els.qualityBadge.textContent = 'يحتاج تقوية';
    if (analysis.qualityClass === 'medium') els.qualityBadge.textContent = 'كويس';
    if (analysis.qualityClass === 'strong') els.qualityBadge.textContent = 'قوي';
  }

  function renderAll(analysis) {
    renderPasswordText();
    renderAnalysis(analysis);
    renderDistribution(analysis);
    renderQuality(analysis);
  }

  // ─────────────────────────────────────────────
  // Copy
  // ─────────────────────────────────────────────
  function fallbackCopy(text) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }

  function setCopySuccessUI() {
    clearTimeout(copyTimer);
    els.copyBtn.classList.add('copied');
    els.copyIcon.textContent = '✅';

    copyTimer = setTimeout(() => {
      els.copyBtn.classList.remove('copied');
      els.copyIcon.textContent = '📋';
    }, 1600);
  }

  async function copyText(text = state.currentPassword, options = {}) {
    if (!text) {
      setStatus('⚠️ لا يوجد شيء للنسخ', 'warning');
      shakeDisplay();
      return false;
    }

    let copied = false;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      } else {
        copied = fallbackCopy(text);
      }
    } catch {
      copied = fallbackCopy(text);
    }

    if (copied) {
      setCopySuccessUI();

      if (!options.silent) {
        setStatus(
          options.auto ? '✅ تم التوليد والنسخ تلقائياً' : '📋 تم النسخ بنجاح',
          'success'
        );
      }
      return true;
    }

    if (!options.silent) {
      setStatus('❌ فشل النسخ على المتصفح الحالي', 'danger');
    }
    return false;
  }

  // ─────────────────────────────────────────────
  // Main Generate
  // ─────────────────────────────────────────────
  async function generatePassword(source = 'manual') {
    const config = collectConfig();

    if (!config.activeTypes.length) {
      setStatus('⚠️ لازم تختار نوع أحرف واحد على الأقل', 'warning');
      shakeDisplay();
      return;
    }

    const minLengthNeeded = config.requireEachType ? config.activeTypes.length : 1;
    if (config.length < minLengthNeeded) {
      config.length = minLengthNeeded;
      els.lengthSlider.value = String(config.length);
      els.lengthValue.textContent = String(config.length);
    }

    const pools = buildPools(config);
    if (pools.error) {
      setStatus(`⚠️ ${pools.error}`, 'warning');
      shakeDisplay();
      return;
    }

    const maxUniquePossible = Math.min(config.length, pools.pool.length);
    const targetUnique = clamp(config.minUniqueChars, 1, maxUniquePossible);

    let bestCandidate = null;

    for (let i = 0; i < 140; i++) {
      const candidate = generateCandidate(config, pools);

      if (!bestCandidate || candidate.uniqueCount > bestCandidate.uniqueCount) {
        bestCandidate = candidate;
      }

      if (candidate.uniqueCount >= targetUnique) {
        bestCandidate = candidate;
        break;
      }
    }

    state.currentPassword = bestCandidate.password;
    incrementGeneratedCount();

    const analysis = analyzePassword(state.currentPassword, pools);
    renderAll(analysis);
    addToHistory(state.currentPassword, analysis);
    pulsePasswordDisplay();

    if (bestCandidate.uniqueCount < targetUnique) {
      setStatus(
        `⚠️ تم التوليد بأفضل نتيجة ممكنة، لكن الوصول لـ ${targetUnique} أحرف مختلفة كان صعب بالإعدادات الحالية`,
        'warning'
      );
    } else {
      setStatus(
        source === 'surprise'
          ? '🎲 تم توليد كلمة مرور مفاجِئة'
          : '✅ تم توليد كلمة مرور جديدة',
        'success'
      );
    }

    if (config.autoCopy) {
      await copyText(state.currentPassword, { silent: false, auto: true });
    }
  }

  // ─────────────────────────────────────────────
  // Visibility
  // ─────────────────────────────────────────────
  function toggleVisibility() {
    state.visible = !state.visible;
    renderPasswordText();
    els.toggleVisibilityBtn.textContent = state.visible ? '👁️' : '🙈';
    setStatus(state.visible ? '👁️ تم إظهار كلمة المرور' : '🙈 تم إخفاء كلمة المرور', 'success');
  }

  // ─────────────────────────────────────────────
  // Escape HTML
  // ─────────────────────────────────────────────
  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function escapeAttribute(str) {
    return escapeHtml(str);
  }

  // ─────────────────────────────────────────────
  // Events
  // ─────────────────────────────────────────────
  function bindEvents() {
    els.generateBtn.addEventListener('click', () => generatePassword('button'));
    els.regenerateBtnTop.addEventListener('click', () => generatePassword('button'));
    els.copyBtn.addEventListener('click', () => copyText());
    els.toggleVisibilityBtn.addEventListener('click', toggleVisibility);

    els.historyToggleBtn.addEventListener('click', toggleHistory);
    els.surpriseBtn.addEventListener('click', applySurpriseSettings);
    els.clearHistoryBtn.addEventListener('click', clearHistory);
    els.randomPresetBtn.addEventListener('click', applyRandomPreset);

    els.lengthSlider.addEventListener('input', () => {
      els.lengthValue.textContent = els.lengthSlider.value;
      setCustomMode();
      generatePassword('live');
    });

    els.excludeChars.addEventListener('input', () => {
      setCustomMode();
      generatePassword('live');
    });

    els.minUniqueChars.addEventListener('input', () => {
      const value = clamp(parseInt(els.minUniqueChars.value, 10) || 1, 1, 64);
      els.minUniqueChars.value = String(value);
      setCustomMode();
      generatePassword('live');
    });

    [els.requireEachType, els.excludeSimilar, els.avoidDuplicates, els.autoCopy].forEach((input) => {
      input.addEventListener('change', () => {
        setCustomMode();
        generatePassword('live');
      });
    });

    els.typeCards.forEach((card) => {
      card.addEventListener('click', () => {
        const activeCards = getActiveTypes();
        const isActive = card.classList.contains('active');

        if (isActive && activeCards.length === 1) {
          setStatus('⚠️ لازم يفضل نوع واحد على الأقل شغال', 'warning');
          shakeDisplay();
          return;
        }

        card.classList.toggle('active');
        setCustomMode();
        generatePassword('live');
      });
    });

    els.presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        applyPreset(btn.dataset.preset);
      });
    });

    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName;
      const typingNow = tag === 'INPUT' || tag === 'TEXTAREA';

      // Space = Generate
      if (e.key === ' ' && !typingNow) {
        e.preventDefault();
        generatePassword('shortcut');
      }

      // R = Regenerate
      if ((e.key === 'r' || e.key === 'R') && !typingNow) {
        e.preventDefault();
        generatePassword('shortcut');
      }

      // H = Toggle history
      if ((e.key === 'h' || e.key === 'H') && !typingNow) {
        e.preventDefault();
        toggleHistory();
      }

      // V = visibility
      if ((e.key === 'v' || e.key === 'V') && !typingNow) {
        e.preventDefault();
        toggleVisibility();
      }

      // Ctrl/Cmd + C = copy current password only if no selection
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        const selectedText = window.getSelection().toString();
        if (!selectedText && state.currentPassword) {
          e.preventDefault();
          copyText();
        }
      }
    });
  }

  // ─────────────────────────────────────────────
  // Init
  // ─────────────────────────────────────────────
  function init() {
    applySavedTheme();
    loadHistory();
    loadGeneratedCount();
    renderHistory();
    loadHistoryVisibility();

    els.lengthValue.textContent = els.lengthSlider.value;
    els.toggleVisibilityBtn.textContent = '👁️';

    applyPreset('balanced', { silent: true, generate: false });

    bindEvents();
    generatePassword('init');

    console.log('✅ Password Generator Premium جاهز!');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();