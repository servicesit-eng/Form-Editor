'use strict';

/* ============================================================
   CONFIG
   ============================================================ */
const API_URL = 'https://script.google.com/macros/s/AKfycbwlBmF7UCDh1b-DlGy6uzT_Vot2J0Z02EoLoCRm5XFjtra1nDzCBD-cBHJ_8Yl6hX6oig/exec';

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

const PAGE_W = 210, PAGE_H = 297;
const PX_PER_MM = 96 / 25.4;
const SNAP = 0.5;
const CACHE_TTL = 5 * 60 * 1000;

const PUBLIC_ACTIONS = [
  'getPublicFormTemplates', 'getPublicFormTemplate', 'submitFormAnonymous',
  'lookupSubmissionsByCitizenId', 'getPublicFormSubmission', 'getHeaderLogo',
  'loginWithPassword', 'loginWithCitizenId', 'changeInitialPassword'
];

const TYPE_LABEL = {
  label: 'ข้อความ', title: 'หัวข้อ', logo: 'โลโก้', text_input: 'ช่องข้อความ',
  textarea: 'ข้อความยาว', date: 'วันที่', radio: 'ตัวเลือกเดียว',
  checkbox: 'หลายตัวเลือก', select: 'Dropdown', signature: 'ลายเซ็น',
  checkbox_agree: 'ยอมรับข้อตกลง', divider: 'เส้นคั่น'
};
const INPUT_TYPES = ['text_input', 'textarea', 'date', 'radio', 'checkbox', 'select', 'signature', 'checkbox_agree'];
const OPTION_TYPES = ['radio', 'checkbox', 'select'];
const STATUS_TH = { SUBMITTED: 'รอตรวจสอบ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ไม่อนุมัติ' };

const TOP_VIEWS = [
  'publicFormListView', 'publicFormRendererView', 'submissionSuccessView',
  'publicMySubmissionsView', 'loginView', 'changePasswordView', 'adminDashboardView'
];

/* ============================================================
   STATE
   ============================================================ */
let accessToken = null;
try { accessToken = localStorage.getItem('access_token'); } catch (e) {}

const state = {
  templateId: null,
  meta: { name: '', description: '', is_active: false },
  fields: [], deleted: [], selectedId: null, dirty: false, zoom: 1
};

let undoStack = [], panelFieldId = null, propUndoArmed = false, lastNudgeAt = 0, renderSeq = 0;
let rendererState = { templateId: null, fields: [] };
let viewingSubmissionId = null, viewingSubmissionCitizenId = null, toastTimer = null;
let lastSubmittedId = null, lastSubmittedCitizenId = null;
let adminSelectedTemplateId = null, adminTemplates = [], adminSubmissionsSeq = 0;
let currentFilter = 'ALL', lastAdminSubmissions = [];
let downloadCtx = null, drag = null, staffSearchTimer = null;
let EXPORT_CSS_CACHE = null;

/* ============================================================
   UTILS
   ============================================================ */
function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
function uid() { return Math.random().toString(36).slice(2, 9); }
function newTmpId() { return 'tmp_' + uid() + uid(); }
function isRealId(id) { return !!id && String(id).indexOf('tmp_') !== 0; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function snap(v) { return Math.round(v / SNAP) * SNAP; }
function round2(v) { return Math.round(v * 100) / 100; }
function slugName(v) { return String(v || '').toLowerCase().replace(/[^a-z0-9_]/g, '_'); }
function toHex(v, fb) { return /^#[0-9a-fA-F]{6}$/.test(String(v || '')) ? v : fb; }
function sanitizeFilename(s) {
  return String(s || 'form').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_').slice(0, 80);
}
function formatThaiDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return String(iso || '');
  return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('th-TH', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}
function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4000);
}
function err(e) { return e && e.message ? e.message : 'เกิดข้อผิดพลาด'; }
function isAuthError(e) {
  const m = err(e);
  return m.includes('เข้าสู่ระบบ') || m.includes('เซสชัน') || m.includes('ADMIN');
}
function handleError(e) {
  toast(err(e));
  if (isAuthError(e) && accessToken) {
    accessToken = null;
    try { localStorage.removeItem('access_token'); } catch (x) {}
    updateAuthUI();
  }
}

/* ============================================================
   CACHE
   ============================================================ */
function cacheGet(key) {
  try {
    const raw = localStorage.getItem('cache_' + key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() - obj.ts > CACHE_TTL) {
      localStorage.removeItem('cache_' + key);
      return null;
    }
    return obj.value;
  } catch (e) { return null; }
}
function cacheSet(key, value) {
  try {
    localStorage.setItem('cache_' + key, JSON.stringify({ value: value, ts: Date.now() }));
  } catch (e) {}
}

/* ============================================================
   API
   ============================================================ */
async function apiCall(action, payload = {}) {
  if (!accessToken && PUBLIC_ACTIONS.indexOf(action) === -1) {
    throw new Error('กรุณาเข้าสู่ระบบก่อน');
  }
  const url = new URL(API_URL);
  url.searchParams.set('action', action);
  const body = Object.assign({}, payload);
  if (accessToken) body.token = accessToken;

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
    redirect: 'follow'
  });
  if (!response.ok) throw new Error('HTTP error ' + response.status);
  const result = await response.json();
  if (!result.ok) throw new Error(result.error || 'เกิดข้อผิดพลาด');
  return result.data;
}

/* ============================================================
   VIEW CONTROL
   ============================================================ */
function showView(viewId) {
  TOP_VIEWS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const isActive = (id === viewId);
    el.hidden = !isActive;
    el.classList.toggle('active', isActive);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function closeAllModals() { $$('.modal').forEach(m => { m.hidden = true; }); }
function showLoading() { const el = $('#loadingOverlay'); if (el) el.classList.add('active'); }
function hideLoading() { const el = $('#loadingOverlay'); if (el) el.classList.remove('active'); }

function updateAuthUI() {
  const logged = !!accessToken;
  $('#loginBtn').hidden = logged;
  $('#adminPanelBtn').hidden = !logged;
  $('#sessionBadge').hidden = !logged;
  $('#logoutBtn').hidden = !logged;
}

function showAdminView(viewId) {
  $$('#adminDashboardView > .view').forEach(x => x.classList.remove('active'));
  $$('#adminDashboardView .tab[data-admin-view]').forEach(x => x.classList.remove('active'));
  const el = $('#' + viewId);
  if (el) el.classList.add('active');
  const tab = $('[data-admin-view="' + viewId + '"]');
  if (tab) tab.classList.add('active');
}

/* ============================================================
   EXPORT CSS (สำหรับไฟล์ดาวน์โหลด / หน้าพิมพ์)
   ============================================================ */
const A4_PRINT_CSS = `
@page { size: 210mm 297mm; margin: 0; }
* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
@media screen {
  html, body {
    width: auto !important; height: auto !important; overflow: auto !important;
    margin: 0 !important; min-height: 100vh !important;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%) !important;
  }
  body { padding: 32px 0 56px !important; }
  .sheet-wrap { margin: 0 auto !important; position: relative !important; }
  .a4-canvas {
    width: 210mm !important; height: 297mm !important; margin: 0 !important;
    border: 1px solid #cbd5e1 !important;
    box-shadow: 0 12px 32px rgba(0,0,0,0.18) !important;
    background: #fff !important; overflow: hidden !important;
    transform: scale(var(--fit, 1)) !important; transform-origin: 0 0 !important;
    scale: none !important;
  }
  .dl-bar { position: fixed; top: 14px; right: 14px; display: flex; gap: 8px; z-index: 9999; }
  .dl-bar button {
    border: 0; border-radius: 6px; padding: 9px 16px;
    font-family: 'Noto Sans Thai', 'Sarabun', sans-serif;
    font-size: 13px; font-weight: 600; background: #1e3a5f; color: #fff;
    cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.25);
  }
  .dl-bar button:hover { background: #2c5282; }
}
@media print {
  html, body {
    width: 210mm !important; height: 297mm !important;
    margin: 0 !important; padding: 0 !important;
    background: #fff !important; overflow: hidden !important;
  }
  .sheet-wrap { width: 210mm !important; height: 297mm !important; margin: 0 !important; padding: 0 !important; }
  .a4-canvas {
    width: 210mm !important; height: 297mm !important; margin: 0 !important;
    border: 0 !important; box-shadow: none !important;
    transform: none !important; scale: none !important; overflow: hidden !important;
    page-break-inside: avoid !important; break-inside: avoid !important;
    page-break-after: avoid !important; break-after: avoid !important;
  }
  .dl-bar { display: none !important; }
}
`;

const A4_FIT_SCRIPT = '(function(){var w=document.getElementById("sheetWrap");if(!w)return;' +
  'var c=w.firstElementChild,W=210*96/25.4,H=297*96/25.4;' +
  'function fit(){var s=Math.max(0.2,Math.min(1,(document.documentElement.clientWidth-24)/W));' +
  'w.style.width=(W*s)+"px";w.style.height=(H*s)+"px";c.style.setProperty("--fit",s);}' +
  'fit();window.addEventListener("resize",fit);})();';

const DL_BAR_HTML = '<div class="dl-bar"><button type="button" onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF</button></div>';

async function getExportCss() {
  if (EXPORT_CSS_CACHE) return EXPORT_CSS_CACHE;
  const inline = document.getElementById('exportCss');
  const fallback = inline ? inline.textContent : '';
  try {
    const link = document.getElementById('mainStylesheet');
    if (link && link.href) {
      const res = await fetch(link.href, { cache: 'force-cache' });
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 200) {
          EXPORT_CSS_CACHE = text;
          return text;
        }
      }
    }
  } catch (e) { /* เปิดผ่าน file:// หรือเน็ตหลุด — ใช้ fallback */ }
  EXPORT_CSS_CACHE = fallback;
  return fallback;
}

function buildSheetHtml(fields, data, title, css, autoPrint) {
  const holder = document.createElement('div');
  holder.className = 'a4-canvas';
  const ctx = { mode: 'print', data: data || {}, prefix: 'ex' + (++renderSeq) + '_' };
  (fields || []).map(normalizeField).forEach(f => holder.appendChild(buildFieldElement(f, ctx)));
  return '<!doctype html>\n<html lang="th">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + esc(title || 'แบบฟอร์ม') + '</title>\n' +
    '<style>' + css + '</style>\n' +
    '<style>' + A4_PRINT_CSS + '</style>\n' +
    '</head>\n<body>\n' + DL_BAR_HTML + '\n' +
    '<div class="sheet-wrap" id="sheetWrap">' + holder.outerHTML + '</div>\n' +
    '<script>' + A4_FIT_SCRIPT +
    (autoPrint ? 'window.addEventListener("load",function(){setTimeout(function(){window.print()},600)});' : '') +
    '<\/script>\n</body>\n</html>';
}

