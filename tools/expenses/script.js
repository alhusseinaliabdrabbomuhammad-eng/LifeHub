/* ═══════════════════════════════════════════════
   Expense Lite Pro - السكريبت الكامل
═══════════════════════════════════════════════ */

// ─── الثيم ─────
const savedTheme = localStorage.getItem('lifehub-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// ─── البيانات ─────
let transactions = JSON.parse(localStorage.getItem('lifehub-transactions') || '[]');
let wallets = JSON.parse(localStorage.getItem('lifehub-wallets') || '[]');
let budgets = JSON.parse(localStorage.getItem('lifehub-budgets') || '{}');
let settings = JSON.parse(localStorage.getItem('lifehub-expense-settings') || '{"limit":200,"currency":"ج.م"}');

// ─── متغيرات حالة ─────
let currentType = 'expense';
let selectedCategory = null;
let selectedWallet = null;
let editingWalletId = null;
let selectedWalletIcon = '💵';
let selectedWalletColor = '#10b981';

// ─── الفئات ─────
const EXPENSE_CATEGORIES = {
  food: { name: 'طعام', emoji: '🍔', color: '#f59e0b' },
  transport: { name: 'مواصلات', emoji: '🚗', color: '#3b82f6' },
  shopping: { name: 'تسوق', emoji: '🛒', color: '#ec4899' },
  bills: { name: 'فواتير', emoji: '📃', color: '#ef4444' },
  health: { name: 'صحة', emoji: '💊', color: '#10b981' },
  entertainment: { name: 'ترفيه', emoji: '🎮', color: '#8b5cf6' },
  education: { name: 'تعليم', emoji: '📚', color: '#06b6d4' },
  gifts: { name: 'هدايا', emoji: '🎁', color: '#f97316' },
  travel: { name: 'سفر', emoji: '✈️', color: '#14b8a6' },
  other: { name: 'أخرى', emoji: '📌', color: '#94a3b8' }
};

const INCOME_CATEGORIES = {
  salary: { name: 'مرتب', emoji: '💼', color: '#10b981' },
  allowance: { name: 'مصروف والدي', emoji: '👨‍👩‍👧', color: '#3b82f6' },
  freelance: { name: 'عمل حر', emoji: '💻', color: '#8b5cf6' },
  bonus: { name: 'مكافأة', emoji: '🎉', color: '#f59e0b' },
  gift_income: { name: 'هدية', emoji: '🎁', color: '#ec4899' },
  investment: { name: 'استثمار', emoji: '📈', color: '#06b6d4' },
  refund: { name: 'استرداد', emoji: '🔄', color: '#84cc16' },
  other_income: { name: 'أخرى', emoji: '💰', color: '#94a3b8' }
};

function getCategoryInfo(catKey, type) {
  if (type === 'income') {
    return INCOME_CATEGORIES[catKey] || INCOME_CATEGORIES.other_income;
  }
  return EXPENSE_CATEGORIES[catKey] || EXPENSE_CATEGORIES.other;
}

// ─── دوال مساعدة ─────
function saveTransactions() {
  localStorage.setItem('lifehub-transactions', JSON.stringify(transactions));
}

function saveWallets() {
  localStorage.setItem('lifehub-wallets', JSON.stringify(wallets));
}

function saveBudgets() {
  localStorage.setItem('lifehub-budgets', JSON.stringify(budgets));
}

function saveSettings() {
  localStorage.setItem('lifehub-expense-settings', JSON.stringify(settings));
}

function setStatus(msg) {
  const el = document.getElementById('statusMessage');
  if (el) el.textContent = msg;
}

function formatNumber(num) {
  return Number(num).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'الآن';
  if (diff < 3600000) return Math.floor(diff / 60000) + ' د';
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' س';
  return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function isToday(ts) {
  return new Date(ts).toDateString() === new Date().toDateString();
}

function isThisWeek(ts) {
  return new Date(ts) >= new Date(Date.now() - 7 * 86400000);
}

function isThisMonth(ts) {
  const d = new Date(ts);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

// ═══════════════════════════════════════════════
//   التبويبات
// ═══════════════════════════════════════════════
document.querySelectorAll('.tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    const tabName = tab.dataset.tab;
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    tab.classList.add('active');
    document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
    const target = document.getElementById(tabName + 'Panel');
    if (target) target.classList.add('active');

    if (tabName === 'dashboard') renderDashboard();
    if (tabName === 'add') renderAddPanel();
    if (tabName === 'wallets') renderWallets();
    if (tabName === 'list') renderList();
    if (tabName === 'charts') renderCharts();
    if (tabName === 'budget') renderBudget();
  });
});

