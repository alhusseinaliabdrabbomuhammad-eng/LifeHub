/* ═══════════════════════════════════════════════
   LifeHub - Pomodoro Pro
   Premium Script
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

  function uid(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('ar-EG', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatDateOnly(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getDayKey(timestamp = Date.now()) {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function isSameDay(a, b) {
    return getDayKey(a) === getDayKey(b);
  }

  function removeToneClasses(el) {
    if (!el) return;
    el.classList.remove('is-success', 'is-warning', 'is-danger');
  }

  function pulse(el) {
    if (!el) return;
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
  }

  function shake(el) {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }

  // ─────────────────────────────────────────────
  // Storage Keys
  // ─────────────────────────────────────────────
  const STORAGE = {
    settings: 'lifehub-pomodoro-settings',
    stats: 'lifehub-pomodoro-stats',
    tasks: 'lifehub-pomodoro-tasks',
    currentTask: 'lifehub-pomodoro-current-task',
    sound: 'lifehub-pomodoro-sound'
  };

  // ─────────────────────────────────────────────
  // Defaults
  // ─────────────────────────────────────────────
  const DEFAULT_SETTINGS = {
    focus: 25,
    short: 5,
    long: 15,
    cyclesBeforeLong: 4,
    dailyGoal: 8,
    autoStartBreaks: true,
    autoStartFocus: false,
    notifications: true,
    strictTreeMode: true,
    volume: 45,
    sound: 'none'
  };

  const DEFAULT_STATS = {
    sessions: [],
    trees: [],
    deadTrees: [],
    totalMinutes: 0,
    totalDied: 0,
    lastCompletedAt: null
  };

  // ─────────────────────────────────────────────
  // Data
  // ─────────────────────────────────────────────
  let settings = {
    ...DEFAULT_SETTINGS,
    ...safeParse(localStorage.getItem(STORAGE.settings), {})
  };

  let stats = {
    ...DEFAULT_STATS,
    ...safeParse(localStorage.getItem(STORAGE.stats), {})
  };

  let tasks = safeParse(localStorage.getItem(STORAGE.tasks), []);

  // backward safety
  if (!Array.isArray(stats.sessions)) stats.sessions = [];
  if (!Array.isArray(stats.trees)) stats.trees = [];
  if (!Array.isArray(stats.deadTrees)) stats.deadTrees = [];
  if (!Array.isArray(tasks)) tasks = [];

  // ─────────────────────────────────────────────
  // DOM
  // ─────────────────────────────────────────────
  const els = {
    // header / hero
    statusMessage: $('statusMessage'),
    dayStreak: $('dayStreak'),
    todayTrees: $('todayTrees'),
    dailyGoalDisplay: $('dailyGoalDisplay'),
    todayMinutes: $('todayMinutes'),
    focusLevel: $('focusLevel'),
    timerStateBadge: $('timerStateBadge'),
    nextBreakBadge: $('nextBreakBadge'),

    // task top
    currentTask: $('currentTask'),
    saveTaskBtn: $('saveTaskBtn'),
    pickTaskBtn: $('pickTaskBtn'),
    clearCurrentTaskBtn: $('clearCurrentTaskBtn'),
    currentTaskText: $('currentTaskText'),

    // timer
    timerTime: $('timerTime'),
    timerLabel: $('timerLabel'),
    timerOverline: $('timerOverline'),
    timerCycle: $('timerCycle'),
    ringProgress: $('ringProgress'),
    startBtn: $('startBtn'),
    startIcon: $('startIcon'),
    startText: $('startText'),
    resetBtn: $('resetBtn'),
    skipBtn: $('skipBtn'),

    // tree
    treeArt: $('treeArt'),
    treeMessage: $('treeMessage'),
    treeStageBadge: $('treeStageBadge'),
    treeProgressText: $('treeProgressText'),
    treeProgressFill: $('treeProgressFill'),

    // meta
    todaySessionsCount: $('todaySessionsCount'),
    totalTreesCount: $('totalTreesCount'),
    successRate: $('successRate'),

    // modes
    modeButtons: $$('.mode-btn'),

    // sound
    soundButtons: $$('.sound-btn'),
    currentSoundLabel: $('currentSoundLabel'),
    volumeSlider: $('volumeSlider'),
    volumeValue: $('volumeValue'),

    // weekly
    weeklyChart: $('weeklyChart'),
    weekSessions: $('weekSessions'),
    weekMinutes: $('weekMinutes'),
    weekTrees: $('weekTrees'),
    weekDailyAvg: $('weekDailyAvg'),
    weekHeadline: $('weekHeadline'),

    // focus score
    focusScore: $('focusScore'),
    focusMoodBadge: $('focusMoodBadge'),
    focusScoreTitle: $('focusScoreTitle'),
    focusScoreDesc: $('focusScoreDesc'),

    // tasks
    taskInput: $('taskInput'),
    pomoMinus: $('pomoMinus'),
    pomoPlus: $('pomoPlus'),
    pomoCount: $('pomoCount'),
    quickAddTask: $('quickAddTask'),
    tasksList: $('tasksList'),
    tasksSummary: $('tasksSummary'),
    clearDoneTasksBtn: $('clearDoneTasksBtn'),
    filterButtons: $$('.filter-btn'),

    // sessions
    sessionsList: $('sessionsList'),
    sessionsCountBadge: $('sessionsCountBadge'),

    // modals
    forestBtn: $('forestBtn'),
    statsBtn: $('statsBtn'),
    settingsBtn: $('settingsBtn'),

    forestModal: $('forestModal'),
    closeForest: $('closeForest'),
    forestTotalTrees: $('forestTotalTrees'),
    forestTotalHours: $('forestTotalHours'),
    forestDayStreak: $('forestDayStreak'),
    forestActiveDays: $('forestActiveDays'),
    forestDisplay: $('forestDisplay'),

    settingsModal: $('settingsModal'),
    closeSettings: $('closeSettings'),
    focusDuration: $('focusDuration'),
    shortDuration: $('shortDuration'),
    longDuration: $('longDuration'),
    cyclesBeforeLong: $('cyclesBeforeLong'),
    dailyGoal: $('dailyGoal'),
    autoStartBreaks: $('autoStartBreaks'),
    autoStartFocus: $('autoStartFocus'),
    enableNotifications: $('enableNotifications'),
    strictTreeMode: $('strictTreeMode'),
    presetButtons: $$('.preset-btn'),
    saveSettings: $('saveSettings'),
    numButtons: $$('.num-btn'),

    statsModal: $('statsModal'),
    closeStats: $('closeStats'),
    statTotalSessions: $('statTotalSessions'),
    statTotalMinutes: $('statTotalMinutes'),
    statTotalTrees: $('statTotalTrees'),
    statTotalDied: $('statTotalDied'),
    statBestStreak: $('statBestStreak'),
    statActiveDays: $('statActiveDays'),

    completeModal: $('completeModal'),
    completeIcon: $('completeIcon'),
    completeTitle: $('completeTitle'),
    completeMsg: $('completeMsg'),
    completeReward: $('completeReward'),
    completeOk: $('completeOk')
  };

  // ─────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────
  const state = {
    currentMode: 'focus',
    timeLeft: settings.focus * 60,
    totalTime: settings.focus * 60,
    isRunning: false,
    isPaused: false,
    endAt: 0,
    tickInterval: null,
    currentTaskId: null,
    currentTaskText: '',
    pomoDraft: 1,
    taskFilter: 'all',
    treeDead: false,
    currentSound: settings.sound || 'none',
    audioContext: null,
    noiseBuffer: null,
    soundNodes: null,
    statusTimer: null,
    autoTransitionTimer: null
  };

  // ─────────────────────────────────────────────
  // Theme
  // ─────────────────────────────────────────────
  function applySavedTheme() {
    const savedTheme = localStorage.getItem('lifehub-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // ─────────────────────────────────────────────
  // Persistence
  // ─────────────────────────────────────────────
  function saveSettings() {
    localStorage.setItem(STORAGE.settings, JSON.stringify(settings));
  }

  function saveStats() {
    localStorage.setItem(STORAGE.stats, JSON.stringify(stats));

    // دعم للداشبورد
    localStorage.setItem('pomodoro_sessions', String(stats.sessions.length));
    localStorage.setItem('lifehub-pomodoro-stats', JSON.stringify(stats));
  }

  function saveTasks() {
    localStorage.setItem(STORAGE.tasks, JSON.stringify(tasks));
  }

  function saveCurrentTaskState() {
    localStorage.setItem(
      STORAGE.currentTask,
      JSON.stringify({
        id: state.currentTaskId,
        text: state.currentTaskText
      })
    );
  }

  function loadCurrentTaskState() {
    const saved = safeParse(localStorage.getItem(STORAGE.currentTask), null);
    if (!saved) return;

    state.currentTaskId = saved.id || null;
    state.currentTaskText = saved.text || '';
  }

  // ─────────────────────────────────────────────
  // Status
  // ─────────────────────────────────────────────
  function setStatus(message, tone = 'neutral') {
    if (!els.statusMessage) return;

    clearTimeout(state.statusTimer);
    els.statusMessage.textContent = message;
    removeToneClasses(els.statusMessage);

    if (tone === 'success') els.statusMessage.classList.add('is-success');
    if (tone === 'warning') els.statusMessage.classList.add('is-warning');
    if (tone === 'danger') els.statusMessage.classList.add('is-danger');

    state.statusTimer = setTimeout(() => {
      removeToneClasses(els.statusMessage);
    }, 2600);
  }

  // ─────────────────────────────────────────────
  // Notifications
  // ─────────────────────────────────────────────
  function requestNotificationPermission() {
    if (!settings.notifications) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }

  function sendNotification(title, body) {
    if (!settings.notifications) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      new Notification(title, {
        body,
        icon: '🍅'
      });
    } catch (_) {}
  }

  // ─────────────────────────────────────────────
  // Audio
  // ─────────────────────────────────────────────
  function initAudio() {
    if (!window.AudioContext && !window.webkitAudioContext) return null;

    if (!state.audioContext) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      state.audioContext = new Ctx();
      state.noiseBuffer = createNoiseBuffer(state.audioContext, 2.5);
    }

    if (state.audioContext.state === 'suspended') {
      state.audioContext.resume().catch(() => {});
    }

    return state.audioContext;
  }

  function createNoiseBuffer(ctx, seconds = 2) {
    const buffer = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }

    return buffer;
  }

  function stopSound() {
    if (!state.soundNodes) return;

    try {
      if (state.soundNodes.timer) clearInterval(state.soundNodes.timer);
      if (state.soundNodes.lfo) state.soundNodes.lfo.stop();
      if (state.soundNodes.source) state.soundNodes.source.stop();
    } catch (_) {}

    try {
      state.soundNodes.source?.disconnect();
      state.soundNodes.filter?.disconnect();
      state.soundNodes.gain?.disconnect();
      state.soundNodes.master?.disconnect();
      state.soundNodes.lfoGain?.disconnect();
    } catch (_) {}

    state.soundNodes = null;
  }

  function applyVolume() {
    if (!els.volumeSlider || !els.volumeValue) return;

    settings.volume = clamp(parseInt(els.volumeSlider.value, 10) || 0, 0, 100);
    els.volumeValue.textContent = `${settings.volume}%`;

    if (state.soundNodes?.master) {
      const target = settings.volume / 100;
      state.soundNodes.master.gain.setTargetAtTime(
        target,
        state.audioContext.currentTime,
        0.08
      );
    }

    saveSettings();
  }

  function updateSoundButtons() {
    els.soundButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.sound === state.currentSound);
    });

    const labels = {
      none: '🔇 صامت',
      rain: '🌧️ مطر',
      forest: '🌲 غابة',
      cafe: '☕ مقهى',
      ocean: '🌊 محيط',
      fire: '🔥 مدفأة'
    };

    if (els.currentSoundLabel) {
      els.currentSoundLabel.textContent = labels[state.currentSound] || '🔇 صامت';
    }
  }

  function playSound(type) {
    state.currentSound = type;
    settings.sound = type;
    saveSettings();
    updateSoundButtons();

    stopSound();

    if (type === 'none') {
      setStatus('🔇 تم إيقاف الأصوات الخلفية');
      return;
    }

    const ctx = initAudio();
    if (!ctx || !state.noiseBuffer) {
      setStatus('⚠️ المتصفح الحالي لا يدعم الأصوات بالشكل الكامل', 'warning');
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = state.noiseBuffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const master = ctx.createGain();
    master.gain.value = settings.volume / 100;

    let timer = null;
    let lfo = null;
    let lfoGain = null;

    if (type === 'rain') {
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 0.8;
      gain.gain.value = 0.48;
    }

    if (type === 'forest') {
      filter.type = 'highpass';
      filter.frequency.value = 500;
      gain.gain.value = 0.34;
    }

    if (type === 'cafe') {
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      gain.gain.value = 0.3;
    }

    if (type === 'ocean') {
      filter.type = 'lowpass';
      filter.frequency.value = 700;
      gain.gain.value = 0.42;

      lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08;

      lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.08;

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
    }

    if (type === 'fire') {
      filter.type = 'bandpass';
      filter.frequency.value = 1600;
      filter.Q.value = 0.6;
      gain.gain.value = 0.26;

      timer = setInterval(() => {
        if (!state.audioContext) return;
        const now = state.audioContext.currentTime;
        const nextGain = 0.18 + Math.random() * 0.16;
        const nextFreq = 1100 + Math.random() * 1600;

        gain.gain.cancelScheduledValues(now);
        gain.gain.setTargetAtTime(nextGain, now, 0.12);

        filter.frequency.cancelScheduledValues(now);
        filter.frequency.setTargetAtTime(nextFreq, now, 0.12);
      }, 340);
    }

    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    master.connect(ctx.destination);
    source.start();

    state.soundNodes = { source, filter, gain, master, timer, lfo, lfoGain };
    setStatus(`🎵 تم تشغيل: ${els.currentSoundLabel.textContent}`, 'success');
  }

  // ─────────────────────────────────────────────
  // Tree Drawing
  // ─────────────────────────────────────────────
  function drawTree(progress = 0, dead = false) {
    if (!els.treeArt) return;

    const pct = clamp(Math.round(progress * 100), 0, 100);

    if (els.treeProgressText) els.treeProgressText.textContent = `${pct}%`;
    if (els.treeProgressFill) els.treeProgressFill.style.width = `${pct}%`;

    if (dead) {
      els.treeArt.innerHTML = `
        <rect x="104" y="175" width="12" height="72" rx="4" fill="#6b4423"></rect>
        <path d="M110 176 L88 198 M110 176 L132 198 M110 170 L110 155" stroke="#6b4423" stroke-width="4" stroke-linecap="round"></path>
        <text x="110" y="130" text-anchor="middle" font-size="44">💀</text>
        <ellipse cx="110" cy="248" rx="42" ry="6" fill="rgba(239,68,68,0.12)"></ellipse>
      `;
      els.treeMessage.textContent = '💔 الشجرة ماتت لأن الجلسة اتوقفت';
      els.treeStageBadge.textContent = 'Dead';
      return;
    }

    if (progress <= 0) {
      els.treeArt.innerHTML = `
        <ellipse cx="110" cy="248" rx="22" ry="5" fill="rgba(16,185,129,0.18)"></ellipse>
        <text x="110" y="228" text-anchor="middle" font-size="34">🌱</text>
      `;
      els.treeMessage.textContent = '🌱 بذرة جاهزة للنمو';
      els.treeStageBadge.textContent = 'Stage 0';
      return;
    }

    if (progress < 0.2) {
      els.treeArt.innerHTML = `
        <rect x="107" y="205" width="6" height="40" rx="3" fill="#6b4423"></rect>
        <ellipse cx="110" cy="197" rx="20" ry="16" fill="#34d399"></ellipse>
        <ellipse cx="98" cy="192" rx="10" ry="7" fill="#6ee7b7"></ellipse>
        <ellipse cx="122" cy="192" rx="10" ry="7" fill="#6ee7b7"></ellipse>
      `;
      els.treeMessage.textContent = '🌿 بدأت تنبت';
      els.treeStageBadge.textContent = 'Stage 1';
      return;
    }

    if (progress < 0.45) {
      els.treeArt.innerHTML = `
        <rect x="104" y="185" width="12" height="60" rx="5" fill="#6b4423"></rect>
        <circle cx="110" cy="175" r="28" fill="#10b981"></circle>
        <circle cx="90" cy="180" r="18" fill="#34d399"></circle>
        <circle cx="130" cy="180" r="18" fill="#34d399"></circle>
        <circle cx="110" cy="160" r="18" fill="#6ee7b7"></circle>
      `;
      els.treeMessage.textContent = '🌳 شجرة صغيرة';
      els.treeStageBadge.textContent = 'Stage 2';
      return;
    }

    if (progress < 0.75) {
      els.treeArt.innerHTML = `
        <rect x="102" y="170" width="16" height="76" rx="6" fill="#6b4423"></rect>
        <circle cx="110" cy="148" r="42" fill="#059669"></circle>
        <circle cx="80" cy="160" r="24" fill="#10b981"></circle>
        <circle cx="140" cy="160" r="24" fill="#10b981"></circle>
        <circle cx="110" cy="120" r="28" fill="#34d399"></circle>
        <circle cx="92" cy="136" r="16" fill="#6ee7b7"></circle>
        <circle cx="128" cy="136" r="16" fill="#6ee7b7"></circle>
      `;
      els.treeMessage.textContent = '🌲 الشجرة بتكبر بقوة';
      els.treeStageBadge.textContent = 'Stage 3';
      return;
    }

    if (progress < 1) {
      els.treeArt.innerHTML = `
        <rect x="100" y="162" width="20" height="84" rx="7" fill="#5c3a1e"></rect>
        <circle cx="110" cy="140" r="50" fill="#047857"></circle>
        <circle cx="76" cy="152" r="28" fill="#059669"></circle>
        <circle cx="144" cy="152" r="28" fill="#059669"></circle>
        <circle cx="110" cy="106" r="34" fill="#10b981"></circle>
        <circle cx="88" cy="124" r="18" fill="#34d399"></circle>
        <circle cx="132" cy="124" r="18" fill="#34d399"></circle>
        <circle cx="110" cy="88" r="20" fill="#6ee7b7"></circle>
      `;
      els.treeMessage.textContent = '🌳 قربت تكتمل';
      els.treeStageBadge.textContent = 'Stage 4';
      return;
    }

    els.treeArt.innerHTML = `
      <rect x="100" y="162" width="20" height="84" rx="7" fill="#5c3a1e"></rect>
      <circle cx="110" cy="140" r="50" fill="#047857"></circle>
      <circle cx="76" cy="152" r="28" fill="#059669"></circle>
      <circle cx="144" cy="152" r="28" fill="#059669"></circle>
      <circle cx="110" cy="106" r="34" fill="#10b981"></circle>
      <circle cx="88" cy="124" r="18" fill="#34d399"></circle>
      <circle cx="132" cy="124" r="18" fill="#34d399"></circle>
      <circle cx="110" cy="88" r="20" fill="#6ee7b7"></circle>

      <circle cx="86" cy="108" r="4" fill="#ec4899"></circle>
      <circle cx="132" cy="104" r="4" fill="#f59e0b"></circle>
      <circle cx="116" cy="95" r="4" fill="#facc15"></circle>
      <circle cx="98" cy="132" r="4" fill="#ec4899"></circle>
      <circle cx="140" cy="136" r="4" fill="#f59e0b"></circle>
      <circle cx="76" cy="142" r="4" fill="#facc15"></circle>
    `;
    els.treeMessage.textContent = '🌸 شجرة مزدهرة! جلسة ناجحة بالكامل';
    els.treeStageBadge.textContent = 'Full Bloom';
  }

  function renderRestScene() {
    if (!els.treeArt) return;

    const emoji = state.currentMode === 'long' ? '🛋️' : '☕';
    const text = state.currentMode === 'long' ? 'استراحة طويلة لاستعادة الطاقة' : 'استراحة قصيرة وخفيفة';

    els.treeArt.innerHTML = `
      <text x="110" y="145" text-anchor="middle" font-size="58">${emoji}</text>
      <circle cx="84" cy="98" r="4" fill="rgba(255,255,255,0.35)"></circle>
      <circle cx="96" cy="84" r="6" fill="rgba(255,255,255,0.28)"></circle>
      <circle cx="110" cy="72" r="8" fill="rgba(255,255,255,0.18)"></circle>
    `;

    els.treeMessage.textContent = text;
    els.treeStageBadge.textContent = state.currentMode === 'long' ? 'Long Break' : 'Short Break';
  }

  // ─────────────────────────────────────────────
  // Timer UI
  // ─────────────────────────────────────────────
  function updateDocumentTitle() {
    document.title = `${formatTime(state.timeLeft)} — Pomodoro Pro`;
  }

  function updateRingColor() {
    if (!els.ringProgress) return;

    if (state.currentMode === 'focus') {
      els.ringProgress.style.stroke = '#ec4899';
      return;
    }

    if (state.currentMode === 'short') {
      els.ringProgress.style.stroke = '#10b981';
      return;
    }

    els.ringProgress.style.stroke = '#3b82f6';
  }

  function updateTimerStateBadge() {
    if (!els.timerStateBadge) return;

    if (state.isRunning) {
      els.timerStateBadge.textContent = state.currentMode === 'focus' ? 'شغّال الآن' : 'استراحة جارية';
      return;
    }

    if (state.isPaused) {
      els.timerStateBadge.textContent = 'متوقف مؤقتًا';
      return;
    }

    els.timerStateBadge.textContent = 'جاهز';
  }

  function getCompletedFocusSessionsCount() {
    return stats.sessions.length;
  }

  function getCurrentCycleIndex() {
    return (getCompletedFocusSessionsCount() % settings.cyclesBeforeLong) + 1;
  }

  function getNextBreakMode() {
    return getCompletedFocusSessionsCount() % settings.cyclesBeforeLong === 0 ? 'long' : 'short';
  }

  function updateModeMetaLabels() {
    const map = {
      focus: `${settings.focus} دقيقة`,
      short: `${settings.short} دقائق`,
      long: `${settings.long} دقيقة`
    };

    els.modeButtons.forEach((btn) => {
      const meta = btn.querySelector('.mode-meta');
      if (meta) meta.textContent = map[btn.dataset.mode] || '';
    });
  }

  function updateCycleInfo() {
    const currentCycle = getCurrentCycleIndex();
    const nextLongIn = settings.cyclesBeforeLong - ((getCompletedFocusSessionsCount()) % settings.cyclesBeforeLong);

    if (els.timerCycle) {
      if (state.currentMode === 'focus') {
        els.timerCycle.textContent = `جلسة ${currentCycle} من ${settings.cyclesBeforeLong}`;
      } else {
        els.timerCycle.textContent = state.currentMode === 'short' ? 'استراحة قصيرة' : 'استراحة طويلة';
      }
    }

    if (els.nextBreakBadge) {
      if (nextLongIn === settings.cyclesBeforeLong) {
        els.nextBreakBadge.textContent = 'الراحة التالية: طويلة الآن';
      } else {
        els.nextBreakBadge.textContent = `الراحة الطويلة بعد ${nextLongIn} جلسة`;
      }
    }
  }

  function updateControlButton() {
    if (!els.startIcon || !els.startText || !els.startBtn) return;

    if (state.isRunning) {
      els.startIcon.textContent = '⏸';
      els.startText.textContent = state.currentMode === 'focus' && settings.strictTreeMode ? 'إيقاف' : 'إيقاف';
      els.startBtn.classList.add('pause');
      return;
    }

    if (state.isPaused) {
      els.startIcon.textContent = '▶';
      els.startText.textContent = 'استكمال';
      els.startBtn.classList.remove('pause');
      return;
    }

    els.startIcon.textContent = '▶';
    els.startText.textContent = 'ابدأ';
    els.startBtn.classList.remove('pause');
  }

  function updateDisplay() {
    if (els.timerTime) els.timerTime.textContent = formatTime(state.timeLeft);

    if (els.timerLabel) {
      if (state.currentMode === 'focus') els.timerLabel.textContent = 'جلسة تركيز';
      if (state.currentMode === 'short') els.timerLabel.textContent = 'راحة قصيرة';
      if (state.currentMode === 'long') els.timerLabel.textContent = 'راحة طويلة';
    }

    if (els.timerOverline) {
      if (state.currentMode === 'focus') els.timerOverline.textContent = 'Pomodoro Session';
      if (state.currentMode === 'short') els.timerOverline.textContent = 'Quick Recharge';
      if (state.currentMode === 'long') els.timerOverline.textContent = 'Deep Recovery';
    }

    const circumference = 2 * Math.PI * 96;
    const progress = clamp((state.totalTime - state.timeLeft) / Math.max(state.totalTime, 1), 0, 1);
    const offset = circumference * (1 - progress);

    if (els.ringProgress) {
      els.ringProgress.style.strokeDasharray = String(circumference);
      els.ringProgress.style.strokeDashoffset = String(offset);
    }

    if (state.currentMode === 'focus') {
      drawTree(progress, state.treeDead);
    } else {
      if (els.treeProgressText) els.treeProgressText.textContent = `${Math.round(progress * 100)}%`;
      if (els.treeProgressFill) els.treeProgressFill.style.width = `${progress * 100}%`;
      renderRestScene();
    }

    updateRingColor();
    updateDocumentTitle();
    updateTimerStateBadge();
    updateCycleInfo();
    updateControlButton();
  }

  function applyMode(mode, options = {}) {
    state.currentMode = mode;
    state.treeDead = false;

    if (mode === 'focus') {
      state.totalTime = settings.focus * 60;
      if (!options.keepTime) state.timeLeft = state.totalTime;
    }

    if (mode === 'short') {
      state.totalTime = settings.short * 60;
      if (!options.keepTime) state.timeLeft = state.totalTime;
    }

    if (mode === 'long') {
      state.totalTime = settings.long * 60;
      if (!options.keepTime) state.timeLeft = state.totalTime;
    }

    state.isPaused = false;

    els.modeButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    updateDisplay();

    if (!options.silent) {
      const labels = {
        focus: '🎯 تم التبديل إلى جلسة التركيز',
        short: '☕ تم التبديل إلى الراحة القصيرة',
        long: '🛋️ تم التبديل إلى الراحة الطويلة'
      };
      setStatus(labels[mode] || '✅ تم التبديل');
    }
  }

  // ─────────────────────────────────────────────
  // Tasks
  // ─────────────────────────────────────────────
  function getCurrentTaskLabel() {
    if (state.currentTaskText?.trim()) return state.currentTaskText.trim();

    const selected = tasks.find((task) => task.id === state.currentTaskId);
    return selected?.text || 'بدون اسم';
  }

  function updateCurrentTaskUI() {
    const currentLabel = getCurrentTaskLabel();

    if (els.currentTaskText) {
      els.currentTaskText.textContent = currentLabel || 'لا توجد مهمة محددة الآن';
    }

    if (els.currentTask) {
      els.currentTask.value = state.currentTaskText || '';
    }

    renderTasks();
  }

  function selectTask(taskId) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    state.currentTaskId = task.id;
    state.currentTaskText = task.text;
    saveCurrentTaskState();
    updateCurrentTaskUI();
    setStatus(`🎯 تم اختيار المهمة: ${task.text}`, 'success');
  }

  function clearCurrentTask() {
    state.currentTaskId = null;
    state.currentTaskText = '';
    saveCurrentTaskState();
    updateCurrentTaskUI();
    setStatus('🧹 تم مسح المهمة الحالية');
  }

  function saveCurrentTaskFromInput() {
    const value = (els.currentTask?.value || '').trim();

    if (!value) {
      setStatus('⚠️ اكتب اسم المهمة أولًا', 'warning');
      shake(els.currentTask);
      return;
    }

    const matchedTask = tasks.find((task) => task.text === value);
    state.currentTaskId = matchedTask ? matchedTask.id : null;
    state.currentTaskText = value;

    saveCurrentTaskState();
    updateCurrentTaskUI();
    setStatus('💾 تم حفظ المهمة الحالية', 'success');
  }

  function addTask() {
    const text = (els.taskInput?.value || '').trim();
    if (!text) {
      setStatus('⚠️ اكتب اسم المهمة الأول', 'warning');
      shake(els.taskInput);
      return;
    }

    const pomos = clamp(state.pomoDraft, 1, 20);

    tasks.unshift({
      id: uid('task'),
      text,
      pomos,
      completedPomos: 0,
      done: false,
      createdAt: Date.now()
    });

    els.taskInput.value = '';
    state.pomoDraft = 1;
    if (els.pomoCount) els.pomoCount.textContent = '1';

    saveTasks();
    renderTasks();
    updateTaskSummary();
    setStatus('➕ تمت إضافة المهمة', 'success');

    if (!state.currentTaskText) {
      selectTask(tasks[0].id);
    }
  }

  function toggleTaskDone(taskId) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    task.done = !task.done;

    if (task.done && task.completedPomos < task.pomos) {
      task.completedPomos = task.pomos;
    }

    if (!task.done && task.completedPomos >= task.pomos) {
      task.completedPomos = Math.max(task.pomos - 1, 0);
    }

    saveTasks();
    renderTasks();
    updateTaskSummary();

    setStatus(task.done ? '✅ تم إنهاء المهمة' : '↩️ تم إعادة فتح المهمة', 'success');
  }

  function incrementTaskPomo(taskId) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    task.completedPomos = clamp((task.completedPomos || 0) + 1, 0, task.pomos);
    if (task.completedPomos >= task.pomos) {
      task.done = true;
    }

    saveTasks();
    renderTasks();
    updateTaskSummary();
  }

  function deleteTask(taskId) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    if (!confirm(`حذف المهمة "${task.text}" ؟`)) return;

    tasks = tasks.filter((item) => item.id !== taskId);

    if (state.currentTaskId === taskId) {
      state.currentTaskId = null;
      state.currentTaskText = '';
      saveCurrentTaskState();
    }

    saveTasks();
    updateCurrentTaskUI();
    renderTasks();
    updateTaskSummary();
    setStatus('🗑️ تم حذف المهمة');
  }

  function clearDoneTasks() {
    const doneCount = tasks.filter((task) => task.done).length;
    if (!doneCount) {
      setStatus('ℹ️ لا توجد مهام منجزة لمسحها');
      return;
    }

    tasks = tasks.filter((task) => !task.done);
    saveTasks();
    renderTasks();
    updateTaskSummary();
    setStatus('🧹 تم مسح كل المهام المنجزة', 'success');
  }

  function pickNextTask() {
    const activeTasks = tasks.filter((task) => !task.done);
    if (!activeTasks.length) {
      setStatus('⚠️ لا توجد مهام متاحة حاليًا', 'warning');
      return;
    }

    if (!state.currentTaskId) {
      selectTask(activeTasks[0].id);
      return;
    }

    const index = activeTasks.findIndex((task) => task.id === state.currentTaskId);
    const nextIndex = index === -1 ? 0 : (index + 1) % activeTasks.length;
    selectTask(activeTasks[nextIndex].id);
  }

  function renderTasks() {
    if (!els.tasksList) return;

    let visibleTasks = [...tasks];

    if (state.taskFilter === 'active') {
      visibleTasks = visibleTasks.filter((task) => !task.done);
    }

    if (state.taskFilter === 'done') {
      visibleTasks = visibleTasks.filter((task) => task.done);
    }

    els.filterButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.filter === state.taskFilter);
    });

    if (!visibleTasks.length) {
      els.tasksList.innerHTML = `
        <div class="empty-state compact">
          <div class="empty-icon">📝</div>
          <p class="empty-title">لسه مفيش مهام في الفلتر ده</p>
          <p class="empty-desc">بدّل الفلتر أو أضف مهمة جديدة</p>
        </div>
      `;
      return;
    }

    els.tasksList.innerHTML = visibleTasks.map((task) => {
      const isActive = state.currentTaskId === task.id || state.currentTaskText === task.text;
      const done = !!task.done;

      return `
        <article class="task-item ${done ? 'completed' : ''} ${isActive ? 'active' : ''}">
          <button class="task-check ${done ? 'checked' : ''}" type="button" data-action="toggle" data-task-id="${task.id}">
            ${done ? '✓' : ''}
          </button>

          <div class="task-info">
            <div class="task-name">${escapeHtml(task.text)}</div>
            <div class="task-meta">
              <span class="task-pomos-badge">🍅 ${task.completedPomos || 0}/${task.pomos}</span>
              <span>${done ? 'منجزة' : 'قيد التنفيذ'}</span>
              <span>${formatDateOnly(task.createdAt)}</span>
            </div>
          </div>

          <div class="task-actions">
            <button class="task-btn" type="button" data-action="select" data-task-id="${task.id}">اختيار</button>
            <button class="task-btn" type="button" data-action="plus" data-task-id="${task.id}">+1</button>
            <button class="task-btn delete" type="button" data-action="delete" data-task-id="${task.id}">حذف</button>
          </div>
        </article>
      `;
    }).join('');

    els.tasksList.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const taskId = btn.getAttribute('data-task-id');
        const action = btn.getAttribute('data-action');

        if (action === 'toggle') toggleTaskDone(taskId);
        if (action === 'select') selectTask(taskId);
        if (action === 'plus') incrementTaskPomo(taskId);
        if (action === 'delete') deleteTask(taskId);
      });
    });
  }

  function updateTaskSummary() {
    const total = tasks.length;
    const done = tasks.filter((task) => task.done).length;
    const planned = tasks.reduce((sum, task) => sum + (task.pomos || 0), 0);

    if (els.tasksSummary) {
      els.tasksSummary.textContent = `${total} مهام • ${done} منجَز • ${planned} بومودورو مخطط`;
    }
  }

  // ─────────────────────────────────────────────
  // Sessions / Stats helpers
  // ─────────────────────────────────────────────
  function getTodaySessions() {
    return stats.sessions.filter((session) => isSameDay(session.date, Date.now()));
  }

  function getTodayDeadTrees() {
    return stats.deadTrees.filter((item) => isSameDay(item.date, Date.now()));
  }

  function getUniqueActiveDays() {
    const set = new Set(stats.sessions.map((session) => getDayKey(session.date)));
    return [...set];
  }

  function calculateCurrentStreak() {
    const days = new Set(stats.sessions.map((session) => getDayKey(session.date)));
    if (!days.size) return 0;

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 3650; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = getDayKey(d.getTime());

      if (days.has(key)) {
        streak++;
      } else {
        if (i === 0) return 0;
        break;
      }
    }

    return streak;
  }

  function calculateBestStreak() {
    const keys = [...new Set(stats.sessions.map((session) => getDayKey(session.date)))]
      .map((key) => {
        const [y, m, d] = key.split('-').map(Number);
        return new Date(y, m - 1, d).getTime();
      })
      .sort((a, b) => a - b);

    if (!keys.length) return 0;

    let best = 1;
    let current = 1;

    for (let i = 1; i < keys.length; i++) {
      const prev = new Date(keys[i - 1]);
      const curr = new Date(keys[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        current++;
        best = Math.max(best, current);
      } else if (diffDays > 1) {
        current = 1;
      }
    }

    return best;
  }

  function getTodayMinutes() {
    return getTodaySessions().reduce((sum, session) => sum + (session.duration || 0), 0);
  }

  function getLevelInfo() {
    const xp = stats.totalMinutes + stats.sessions.length * 10;
    const level = Math.max(1, Math.floor(xp / 180) + 1);
    return { xp, level };
  }

  function getSuccessRate() {
    const all = stats.trees.length + stats.totalDied;
    if (!all) return 0;
    return Math.round((stats.trees.length / all) * 100);
  }

  function getFocusScoreData() {
    const todaySessions = getTodaySessions().length;
    const todayMinutes = getTodayMinutes();
    const streak = calculateCurrentStreak();
    const diedToday = getTodayDeadTrees().length;

    let score = todaySessions * 11 + todayMinutes * 0.45 + streak * 4 - diedToday * 12;
    score = clamp(Math.round(score), 0, 100);

    let badge = 'هادئ';
    let title = 'ابدأ أول جلسة';
    let desc = 'مع كل جلسة تركز فيها، يومك هيبقى أوضح وغابتك تكبر.';

    if (score >= 1 && score < 35) {
      badge = 'بداية';
      title = 'أنت لسه بتسخّن';
      desc = 'جلسة أو اتنين كفاية يبدّلوا مود اليوم بالكامل.';
    }

    if (score >= 35 && score < 65) {
      badge = 'مستقر';
      title = 'يومك ماشي بشكل كويس';
      desc = 'أنت داخل على فلو جميل، كمّل جلسة كمان واثبت الرتم.';
    }

    if (score >= 65 && score < 85) {
      badge = 'قوي';
      title = 'تركيزك ممتاز';
      desc = 'إيقاعك النهارده قوي فعلًا، حافظ على الاستراحات القصيرة.';
    }

    if (score >= 85) {
      badge = 'وحش التركيز';
      title = 'أنت في أعلى تركيز';
      desc = 'يوم خارق. لو كملت بنفس الشكل هتزود الغابة بسرعة رهيبة.';
    }

    return { score, badge, title, desc };
  }

  function getWeekData() {
    const today = new Date();
    const result = [];
    let totalSessions = 0;
    let totalMinutes = 0;

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = getDayKey(date.getTime());

      const daySessions = stats.sessions.filter((session) => getDayKey(session.date) === key);
      const count = daySessions.length;
      const minutes = daySessions.reduce((sum, session) => sum + (session.duration || 0), 0);

      totalSessions += count;
      totalMinutes += minutes;

      result.push({
        label: date.toLocaleDateString('ar-EG', { weekday: 'short' }),
        count,
        minutes,
        isToday: i === 0
      });
    }

    return {
      days: result,
      totalSessions,
      totalMinutes,
      totalTrees: totalSessions,
      avgDaily: Math.round(totalSessions / 7)
    };
  }

  // ─────────────────────────────────────────────
  // Renderers
  // ─────────────────────────────────────────────
  function renderWeeklyChart() {
    if (!els.weeklyChart) return;

    const week = getWeekData();
    const max = Math.max(...week.days.map((day) => day.count), 1);

    els.weeklyChart.innerHTML = week.days.map((day) => {
      const height = Math.max(6, (day.count / max) * 100);

      return `
        <div class="day-bar">
          <div class="bar-value">${day.count}</div>
          <div class="bar-fill ${day.isToday ? 'today' : ''}" style="height:${height}%"></div>
          <div class="bar-label">${escapeHtml(day.label)}</div>
        </div>
      `;
    }).join('');

    if (els.weekSessions) els.weekSessions.textContent = String(week.totalSessions);
    if (els.weekMinutes) els.weekMinutes.textContent = String(week.totalMinutes);
    if (els.weekTrees) els.weekTrees.textContent = String(week.totalTrees);
    if (els.weekDailyAvg) els.weekDailyAvg.textContent = String(week.avgDaily);
  }

  function renderSessionsList() {
    if (!els.sessionsList) return;

    const latest = [...stats.sessions].slice(-12).reverse();

    if (!latest.length) {
      els.sessionsList.innerHTML = `
        <div class="empty-state compact">
          <div class="empty-icon">⏳</div>
          <p class="empty-title">لا يوجد سجل بعد</p>
          <p class="empty-desc">أكمل أول جلسة تركيز لتبدأ الإحصائيات</p>
        </div>
      `;
      if (els.sessionsCountBadge) els.sessionsCountBadge.textContent = '0 جلسة';
      return;
    }

    if (els.sessionsCountBadge) {
      els.sessionsCountBadge.textContent = `${stats.sessions.length} جلسة`;
    }

    els.sessionsList.innerHTML = latest.map((session) => `
      <article class="session-item">
        <div class="session-icon">🌳</div>
        <div class="session-info">
          <div class="session-task">${escapeHtml(session.task || 'بدون اسم')}</div>
          <div class="session-date">${formatDateTime(session.date)}</div>
        </div>
        <div class="session-duration">${session.duration}m</div>
      </article>
    `).join('');
  }

  function renderHeroStats() {
    const todaySessions = getTodaySessions().length;
    const todayTrees = stats.trees.filter((tree) => isSameDay(tree.date, Date.now())).length;
    const todayMinutes = getTodayMinutes();
    const streak = calculateCurrentStreak();
    const levelInfo = getLevelInfo();

    if (els.dayStreak) els.dayStreak.textContent = String(streak);
    if (els.todayTrees) els.todayTrees.textContent = String(todayTrees);
    if (els.dailyGoalDisplay) els.dailyGoalDisplay.textContent = `${todaySessions}/${settings.dailyGoal}`;
    if (els.todayMinutes) els.todayMinutes.textContent = String(todayMinutes);
    if (els.focusLevel) els.focusLevel.textContent = String(levelInfo.level);

    if (els.todaySessionsCount) els.todaySessionsCount.textContent = String(todaySessions);
    if (els.totalTreesCount) els.totalTreesCount.textContent = String(stats.trees.length);
    if (els.successRate) els.successRate.textContent = `${getSuccessRate()}%`;
  }

  function renderFocusScore() {
    const data = getFocusScoreData();

    if (els.focusScore) els.focusScore.textContent = String(data.score);
    if (els.focusMoodBadge) els.focusMoodBadge.textContent = data.badge;
    if (els.focusScoreTitle) els.focusScoreTitle.textContent = data.title;
    if (els.focusScoreDesc) els.focusScoreDesc.textContent = data.desc;
  }

  function renderForest() {
    if (els.forestTotalTrees) els.forestTotalTrees.textContent = String(stats.trees.length);
    if (els.forestTotalHours) els.forestTotalHours.textContent = String(Math.floor(stats.totalMinutes / 60));
    if (els.forestDayStreak) els.forestDayStreak.textContent = String(calculateBestStreak());
    if (els.forestActiveDays) els.forestActiveDays.textContent = String(getUniqueActiveDays().length);

    if (!els.forestDisplay) return;

    if (!stats.trees.length) {
      els.forestDisplay.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🌱</div>
          <p class="empty-title">لسه غابتك فاضية</p>
          <p class="empty-desc">ابدأ أول جلسة تركيز عشان تزرع أول شجرة</p>
        </div>
      `;
      return;
    }

    const emojis = ['🌳', '🌲', '🌴', '🌵'];
    els.forestDisplay.innerHTML = stats.trees.map((tree, index) => {
      const emoji = emojis[index % emojis.length];
      return `<span class="forest-tree" title="${escapeHtml(tree.task || 'Focus')}">${emoji}</span>`;
    }).join('');
  }

  function renderStatsModal() {
    if (els.statTotalSessions) els.statTotalSessions.textContent = String(stats.sessions.length);
    if (els.statTotalMinutes) els.statTotalMinutes.textContent = String(stats.totalMinutes);
    if (els.statTotalTrees) els.statTotalTrees.textContent = String(stats.trees.length);
    if (els.statTotalDied) els.statTotalDied.textContent = String(stats.totalDied);
    if (els.statBestStreak) els.statBestStreak.textContent = String(calculateBestStreak());
    if (els.statActiveDays) els.statActiveDays.textContent = String(getUniqueActiveDays().length);
  }

  function renderAllStats() {
    renderHeroStats();
    renderWeeklyChart();
    renderSessionsList();
    renderFocusScore();
    renderForest();
    renderStatsModal();
    updateTaskSummary();
  }

  // ─────────────────────────────────────────────
  // Complete Modal
  // ─────────────────────────────────────────────
  function showComplete(icon, title, msg, reward) {
    if (!els.completeModal) return;

    els.completeIcon.textContent = icon;
    els.completeTitle.textContent = title;
    els.completeMsg.textContent = msg;
    els.completeReward.textContent = reward || '';
    els.completeModal.classList.remove('hidden');
  }

  function hideComplete() {
    els.completeModal?.classList.add('hidden');
  }

  // ─────────────────────────────────────────────
  // Timer actions
  // ─────────────────────────────────────────────
  function clearTickInterval() {
    if (state.tickInterval) {
      clearInterval(state.tickInterval);
      state.tickInterval = null;
    }
  }

  function clearAutoTransition() {
    if (state.autoTransitionTimer) {
      clearTimeout(state.autoTransitionTimer);
      state.autoTransitionTimer = null;
    }
  }

  function tickTimer() {
    const diffMs = state.endAt - Date.now();
    state.timeLeft = Math.max(0, Math.ceil(diffMs / 1000));
    updateDisplay();

    if (state.timeLeft <= 0) {
      completeSession();
    }
  }

  function startTimer() {
    clearAutoTransition();

    if (state.isRunning) return;

    requestNotificationPermission();
    initAudio();

    state.isRunning = true;
    state.isPaused = false;
    state.treeDead = false;
    state.endAt = Date.now() + state.timeLeft * 1000;

    clearTickInterval();
    state.tickInterval = setInterval(tickTimer, 250);

    if (state.currentSound !== 'none' && !state.soundNodes) {
      playSound(state.currentSound);
    }

    updateDisplay();

    if (state.currentMode === 'focus') {
      setStatus(`🎯 بدأت جلسة تركيز${state.currentTaskText ? `: ${state.currentTaskText}` : ''}`, 'success');
    } else {
      setStatus('☕ بدأت الاستراحة', 'success');
    }

    pulse(els.startBtn);
  }

  function pauseTimer() {
    if (!state.isRunning) return;

    clearTickInterval();
    state.isRunning = false;
    state.isPaused = true;
    state.timeLeft = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));

    updateDisplay();
    setStatus('⏸ تم إيقاف المؤقت مؤقتًا', 'warning');
  }

  function markDeadTree(reason = 'aborted') {
    stats.totalDied += 1;
    stats.deadTrees.push({
      id: uid('dead'),
      date: Date.now(),
      task: getCurrentTaskLabel(),
      reason
    });

    saveStats();
  }

  function abortFocusSessionByUser(source = 'manual-stop') {
    clearTickInterval();
    state.isRunning = false;
    state.isPaused = false;
    state.treeDead = true;

    markDeadTree(source);
    updateDisplay();
    renderAllStats();

    setStatus('💔 الشجرة ماتت لأن الجلسة اتوقفت قبل ما تكتمل', 'danger');

    state.autoTransitionTimer = setTimeout(() => {
      if (!state.isRunning && state.currentMode === 'focus') {
        state.treeDead = false;
        state.timeLeft = state.totalTime;
        updateDisplay();
      }
    }, 2200);

    updateControlButton();
  }

  function resetTimer(manual = true) {
    if (
      manual &&
      state.currentMode === 'focus' &&
      state.isRunning &&
      settings.strictTreeMode &&
      state.timeLeft < state.totalTime
    ) {
      const confirmKill = confirm('⚠️ لو عملت إعادة دلوقتي، الشجرة هتموت. تكمل؟');
      if (!confirmKill) return;
      abortFocusSessionByUser('reset');
      return;
    }

    clearTickInterval();
    state.isRunning = false;
    state.isPaused = false;
    state.treeDead = false;
    state.timeLeft = state.totalTime;

    updateDisplay();
    setStatus(manual ? '↺ تم إعادة المؤقت' : '✅ جاهز');
  }

  function toggleStartPause() {
    if (!state.isRunning) {
      startTimer();
      return;
    }

    if (
      state.currentMode === 'focus' &&
      settings.strictTreeMode &&
      state.timeLeft < state.totalTime
    ) {
      const confirmKill = confirm('⚠️ لو وقفت الجلسة دلوقتي، الشجرة هتموت. متأكد؟');
      if (!confirmKill) return;
      abortFocusSessionByUser('stop');
      return;
    }

    pauseTimer();
  }

  function skipSession() {
    if (
      state.currentMode === 'focus' &&
      state.isRunning &&
      settings.strictTreeMode &&
      state.timeLeft < state.totalTime
    ) {
      const confirmKill = confirm('⚠️ تخطي الجلسة الآن هيقتل الشجرة. متأكد؟');
      if (!confirmKill) return;
      abortFocusSessionByUser('skip');
    } else {
      clearTickInterval();
      state.isRunning = false;
      state.isPaused = false;
      state.treeDead = false;
    }

    const nextMode = state.currentMode === 'focus' ? getNextBreakMode() : 'focus';
    applyMode(nextMode, { silent: true });
    setStatus('⏭ تم تخطي الجلسة الحالية');
  }

  function completeFocusSession() {
    const session = {
      id: uid('session'),
      date: Date.now(),
      duration: settings.focus,
      task: getCurrentTaskLabel(),
      taskId: state.currentTaskId || null,
      mode: 'focus'
    };

    stats.sessions.push(session);
    stats.trees.push({
      id: uid('tree'),
      date: Date.now(),
      task: getCurrentTaskLabel()
    });
    stats.totalMinutes += settings.focus;
    stats.lastCompletedAt = Date.now();

    if (state.currentTaskId) {
      incrementTaskPomo(state.currentTaskId);
    }

    saveStats();
    saveTasks();
    renderAllStats();

    drawTree(1, false);
    pulse(els.todayTrees);
    pulse(els.focusScore);

    showComplete(
      '🌳',
      'جلسة ناجحة!',
      `أنهيت ${settings.focus} دقيقة تركيز بنجاح`,
      `+1 شجرة • +${settings.focus} دقيقة • ${getCurrentTaskLabel()}`
    );

    sendNotification('🎉 ممتاز! جلسة التركيز انتهت', 'تم زرع شجرة جديدة في غابتك');

    const nextMode = getNextBreakMode();

    clearAutoTransition();
    state.autoTransitionTimer = setTimeout(() => {
      applyMode(nextMode, { silent: true });
      if (settings.autoStartBreaks) {
        startTimer();
      }
    }, 1800);

    setStatus('🌳 جلسة ناجحة! شجرة جديدة اتزرعت', 'success');
  }

  function completeBreakSession() {
    showComplete(
      state.currentMode === 'long' ? '🛋️' : '☕',
      'الاستراحة انتهت',
      'جاهز ترجع للتركيز؟',
      state.currentMode === 'long' ? 'استعادة عميقة للطاقة' : 'شحنة خفيفة للتركيز القادم'
    );

    sendNotification('☕ الاستراحة انتهت', 'جاهز تبدأ جلسة تركيز جديدة؟');

    clearAutoTransition();
    state.autoTransitionTimer = setTimeout(() => {
      applyMode('focus', { silent: true });
      if (settings.autoStartFocus) {
        startTimer();
      }
    }, 1800);

    setStatus('☕ خلصت الراحة — جاهز للتركيز', 'success');
  }

  function completeSession() {
    clearTickInterval();
    state.isRunning = false;
    state.isPaused = false;
    state.timeLeft = 0;
    updateDisplay();

    if (state.currentMode === 'focus') {
      completeFocusSession();
    } else {
      completeBreakSession();
    }
  }

  // ─────────────────────────────────────────────
  // Settings
  // ─────────────────────────────────────────────
  function fillSettingsModal() {
    els.focusDuration.value = settings.focus;
    els.shortDuration.value = settings.short;
    els.longDuration.value = settings.long;
    els.cyclesBeforeLong.value = settings.cyclesBeforeLong;
    els.dailyGoal.value = settings.dailyGoal;
    els.autoStartBreaks.checked = settings.autoStartBreaks;
    els.autoStartFocus.checked = settings.autoStartFocus;
    els.enableNotifications.checked = settings.notifications;
    els.strictTreeMode.checked = settings.strictTreeMode;
  }

  function saveSettingsFromModal() {
    settings.focus = clamp(parseInt(els.focusDuration.value, 10) || 25, 1, 120);
    settings.short = clamp(parseInt(els.shortDuration.value, 10) || 5, 1, 30);
    settings.long = clamp(parseInt(els.longDuration.value, 10) || 15, 1, 60);
    settings.cyclesBeforeLong = clamp(parseInt(els.cyclesBeforeLong.value, 10) || 4, 2, 10);
    settings.dailyGoal = clamp(parseInt(els.dailyGoal.value, 10) || 8, 1, 20);
    settings.autoStartBreaks = !!els.autoStartBreaks.checked;
    settings.autoStartFocus = !!els.autoStartFocus.checked;
    settings.notifications = !!els.enableNotifications.checked;
    settings.strictTreeMode = !!els.strictTreeMode.checked;

    saveSettings();
    updateModeMetaLabels();

    if (!state.isRunning) {
      applyMode(state.currentMode, { silent: true });
    } else {
      updateCycleInfo();
    }

    renderAllStats();
    closeModal(els.settingsModal);
    setStatus('💾 تم حفظ الإعدادات', 'success');

    if (settings.notifications) {
      requestNotificationPermission();
    }
  }

  function applyPreset(name) {
    if (name === 'classic') {
      settings.focus = 25;
      settings.short = 5;
      settings.long = 15;
      settings.cyclesBeforeLong = 4;
    }

    if (name === 'flow') {
      settings.focus = 50;
      settings.short = 10;
      settings.long = 20;
      settings.cyclesBeforeLong = 4;
    }

    if (name === 'light') {
      settings.focus = 15;
      settings.short = 3;
      settings.long = 10;
      settings.cyclesBeforeLong = 4;
    }

    if (name === 'deep') {
      settings.focus = 90;
      settings.short = 20;
      settings.long = 30;
      settings.cyclesBeforeLong = 3;
    }

    fillSettingsModal();
    setStatus(`⚡ تم تطبيق Preset: ${name}`, 'success');
  }

  // ─────────────────────────────────────────────
  // Modals
  // ─────────────────────────────────────────────
  function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
  }

  // ─────────────────────────────────────────────
  // Render current task state
  // ─────────────────────────────────────────────
  function syncCurrentTaskFromSaved() {
    loadCurrentTaskState();
    updateCurrentTaskUI();
  }

  // ─────────────────────────────────────────────
  // Escaping
  // ─────────────────────────────────────────────
  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // ─────────────────────────────────────────────
  // Events
  // ─────────────────────────────────────────────
  function bindEvents() {
    // timer
    els.startBtn?.addEventListener('click', toggleStartPause);
    els.resetBtn?.addEventListener('click', () => resetTimer(true));
    els.skipBtn?.addEventListener('click', skipSession);

    els.modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (state.isRunning) {
          const confirmSwitch = confirm('يوجد مؤقت شغال الآن. التبديل قد يفسد الجلسة الحالية. تكمل؟');
          if (!confirmSwitch) return;

          if (state.currentMode === 'focus' && settings.strictTreeMode && state.timeLeft < state.totalTime) {
            abortFocusSessionByUser('mode-switch');
          } else {
            clearTickInterval();
            state.isRunning = false;
            state.isPaused = false;
          }
        }

        applyMode(btn.dataset.mode);
      });
    });

    // sounds
    els.soundButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        playSound(btn.dataset.sound);
      });
    });

    els.volumeSlider?.addEventListener('input', applyVolume);

    // task current
    els.saveTaskBtn?.addEventListener('click', saveCurrentTaskFromInput);
    els.pickTaskBtn?.addEventListener('click', pickNextTask);
    els.clearCurrentTaskBtn?.addEventListener('click', clearCurrentTask);

    els.currentTask?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveCurrentTaskFromInput();
      }
    });

    // tasks
    els.pomoMinus?.addEventListener('click', () => {
      state.pomoDraft = clamp(state.pomoDraft - 1, 1, 20);
      if (els.pomoCount) els.pomoCount.textContent = String(state.pomoDraft);
    });

    els.pomoPlus?.addEventListener('click', () => {
      state.pomoDraft = clamp(state.pomoDraft + 1, 1, 20);
      if (els.pomoCount) els.pomoCount.textContent = String(state.pomoDraft);
    });

    els.quickAddTask?.addEventListener('click', addTask);

    els.taskInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTask();
      }
    });

    els.clearDoneTasksBtn?.addEventListener('click', clearDoneTasks);

    els.filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.taskFilter = btn.dataset.filter || 'all';
        renderTasks();
      });
    });

    // settings
    els.settingsBtn?.addEventListener('click', () => {
      fillSettingsModal();
      openModal(els.settingsModal);
    });

    els.closeSettings?.addEventListener('click', () => closeModal(els.settingsModal));
    els.saveSettings?.addEventListener('click', saveSettingsFromModal);

    els.numButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = $(btn.dataset.target);
        if (!target) return;

        const min = parseInt(target.min || '0', 10);
        const max = parseInt(target.max || '999', 10);
        let value = parseInt(target.value || '0', 10);

        value += btn.dataset.action === 'inc' ? 1 : -1;
        target.value = String(clamp(value, min, max));
      });
    });

    els.presetButtons.forEach((btn) => {
      btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });

    // forest
    els.forestBtn?.addEventListener('click', () => {
      renderForest();
      openModal(els.forestModal);
    });

    els.closeForest?.addEventListener('click', () => closeModal(els.forestModal));

    // stats
    els.statsBtn?.addEventListener('click', () => {
      renderStatsModal();
      openModal(els.statsModal);
    });

    els.closeStats?.addEventListener('click', () => closeModal(els.statsModal));

    // complete
    els.completeOk?.addEventListener('click', hideComplete);

    // modal outside click
    [els.forestModal, els.settingsModal, els.statsModal, els.completeModal].forEach((modal) => {
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal);
        }
      });
    });

    // keyboard
    document.addEventListener('keydown', (e) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';

      if (e.key === ' ' && !typing) {
        e.preventDefault();
        toggleStartPause();
      }

      if ((e.key === 'r' || e.key === 'R') && !typing) {
        e.preventDefault();
        resetTimer(true);
      }

      if ((e.key === 's' || e.key === 'S') && !typing) {
        e.preventDefault();
        skipSession();
      }

      if ((e.key === 'm' || e.key === 'M') && !typing) {
        e.preventDefault();
        playSound(state.currentSound === 'none' ? 'rain' : 'none');
      }

      if (e.key === 'Escape') {
        closeModal(els.forestModal);
        closeModal(els.settingsModal);
        closeModal(els.statsModal);
        closeModal(els.completeModal);
      }
    });

    // close sound if leaving page
    window.addEventListener('beforeunload', () => {
      stopSound();
      clearTickInterval();
      clearAutoTransition();
    });
  }

  // ─────────────────────────────────────────────
  // Init
  // ─────────────────────────────────────────────
  function init() {
    applySavedTheme();
    updateModeMetaLabels();
    loadCurrentTaskState();

    state.timeLeft = settings.focus * 60;
    state.totalTime = settings.focus * 60;
    state.currentMode = 'focus';
    state.pomoDraft = 1;
    state.currentSound = settings.sound || 'none';

    if (els.pomoCount) els.pomoCount.textContent = '1';
    if (els.volumeSlider) els.volumeSlider.value = String(settings.volume);
    applyVolume();
    updateSoundButtons();

    syncCurrentTaskFromSaved();
    renderTasks();
    renderAllStats();
    applyMode('focus', { silent: true });
    updateDisplay();
    bindEvents();

    requestNotificationPermission();
    setStatus('✅ جاهز! اضغط ابدأ لزرع أول شجرة', 'success');

    console.log('✅ Pomodoro Pro Premium جاهز!');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();