async function openPrintWindow(r, titleExtra) {
  const win = window.open('', '_blank');
  if (!win) { toast('เบราว์เซอร์บล็อกหน้าต่างพิมพ์ กรุณาอนุญาต Pop-up'); return null; }
  try {
    win.document.write('<!doctype html><html lang="th"><head><meta charset="utf-8"><title>กำลังเตรียมเอกสาร...</title></head>' +
      '<body style="font-family:sans-serif;padding:28px;color:#374151">กำลังเตรียมเอกสาร A4...</body></html>');
  } catch (e) {}
  const css = await getExportCss();
  const html = buildSheetHtml(r.fields, r.data, titleExtra || 'พิมพ์คำขอ', css, true);
  try {
    win.document.open();
    win.document.write(html);
    win.document.close();
  } catch (e) { toast('ไม่สามารถเปิดหน้าต่างพิมพ์ได้'); }
  return win;
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime || 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

function openDownloadModal(ctx) {
  downloadCtx = ctx;
  $('#downloadModalDesc').textContent = ctx.desc || '';
  $('#downloadModal').hidden = false;
}

$('#closeDownloadBtn').addEventListener('click', () => {
  $('#downloadModal').hidden = true;
  downloadCtx = null;
});

$('#dlHtmlBtn').addEventListener('click', async () => {
  if (!downloadCtx) return;
  const ctx = downloadCtx;
  showLoading();
  try {
    const css = await getExportCss();
    const html = buildSheetHtml(ctx.fields, ctx.data, ctx.title, css, false);
    const filename = ctx.filename + '.html';
    downloadBlob(html, filename, 'text/html;charset=utf-8');
    hideLoading();
    $('#downloadModal').hidden = true;
    toast('ดาวน์โหลดแล้ว: ' + filename);
    downloadCtx = null;
  } catch (x) { hideLoading(); toast(err(x)); }
});

$('#dlPdfBtn').addEventListener('click', () => {
  if (!downloadCtx) return;
  openPrintWindow({ fields: downloadCtx.fields, data: downloadCtx.data || {} }, downloadCtx.title);
  $('#downloadModal').hidden = true;
  toast('เลือก "Save as PDF" ในหน้าต่างพิมพ์');
  downloadCtx = null;
});

$('#downloadFormBtn').addEventListener('click', () => {
  if (!state.templateId) return;
  closeAllModals();
  openDownloadModal({
    fields: state.fields,
    data: {},
    title: (state.meta.name || 'แบบฟอร์ม') + ' (แบบฟอร์มเปล่า)',
    filename: sanitizeFilename(state.meta.name || 'form') + '_blank',
    desc: 'ดาวน์โหลด "' + (state.meta.name || 'แบบฟอร์ม') + '" แบบยังไม่ได้กรอกข้อมูล (ขนาด A4)'
  });
});

/* ============================================================
   HEADER LOGO
   ============================================================ */
function renderHeaderLogo(logo) {
  if (logo) {
    $('#headerLogo').src = logo;
    $('#headerLogo').style.display = 'block';
    $('#headerLogoPlaceholder').style.display = 'none';
    $('#currentHeaderLogo').src = logo;
    $('#currentHeaderLogo').style.display = 'block';
    $('#currentHeaderLogoPlaceholder').style.display = 'none';
    $('#deleteHeaderLogoBtn').hidden = false;
  } else {
    $('#headerLogo').style.display = 'none';
    $('#headerLogoPlaceholder').style.display = 'flex';
    $('#currentHeaderLogo').style.display = 'none';
    $('#currentHeaderLogoPlaceholder').style.display = 'flex';
    $('#deleteHeaderLogoBtn').hidden = true;
  }
}

async function loadHeaderLogo() {
  try {
    const result = await apiCall('getHeaderLogo', {});
    const logo = (result && result.logo) || '';
    cacheSet('headerLogo', logo);
    renderHeaderLogo(logo);
  } catch (e) {}
}

$('#uploadHeaderLogoBtn').addEventListener('click', () => $('#headerLogoFileInput').click());

$('#headerLogoFileInput').addEventListener('change', e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp'];
  if (allowed.indexOf(file.type) === -1) { toast('รูปแบบไฟล์ไม่ถูกต้อง'); e.target.value = ''; return; }
  if (file.size > 50000) { toast('ไฟล์ใหญ่เกินไป (สูงสุด ~37 KB)'); e.target.value = ''; return; }
  const reader = new FileReader();
  reader.onload = async ev => {
    showLoading();
    try {
      await apiCall('uploadHeaderLogo', { base64Data: ev.target.result });
      hideLoading();
      toast('อัปโหลดโลโก้สำเร็จ');
      await loadHeaderLogo();
    } catch (x) { hideLoading(); toast(err(x)); }
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

$('#deleteHeaderLogoBtn').addEventListener('click', async () => {
  if (!confirm('ลบโลโก้ header?')) return;
  showLoading();
  try {
    await apiCall('deleteHeaderLogo', {});
    hideLoading();
    toast('ลบโลโก้แล้ว');
    await loadHeaderLogo();
  } catch (x) { hideLoading(); toast(err(x)); }
});

/* ============================================================
   RENDER ENGINE
   ============================================================ */
function normalizeField(f) {
  const num = (v, d) => { const n = Number(v); return isFinite(n) ? n : d; };
  let options = f.options;
  if (typeof options === 'string') {
    try { options = JSON.parse(options); }
    catch (e) { options = options.split(',').map(s => s.trim()).filter(Boolean); }
  }
  options = Array.isArray(options) ? options.map(String) : [];
  return {
    id: String(f.id),
    field_type: f.field_type || 'text_input',
    label: f.label || '',
    name: f.name || ('field_' + uid()),
    value: f.value || '',
    options: options,
    required: f.required === true,
    pos_x: num(f.pos_x, 10), pos_y: num(f.pos_y, 10),
    width: num(f.width, 50), height: num(f.height, 8),
    font_size: num(f.font_size, 14),
    font_family: f.font_family || 'Sarabun',
    font_weight: f.font_weight || 'normal',
    text_color: f.text_color || '#111111',
    bg_color: f.bg_color || 'transparent',
    border_style: f.border_style || 'none',
    border_color: f.border_color || '#333333',
    text_align: f.text_align || 'left'
  };
}

function getDefaultField(type) {
  const d = {
    label: { label: 'ข้อความ', value: 'ข้อความ', width: 40, height: 7, font_size: 14, border_style: 'none' },
    title: { label: 'หัวข้อ', value: 'หัวข้อฟอร์ม', width: 100, height: 10, font_size: 20, font_weight: 'bold', border_style: 'none', text_align: 'center' },
    logo: { label: 'โลโก้', value: '', width: 25, height: 25, font_size: 14, border_style: 'none', text_align: 'center' },
    text_input: { label: 'กรอกข้อความ', width: 60, height: 8, font_size: 14, border_style: 'dotted' },
    textarea: { label: 'ข้อความยาว', width: 90, height: 24, font_size: 14, border_style: 'dotted' },
    date: { label: 'วันที่', width: 40, height: 8, font_size: 14, border_style: 'dotted' },
    radio: { label: 'ตัวเลือกเดียว', width: 80, height: 8, font_size: 14, border_style: 'none', options: ['ตัวเลือก 1', 'ตัวเลือก 2'] },
    checkbox: { label: 'หลายตัวเลือก', width: 80, height: 8, font_size: 14, border_style: 'none', options: ['ตัวเลือก 1', 'ตัวเลือก 2'] },
    select: { label: 'เลือก', width: 50, height: 8, font_size: 14, border_style: 'dotted', options: ['ตัวเลือก 1', 'ตัวเลือก 2'] },
    signature: { label: 'ลายเซ็น', width: 55, height: 18, font_size: 14, border_style: 'none' },
    checkbox_agree: { label: 'ยอมรับข้อตกลง', value: 'ข้าพเจ้ายอมรับข้อตกลงข้างต้น', width: 90, height: 8, font_size: 13, border_style: 'none' },
    divider: { label: '', width: 180, height: 2, font_size: 12, border_style: 'none' }
  }[type] || {};
  return normalizeField(Object.assign({
    id: newTmpId(), field_type: type, name: uniqueName(type), pos_x: 10, pos_y: 10
  }, d));
}

function uniqueName(base) {
  base = slugName(base) || 'field';
  const used = new Set(state.fields.map(f => f.name));
  if (!used.has(base)) return base;
  let i = 2;
  while (used.has(base + '_' + i)) i++;
  return base + '_' + i;
}

function getField(id) { return state.fields.find(f => f.id === id); }
function fontStack(f) { return (f.font_family ? f.font_family + ', ' : '') + 'Sarabun, "Noto Sans Thai", sans-serif'; }

function applyBox(el, f) {
  const s = el.style;
  s.left = f.pos_x + 'mm';
  s.top = f.pos_y + 'mm';
  s.width = f.width + 'mm';
  s.height = f.height + 'mm';
  s.fontSize = f.font_size + 'px';
  s.fontFamily = fontStack(f);
  s.fontWeight = f.font_weight;
  s.color = f.text_color;
  s.background = f.bg_color;
  s.textAlign = f.text_align;
  s.border = (f.border_style && f.border_style !== 'none' && f.field_type !== 'divider' && f.field_type !== 'logo')
    ? '1px ' + f.border_style + ' ' + f.border_color
    : 'none';
}

function mk(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
function placeholder(text) { return mk('span', 'ph', text); }

function buildFieldElement(f, ctx) {
  const el = document.createElement('div');
  el.className = 'canvas-field ft-' + f.field_type;
  el.dataset.fieldId = f.id;
  el.dataset.fieldType = f.field_type;
  applyBox(el, f);
  el.appendChild(buildContent(f, ctx));
  if (ctx.mode === 'fill' && f.required && INPUT_TYPES.includes(f.field_type)) {
    el.classList.add('is-required');
  }
  return el;
}

function buildOptions(f, ctx) {
  const ft = f.field_type;
  const opts = f.options.length ? f.options : (ctx.mode === 'design' ? ['ตัวเลือก 1', 'ตัวเลือก 2'] : []);
  const g = mk('div', 'opt-group' + (f.height > 15 ? ' col' : ''));
  const chosen = ctx.mode === 'print' ? String(ctx.data[f.name] || '').split(', ') : [];
  opts.forEach(opt => {
    const lbl = mk('label', 'opt');
    if (ctx.mode === 'fill') {
      const inp = document.createElement('input');
      inp.type = ft;
      inp.name = ctx.prefix + f.id;
      inp.value = opt;
      lbl.appendChild(inp);
    } else {
      const box = mk('span', 'opt-box' + (ft === 'radio' ? ' round' : ''));
      if (ctx.mode === 'print' && chosen.includes(opt)) box.textContent = ft === 'radio' ? '●' : '✓';
      lbl.appendChild(box);
    }
    lbl.appendChild(document.createTextNode(opt));
    g.appendChild(lbl);
  });
  return g;
}

function buildContent(f, ctx) {
  const ft = f.field_type, mode = ctx.mode;
  const fc = mk('div', 'fc');
  const printVal = mode === 'print' ? String(ctx.data[f.name] == null ? '' : ctx.data[f.name]) : '';

  if (ft === 'logo') {
    fc.classList.add('center-y');
    if (f.value && /^data:image\//.test(f.value)) {
      const img = document.createElement('img');
      img.src = f.value;
      img.className = 'logo-img';
      img.alt = f.label || 'โลโก้';
      fc.appendChild(img);
    } else if (mode === 'design') {
      fc.appendChild(placeholder('🖼️ โลโก้'));
    }
    return fc;
  }

  if (ft === 'label' || ft === 'title') {
    const t = f.value || f.label || '';
    if (t) fc.textContent = t;
    else if (mode === 'design') fc.appendChild(placeholder('ข้อความ'));
    return fc;
  }

  if (ft === 'divider') {
    fc.classList.add('center-y');
    const line = mk('div', 'div-line');
    line.style.borderTopColor = f.border_color;
    fc.appendChild(line);
    return fc;
  }

  if (ft === 'text_input' || ft === 'date' || ft === 'select') {
    fc.classList.add('center-y');
    if (mode === 'fill') {
      let c;
      if (ft === 'select') {
        c = document.createElement('select');
        const def = document.createElement('option');
        def.value = '';
        def.textContent = '-- เลือก --';
        c.appendChild(def);
        f.options.forEach(o => {
          const op = document.createElement('option');
          op.value = o;
          op.textContent = o;
          c.appendChild(op);
        });
      } else {
        c = document.createElement('input');
        c.type = ft === 'date' ? 'date' : 'text';
        c.placeholder = ft === 'date' ? '' : (f.label || '');
        if (f.value && (ft !== 'date' || /^\d{4}-\d{2}-\d{2}$/.test(f.value))) c.value = f.value;
      }
      c.className = 'fc-input';
      fc.appendChild(c);
    } else if (mode === 'print') {
      fc.textContent = ft === 'date' ? formatThaiDate(printVal) : printVal;
    } else {
      if (ft === 'select') fc.appendChild(placeholder('▼ ' + (f.options[0] || f.label || 'เลือก')));
      else if (ft === 'date') fc.appendChild(placeholder('__/__/____'));
      else if (f.value) fc.textContent = f.value;
      else fc.appendChild(placeholder(f.label || 'ช่องกรอก'));
    }
    return fc;
  }

  if (ft === 'textarea') {
    if (mode === 'fill') {
      const c = document.createElement('textarea');
      c.className = 'fc-input';
      c.placeholder = f.label || '';
      c.value = f.value || '';
      fc.appendChild(c);
    } else if (mode === 'print') {
      fc.textContent = printVal;
    } else if (f.value) {
      fc.textContent = f.value;
    } else {
      fc.appendChild(placeholder(f.label || 'ข้อความยาว'));
    }
    return fc;
  }

  if (ft === 'radio' || ft === 'checkbox') {
    fc.classList.add('center-y');
    fc.appendChild(buildOptions(f, ctx));
    return fc;
  }

  if (ft === 'signature') {
    const sig = mk('div', 'sig');
    const line = mk('div', 'sig-line');
    if (mode === 'fill') {
      const c = document.createElement('input');
      c.type = 'text';
      c.className = 'fc-input';
      c.placeholder = 'พิมพ์ชื่อเพื่อลงนาม';
      line.appendChild(c);
    } else if (mode === 'print') {
      line.textContent = printVal;
    }
    sig.appendChild(line);
    sig.appendChild(mk('div', 'sig-cap', f.label ? '(' + f.label + ')' : ''));
    fc.appendChild(sig);
    return fc;
  }

  if (ft === 'checkbox_agree') {
    const row = mk('div', 'agree');
    if (mode === 'fill') {
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      row.appendChild(cb);
    } else {
      row.appendChild(mk('span', 'opt-box', mode === 'print' && printVal ? '✓' : ''));
    }
    row.appendChild(mk('span', '', f.value || f.label || ''));
    fc.appendChild(row);
    return fc;
  }

  return fc;
}

function renderFormOnCanvas(selector, fields, mode, data) {
  const canvas = $(selector);
  canvas.innerHTML = '';
  canvas.classList.toggle('fill-mode', mode === 'fill');
  const ctx = { mode: mode, data: data || {}, prefix: 'r' + (++renderSeq) + '_' };
  fields.forEach(f => canvas.appendChild(buildFieldElement(f, ctx)));
  return canvas;
}

function applyZoom(canvas, z) {
  const box = canvas.parentElement;
  box.style.width = (PAGE_W * PX_PER_MM * z) + 'px';
  box.style.height = (PAGE_H * PX_PER_MM * z) + 'px';
  canvas.style.transform = z === 1 ? '' : 'scale(' + z + ')';
  canvas.dataset.zoom = z;
}
function fitZoom(wrapper) {
  const w = wrapper.clientWidth - 40;
  if (!(w > 0)) return 1;
  return Math.max(0.3, Math.min(1, w / (PAGE_W * PX_PER_MM)));
}
function setBuilderZoom(z) {
  state.zoom = clamp(round2(z), 0.3, 1.5);
  applyZoom($('#builderCanvas'), state.zoom);
  $('#zoomLabel').textContent = Math.round(state.zoom * 100) + '%';
}
function mmPerPx(canvas) {
  const w = canvas.getBoundingClientRect().width;
  return w > 0 ? PAGE_W / w : 1 / PX_PER_MM;
}

function collectFormData(canvasEl, fields) {
  const data = {}, missing = [];
  fields.forEach(f => {
    if (!INPUT_TYPES.includes(f.field_type)) return;
    const el = canvasEl.querySelector('[data-field-id="' + f.id + '"]');
    if (!el) return;
    let v = '';
    if (f.field_type === 'radio' || f.field_type === 'checkbox') {
      v = Array.from(el.querySelectorAll('input:checked')).map(i => i.value).join(', ');
    } else if (f.field_type === 'checkbox_agree') {
      const cb = el.querySelector('input');
      v = cb && cb.checked ? 'ยอมรับ' : '';
    } else {
      const c = el.querySelector('input,textarea,select');
      v = c ? c.value : '';
    }
    data[f.name] = v;
    el.classList.remove('field-error');
    if (f.required && !String(v).trim()) {
      missing.push(f);
      el.classList.add('field-error');
    }
  });
  return { data: data, missing: missing };
}

/* ============================================================
   PUBLIC: FORM LIST + THUMBNAILS
   ============================================================ */
async function loadPublicFormList() {
  const cached = cacheGet('publicForms');
  if (cached) {
    renderPublicFormList(cached);
    refreshPublicFormList();
    return;
  }
  await refreshPublicFormList();
}

async function refreshPublicFormList() {
  try {
    const templates = await apiCall('getPublicFormTemplates', {});
    cacheSet('publicForms', templates || []);
    renderPublicFormList(templates);
  } catch (e) { handleError(e); }
}

function renderPublicFormList(templates) {
  const list = $('#publicFormList');
  if (!templates || !templates.length) {
    list.innerHTML = '<div class="empty">ยังไม่มีฟอร์มที่เปิดใช้งาน</div>';
    return;
  }
  list.innerHTML = templates.map(t => `
    <article class="card">
      <h3>${esc(t.name)}</h3>
      <p class="meta">${esc(t.description || '')}</p>
      <div class="form-thumb" data-thumb="${esc(t.id)}" data-fields='${JSON.stringify(t.fields || []).replace(/'/g, "&#39;")}'>
        <span class="form-thumb-badge">ตัวอย่าง</span>
        <div class="a4-canvas form-thumb-canvas"></div>
      </div>
      <div class="card-actions">
        <button class="btn secondary" type="button" data-preview="${esc(t.id)}">👁️ ดูตัวอย่าง</button>
        <button class="btn primary" type="button" data-fill="${esc(t.id)}">✏️ กรอกเลย</button>
      </div>
    </article>
  `).join('');
  lazyRenderThumbnails();
}

function lazyRenderThumbnails() {
  const thumbs = $$('.form-thumb');
  if (!('IntersectionObserver' in window)) {
    thumbs.forEach(renderOneThumb);
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        renderOneThumb(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '150px' });
  thumbs.forEach(t => observer.observe(t));
}

function renderOneThumb(thumb) {
  const canvas = thumb.querySelector('.form-thumb-canvas');
  if (!canvas || canvas.dataset.rendered) return;
  try {
    const fields = JSON.parse(thumb.dataset.fields || '[]');
    const ctx = { mode: 'print', data: {}, prefix: 'th' + (++renderSeq) + '_' };
    fields.map(normalizeField).forEach(f => canvas.appendChild(buildFieldElement(f, ctx)));
    canvas.dataset.rendered = 'true';
    const wPx = thumb.clientWidth;
    if (wPx > 0) canvas.style.transform = 'scale(' + (wPx / (PAGE_W * PX_PER_MM)) + ')';
  } catch (e) {}
}

function scaleThumbs() {
  $$('.form-thumb').forEach(w => {
    const c = w.querySelector('.form-thumb-canvas');
    if (!c || !c.dataset.rendered) return;
    const wPx = w.clientWidth;
    if (wPx > 0) c.style.transform = 'scale(' + (wPx / (PAGE_W * PX_PER_MM)) + ')';
  });
}
window.addEventListener('resize', scaleThumbs);

$('#publicFormList').addEventListener('click', async e => {
  const previewBtn = e.target.closest('[data-preview]');
  const fillBtn = e.target.closest('[data-fill]');
  if (previewBtn) { await openPublicPreview(previewBtn.dataset.preview); return; }
  if (fillBtn) { await openPublicFormRenderer(fillBtn.dataset.fill); return; }
});

async function openPublicPreview(templateId) {
  showLoading();
  try {
    const template = await apiCall('getPublicFormTemplate', { id: templateId });
    hideLoading();
    $('#previewModalTitle').textContent = 'ดูตัวอย่าง: ' + template.name;
    const canvas = renderFormOnCanvas('#previewCanvas', (template.fields || []).map(normalizeField), 'print', {});
    $('#previewModal').hidden = false;
    applyZoom(canvas, fitZoom($('#previewModal .modal-body')));
  } catch (e) { hideLoading(); toast(err(e)); }
}

$('#closePreviewBtn').addEventListener('click', () => { $('#previewModal').hidden = true; });

async function openPublicFormRenderer(templateId) {
  showLoading();
  try {
    const template = await apiCall('getPublicFormTemplate', { id: templateId });
    hideLoading();
    rendererState = { templateId: templateId, fields: (template.fields || []).map(normalizeField) };
    $('#publicRendererTitle').textContent = 'กรอกฟอร์ม: ' + template.name;
    $('#submitterFullName').value = '';
    $('#submitterCitizenId').value = '';
    showView('publicFormRendererView');
    const canvas = renderFormOnCanvas('#publicRendererCanvas', rendererState.fields, 'fill');
    applyZoom(canvas, fitZoom($('#publicRendererWrapper')));
    $('#publicRendererWrapper').scrollTop = 0;
  } catch (e) { hideLoading(); toast(err(e)); }
}

$('#backToPublicFormList').addEventListener('click', () => showView('publicFormListView'));
$('#cancelPublicFormBtn').addEventListener('click', () => showView('publicFormListView'));

$('#submitPublicFormBtn').addEventListener('click', async () => {
  if (!rendererState.templateId) return;
  const fullName = $('#submitterFullName').value.trim();
  const citizenId = $('#submitterCitizenId').value.trim();
  if (!fullName) { toast('กรุณากรอกชื่อ-นามสกุล'); $('#submitterFullName').focus(); return; }
  if (fullName.length > 200) { toast('ชื่อ-นามสกุลยาวเกินไป (สูงสุด 200 ตัวอักษร)'); return; }
  if (!/^\d{13}$/.test(citizenId)) {
    toast('กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก');
    $('#submitterCitizenId').focus();
    return;
  }
  const result = collectFormData($('#publicRendererCanvas'), rendererState.fields);
  if (result.missing.length) {
    const first = result.missing[0];
    const el = $('#publicRendererCanvas').querySelector('[data-field-id="' + first.id + '"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    toast('กรุณากรอก: ' + (first.label || first.name) +
      (result.missing.length > 1 ? ' (และอีก ' + (result.missing.length - 1) + ' ช่อง)' : ''));
    return;
  }
  const btn = $('#submitPublicFormBtn');
  btn.disabled = true;
  showLoading();
  try {
    const res = await apiCall('submitFormAnonymous', {
      templateId: rendererState.templateId,
      formData: result.data,
      citizenId: citizenId,
      fullName: fullName
    });
    hideLoading();
    lastSubmittedId = res.id;
    lastSubmittedCitizenId = citizenId;
    $('#referenceIdDisplay').textContent = res.referenceId;
    showView('submissionSuccessView');
  } catch (x) {
    hideLoading();
    toast(err(x));
  } finally {
    btn.disabled = false;
  }
});

$('#printSuccessBtn').addEventListener('click', async () => {
  if (!lastSubmittedId || !lastSubmittedCitizenId) return;
  await printPublicSubmission(lastSubmittedId, lastSubmittedCitizenId);
});

$('#viewMySubmissionsBtn').addEventListener('click', () => {
  $('#lookupCitizenId').value = lastSubmittedCitizenId || '';
  showView('publicMySubmissionsView');
});

$('#backToHomeBtn').addEventListener('click', () => {
  showView('publicFormListView');
  loadPublicFormList();
});

async function printPublicSubmission(id, citizenId) {
  showLoading();
  try {
    const r = await apiCall('getPublicFormSubmission', { id: id, citizenId: citizenId });
    hideLoading();
    openPrintWindow(r, 'พิมพ์คำขอ #' + r.referenceId);
  } catch (x) { hideLoading(); toast(err(x)); }
}

$('#lookupSubmissionsBtn').addEventListener('click', async () => {
  const citizenId = $('#lookupCitizenId').value.trim();
  if (!/^\d{13}$/.test(citizenId)) { toast('กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก'); return; }
  showLoading();
  try {
    const submissions = await apiCall('lookupSubmissionsByCitizenId', { citizenId: citizenId });
    hideLoading();
    $('#publicMySubmissionsList').innerHTML = submissions && submissions.length
      ? submissions.map(s => `
        <article class="card">
          <h3>${esc(s.template_name)}</h3>
          <div><span class="status" data-status="${esc(s.status)}">${esc(STATUS_TH[s.status] || s.status)}</span></div>
          <div class="meta">เลขอ้างอิง: <b>${esc(s.referenceId)}</b><br>ส่งเมื่อ ${esc(new Date(s.created_at).toLocaleString('th-TH'))}</div>
          <div class="card-actions">
            <button class="btn secondary" type="button" data-view-public-sub="${esc(s.id)}" data-citizen="${esc(citizenId)}">👁️ ดู</button>
            <button class="btn ghost" type="button" data-print-public-sub="${esc(s.id)}" data-citizen="${esc(citizenId)}">🖨️ พิมพ์</button>
          </div>
        </article>
      `).join('')
      : '<div class="empty">ไม่พบคำขอสำหรับเลขบัตรนี้</div>';
  } catch (x) { hideLoading(); toast(err(x)); }
});

$('#publicMySubmissionsList').addEventListener('click', async e => {
  const viewBtn = e.target.closest('[data-view-public-sub]');
  const printBtn = e.target.closest('[data-print-public-sub]');
  if (viewBtn) { await viewPublicSubmission(viewBtn.dataset.viewPublicSub, viewBtn.dataset.citizen); return; }
  if (printBtn) { await printPublicSubmission(printBtn.dataset.printPublicSub, printBtn.dataset.citizen); return; }
});

async function viewPublicSubmission(id, citizenId) {
  showLoading();
  try {
    const r = await apiCall('getPublicFormSubmission', { id: id, citizenId: citizenId });
    hideLoading();
    viewingSubmissionId = id;
    viewingSubmissionCitizenId = citizenId;
    $('#submissionModalTitle').textContent =
      (r.template && r.template.name ? r.template.name : 'คำขอ') + ' · #' + esc(r.referenceId);
    const canvas = renderFormOnCanvas('#submissionCanvas', (r.fields || []).map(normalizeField), 'print', r.data || {});
    $('#submissionModal').hidden = false;
    applyZoom(canvas, fitZoom($('#submissionModal .modal-body')));
  } catch (x) { hideLoading(); toast(err(x)); }
}

$('#printSubmissionBtn').addEventListener('click', async () => {
  if (!viewingSubmissionId) return;
  if (viewingSubmissionCitizenId) {
    await printPublicSubmission(viewingSubmissionId, viewingSubmissionCitizenId);
    return;
  }
  if (accessToken) {
    showLoading();
    try {
      const r = await apiCall('printFormSubmission', { id: viewingSubmissionId });
      hideLoading();
      openPrintWindow(r, 'พิมพ์คำขอ');
    } catch (x) { hideLoading(); handleError(x); }
  }
});

$('#closeSubmissionBtn').addEventListener('click', () => { $('#submissionModal').hidden = true; });

/* ============================================================
   NAV / LOGIN
   ============================================================ */
$('#mySubmissionsBtn').addEventListener('click', () => showView('publicMySubmissionsView'));
$('#loginBtn').addEventListener('click', () => showView('loginView'));
$('#cancelLoginBtn').addEventListener('click', () => showView('publicFormListView'));

$('#adminPanelBtn').addEventListener('click', () => {
  showView('adminDashboardView');
  showAdminView('adminFormListView');
  loadAdminFormList();
});

$('#backToPublicBtn').addEventListener('click', () => {
  showView('publicFormListView');
  loadPublicFormList();
});

$('#logoutBtn').addEventListener('click', () => {
  if (!confirm('ออกจากระบบ?')) return;
  accessToken = null;
  try { localStorage.removeItem('access_token'); } catch (e) {}
  adminTemplates = [];
  lastAdminSubmissions = [];
  resetAdminSubmissions();
  resetBuilder();
  updateAuthUI();
  showView('publicFormListView');
  toast('ออกจากระบบแล้ว');
});

$('#adminLoginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('#adminEmail').value.trim();
  const password = $('#adminPassword').value;
  if (!email || !password) { toast('กรุณากรอกอีเมลและรหัสผ่าน'); return; }
  showLoading();
  try {
    const result = await apiCall('loginWithPassword', { email: email, password: password });
    accessToken = result.accessToken;
    try { localStorage.setItem('access_token', accessToken); } catch (x) {}
    $('#adminPassword').value = '';
    hideLoading();
    if (result.mustChangePassword) { showView('changePasswordView'); return; }
    $('#sessionBadge').textContent = result.fullName + ' · ' + result.role;
    updateAuthUI();
    showView('adminDashboardView');
    showAdminView('adminFormListView');
    loadAdminFormList();
  } catch (x) { hideLoading(); toast(err(x)); }
});

$('#changePasswordForm').addEventListener('submit', async e => {
  e.preventDefault();
  const a = $('#newPassword').value, b = $('#confirmPassword').value;
  if (a.length < 10) { toast('รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร'); return; }
  if (a !== b) { toast('รหัสไม่ตรงกัน'); return; }
  showLoading();
  try {
    await apiCall('changeInitialPassword', { newPassword: a });
    const session = await apiCall('getSession', {});
    hideLoading();
    toast('เปลี่ยนรหัสผ่านสำเร็จ');
    $('#sessionBadge').textContent = session.fullName + ' · ' + session.role;
    updateAuthUI();
    showView('adminDashboardView');
    showAdminView('adminFormListView');
    loadAdminFormList();
  } catch (x) { hideLoading(); toast(err(x)); }
});

/* ============================================================
   ADMIN: FORM LIST + MY SUBMISSIONS
   ============================================================ */
async function loadAdminFormList() {
  try {
    const templates = await apiCall('getActiveFormTemplates', {});
    $('#adminFormList').innerHTML = templates && templates.length
      ? templates.map(t =>
        '<article class="card"><h3>' + esc(t.name) + '</h3><p class="meta">' + esc(t.description || '') +
        '</p><button class="btn primary" type="button" data-template="' + esc(t.id) + '">กรอกฟอร์ม</button></article>'
      ).join('')
      : '<div class="empty">ยังไม่มีฟอร์มที่เปิดใช้งาน</div>';
  } catch (e) { handleError(e); }
}

$('#adminFormList').addEventListener('click', e => {
  const btn = e.target.closest('[data-template]');
  if (btn) openAdminFormRenderer(btn.dataset.template);
});

async function openAdminFormRenderer(templateId) {
  showLoading();
  try {
    const template = await apiCall('getActiveFormTemplate', { id: templateId });
    hideLoading();
    rendererState = { templateId: templateId, fields: (template.fields || []).map(normalizeField) };
    $('#publicRendererTitle').textContent = 'กรอกฟอร์ม: ' + template.name;
    showView('publicFormRendererView');
    const canvas = renderFormOnCanvas('#publicRendererCanvas', rendererState.fields, 'fill');
    applyZoom(canvas, fitZoom($('#publicRendererWrapper')));
  } catch (e) { hideLoading(); handleError(e); }
}

async function loadAdminMySubmissions() {
  try {
    const submissions = await apiCall('getMySubmissions', {});
    $('#adminMySubmissionsList').innerHTML = submissions && submissions.length
      ? submissions.map(s =>
        '<article class="card"><h3>' + esc(s.template_name) + '</h3>' +
        '<div><span class="status" data-status="' + esc(s.status) + '">' + esc(STATUS_TH[s.status] || s.status) + '</span></div>' +
        '<div class="meta">เลขอ้างอิง: <b>' + esc(s.referenceId) + '</b><br>ส่งเมื่อ ' +
        esc(new Date(s.created_at).toLocaleString('th-TH')) + '</div>' +
        '<button class="btn ghost print-my-btn" type="button" data-id="' + esc(s.id) + '">🖨️ พิมพ์ A4</button></article>'
      ).join('')
      : '<div class="empty">ยังไม่มีคำขอ</div>';
  } catch (e) { handleError(e); }
}

$('#adminMySubmissionsList').addEventListener('click', async e => {
  const btn = e.target.closest('.print-my-btn');
  if (!btn) return;
  showLoading();
  try {
    const r = await apiCall('printFormSubmission', { id: btn.dataset.id });
    hideLoading();
    openPrintWindow(r, 'พิมพ์คำขอ');
  } catch (x) { hideLoading(); handleError(x); }
});

/* ============================================================
   ADMIN: BUILDER
   ============================================================ */
async function loadTemplateList() {
  try {
    const templates = await apiCall('getFormTemplates', {});
    $('#templateList').innerHTML = templates && templates.length
      ? templates.map(t => `
        <div class="sidebar-item ${t.id === state.templateId ? 'active' : ''}" data-template-id="${esc(t.id)}">
          <div class="sidebar-item-name">${esc(t.name)}</div>
          <div class="sidebar-item-status ${t.is_active ? 'active' : 'inactive'}">${t.is_active ? '● ใช้งาน' : '○ ปิด'}</div>
          <div class="sidebar-item-actions">
            <button class="btn-icon" type="button" data-duplicate="${esc(t.id)}" title="คัดลอกฟอร์มนี้">📋</button>
          </div>
        </div>
      `).join('')
      : '<div class="empty" style="padding:10px;font-size:12px">ยังไม่มีฟอร์ม</div>';
  } catch (e) { handleError(e); }
}

$('#templateList').addEventListener('click', async e => {
  const dupBtn = e.target.closest('[data-duplicate]');
  if (dupBtn) {
    e.stopPropagation();
    const templateId = dupBtn.dataset.duplicate;
    const itemEl = dupBtn.closest('.sidebar-item');
    const srcName = itemEl ? itemEl.querySelector('.sidebar-item-name').textContent : '';
    const newName = prompt('ชื่อฟอร์มใหม่ (เว้นว่าง = ใช้ชื่ออัตโนมัติ):', srcName + ' (คัดลอก)');
    if (newName === null) return;
    showLoading();
    try {
      const result = await apiCall('duplicateFormTemplate', { id: templateId, newName: newName.trim() });
      hideLoading();
      toast('คัดลอกฟอร์มสำเร็จ: ' + result.name + ' (' + result.fieldsCount + ' ฟิลด์)');
      await loadTemplateList();
    } catch (x) { hideLoading(); handleError(x); }
    return;
  }
  const item = e.target.closest('[data-template-id]');
  if (item) await openTemplateEditor(item.dataset.templateId);
});

$('#newTemplateBtn').addEventListener('click', () => {
  closeAllModals();
  $('#newTemplateModal').hidden = false;
  $('#newTemplateName').value = '';
  $('#newTemplateDesc').value = '';
  $('#newTemplateName').focus();
});

$('#cancelNewTemplate').addEventListener('click', () => { $('#newTemplateModal').hidden = true; });

$('#newTemplateForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('#newTemplateName').value.trim();
  if (!name) { toast('กรุณากรอกชื่อฟอร์ม'); return; }
  if (!confirmDiscard()) return;
  showLoading();
  try {
    const result = await apiCall('createFormTemplate', {
      data: { name: name, description: $('#newTemplateDesc').value }
    });
    hideLoading();
    $('#newTemplateModal').hidden = true;
    $('#newTemplateForm').reset();
    clearDirty();
    await openTemplateEditor(result.id, true);
    loadTemplateList();
    toast('สร้างฟอร์มสำเร็จ');
  } catch (x) { hideLoading(); handleError(x); }
});

async function openTemplateEditor(templateId, force) {
  if (!force) {
    if (state.templateId === templateId && state.dirty) return;
    if (state.templateId !== templateId && !confirmDiscard()) return;
  }
  showLoading();
  try {
    const template = await apiCall('getFormTemplate', { id: templateId });
    hideLoading();
    state.templateId = templateId;
    state.meta = {
      name: template.name || '',
      description: template.description || '',
      is_active: template.is_active === true
    };
    state.fields = (template.fields || []).map(normalizeField);
    state.deleted = [];
    state.selectedId = null;
    undoStack = [];
    updateUndoBtn();
    clearDirty();
    $('#builderEmpty').hidden = true;
    $('#builderCanvasWrapper').hidden = false;
    $('#builderToolbar').hidden = false;
    $('#toolboxSection').hidden = false;
    $('#propertiesPanel').hidden = true;
    $('#builderTemplateName').value = state.meta.name;
    $('#builderPublishToggle').checked = state.meta.is_active;
    setBuilderZoom(fitZoom($('#builderCanvasWrapper')));
    renderBuilderCanvas();
    loadTemplateList();
  } catch (e) { hideLoading(); handleError(e); }
}

function resetBuilder() {
  state.templateId = null;
  state.fields = [];
  state.deleted = [];
  state.selectedId = null;
  state.meta = { name: '', description: '', is_active: false };
  undoStack = [];
  panelFieldId = null;
  clearDirty();
  const c = $('#builderCanvas');
  if (c) c.innerHTML = '';
  ['#builderCanvasWrapper', '#builderToolbar', '#toolboxSection', '#propertiesPanel']
    .forEach(s => { const el = $(s); if (el) el.hidden = true; });
  const empty = $('#builderEmpty');
  if (empty) empty.hidden = false;
  updateUndoBtn();
}

$('#backToTemplateList').addEventListener('click', () => {
  if (!confirmDiscard()) return;
  resetBuilder();
  loadTemplateList();
});

$('#deleteTemplateBtn').addEventListener('click', async () => {
  if (!state.templateId) return;
  if (!confirm('ลบฟอร์ม "' + (state.meta.name || '') + '" ถาวร?')) return;
  showLoading();
  try {
    await apiCall('deleteFormTemplate', { id: state.templateId });
    hideLoading();
    resetBuilder();
    loadTemplateList();
    toast('ลบฟอร์มแล้ว');
  } catch (x) { hideLoading(); handleError(x); }
});

$('#builderTemplateName').addEventListener('input', () => { if (state.templateId) markDirty(); });
$('#builderPublishToggle').addEventListener('change', () => { if (state.templateId) markDirty(); });

function markDirty() { state.dirty = true; $('#dirtyBadge').hidden = false; }
function clearDirty() { state.dirty = false; $('#dirtyBadge').hidden = true; }
function confirmDiscard() {
  return !state.dirty || confirm('มีการแก้ไขที่ยังไม่ได้บันทึก ต้องการทิ้งการแก้ไขหรือไม่?');
}

function renderBuilderCanvas() {
  const canvas = $('#builderCanvas');
  canvas.innerHTML = '';
  canvas.classList.remove('fill-mode');
  state.fields.forEach(f => canvas.appendChild(createBuilderFieldElement(f)));
}

function createBuilderFieldElement(f) {
  const el = buildFieldElement(f, { mode: 'design', data: {}, prefix: '' });
  el.classList.add('builder-field');
  if (f.id === state.selectedId) el.classList.add('selected');
  const handle = mk('div', 'resize-handle');
  el.appendChild(handle);
  el.addEventListener('pointerdown', onFieldPointerDown);
  el.addEventListener('dblclick', onFieldDblClick);
  handle.addEventListener('pointerdown', onHandlePointerDown);
  return el;
}

function getEl(id) { return $('#builderCanvas').querySelector('[data-field-id="' + id + '"]'); }
function refreshFieldElement(f) {
  const old = getEl(f.id), neu = createBuilderFieldElement(f);
  if (old) old.replaceWith(neu);
  else $('#builderCanvas').appendChild(neu);
}

function addField(type, x, y, centered) {
  if (!state.templateId) return;
  const f = getDefaultField(type);
  if (x === undefined) { x = 15; y = nextFreeY(f.height); centered = false; }
  if (centered) { x -= f.width / 2; y -= f.height / 2; }
  f.pos_x = clamp(snap(x), 0, Math.max(0, PAGE_W - f.width));
  f.pos_y = clamp(snap(y), 0, Math.max(0, PAGE_H - f.height));
  pushUndo();
  state.fields.push(f);
  $('#builderCanvas').appendChild(createBuilderFieldElement(f));
  selectField(f.id);
  markDirty();
}

function nextFreeY(h) {
  const bottom = state.fields.reduce((m, f) => Math.max(m, f.pos_y + f.height), 12);
  return Math.min(bottom + 3, Math.max(0, PAGE_H - h));
}

$$('.toolbox-item').forEach(item => {
  item.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', 'field:' + item.dataset.fieldType);
    e.dataTransfer.effectAllowed = 'copy';
  });
  item.addEventListener('click', () => addField(item.dataset.fieldType));
  item.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      addField(item.dataset.fieldType);
    }
  });
});

