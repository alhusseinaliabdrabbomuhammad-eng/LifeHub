/* ═══════════════════════════════════════════════
   Quick Notes - السكريبت
═══════════════════════════════════════════════ */

// ─── الثيم ─────────────
const savedTheme = localStorage.getItem('lifehub-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// ─── متغيرات ─────────────
let notes = JSON.parse(localStorage.getItem('lifehub-notes') || '[]');
let currentNoteId = null;
let currentFilter = 'all';
let currentCategory = 'all';
let searchQuery = '';
let saveTimeout = null;

// ─── الفئات ─────────────
const CATEGORIES = {
  personal: { name: 'شخصي', icon: '🌸', color: '#ec4899' },
  work: { name: 'عمل', icon: '💼', color: '#3b82f6' },
  ideas: { name: 'أفكار', icon: '💡', color: '#f59e0b' },
  todos: { name: 'مهام', icon: '✅', color: '#10b981' },
  other: { name: 'أخرى', icon: '📌', color: '#8b5cf6' }
};

// ─── عناصر الصفحة ─────────────
const notesList = document.getElementById('notesList');
const welcomeScreen = document.getElementById('welcomeScreen');
const noteEditor = document.getElementById('noteEditor');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const noteCategory = document.getElementById('noteCategory');
const previewPane = document.getElementById('previewPane');
const editorContent = document.getElementById('editorContent');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const saveStatus = document.getElementById('saveStatus');
const wordCount = document.getElementById('wordCount');
const charCount = document.getElementById('charCount');

// ═══════════════════════════════════════════════
//   إدارة البيانات
// ═══════════════════════════════════════════════

function saveNotes() {
  localStorage.setItem('lifehub-notes', JSON.stringify(notes));
  updateCounts();
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function createNote() {
  const newNote = {
    id: generateId(),
    title: '',
    content: '',
    category: 'personal',
    pinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  notes.unshift(newNote);
  saveNotes();
  openNote(newNote.id);
  renderNotesList();
  setTimeout(function() {
    noteTitle.focus();
  }, 100);
}

function deleteNote(id) {
  if (!confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) return;
  notes = notes.filter(function(n) { return n.id !== id; });
  saveNotes();
  if (currentNoteId === id) {
    closeNote();
  }
  renderNotesList();
}

function openNote(id) {
  const note = notes.find(function(n) { return n.id === id; });
  if (!note) return;

  currentNoteId = id;

  welcomeScreen.classList.add('hidden');
  noteEditor.classList.remove('hidden');

  noteTitle.value = note.title;
  noteContent.value = note.content;
  noteCategory.value = note.category;

  updatePinButton();
  renderPreview();
  updateStats();
  renderNotesList();
}

function closeNote() {
  currentNoteId = null;
  welcomeScreen.classList.remove('hidden');
  noteEditor.classList.add('hidden');
}

function getCurrentNote() {
  return notes.find(function(n) { return n.id === currentNoteId; });
}

// ═══════════════════════════════════════════════
//   الحفظ التلقائي
// ═══════════════════════════════════════════════

function autoSave() {
  const note = getCurrentNote();
  if (!note) return;

  saveStatus.textContent = '⏳ جاري الحفظ...';
  saveStatus.classList.add('saving');

  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(function() {
    note.title = noteTitle.value;
    note.content = noteContent.value;
    note.category = noteCategory.value;
    note.updatedAt = Date.now();
    saveNotes();

    saveStatus.textContent = '💾 محفوظ';
    saveStatus.classList.remove('saving');

    renderNotesList();
  }, 500);
}

// ═══════════════════════════════════════════════
//   عرض الملاحظات
// ═══════════════════════════════════════════════

function getFilteredNotes() {
  let filtered = notes.slice();

  // فلتر التثبيت
  if (currentFilter === 'pinned') {
    filtered = filtered.filter(function(n) { return n.pinned; });
  }

  // فلتر الفئة
  if (currentCategory !== 'all') {
    filtered = filtered.filter(function(n) { return n.category === currentCategory; });
  }

  // البحث
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(function(n) {
      return n.title.toLowerCase().includes(q) ||
             n.content.toLowerCase().includes(q);
    });
  }

  // ترتيب: المثبتة أولاً، ثم حسب التاريخ
  filtered.sort(function(a, b) {
    if (a.pinned !== b.pinned) return b.pinned - a.pinned;
    return b.updatedAt - a.updatedAt;
  });

  return filtered;
}

function renderNotesList() {
  const filtered = getFilteredNotes();

  if (filtered.length === 0) {
    let message = 'لا توجد ملاحظات';
    if (searchQuery) message = 'لا توجد نتائج لـ "' + searchQuery + '"';
    else if (currentFilter === 'pinned') message = 'لا توجد ملاحظات مثبتة';
    else if (currentCategory !== 'all') message = 'لا توجد ملاحظات في هذه الفئة';

    notesList.innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-icon">📭</div>' +
        '<p>' + message + '</p>' +
        (notes.length === 0 ? '<button class="empty-btn" id="emptyNewBtn">+ أنشئ أول ملاحظة</button>' : '') +
      '</div>';

    const btn = document.getElementById('emptyNewBtn');
    if (btn) btn.addEventListener('click', createNote);
    return;
  }

  let html = '';
  filtered.forEach(function(note) {
    const cat = CATEGORIES[note.category] || CATEGORIES.other;
    const date = formatDate(note.updatedAt);
    const preview = stripMarkdown(note.content).substring(0, 100) || 'لا يوجد محتوى...';
    const title = note.title || 'بدون عنوان';
    const isActive = note.id === currentNoteId ? 'active' : '';

    html +=
      '<div class="note-item ' + isActive + '" data-id="' + note.id + '">' +
        '<div class="note-item-header">' +
          '<div class="note-item-title">' + escapeHTML(title) + '</div>' +
          (note.pinned ? '<span class="note-item-pin">📌</span>' : '') +
        '</div>' +
        '<div class="note-item-preview">' + escapeHTML(preview) + '</div>' +
        '<div class="note-item-footer">' +
          '<span class="note-item-category">' +
            '<span class="cat-dot" style="background:' + cat.color + '"></span>' +
            cat.icon + ' ' + cat.name +
          '</span>' +
          '<span class="note-item-date">' + date + '</span>' +
        '</div>' +
      '</div>';
  });

  notesList.innerHTML = html;

  // ربط الأحداث
  document.querySelectorAll('.note-item').forEach(function(item) {
    item.addEventListener('click', function() {
      openNote(item.dataset.id);
    });
  });
}

function updateCounts() {
  document.getElementById('countAll').textContent = notes.length;
  document.getElementById('countPinned').textContent = notes.filter(function(n) { return n.pinned; }).length;
}

// ═══════════════════════════════════════════════
//   Markdown Parser (بسيط)
// ═══════════════════════════════════════════════

function parseMarkdown(text) {
  if (!text) return '';

  let html = escapeHTML(text);

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

  // Code (inline)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Horizontal line
  html = html.replace(/^---$/gm, '<hr>');

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Task lists
  html = html.replace(/^- \[x\] (.+)$/gm, '<div><input type="checkbox" class="task-checkbox" checked disabled> <span class="task-done">$1</span></div>');
  html = html.replace(/^- \[ \] (.+)$/gm, '<div><input type="checkbox" class="task-checkbox" disabled> <span>$1</span></div>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.+<\/li>\n?)+/g, function(match) {
    return '<ul>' + match + '</ul>';
  });

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<oli>$1</oli>');
  html = html.replace(/(<oli>.+<\/oli>\n?)+/g, function(match) {
    return '<ol>' + match.replace(/<oli>/g, '<li>').replace(/<\/oli>/g, '</li>') + '</ol>';
  });

  // Paragraphs
  const lines = html.split('\n');
  const result = [];
  let inBlock = false;

  lines.forEach(function(line) {
    const trimmed = line.trim();
    if (!trimmed) {
      result.push('');
      return;
    }

    const isBlock = trimmed.startsWith('<h') ||
                    trimmed.startsWith('<ul') ||
                    trimmed.startsWith('<ol') ||
                    trimmed.startsWith('<pre') ||
                    trimmed.startsWith('<blockquote') ||
                    trimmed.startsWith('<hr') ||
                    trimmed.startsWith('<div') ||
                    trimmed.startsWith('<li') ||
                    trimmed.startsWith('</');

    if (isBlock) {
      result.push(line);
    } else {
      result.push('<p>' + line + '</p>');
    }
  });

  return result.join('\n');
}

function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/[#*`>\-]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();
}

function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderPreview() {
  const text = noteContent.value;
  if (!text.trim()) {
    previewPane.innerHTML = '<div class="preview-empty">المعاينة ستظهر هنا...</div>';
    return;
  }
  previewPane.innerHTML = parseMarkdown(text);
}

// ═══════════════════════════════════════════════
//   تنسيق التاريخ
// ═══════════════════════════════════════════════

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const day = 86400000;

  if (diff < 60000) return 'الآن';
  if (diff < 3600000) return Math.floor(diff / 60000) + ' د';
  if (diff < day) return Math.floor(diff / 3600000) + ' س';
  if (diff < 7 * day) return Math.floor(diff / day) + ' يوم';

  return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
}