// ═══════════════════════════════════════════════
//   لوحة التحكم
// ═══════════════════════════════════════════════
function renderDashboard() {
  // حساب الإجماليات
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(function(t) {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;
  });

  const balance = totalIncome - totalExpense;

  // تحديث الرصيد
  document.getElementById('totalBalance').textContent = formatNumber(balance);
  document.getElementById('totalIncome').textContent = formatNumber(totalIncome);
  document.getElementById('totalExpense').textContent = formatNumber(totalExpense);
  document.getElementById('balanceCurrency').textContent = settings.currency;

  // إحصائيات الفترات
  const todayExp = transactions
    .filter(function(t) { return t.type === 'expense' && isToday(t.date); })
    .reduce(function(s, t) { return s + t.amount; }, 0);
  const weekExp = transactions
    .filter(function(t) { return t.type === 'expense' && isThisWeek(t.date); })
    .reduce(function(s, t) { return s + t.amount; }, 0);
  const monthExp = transactions
    .filter(function(t) { return t.type === 'expense' && isThisMonth(t.date); })
    .reduce(function(s, t) { return s + t.amount; }, 0);

  document.getElementById('todayTotal').textContent = formatNumber(todayExp);
  document.getElementById('weekTotal').textContent = formatNumber(weekExp);
  document.getElementById('monthTotal').textContent = formatNumber(monthExp);

  // نسبة الادخار
  const monthInc = transactions
    .filter(function(t) { return t.type === 'income' && isThisMonth(t.date); })
    .reduce(function(s, t) { return s + t.amount; }, 0);

  let savingRate = 0;
  if (monthInc > 0) {
    savingRate = Math.round(((monthInc - monthExp) / monthInc) * 100);
  }
  document.getElementById('savingRate').textContent = savingRate + '%';

  // الحد الأقصى
  renderLimit(todayExp);

  // أعلى الفئات
  renderTopCategories();

  // آخر المعاملات
  renderRecent();
}

function renderLimit(todayTotal) {
  const limit = settings.limit || 200;
  const percent = Math.min((todayTotal / limit) * 100, 100);
  const remaining = Math.max(limit - todayTotal, 0);
  const exceeded = todayTotal - limit;

  document.getElementById('limitValue').textContent = formatNumber(limit) + ' ' + settings.currency;
  document.getElementById('limitFill').style.width = percent + '%';
  document.getElementById('limitPercent').textContent = Math.round(percent) + '%';

  const fill = document.getElementById('limitFill');
  fill.classList.remove('warning', 'danger');

  const status = document.getElementById('limitStatus');

  if (percent >= 100) {
    fill.classList.add('danger');
    status.innerHTML = '❌ تجاوزت بـ <strong style="color:#ef4444">' + formatNumber(exceeded) + ' ' + settings.currency + '</strong>';
  } else if (percent >= 75) {
    fill.classList.add('warning');
    status.innerHTML = '⚠️ اقتربت - باقي <strong>' + formatNumber(remaining) + '</strong>';
  } else {
    status.innerHTML = '✅ ضمن الحد - باقي <strong>' + formatNumber(remaining) + '</strong>';
  }
}

function renderTopCategories() {
  const monthExp = transactions.filter(function(t) {
    return t.type === 'expense' && isThisMonth(t.date);
  });

  const totals = {};
  monthExp.forEach(function(t) {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });

  const grandTotal = Object.values(totals).reduce(function(a, b) { return a + b; }, 0);
  const sorted = Object.entries(totals).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5);

  const container = document.getElementById('topCategoriesList');

  if (sorted.length === 0) {
    container.innerHTML = '<p class="empty-msg">لا توجد بيانات بعد</p>';
    return;
  }

  let html = '';
  sorted.forEach(function(item) {
    const cat = getCategoryInfo(item[0], 'expense');
    const percent = (item[1] / grandTotal) * 100;
    html += '<div class="cat-row">' +
      '<div class="cat-row-icon">' + cat.emoji + '</div>' +
      '<div class="cat-row-info">' +
        '<div class="cat-row-name">' + cat.name + '</div>' +
        '<div class="cat-row-bar">' +
          '<div class="cat-row-fill" style="width:' + percent + '%; background:' + cat.color + '"></div>' +
        '</div>' +
      '</div>' +
      '<div class="cat-row-amount">' + formatNumber(item[1]) + '</div>' +
    '</div>';
  });

  container.innerHTML = html;
}

function renderRecent() {
  const recent = transactions.slice(0, 5);
  const container = document.getElementById('recentList');

  if (recent.length === 0) {
    container.innerHTML = '<p class="empty-msg">لا توجد معاملات</p>';
    return;
  }

  let html = '';
  recent.forEach(function(t) {
    const cat = getCategoryInfo(t.category, t.type);
    const wallet = wallets.find(function(w) { return w.id === t.walletId; });
    const walletTag = wallet ? '<span class="transaction-wallet-tag">' + wallet.icon + ' ' + wallet.name + '</span>' : '';
    const sign = t.type === 'income' ? '+' : '-';

    html += '<div class="transaction-item ' + t.type + '">' +
      '<div class="transaction-emoji">' + cat.emoji + '</div>' +
      '<div class="transaction-info">' +
        '<div class="transaction-desc">' + (t.description || cat.name) + '</div>' +
        '<div class="transaction-meta">' +
          cat.name + ' • ' + formatDate(t.date) +
          (walletTag ? ' • ' + walletTag : '') +
        '</div>' +
      '</div>' +
      '<div class="transaction-amount ' + t.type + '">' + sign + formatNumber(t.amount) + '</div>' +
    '</div>';
  });

  container.innerHTML = html;
}

