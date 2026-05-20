/* ═══════════════════════════════════════════════
   LifeHub - Habit Streak
   Premium Script
   Fixed Version
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

  function uid(prefix = 'habit') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
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
  // Theme
  // ─────────────────────────────────────────────
  function applySavedTheme() {
    const savedTheme = localStorage.getItem('lifehub-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // ─────────────────────────────────────────────
  // Storage
  // ─────────────────────────────────────────────
  const STORAGE = {
    habits: 'lifehub-habits',
    habitsAlt: 'habits',
    sort: 'lifehub-habits-sort'
  };

  // ─────────────────────────────────────────────
  // DOM
  // ─────────────────────────────────────────────
  const els = {
    statusMessage: $('statusMessage'),

    heroFlame: $('heroFlame'),
    bestStreakHero: $('bestStreakHero'),

    totalHabits: $('totalHabits'),
    bestStreak: $('bestStreak'),
    todayDone: $('todayDone'),
    totalBadges: $('totalBadges'),

    insightsBtn: $('insightsBtn'),
    badgesBtn: $('badgesBtn'),
    addHabitBtn: $('addHabitBtn'),

    completeAllBtn: $('completeAllBtn'),
    completionSummary: $('completionSummary'),

    filterButtons: $$('.filter-btn'),
    sortButtons: $$('.sort-btn'),
    habitsList: $('habitsList'),

    heatmapGrid: $('heatmapGrid'),
    activeDaysCount: $('activeDaysCount'),
    consistencyRate: $('consistencyRate'),
    bestConsistency: $('bestConsistency'),

    moodBadge: $('moodBadge'),
    moodFace: $('moodFace'),
    moodTitle: $('moodTitle'),
    moodDesc: $('moodDesc'),

    badgesGrid: $('badgesGrid'),
    earnedBadgesPreview: $('earnedBadgesPreview'),

    streakBoard: $('streakBoard'),

    habitModal: $('habitModal'),
    modalTitle: $('modalTitle'),
    closeModal: $('closeModal'),
    habitName: $('habitName'),
    habitTarget: $('habitTarget'),
    habitUnit: $('habitUnit'),
    habitStrictMode: $('habitStrictMode'),
    habitShowInBoard: $('habitShowInBoard'),
    saveHabit: $('saveHabit'),

    detailsModal: $('detailsModal'),
    detailsTitle: $('detailsTitle'),
    detailsBody: $('detailsBody'),
    closeDetails: $('closeDetails'),

    insightsModal: $('insightsModal'),
    closeInsights: $('closeInsights'),
    insightBestStreak: $('insightBestStreak'),
    insightActiveDays: $('insightActiveDays'),
    insightCompletionRate: $('insightCompletionRate'),
    insightEarnedBadges: $('insightEarnedBadges')
  };

  // ─────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────
  let habits = [];
  let currentFilter = 'all';
  let currentSort = localStorage.getItem(STORAGE.sort) || 'manual';
  let editingHabitId = null;
  let selectedIcon = '📖';
  let selectedColor = '#ef4444';
  let statusTimer = null;

  // ─────────────────────────────────────────────
  // Badges
  // ─────────────────────────────────────────────
  const BADGES = [
    {
      id: 'first_habit',
      emoji: '🌱',
      name: 'البداية',
      desc: 'أضفت أول عادة',
      unlocked: () => habits.length >= 1
    },
    {
      id: 'collector',
      emoji: '🎯',
      name: 'المجمّع',
      desc: '5 عادات أو أكثر',
      unlocked: () => habits.length >= 5
    },
    {
      id: 'week_streak',
      emoji: '🔥',
      name: '7 أيام',
      desc: 'أي عادة وصلت 7 أيام',
      unlocked: () => habits.some((h) => h.bestStreak >= 7)
    },
    {
      id: 'month_streak',
      emoji: '⭐',
      name: '30 يوم',
      desc: 'أي عادة وصلت 30 يوم',
      unlocked: () => habits.some((h) => h.bestStreak >= 30)
    },
    {
      id: 'hundred_streak',
      emoji: '💎',
      name: '100 يوم',
      desc: 'أي عادة وصلت 100 يوم',
      unlocked: () => habits.some((h) => h.bestStreak >= 100)
    },
    {
      id: 'perfect_day',
      emoji: '🏆',
      name: 'اليوم المثالي',
      desc: 'أنجزت كل عادات اليوم',
      unlocked: () => habits.length > 0 && habits.every((h) => isDoneToday(h))
    },
    {
      id: 'consistent_week',
      emoji: '📅',
      name: 'أسبوع نشط',
      desc: '7 أيام نشاط على الأقل',
      unlocked: () => getAllActiveDayKeys().length >= 7
    },
    {
      id: 'legend',
      emoji: '👑',
      name: 'الأسطورة',
      desc: '3 عادات أفضل Streak فيها 30+',
      unlocked: () => habits.filter((h) => h.bestStreak >= 30).length >= 3
    }
  ];

  // ─────────────────────────────────────────────
  // Dates
  // ─────────────────────────────────────────────
  function getDateKey(date = new Date()) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function parseDateKey(key) {
    const [y, m, d] = String(key).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }

  function diffDays(aKey, bKey) {
    const a = parseDateKey(aKey);
    const b = parseDateKey(bKey);
    return Math.round((a - b) / (1000 * 60 * 60 * 24));
  }

  function formatDateKeyLabel(key) {
    return parseDateKey(key).toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'short'
    });
  }

  // ─────────────────────────────────────────────
  // Fix old data / ensure logs
  // ─────────────────────────────────────────────
  function ensureHabitLogs(habit) {
    if (!habit || typeof habit !== 'object') return {};

    if (!habit.logs || typeof habit.logs !== 'object' || Array.isArray(habit.logs)) {
      habit.logs = {};
    }

    // Migration من النسخة القديمة اللي كانت بتخزن dates فقط
    if (Array.isArray(habit.dates)) {
      const fallbackTarget = clamp(parseInt(habit.target, 10) || 1, 1, 20);

      habit.dates.forEach((key) => {
        habit.logs[key] = Math.max(Number(habit.logs[key] || 0), fallbackTarget);
      });
    }

    return habit.logs;
  }

  function resolveHabit(habitOrId) {
    if (!habitOrId) return null;

    if (typeof habitOrId === 'object') return habitOrId;

    return habits.find((h) => h.id === habitOrId) || null;
  }

  // ─────────────────────────────────────────────
  // Habit normalization
  // ─────────────────────────────────────────────
  function normalizeHabit(habit, index = 0) {
    const target = clamp(parseInt(habit?.target, 10) || 1, 1, 20);
    let logs = {};

    if (habit?.logs && typeof habit.logs === 'object' && !Array.isArray(habit.logs)) {
      Object.keys(habit.logs).forEach((key) => {
        logs[key] = clamp(parseInt(habit.logs[key], 10) || 0, 0, 999);
      });
    } else if (Array.isArray(habit?.dates)) {
      habit.dates.forEach((key) => {
        logs[key] = Math.max(logs[key] || 0, target);
      });
    }

    const normalized = {
      id: String(habit?.id || uid()),
      name: String(habit?.name || 'عادة جديدة'),
      icon: String(habit?.icon || '📖'),
      color: String(habit?.color || '#ef4444'),
      target,
      unit: String(habit?.unit || 'مرة'),
      strictMode: habit?.strictMode !== false,
      showInBoard: habit?.showInBoard !== false,
      logs,
      dates: Array.isArray(habit?.dates) ? [...habit.dates] : [],
      streak: 0,
      bestStreak: Number(habit?.bestStreak || 0),
      order: Number.isFinite(habit?.order) ? Number(habit.order) : index,
      createdAt: Number(habit?.createdAt || Date.now()),
      broken: false
    };

    hydrateHabit(normalized);
    return normalized;
  }

  function hydrateHabit(habit) {
    ensureHabitLogs(habit);
    habit.dates = getCompletedDateKeys(habit);

    const streakData = calculateHabitStreakData(habit);
    habit.streak = streakData.current;
    habit.bestStreak = Math.max(Number(habit.bestStreak || 0), streakData.best);
    habit.broken = streakData.broken;

    return habit;
  }

  function hydrateAllHabits() {
    habits = habits.map((habit, index) => {
      if (!Number.isFinite(habit.order)) habit.order = index;
      return hydrateHabit(habit);
    });
  }

  // ─────────────────────────────────────────────
  // Load / Save
  // ─────────────────────────────────────────────
  function loadHabits() {
    const parsed = safeParse(localStorage.getItem(STORAGE.habits), null);
    const alt = safeParse(localStorage.getItem(STORAGE.habitsAlt), []);

    const source = Array.isArray(parsed)
      ? parsed
      : Array.isArray(alt)
      ? alt
      : [];

    habits = source.map((habit, index) => normalizeHabit(habit, index));
  }

  function saveHabits() {
    hydrateAllHabits();

    const serialized = JSON.stringify(habits);
    localStorage.setItem(STORAGE.habits, serialized);
    localStorage.setItem(STORAGE.habitsAlt, serialized);
  }

  // ─────────────────────────────────────────────
  // Status
  // ─────────────────────────────────────────────
  function setStatus(message, tone = 'neutral') {
    if (!els.statusMessage) return;

    clearTimeout(statusTimer);
    els.statusMessage.textContent = message;
    removeToneClasses(els.statusMessage);

    if (tone === 'success') els.statusMessage.classList.add('is-success');
    if (tone === 'warning') els.statusMessage.classList.add('is-warning');
    if (tone === 'danger') els.statusMessage.classList.add('is-danger');

    statusTimer = setTimeout(() => {
      removeToneClasses(els.statusMessage);
    }, 2500);
  }

  function showCelebration(title, message, icon = '🏆') {
    const box = document.createElement('div');
    box.className = 'celebration';
    box.innerHTML = `
      <div style="font-size:2.4rem; margin-bottom:8px;">${icon}</div>
      <div>${escapeHTML(title)}</div>
      <div style="font-size:0.9rem; margin-top:8px; opacity:0.95;">${escapeHTML(message)}</div>
    `;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3000);
  }

  // ─────────────────────────────────────────────
  // Completion logic
  // ─────────────────────────────────────────────
  function getTodayCount(habitOrId) {
    const habit = resolveHabit(habitOrId);
    if (!habit) return 0;

    const logs = ensureHabitLogs(habit);
    return Number(logs[getDateKey()] || 0);
  }

  function getCountForDate(habitOrId, dateKey) {
    const habit = resolveHabit(habitOrId);
    if (!habit) return 0;

    const logs = ensureHabitLogs(habit);
    return Number(logs[dateKey] || 0);
  }

  function isDoneOnDateKey(habitOrId, dateKey) {
    const habit = resolveHabit(habitOrId);
    if (!habit) return false;

    return getCountForDate(habit, dateKey) >= clamp(parseInt(habit?.target, 10) || 1, 1, 20);
  }

  function isDoneToday(habitOrId) {
    return isDoneOnDateKey(habitOrId, getDateKey());
  }

  function getCompletedDateKeys(habitOrId) {
    const habit = resolveHabit(habitOrId);
    if (!habit) return [];

    const logs = ensureHabitLogs(habit);
    const target = clamp(parseInt(habit?.target, 10) || 1, 1, 20);

    return Object.keys(logs)
      .filter((key) => Number(logs[key]) >= target)
      .sort((a, b) => parseDateKey(a) - parseDateKey(b));
  }

  function calculateBestStrictStreak(completed) {
    if (!completed.length) return 0;

    let best = 1;
    let current = 1;

    for (let i = 1; i < completed.length; i++) {
      const diff = diffDays(completed[i], completed[i - 1]);

      if (diff === 1) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 1;
      }
    }

    return best;
  }

  function calculateHabitStreakData(habitOrId) {
    const habit = resolveHabit(habitOrId);
    if (!habit) return { current: 0, best: 0, broken: false };

    const completed = getCompletedDateKeys(habit);
    if (!completed.length) {
      return { current: 0, best: 0, broken: false };
    }

    if (!habit.strictMode) {
      const total = completed.length;
      return {
        current: total,
        best: total,
        broken: false
      };
    }

    const todayKey = getDateKey();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayKey = getDateKey(yesterdayDate);

    const last = completed[completed.length - 1];
    const best = calculateBestStrictStreak(completed);

    if (last !== todayKey && last !== yesterdayKey) {
      return {
        current: 0,
        best,
        broken: best > 0
      };
    }

    let current = 0;
    let cursor = last;

    while (completed.includes(cursor)) {
      current++;
      const prev = parseDateKey(cursor);
      prev.setDate(prev.getDate() - 1);
      cursor = getDateKey(prev);
    }

    return {
      current,
      best,
      broken: false
    };
  }

  function incrementTodayProgress(habitOrId) {
    const habit = resolveHabit(habitOrId);
    if (!habit) return;

    const today = getDateKey();
    habit.logs = ensureHabitLogs(habit);

    const current = getTodayCount(habit);

    if (current >= habit.target) {
      habit.logs[today] = 0;
      delete habit.logs[today];

      hydrateHabit(habit);
      saveHabits();
      renderAll();

      setStatus(`↩️ تم التراجع عن إنجاز "${habit.name}"`, 'warning');
      return;
    }

    habit.logs[today] = current + 1;
    const becameDone = habit.logs[today] >= habit.target;

    hydrateHabit(habit);
    saveHabits();
    renderAll();

    if (becameDone) {
      const milestones = [3, 7, 14, 30, 100, 365];

      setStatus(`✅ ممتاز! أنجزت "${habit.name}" اليوم`, 'success');

      if (milestones.includes(habit.streak)) {
        showCelebration(
          `${habit.streak} يوم متتالي!`,
          `استمر، أنت داخل في Streak محترم جدًا 🔥`,
          '🔥'
        );
      }
    } else {
      setStatus(`⏳ تقدّم في "${habit.name}" — ${habit.logs[today]}/${habit.target}`, 'success');
    }
  }

  function completeAllToday() {
    if (!habits.length) {
      setStatus('⚠️ لا توجد عادات بعد', 'warning');
      return;
    }

    const incomplete = habits.filter((habit) => !isDoneToday(habit));
    if (!incomplete.length) {
      setStatus('🎉 كل عاداتك منجزة بالفعل اليوم', 'success');
      return;
    }

    const today = getDateKey();

    incomplete.forEach((habit) => {
      habit.logs = ensureHabitLogs(habit);
      habit.logs[today] = habit.target;
      hydrateHabit(habit);
    });

    saveHabits();
    renderAll();
    showCelebration('يوم مثالي!', 'كل عادات اليوم اتنجزت ✨', '🏆');
    setStatus('✅ تم إنجاز كل عادات اليوم', 'success');
  }

  // ─────────────────────────────────────────────
  // Filters / sort
  // ─────────────────────────────────────────────
  function getSortedHabits() {
    const list = [...habits];

    if (currentSort === 'streak') {
      return list.sort((a, b) => {
        if (b.streak !== a.streak) return b.streak - a.streak;
        if (b.bestStreak !== a.bestStreak) return b.bestStreak - a.bestStreak;
        return a.name.localeCompare(b.name, 'ar');
      });
    }

    return list.sort((a, b) => a.order - b.order);
  }

  function getFilteredHabits() {
    let list = getSortedHabits();

    if (currentFilter === 'today') {
      list = list.filter((habit) => !isDoneToday(habit));
    }

    if (currentFilter === 'done') {
      list = list.filter((habit) => isDoneToday(habit));
    }

    if (currentFilter === 'broken') {
      list = list.filter((habit) => habit.broken);
    }

    return list;
  }

  function moveHabit(id, direction) {
    const sorted = [...habits].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((h) => h.id === id);
    if (index === -1) return;

    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= sorted.length) return;

    const current = sorted[index];
    const target = sorted[nextIndex];

    const temp = current.order;
    current.order = target.order;
    target.order = temp;

    saveHabits();
    renderAll();
    openDetails(id);
  }

  // ─────────────────────────────────────────────
  // Aggregate stats
  // ─────────────────────────────────────────────
  function getBestStreakValue() {
    return habits.reduce((max, habit) => Math.max(max, habit.bestStreak || 0), 0);
  }

  function getTodayDoneCount() {
    return habits.filter((habit) => isDoneToday(habit)).length;
  }

  function getAllActiveDayKeys() {
    const set = new Set();

    habits.forEach((habit) => {
      getCompletedDateKeys(habit).forEach((key) => set.add(key));
    });

    return [...set].sort((a, b) => parseDateKey(a) - parseDateKey(b));
  }

  function getEarnedBadges() {
    return BADGES.filter((badge) => badge.unlocked());
  }

  function getOverallCompletionRate() {
    if (!habits.length) return 0;

    const earliest = Math.min(...habits.map((h) => h.createdAt || Date.now()));
    const daysSinceStart = Math.max(
      1,
      Math.floor((Date.now() - earliest) / (1000 * 60 * 60 * 24)) + 1
    );

    const possible = habits.length * daysSinceStart;
    const actual = habits.reduce((sum, habit) => sum + getCompletedDateKeys(habit).length, 0);

    return Math.round((actual / Math.max(possible, 1)) * 100);
  }

  function getHeatmapData() {
    const totalHabitsCount = Math.max(habits.length, 1);
    const days = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = getDateKey(d);

      const count = habits.filter((habit) => isDoneOnDateKey(habit, key)).length;
      const ratio = count / totalHabitsCount;

      let level = 0;
      if (count > 0 && ratio <= 0.25) level = 1;
      else if (ratio > 0.25 && ratio <= 0.5) level = 2;
      else if (ratio > 0.5 && ratio <= 0.75) level = 3;
      else if (ratio > 0.75) level = 4;

      days.push({
        key,
        count,
        label: `${formatDateKeyLabel(key)} • ${count}/${habits.length}`,
        level,
        isToday: i === 0
      });
    }

    return days;
  }

  // ─────────────────────────────────────────────
  // Mood / insights
  // ─────────────────────────────────────────────
  function renderMood() {
    const total = habits.length;
    const done = getTodayDoneCount();
    const best = getBestStreakValue();
    const broken = habits.filter((h) => h.broken).length;

    let badge = 'متحمس';
    let face = '😎';
    let title = 'بداية جميلة';
    let desc = 'حافظ على رتمك، يوم واحد كمان ممكن يفتح أول إنجاز.';

    if (!total) {
      badge = 'هادئ';
      face = '🙂';
      title = 'أضف أول عادة';
      desc = 'كل رحلة كبيرة تبدأ بخطوة بسيطة تتكرر يوميًا.';
    } else if (done === total) {
      badge = 'مثالي';
      face = '🤩';
      title = 'يومك كامل';
      desc = 'أنجزت كل عاداتك اليوم — ده النوع اللي يبني شخصية قوية.';
    } else if (done > 0 && done < total) {
      badge = 'مستمر';
      face = '😌';
      title = 'أنت ماشي كويس';
      desc = 'خلصت جزء من العادات، كمّل الباقي علشان اليوم يكمل.';
    } else if (broken > 0 && done === 0) {
      badge = 'حساس';
      face = '😢';
      title = 'الـ streak محتاج إنقاذ';
      desc = 'في عادات اتكسرت. ابدأ بواحدة النهارده وارجع الزخم من جديد.';
    }

    if (best >= 30) {
      badge = 'ناري';
      face = '🔥';
      title = 'فيه عادة أسطورية عندك';
      desc = 'أفضل streak عندك عالي جدًا — واضح إنك بتعرف تلتزم لما تركز.';
    }

    if (els.moodBadge) els.moodBadge.textContent = badge;
    if (els.moodFace) els.moodFace.textContent = face;
    if (els.moodTitle) els.moodTitle.textContent = title;
    if (els.moodDesc) els.moodDesc.textContent = desc;

    if (els.heroFlame) {
      els.heroFlame.textContent = broken > 0 && done === 0 ? '💔' : '🔥';
    }
  }

  function renderInsights() {
    const earned = getEarnedBadges().length;
    const activeDays = getAllActiveDayKeys().length;
    const completionRate = getOverallCompletionRate();

    if (els.insightBestStreak) els.insightBestStreak.textContent = String(getBestStreakValue());
    if (els.insightActiveDays) els.insightActiveDays.textContent = String(activeDays);
    if (els.insightCompletionRate) els.insightCompletionRate.textContent = `${completionRate}%`;
    if (els.insightEarnedBadges) els.insightEarnedBadges.textContent = String(earned);
  }

  // ─────────────────────────────────────────────
  // Main stats render
  // ─────────────────────────────────────────────
  function renderStats() {
    const total = habits.length;
    const best = getBestStreakValue();
    const done = getTodayDoneCount();
    const earned = getEarnedBadges().length;

    if (els.totalHabits) els.totalHabits.textContent = String(total);
    if (els.bestStreak) els.bestStreak.textContent = String(best);
    if (els.todayDone) els.todayDone.textContent = String(done);
    if (els.totalBadges) els.totalBadges.textContent = String(earned);

    if (els.bestStreakHero) els.bestStreakHero.textContent = String(best);
    if (els.completionSummary) els.completionSummary.textContent = `${done} / ${total} اليوم`;
  }

  // ─────────────────────────────────────────────
  // Heatmap render
  // ─────────────────────────────────────────────
  function renderHeatmap() {
    if (!els.heatmapGrid) return;

    const heatmap = getHeatmapData();
    const activeDays = heatmap.filter((day) => day.count > 0).length;
    const consistency = habits.length
      ? Math.round(
          (heatmap.reduce((sum, day) => sum + day.count, 0) / (heatmap.length * habits.length)) * 100
        )
      : 0;

    if (els.activeDaysCount) els.activeDaysCount.textContent = String(activeDays);
    if (els.consistencyRate) els.consistencyRate.textContent = `${consistency}%`;
    if (els.bestConsistency) els.bestConsistency.textContent = String(getBestStreakValue());

    els.heatmapGrid.innerHTML = heatmap.map((day) => `
      <div
        class="heat-cell level-${day.level} ${day.isToday ? 'today' : ''}"
        data-date="${escapeHTML(day.label)}"
      ></div>
    `).join('');
  }

  // ─────────────────────────────────────────────
  // Badges render
  // ─────────────────────────────────────────────
  function renderBadges() {
    const earned = getEarnedBadges();

    if (els.totalBadges) els.totalBadges.textContent = String(earned.length);
    if (els.earnedBadgesPreview) els.earnedBadgesPreview.textContent = `${earned.length} مفتوح`;

    if (!els.badgesGrid) return;

    els.badgesGrid.innerHTML = BADGES.map((badge) => {
      const isEarned = badge.unlocked();

      return `
        <article class="badge-card ${isEarned ? 'earned' : 'locked'}">
          <div class="badge-emoji">${badge.emoji}</div>
          <div class="badge-name">${escapeHTML(badge.name)}</div>
          <div class="badge-desc">${escapeHTML(badge.desc)}</div>
        </article>
      `;
    }).join('');
  }

  // ─────────────────────────────────────────────
  // Streak board
  // ─────────────────────────────────────────────
  function renderStreakBoard() {
    if (!els.streakBoard) return;

    const top = habits
      .filter((habit) => habit.showInBoard !== false)
      .sort((a, b) => {
        if (b.streak !== a.streak) return b.streak - a.streak;
        if (b.bestStreak !== a.bestStreak) return b.bestStreak - a.bestStreak;
        return a.order - b.order;
      })
      .slice(0, 6);

    if (!top.length) {
      els.streakBoard.innerHTML = `
        <div class="empty-state compact">
          <div class="empty-icon">🔥</div>
          <p class="empty-title">لا توجد عادات بعد</p>
          <p class="empty-desc">أضف عادة عشان تظهر في لوحة الترتيب</p>
        </div>
      `;
      return;
    }

    els.streakBoard.innerHTML = top.map((habit, index) => `
      <article class="board-item">
        <div class="board-rank">#${index + 1}</div>
        <div class="board-icon" style="background:${habit.color};">${habit.icon}</div>
        <div class="board-info">
          <div class="board-name">${escapeHTML(habit.name)}</div>
          <div class="board-meta">${habit.target} ${escapeHTML(habit.unit)} يوميًا</div>
        </div>
        <div class="board-streak">🔥 ${habit.streak}</div>
      </article>
    `).join('');
  }

  // ─────────────────────────────────────────────
  // Habit cards render
  // ─────────────────────────────────────────────
  function renderMiniCalendar(habit) {
    const today = new Date();
    let html = '';

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = getDateKey(d);
      const isDone = isDoneOnDateKey(habit, key);
      const isToday = i === 0;

      html += `
        <div
          class="day-cell ${isDone ? 'done' : ''} ${isToday ? 'today' : ''}"
          data-date="${escapeHTML(formatDateKeyLabel(key))}"
        ></div>
      `;
    }

    return html;
  }

  function renderHabits() {
    if (!els.habitsList) return;

    const visible = getFilteredHabits();

    if (!habits.length) {
      els.habitsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎯</div>
          <h3 class="empty-title">ابدأ أول عادة</h3>
          <p class="empty-desc">كل عادة صغيرة ممكن تبقى نقطة تحول ضخمة</p>
          <button class="empty-btn" id="emptyAddBtn" type="button">+ أضف أول عادة</button>
        </div>
      `;
      return;
    }

    if (!visible.length) {
      const messages = {
        today: '🎉 أنجزت كل عاداتك اليوم',
        done: 'لا توجد عادات مكتملة اليوم',
        broken: 'لا توجد عادات Streak مكسور حاليًا',
        all: 'لا توجد عادات'
      };

      els.habitsList.innerHTML = `
        <div class="empty-state compact">
          <div class="empty-icon">📭</div>
          <p class="empty-title">${messages[currentFilter] || 'لا توجد عادات'}</p>
          <p class="empty-desc">غيّر الفلتر أو أضف عادة جديدة</p>
        </div>
      `;
      return;
    }

    els.habitsList.innerHTML = visible.map((habit) => {
      const todayCount = getTodayCount(habit);
      const done = isDoneToday(habit);
      const progress = clamp(Math.round((todayCount / habit.target) * 100), 0, 100);
      const buttonLabel = done ? '✓' : habit.target > 1 ? `${todayCount}/${habit.target}` : '○';

      return `
        <article
          class="habit-card ${done ? 'done-today' : ''} ${habit.broken ? 'broken' : ''}"
          style="--habit-color:${habit.color};"
          data-habit-id="${habit.id}"
        >
          <div class="habit-main">
            <div class="habit-icon">${habit.icon}</div>

            <div class="habit-info">
              <div class="habit-name">${escapeHTML(habit.name)}</div>

              <div class="habit-meta-line">
                <span class="habit-target-chip">🎯 ${habit.target} ${escapeHTML(habit.unit)} / يوم</span>
                <span class="best-badge">🏆 الأفضل ${habit.bestStreak}</span>
                <span class="status-chip ${done ? 'done' : 'pending'}">
                  ${done ? 'منجز اليوم' : 'بانتظار الإنجاز'}
                </span>
              </div>

              <div class="streak-row">
                <span class="streak-badge ${habit.broken ? 'dead' : ''}">
                  <span class="streak-fire">${habit.broken ? '💔' : '🔥'}</span>
                  <span>${habit.streak} يوم</span>
                </span>
              </div>

              <div class="progress-line">
                <div class="progress-top">
                  <span>تقدم اليوم</span>
                  <strong>${todayCount} / ${habit.target}</strong>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${progress}%"></div>
                </div>
              </div>
            </div>

            <div class="habit-actions">
              <button
                class="check-btn ${done ? 'checked' : ''}"
                data-action="toggle"
                data-id="${habit.id}"
                type="button"
                title="${done ? 'إلغاء إنجاز اليوم' : 'تقدّم / إنجاز'}"
              >
                ${buttonLabel}
              </button>

              <button
                class="habit-menu-btn"
                data-action="details"
                data-id="${habit.id}"
                type="button"
                title="التفاصيل"
              >
                📊
              </button>
            </div>
          </div>

          <div class="habit-calendar">${renderMiniCalendar(habit)}</div>
        </article>
      `;
    }).join('');
  }

  // ─────────────────────────────────────────────
  // Modal helpers
  // ─────────────────────────────────────────────
  function openModal(modal) {
    modal?.classList.remove('hidden');
  }

  function closeModal(modal) {
    modal?.classList.add('hidden');
  }

  function closeAllModals() {
    closeModal(els.habitModal);
    closeModal(els.detailsModal);
    closeModal(els.insightsModal);
  }

  // ─────────────────────────────────────────────
  // Add / edit form
  // ─────────────────────────────────────────────
  function setSelectedIcon(icon) {
    selectedIcon = icon;
    $$('.icon-pick').forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.icon === icon);
    });
  }

  function setSelectedColor(color) {
    selectedColor = color;
    $$('.color-pick').forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.color === color);
    });
  }

  function resetHabitForm() {
    editingHabitId = null;
    els.modalTitle.textContent = '➕ عادة جديدة';
    els.habitName.value = '';
    els.habitTarget.value = '1';
    els.habitUnit.value = 'مرة';
    els.habitStrictMode.checked = true;
    els.habitShowInBoard.checked = true;
    setSelectedIcon('📖');
    setSelectedColor('#ef4444');
  }

  function openAddModal() {
    resetHabitForm();
    openModal(els.habitModal);
    setTimeout(() => els.habitName.focus(), 50);
  }

  function openEditModal(habit) {
    if (!habit) return;

    editingHabitId = habit.id;
    els.modalTitle.textContent = '✏️ تعديل العادة';
    els.habitName.value = habit.name;
    els.habitTarget.value = String(habit.target);
    els.habitUnit.value = habit.unit;
    els.habitStrictMode.checked = habit.strictMode !== false;
    els.habitShowInBoard.checked = habit.showInBoard !== false;
    setSelectedIcon(habit.icon);
    setSelectedColor(habit.color);

    openModal(els.habitModal);
    setTimeout(() => els.habitName.focus(), 50);
  }

  function saveHabitFromForm() {
    const name = (els.habitName.value || '').trim();
    const target = clamp(parseInt(els.habitTarget.value, 10) || 1, 1, 20);
    const unit = (els.habitUnit.value || 'مرة').trim();

    if (!name) {
      setStatus('⚠️ اكتب اسم العادة', 'warning');
      shake(els.habitName);
      return;
    }

    if (editingHabitId) {
      const habit = habits.find((h) => h.id === editingHabitId);
      if (!habit) return;

      habit.name = name;
      habit.target = target;
      habit.unit = unit;
      habit.icon = selectedIcon;
      habit.color = selectedColor;
      habit.strictMode = !!els.habitStrictMode.checked;
      habit.showInBoard = !!els.habitShowInBoard.checked;

      ensureHabitLogs(habit);
      hydrateHabit(habit);
      saveHabits();
      renderAll();
      closeModal(els.habitModal);
      setStatus('✏️ تم تعديل العادة', 'success');
      return;
    }

    const maxOrder = habits.length ? Math.max(...habits.map((h) => h.order || 0)) : 0;

    const habit = normalizeHabit({
      id: uid(),
      name,
      icon: selectedIcon,
      color: selectedColor,
      target,
      unit,
      strictMode: !!els.habitStrictMode.checked,
      showInBoard: !!els.habitShowInBoard.checked,
      logs: {},
      createdAt: Date.now(),
      order: maxOrder + 1
    });

    habits.push(habit);
    saveHabits();
    renderAll();
    closeModal(els.habitModal);
    setStatus(`✅ تمت إضافة عادة: ${name}`, 'success');

    if (habits.length === 1) {
      showCelebration('بداية جديدة!', 'أول عادة اتحفظت — يلا نولّع الـ streak 🔥', '🌱');
    }
  }

  // ─────────────────────────────────────────────
  // Details modal
  // ─────────────────────────────────────────────
  function renderMonthCalendar(habit) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const dayNames = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمس', 'جمع', 'سبت'];

    let html = '';

    dayNames.forEach((name) => {
      html += `<div class="cal-day-name">${name}</div>`;
    });

    for (let i = 0; i < firstDay; i++) {
      html += `<div class="cal-day empty"></div>`;
    }

    for (let day = 1; day <= lastDate; day++) {
      const date = new Date(year, month, day);
      const key = getDateKey(date);
      const done = isDoneOnDateKey(habit, key);
      const isTodayCell = day === today.getDate();

      html += `
        <div class="cal-day ${done ? 'done' : ''} ${isTodayCell ? 'today' : ''}">
          ${day}
        </div>
      `;
    }

    return html;
  }

  function openDetails(id) {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;

    els.detailsTitle.textContent = `📊 ${habit.name}`;

    const completionDays = getCompletedDateKeys(habit).length;
    const daysSinceCreated = Math.max(
      1,
      Math.floor((Date.now() - habit.createdAt) / (1000 * 60 * 60 * 24)) + 1
    );
    const completionRate = Math.round((completionDays / daysSinceCreated) * 100);

    els.detailsBody.innerHTML = `
      <div class="details-header">
        <div class="details-icon" style="background:${habit.color};">${habit.icon}</div>
        <div>
          <div class="details-name">${escapeHTML(habit.name)}</div>
          <div class="details-sub">
            الهدف اليومي: ${habit.target} ${escapeHTML(habit.unit)} •
            ${habit.strictMode ? 'Strict Streak' : 'Flexible Mode'}
          </div>
        </div>
      </div>

      <div class="details-streaks">
        <div class="streak-box">
          <div class="streak-box-num">🔥 ${habit.streak}</div>
          <div class="streak-box-label">Streak الحالي</div>
        </div>

        <div class="streak-box">
          <div class="streak-box-num">🏆 ${habit.bestStreak}</div>
          <div class="streak-box-label">أفضل Streak</div>
        </div>

        <div class="streak-box">
          <div class="streak-box-num">✅ ${completionDays}</div>
          <div class="streak-box-label">إجمالي الأيام المكتملة</div>
        </div>

        <div class="streak-box">
          <div class="streak-box-num">📈 ${completionRate}%</div>
          <div class="streak-box-label">معدل الالتزام</div>
        </div>
      </div>

      <h4 class="details-section-title">📅 هذا الشهر</h4>
      <div class="calendar-grid" style="--habit-color:${habit.color};">
        ${renderMonthCalendar(habit)}
      </div>

      <div class="details-actions">
        <button class="details-btn" data-detail-action="edit" data-id="${habit.id}" type="button">✏️ تعديل</button>
        <button class="details-btn" data-detail-action="up" data-id="${habit.id}" type="button">⬆️ لفوق</button>
        <button class="details-btn" data-detail-action="down" data-id="${habit.id}" type="button">⬇️ لتحت</button>
        <button class="details-btn delete" data-detail-action="delete" data-id="${habit.id}" type="button">🗑️ حذف</button>
      </div>
    `;

    openModal(els.detailsModal);
  }

  function deleteHabit(id) {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;

    if (!confirm(`حذف العادة "${habit.name}"؟ سيتم فقد كل البيانات الخاصة بها.`)) return;

    habits = habits.filter((h) => h.id !== id);
    saveHabits();
    renderAll();
    closeModal(els.detailsModal);
    setStatus('🗑️ تم حذف العادة', 'warning');
  }

  // ─────────────────────────────────────────────
  // Render all
  // ─────────────────────────────────────────────
  function renderAll() {
    hydrateAllHabits();
    renderStats();
    renderHabits();
    renderHeatmap();
    renderBadges();
    renderStreakBoard();
    renderMood();
    renderInsights();
    pulse(els.bestStreakHero);
  }

  // ─────────────────────────────────────────────
  // Events
  // ─────────────────────────────────────────────
  function bindEvents() {
    els.addHabitBtn?.addEventListener('click', openAddModal);
    els.completeAllBtn?.addEventListener('click', completeAllToday);

    els.insightsBtn?.addEventListener('click', () => {
      renderInsights();
      openModal(els.insightsModal);
    });

    els.badgesBtn?.addEventListener('click', () => {
      const panel = document.querySelector('.badges-preview-panel');
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        pulse(panel);
      }
    });

    els.filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter || 'all';
        els.filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderHabits();
      });
    });

    els.sortButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        currentSort = btn.dataset.sort || 'manual';
        localStorage.setItem(STORAGE.sort, currentSort);
        els.sortButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderHabits();
      });
    });

    els.habitsList?.addEventListener('click', (e) => {
      const emptyBtn = e.target.closest('#emptyAddBtn');
      if (emptyBtn) {
        openAddModal();
        return;
      }

      const toggleBtn = e.target.closest('[data-action="toggle"]');
      if (toggleBtn) {
        incrementTodayProgress(toggleBtn.dataset.id);
        return;
      }

      const detailsBtn = e.target.closest('[data-action="details"]');
      if (detailsBtn) {
        openDetails(detailsBtn.dataset.id);
        return;
      }

      const card = e.target.closest('.habit-card');
      if (card) {
        openDetails(card.dataset.habitId);
      }
    });

    els.closeModal?.addEventListener('click', () => closeModal(els.habitModal));
    els.closeDetails?.addEventListener('click', () => closeModal(els.detailsModal));
    els.closeInsights?.addEventListener('click', () => closeModal(els.insightsModal));

    [els.habitModal, els.detailsModal, els.insightsModal].forEach((modal) => {
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });

    els.saveHabit?.addEventListener('click', saveHabitFromForm);

    els.habitName?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveHabitFromForm();
      }
    });

    $$('.icon-pick').forEach((btn) => {
      btn.addEventListener('click', () => {
        setSelectedIcon(btn.dataset.icon);
      });
    });

    $$('.color-pick').forEach((btn) => {
      btn.addEventListener('click', () => {
        setSelectedColor(btn.dataset.color);
      });
    });

    els.detailsBody?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-detail-action]');
      if (!btn) return;

      const action = btn.dataset.detailAction;
      const id = btn.dataset.id;

      if (action === 'edit') {
        const habit = habits.find((h) => h.id === id);
        closeModal(els.detailsModal);
        openEditModal(habit);
      }

      if (action === 'delete') {
        deleteHabit(id);
      }

      if (action === 'up') {
        moveHabit(id, 'up');
      }

      if (action === 'down') {
        moveHabit(id, 'down');
      }
    });

    document.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement?.tagName;
      const typing = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';

      if ((e.key === 'n' || e.key === 'N') && !typing) {
        e.preventDefault();
        openAddModal();
      }

      if ((e.key === 'f' || e.key === 'F') && !typing) {
        e.preventDefault();
        const filters = ['all', 'today', 'done', 'broken'];
        const nextIndex = (filters.indexOf(currentFilter) + 1) % filters.length;
        currentFilter = filters[nextIndex];

        els.filterButtons.forEach((b) => {
          b.classList.toggle('active', b.dataset.filter === currentFilter);
        });

        renderHabits();
      }

      if (e.key === 'Escape') {
        closeAllModals();
      }
    });
  }

  // ─────────────────────────────────────────────
  // Init
  // ─────────────────────────────────────────────
  function init() {
    applySavedTheme();
    loadHabits();
    saveHabits();

    els.sortButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.sort === currentSort);
    });

    bindEvents();
    renderAll();
    resetHabitForm();

    console.log('✅ Habit Streak Premium جاهز!');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();