/* ═══════════════════════════════════════════════
   Color Picker - السكريبت (نسخة سليمة)
═══════════════════════════════════════════════ */

// ─── الثيم ─────────────
const savedTheme = localStorage.getItem('lifehub-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// ─── عناصر الصفحة ─────────────
const statusMessage = document.getElementById('statusMessage');
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
const savedSection = document.getElementById('savedSection');
const savedBtn = document.getElementById('savedBtn');
const savedBadge = document.getElementById('savedBadge');

// ─── متغيرات ─────────────
let currentImage = null;
let currentColor = null;
let savedColors = JSON.parse(localStorage.getItem('lifehub-saved-colors') || '[]');
let savedPalettes = JSON.parse(localStorage.getItem('lifehub-saved-palettes') || '[]');
let currentPalette = [];

// ─── شريط الحالة ─────────────
function setStatus(msg) {
  statusMessage.textContent = msg;
}

// ─── تحديث الـ Badge ─────────────
function updateBadge() {
  const total = savedColors.length + savedPalettes.length;
  savedBadge.textContent = total;
}
updateBadge();

// ═══════════════════════════════════════════════
//   التبويبات
// ═══════════════════════════════════════════════
tabs.forEach(function(tab) {
  tab.addEventListener('click', function() {
    const tabName = tab.dataset.tab;

    tabs.forEach(function(t) { t.classList.remove('active'); });
    tab.classList.add('active');

    panels.forEach(function(p) { p.classList.remove('active'); });
    document.getElementById(tabName + 'Panel').classList.add('active');

    savedSection.classList.add('hidden');
  });
});

// ─── زر المحفوظات ─────────────
savedBtn.addEventListener('click', function() {
  panels.forEach(function(p) { p.classList.remove('active'); });
  savedSection.classList.toggle('hidden');
  renderSaved();
});

// ═══════════════════════════════════════════════
//   تحويلات الألوان
// ═══════════════════════════════════════════════

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(function(x) {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  h /= 360;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = function(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

// ═══════════════════════════════════════════════
//   رفع الصورة
// ═══════════════════════════════════════════════
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const imageWorkspace = document.getElementById('imageWorkspace');
const imageCanvas = document.getElementById('imageCanvas');
const changeImageBtn = document.getElementById('changeImageBtn');
const ctx = imageCanvas.getContext('2d', { willReadFrequently: true });

fileInput.addEventListener('change', function(e) {
  if (e.target.files[0]) {
    loadImage(e.target.files[0]);
  }
});

// السحب والإفلات
const uploadLabel = document.querySelector('.upload-label');

uploadLabel.addEventListener('dragover', function(e) {
  e.preventDefault();
  uploadLabel.classList.add('dragover');
});

uploadLabel.addEventListener('dragleave', function() {
  uploadLabel.classList.remove('dragover');
});

uploadLabel.addEventListener('drop', function(e) {
  e.preventDefault();
  uploadLabel.classList.remove('dragover');
  if (e.dataTransfer.files[0]) {
    loadImage(e.dataTransfer.files[0]);
  }
});

function loadImage(file) {
  if (!file.type.startsWith('image/')) {
    setStatus('⚠️ الملف ليس صورة');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    setStatus('⚠️ حجم الصورة كبير (أقصى 10MB)');
    return;
  }

  setStatus('⏳ جاري تحميل الصورة...');

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      // تعديل حجم الـ Canvas حسب الصورة
      const maxWidth = 800;
      const maxHeight = 500;
      let { width, height } = img;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }

      imageCanvas.width = width;
      imageCanvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      currentImage = img;

      // إظهار الـ Workspace
      uploadArea.classList.add('hidden');
      imageWorkspace.classList.remove('hidden');

      // استخراج الألوان السائدة
      extractDominantColors();

      setStatus('✅ تم تحميل الصورة - اضغط على أي مكان لأخذ اللون');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

changeImageBtn.addEventListener('click', function() {
  uploadArea.classList.remove('hidden');
  imageWorkspace.classList.add('hidden');
  document.getElementById('pickedColorBox').classList.add('hidden');
  document.getElementById('paletteSection').classList.add('hidden');
  fileInput.value = '';
});

// ═══════════════════════════════════════════════
//   اختيار اللون من الصورة
// ═══════════════════════════════════════════════
imageCanvas.addEventListener('click', function(e) {
  const rect = imageCanvas.getBoundingClientRect();
  const scaleX = imageCanvas.width / rect.width;
  const scaleY = imageCanvas.height / rect.height;
  const x = Math.floor((e.clientX - rect.left) * scaleX);
  const y = Math.floor((e.clientY - rect.top) * scaleY);

  try {
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];

    showPickedColor(r, g, b);
  } catch (err) {
    setStatus('⚠️ لا يمكن استخراج اللون');
  }
});

function showPickedColor(r, g, b) {
  const hex = rgbToHex(r, g, b);
  const hsl = rgbToHsl(r, g, b);

  currentColor = { r: r, g: g, b: b, hex: hex };

  document.getElementById('pickedColorBox').classList.remove('hidden');
  document.getElementById('colorPreview').style.background = hex;
  document.getElementById('hexValue').textContent = hex;
  document.getElementById('rgbValue').textContent = 'rgb(' + r + ', ' + g + ', ' + b + ')';
  document.getElementById('hslValue').textContent = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)';

  setStatus('🎨 تم اختيار اللون: ' + hex);
}

// ═══════════════════════════════════════════════
//   استخراج الألوان السائدة
// ═══════════════════════════════════════════════
function extractDominantColors() {
  if (!currentImage) return;

  const imageData = ctx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
  const data = imageData.data;
  const colorMap = {};

  // عينة كل 10 بكسلات لتقليل الحسابات
  for (let i = 0; i < data.length; i += 40) {
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const key = r + ',' + g + ',' + b;
    colorMap[key] = (colorMap[key] || 0) + 1;
  }

  // ترتيب وأخذ أعلى 5 ألوان
  const sorted = Object.entries(colorMap).sort(function(a, b) { return b[1] - a[1]; });
  const top5 = sorted.slice(0, 5).map(function(item) {
    const [r, g, b] = item[0].split(',').map(Number);
    return { r: r, g: g, b: b, hex: rgbToHex(r, g, b) };
  });

  currentPalette = top5;

  // عرض الألوان
  const paletteGrid = document.getElementById('paletteGrid');
  paletteGrid.innerHTML = '';

  top5.forEach(function(color) {
    const div = document.createElement('div');
    div.className = 'palette-color';
    div.style.background = color.hex;

    const code = document.createElement('span');
    code.className = 'palette-color-code';
    code.textContent = color.hex;
    div.appendChild(code);

    div.addEventListener('click', function() {
      showPickedColor(color.r, color.g, color.b);
    });

    paletteGrid.appendChild(div);
  });

  document.getElementById('paletteSection').classList.remove('hidden');
}

// ═══════════════════════════════════════════════
//   النسخ
// ═══════════════════════════════════════════════
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('copy-mini')) {
    const target = e.target.dataset.target;
    const source = e.target.dataset.source;

    let text = '';
    if (target) {
      text = document.getElementById(target).textContent;
    } else if (source) {
      text = document.getElementById(source).value;
    }

    if (text && text !== '—') {
      copyText(text, e.target);
    }
  }
});