// ═══════════════════════════════════════════════
//   إضافة معاملة
// ═══════════════════════════════════════════════
function renderAddPanel() {
  document.getElementById('currencyLabel').textContent = settings.currency;
  renderWalletsPicker();
  updateCategoriesVisibility();
  checkAddButton();
}

function renderWalletsPicker() {
  const container = document.getElementById('walletsPicker');

  if (wallets.length === 0) {
    container.innerHTML = '<p class="empty-msg" style="grid-column:1/-1;">⚠️ أضف محفظة أولاً من تبويب المحفظات</p>';
    return;
  }

  let html = '';
  wallets.forEach(function(w) {
    const isSelected = selectedWallet === w.id ? 'selected' : '';
    html += '<div class="wallet-pick-card ' + isSelected + '" data-wallet="' + w.id + '" ' +
      'style="--w-color:' + w.color + ';--w-bg:' + w.color + '20;">' +
      '<div class="wallet-pick-icon">' + w.icon + '</div>' +
      '<div class="wallet-pick-info">' +
        '<div class="wallet-pick-name">' + w.name + '</div>' +
        '<div class="wallet-pick-balance">' + formatNumber(w.balance) + ' ' + settings.currency + '</div>' +
      '</div>' +
    '</div>';
  });

  container.innerHTML = html;

  document.querySelectorAll('.wallet-pick-card').forEach(function(card) {
    card.addEventListener('click', function() {
      document.querySelectorAll('.wallet-pick-card').forEach(function(c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      selectedWallet = card.dataset.wallet;
      checkAddButton();
    });
  });
}

function updateCategoriesVisibility() {
  const expSection = document.getElementById('expenseCategoriesSection');
  const incSection = document.getElementById('incomeCategoriesSection');

  if (currentType === 'expense') {
    expSection.classList.remove('hidden');
    incSection.classList.add('hidden');
  } else {
    expSection.classList.add('hidden');
    incSection.classList.remove('hidden');
  }
}

function checkAddButton() {
  const amount = parseFloat(document.getElementById('amountInput').value);
  const btn = document.getElementById('addTransactionBtn');
  const hasAmount = !isNaN(amount) && amount > 0;
  const hasCategory = selectedCategory !== null;
  const hasWallet = selectedWallet !== null;

  btn.disabled = !(hasAmount && hasCategory && hasWallet);
}

// أزرار النوع
document.querySelectorAll('.type-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.type-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentType = btn.dataset.type;
    selectedCategory = null;
    document.querySelectorAll('.cat-card').forEach(function(c) { c.classList.remove('selected'); });
    updateCategoriesVisibility();
    checkAddButton();
  });
});

// المبلغ
document.getElementById('amountInput').addEventListener('input', checkAddButton);

// الفئات
document.querySelectorAll('.cat-card').forEach(function(card) {
  card.addEventListener('click', function() {
    // فئات المصاريف
    if (card.closest('#expenseCategoriesPicker')) {
      document.querySelectorAll('#expenseCategoriesPicker .cat-card').forEach(function(c) { c.classList.remove('selected'); });
    } else {
      document.querySelectorAll('#incomeCategoriesPicker .cat-card').forEach(function(c) { c.classList.remove('selected'); });
    }
    card.classList.add('selected');
    selectedCategory = card.dataset.category;
    checkAddButton();
  });
});

// زر الإضافة
document.getElementById('addTransactionBtn').addEventListener('click', function() {
  const amount = parseFloat(document.getElementById('amountInput').value);
  const description = document.getElementById('descInput').value.trim();

  if (!amount || amount <= 0 || !selectedCategory || !selectedWallet) return;

  const transaction = {
    id: generateId(),
    type: currentType,
    amount: amount,
    description: description,
    category: selectedCategory,
    walletId: selectedWallet,
    date: Date.now()
  };

  transactions.unshift(transaction);

  // تحديث رصيد المحفظة
  const wallet = wallets.find(function(w) { return w.id === selectedWallet; });
  if (wallet) {
    if (currentType === 'income') {
      wallet.balance += amount;
    } else {
      wallet.balance -= amount;
    }
    saveWallets();
  }

  saveTransactions();

  // إعادة تعيين
  document.getElementById('amountInput').value = '';
  document.getElementById('descInput').value = '';
  selectedCategory = null;
  document.querySelectorAll('.cat-card').forEach(function(c) { c.classList.remove('selected'); });
  checkAddButton();
  renderWalletsPicker();

  setStatus('✅ تم إضافة ' + (currentType === 'income' ? 'دخل' : 'مصروف') + ': ' + formatNumber(amount));

  // ارجع للوحة التحكم
  document.querySelector('[data-tab="dashboard"]').click();
});

