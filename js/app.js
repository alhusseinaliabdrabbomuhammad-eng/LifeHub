/* ═══════════════════════════════════════════════
   LifeHub - app.js (النسخة المصححة والمضمونة)
═══════════════════════════════════════════════ */

console.log('📦 LifeHub loading...');

// ═══════════════════════════════════════════════
//   التحية حسب الوقت
// ═══════════════════════════════════════════════
function setGreeting() {
  const el = document.getElementById('greeting');
  if (!el) return;

  const hour = new Date().getHours();
  let text = 'مساء الخير';
  let emoji = '🌙';

  if (hour >= 5 && hour < 12) {
    text = 'صباح الخير';
    emoji = '☀️';
  } else if (hour >= 12 && hour < 17) {
    text = 'مساء النور';
    emoji = '🌤️';
  } else if (hour >= 17 && hour < 21) {
    text = 'مساء الخير';
    emoji = '🌅';
  }

  el.textContent = emoji + ' ' + text;
}

// ═══════════════════════════════════════════════
//   التاريخ
// ═══════════════════════════════════════════════
function setDate() {
  const el = document.getElementById('dateText');
  if (!el) return;

  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  el.textContent = new Date().toLocaleDateString('ar-EG', options);
}

// ═══════════════════════════════════════════════
//   Toast Notification
// ═══════════════════════════════════════════════
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(function() {
    toast.classList.remove('show');
  }, 2500);
}

// ═══════════════════════════════════════════════
//   زر الثيم
// ═══════════════════════════════════════════════
function initTheme() {
  const btn = document.getElementById('themeBtn');
  if (!btn) return;

  // تحميل الثيم المحفوظ
  const saved = localStorage.getItem('lifehub-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  btn.textContent = saved === 'dark' ? '🌙' : '☀️';

  // ربط الحدث
  btn.onclick = function() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    btn.textContent = next === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('lifehub-theme', next);
    showToast(next === 'dark' ? '🌙 الوضع الداكن' : '☀️ الوضع الفاتح');
  };

  console.log('✅ Theme ready');
}

// ═══════════════════════════════════════════════
//   تحميل الإحصائيات (مصححة)
// ═══════════════════════════════════════════════
function loadStats() {

  // Pomodoro
  try {
    const stats = JSON.parse(localStorage.getItem('lifehub-pomodoro-stats') || '{"sessions":[],"trees":[]}');
    const sessions = (stats.sessions || []).length;

    const el = document.getElementById('totalSessions');
    if (el) el.textContent = sessions;

    const card = document.getElementById('cardStat-pomodoro');
    if (card && sessions > 0) {
      const trees = (stats.trees || []).length;
      card.textContent = '🌳 ' + trees + ' شجرة • ' + sessions + ' جلسة';
      card.classList.add('active');
    }
  } catch (e) {}

  // Notes
  try {
    const notes = JSON.parse(localStorage.getItem('lifehub-notes') || '[]');
    const el = document.getElementById('totalNotes');
    if (el) el.textContent = notes.length;

    const card = document.getElementById('cardStat-notes');
    if (card && notes.length > 0) {
      const pinned = notes.filter(function(n) { return n.pinned; }).length;
      card.textContent = '📝 ' + notes.length + ' ملاحظة' + (pinned > 0 ? ' • 📌 ' + pinned : '');
      card.classList.add('active');
    }
  } catch (e) {}

  // Habits
  try {
    const habits = JSON.parse(localStorage.getItem('lifehub-habits') || '[]');
    const el = document.getElementById('totalHabits');
    if (el) el.textContent = habits.length;

    let bestStreak = 0;
    for (let i = 0; i < habits.length; i++) {
      const s = habits[i].bestStreak || habits[i].streak || 0;
      if (s > bestStreak) bestStreak = s;
    }

    const streakEl = document.getElementById('dayStreak');
    if (streakEl) streakEl.textContent = bestStreak;

    const card = document.getElementById('cardStat-habits');
    if (card && habits.length > 0) {
      card.textContent = '🎯 ' + habits.length + ' عادة • 🔥 ' + bestStreak + ' يوم';
      card.classList.add('active');
    }
  } catch (e) {}

  // Expenses
  try {
    const exp = JSON.parse(localStorage.getItem('lifehub-expenses') || '[]');
    const card = document.getElementById('cardStat-expenses');
    if (card && exp.length > 0) {
      let total = 0;
      for (let i = 0; i < exp.length; i++) total += exp[i].amount;
      card.textContent = '💰 ' + total.toLocaleString() + ' ج.م';
      card.classList.add('active');
    }
  } catch (e) {}

  // Colors
  try {
    const colors = JSON.parse(localStorage.getItem('lifehub-saved-colors') || '[]');
    const palettes = JSON.parse(localStorage.getItem('lifehub-saved-palettes') || '[]');
    const card = document.getElementById('cardStat-colors');
    if (card && (colors.length > 0 || palettes.length > 0)) {
      card.textContent = '🎨 ' + colors.length + ' لون • ' + palettes.length + ' palette';
      card.classList.add('active');
    }
  } catch (e) {}

  // Random
  try {
    const rolls = parseInt(localStorage.getItem('lifehub-total-rolls') || '0');
    const card = document.getElementById('cardStat-random');
    if (card && rolls > 0) {
      card.textContent = '🎲 ' + rolls + ' رمية';
      card.classList.add('active');
    }
  } catch (e) {}

  // ✅ Password Generator - تم الإصلاح
  try {
    // مولد كلمات المرور يخزن العدد الإجمالي تحت مفتاحين محتملين
    let totalGenerated = parseInt(localStorage.getItem('lifehub-passwords-generated') || '0');
    if (totalGenerated === 0) {
      // محاولة قراءة المفتاح القديم أو البديل
      totalGenerated = parseInt(localStorage.getItem('passwords_generated') || '0');
    }
    const card = document.getElementById('cardStat-password');
    if (card && totalGenerated > 0) {
      card.textContent = '🔐 ' + totalGenerated + ' كلمة مرور';
      card.classList.add('active');
    }
  } catch (e) {}
}

// ═══════════════════════════════════════════════
//   البدء
// ═══════════════════════════════════════════════
function startApp() {
  setGreeting();
  setDate();
  initTheme();
  loadStats();
  console.log('✅ LifeHub جاهز!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

// تحديث الإحصائيات كل 5 ثواني
setInterval(loadStats, 5000);