(function bindCanvasDrop() {
  const canvas = $('#builderCanvas');
  canvas.addEventListener('dragover', e => {
    if (!state.templateId) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    canvas.classList.add('drag-over');
  });
  canvas.addEventListener('dragleave', () => canvas.classList.remove('drag-over'));
  canvas.addEventListener('drop', e => {
    e.preventDefault();
    canvas.classList.remove('drag-over');
    if (!state.templateId) return;
    const raw = e.dataTransfer.getData('text/plain') || '';
    if (raw.indexOf('field:') !== 0) return;
    const r = canvas.getBoundingClientRect();
    const s = mmPerPx(canvas);
    addField(raw.slice(6), (e.clientX - r.left) * s, (e.clientY - r.top) * s, true);
  });
  canvas.addEventListener('pointerdown', e => { if (e.target === canvas) clearSelection(); });
})();

function selectField(id) {
  state.selectedId = id;
  $$('#builderCanvas .builder-field').forEach(el =>
    el.classList.toggle('selected', el.dataset.fieldId === id));
  showProperties(id);
}

function clearSelection() {
  state.selectedId = null;
  panelFieldId = null;
  $$('#builderCanvas .builder-field').forEach(el => el.classList.remove('selected'));
  $('#propertiesPanel').hidden = true;
}