// ═══════════════════════════════════════════════
//   المحفظات
// ═══════════════════════════════════════════════
function renderWallets() {
  const container = document.getElementById('walletsList');

  if (wallets.length === 0) {
    container.innerHTML = '<p class="empty-msg" style="grid-column:1/-1;">أضف أول محفظة لك! 💳</p>';
    return;
  }

  let html = '';
  wallets.forEach(function(w) {
    // حساب إحصائيات المحفظة
    const walletTransactions = transactions.filter(function(t) { return t.walletId === w.id; });
    const inc = walletTransactions
      .filter(function(t) { return t.type === 'income'; })
      .reduce(function(s, t) { return s + t.amount; }, 0);
    const exp = walletTransactions
      .filter(function(t) { return t.type === 'expense'; })
      .reduce(function(s, t) { return s + t.amount; }, 0);

    // درجة لونية ثانية
    const color2 = w.color + 'dd';

    html += '<div class="wallet-card" style="--w-color:' + w.color + ';--w-color2:' + color2 + ';">' +
      '<div class="wallet-card-header">' +
        '<div class="wallet-card-icon">' + w.icon + '</div>' +
        '<button class="wallet-card-delete" data-id="' + w.id + '">🗑️</button>' +
      '</div>' +
      '<div class="wallet-card-name">' + w.name + '</div>' +
      '<div class="wallet-card-balance">' + formatNumber(w.balance) + ' ' + settings.currency + '</div>' +
      '<div class="wallet-card-stats">' +
        '<div class="wallet-card-stat">' +
          '<span class="wallet-card-stat-label">💵 دخل</span>' +
          '<span class="wallet-card-stat-value">+' + formatNumber(inc) + '</span>' +
        '</div>' +
        '<div class="wallet-card-stat">' +
          '<span class="wallet-card-stat-label">💸 مصاريف</span>' +
          '<span class="wallet-card-stat-value">-' + formatNumber(exp) + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  });

  container.innerHTML = html;

  // ربط زر الحذف
  document.querySelectorAll('.wallet-card-delete').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!confirm('حذف هذه المحفظة؟ المعاملات المرتبطة بها ستبقى لكن بدون محفظة.')) return;
      wallets = wallets.filter(function(w) { return w.id !== btn.dataset.id; });
      saveWallets();
      renderWallets();
      setStatus('🗑️ تم حذف المحفظة');
    });
  });
}

// إضافة محفظة
document.getElementById('addWalletBtn').addEventListener('click', function() {
  editingWalletId = null;
  document.getElementById('walletName').value = '';
  document.getElementById('walletBalance').value = '';
  selectedWalletIcon = '💵';
  selectedWalletColor = '#10b981';
  updateWalletIconSelection();
  updateWalletColorSelection();
  document.getElementById('walletModal').classList.remove('hidden');
});

document.getElementById('closeWalletModal').addEventListener('click', function() {
  document.getElementById('walletModal').classList.add('hidden');
});

document.getElementById('walletModal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.add('hidden');
});

// أيقونات المحفظة
document.querySelectorAll('.w-icon').forEach(function(btn) {
  btn.addEventListener('click', function() {
    selectedWalletIcon = btn.dataset.icon;
    updateWalletIconSelection();
  });
});

document.querySelectorAll('.w-color').forEach(function(btn) {
  btn.addEventListener('click', function() {
    selectedWalletColor = btn.dataset.color;
    updateWalletColorSelection();
  });
});

function updateWalletIconSelection() {
  document.querySelectorAll('.w-icon').forEach(function(btn) {
    btn.classList.toggle('selected', btn.dataset.icon === selectedWalletIcon);
  });
}

function updateWalletColorSelection() {
  document.querySelectorAll('.w-color').forEach(function(btn) {
    btn.classList.toggle('selected', btn.dataset.color === selectedWalletColor);
  });
}

// حفظ المحفظة
document.getElementById('saveWalletBtn').addEventListener('click', function() {
  const name = document.getElementById('walletName').value.trim();
  const balance = parseFloat(document.getElementById('walletBalance').value) || 0;

  if (!name) {
    setStatus('⚠️ اكتب اسم المحفظة');
    return;
  }

  const wallet = {
    id: generateId(),
    name: name,
    balance: balance,
    icon: selectedWalletIcon,
    color: selectedWalletColor,
    createdAt: Date.now()
  };

  wallets.push(wallet);
  saveWallets();
  document.getElementById('walletModal').classList.add('hidden');
  renderWallets();
  setStatus('✅ تم إضافة محفظة: ' + name);
});

