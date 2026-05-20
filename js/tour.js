/* ═══════════════════════════════════════════════
   Tour System - النظام الكامل لكل الأدوات (نسخة مصححة)
═══════════════════════════════════════════════ */

(function() {
  'use strict';

  let currentStep = 0;
  let steps = [];
  let isPaused = false;
  let isActive = false;
  let autoPlayTimeout = null;
  let toolName = '';

  // ═══════════════════════════════════════════════
  //   خطوات كل الأدوات
  // ═══════════════════════════════════════════════
  const ALL_TOURS = {
    password: {
      name: 'مولد كلمات المرور',
      steps: [
        { icon: '🔐', title: 'مرحباً بك!', description: 'هنا تقدر تولّد كلمات مرور قوية جداً. هنشوف كل المميزات سوا!', target: '.tool-title', position: 'bottom' },
        { icon: '✨', title: 'كلمة المرور', description: 'هنا تظهر كلمة المرور. كل مرة تفتح الصفحة تتولد واحدة جديدة تلقائياً!', target: '.password-display', position: 'bottom', showPointer: true },
        { icon: '📋', title: 'زر النسخ', description: 'بنقرة واحدة تنسخ كلمة المرور. هتشوف ✅ تظهر لما تنجح!', target: '#copyBtn', position: 'left', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '🔄', title: 'زر التوليد', description: 'اضغط هنا في أي وقت لتوليد كلمة مرور جديدة. شوف الزر بيلف 180 درجة!', target: '#generateBtn', position: 'left', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '💪', title: 'مقياس القوة', description: 'هذا الشريط يخبرك بقوة كلمة المرور:<br>🔴 ضعيف ← 🟢 حصن منيع', target: '.strength-section', position: 'bottom' },
        { icon: '⏱️', title: 'وقت الاختراق', description: 'تقدير ذكي لكم سيستغرق المخترقين لكسر كلمة المرور!', target: '#crackTime', position: 'top' },
        { icon: '📏', title: 'الطول', description: 'حرّك الشريط لتغيير طول كلمة المرور من <strong>4 إلى 64</strong> حرف!', target: '#lengthSlider', position: 'top', showPointer: true, action: function(el) { if (el) { el.value = 24; el.dispatchEvent(new Event('input')); } } },
        { icon: '🔤', title: 'أنواع الأحرف', description: 'اختر إيه اللي تريد:<br>• <strong>A-Z</strong> كبيرة<br>• <strong>a-z</strong> صغيرة<br>• <strong>0-9</strong> أرقام<br>• <strong>!@#</strong> رموز', target: '.types-grid', position: 'top' },
        { icon: '⚡', title: 'إعدادات سريعة', description: '4 إعدادات جاهزة:<br>🔢 PIN • 💪 قوي • 🏰 قوي جداً • 🧠 سهل الحفظ', target: '.presets', position: 'top', showPointer: true, action: function(el) { if (el) { const b = el.querySelector('[data-preset="strong"]'); if (b) b.click(); } } },
        { icon: '🎉', title: 'انت جاهز!', description: 'الآن تعرف كل شيء!<br><br>💡 <strong>نصيحة:</strong> استخدم كلمات مختلفة لكل حساب!', target: null }
      ]
    },
    random: {
      name: 'النرد والعشوائي',
      steps: [
        { icon: '🎲', title: 'مرحباً بأدوات العشوائية!', description: '6 أدوات ممتعة وعملية في مكان واحد. هنشوفهم كلهم!', target: '.tool-title', position: 'bottom' },
        { icon: '📑', title: 'التبويبات', description: 'انتقل بين الأدوات الـ 6: نرد، عملة، عجلة، اختيار، أرقام، بطاقة', target: '.tabs', position: 'bottom' },
        { icon: '🎲', title: 'النرد', description: 'نرد ثلاثي الأبعاد حقيقي! يدور ويقف على الوجه الصحيح', target: '.dice-container', position: 'bottom', showPointer: true },
        { icon: '➕', title: 'عدد النرد', description: 'تقدر ترمي من 1 إلى 10 نرد في نفس الوقت!', target: '.dice-count', position: 'top' },
        { icon: '▶', title: 'ارمي!', description: 'اضغط هنا واستمتع بالأنميشن', target: '#rollDiceBtn', position: 'top', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '🪙', title: 'العملة', description: 'لنشوف العملة!', target: '[data-tab="coin"]', position: 'bottom', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '🎰', title: 'العجلة', description: 'عجلة الحظ مع خيارات مخصصة!', target: '[data-tab="wheel"]', position: 'bottom', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '✍️', title: 'اكتب خياراتك', description: 'اكتب أي خيارات تريدها مفصولة بفاصلة', target: '#wheelOptions', position: 'top' },
        { icon: '🎯', title: 'الاختيار العشوائي', description: 'اكتب قائمة واختر منها عشوائياً!', target: '[data-tab="picker"]', position: 'bottom', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '🔢', title: 'مولد الأرقام', description: 'ولّد أرقام عشوائية في نطاق محدد', target: '[data-tab="number"]', position: 'bottom', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '🎴', title: 'البطاقات', description: 'اسحب بطاقة عشوائية من 52 احتمال!', target: '[data-tab="card"]', position: 'bottom', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '📊', title: 'العداد', description: 'هذا العداد يحسب كل رمياتك! يظل محفوظ حتى لو قفلت الصفحة', target: '.header-stats', position: 'bottom' },
        { icon: '🎉', title: 'استمتع!', description: 'الآن جرّب كل الأدوات الـ 6 واستمتع! 🎮', target: null }
      ]
    },
    colors: {
      name: 'منتقي الألوان',
      steps: [
        { icon: '🎨', title: 'مرحباً!', description: 'أداة احترافية للألوان! 3 طرق لاستخراج وإنشاء الألوان', target: '.tool-title', position: 'bottom' },
        { icon: '📑', title: 'التبويبات', description: '3 طرق مختلفة:<br>📸 من صورة<br>🎨 يدوي<br>✨ مولد ذكي', target: '.tabs', position: 'bottom' },
        { icon: '📸', title: 'رفع صورة', description: 'اضغط أو اسحب أي صورة وسنستخرج منها الألوان!', target: '.upload-label', position: 'bottom', showPointer: true },
        { icon: '🎨', title: 'يدوي', description: 'لنجرب التبويب اليدوي', target: '[data-tab="manual"]', position: 'bottom', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '🌈', title: 'منتقي الألوان', description: 'اضغط على الدائرة لاختيار أي لون يدوياً', target: '#colorInput', position: 'bottom', showPointer: true },
        { icon: '📋', title: 'القيم', description: 'الكود يظهر بـ HEX و RGB و HSL. اضغط 📋 لنسخ أي قيمة!', target: '.manual-info', position: 'top' },
        { icon: '👁️', title: 'معاينة فورية', description: 'شوف اللون مع تصميم حقيقي قبل ما تستخدمه!', target: '.preview-design', position: 'top' },
        { icon: '✨', title: 'المولد الذكي', description: 'لنجرب أقوى ميزة!', target: '[data-tab="generator"]', position: 'bottom', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '🎯', title: 'اللون الأساسي', description: 'اختر لون واحد، والمولد سيقترح ألوان متناغمة معه!', target: '.base-color', position: 'top' },
        { icon: '🎨', title: 'أنماط متعددة', description: '5 أنماط احترافية:<br>🔄 متكامل<br>🌊 متجانس<br>🔺 ثلاثي<br>🟦 رباعي<br>📊 أحادي', target: '.scheme-buttons', position: 'top' },
        { icon: '💾', title: 'المحفوظات', description: 'احفظ ألوانك المفضلة! الـ Badge يعرض عدد المحفوظات', target: '#savedBtn', position: 'bottom', showPointer: true },
        { icon: '🎉', title: 'انطلق!', description: 'الآن جرّب كل الأدوات واستمتع بصناعة الألوان! 🌈', target: null }
      ]
    },
    notes: {
      name: 'الملاحظات الذكية',
      steps: [
        { icon: '📝', title: 'مرحباً!', description: 'أداة ملاحظات احترافية تدعم <strong>Markdown</strong>!', target: '.tool-title', position: 'bottom' },
        { icon: '➕', title: 'إضافة ملاحظة', description: 'اضغط هنا لإنشاء ملاحظة جديدة', target: '#newNoteBtn', position: 'bottom', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '📌', title: 'العنوان', description: 'اكتب عنوان الملاحظة هنا', target: '#noteTitle', position: 'bottom', showPointer: true, action: function(el) { if (el) { el.value = 'ملاحظة تجريبية'; el.dispatchEvent(new Event('input')); } } },
        { icon: '🏷️', title: 'الفئة', description: 'صنّف ملاحظتك:<br>🌸 شخصي • 💼 عمل • 💡 أفكار • ✅ مهام', target: '#noteCategory', position: 'bottom' },
        { icon: '📌', title: 'التثبيت', description: 'ثبّت الملاحظات المهمة لتظهر في الأعلى', target: '#pinBtn', position: 'bottom', showPointer: true },
        { icon: '⚡', title: 'أوضاع العرض', description: '3 أوضاع:<br>⚡ جنباً إلى جنب<br>✍️ محرر فقط<br>👁️ معاينة فقط', target: '.view-modes', position: 'bottom' },
        { icon: '🛠️', title: 'أدوات Markdown', description: 'أزرار سريعة للتنسيق:<br><strong>B</strong> عريض • <em>I</em> مائل • قوائم • روابط', target: '.markdown-toolbar', position: 'bottom' },
        { icon: '✍️', title: 'المحرر', description: 'اكتب هنا بـ Markdown:<br>• <strong># عنوان</strong><br>• <strong>**عريض**</strong><br>• <strong>- قائمة</strong>', target: '#noteContent', position: 'top', showPointer: true, action: function(el) { if (el) { el.value = '# مرحباً\n\nهذه **ملاحظة تجريبية**!\n\n- نقطة 1\n- نقطة 2'; el.dispatchEvent(new Event('input')); } } },
        { icon: '👁️', title: 'المعاينة', description: 'شوف النص متنسق فوراً وأنت بتكتب!', target: '.preview-pane', position: 'top' },
        { icon: '🔍', title: 'البحث', description: 'ابحث في كل ملاحظاتك بسرعة فائقة', target: '.search-box', position: 'left' },
        { icon: '🏷️', title: 'الفئات', description: 'فلتر ملاحظاتك حسب الفئة', target: '.categories', position: 'left' },
        { icon: '💾', title: 'حفظ تلقائي', description: 'كل ما تكتب يتحفظ تلقائياً! مفيش زر حفظ.', target: '#saveStatus', position: 'top' },
        { icon: '🎉', title: 'استمتع!', description: 'الآن ابدأ كتابة ملاحظاتك! 📝', target: null }
      ]
    },
    expenses: {
      name: 'Expense Lite Pro',
      steps: [
        { icon: '💰', title: 'مرحباً بك في Expense Pro!', description: 'أداة احترافية لإدارة أموالك بالكامل:<br>💵 مصادر دخل متعددة<br>💳 محفظات منفصلة<br>📊 تقارير ذكية<br>🎯 ميزانية لكل فئة', target: '.tool-title', position: 'bottom' },
        { icon: '📑', title: 'التبويبات الستة', description: 'كل أداة في تبويب:<br>📊 الرئيسية • ➕ إضافة<br>💳 المحفظات • 📋 السجل<br>📈 التقارير • 🎯 الميزانية', target: '.tabs', position: 'bottom' },
        { icon: '💳', title: 'الخطوة الأولى: المحفظات', description: 'قبل أي شيء، لازم تضيف <strong>محفظاتك</strong> (مصادر مالك).<br>مثال: مرتب شهري، مصروف والدي، كاش، فيزا...', target: '[data-tab="wallets"]', position: 'bottom', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '➕', title: 'إضافة محفظة', description: 'اضغط هنا لإنشاء محفظة جديدة<br><br>كل محفظة بـ:<br>📝 اسم • 💰 رصيد ابتدائي<br>🎨 أيقونة • 🌈 لون مميز', target: '#addWalletBtn', position: 'bottom', showPointer: true },
        { icon: '📊', title: 'لوحة التحكم', description: 'هنا تشوف كل شيء بنظرة واحدة', target: '[data-tab="dashboard"]', position: 'bottom', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '💎', title: 'الرصيد الإجمالي', description: 'البطاقة الخضراء الكبيرة تعرض:<br>💰 رصيدك الكلي<br>⬆️ إجمالي الدخل<br>⬇️ إجمالي المصاريف', target: '.balance-hero', position: 'bottom' },
        { icon: '📈', title: 'إحصائيات سريعة', description: '4 بطاقات ملونة:<br>📅 مصاريف اليوم<br>📆 هذا الأسبوع<br>🗓️ هذا الشهر<br>🐷 نسبة الادخار', target: '.stats-grid', position: 'top' },
        { icon: '🎯', title: 'الحد الأقصى اليومي', description: 'شريط ذكي يخبرك:<br>✅ ضمن الحد<br>⚠️ اقتربت<br>❌ تجاوزت<br><br>يتغير لونه تلقائياً!', target: '.limit-section', position: 'top' },
        { icon: '➕', title: 'إضافة معاملة', description: 'لنشوف كيفية إضافة دخل أو مصروف', target: '[data-tab="add"]', position: 'bottom', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '🔄', title: 'نوع المعاملة', description: 'اختر النوع:<br>⬇️ <strong>مصروف</strong> (أحمر)<br>⬆️ <strong>دخل</strong> (أخضر)<br><br>الفئات تتغير حسب الاختيار', target: '.type-toggle', position: 'bottom' },
        { icon: '💵', title: 'المبلغ', description: 'اكتب المبلغ هنا<br>الرقم كبير وواضح للسرعة', target: '.amount-section', position: 'bottom' },
        { icon: '💳', title: 'اختيار المحفظة', description: '<strong>مهم جداً!</strong><br>اختر من أي محفظة تأخذ/تضيف الفلوس<br><br>الرصيد سيتحدث تلقائياً!', target: '.wallet-picker', position: 'top' },
        { icon: '🏷️', title: 'الفئات', description: '10 فئات للمصاريف:<br>🍔 طعام • 🚗 مواصلات • 🛒 تسوق...<br><br>و8 فئات للدخل:<br>💼 مرتب • 👨‍👩‍👧 مصروف والدي...', target: '.categories-picker', position: 'top' },
        { icon: '📋', title: 'السجل والفلاتر', description: 'كل معاملاتك مع 4 فلاتر:<br>🔄 النوع • 🏷️ الفئة<br>📅 الفترة • 💳 المحفظة', target: '[data-tab="list"]', position: 'bottom', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '📈', title: 'التقارير الاحترافية', description: 'هنا السحر! 🔮', target: '[data-tab="charts"]', position: 'bottom', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '🥧', title: 'Pie Charts ملونة', description: '<strong>دائرتان ذكيتان:</strong><br>🔴 توزيع المصاريف بالفئة<br>🟢 توزيع الدخل بالمصدر<br><br>مع نسب مئوية تفصيلية', target: '.pie-chart-container', position: 'top' },
        { icon: '📊', title: 'مقارنة بصرية', description: 'رسوم بيانية تقارن:<br>📅 آخر 7 أيام (دخل vs مصاريف)<br>📆 آخر 6 شهور (الاتجاه العام)', target: '.bar-chart-container', position: 'top' },
        { icon: '📝', title: 'تقرير شهري ذكي', description: 'تحليل كامل للشهر:<br>💵 إجمالي الدخل والمصاريف<br>💎 الصافي + نسبة الادخار<br>🏆 أكبر فئة إنفاق<br>📊 متوسط المعاملات', target: '.monthly-report', position: 'top' },
        { icon: '🎯', title: 'الميزانية الشهرية', description: 'حدد سقف إنفاق لكل فئة', target: '[data-tab="budget"]', position: 'bottom', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '📊', title: 'تتبع الميزانية', description: 'كل فئة لها:<br>🟢 شريط أخضر (آمن)<br>🟡 شريط أصفر (تحذير 75%)<br>🔴 شريط أحمر (تجاوز!)', target: '.budgets-list', position: 'top' },
        { icon: '⚙️', title: 'الإعدادات', description: 'تحكم في:<br>🎯 الحد الأقصى اليومي<br>💱 العملة (ج.م، $، €، ر.س...)<br>🗑️ مسح كل البيانات', target: '#settingsBtn', position: 'bottom', showPointer: true },
        { icon: '📤', title: 'التصدير', description: 'صدّر كل معاملاتك إلى<br><strong>ملف CSV/Excel</strong><br>للتحليل أو الأرشفة', target: '#exportBtn', position: 'bottom', showPointer: true },
        { icon: '🎉', title: 'أنت جاهز للاحتراف!', description: '<strong>خطوات النجاح:</strong><br>1️⃣ أضف محفظاتك<br>2️⃣ سجّل كل دخل ومصروف<br>3️⃣ راجع التقارير أسبوعياً<br>4️⃣ حدد ميزانية واضحة<br><br>💪 ابدأ التحكم في أموالك الآن!', target: null }
      ]
    },
    habits: {
      name: 'متابع العادات',
      steps: [
        { icon: '🎯', title: 'مرحباً!', description: 'ابنِ عادات قوية مع نظام Streak ناري! 🔥', target: '.tool-title', position: 'bottom' },
        { icon: '📊', title: 'الإحصائيات', description: '4 بطاقات: عدد العادات • أعلى Streak • منجز اليوم • الإنجازات', target: '.quick-stats', position: 'bottom' },
        { icon: '➕', title: 'إضافة عادة', description: 'اضغط هنا لإنشاء عادة جديدة', target: '#addHabitBtn', position: 'bottom', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '📝', title: 'اسم العادة', description: 'اكتب العادة اللي تريد تبنيها', target: '#habitName', position: 'bottom', showPointer: true, action: function(el) { if (el) el.value = 'قراءة 30 دقيقة'; } },
        { icon: '🎨', title: 'الأيقونة', description: 'اختر أيقونة مناسبة لعادتك من 16 أيقونة!', target: '.icons-picker', position: 'top', showPointer: true, action: function(el) { if (el) { const b = el.querySelector('[data-icon="📖"]'); if (b) b.click(); } } },
        { icon: '🌈', title: 'اللون', description: 'اختر لون مميز لعادتك', target: '.colors-picker', position: 'top', showPointer: true, action: function(el) { if (el) { const b = el.querySelector('[data-color="#3b82f6"]'); if (b) b.click(); } } },
        { icon: '💾', title: 'حفظ', description: 'اضغط حفظ لإضافة العادة', target: '#saveHabit', position: 'top', showPointer: true, action: function(el) { if (el) el.click(); } },
        { icon: '✅', title: 'الإنجاز اليومي', description: 'اضغط الدائرة لتعليم اليوم كمنجز<br>🔥 الـ Streak هيبدأ يعد!', target: '.check-btn', position: 'left', showPointer: true },
        { icon: '🔥', title: 'Streak ناري', description: 'كل ما واظبت يومياً، الـ Streak يزيد!<br>💔 لو فاتك يوم، Streak يصفر!', target: '.streak-badge', position: 'bottom' },
        { icon: '📅', title: 'Calendar مصغر', description: 'شوف آخر 30 يوم بألوان! (زي GitHub contributions)', target: '.habit-calendar', position: 'top' },
        { icon: '📊', title: 'التفاصيل', description: 'اضغط 📊 لشوف:<br>• Calendar شهري كامل<br>• نسبة الالتزام<br>• إحصائيات تفصيلية', target: '.habit-menu-btn', position: 'left', showPointer: true },
        { icon: '🎯', title: 'الفلاتر', description: 'فلتر العادات حسب حالتها', target: '.filter-buttons', position: 'bottom' },
        { icon: '🏆', title: 'الشارات', description: '8 شارات إنجاز:<br>🌱 البداية • 🔥 7 أيام • ⭐ 30 يوم • 💎 100 يوم • 👑 سنة كاملة!', target: '.badges-section', position: 'top' },
        { icon: '🎉', title: 'ابدأ رحلتك!', description: 'كل يوم عادة، كل عادة Streak، كل Streak إنجاز! 🚀', target: null }
      ]
    },
    pomodoro: {
      name: 'Pomodoro Pro',
      steps: [
        { icon: '⏰', title: 'مرحباً بك!', description: 'مؤقت تركيز احترافي مع شجرة تنمو! 🌳', target: '.tool-title', position: 'bottom' },
        { icon: '🎯', title: 'أوضاع التركيز', description: '3 أوضاع:<br>🎯 تركيز 25 دقيقة<br>☕ استراحة قصيرة<br>🛋️ استراحة طويلة', target: '.mode-selector', position: 'bottom' },
        { icon: '🌱', title: 'الشجرة', description: 'الشجرة تنمو مع كل جلسة تركيز!<br>🌱 بذرة ← 🌿 نبتة ← 🌳 شجرة ← 🌸 مزدهرة!', target: '.tree-container', position: 'bottom' },
        { icon: '⏱️', title: 'المؤقت', description: 'الدائرة الوردية تمتلئ مع الوقت<br>الرقم يعد تنازلياً', target: '.timer-display', position: 'bottom' },
        { icon: '▶', title: 'ابدأ', description: 'اضغط هنا لبدء الجلسة!<br>⚠️ إذا أوقفت الجلسة، الشجرة ستموت! 💀', target: '#startBtn', position: 'top', showPointer: true },
        { icon: '↺', title: 'إعادة', description: 'لإعادة المؤقت من البداية<br>⚠️ في وضع التركيز، الشجرة هتموت!', target: '#resetBtn', position: 'top' },
        { icon: '⏭', title: 'تخطي', description: 'تخطي الجلسة الحالية', target: '#skipBtn', position: 'top' },
        { icon: '📝', title: 'المهمة الحالية', description: 'اكتب على إيه شغال الآن', target: '#currentTask', position: 'top' },
        { icon: '🎵', title: 'الأصوات الخلفية', description: '5 أصوات مولّدة لمساعدتك على التركيز:<br>🌧️ مطر • 🌲 غابة • ☕ مقهى • 🌊 محيط • 🔥 مدفأة', target: '.sounds-grid', position: 'top' },
        { icon: '🔉', title: 'مستوى الصوت', description: 'تحكم بمستوى الصوت', target: '.volume-control', position: 'top' },
        { icon: '📊', title: 'إحصائيات الأسبوع', description: 'رسم بياني لجلساتك خلال الأسبوع', target: '.weekly-chart', position: 'top' },
        { icon: '🌲', title: 'غابتك', description: 'اضغط هنا لشوف كل أشجارك اللي زرعتها!', target: '#forestBtn', position: 'bottom', showPointer: true },
        { icon: '⚙️', title: 'الإعدادات', description: 'غيّر المدد وفعّل الإشعارات والبدء التلقائي', target: '#settingsBtn', position: 'bottom', showPointer: true },
        { icon: '⌨️', title: 'اختصارات', description: '<strong>Space</strong> = ابدأ/أوقف<br><strong>R</strong> = إعادة<br><strong>S</strong> = تخطي', target: '.timer-section', position: 'top' },
        { icon: '🎉', title: 'ركّز وانطلق!', description: 'ابدأ أول جلسة وازرع شجرتك الأولى! 🌳<br><br>💡 <strong>نصيحة:</strong> ابدأ بـ 25 دقيقة فقط', target: null }
      ]
    }
  };

  // ═══════════════════════════════════════════════
  //   إنشاء عناصر الـ UI
  // ═══════════════════════════════════════════════
  function createTourUI() {
    // تجنب إنشاء أكثر من مرة
    if (document.getElementById('tourOverlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'tour-overlay';
    overlay.id = 'tourOverlay';
    document.body.appendChild(overlay);

    const spotlight = document.createElement('div');
    spotlight.className = 'tour-spotlight';
    spotlight.id = 'tourSpotlight';
    document.body.appendChild(spotlight);

    const pointer = document.createElement('div');
    pointer.className = 'tour-pointer';
    pointer.id = 'tourPointer';
    pointer.textContent = '👆';
    document.body.appendChild(pointer);

    const card = document.createElement('div');
    card.className = 'tour-card';
    card.id = 'tourCard';
    card.innerHTML =
      '<div class="tour-header">' +
        '<span class="tour-step-num" id="tourStepNum">1 / 10</span>' +
        '<button class="tour-close" id="tourClose" title="إنهاء">✕</button>' +
      '</div>' +
      '<div class="tour-title" id="tourTitle">' +
        '<span class="tour-icon">🎯</span>' +
        '<span>عنوان</span>' +
      '</div>' +
      '<div class="tour-description" id="tourDescription">شرح</div>' +
      '<div class="tour-progress">' +
        '<div class="tour-progress-fill" id="tourProgressFill"></div>' +
      '</div>' +
      '<div class="tour-actions">' +
        '<button class="tour-btn secondary" id="tourPrev">← السابق</button>' +
        '<button class="tour-btn pause" id="tourPause" title="إيقاف/استئناف">⏸</button>' +
        '<button class="tour-btn primary" id="tourNext">التالي →</button>' +
      '</div>' +
      '<div class="tour-dots" id="tourDots"></div>';
    document.body.appendChild(card);

    const welcome = document.createElement('div');
    welcome.className = 'tour-welcome';
    welcome.id = 'tourWelcome';
    welcome.innerHTML =
      '<div class="tour-welcome-box">' +
        '<div class="tour-welcome-icon">🎓</div>' +
        '<div class="tour-welcome-title" id="welcomeTitle">جولة تفاعلية</div>' +
        '<div class="tour-welcome-desc" id="welcomeDesc">سنأخذك في جولة شاملة لتتعلم كل المميزات الرائعة!</div>' +
        '<div class="tour-welcome-stats">' +
          '<div class="tour-welcome-stat">' +
            '<strong id="welcomeSteps">10</strong>' +
            '<span>خطوة</span>' +
          '</div>' +
          '<div class="tour-welcome-stat">' +
            '<strong id="welcomeTime">2</strong>' +
            '<span>دقيقة</span>' +
          '</div>' +
        '</div>' +
        '<div class="tour-welcome-actions">' +
          '<button class="tour-welcome-btn skip" id="welcomeSkip">تخطي</button>' +
          '<button class="tour-welcome-btn start" id="welcomeStart">🚀 ابدأ الجولة</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(welcome);

    // Event Listeners مع فحص الوجود
    const closeBtn = document.getElementById('tourClose');
    const prevBtn = document.getElementById('tourPrev');
    const nextBtn = document.getElementById('tourNext');
    const pauseBtn = document.getElementById('tourPause');
    const welcomeStart = document.getElementById('welcomeStart');
    const welcomeSkip = document.getElementById('welcomeSkip');

    if (closeBtn) closeBtn.addEventListener('click', endTour);
    if (prevBtn) prevBtn.addEventListener('click', prevStep);
    if (nextBtn) nextBtn.addEventListener('click', nextStep);
    if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
    if (welcomeStart) welcomeStart.addEventListener('click', function() {
      const welcomeEl = document.getElementById('tourWelcome');
      if (welcomeEl) welcomeEl.classList.remove('active');
      setTimeout(startTourSteps, 400);
    });
    if (welcomeSkip) welcomeSkip.addEventListener('click', function() {
      const welcomeEl = document.getElementById('tourWelcome');
      if (welcomeEl) welcomeEl.classList.remove('active');
      isActive = false;
    });

    document.addEventListener('keydown', function(e) {
      if (!isActive) return;
      if (e.key === 'Escape') endTour();
      if (e.key === 'ArrowRight') nextStep();
      if (e.key === 'ArrowLeft') prevStep();
      if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePause();
      }
    });
  }

  function startTour(tourId) {
    const tour = ALL_TOURS[tourId];
    if (!tour) {
      console.error('Tour not found:', tourId);
      return;
    }

    steps = tour.steps;
    toolName = tour.name;
    currentStep = 0;
    isPaused = false;
    isActive = true;

    createTourUI();

    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeSteps = document.getElementById('welcomeSteps');
    const welcomeTime = document.getElementById('welcomeTime');
    const welcomeEl = document.getElementById('tourWelcome');

    if (welcomeTitle) welcomeTitle.textContent = '🎓 جولة في ' + toolName;
    if (welcomeSteps) welcomeSteps.textContent = steps.length;
    if (welcomeTime) welcomeTime.textContent = Math.ceil(steps.length * 0.3);
    if (welcomeEl) welcomeEl.classList.add('active');

    const dotsContainer = document.getElementById('tourDots');
    if (dotsContainer) {
      let dotsHtml = '';
      for (let i = 0; i < steps.length; i++) {
        dotsHtml += '<div class="tour-dot" data-step="' + i + '"></div>';
      }
      dotsContainer.innerHTML = dotsHtml;
    }
  }

  function startTourSteps() {
    const overlay = document.getElementById('tourOverlay');
    if (overlay) overlay.classList.add('active');
    showStep(0);
  }

  function showStep(index) {
    if (index < 0 || index >= steps.length) {
      endTour(true);
      return;
    }

    currentStep = index;
    const step = steps[index];

    clearTimeout(autoPlayTimeout);

    if (step.beforeShow) {
      try { step.beforeShow(); } catch (e) { console.warn(e); }
    }

    setTimeout(function() {
      const targetEl = step.target ? document.querySelector(step.target) : null;

      const stepNumEl = document.getElementById('tourStepNum');
      const titleEl = document.getElementById('tourTitle');
      const descEl = document.getElementById('tourDescription');
      const progressFill = document.getElementById('tourProgressFill');
      const prevBtn = document.getElementById('tourPrev');
      const nextBtn = document.getElementById('tourNext');

      if (stepNumEl) stepNumEl.textContent = (index + 1) + ' / ' + steps.length;
      if (titleEl) titleEl.innerHTML = '<span class="tour-icon">' + (step.icon || '🎯') + '</span><span>' + step.title + '</span>';
      if (descEl) descEl.innerHTML = step.description;

      if (progressFill) {
        const progress = ((index + 1) / steps.length) * 100;
        progressFill.style.width = progress + '%';
      }

      const dots = document.querySelectorAll('.tour-dot');
      dots.forEach(function(dot, i) {
        dot.classList.remove('active', 'done');
        if (i < index) dot.classList.add('done');
        if (i === index) dot.classList.add('active');
      });

      if (prevBtn) prevBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
      if (nextBtn) nextBtn.textContent = index === steps.length - 1 ? '✓ إنهاء' : 'التالي →';

      if (targetEl) {
        positionSpotlight(targetEl);
        positionCard(targetEl, step.position || 'auto');

        if (step.showPointer) {
          showPointer(targetEl);
        } else {
          hidePointer();
        }

        try {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        } catch (e) {}

        if (step.action) {
          setTimeout(function() {
            try { step.action(targetEl); } catch (e) { console.warn(e); }
          }, 800);
        }
      } else {
        hideSpotlight();
        centerCard();
        hidePointer();
      }
    }, step.beforeShow ? 300 : 0);
  }

  function positionSpotlight(el) {
    const spotlight = document.getElementById('tourSpotlight');
    if (!spotlight) return;
    const rect = el.getBoundingClientRect();
    const padding = 8;

    spotlight.style.top = (rect.top - padding) + 'px';
    spotlight.style.left = (rect.left - padding) + 'px';
    spotlight.style.width = (rect.width + padding * 2) + 'px';
    spotlight.style.height = (rect.height + padding * 2) + 'px';
    spotlight.classList.add('active', 'pulsing');
  }

  function hideSpotlight() {
    const spotlight = document.getElementById('tourSpotlight');
    if (spotlight) spotlight.classList.remove('active');
  }

  function positionCard(el, position) {
    const card = document.getElementById('tourCard');
    if (!card) return;
    const rect = el.getBoundingClientRect();
    const cardWidth = 360;
    const cardHeight = card.offsetHeight || 250;
    const gap = 20;
    const margin = 20;

    let top, left, finalPos;

    if (position === 'auto') {
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const spaceRight = window.innerWidth - rect.right;
      const spaceLeft = rect.left;

      if (spaceBelow > cardHeight + gap) position = 'bottom';
      else if (spaceAbove > cardHeight + gap) position = 'top';
      else if (spaceRight > cardWidth + gap) position = 'left';
      else if (spaceLeft > cardWidth + gap) position = 'right';
      else position = 'bottom';
    }

    finalPos = position;

    if (position === 'bottom') {
      top = rect.bottom + gap;
      left = rect.left + (rect.width / 2) - (cardWidth / 2);
    } else if (position === 'top') {
      top = rect.top - cardHeight - gap;
      left = rect.left + (rect.width / 2) - (cardWidth / 2);
    } else if (position === 'left') {
      top = rect.top + (rect.height / 2) - (cardHeight / 2);
      left = rect.left - cardWidth - gap;
    } else if (position === 'right') {
      top = rect.top + (rect.height / 2) - (cardHeight / 2);
      left = rect.right + gap;
    }

    if (left < margin) left = margin;
    if (left + cardWidth > window.innerWidth - margin) left = window.innerWidth - cardWidth - margin;
    if (top < margin) top = margin;
    if (top + cardHeight > window.innerHeight - margin) top = window.innerHeight - cardHeight - margin;

    card.style.top = top + 'px';
    card.style.left = left + 'px';
    card.style.transform = '';
    card.setAttribute('data-position', finalPos);
    card.classList.add('active');
  }

  function centerCard() {
    const card = document.getElementById('tourCard');
    if (!card) return;
    card.style.top = '50%';
    card.style.left = '50%';
    card.style.transform = 'translate(-50%, -50%)';
    card.removeAttribute('data-position');
    card.classList.add('active');
  }

  function showPointer(el) {
    const pointer = document.getElementById('tourPointer');
    if (!pointer) return;
    const rect = el.getBoundingClientRect();
    pointer.style.top = (rect.top + rect.height / 2 - 20) + 'px';
    pointer.style.left = (rect.left + rect.width / 2 - 20) + 'px';
    pointer.classList.add('active');
  }

  function hidePointer() {
    const pointer = document.getElementById('tourPointer');
    if (pointer) pointer.classList.remove('active');
  }

  function nextStep() {
    if (currentStep === steps.length - 1) {
      endTour(true);
    } else {
      showStep(currentStep + 1);
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      showStep(currentStep - 1);
    }
  }

  function togglePause() {
    isPaused = !isPaused;
    const btn = document.getElementById('tourPause');
    if (btn) btn.textContent = isPaused ? '▶' : '⏸';
  }

  function endTour(completed) {
    clearTimeout(autoPlayTimeout);
    isActive = false;

    if (completed) {
      const card = document.getElementById('tourCard');
      if (card) {
        card.innerHTML =
          '<div class="tour-complete">' +
            '<div class="tour-complete-icon">🎉</div>' +
            '<div class="tour-title" style="justify-content: center;">' +
              '<span>أحسنت! انتهت الجولة</span>' +
            '</div>' +
            '<div class="tour-description" style="text-align: center;">' +
              'الآن أنت تعرف كل المميزات الرائعة في ' + toolName + '!<br>' +
              'ابدأ في استخدامها واستمتع 🚀' +
            '</div>' +
            '<div style="text-align:center; margin-top:16px;">' +
              '<button class="tour-btn primary" id="tourFinish">✓ بدء الاستخدام</button>' +
            '</div>' +
          '</div>';
        centerCard();
        hideSpotlight();
        hidePointer();

        const finishBtn = document.getElementById('tourFinish');
        if (finishBtn) finishBtn.addEventListener('click', cleanup);
      } else {
        cleanup();
      }
    } else {
      cleanup();
    }
  }

  function cleanup() {
    const ids = ['tourOverlay', 'tourCard', 'tourWelcome', 'tourSpotlight', 'tourPointer'];
    ids.forEach(function(id) {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });

    setTimeout(function() {
      ids.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
    }, 500);
  }

  // ═══════════════════════════════════════════════
  //   تشغيل تلقائي عند فتح أي أداة فيها زر
  // ═══════════════════════════════════════════════
  function init() {
    // ابحث عن زر الجولة في الصفحة (data-tour="اسم الأداة")
    const tourBtn = document.querySelector('[data-tour]');

    if (tourBtn) {
      const tourId = tourBtn.getAttribute('data-tour');

      // أضف الستايل للزر
      tourBtn.classList.add('tour-trigger');
      // ✅ في حالة كان الزر فارغاً، أضف علامة "!" بداخله
      if (!tourBtn.textContent.trim()) {
        tourBtn.innerHTML = '!';
      }
      tourBtn.title = '🎓 جولة تفاعلية لشرح الأداة';

      tourBtn.addEventListener('click', function() {
        startTour(tourId);
      });

      console.log('✅ Tour button ready for:', tourId);
    }
  }

  // API عام
  window.LifeHubTour = {
    start: startTour,
    end: endTour
  };

  // تشغيل تلقائي
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('✅ Tour System loaded (improved version)');
})();