function copyText(text, btn) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      btnSuccess(btn);
    }).catch(function() {
      fallbackCopy(text, btn);
    });
  } else {
    fallbackCopy(text, btn);
  }
}

function fallbackCopy(text, btn) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    btnSuccess(btn);
  } catch (err) {
    setStatus('❌ فشل النسخ');
  }
  document.body.removeChild(textarea);
}

function btnSuccess(btn) {
  if (btn) {
    const originalText = btn.textContent;
    btn.textContent = '✅';
    btn.classList.add('copy-success-anim');
    setTimeout(function() {
      btn.textContent = originalText;
      btn.classList.remove('copy-success-anim');
    }, 1500);
  }
  setStatus('📋 تم النسخ!');
}

// ═══════════════════════════════════════════════
//   حفظ الألوان
// ═══════════════════════════════════════════════
document.getElementById('saveColorBtn').addEventListener('click', function() {
  if (!currentColor) return;
  saveColor(currentColor.hex);
});

document.getElementById('savePaletteBtn').addEventListener('click', function() {
  if (currentPalette.length === 0) return;
  savePalette(currentPalette.map(function(c) { return c.hex; }));
});

function saveColor(hex) {
  if (savedColors.indexOf(hex) === -1) {
    savedColors.unshift(hex);
    if (savedColors.length > 50) savedColors.pop();
    localStorage.setItem('lifehub-saved-colors', JSON.stringify(savedColors));
    updateBadge();
    setStatus('💾 تم حفظ اللون: ' + hex);
  } else {
    setStatus('⚠️ اللون محفوظ بالفعل');
  }
}