// ═══════════════════════════════════════════════
//   إحصائيات
// ═══════════════════════════════════════════════

function updateStats() {
  const text = noteContent.value;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  wordCount.textContent = words + ' كلمة';
  charCount.textContent = chars + ' حرف';
}

// ═══════════════════════════════════════════════
//   التثبيت
// ═══════════════════════════════════════════════

function togglePin() {
  const note = getCurrentNote();
  if (!note) return;
  note.pinned = !note.pinned;
  saveNotes();
  updatePinButton();
  renderNotesList();
}

function updatePinButton() {
  const note = getCurrentNote();
  const pinBtn = document.getElementById('pinBtn');
  if (!note) return;
  if (note.pinned) {
    pinBtn.classList.add('pinned');
    pinBtn.title = 'إلغاء التثبيت';
  } else {
    pinBtn.classList.remove('pinned');
    pinBtn.title = 'تثبيت';
  }
}

// ═══════════════════════════════════════════════
//   Markdown Shortcuts
// ═══════════════════════════════════════════════

function insertMarkdown(type) {
  const textarea = noteContent;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);
  const before = textarea.value.substring(0, start);
  const after = textarea.value.substring(end);

  let insert = '';
  let cursorOffset = 0;

  switch (type) {
    case 'bold':
      insert = '**' + (selected || 'نص عريض') + '**';
      cursorOffset = selected ? 0 : -2;
      break;
    case 'italic':
      insert = '*' + (selected || 'نص مائل') + '*';
      cursorOffset = selected ? 0 : -1;
      break;
    case 'heading':
      insert = (before.endsWith('\n') || start === 0 ? '' : '\n') + '## ' + (selected || 'عنوان');
      break;
    case 'list':
      insert = (before.endsWith('\n') || start === 0 ? '' : '\n') + '- ' + (selected || 'عنصر');
      break;
    case 'numbered':
      insert = (before.endsWith('\n') || start === 0 ? '' : '\n') + '1. ' + (selected || 'عنصر');
      break;
    case 'check':
      insert = (before.endsWith('\n') || start === 0 ? '' : '\n') + '- [ ] ' + (selected || 'مهمة');
      break;
    case 'quote':
      insert = (before.endsWith('\n') || start === 0 ? '' : '\n') + '> ' + (selected || 'اقتباس');
      break;
    case 'code':
      insert = selected.includes('\n') ?
        '```\n' + (selected || 'كود') + '\n```' :
        '`' + (selected || 'كود') + '`';
      break;
    case 'link':
      insert = '[' + (selected || 'نص الرابط') + '](https://)';
      cursorOffset = -1;
      break;
    case 'line':
      insert = (before.endsWith('\n') || start === 0 ? '' : '\n') + '\n---\n';
      break;
  }

  textarea.value = before + insert + after;
  const newPos = start + insert.length + cursorOffset;
  textarea.setSelectionRange(newPos, newPos);
  textarea.focus();

  renderPreview();
  autoSave();
}

