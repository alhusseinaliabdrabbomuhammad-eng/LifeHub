/* ═══════════════════════════════════════════════
   LifeHub - Dice & Random
   Premium Script — Fixed
═══════════════════════════════════════════════ */

(() => {
  'use strict';

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function applySavedTheme() {
    const savedTheme = localStorage.getItem('lifehub-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  function secureRandomInt(max) {
    if (!max || max <= 0) return 0;
    try {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      return arr[0] % max;
    } catch (_) {
      return Math.floor(Math.random() * max);
    }
  }

  function randomChoice(arr) {
    if (!arr || !arr.length) return null;
    return arr[secureRandomInt(arr.length)];
  }

  function shuffleArray(arr) {
    const clone = [...arr];
    for (let i = clone.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);
      [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
  }

  function setText(el, value) {
    if (el) el.textContent = value;
  }

  // ─────────────────────────────────────────────
  // Storage keys
  // ─────────────────────────────────────────────
  const STORAGE = {
    totalRolls:    'lifehub-total-rolls',
    totalRollsAlt: 'total_rolls',
    usage:         'lifehub-random-usage',
    wheelOptions:  'lifehub-wheel-options',
    wheelSound:    'lifehub-wheel-sound',
    coinStats:     'lifehub-random-coin-stats',
    lastResult:    'lifehub-random-last-result'
  };

  // ─────────────────────────────────────────────
  // DOM — safe references (null-checked at usage)
  // ─────────────────────────────────────────────
  const els = {
    // header / hero
    totalRolls:      $('totalRolls'),
    statusMessage:   $('statusMessage'),
    heroLastResult:  $('heroLastResult'),
    heroCurrentTool: $('heroCurrentTool'),
    heroFavoriteTool:$('heroFavoriteTool'),

    // tabs / panels
    tabs:   $$('.tab'),
    panels: $$('.panel'),

    // dice
    dicePanel:      $('dicePanel'),
    dice:           $('dice'),
    multiDiceTray:  $('multiDiceTray'),
    diceCount:      $('diceCount'),
    diceCountMinus: $('diceCountMinus'),
    diceCountPlus:  $('diceCountPlus'),
    rollDiceBtn:    $('rollDiceBtn'),
    diceState:      $('diceState'),
    diceTotal:      $('diceTotal'),
    diceBreakdown:  $('diceBreakdown'),

    // coin
    coinPanel:   $('coinPanel'),
    coin:        $('coin'),
    flipCoinBtn: $('flipCoinBtn'),
    headsCount:  $('headsCount'),
    tailsCount:  $('tailsCount'),
    coinResult:  $('coinResult'),
    coinSummary: $('coinSummary'),
    coinState:   $('coinState'),

    // wheel
    wheelPanel:      $('wheelPanel'),
    wheel:           $('wheel'),
    wheelCenterBtn:  $('wheelCenterBtn'),
    wheelCenterText: $('wheelCenterText'),
    spinWheelBtn:    $('spinWheelBtn'),
    resetWheelBtn:   $('resetWheelBtn'),
    soundToggleBtn:  $('soundToggleBtn'),
    soundIcon:       $('soundIcon'),
    wheelOptions:    $('wheelOptions'),
    entriesCount:    $('entriesCount'),
    wheelCountSmall: $('wheelCountSmall'),
    shuffleBtn:      $('shuffleBtn'),
    sortBtn:         $('sortBtn'),
    clearAllBtn:     $('clearAllBtn'),
    winnerModal:     $('winnerModal'),
    winnerName:      $('winnerName'),
    winnerCloseBtn:  $('winnerCloseBtn'),
    winnerRemoveBtn: $('winnerRemoveBtn'),
    confettiCanvas:  $('confettiCanvas'),

    // picker
    pickerPanel:   $('pickerPanel'),
    pickerOptions: $('pickerOptions'),
    pickBtn:       $('pickBtn'),
    pickerWinner:  $('pickerWinner'),
    pickerMeta:    $('pickerMeta'),
    pickerState:   $('pickerState'),

    // numbers
    numberPanel:         $('numberPanel'),
    minNumber:           $('minNumber'),
    maxNumber:           $('maxNumber'),
    countNumber:         $('countNumber'),
    uniqueNumbers:       $('uniqueNumbers'),
    generateNumbersBtn:  $('generateNumbersBtn'),
    numbersList:         $('numbersList'),
    numbersMeta:         $('numbersMeta'),
    numbersState:        $('numbersState'),

    // card
    cardPanel:          $('cardPanel'),
    playingCard:        $('playingCard'),
    drawCardBtn:        $('drawCardBtn'),
    cardTopValue:       $('cardTopValue'),
    cardTopSuit:        $('cardTopSuit'),
    cardCenter:         $('cardCenter'),
    cardBottomValue:    $('cardBottomValue'),
    cardBottomSuit:     $('cardBottomSuit'),
    cardTopCorner:      $('cardTopCorner'),
    cardBottomCorner:   $('cardBottomCorner'),
    cardName:           $('cardName'),
    cardMeta:           $('cardMeta'),
    cardState:          $('cardState')
  };

  // ─────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────
  const DEFAULT_USAGE = { dice: 0, coin: 0, wheel: 0, picker: 0, number: 0, card: 0 };
  const DEFAULT_COIN  = { heads: 0, tails: 0 };

  const state = {
    currentTab:  'dice',
    totalRolls:  parseInt(
      localStorage.getItem(STORAGE.totalRolls) ||
      localStorage.getItem(STORAGE.totalRollsAlt) || '0', 10
    ) || 0,

    // ✅ FIX: merge saved usage with defaults so keys are always present
    usage: Object.assign(
      {}, DEFAULT_USAGE,
      safeParse(localStorage.getItem(STORAGE.usage), {})
    ),

    lastResult: localStorage.getItem(STORAGE.lastResult) || '—',

    // dice
    diceCount:    1,
    diceBusy:     false,
    diceRotation: { x: 0, y: 0 },

    // coin
    coinBusy:  false,
    // ✅ FIX: merge saved coin stats with defaults so keys are always present
    coinStats: Object.assign(
      {}, DEFAULT_COIN,
      safeParse(localStorage.getItem(STORAGE.coinStats), {})
    ),
    coinRotation: 0,

    // wheel
    wheelOptions:       [],
    wheelBusy:          false,
    wheelRotation:      0,
    lastWinnerIndex:    -1,
    soundEnabled:       localStorage.getItem(STORAGE.wheelSound) !== 'off',
    audioContext:       null,
    confettiParticles:  [],
    confettiAnimationId:null,
    wheelTickTimer:     null,

    // picker
    pickerBusy:  false,
    pickerTimer: null,

    // card
    cardBusy: false
  };

  // ─────────────────────────────────────────────
  // Config maps
  // ─────────────────────────────────────────────
  const TAB_NAMES = {
    dice: 'نرد', coin: 'عملة', wheel: 'عجلة',
    picker: 'اختيار', number: 'أرقام', card: 'بطاقة'
  };

  const TAB_ICONS = {
    dice: '🎲', coin: '🪙', wheel: '🎰',
    picker: '🎯', number: '🔢', card: '🎴'
  };

  const DICE_ROTATIONS = {
    1: { x: 0,   y: 0   },
    2: { x: 0,   y: -90 },
    3: { x: 0,   y: 180 },
    4: { x: 0,   y: 90  },
    5: { x: -90, y: 0   },
    6: { x: 90,  y: 0   }
  };

  const WHEEL_COLORS = [
    '#ef4444','#f59e0b','#10b981','#3b82f6',
    '#8b5cf6','#ec4899','#06b6d4','#84cc16',
    '#f97316','#a855f7','#14b8a6','#eab308'
  ];

  const SUITS = [
    { symbol: '♠', name: 'بستوني', red: false },
    { symbol: '♥', name: 'قلب',    red: true  },
    { symbol: '♦', name: 'ديناري', red: true  },
    { symbol: '♣', name: 'سباتي',  red: false }
  ];

  const VALUES    = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const VALUES_AR = ['آس','2','3','4','5','6','7','8','9','10','شاب','بنت','ملك'];

  // ─────────────────────────────────────────────
  // Global UI updates
  // ─────────────────────────────────────────────
  function setStatus(message) {
    setText(els.statusMessage, message);
  }

  function saveTotalRolls() {
    localStorage.setItem(STORAGE.totalRolls,    String(state.totalRolls));
    localStorage.setItem(STORAGE.totalRollsAlt, String(state.totalRolls));
  }

  function saveUsage() {
    localStorage.setItem(STORAGE.usage, JSON.stringify(state.usage));
  }

  function saveLastResult(text) {
    state.lastResult = text || '—';
    localStorage.setItem(STORAGE.lastResult, state.lastResult);
  }

  function incrementGlobalUsage(toolName) {
    state.totalRolls += 1;
    // ✅ FIX: guard against undefined key
    if (typeof state.usage[toolName] === 'number') {
      state.usage[toolName] += 1;
    } else {
      state.usage[toolName] = 1;
    }
    saveTotalRolls();
    saveUsage();
    updateHeaderAndHeroStats();
  }

  function getFavoriteTool() {
    // ✅ FIX: guard against empty / null usage object
    if (!state.usage || typeof state.usage !== 'object') return 'dice';

    let bestTool = 'dice';
    let max = -1;

    Object.keys(state.usage).forEach((tool) => {
      const val = state.usage[tool];
      if (typeof val === 'number' && val > max) {
        max = val;
        bestTool = tool;
      }
    });

    return bestTool;
  }

  function updateHeaderAndHeroStats() {
    setText(els.totalRolls,      String(state.totalRolls));
    setText(els.heroLastResult,  state.lastResult || '—');
    setText(els.heroCurrentTool, TAB_NAMES[state.currentTab] || '—');

    // ✅ FIX: wrap in try-catch so a bad state never crashes the UI
    try {
      const favorite = getFavoriteTool();
      setText(els.heroFavoriteTool, `${TAB_ICONS[favorite] || '🎲'} ${TAB_NAMES[favorite] || ''}`);
    } catch (e) {
      setText(els.heroFavoriteTool, '🎲 نرد');
    }
  }

  // ─────────────────────────────────────────────
  // Tabs
  // ─────────────────────────────────────────────
  function switchTab(tabName) {
    state.currentTab = tabName;

    els.tabs.forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    els.panels.forEach((panel) => {
      panel.classList.toggle('active', panel.id === `${tabName}Panel`);
    });

    updateHeaderAndHeroStats();

    if (tabName === 'wheel') {
      requestAnimationFrame(() => { requestAnimationFrame(buildWheel); });
    }
  }

  function bindTabs() {
    els.tabs.forEach((tab) => {
      tab.addEventListener('click', () => { switchTab(tab.dataset.tab); });
    });
  }

  // ─────────────────────────────────────────────
  // Audio helpers
  // ─────────────────────────────────────────────
  function getAudioContext() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!state.audioContext) state.audioContext = new Ctx();
    if (state.audioContext.state === 'suspended') {
      state.audioContext.resume().catch(() => {});
    }
    return state.audioContext;
  }

  function playBeep(freq = 900, duration = 0.06, volume = 0.06, type = 'square') {
    if (!state.soundEnabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }

  function playWinSound() {
    if (!state.soundEnabled) return;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playBeep(freq, 0.18, 0.08, 'triangle'), i * 90);
    });
  }

  // ─────────────────────────────────────────────
  // Dice
  // ─────────────────────────────────────────────
  function updateDiceCountUI() {
    setText(els.diceCount, String(state.diceCount));
  }

  function renderMiniDiceResults(results) {
    if (!els.multiDiceTray) return;
    if (!results || !results.length) {
      els.multiDiceTray.innerHTML = '';
      return;
    }
    els.multiDiceTray.innerHTML = results.map(
      (value) => `<span class="mini-dice-chip">🎲 ${value}</span>`
    ).join('');
  }

  function rollDice() {
    if (state.diceBusy || !els.dice) return;
    state.diceBusy = true;
    setText(els.diceState, 'جاري الرمي...');
    setStatus('🎲 جاري رمي النرد...');

    const results   = Array.from({ length: state.diceCount }, () => secureRandomInt(6) + 1);
    const total     = results.reduce((sum, v) => sum + v, 0);
    const mainFace  = results[0];
    const baseRot   = DICE_ROTATIONS[mainFace];
    const extraTurns = 4 + secureRandomInt(3);

    state.diceRotation.x = baseRot.x + extraTurns * 360;
    state.diceRotation.y = baseRot.y + extraTurns * 360;

    els.dice.classList.add('rolling');
    els.dice.style.transform =
      `rotateX(${state.diceRotation.x}deg) rotateY(${state.diceRotation.y}deg)`;

    incrementGlobalUsage('dice');

    window.setTimeout(() => {
      els.dice.classList.remove('rolling');
      state.diceBusy = false;

      setText(els.diceTotal, String(total));
      renderMiniDiceResults(results);

      if (state.diceCount === 1) {
        setText(els.diceBreakdown, `النتيجة: ${mainFace}`);
        setText(els.diceState,     `آخر نتيجة: ${mainFace}`);
        // ✅ FIX: استخدام () بدل template tag خاطئ
        saveLastResult(`🎲 ${mainFace}`);
        setStatus(`🎲 رميت ${mainFace}`);
      } else {
        setText(els.diceBreakdown, results.join(' + '));
        setText(els.diceState,     `المجموع: ${total}`);
        saveLastResult(`🎲 ${total}`);
        setStatus(`🎲 مجموع ${state.diceCount} نرد = ${total}`);
      }

      updateHeaderAndHeroStats();
    }, 1600);
  }

  function bindDice() {
    els.diceCountMinus?.addEventListener('click', () => {
      state.diceCount = clamp(state.diceCount - 1, 1, 10);
      updateDiceCountUI();
    });
    els.diceCountPlus?.addEventListener('click', () => {
      state.diceCount = clamp(state.diceCount + 1, 1, 10);
      updateDiceCountUI();
    });
    els.rollDiceBtn?.addEventListener('click', rollDice);
  }

  // ─────────────────────────────────────────────
  // Coin
  // ─────────────────────────────────────────────
  function saveCoinStats() {
    localStorage.setItem(STORAGE.coinStats, JSON.stringify(state.coinStats));
  }

  function updateCoinStatsUI() {
    // ✅ FIX: optional chaining + fallback to 0 لو القيمة undefined
    setText(els.headsCount, String(state.coinStats?.heads ?? 0));
    setText(els.tailsCount, String(state.coinStats?.tails ?? 0));
  }

  function flipCoin() {
    if (state.coinBusy || !els.coin) return;
    state.coinBusy = true;
    setText(els.coinState, 'العملة في الهواء...');
    setStatus('🪙 جاري قلب العملة...');

    const isHeads = secureRandomInt(2) === 0;
    state.coinRotation += 1980 + (isHeads ? 0 : 180);

    els.coin.classList.add('flipping');
    els.coin.style.transform = `rotateY(${state.coinRotation}deg)`;

    incrementGlobalUsage('coin');

    window.setTimeout(() => {
      state.coinBusy = false;
      els.coin.classList.remove('flipping');

      if (isHeads) {
        state.coinStats.heads += 1;
        setText(els.coinResult,  'ملك');
        setText(els.coinSummary, '👑 الوجه الذهبي ظهر');
        setText(els.coinState,   'النتيجة: ملك');
        // ✅ FIX: استخدام () عادية
        saveLastResult('🪙 ملك');
        setStatus('🪙 النتيجة: ملك');
      } else {
        state.coinStats.tails += 1;
        setText(els.coinResult,  'كتابة');
        setText(els.coinSummary, '🦅 الوجه الآخر ظهر');
        setText(els.coinState,   'النتيجة: كتابة');
        saveLastResult('🪙 كتابة');
        setStatus('🪙 النتيجة: كتابة');
      }

      saveCoinStats();
      updateCoinStatsUI();
      updateHeaderAndHeroStats();
    }, 2000);
  }

  function bindCoin() {
    els.flipCoinBtn?.addEventListener('click', flipCoin);
    updateCoinStatsUI();
  }

  // ─────────────────────────────────────────────
  // Wheel
  // ─────────────────────────────────────────────
  function loadWheelOptions() {
    const saved    = localStorage.getItem(STORAGE.wheelOptions);
    const fallback = 'أحمد\nمحمد\nسارة\nليلى\nيوسف\nفاطمة';
    if (els.wheelOptions && !els.wheelOptions.value.trim()) {
      els.wheelOptions.value = saved || fallback;
    }
  }

  function parseWheelOptions() {
    if (!els.wheelOptions) return [];
    return els.wheelOptions.value
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function saveWheelOptions() {
    if (!els.wheelOptions) return;
    localStorage.setItem(STORAGE.wheelOptions, els.wheelOptions.value);
  }

  function updateWheelSoundUI() {
    if (els.soundIcon) {
      els.soundIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
    }
  }

  function buildWheel() {
    if (!els.wheel) return;

    state.wheelOptions = parseWheelOptions();
    setText(els.entriesCount,    `${state.wheelOptions.length} خيار`);
    setText(els.wheelCountSmall, String(state.wheelOptions.length));

    if (state.wheelOptions.length < 2) {
      els.wheel.classList.add('empty');
      els.wheel.innerHTML = '<div>أضف خيارين على الأقل</div>';
      els.wheel.style.background = '';
      if (els.spinWheelBtn)   els.spinWheelBtn.disabled   = true;
      if (els.wheelCenterBtn) els.wheelCenterBtn.disabled = true;
      return;
    }

    els.wheel.classList.remove('empty');
    if (els.spinWheelBtn)   els.spinWheelBtn.disabled   = false;
    if (els.wheelCenterBtn) els.wheelCenterBtn.disabled = false;

    const segAngle     = 360 / state.wheelOptions.length;
    const gradientParts = state.wheelOptions.map((_, i) => {
      const color = WHEEL_COLORS[i % WHEEL_COLORS.length];
      return `${color} ${i * segAngle}deg ${(i + 1) * segAngle}deg`;
    });

    els.wheel.style.background =
      `conic-gradient(from 0deg, ${gradientParts.join(', ')})`;
    els.wheel.innerHTML = '';

    const size       = els.wheel.offsetWidth || 420;
    const textRadius = (size / 2) * 0.68;

    state.wheelOptions.forEach((option, i) => {
      const angle = i * segAngle + segAngle / 2;
      const label = document.createElement('div');
      label.className = 'wheel-segment-label';

      let displayText = option;
      const maxLen =
        state.wheelOptions.length > 18 ? 8 :
        state.wheelOptions.length > 10 ? 12 : 18;
      if (displayText.length > maxLen) displayText = `${displayText.slice(0, maxLen)}…`;

      label.textContent = displayText;
      label.style.left  = '50%';
      label.style.top   = '50%';
      label.style.transform = `
        translate(-50%, -50%)
        rotate(${angle}deg)
        translate(0, -${textRadius}px)
        rotate(90deg)
      `;
      label.style.fontSize =
        state.wheelOptions.length > 18 ? '0.65rem' :
        state.wheelOptions.length > 10 ? '0.8rem'  : '0.95rem';

      els.wheel.appendChild(label);
    });
  }

  function stopWheelTicking() {
    if (state.wheelTickTimer) {
      clearInterval(state.wheelTickTimer);
      state.wheelTickTimer = null;
    }
  }

  function startWheelTicking(durationMs) {
    if (!state.soundEnabled) return;
    stopWheelTicking();
    const startedAt = Date.now();
    state.wheelTickTimer = setInterval(() => {
      if (Date.now() - startedAt >= durationMs - 120) {
        stopWheelTicking();
        return;
      }
      playBeep(1200, 0.03, 0.035, 'square');
    }, 90);
  }

  function spinWheel() {
    if (state.wheelBusy || !els.wheel || state.wheelOptions.length < 2) {
      if (state.wheelOptions.length < 2) setStatus('⚠️ أضف خيارين على الأقل للعجلة');
      return;
    }

    state.wheelBusy = true;
    setStatus('🎰 العجلة تدور...');
    setText(els.entriesCount,   `${state.wheelOptions.length} خيار`);
    setText(els.wheelCenterText, '...');

    if (els.spinWheelBtn)   els.spinWheelBtn.disabled   = true;
    if (els.wheelCenterBtn) els.wheelCenterBtn.disabled = true;

    const winnerIndex  = secureRandomInt(state.wheelOptions.length);
    state.lastWinnerIndex = winnerIndex;

    const segAngle    = 360 / state.wheelOptions.length;
    const targetAngle = 360 - (winnerIndex * segAngle) - (segAngle / 2);
    const fullTurns   = 5 + secureRandomInt(3);
    const duration    = 4200 + secureRandomInt(1400);

    state.wheelRotation = fullTurns * 360 + targetAngle;
    els.wheel.style.transition = `transform ${duration / 1000}s cubic-bezier(0.17, 0.67, 0.16, 0.99)`;
    els.wheel.style.transform  = `rotate(${state.wheelRotation}deg)`;

    const pointer = document.querySelector('.wheel-pointer-new');
    pointer?.classList.add('shaking');

    startWheelTicking(duration);
    incrementGlobalUsage('wheel');

    window.setTimeout(() => {
      state.wheelBusy = false;
      stopWheelTicking();
      pointer?.classList.remove('shaking');

      if (els.spinWheelBtn)   els.spinWheelBtn.disabled   = false;
      if (els.wheelCenterBtn) els.wheelCenterBtn.disabled = false;
      setText(els.wheelCenterText, 'دوّر');

      const winner = state.wheelOptions[winnerIndex];
      if (els.winnerName) els.winnerName.textContent = winner;
      els.winnerModal?.classList.add('active');

      playWinSound();
      startConfetti();
      // ✅ FIX: استخدام () عادية
      saveLastResult(`🎰 ${winner}`);
      updateHeaderAndHeroStats();
      setStatus(`🎉 الفائز: ${winner}`);
    }, duration + 50);
  }

  function resetWheelRotation() {
    if (!els.wheel) return;
    els.wheel.style.transition = 'transform 0.5s ease';
    state.wheelRotation = 0;
    els.wheel.style.transform = 'rotate(0deg)';
    setStatus('🔄 تم إعادة ضبط العجلة');
  }

  function closeWinnerModal() {
    els.winnerModal?.classList.remove('active');
    stopConfetti();
  }

  function removeWinnerAndSpinAgain() {
    if (state.lastWinnerIndex < 0 || state.lastWinnerIndex >= state.wheelOptions.length) {
      closeWinnerModal();
      return;
    }
    state.wheelOptions.splice(state.lastWinnerIndex, 1);
    if (els.wheelOptions) {
      els.wheelOptions.value = state.wheelOptions.join('\n');
      saveWheelOptions();
    }
    closeWinnerModal();
    buildWheel();
    resetWheelRotation();
    if (state.wheelOptions.length >= 2) {
      setTimeout(spinWheel, 650);
    } else {
      setStatus('ℹ️ لم يتبق خيارات كافية لإعادة الدوران');
    }
  }

  function bindWheel() {
    loadWheelOptions();
    updateWheelSoundUI();
    buildWheel();

    els.wheelOptions?.addEventListener('input', () => {
      saveWheelOptions();
      buildWheel();
    });

    els.spinWheelBtn?.addEventListener('click', spinWheel);
    els.wheelCenterBtn?.addEventListener('click', spinWheel);
    els.resetWheelBtn?.addEventListener('click', resetWheelRotation);

    els.soundToggleBtn?.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem(STORAGE.wheelSound, state.soundEnabled ? 'on' : 'off');
      updateWheelSoundUI();
      setStatus(state.soundEnabled ? '🔊 تم تفعيل الصوت' : '🔇 تم كتم الصوت');
    });

    els.shuffleBtn?.addEventListener('click', () => {
      const options = parseWheelOptions();
      if (options.length < 2) return;
      els.wheelOptions.value = shuffleArray(options).join('\n');
      saveWheelOptions();
      buildWheel();
      setStatus('🔀 تم خلط الخيارات');
    });

    els.sortBtn?.addEventListener('click', () => {
      const options = parseWheelOptions();
      if (options.length < 2) return;
      els.wheelOptions.value = [...options].sort((a, b) => a.localeCompare(b, 'ar')).join('\n');
      saveWheelOptions();
      buildWheel();
      setStatus('🔤 تم ترتيب الخيارات');
    });

    els.clearAllBtn?.addEventListener('click', () => {
      if (!confirm('هل تريد مسح كل خيارات العجلة؟')) return;
      els.wheelOptions.value = '';
      saveWheelOptions();
      buildWheel();
      setStatus('🗑️ تم مسح الخيارات');
    });

    els.winnerCloseBtn?.addEventListener('click', closeWinnerModal);
    els.winnerRemoveBtn?.addEventListener('click', removeWinnerAndSpinAgain);
    els.winnerModal?.addEventListener('click', (e) => {
      if (e.target === els.winnerModal) closeWinnerModal();
    });

    window.addEventListener('resize', () => {
      if (state.currentTab === 'wheel') requestAnimationFrame(buildWheel);
    });
  }

  // ─────────────────────────────────────────────
  // Confetti
  // ─────────────────────────────────────────────
  function startConfetti() {
    const canvas = els.confettiCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#f59e0b','#ef4444','#10b981','#3b82f6','#ec4899','#8b5cf6'];
    state.confettiParticles = Array.from({ length: 160 }, () => ({
      x:             Math.random() * canvas.width,
      y:             -20 - Math.random() * canvas.height * 0.2,
      vx:            (Math.random() - 0.5) * 6,
      vy:            2 + Math.random() * 4,
      size:          4 + Math.random() * 8,
      color:         randomChoice(colors),
      rotation:      Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10
    }));

    if (state.confettiAnimationId) cancelAnimationFrame(state.confettiAnimationId);

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      state.confettiParticles.forEach((p) => {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.03;
        p.rotation += p.rotationSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      state.confettiParticles = state.confettiParticles.filter((p) => p.y < canvas.height + 40);
      if (state.confettiParticles.length) {
        state.confettiAnimationId = requestAnimationFrame(animate);
      } else {
        state.confettiAnimationId = null;
      }
    }
    animate();
  }

  function stopConfetti() {
    const canvas = els.confettiCanvas;
    if (!canvas) return;
    if (state.confettiAnimationId) {
      cancelAnimationFrame(state.confettiAnimationId);
      state.confettiAnimationId = null;
    }
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    state.confettiParticles = [];
  }

  // ─────────────────────────────────────────────
  // Picker
  // ─────────────────────────────────────────────
  function parsePickerOptions() {
    if (!els.pickerOptions) return [];
    return els.pickerOptions.value
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function pickRandomItem() {
    if (state.pickerBusy) return;
    const options = parsePickerOptions();
    if (options.length < 2) {
      setStatus('⚠️ أضف خيارين على الأقل');
      setText(els.pickerState, 'أضف خيارات أكثر');
      return;
    }

    state.pickerBusy = true;
    setText(els.pickerState, 'جاري الاختيار...');
    setText(els.pickerMeta,  'العشوائية تختار الآن...');
    els.pickerWinner?.classList.add('animating');

    let counter = 0;
    const maxCounter = 20;
    incrementGlobalUsage('picker');

    state.pickerTimer = setInterval(() => {
      setText(els.pickerWinner, randomChoice(options));
      counter += 1;
      if (counter >= maxCounter) {
        clearInterval(state.pickerTimer);
        state.pickerTimer = null;
        state.pickerBusy  = false;

        const winner = randomChoice(options);
        setText(els.pickerWinner, winner);
        setText(els.pickerMeta,  `تم الاختيار من بين ${options.length} خيارات`);
        setText(els.pickerState, 'تم الاختيار');
        els.pickerWinner?.classList.remove('animating');
        // ✅ FIX: استخدام () عادية
        saveLastResult(`🎯 ${winner}`);
        updateHeaderAndHeroStats();
        setStatus(`🎯 الاختيار هو: ${winner}`);
      }
    }, 80);
  }

  function bindPicker() {
    els.pickBtn?.addEventListener('click', pickRandomItem);
  }

  // ─────────────────────────────────────────────
  // Numbers
  // ─────────────────────────────────────────────
  function generateNumbers() {
    const min    = parseInt(els.minNumber?.value,    10);
    const max    = parseInt(els.maxNumber?.value,    10);
    const count  = parseInt(els.countNumber?.value,  10);
    const unique = !!els.uniqueNumbers?.checked;

    if ([min, max, count].some((n) => Number.isNaN(n))) {
      setStatus('⚠️ أدخل أرقام صحيحة');
      setText(els.numbersState, 'خطأ في الإدخال');
      return;
    }
    if (min > max) {
      setStatus('⚠️ الحد الأدنى لازم يكون أصغر أو يساوي الحد الأقصى');
      setText(els.numbersState, 'تحقق من النطاق');
      return;
    }
    if (count < 1 || count > 50) {
      setStatus('⚠️ عدد الأرقام لازم يكون بين 1 و 50');
      setText(els.numbersState, 'عدد غير صالح');
      return;
    }

    const range = max - min + 1;
    if (unique && count > range) {
      setStatus('⚠️ لا يمكن توليد هذا العدد من الأرقام الفريدة');
      setText(els.numbersState, 'الفريد غير كافٍ');
      return;
    }

    const results = [];
    if (unique) {
      const pool = [];
      for (let i = min; i <= max; i++) pool.push(i);
      results.push(...shuffleArray(pool).slice(0, count));
    } else {
      for (let i = 0; i < count; i++) results.push(min + secureRandomInt(range));
    }

    incrementGlobalUsage('number');
    setText(els.numbersState, 'تم التوليد');
    setText(els.numbersMeta,  `${count} رقم • ${unique ? 'فريد' : 'قد يتكرر'}`);

    if (els.numbersList) {
      els.numbersList.innerHTML = results
        .map((num) => `<span class="number-chip">${num}</span>`)
        .join('');
    }

    // ✅ FIX: استخدام () عادية
    saveLastResult(`🔢 ${results.join(', ')}`);
    updateHeaderAndHeroStats();
    setStatus(`🔢 تم توليد ${count} رقم`);
  }

  function bindNumbers() {
    els.generateNumbersBtn?.addEventListener('click', generateNumbers);
  }

  // ─────────────────────────────────────────────
  // Cards
  // ─────────────────────────────────────────────
  function drawCard() {
    if (state.cardBusy || !els.playingCard) return;
    state.cardBusy = true;
    setText(els.cardState, 'جاري السحب...');
    setStatus('🎴 جاري سحب بطاقة...');

    els.playingCard.classList.remove('flipped');

    const suit       = randomChoice(SUITS);
    const valueIndex = secureRandomInt(VALUES.length);
    const value      = VALUES[valueIndex];
    const valueAr    = VALUES_AR[valueIndex];

    incrementGlobalUsage('card');

    setTimeout(() => {
      setText(els.cardTopValue,    value);
      setText(els.cardTopSuit,     suit.symbol);
      setText(els.cardCenter,      suit.symbol);
      setText(els.cardBottomValue, value);
      setText(els.cardBottomSuit,  suit.symbol);

      [els.cardTopCorner, els.cardCenter, els.cardBottomCorner].forEach((el) => {
        if (!el) return;
        el.classList.toggle('card-red', suit.red);
      });

      els.playingCard.classList.add('flipped');
      state.cardBusy = false;

      setText(els.cardName, `${valueAr} ${suit.name}`);
      setText(els.cardMeta, suit.red ? 'بطاقة حمراء' : 'بطاقة سوداء');
      setText(els.cardState, 'تم السحب');
      // ✅ FIX: استخدام () عادية
      saveLastResult(`🎴 ${valueAr} ${suit.name}`);
      updateHeaderAndHeroStats();
      setStatus(`🎴 سحبت: ${valueAr} ${suit.name}`);
    }, 550);
  }

  function bindCards() {
    els.drawCardBtn?.addEventListener('click', drawCard);
  }

  // ─────────────────────────────────────────────
  // Keyboard shortcuts
  // ─────────────────────────────────────────────
  function triggerCurrentTool() {
    if (state.currentTab === 'dice')   return rollDice();
    if (state.currentTab === 'coin')   return flipCoin();
    if (state.currentTab === 'wheel')  return spinWheel();
    if (state.currentTab === 'picker') return pickRandomItem();
    if (state.currentTab === 'number') return generateNumbers();
    if (state.currentTab === 'card')   return drawCard();
  }

  function bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement?.tagName;
      const typing    = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

      if (!typing) {
        if (e.key >= '1' && e.key <= '6') {
          e.preventDefault();
          const map = ['dice','coin','wheel','picker','number','card'];
          switchTab(map[Number(e.key) - 1]);
        }
        if (e.key === ' ') {
          e.preventDefault();
          triggerCurrentTool();
        }
      }

      if (e.key === 'Escape') closeWinnerModal();
    });
  }

  // ─────────────────────────────────────────────
  // Init
  // ─────────────────────────────────────────────
  function init() {
    applySavedTheme();
    updateDiceCountUI();
    bindTabs();
    bindDice();
    bindCoin();
    bindWheel();
    bindPicker();
    bindNumbers();
    bindCards();
    bindKeyboard();
    switchTab('dice');
    updateHeaderAndHeroStats();
    setStatus('✅ جاهز! اختر أداة وابدأ اللعب');
    console.log('✅ Dice & Random Premium جاهز!');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