// ═══════════════════════════════════════════════
//   السجل
// ═══════════════════════════════════════════════
function renderList() {
  // ملء فلتر الفئات
  const filterCat = document.getElementById('filterCategory');
  let catOptions = '<option value="all">كل الفئات</option>';
  Object.entries(EXPENSE_CATEGORIES).forEach(function(item) {
    catOptions += '<option value="' + item[0] + '">' + item[1].emoji + ' ' + item[1].name + '</option>';
  });
  Object.entries(INCOME_CATEGORIES).forEach(function(item) {
    catOptions += '<option value="' + item[0] + '">' + item[1].emoji + ' ' + item[1].name + '</option>';
  });
  filterCat.innerHTML = catOptions;

  // ملء فلتر المحفظات
  const filterWallet = document.getElementById('filterWallet');
  let walletOptions = '<option value="all">كل المحفظات</option>';
  wallets.forEach(function(w) {
    walletOptions += '<option value="' + w.id + '">' + w.icon + ' ' + w.name + '</option>';
  });
  filterWallet.innerHTML = walletOptions;

  applyFilters();
}

function applyFilters() {
  let filtered = transactions.slice();

  const filterType = document.getElementById('filterType').value;
  const filterCat = document.getElementById('filterCategory').value;
  const filterPeriod = document.getElementById('filterPeriod').value;
  const filterWallet = document.getElementById('filterWallet').value;

  if (filterType !== 'all') {
    filtered = filtered.filter(function(t) { return t.type === filterType; });
  }
  if (filterCat !== 'all') {
    filtered = filtered.filter(function(t) { return t.category === filterCat; });
  }
  if (filterWallet !== 'all') {
    filtered = filtered.filter(function(t) { return t.walletId === filterWallet; });
  }
  if (filterPeriod === 'today') {
    filtered = filtered.filter(function(t) { return isToday(t.date); });
  } else if (filterPeriod === 'week') {
    filtered = filtered.filter(function(t) { return isThisWeek(t.date); });
  } else if (filterPeriod === 'month') {
    filtered = filtered.filter(function(t) { return isThisMonth(t.date); });
  }

  // الملخص
  const totalInc = filtered.filter(function(t) { return t.type === 'income'; }).reduce(function(s, t) { return s + t.amount; }, 0);
  const totalExp = filtered.filter(function(t) { return t.type === 'expense'; }).reduce(function(s, t) { return s + t.amount; }, 0);

  document.getElementById('listSummary').innerHTML =
    'العدد: <strong>' + filtered.length + '</strong> • ' +
    '💵 دخل: <strong>+' + formatNumber(totalInc) + '</strong> • ' +
    '💸 مصاريف: <strong>-' + formatNumber(totalExp) + '</strong>';

  const container = document.getElementById('transactionsList');

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-msg">لا توجد معاملات</p>';
    return;
  }

  let html = '';
  filtered.forEach(function(t) {
    const cat = getCategoryInfo(t.category, t.type);
    const wallet = wallets.find(function(w) { return w.id === t.walletId; });
    const walletTag = wallet ? '<span class="transaction-wallet-tag">' + wallet.icon + ' ' + wallet.name + '</span>' : '';
    const sign = t.type === 'income' ? '+' : '-';

    html += '<div class="transaction-item ' + t.type + '">' +
      '<div class="transaction-emoji">' + cat.emoji + '</div>' +
      '<div class="transaction-info">' +
        '<div class="transaction-desc">' + (t.description || cat.name) + '</div>' +
        '<div class="transaction-meta">' +
          cat.name + ' • ' + formatDate(t.date) +
          (walletTag ? ' • ' + walletTag : '') +
        '</div>' +
      '</div>' +
      '<div class="transaction-amount ' + t.type + '">' + sign + formatNumber(t.amount) + '</div>' +
      '<button class="transaction-delete" data-id="' + t.id + '">🗑️</button>' +
    '</div>';
  });

  container.innerHTML = html;

  // ربط الحذف
  document.querySelectorAll('.transaction-delete').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (!confirm('حذف هذه المعاملة؟')) return;
      const trans = transactions.find(function(t) { return t.id === btn.dataset.id; });
      if (trans) {
        // عكس التأثير على المحفظة
        const wallet = wallets.find(function(w) { return w.id === trans.walletId; });
        if (wallet) {
          if (trans.type === 'income') wallet.balance -= trans.amount;
          else wallet.balance += trans.amount;
          saveWallets();
        }
        transactions = transactions.filter(function(t) { return t.id !== btn.dataset.id; });
        saveTransactions();
        applyFilters();
        setStatus('🗑️ تم الحذف');
      }
    });
  });
}

['filterType', 'filterCategory', 'filterPeriod', 'filterWallet'].forEach(function(id) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', applyFilters);
});

// ═══════════════════════════════════════════════
//   التقارير
// ═══════════════════════════════════════════════
function renderCharts() {
  drawPieChart();
  drawIncomePieChart();
  drawBarChart();
  drawMonthsChart();
  renderMonthlyReport();
}