function capture(el, e) {
  try { if (el.setPointerCapture) el.setPointerCapture(e.pointerId); } catch (x) {}
}

function onFieldPointerDown(e) {
  if (e.button !== undefined && e.button !== 0) return;
  const el = e.currentTarget, f = getField(el.dataset.fieldId);
  if (!f) return;
  if (el.querySelector('.fc[contenteditable="true"]')) return;
  e.stopPropagation();
  selectField(f.id);
  drag = {
    mode: 'move', f: f, el: el,
    sx: e.clientX, sy: e.clientY, ox: f.pos_x, oy: f.pos_y,
    scale: mmPerPx($('#builderCanvas')), moved: false
  };
  capture(el, e);
  el.addEventListener('pointermove', onDragMove);
  el.addEventListener('pointerup', onDragEnd);
  el.addEventListener('pointercancel', onDragEnd);
}

function onDragMove(e) {
  if (!drag || drag.mode !== 'move') return;
  const dx = (e.clientX - drag.sx) * drag.scale;
  const dy = (e.clientY - drag.sy) * drag.scale;
  if (!drag.moved) {
    if (Math.abs(dx) + Math.abs(dy) < 0.5) return;
    pushUndo();
    drag.moved = true;
  }
  const f = drag.f;
  f.pos_x = clamp(snap(drag.ox + dx), 0, Math.max(0, PAGE_W - f.width));
  f.pos_y = clamp(snap(drag.oy + dy), 0, Math.max(0, PAGE_H - f.height));
  drag.el.style.left = f.pos_x + 'mm';
  drag.el.style.top = f.pos_y + 'mm';
  syncGeometryInputs(f);
}