// ═══════════════════════════════════════════════
//   النسخ
// ═══════════════════════════════════════════════

function copyNote() {
  const note = getCurrentNote();
  if (!note || !note.content) {
    saveStatus.textContent = '⚠️ لا يوجد محتوى';
    return;
  }

  const text = (note.title ? '# ' + note.title + '\n\n' : '') + note.content;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() {
      saveStatus.textContent = '📋 تم النسخ!';
      setTimeout(function() {
        saveStatus.textContent = '💾 محفوظ';
      }, 2000);
    });
  }
}

// ═══════════════════════════════════════════════
//   التصدير
// ═══════════════════════════════════════════════

function exportAllNotes() {
  if (notes.length === 0) {
    alert('لا توجد ملاحظات للتصدير');
    return;
  }

  let content = '# كل ملاحظاتي - LifeHub\n\n';
  content += '_تم التصدير في ' + new Date().toLocaleString('ar-EG') + '_\n\n';
  content += '---\n\n';

  notes.forEach(function(note, i) {
    const cat = CATEGORIES[note.category] || CATEGORIES.other;
    content += '## ' + (i + 1) + '. ' + (note.title || 'بدون عنوان') + '\n\n';
    content += '**الفئة:** ' + cat.icon + ' ' + cat.name + '\n';
    if (note.pinned) content += '**📌 مثبّتة**\n';
    content += '**التاريخ:** ' + new Date(note.updatedAt).toLocaleString('ar-EG') + '\n\n';
    content += note.content + '\n\n';
    content += '---\n\n';
  });

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lifehub-notes-' + new Date().toISOString().split('T')[0] + '.md';
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════
//   Event Listeners
// ═══════════════════════════════════════════════

// ─── إنشاء ملاحظة ─────
document.getElementById('newNoteBtn').addEventListener('click', createNote);
document.getElementById('welcomeNewBtn').addEventListener('click', createNote);

// ─── تصدير ─────
document.getElementById('exportBtn').addEventListener('click', exportAllNotes);

// ─── التعديل ─────
noteTitle.addEventListener('input', autoSave);
noteContent.addEventListener('input', function() {
  renderPreview();
  updateStats();
  autoSave();
});
noteCategory.addEventListener('change', autoSave);

// ─── الأزرار ─────
document.getElementById('pinBtn').addEventListener('click', togglePin);
document.getElementById('copyBtn').addEventListener('click', copyNote);
document.getElementById('deleteBtn').addEventListener('click', function() {
  if (currentNoteId) deleteNote(currentNoteId);
});

// ─── البحث ─────
searchInput.addEventListener('input', function() {
  searchQuery = searchInput.value.trim();
  if (searchQuery) {
    clearSearchBtn.classList.remove('hidden');
  } else {
    clearSearchBtn.classList.add('hidden');
  }
  renderNotesList();
});

clearSearchBtn.addEventListener('click', function() {
  searchInput.value = '';
  searchQuery = '';
  clearSearchBtn.classList.add('hidden');
  renderNotesList();
});

// ─── الفلاتر ─────
document.querySelectorAll('.filter-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderNotesList();
  });
});