function drawPieChart() {
  const canvas = document.getElementById('pieChart');
  const ctx = canvas.getContext('2d');
  const legend = document.getElementById('pieLegend');

  const monthExp = transactions.filter(function(t) {
    return t.type === 'expense' && isThisMonth(t.date);
  });

  if (monthExp.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Cairo';
    ctx.textAlign = 'center';
    ctx.fillText('لا توجد بيانات', canvas.width / 2, canvas.height / 2);
    legend.innerHTML = '';
    return;
  }

  const totals = {};
  monthExp.forEach(function(t) {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });

  const total = Object.values(totals).reduce(function(a, b) { return a + b; }, 0);
  const sorted = Object.entries(totals).sort(function(a, b) { return b[1] - a[1]; });

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = Math.min(cx, cy) - 20;

  let startAngle = -Math.PI / 2;

  sorted.forEach(function(item) {
    const cat = getCategoryInfo(item[0], 'expense');
    const sliceAngle = (item[1] / total) * 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = cat.color;
    ctx.fill();
    ctx.strokeStyle = '#0a0e1a';
    ctx.lineWidth = 3;
    ctx.stroke();

    startAngle += sliceAngle;
  });

  // الدائرة الداخلية
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.55, 0, 2 * Math.PI);
  ctx.fillStyle = '#0a0e1a';
  ctx.fill();

  // النص
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 20px JetBrains Mono';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatNumber(total), cx, cy - 8);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px Cairo';
  ctx.fillText('مصاريف', cx, cy + 14);

  // Legend
  let html = '';
  sorted.forEach(function(item) {
    const cat = getCategoryInfo(item[0], 'expense');
    const percent = ((item[1] / total) * 100).toFixed(1);
    html += '<div class="legend-item">' +
      '<div class="legend-color" style="background:' + cat.color + '"></div>' +
      '<div class="legend-info">' +
        '<span>' + cat.emoji + ' ' + cat.name + '</span>' +
        '<span class="legend-value">' + percent + '%</span>' +
      '</div>' +
    '</div>';
  });
  legend.innerHTML = html;
}

function drawIncomePieChart() {
  const canvas = document.getElementById('incomePieChart');
  const ctx = canvas.getContext('2d');
  const legend = document.getElementById('incomePieLegend');

  const monthInc = transactions.filter(function(t) {
    return t.type === 'income' && isThisMonth(t.date);
  });

  if (monthInc.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Cairo';
    ctx.textAlign = 'center';
    ctx.fillText('لا يوجد دخل', canvas.width / 2, canvas.height / 2);
    legend.innerHTML = '';
    return;
  }

  const totals = {};
  monthInc.forEach(function(t) {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });

  const total = Object.values(totals).reduce(function(a, b) { return a + b; }, 0);
  const sorted = Object.entries(totals).sort(function(a, b) { return b[1] - a[1]; });

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = Math.min(cx, cy) - 20;
  let startAngle = -Math.PI / 2;

  sorted.forEach(function(item) {
    const cat = getCategoryInfo(item[0], 'income');
    const sliceAngle = (item[1] / total) * 2 * Math.PI;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = cat.color;
    ctx.fill();
    ctx.strokeStyle = '#0a0e1a';
    ctx.lineWidth = 3;
    ctx.stroke();

    startAngle += sliceAngle;
  });

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.55, 0, 2 * Math.PI);
  ctx.fillStyle = '#0a0e1a';
  ctx.fill();

  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 20px JetBrains Mono';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatNumber(total), cx, cy - 8);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px Cairo';
  ctx.fillText('دخل', cx, cy + 14);

  let html = '';
  sorted.forEach(function(item) {
    const cat = getCategoryInfo(item[0], 'income');
    const percent = ((item[1] / total) * 100).toFixed(1);
    html += '<div class="legend-item">' +
      '<div class="legend-color" style="background:' + cat.color + '"></div>' +
      '<div class="legend-info">' +
        '<span>' + cat.emoji + ' ' + cat.name + '</span>' +
        '<span class="legend-value">' + percent + '%</span>' +
      '</div>' +
    '</div>';
  });
  legend.innerHTML = html;
}

function drawBarChart() {
  const canvas = document.getElementById('barChart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const dayNames = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمس', 'جمع', 'سبت'];
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const dayTrans = transactions.filter(function(t) {
      return t.date >= date.getTime() && t.date <= end.getTime();
    });

    const inc = dayTrans.filter(function(t) { return t.type === 'income'; }).reduce(function(s, t) { return s + t.amount; }, 0);
    const exp = dayTrans.filter(function(t) { return t.type === 'expense'; }).reduce(function(s, t) { return s + t.amount; }, 0);

    days.push({
      label: dayNames[date.getDay()] + ' ' + date.getDate(),
      income: inc,
      expense: exp
    });
  }

  const maxValue = Math.max.apply(null, days.map(function(d) {
    return Math.max(d.income, d.expense);
  })) || 100;

  const padding = 50;
  const width = canvas.width - padding * 2;
  const height = canvas.height - padding * 2;
  const barGroupWidth = width / 7;

  days.forEach(function(day, i) {
    const groupX = padding + (i * barGroupWidth);
    const barWidth = (barGroupWidth - 20) / 2;

    // Income bar
    const incHeight = (day.income / maxValue) * height;
    ctx.fillStyle = '#10b981';
    ctx.fillRect(groupX + 10, canvas.height - padding - incHeight, barWidth, incHeight);

    // Expense bar
    const expHeight = (day.expense / maxValue) * height;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(groupX + 10 + barWidth, canvas.height - padding - expHeight, barWidth, expHeight);

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Cairo';
    ctx.textAlign = 'center';
    ctx.fillText(day.label, groupX + barGroupWidth / 2, canvas.height - padding + 18);
  });

  // خط الأساس
  ctx.strokeStyle = '#2a2a3a';
  ctx.beginPath();
  ctx.moveTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  // Legend
  ctx.fillStyle = '#10b981';
  ctx.fillRect(padding, 10, 15, 15);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px Cairo';
  ctx.textAlign = 'left';
  ctx.fillText('💵 دخل', padding + 20, 22);

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(padding + 100, 10, 15, 15);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('💸 مصاريف', padding + 120, 22);
}