function onDragEnd() {
  if (!drag) return;
  const el = drag.el;
  el.removeEventListener('pointermove', onDragMove);
  el.removeEventListener('pointerup', onDragEnd);
  el.removeEventListener('pointercancel', onDragEnd);
  if (drag.moved) markDirty();
  drag = null;
}

function onHandlePointerDown(e) {
  if (e.button !== undefined && e.button !== 0) return;
  e.stopPropagation();
  const handle = e.currentTarget, el = handle.parentElement, f = getField(el.dataset.fieldId);
  if (!f) return;
  selectField(f.id);
  drag = {
    mode: 'resize', f: f, el: el, handle: handle,
    sx: e.clientX, sy: e.clientY, ow: f.width, oh: f.height,
    scale: mmPerPx($('#builderCanvas')), moved: false
  };
  capture(handle, e);
  handle.addEventListener('pointermove', onResizeMove);
  handle.addEventListener('pointerup', onResizeEnd);
  handle.addEventListener('pointercancel', onResizeEnd);
  e.preventDefault();
}

function onResizeMove(e) {
  if (!drag || drag.mode !== 'resize') return;
  const dx = (e.clientX - drag.sx) * drag.scale;
  const dy = (e.clientY - drag.sy) * drag.scale;
  if (!drag.moved) {
    if (Math.abs(dx) + Math.abs(dy) < 0.5) return;
    pushUndo();
    drag.moved = true;
  }
  const f = drag.f;
  f.width = clamp(snap(drag.ow + dx), 3, PAGE_W - f.pos_x);
  f.height = clamp(snap(drag.oh + dy), 1, PAGE_H - f.pos_y);
  drag.el.style.width = f.width + 'mm';
  drag.el.style.height = f.height + 'mm';
  syncGeometryInputs(f);
}