function savePalette(colors) {
  savedPalettes.unshift({
    colors: colors,
    date: new Date().toLocaleDateString('ar-EG')
  });
  if (savedPalettes.length > 20) savedPalettes.pop();
  localStorage.setItem('lifehub-saved-palettes', JSON.stringify(savedPalettes));
  updateBadge();
  setStatus('💾 تم حفظ الـ Palette');
}

// ═══════════════════════════════════════════════
//   عرض المحفوظات
// ═══════════════════════════════════════════════
const savedTabs = document.querySelectorAll('.saved-tab');
const savedColorsContent = document.getElementById('savedColors');
const savedPalettesContent = document.getElementById('savedPalettes');

savedTabs.forEach(function(tab) {
  tab.addEventListener('click', function() {
    savedTabs.forEach(function(t) { t.classList.remove('active'); });
    tab.classList.add('active');

    const target = tab.dataset.saved;
    if (target === 'colors') {
      savedColorsContent.classList.remove('hidden');
      savedPalettesContent.classList.add('hidden');
    } else {
      savedPalettesContent.classList.remove('hidden');
      savedColorsContent.classList.add('hidden');
    }
  });
});

function renderSaved() {
  // الألوان
  if (savedColors.length === 0) {
    savedColorsContent.innerHTML = '<div class="empty-state"><div class="empty-icon">🎨</div><p>لا توجد ألوان محفوظة بعد</p></div>';
  } else {
    let html = '<div class="saved-colors-grid">';
    savedColors.forEach(function(hex, i) {
      html += '<div class="saved-color-card">';
      html += '<div class="saved-color-swatch" style="background:' + hex + '" onclick="navigator.clipboard.writeText(\'' + hex + '\')"></div>';
      html += '<div class="saved-color-info">';
      html += '<span class="saved-color-hex">' + hex + '</span>';
      html += '<button class="delete-saved" onclick="deleteColor(' + i + ')">🗑️</button>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    savedColorsContent.innerHTML = html;
  }

  // الـ Palettes
  if (savedPalettes.length === 0) {
    savedPalettesContent.innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><p>لا توجد Palettes محفوظة بعد</p></div>';
  } else {
    let html = '';
    savedPalettes.forEach(function(palette, i) {
      html += '<div class="saved-palette-card">';
      html += '<div class="saved-palette-colors">';
      palette.colors.forEach(function(color) {
        html += '<div style="background:' + color + '" title="' + color + '" onclick="navigator.clipboard.writeText(\'' + color + '\')"></div>';
      });
      html += '</div>';
      html += '<div class="saved-palette-footer">';
      html += '<span>' + palette.date + '</span>';
      html += '<button class="delete-saved" onclick="deletePalette(' + i + ')">🗑️ حذف</button>';
      html += '</div>';
      html += '</div>';
    });
    savedPalettesContent.innerHTML = html;
  }
}

window.deleteColor = function(index) {
  savedColors.splice(index, 1);
  localStorage.setItem('lifehub-saved-colors', JSON.stringify(savedColors));
  updateBadge();
  renderSaved();
  setStatus('🗑️ تم حذف اللون');
};

window.deletePalette = function(index) {
  savedPalettes.splice(index, 1);
  localStorage.setItem('lifehub-saved-palettes', JSON.stringify(savedPalettes));
  updateBadge();
  renderSaved();
  setStatus('🗑️ تم حذف الـ Palette');
};

document.getElementById('clearSavedBtn').addEventListener('click', function() {
  if (confirm('هل أنت متأكد من مسح كل المحفوظات؟')) {
    savedColors = [];
    savedPalettes = [];
    localStorage.removeItem('lifehub-saved-colors');
    localStorage.removeItem('lifehub-saved-palettes');
    updateBadge();
    renderSaved();
    setStatus('🗑️ تم مسح كل المحفوظات');
  }
});

// ═══════════════════════════════════════════════
//   التبويب اليدوي
// ═══════════════════════════════════════════════
const colorInput = document.getElementById('colorInput');
const manualPreview = document.getElementById('manualPreview');
const hexManual = document.getElementById('hexManual');
const rgbManual = document.getElementById('rgbManual');
const hslManual = document.getElementById('hslManual');
const previewCard = document.getElementById('previewCard');

function updateManualColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  manualPreview.style.background = hex;
  hexManual.value = hex.toUpperCase();
  rgbManual.value = 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
  hslManual.value = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)';

  previewCard.style.setProperty('--preview-color', hex);
}