function drawMonthsChart() {
  const canvas = document.getElementById('monthsChart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const target = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

    const monthTrans = transactions.filter(function(t) {
      return t.date >= target.getTime() && t.date <= end.getTime();
    });

    const exp = monthTrans.filter(function(t) { return t.type === 'expense'; }).reduce(function(s, t) { return s + t.amount; }, 0);

    months.push({
      label: monthNames[target.getMonth()].substring(0, 3),
      value: exp
    });
  }

  const maxValue = Math.max.apply(null, months.map(function(m) { return m.value; })) || 100;

  const padding = 50;
  const width = canvas.width - padding * 2;
  const height = canvas.height - padding * 2;
  const barWidth = width / 6;

  months.forEach(function(m, i) {
    const barHeight = (m.value / maxValue) * height;
    const x = padding + (i * barWidth) + 15;
    const y = canvas.height - padding - barHeight;
    const w = barWidth - 30;

    const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
    gradient.addColorStop(0, '#ec4899');
    gradient.addColorStop(1, '#be185d');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, barHeight);

    if (m.value > 0) {
      ctx.fillStyle = '#ec4899';
      ctx.font = 'bold 11px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(formatNumber(m.value), x + w / 2, y - 8);
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Cairo';
    ctx.textAlign = 'center';
    ctx.fillText(m.label, x + w / 2, canvas.height - padding + 18);
  });

  ctx.strokeStyle = '#2a2a3a';
  ctx.beginPath();
  ctx.moveTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();
}

function renderMonthlyReport() {
  const monthTrans = transactions.filter(function(t) { return isThisMonth(t.date); });
  const inc = monthTrans.filter(function(t) { return t.type === 'income'; }).reduce(function(s, t) { return s + t.amount; }, 0);
  const exp = monthTrans.filter(function(t) { return t.type === 'expense'; }).reduce(function(s, t) { return s + t.amount; }, 0);
  const balance = inc - exp;
  const savingRate = inc > 0 ? Math.round((balance / inc) * 100) : 0;

  const incCount = monthTrans.filter(function(t) { return t.type === 'income'; }).length;
  const expCount = monthTrans.filter(function(t) { return t.type === 'expense'; }).length;

  const avgExp = expCount > 0 ? exp / expCount : 0;

  // أكبر فئة
  const catTotals = {};
  monthTrans.filter(function(t) { return t.type === 'expense'; }).forEach(function(t) {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });
  const topCat = Object.entries(catTotals).sort(function(a, b) { return b[1] - a[1]; })[0];
  const topCatInfo = topCat ? getCategoryInfo(topCat[0], 'expense') : null;

  const html =
    '<div class="report-item"><span>💵 إجمالي الدخل</span><strong>+' + formatNumber(inc) + '</strong></div>' +
    '<div class="report-item"><span>💸 إجمالي المصاريف</span><strong style="color:#ef4444">-' + formatNumber(exp) + '</strong></div>' +
    '<div class="report-item"><span>💎 الصافي</span><strong style="color:' + (balance >= 0 ? '#10b981' : '#ef4444') + '">' + (balance >= 0 ? '+' : '') + formatNumber(balance) + '</strong></div>' +
    '<div class="report-item"><span>🐷 نسبة الادخار</span><strong>' + savingRate + '%</strong></div>' +
    '<div class="report-item"><span>📊 عدد المعاملات</span><strong>' + monthTrans.length + ' (' + incCount + ' دخل، ' + expCount + ' مصروف)</strong></div>' +
    '<div class="report-item"><span>📈 متوسط المصروف</span><strong>' + formatNumber(avgExp) + '</strong></div>' +
    (topCatInfo ? '<div class="report-item"><span>🏆 أكبر فئة إنفاق</span><strong>' + topCatInfo.emoji + ' ' + topCatInfo.name + ' (' + formatNumber(topCat[1]) + ')</strong></div>' : '');

  document.getElementById('reportContent').innerHTML = html;
}