// ─── الفئات ─────
document.querySelectorAll('.category-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.category-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentCategory = btn.dataset.category;
    renderNotesList();
  });
});

// ─── أوضاع العرض ─────
document.querySelectorAll('.mode-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.mode-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');

    const mode = btn.dataset.mode;
    editorContent.classList.remove('edit-only', 'preview-only');

    if (mode === 'edit') editorContent.classList.add('edit-only');
    else if (mode === 'preview') editorContent.classList.add('preview-only');
  });
});

// ─── أزرار Markdown ─────
document.querySelectorAll('.md-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    insertMarkdown(btn.dataset.md);
  });
});

// ─── اختصارات لوحة المفاتيح ─────
document.addEventListener('keydown', function(e) {
  // Ctrl+N = ملاحظة جديدة
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    createNote();
  }

  // داخل المحرر فقط
  if (document.activeElement === noteContent) {
    // Ctrl+B = عريض
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      insertMarkdown('bold');
    }
    // Ctrl+I = مائل
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      insertMarkdown('italic');
    }
    // Ctrl+K = رابط
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      insertMarkdown('link');
    }

    // Tab = إضافة مسافات
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = noteContent.selectionStart;
      const end = noteContent.selectionEnd;
      noteContent.value = noteContent.value.substring(0, start) + '  ' + noteContent.value.substring(end);
      noteContent.setSelectionRange(start + 2, start + 2);
      autoSave();
    }
  }
});

// ─── التهيئة ─────
updateCounts();
renderNotesList();

console.log('✅ Quick Notes جاهز!');