colorInput.addEventListener('input', function() {
  updateManualColor(colorInput.value);
});

hexManual.addEventListener('input', function() {
  let val = hexManual.value.trim();
  if (!val.startsWith('#')) val = '#' + val;
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    colorInput.value = val;
    updateManualColor(val);
  }
});

document.getElementById('saveManualBtn').addEventListener('click', function() {
  saveColor(hexManual.value);
});

// تهيئة اللون اليدوي
updateManualColor('#6366f1');

// ═══════════════════════════════════════════════
//   المولد الذكي
// ═══════════════════════════════════════════════
const baseColor = document.getElementById('baseColor');
const schemeButtons = document.querySelectorAll('.scheme-btn');
const generatedPalette = document.getElementById('generatedPalette');
let currentScheme = 'complementary';
let generatedColors = [];

function generatePalette() {
  const rgb = hexToRgb(baseColor.value);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  let colors = [hsl];

  switch (currentScheme) {
    case 'complementary':
      colors.push({ h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l });
      colors.push({ h: (hsl.h + 180) % 360, s: hsl.s, l: Math.min(hsl.l + 20, 90) });
      colors.push({ h: hsl.h, s: hsl.s, l: Math.min(hsl.l + 20, 90) });
      break;

    case 'analogous':
      colors.push({ h: (hsl.h + 30) % 360, s: hsl.s, l: hsl.l });
      colors.push({ h: (hsl.h - 30 + 360) % 360, s: hsl.s, l: hsl.l });
      colors.push({ h: (hsl.h + 60) % 360, s: hsl.s, l: hsl.l });
      colors.push({ h: (hsl.h - 60 + 360) % 360, s: hsl.s, l: hsl.l });
      break;

    case 'triadic':
      colors.push({ h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l });
      colors.push({ h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l });
      break;

    case 'tetradic':
      colors.push({ h: (hsl.h + 90) % 360, s: hsl.s, l: hsl.l });
      colors.push({ h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l });
      colors.push({ h: (hsl.h + 270) % 360, s: hsl.s, l: hsl.l });
      break;

    case 'monochromatic':
      colors = [
        { h: hsl.h, s: hsl.s, l: Math.max(hsl.l - 30, 10) },
        { h: hsl.h, s: hsl.s, l: Math.max(hsl.l - 15, 20) },
        hsl,
        { h: hsl.h, s: hsl.s, l: Math.min(hsl.l + 15, 80) },
        { h: hsl.h, s: hsl.s, l: Math.min(hsl.l + 30, 90) }
      ];
      break;
  }

  generatedColors = colors.map(function(c) {
    const rgb = hslToRgb(c.h, c.s, c.l);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  });

  // العرض
  generatedPalette.innerHTML = '';
  generatedColors.forEach(function(hex) {
    const div = document.createElement('div');
    div.className = 'generated-color';
    div.style.background = hex;

    const code = document.createElement('span');
    code.className = 'generated-color-code';
    code.textContent = hex;
    div.appendChild(code);

    div.addEventListener('click', function() {
      copyText(hex, null);
      setStatus('📋 تم نسخ: ' + hex);
    });

    generatedPalette.appendChild(div);
  });
}

baseColor.addEventListener('input', generatePalette);

schemeButtons.forEach(function(btn) {
  btn.addEventListener('click', function() {
    schemeButtons.forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentScheme = btn.dataset.scheme;
    generatePalette();
  });
});

document.getElementById('saveGeneratedBtn').addEventListener('click', function() {
  if (generatedColors.length > 0) {
    savePalette(generatedColors);
  }
});

// توليد أولي
generatePalette();

console.log('✅ Color Picker جاهز!');