// ═══════════════════════════════════════════════
//   الميزانية
// ═══════════════════════════════════════════════
function renderBudget() {
  const container = document.getElementById('budgetsList');
  let html = '';

  // حساب المصروف الشهري لكل فئة
  const monthExp = transactions.filter(function(t) {
    return t.type === 'expense' && isThisMonth(t.date);
  });

  const spent = {};
  monthExp.forEach(function(t) {
    spent[t.category] = (spent[t.category] || 0) + t.amount;
  });

  Object.entries(EXPENSE_CATEGORIES).forEach(function(item) {
    const catKey = item[0];
    const cat = item[1];
    const budget = budgets[catKey] || 0;
    const spentAmount = spent[catKey] || 0;
    const percent = budget > 0 ? Math.min((spentAmount / budget) * 100, 100) : 0;
    const remaining = Math.max(budget - spentAmount, 0);

    let barColor = '#10b981';
    if (percent >= 100) barColor = '#ef4444';
    else if (percent >= 75) barColor = '#f59e0b';

    html += '<div class="budget-item">' +
      '<div class="budget-item-header">' +
        '<div class="budget-item-name">' +
          '<span class="budget-item-emoji">' + cat.emoji + '</span>' +
          '<span>' + cat.name + '</span>' +
        '</div>' +
        '<input type="number" class="budget-input" data-cat="' + catKey + '" value="' + budget + '" placeholder="0" min="0" step="0.01">' +
      '</div>' +
      (budget > 0 ? '<div class="budget-progress">' +
        '<div class="budget-progress-fill" style="width:' + percent + '%; background:' + barColor + '"></div>' +
      '</div>' +
      '<div class="budget-stats">' +
        '<span>صرفت: ' + formatNumber(spentAmount) + '</span>' +
        '<span>باقي: ' + formatNumber(remaining) + ' (' + Math.round(percent) + '%)</span>' +
      '</div>' : '') +
    '</div>';
  });

  container.innerHTML = html;
}

document.getElementById('saveBudgetBtn').addEventListener('click', function() {
  document.querySelectorAll('.budget-input').forEach(function(input) {
    const val = parseFloat(input.value) || 0;
    budgets[input.dataset.cat] = val;
  });
  saveBudgets();
  renderBudget();
  setStatus('💾 تم حفظ الميزانية');
});

// ═══════════════════════════════════════════════
//   الإعدادات
// ═══════════════════════════════════════════════
document.getElementById('settingsBtn').addEventListener('click', function() {
  document.getElementById('dailyLimitInput').value = settings.limit;
  document.getElementById('currencyInput').value = settings.currency;
  document.getElementById('settingsModal').classList.remove('hidden');
});

document.getElementById('closeSettings').addEventListener('click', function() {
  document.getElementById('settingsModal').classList.add('hidden');
});

document.getElementById('settingsModal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.add('hidden');
});

document.getElementById('saveSettingsBtn').addEventListener('click', function() {
  const limit = parseFloat(document.getElementById('dailyLimitInput').value);
  if (!isNaN(limit) && limit > 0) settings.limit = limit;
  settings.currency = document.getElementById('currencyInput').value;
  saveSettings();
  document.getElementById('settingsModal').classList.add('hidden');
  renderDashboard();
  setStatus('💾 تم حفظ الإعدادات');
});

document.getElementById('resetAllBtn').addEventListener('click', function() {
  if (!confirm('⚠️ سيتم حذف كل البيانات!')) return;
  const final = prompt('اكتب "نعم" للتأكيد:');
  if (final !== 'نعم') return;

  transactions = [];
  wallets = [];
  budgets = {};
  saveTransactions();
  saveWallets();
  saveBudgets();
  document.getElementById('settingsModal').classList.add('hidden');
  renderDashboard();
  setStatus('🗑️ تم مسح كل البيانات');
});

// ═══════════════════════════════════════════════
//   التصدير
// ═══════════════════════════════════════════════
document.getElementById('exportBtn').addEventListener('click', function() {
  if (transactions.length === 0) {
    setStatus('⚠️ لا توجد معاملات للتصدير');
    return;
  }

  let csv = '\uFEFF';
  csv += 'التاريخ,النوع,الفئة,الوصف,المبلغ,المحفظة,العملة\n';

  transactions.forEach(function(t) {
    const cat = getCategoryInfo(t.category, t.type);
    const wallet = wallets.find(function(w) { return w.id === t.walletId; });
    const date = new Date(t.date).toLocaleString('ar-EG');
    const desc = (t.description || '').replace(/,/g, '،');
    const typeText = t.type === 'income' ? 'دخل' : 'مصروف';
    const walletName = wallet ? wallet.name : '—';

    csv += date + ',' + typeText + ',' + cat.name + ',' + desc + ',' + t.amount + ',' + walletName + ',' + settings.currency + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'expenses-' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
  URL.revokeObjectURL(url);

  setStatus('📤 تم تصدير ' + transactions.length + ' معاملة');
});

// ─── التهيئة ─────
renderDashboard();
console.log('✅ Expense Lite Pro جاهز!');