function onResizeEnd() {
  if (!drag) return;
  const h = drag.handle, f = drag.f, moved = drag.moved;
  h.removeEventListener('pointermove', onResizeMove);
  h.removeEventListener('pointerup', onResizeEnd);
  h.removeEventListener('pointercancel', onResizeEnd);
  drag = null;
  if (moved) { markDirty(); refreshFieldElement(f); }
}

function onFieldDblClick(e) {
  const el = e.currentTarget, f = getField(el.dataset.fieldId);
  if (!f || (f.field_type !== 'label' && f.field_type !== 'title')) return;
  const fc = el.querySelector('.fc');
  if (!fc || fc.getAttribute('contenteditable') === 'true') return;
  if (fc.querySelector('.ph')) fc.textContent = '';
  pushUndo();
  fc.setAttribute('contenteditable', 'true');
  fc.focus();
  const sel = window.getSelection && window.getSelection();
  if (sel && document.createRange) {
    const r = document.createRange();
    r.selectNodeContents(fc);
    sel.removeAllRanges();
    sel.addRange(r);
  }
  const onInput = () => {
    f.value = fc.textContent;
    f.label = fc.textContent;
    markDirty();
    syncTextInput(f);
  };
  const finish = () => {
    fc.removeEventListener('input', onInput);
    fc.removeEventListener('blur', finish);
    fc.removeEventListener('keydown', onKey);
    fc.removeEventListener('paste', onPaste);
    fc.removeAttribute('contenteditable');
    f.value = fc.textContent;
    f.label = fc.textContent;
    refreshFieldElement(f);
  };
  const onKey = ev => {
    if (ev.key === 'Enter' || ev.key === 'Escape') { ev.preventDefault(); fc.blur(); }
    ev.stopPropagation();
  };
  const onPaste = ev => {
    ev.preventDefault();
    const t = (ev.clipboardData || window.clipboardData).getData('text');
    document.execCommand('insertText', false, t.replace(/\s+/g, ' '));
  };
  fc.addEventListener('input', onInput);
  fc.addEventListener('blur', finish);
  fc.addEventListener('keydown', onKey);
  fc.addEventListener('paste', onPaste);
}

function syncTextInput(f) {
  const t = $('#propertiesContent [data-prop="text"]');
  if (t && panelFieldId === f.id) t.value = f.value;
}

function removeField(id) {
  const f = getField(id);
  if (!f) return;
  pushUndo();
  state.fields = state.fields.filter(x => x.id !== id);
  if (isRealId(id)) state.deleted.push(id);
  const el = getEl(id);
  if (el) el.remove();
  if (state.selectedId === id) clearSelection();
  markDirty();
}

function duplicateField(id) {
  const f = getField(id);
  if (!f) return;
  const c = JSON.parse(JSON.stringify(f));
  c.id = newTmpId();
  c.name = uniqueName(f.name.replace(/_\d+$/, ''));
  c.pos_x = clamp(f.pos_x + 5, 0, Math.max(0, PAGE_W - c.width));
  c.pos_y = clamp(f.pos_y + 5, 0, Math.max(0, PAGE_H - c.height));
  pushUndo();
  state.fields.push(c);
  $('#builderCanvas').appendChild(createBuilderFieldElement(c));
  selectField(c.id);
  markDirty();
}

function moveLayer(id, toFront) {
  const i = state.fields.findIndex(f => f.id === id);
  if (i < 0) return;
  pushUndo();
  const f = state.fields.splice(i, 1)[0];
  if (toFront) state.fields.push(f);
  else state.fields.unshift(f);
  renderBuilderCanvas();
  markDirty();
}

$('#deleteFieldBtn').addEventListener('click', () => { if (state.selectedId) removeField(state.selectedId); });
$('#dupFieldBtn').addEventListener('click', () => { if (state.selectedId) duplicateField(state.selectedId); });
$('#frontFieldBtn').addEventListener('click', () => { if (state.selectedId) moveLayer(state.selectedId, true); });
$('#backFieldBtn').addEventListener('click', () => { if (state.selectedId) moveLayer(state.selectedId, false); });

function snapshot() {
  return JSON.stringify({ f: state.fields, d: state.deleted, s: state.selectedId });
}
function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 80) undoStack.shift();
  updateUndoBtn();
}
function updateUndoBtn() {
  const b = $('#undoBtn');
  if (b) b.disabled = undoStack.length === 0;
}
function undo() {
  if (!undoStack.length) return;
  const s = JSON.parse(undoStack.pop());
  state.fields = s.f;
  state.deleted = s.d;
  state.selectedId = getField(s.s) ? s.s : null;
  renderBuilderCanvas();
  panelFieldId = null;
  if (state.selectedId) showProperties(state.selectedId);
  else $('#propertiesPanel').hidden = true;
  markDirty();
  updateUndoBtn();
}
$('#undoBtn').addEventListener('click', undo);

$('#zoomInBtn').addEventListener('click', () => setBuilderZoom(state.zoom + 0.1));
$('#zoomOutBtn').addEventListener('click', () => setBuilderZoom(state.zoom - 0.1));
$('#zoomFitBtn').addEventListener('click', () => setBuilderZoom(fitZoom($('#builderCanvasWrapper'))));

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$$('.modal').every(m => m.hidden)) { closeAllModals(); return; }
  if (!$('#formBuilderView').classList.contains('active') || !state.templateId) return;
  const tag = (e.target.tagName || '').toLowerCase();
  const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
  const mod = e.ctrlKey || e.metaKey;
  const k = (e.key || '').toLowerCase();
  if (mod && k === 's') { e.preventDefault(); saveForm(); return; }
  if (typing) return;
  if (mod && k === 'z') { e.preventDefault(); undo(); return; }
  if (!state.selectedId) return;
  if (mod && k === 'd') { e.preventDefault(); duplicateField(state.selectedId); return; }
  if (k === 'delete' || k === 'backspace') { e.preventDefault(); removeField(state.selectedId); return; }
  const dir = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] }[k];
  if (dir) {
    e.preventDefault();
    const f = getField(state.selectedId);
    if (!f) return;
    const now = Date.now();
    if (now - lastNudgeAt > 800) pushUndo();
    lastNudgeAt = now;
    const step = e.shiftKey ? 5 : SNAP;
    f.pos_x = clamp(round2(f.pos_x + dir[0] * step), 0, Math.max(0, PAGE_W - f.width));
    f.pos_y = clamp(round2(f.pos_y + dir[1] * step), 0, Math.max(0, PAGE_H - f.height));
    const el = getEl(f.id);
    if (el) { el.style.left = f.pos_x + 'mm'; el.style.top = f.pos_y + 'mm'; }
    syncGeometryInputs(f);
    markDirty();
  }
});

window.addEventListener('beforeunload', e => {
  if (state.dirty) { e.preventDefault(); e.returnValue = ''; }
});

/* ============================================================
   PROPERTIES PANEL
   ============================================================ */
function group(label, html, note) {
  return '<div class="prop-group"><label>' + esc(label) + '</label>' + html +
    (note ? '<div class="prop-note">' + esc(note) + '</div>' : '') + '</div>';
}
function numInput(key, v, min, max, step) {
  return '<input type="number" data-prop="' + key + '" value="' + esc(v) +
    '" min="' + min + '" max="' + max + '" step="' + step + '">';
}
function selectInput(key, v, pairs) {
  return '<select data-prop="' + key + '">' + pairs.map(p =>
    '<option value="' + p[0] + '"' + (v === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'
  ).join('') + '</select>';
}

function propsHtml(f) {
  const ft = f.field_type;
  const isText = ft === 'label' || ft === 'title';
  const isInput = INPUT_TYPES.includes(ft);
  const h = [];
  h.push(group('ประเภท', '<div class="prop-value">' + esc(TYPE_LABEL[ft] || ft) + '</div>'));

  if (ft === 'logo') {
    const hasImage = f.value && /^data:image\//.test(f.value);
    h.push(group('อัปโหลดโลโก้',
      '<div class="logo-uploader">' +
      '<input type="file" id="logoFileInput" accept="image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp" style="display:none">' +
      '<button type="button" class="btn secondary btn-block" id="logoUploadBtn">' +
      (hasImage ? '🔄 เปลี่ยนรูป' : '📤 เลือกรูป') + '</button>' +
      (hasImage
        ? '<div class="logo-preview"><img src="' + esc(f.value) + '" alt="โลโก้"><button type="button" class="btn ghost danger btn-block" id="logoRemoveBtn">🗑️ ลบรูป</button></div>'
        : '<div class="logo-hint">PNG/JPG/SVG/WebP สูงสุด ~37 KB</div>') +
      '</div>'
    ));
    h.push(group('คำอธิบาย (alt)', '<input type="text" data-prop="label" value="' + esc(f.label) + '">'));
  }
  if (isText) h.push(group('ข้อความ', '<textarea data-prop="text" rows="3">' + esc(f.value || f.label) + '</textarea>'));
  if (isInput) h.push(group(ft === 'signature' ? 'ข้อความใต้ลายเซ็น' : 'ชื่อช่อง', '<input type="text" data-prop="label" value="' + esc(f.label) + '">'));
  if (ft === 'text_input' || ft === 'textarea') h.push(group('ค่าเริ่มต้น', '<input type="text" data-prop="value" value="' + esc(f.value) + '">'));
  if (ft === 'date') h.push(group('ค่าเริ่มต้น (YYYY-MM-DD)', '<input type="text" data-prop="value" value="' + esc(f.value) + '">'));
  if (ft === 'checkbox_agree') h.push(group('ข้อความยอมรับ', '<textarea data-prop="value" rows="2">' + esc(f.value) + '</textarea>'));
  if (OPTION_TYPES.includes(ft)) h.push(group('ตัวเลือก (1 บรรทัด = 1 ตัวเลือก)', '<textarea data-prop="options" rows="4">' + esc(f.options.join('\n')) + '</textarea>'));
  if (isInput) {
    h.push(group('ชื่อฟิลด์ (name)', '<input type="text" data-prop="name" value="' + esc(f.name) + '">', 'a-z 0-9 _ เท่านั้น'));
    h.push('<div class="prop-group"><label class="prop-check"><input type="checkbox" data-prop="required"' + (f.required ? ' checked' : '') + '> จำเป็นต้องกรอก</label></div>');
  }
  h.push('<div class="prop-row">' + group('X (mm)', numInput('pos_x', f.pos_x, 0, PAGE_W, 0.5)) + group('Y (mm)', numInput('pos_y', f.pos_y, 0, PAGE_H, 0.5)) + '</div>');
  h.push('<div class="prop-row">' + group('กว้าง (mm)', numInput('width', f.width, 3, PAGE_W, 0.5)) + group('สูง (mm)', numInput('height', f.height, 1, PAGE_H, 0.5)) + '</div>');
  if (ft !== 'divider' && ft !== 'logo') {
    h.push('<div class="prop-row">' + group('ขนาดฟอนต์ (px)', numInput('font_size', f.font_size, 6, 72, 1)) + group('น้ำหนัก', selectInput('font_weight', f.font_weight, [['normal', 'ปกติ'], ['bold', 'ตัวหนา']])) + '</div>');
    h.push(group('จัดแนว', selectInput('text_align', f.text_align, [['left', 'ซ้าย'], ['center', 'กลาง'], ['right', 'ขวา']])));
    h.push(group('สีข้อความ', '<input type="color" data-prop="text_color" value="' + toHex(f.text_color, '#111111') + '">'));
    h.push(group('สีพื้นหลัง', '<input type="color" data-prop="bg_color" value="' + toHex(f.bg_color, '#ffffff') + '"><label class="prop-check"><input type="checkbox" data-prop="bg_transparent"' + (f.bg_color === 'transparent' ? ' checked' : '') + '> โปร่งใส</label>'));
    h.push(group('เส้นขอบ', selectInput('border_style', f.border_style, [['none', 'ไม่มี'], ['dotted', 'จุด'], ['dashed', 'ประ'], ['solid', 'ทึบ']])));
  }
  if (ft !== 'logo') h.push(group(ft === 'divider' ? 'สีเส้น' : 'สีเส้นขอบ', '<input type="color" data-prop="border_color" value="' + toHex(f.border_color, '#333333') + '">'));
  return h.join('');
}

function showProperties(id) {
  const f = getField(id);
  if (!f) { $('#propertiesPanel').hidden = true; panelFieldId = null; return; }
  $('#propertiesPanel').hidden = false;
  if (panelFieldId === id) return;
  panelFieldId = id;
  propUndoArmed = false;
  $('#propertiesContent').innerHTML = propsHtml(f);

  if (f.field_type === 'logo') {
    const fileInput = $('#logoFileInput');
    const uploadBtn = $('#logoUploadBtn');
    const removeBtn = $('#logoRemoveBtn');
    if (uploadBtn) uploadBtn.addEventListener('click', () => { if (fileInput) fileInput.click(); });
    if (fileInput) {
      fileInput.addEventListener('change', e => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp'];
        if (allowed.indexOf(file.type) === -1) { toast('รูปแบบไฟล์ไม่ถูกต้อง'); return; }
        if (file.size > 50000) { toast('ไฟล์ใหญ่เกินไป (สูงสุด ~37 KB)'); return; }
        const reader = new FileReader();
        reader.onload = async ev => {
          showLoading();
          try {
            const result = await apiCall('uploadLogo', { base64Data: ev.target.result });
            hideLoading();
            const ff = getField(panelFieldId);
            if (ff) {
              pushUndo();
              ff.value = result.dataUrl;
              refreshFieldElement(ff);
              panelFieldId = null;
              showProperties(ff.id);
              markDirty();
              toast('อัปโหลดโลโก้สำเร็จ');
            }
          } catch (x) { hideLoading(); toast(err(x)); }
        };
        reader.readAsDataURL(file);
        fileInput.value = '';
      });
    }
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        const ff = getField(panelFieldId);
        if (ff) {
          pushUndo();
          ff.value = '';
          refreshFieldElement(ff);
          panelFieldId = null;
          showProperties(ff.id);
          markDirty();
          toast('ลบรูปแล้ว');
        }
      });
    }
  }
}

function syncGeometryInputs(f) {
  if (panelFieldId !== f.id) return;
  ['pos_x', 'pos_y', 'width', 'height'].forEach(k => {
    const i = $('#propertiesContent [data-prop="' + k + '"]');
    if (i && document.activeElement !== i) i.value = f[k];
  });
}

function clampField(f) {
  f.width = clamp(f.width, 3, PAGE_W);
  f.height = clamp(f.height, 1, PAGE_H);
  f.pos_x = clamp(f.pos_x, 0, Math.max(0, PAGE_W - f.width));
  f.pos_y = clamp(f.pos_y, 0, Math.max(0, PAGE_H - f.height));
  f.font_size = clamp(f.font_size, 6, 72);
}

function onPropEvent(e) {
  const t = e.target;
  const key = t.dataset && t.dataset.prop;
  if (!key) return;
  const f = getField(panelFieldId);
  if (!f) return;
  if (!propUndoArmed) { pushUndo(); propUndoArmed = true; }
  switch (key) {
    case 'text': f.value = t.value; f.label = t.value; break;
    case 'label': f.label = t.value; break;
    case 'value': f.value = t.value; break;
    case 'name': {
      const s = slugName(t.value);
      if (s !== t.value) t.value = s;
      f.name = s;
      break;
    }
    case 'options': f.options = t.value.split('\n').map(s => s.trim()).filter(Boolean); break;
    case 'required': f.required = t.checked; break;
    case 'bg_transparent': {
      const c = $('#propertiesContent [data-prop="bg_color"]');
      f.bg_color = t.checked ? 'transparent' : (c ? c.value : '#ffffff');
      break;
    }
    case 'bg_color': {
      f.bg_color = t.value;
      const cb = $('#propertiesContent [data-prop="bg_transparent"]');
      if (cb) cb.checked = false;
      break;
    }
    case 'pos_x': case 'pos_y': case 'width': case 'height': case 'font_size': {
      const n = parseFloat(t.value);
      if (!isFinite(n)) return;
      f[key] = n;
      clampField(f);
      if (e.type === 'change') syncGeometryInputs(f);
      break;
    }
    default: f[key] = t.value;
  }
  refreshFieldElement(f);
  markDirty();
}

$('#propertiesContent').addEventListener('input', onPropEvent);
$('#propertiesContent').addEventListener('change', onPropEvent);
$('#propertiesContent').addEventListener('focusout', () => { propUndoArmed = false; });

function validateBeforeSave() {
  if (!($('#builderTemplateName').value || '').trim()) return 'กรุณากรอกชื่อฟอร์ม';
  const seen = {};
  for (const f of state.fields) {
    if (!f.name) return 'มีฟิลด์ที่ยังไม่ได้ตั้งชื่อ';
    if (seen[f.name]) { selectField(f.id); return 'ชื่อฟิลด์ซ้ำกัน: ' + f.name; }
    seen[f.name] = true;
    if (OPTION_TYPES.includes(f.field_type) && !f.options.length) {
      selectField(f.id);
      return 'กรุณาใส่ตัวเลือกอย่างน้อย 1 ข้อ';
    }
  }
  return '';
}

async function saveForm() {
  if (!state.templateId) return;
  const problem = validateBeforeSave();
  if (problem) { toast(problem); return; }
  const meta = {
    name: $('#builderTemplateName').value.trim(),
    description: state.meta.description,
    is_active: $('#builderPublishToggle').checked
  };
  showLoading();
  try {
    const res = await apiCall('saveFormLayout', {
      templateId: state.templateId,
      meta: meta,
      fields: state.fields,
      deletedIds: state.deleted
    });
    hideLoading();
    const map = (res && res.idMap) || {};
    state.fields.forEach(f => {
      if (map[f.id]) {
        if (state.selectedId === f.id) state.selectedId = map[f.id];
        if (panelFieldId === f.id) panelFieldId = map[f.id];
        f.id = map[f.id];
      }
    });
    state.deleted = [];
    state.meta.name = meta.name;
    state.meta.is_active = meta.is_active;
    undoStack = [];
    updateUndoBtn();
    clearDirty();
    renderBuilderCanvas();
    toast('บันทึกสำเร็จ');
    loadTemplateList();
    cacheSet('publicForms', null);
  } catch (x) { hideLoading(); handleError(x); }
}
$('#saveFormBtn').addEventListener('click', saveForm);

$('#previewFormBtn').addEventListener('click', () => {
  closeAllModals();
  const canvas = renderFormOnCanvas('#previewCanvas', state.fields, 'fill');
  $('#previewModalTitle').textContent = 'Preview: ' + (state.meta.name || '');
  $('#previewModal').hidden = false;
  applyZoom(canvas, fitZoom($('#previewModal .modal-body')));
});

/* ============================================================
   ADMIN: SUBMISSIONS (filter + archive + download)
   ============================================================ */
function resetAdminSubmissions() {
  adminSelectedTemplateId = null;
  currentFilter = 'ALL';
  lastAdminSubmissions = [];
  adminSubmissionsSeq++;
  $('#adminSubmissionsToolbar').hidden = true;
  $('#submissionFilterTabs').hidden = true;
  $('#adminSubmissionsList').innerHTML = '<div class="empty">เลือกฟอร์มจากด้านซ้ายเพื่อดูคำขอ</div>';
  $$('#submissionFilterTabs .filter-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.filter === 'ALL'));
}

function renderAdminTemplateList() {
  $('#adminTemplateList').innerHTML = adminTemplates.length
    ? adminTemplates.map(t =>
      '<div class="sidebar-item ' + (t.id === adminSelectedTemplateId ? 'active' : '') +
      '" data-admin-template-id="' + esc(t.id) + '">' +
      '<div class="sidebar-item-name">' + esc(t.name) + '</div>' +
      '<div class="sidebar-item-status ' + (t.is_active ? 'active' : 'inactive') + '">' +
      (t.is_active ? '● ใช้งาน' : '○ ปิด') + '</div></div>'
    ).join('')
    : '<div class="empty" style="padding:10px;font-size:12px">ยังไม่มีฟอร์ม</div>';
}

async function loadAdminTemplateList() {
  try {
    adminTemplates = (await apiCall('getFormTemplates', {})) || [];
    if (adminSelectedTemplateId && !adminTemplates.some(t => t.id === adminSelectedTemplateId)) {
      resetAdminSubmissions();
    }
    renderAdminTemplateList();
    if (adminSelectedTemplateId) loadAdminSubmissions(adminSelectedTemplateId);
  } catch (e) { handleError(e); }
}

function selectAdminTemplate(templateId) {
  adminSelectedTemplateId = templateId;
  currentFilter = 'ALL';
  renderAdminTemplateList();
  $$('#submissionFilterTabs .filter-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.filter === 'ALL'));
  loadAdminSubmissions(templateId);
}

async function loadAdminSubmissions(templateId) {
  const seq = ++adminSubmissionsSeq;
  showLoading();
  try {
    let submissions;
    if (currentFilter === 'ARCHIVED') {
      submissions = await apiCall('getArchivedSubmissions', { templateId: templateId });
    } else {
      submissions = await apiCall('getFormSubmissionsFiltered', {
        templateId: templateId,
        status: currentFilter,
        archived: false
      });
    }
    if (seq !== adminSubmissionsSeq) return;
    lastAdminSubmissions = submissions || [];
    const tpl = adminTemplates.find(x => x.id === templateId);
    $('#adminSubmissionsTitle').textContent = tpl ? tpl.name : 'คำขอ';
    $('#adminSubmissionsCount').textContent = 'ทั้งหมด ' + lastAdminSubmissions.length + ' คำขอ';
    $('#adminSubmissionsToolbar').hidden = false;
    $('#submissionFilterTabs').hidden = false;

    if (!lastAdminSubmissions.length) {
      $('#adminSubmissionsList').innerHTML = '<div class="empty">' +
        (currentFilter === 'ARCHIVED' ? 'ไม่มีคำขอที่เก็บเข้าถาวร' : 'ไม่พบคำขอ') + '</div>';
    } else {
      $('#adminSubmissionsList').innerHTML = lastAdminSubmissions.map(s => {
        const isArchived = !!s.archived_at;
        const archiveBtn = isArchived
          ? '<button class="archive-btn unarchive-btn" type="button" data-unarchive="' + esc(s.id) + '">↩️ คืนจากถาวร</button>'
          : '<button class="archive-btn" type="button" data-archive="' + esc(s.id) + '">🗄️ เก็บถาวร</button>';
        const actionBtns = (s.status === 'SUBMITTED')
          ? '<button class="btn primary" type="button" data-approve="' + esc(s.id) + '">อนุมัติ</button>' +
            '<button class="btn ghost" type="button" data-reject="' + esc(s.id) + '">ปฏิเสธ</button>'
          : '';
        return '<article class="card">' +
          '<h3>คำขอ #' + esc(s.referenceId) + ' <span class="status" data-status="' + esc(s.status) + '">' +
          esc(STATUS_TH[s.status] || s.status) + (isArchived ? ' · 🗄️' : '') + '</span></h3>' +
          '<p class="meta">' + esc(s.submitted_by_name || '-') + '<br>ส่งเมื่อ: ' +
          esc(new Date(s.created_at).toLocaleString('th-TH')) +
          (isArchived ? '<br>เก็บถาวร: ' + esc(new Date(s.archived_at).toLocaleString('th-TH')) : '') + '</p>' +
          '<div class="card-actions">' +
          '<button class="btn secondary" type="button" data-view-sub="' + esc(s.id) + '">👁️ ดู</button>' +
          actionBtns +
          '<button class="btn ghost" type="button" data-print="' + esc(s.id) + '">🖨️ พิมพ์</button>' +
          '<button class="btn ghost" type="button" data-download-sub="' + esc(s.id) + '" title="ดาวน์โหลดฟอร์มที่กรอกแล้ว">📥</button>' +
          archiveBtn +
          '</div></article>';
      }).join('');
    }
    hideLoading();
  } catch (x) {
    if (seq === adminSubmissionsSeq) hideLoading();
    handleError(x);
  }
}

$('#adminTemplateList').addEventListener('click', e => {
  const item = e.target.closest('[data-admin-template-id]');
  if (item) selectAdminTemplate(item.dataset.adminTemplateId);
});

$('#refreshAdminSubmissionsBtn').addEventListener('click', () => {
  if (adminSelectedTemplateId) loadAdminSubmissions(adminSelectedTemplateId);
});

$('#submissionFilterTabs').addEventListener('click', e => {
  const tab = e.target.closest('[data-filter]');
  if (!tab || !adminSelectedTemplateId) return;
  $$('#submissionFilterTabs .filter-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  currentFilter = tab.dataset.filter;
  loadAdminSubmissions(adminSelectedTemplateId);
});

$('#adminSubmissionsList').addEventListener('click', async e => {
  const dlSub = e.target.closest('[data-download-sub]');
  if (dlSub) {
    const id = dlSub.dataset.downloadSub;
    const sub = lastAdminSubmissions.find(x => x.id === id);
    if (!sub || !adminSelectedTemplateId) return;
    showLoading();
    try {
      const tpl = await apiCall('getFormTemplate', { id: adminSelectedTemplateId });
      hideLoading();
      closeAllModals();
      openDownloadModal({
        fields: tpl.fields || [],
        data: sub.data || {},
        title: (tpl.name || 'แบบฟอร์ม') + ' · เลขอ้างอิง ' + (sub.referenceId || ''),
        filename: sanitizeFilename(tpl.name || 'form') + '_' + (sub.referenceId || String(id).slice(0, 8)),
        desc: 'ดาวน์โหลดฟอร์มที่กรอกข้อมูลแล้ว · ผู้ยื่น: ' + (sub.submitted_by_name || '-') +
          ' · เลขอ้างอิง ' + (sub.referenceId || '')
      });
    } catch (x) { hideLoading(); handleError(x); }
    return;
  }

  const archiveBtn = e.target.closest('[data-archive]');
  const unarchiveBtn = e.target.closest('[data-unarchive]');
  if (archiveBtn) {
    if (!confirm('เก็บคำขอนี้เข้าถาวร? (จะซ่อนจากรายการปกติ)')) return;
    showLoading();
    try {
      await apiCall('archiveSubmission', { id: archiveBtn.dataset.archive });
      hideLoading();
      toast('เก็บเข้าถาวรแล้ว');
      loadAdminSubmissions(adminSelectedTemplateId);
    } catch (x) { hideLoading(); handleError(x); }
    return;
  }
  if (unarchiveBtn) {
    showLoading();
    try {
      await apiCall('unarchiveSubmission', { id: unarchiveBtn.dataset.unarchive });
      hideLoading();
      toast('คืนจากรายการถาวรแล้ว');
      loadAdminSubmissions(adminSelectedTemplateId);
    } catch (x) { hideLoading(); handleError(x); }
    return;
  }

  const approve = e.target.closest('[data-approve]');
  const reject = e.target.closest('[data-reject]');
  const print = e.target.closest('[data-print]');
  const view = e.target.closest('[data-view-sub]');
  if (approve) setSubmissionStatus(approve.dataset.approve, 'APPROVED', 'อนุมัติแล้ว');
  else if (reject) setSubmissionStatus(reject.dataset.reject, 'REJECTED', 'ปฏิเสธแล้ว');
  else if (print) {
    showLoading();
    try {
      const r = await apiCall('printFormSubmission', { id: print.dataset.print });
      hideLoading();
      openPrintWindow(r, 'พิมพ์คำขอ');
    } catch (x) { hideLoading(); handleError(x); }
  }
  else if (view) viewSubmission(view.dataset.viewSub);
});

async function setSubmissionStatus(id, status, doneMsg) {
  showLoading();
  try {
    await apiCall('updateSubmissionStatus', { id: id, status: status });
    hideLoading();
    toast(doneMsg);
    if (adminSelectedTemplateId) loadAdminSubmissions(adminSelectedTemplateId);
  } catch (x) { hideLoading(); handleError(x); }
}

async function viewSubmission(id) {
  showLoading();
  try {
    const r = await apiCall('printFormSubmission', { id: id });
    hideLoading();
    viewingSubmissionId = id;
    viewingSubmissionCitizenId = null;
    $('#submissionModalTitle').textContent =
      (r.template && r.template.name ? r.template.name : 'คำขอ') + ' · #' + String(id).slice(0, 8).toUpperCase();
    const canvas = renderFormOnCanvas('#submissionCanvas', (r.fields || []).map(normalizeField), 'print', r.data || {});
    $('#submissionModal').hidden = false;
    applyZoom(canvas, fitZoom($('#submissionModal .modal-body')));
  } catch (x) { hideLoading(); handleError(x); }
}

/* ============================================================
   ADMIN: STAFF
   ============================================================ */
async function loadStaffDirectory() {
  try {
    const staff = await apiCall('getStaffDirectory', {});
    renderStaffList(staff);
  } catch (e) {
    handleError(e);
    $('#staffDirectoryList').innerHTML = '<div class="empty">ไม่มีสิทธิ์เข้าถึงข้อมูลนี้</div>';
  }
}

function renderStaffList(staff) {
  if (!staff || !staff.length) {
    $('#staffDirectoryList').innerHTML = '<div class="empty">ไม่พบข้อมูลบุคลากร</div>';
    return;
  }
  $('#staffDirectoryList').innerHTML = staff.map(s => `
    <div class="staff-card ${s.is_active ? '' : 'inactive'}">
      <div class="staff-header">
        <h3>${esc(s.prefix || '')} ${esc(s.full_name)}</h3>
        <span class="staff-status ${s.is_active ? 'active' : 'inactive'}">${s.is_active ? '✓ ทำงาน' : '✗ ไม่ทำงาน'}</span>
      </div>
      <div class="staff-info">
        <div class="staff-field"><span class="staff-label">ตำแหน่ง:</span><span>${esc(s.position || '-')}</span></div>
        <div class="staff-field"><span class="staff-label">แผนก:</span><span>${esc(s.department || '-')}</span></div>
        <div class="staff-field"><span class="staff-label">ประเภท:</span><span>${esc(s.employment_type || '-')}</span></div>
      </div>
      ${s.is_active
        ? `<button class="btn ghost danger btn-sm" type="button" data-deactivate="${esc(s.id)}">ปิดใช้งาน</button>`
        : `<button class="btn ghost secondary btn-sm" type="button" data-activate="${esc(s.id)}">เปิดใช้งาน</button>`}
    </div>
  `).join('');
}

$('#staffSearchInput').addEventListener('input', e => {
  clearTimeout(staffSearchTimer);
  const query = e.target.value.trim();
  staffSearchTimer = setTimeout(async () => {
    if (!query) { loadStaffDirectory(); return; }
    try {
      const results = await apiCall('searchStaff', { query: query });
      renderStaffList(results);
    } catch (x) { handleError(x); }
  }, 250);
});

$('#refreshStaffBtn').addEventListener('click', loadStaffDirectory);

$('#staffDirectoryList').addEventListener('click', async e => {
  const deactivateBtn = e.target.closest('[data-deactivate]');
  const activateBtn = e.target.closest('[data-activate]');
  if (deactivateBtn) {
    if (!confirm('ปิดใช้งานบุคลากรนี้?')) return;
    try {
      await apiCall('updateStaffStatus', { staffId: deactivateBtn.dataset.deactivate, isActive: false });
      toast('ปิดใช้งานแล้ว');
      loadStaffDirectory();
    } catch (x) { handleError(x); }
  }
  if (activateBtn) {
    try {
      await apiCall('updateStaffStatus', { staffId: activateBtn.dataset.activate, isActive: true });
      toast('เปิดใช้งานแล้ว');
      loadStaffDirectory();
    } catch (x) { handleError(x); }
  }
});

/* ============================================================
   ADMIN TABS
   ============================================================ */
$$('[data-admin-view]').forEach(t => t.addEventListener('click', () => {
  showAdminView(t.dataset.adminView);
  const v = t.dataset.adminView;
  if (v === 'adminFormListView') loadAdminFormList();
  if (v === 'adminMySubmissionsView') loadAdminMySubmissions();
  if (v === 'formBuilderView') { loadTemplateList(); if (state.templateId) setBuilderZoom(state.zoom); }
  if (v === 'adminSubmissionsView') loadAdminTemplateList();
  if (v === 'staffDirectoryView') loadStaffDirectory();
  if (v === 'headerLogoView') loadHeaderLogo();
}));

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();

  const cachedLogo = cacheGet('headerLogo');
  renderHeaderLogo(cachedLogo !== null ? cachedLogo : '');

  const cachedForms = cacheGet('publicForms');
  if (cachedForms && cachedForms.length) renderPublicFormList(cachedForms);

  showView('publicFormListView');

  getExportCss();
  loadHeaderLogo();
  refreshPublicFormList();

  if (accessToken) {
    apiCall('getSession', {}).then(session => {
      $('#sessionBadge').textContent = session.fullName + ' · ' + session.role;
      updateAuthUI();
    }).catch(() => {
      accessToken = null;
      try { localStorage.removeItem('access_token'); } catch (x) {}
      updateAuthUI();
    });
  }
});
