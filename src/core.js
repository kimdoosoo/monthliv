/* ================= core: utils, store, i18n, shared UI ================= */
const { h, render, Fragment } = preact;
const { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } = preactHooks;
const html = htm.bind(h);

/* ---------- dates & ids ---------- */
const z2 = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + z2(d.getMonth() + 1) + '-' + z2(d.getDate());
const today = () => ymd(new Date());
const nowIso = () => { const d = new Date(); return ymd(d) + 'T' + z2(d.getHours()) + ':' + z2(d.getMinutes()) + ':' + z2(d.getSeconds()); };
const pd = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const addDays = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return ymd(d); };
const addMonths = (s, n) => { const d = pd(s); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); return ymd(d); };
const daysBetween = (a, b) => Math.round((pd(b) - pd(a)) / 86400000);
const stayEnd = (ci, unit, qty) => unit === 'night' ? addDays(ci, qty) : unit === 'week' ? addDays(ci, 7 * qty) : addMonths(ci, qty);
const overlap = (a1, a2, b1, b2) => a1 < b2 && b1 < a2;
const maxDate = (a, b) => (a > b ? a : b);
const ALPH = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const rcode = n => { let s = ''; const a = new Uint32Array(n); crypto.getRandomValues(a); for (let i = 0; i < n; i++) s += ALPH[a[i] % ALPH.length]; return s; };
const rid = n => rcode(n).toLowerCase();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const plain = o => JSON.parse(JSON.stringify(o));
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const mergeDeep = (a, b) => { if (!isObj(a) || !isObj(b)) return b; const o = { ...a }; for (const k of Object.keys(b)) o[k] = isObj(b[k]) && isObj(a[k]) ? mergeDeep(a[k], b[k]) : b[k]; return o; };
const first = (...v) => { for (const x of v) if (typeof x === 'string' && x.trim()) return x; return ''; };
const cx = (...a) => a.filter(Boolean).join(' ');
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
const store = {
  get(k) { try { return localStorage.getItem('monthliv:' + k); } catch { return null; } },
  set(k, v) { try { if (v == null) localStorage.removeItem('monthliv:' + k); else localStorage.setItem('monthliv:' + k, v); } catch {} },
};

/* ---------- global state ---------- */
const COLS = ['branches', 'rooms', 'bookings', 'members', 'owners', 'coupons', 'wallet', 'tours', 'logs', 'i18n'];
const S = {
  mode: 'boot', backend: null, subs: [], canWrite: null, cloudEmpty: false,
  data: Object.fromEntries(COLS.map(c => [c, {}])),
  ver: 0,
  role: 'user',
  lang: 'ko',
  me: null,
  owner: null,
  toasts: [],
  modal: null,     // {kind, props}
  confirm: null,
  u: { route: { name: 'home' }, q: { q: '', ci: null, unit: 'month', qty: 1, guests: 1, types: [], opts: [], avail: false, sort: 'rec', max: 0 } },
  p: { tab: 'dash', branch: null },
  a: { tab: 'dash', edit: null, coupon: null, bkFilter: {} },
};
const listeners = new Set();
let emitQueued = false;
function emit() { if (emitQueued) return; emitQueued = true; queueMicrotask(() => { emitQueued = false; S.ver++; idxCache = null; listeners.forEach(f => f(S.ver)); }); }
function useVer() { const [v0, set] = useState(S.ver); useEffect(() => { const f = v => set(v); listeners.add(f); if (S.ver !== v0) set(S.ver); return () => listeners.delete(f); }, []); return S.ver; }
const all = col => Object.values(S.data[col] || {});
const get = (col, id) => (S.data[col] || {})[id];

/* ---------- data backends ----------
   artifact : Claude artifact runtime db (window.claude.use('db')), shared by viewers
   firebase : Cloud Firestore from config.js, shared by every visitor of the site
   local    : this browser only (localStorage), starts from the demo data       */
const CFG = window.MONTHLIV_CONFIG || {};
const LOCAL_KEY = 'data:v1';
const wq = {};
function chain(path, fn) { const p = (wq[path] || Promise.resolve()).then(fn); wq[path] = p.catch(() => {}); return p; }
async function put(col, id, doc) {
  doc = plain(doc);
  S.data[col] = { ...S.data[col], [id]: doc }; emit();
  if (S.mode === 'cloud') await cloudWrite(col, id, 'set', doc); else saveLocal();
}
async function patch(col, id, part) {
  const cur = get(col, id);
  if (!cur) return put(col, id, part);
  part = plain(part);
  S.data[col] = { ...S.data[col], [id]: mergeDeep(cur, part) }; emit();
  if (S.mode === 'cloud') await cloudWrite(col, id, 'merge', part); else saveLocal();
}
async function removeDoc(col, id) {
  const m = { ...S.data[col] }; delete m[id]; S.data[col] = m; emit();
  if (S.mode === 'cloud') await cloudWrite(col, id, 'del'); else saveLocal();
}
async function cloudWrite(col, id, op, body) {
  const path = col + '/' + id;
  const run = () => S.backend.write(col, id, op, body);
  try { await chain(path, run); }
  catch (e) {
    if (e && e.code === 'unavailable') {
      await sleep(400 + Math.random() * 700);
      try { await chain(path, run); return; } catch (e2) { return writeFail(e2); }
    }
    writeFail(e);
  }
}
let saveTimer = null;
function saveLocal() {
  if (S.mode !== 'local') return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => store.set(LOCAL_KEY, JSON.stringify(S.data)), 400);
}
function writeFail(e) {
  console.warn('write failed', e);
  const code = e && e.code;
  if (code === 'invalid_argument' || code === 'not_granted' || code === 'revoked' || code === 'capability_disabled' || code === 'permission-denied') {
    toSandbox();
    toast('쓰기 권한이 없어 변경 내용은 이 화면에서만 유지됩니다.');
  } else if (code === 'quota_exceeded') toast('공유 데이터 저장 공간이 가득 찼습니다. 지난 예약을 정리한 뒤 다시 시도하세요.', 'error');
  else if (code === 'resource_exhausted' || code === 'resource-exhausted') toast('요청이 많아 저장이 늦어지고 있습니다. 잠시 후 다시 시도하세요.', 'error');
  else toast('저장하지 못했습니다. 잠시 후 다시 시도하세요.', 'error');
}
function toSandbox() {
  S.subs.forEach(u => { try { u(); } catch {} });
  S.subs = []; S.data = plain(S.data); S.mode = 'sandbox'; emit();
}
const artifactBackend = db => ({
  kind: 'artifact',
  sub: (col, next, err) => db.collection(col).onSnapshot(next, err),
  write: (col, id, op, body) => { const ref = db.collection(col).doc(id); return op === 'set' ? ref.set(body) : op === 'merge' ? ref.update(body) : ref.delete(); },
});
const firebaseBackend = fs => ({
  kind: 'firebase',
  sub: (col, next, err) => fs.collection(col).onSnapshot(next, err),
  write: (col, id, op, body) => { const ref = fs.collection(col).doc(id); return op === 'set' ? ref.set(body) : op === 'merge' ? ref.set(body, { merge: true }) : ref.delete(); },
});
function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = () => rej(new Error('script ' + src)); document.head.appendChild(s); });
}
async function connectFirebase(cfg) {
  const V = '10.12.2';
  if (!window.firebase || !window.firebase.firestore) {
    await loadScript(`https://www.gstatic.com/firebasejs/${V}/firebase-app-compat.js`);
    await loadScript(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore-compat.js`);
  }
  const app = window.firebase.apps && window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(cfg);
  return firebaseBackend(app.firestore());
}

/* ---------- boot ---------- */
/* first visit: the browser's language when it is one of the built-in six, English for other languages */
function browserLang() {
  const list = ((navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language]).map(x => String(x || '').toLowerCase()).filter(Boolean);
  for (const l of list) {
    if (l.startsWith('zh')) return /-(tw|hk|mo|hant)/.test(l) ? 'zh-TW' : 'zh-CN';
    const base = l.split('-')[0];
    if (['ko', 'en', 'ja', 'vi'].includes(base)) return base;
  }
  return list.length ? 'en' : null;
}
async function boot() {
  S.lang = store.get('lang') || (CFG.autoLang !== false && browserLang()) || CFG.defaultLang || 'ko';
  S.me = store.get('me') || null;
  S.owner = store.get('owner') || null;
  const hash = (location.hash || '').replace('#', '');
  if (hash === 'pms' || hash === 'admin' || hash === 'user') S.role = hash;
  const C = window.claude;
  let backend = null, can = null;
  if (C && typeof C.use === 'function') {
    let db = null;
    try { db = await withTimeout(C.use('db'), 7000); } catch { db = null; }
    if (db) {
      backend = artifactBackend(db);
      let user = null;
      try { user = await withTimeout(C.use('user'), 4000); } catch { user = null; }
      if (user) { try { can = await withTimeout(user.can('data.write'), 3000); } catch { can = null; } }
    }
  } else if (CFG.firebase && CFG.firebase.projectId) {
    try { backend = await withTimeout(connectFirebase(CFG.firebase), 15000); } catch (e) { console.warn('firebase', e); backend = null; }
  }
  if (!backend) return startLocal();
  S.backend = backend; S.canWrite = can;
  const pending = new Set(COLS);
  let readErrors = 0;
  await new Promise(resolve => {
    const timer = setTimeout(resolve, 9000);
    const done = c => { if (pending.delete(c) && !pending.size) { clearTimeout(timer); resolve(); } };
    for (const c of COLS) {
      try {
        const un = backend.sub(c, snap => {
          const m = {};
          for (const d of snap.docs) if (d.exists) m[d.id] = d.data();
          S.data[c] = m;
          done(c);
          if (S.mode === 'cloud') emit();
        }, err => { console.warn('snapshot', c, err); readErrors++; done(c); if (err && err.code === 'revoked') toSandbox(); });
        S.subs.push(un);
      } catch (e) { console.warn(e); readErrors++; done(c); }
    }
  });
  if (readErrors >= COLS.length) {
    S.subs.forEach(u => { try { u(); } catch {} }); S.subs = [];
    startLocal(); toast('공유 데이터에 연결하지 못해 이 브라우저의 데모 데이터로 열었습니다.', 'error'); return;
  }
  S.mode = 'cloud';
  if (!Object.keys(S.data.branches).length) {
    if (can === false) { S.subs.forEach(u => { try { u(); } catch {} }); S.subs = []; return startLocal(); }
    S.cloudEmpty = true;
  }
  if (can === false) toSandbox();
  emit();
}
/* The sample bookings, stays, tours, coupons and logs were written for DEMO_BASE.
   They move forward with today's date so the demo never looks abandoned.
   Branch documents (real branch list, opening dates) are left exactly as written. */
function demoData() {
  const d = plain(DEMO);
  const shift = typeof DEMO_BASE === 'string' ? daysBetween(DEMO_BASE, today()) : 0;
  if (!(shift > 0)) return d;
  const re = /^(\d{4}-\d{2}-\d{2})(T[\d:.]+Z?)?$/;
  const mv = v => {
    if (typeof v === 'string') { const m = re.exec(v); return m ? addDays(m[1], shift) + (m[2] || '') : v; }
    if (Array.isArray(v)) return v.map(mv);
    if (isObj(v)) { const o = {}; for (const k of Object.keys(v)) o[k] = mv(v[k]); return o; }
    return v;
  };
  for (const c of Object.keys(d)) if (c !== 'branches') d[c] = mv(d[c]);
  for (const doc of Object.values(d.logs || {})) for (const it of doc.items || []) {
    if (!it.text || !it.at) continue;
    const at0 = addDays(it.at.slice(0, 10), -shift);
    it.text = it.text.replace(/(^|[^\d/])(\d{1,2})\/(\d{1,2})(?![\d/])/g, (all, pre, mo, da) => {
      let y = +at0.slice(0, 4), c0 = `${y}-${z2(+mo)}-${z2(+da)}`;
      const gap = daysBetween(at0, c0);
      if (gap > 183) c0 = `${y - 1}-${z2(+mo)}-${z2(+da)}`; else if (gap < -183) c0 = `${y + 1}-${z2(+mo)}-${z2(+da)}`;
      const n = pd(addDays(c0, shift));
      return `${pre}${n.getMonth() + 1}/${n.getDate()}`;
    });
  }
  return d;
}
function startLocal() {
  let saved = null;
  try { const raw = store.get(LOCAL_KEY); if (raw) saved = JSON.parse(raw); } catch { saved = null; }
  S.data = saved && saved.branches && Object.keys(saved.branches).length ? saved : demoData();
  for (const c of COLS) if (!S.data[c]) S.data[c] = {};
  S.mode = 'local'; emit();
}
async function seedDemo(onStep) {
  const ops = [], demo = demoData();
  for (const c of COLS) {
    if (c === 'i18n') continue;
    const want = demo[c] || {};
    for (const id of Object.keys(S.data[c] || {})) if (!want[id]) ops.push(['del', c, id]);
    for (const [id, doc] of Object.entries(want)) ops.push(['put', c, id, doc]);
  }
  let i = 0;
  for (const op of ops) {
    if (S.mode !== 'cloud') { break; }
    if (op[0] === 'del') await removeDoc(op[1], op[2]); else await put(op[1], op[2], op[3]);
    onStep && onStep(++i, ops.length);
    await sleep(25);
  }
  if (S.mode !== 'cloud') {
    const keep = S.data.i18n;
    S.data = demo; S.data.i18n = keep || {};
    for (const c of COLS) if (!S.data[c]) S.data[c] = {};
    emit(); saveLocal();
  }
  S.cloudEmpty = false; emit();
}

/* ---------- toasts / confirm / modal ---------- */
function toast(msg, kind) {
  const id = rid(6);
  S.toasts = [...S.toasts, { id, msg, kind }]; emit();
  setTimeout(() => { S.toasts = S.toasts.filter(t => t.id !== id); emit(); }, kind === 'error' ? 5200 : 3400);
}
function askConfirm(opts) { return new Promise(res => { S.confirm = { ...opts, res }; emit(); }); }
function openModal(kind, props) { S.modal = { kind, props: props || {} }; emit(); }
function closeModal() { S.modal = null; emit(); }

/* ---------- i18n ---------- */
const BUILTIN = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW', 'vi'];
const LOCALE = { ko: 'ko-KR', en: 'en-GB', ja: 'ja-JP', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', vi: 'vi-VN' };
const RTL = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'ckb', 'yi']);
const LANGS = [
  ['ko', '한국어', 'Korean'], ['en', 'English', 'English'], ['ja', '日本語', 'Japanese'], ['zh-CN', '简体中文', 'Chinese (Simplified)'],
  ['zh-TW', '繁體中文', 'Chinese (Traditional)'], ['vi', 'Tiếng Việt', 'Vietnamese'],
  ['th', 'ไทย', 'Thai'], ['id', 'Bahasa Indonesia', 'Indonesian'], ['ms', 'Bahasa Melayu', 'Malay'], ['tl', 'Filipino', 'Filipino'],
  ['mn', 'Монгол', 'Mongolian'], ['uz', 'Oʻzbekcha', 'Uzbek'], ['kk', 'Қазақша', 'Kazakh'], ['ky', 'Кыргызча', 'Kyrgyz'],
  ['ru', 'Русский', 'Russian'], ['uk', 'Українська', 'Ukrainian'], ['ne', 'नेपाली', 'Nepali'], ['hi', 'हिन्दी', 'Hindi'],
  ['bn', 'বাংলা', 'Bengali'], ['si', 'සිංහල', 'Sinhala'], ['my', 'မြန်မာ', 'Burmese'], ['km', 'ខ្មែរ', 'Khmer'], ['lo', 'ລາວ', 'Lao'],
  ['es', 'Español', 'Spanish'], ['fr', 'Français', 'French'], ['de', 'Deutsch', 'German'], ['it', 'Italiano', 'Italian'],
  ['pt-BR', 'Português (Brasil)', 'Portuguese (Brazil)'], ['pt-PT', 'Português (Portugal)', 'Portuguese (Portugal)'], ['nl', 'Nederlands', 'Dutch'],
  ['sv', 'Svenska', 'Swedish'], ['da', 'Dansk', 'Danish'], ['no', 'Norsk', 'Norwegian'], ['fi', 'Suomi', 'Finnish'], ['pl', 'Polski', 'Polish'],
  ['cs', 'Čeština', 'Czech'], ['hu', 'Magyar', 'Hungarian'], ['ro', 'Română', 'Romanian'], ['el', 'Ελληνικά', 'Greek'], ['tr', 'Türkçe', 'Turkish'],
  ['ar', 'العربية', 'Arabic'], ['he', 'עברית', 'Hebrew'], ['fa', 'فارسی', 'Persian'], ['ur', 'اردو', 'Urdu'],
  ['sw', 'Kiswahili', 'Swahili'], ['am', 'አማርኛ', 'Amharic'], ['ha', 'Hausa', 'Hausa'], ['yo', 'Yorùbá', 'Yoruba'], ['zu', 'isiZulu', 'Zulu'],
];
const langName = code => { const l = LANGS.find(x => x[0] === code); if (l) return l[1]; const c = get('i18n', code); return (c && c.name) || code; };
const isRtl = code => RTL.has(String(code).split('-')[0]);
const lookup = (d, k) => (d && Object.prototype.hasOwnProperty.call(d, k) && typeof d[k] === 'string' ? d[k] : undefined);
function t(key, vars) {
  const L = S.lang;
  const dicts = [I18N[L], !I18N[L] ? (get('i18n', L) || {}).ui : null, I18N.en, I18N.ko];
  let s = key;
  for (const d of dicts) {
    const v = lookup(d, key);
    if (v !== undefined) { s = vars && vars.n === 1 && lookup(d, key + '_one') !== undefined ? d[key + '_one'] : v; break; }
  }
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
  return s;
}
function tx(obj, key) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  const L = S.lang;
  const ai = !obj[L] && key ? ((get('i18n', L) || {}).content || {})[key] : null;
  return first(obj[L], ai, obj.en, obj.ko);
}
const loc = () => LOCALE[S.lang] || S.lang;
function fmtMoney(n) {
  n = Math.round(n || 0);
  if (S.lang === 'ko') return n.toLocaleString('ko-KR') + '원';
  try { return new Intl.NumberFormat(loc(), { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(n); } catch { return '₩' + n.toLocaleString('en'); }
}
function fmtShort(n) {
  if (S.lang === 'ko') return n >= 10000 ? (Math.round(n / 1000) / 10).toString().replace(/\.0$/, '') + '만' : n.toLocaleString('ko-KR');
  if (S.lang === 'ja' || S.lang.startsWith('zh')) return '₩' + (n >= 10000 ? (Math.round(n / 1000) / 10).toString().replace(/\.0$/, '') + (S.lang === 'ja' ? '万' : S.lang === 'zh-TW' ? '萬' : '万') : n);
  return '₩' + (n >= 1000 ? Math.round(n / 1000) + 'K' : n);
}
function fmtDate(s, opts) {
  if (!s) return '';
  try { return new Intl.DateTimeFormat(loc(), opts || { month: 'short', day: 'numeric', weekday: 'short' }).format(pd(s)); } catch { return s; }
}
const fmtDateLong = s => fmtDate(s, { year: 'numeric', month: 'short', day: 'numeric' });
/* console (PMS/Admin) always Korean */
const won = n => Math.round(n || 0).toLocaleString('ko-KR') + '원';
const kd = s => { if (!s) return '—'; const d = pd(s); return `${d.getMonth() + 1}.${d.getDate()}`; };
const kdy = s => { if (!s) return '—'; const d = pd(s); return `${d.getFullYear()}.${z2(d.getMonth() + 1)}.${z2(d.getDate())}`; };
const kdt = s => { if (!s) return '—'; const d = pd(s); return `${d.getMonth() + 1}.${d.getDate()} ${String(s).slice(11, 16)}`; };
const KO_WD = ['일', '월', '화', '수', '목', '금', '토'];
const kdw = s => { const d = pd(s); return `${d.getMonth() + 1}.${d.getDate()} (${KO_WD[d.getDay()]})`; };

/* ---------- domain helpers ---------- */
const TYPES = ['stay', 'hostel', 'residence', 'hotel'];
const UNITS = ['night', 'week', 'month'];
const LINE_COLORS = { '1': '#0052A4', '2': '#00A84D', '3': '#EF7C1C', '4': '#00A5DE', '5': '#996CAC', '6': '#CD7C2F', '7': '#747F00', '8': '#E6186C', '9': '#BDB092', GJ: '#77C4A3', SB: '#D99B00', SL: '#6789CA', SBD: '#D4003B', AREX: '#0090D2', UI: '#B0CE18' };
const LINE_LIST = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'GJ', 'SB', 'SL', 'SBD', 'AREX', 'UI'];
const AMENITIES = ['private_bath', 'aircon', 'wifi', 'desk', 'fridge', 'washer', 'kitchen', 'kitchenette', 'lounge', 'towels', 'luggage', 'elevator', 'smartlock', 'cctv'];
const HIGHLIGHTS = ['flagship', 'near_station', 'long_stay', 'short_stay', 'business', 'university', 'hospital', 'family', 'foreigner', 'new_open', 'quiet', 'airport', 'nature'];
const AMEN_ICON = { private_bath: 'bath', aircon: 'aircon', wifi: 'wifi', desk: 'desk', fridge: 'fridge', washer: 'washer', kitchen: 'kitchen', kitchenette: 'kitchen', lounge: 'sofa', towels: 'towel', luggage: 'luggage', elevator: 'elevator', smartlock: 'lock', cctv: 'cctv' };
const lineLabel = l => (/^\d$/.test(l) ? l : t('line.' + l));
const bName = b => tx(b.name, `b.${b.id}.name`);
const bArea = b => tx(b.area, `b.${b.id}.area`);
const bStation = b => tx(b.station, `b.${b.id}.station`);
const bDesc = b => tx(b.desc, `b.${b.id}.desc`);
const bTitle = b => t('branch.title', { name: bName(b), type: t('type.' + b.type) });
const rtName = (b, rt) => tx(rt.name, `b.${b.id}.t.${rt.id}`);
const cpName = c => (c ? first(c.name && c.name[S.lang], c.name && (S.lang === 'ko' ? c.name.ko : c.name.en), c.name && c.name.ko) : '');
const publicBranches = () => all('branches').filter(b => b.status === 'open' || b.status === 'soon');
const minPrice = (b, unit) => { const v = b.types.map(r => r.price[unit]).filter(x => x != null); return v.length ? Math.min(...v) : null; };
const bestUnit = b => (b.type === 'stay' ? 'month' : 'night');
function nightsLabel(n) {
  if (!n) return '';
  if (n % 28 === 0 && n >= 28) return t('cond.months', { n: n / 28 });
  if (n % 7 === 0) return t('cond.weeks', { n: n / 7 });
  return t('cond.nights', { n });
}

/* bookings index for availability */
let idxCache = null;
function bkIndex() {
  if (idxCache) return idxCache;
  const m = {};
  for (const bk of all('bookings')) {
    if (!bk.roomNo || !(bk.status === 'confirmed' || bk.status === 'staying')) continue;
    const k = bk.branchId + '/' + bk.roomNo;
    (m[k] = m[k] || []).push(bk);
  }
  idxCache = m; return m;
}
function roomFree(branchId, rm, ci, co, ignore) {
  if (rm.flag === 'mnt') return false;
  if (rm.occ && rm.occ.until > ci) return false;
  for (const bk of bkIndex()[branchId + '/' + rm.no] || []) {
    if (bk.id === ignore) continue;
    if (overlap(ci, co, bk.checkIn, bk.checkOut)) return false;
  }
  return true;
}
function availFor(b, rtId, ci, co) {
  const list = (get('rooms', b.id) || {}).list || [];
  return list.filter(r => r.t === rtId && roomFree(b.id, r, ci, co)).length;
}
function availBranch(b, ci, unit, qty, guests) {
  const start = b.status === 'soon' && b.openDate && ci < b.openDate ? b.openDate : ci;
  const co = stayEnd(start, unit, qty);
  let n = 0;
  for (const rt of b.types) if (rt.price[unit] != null && rt.cap >= (guests || 1)) n += availFor(b, rt.id, start, co);
  return n;
}
/* the room's state right now (PMS view) */
function roomNow(branchId, rm) {
  const td = today();
  const bks = (bkIndex()[branchId + '/' + rm.no] || []).slice().sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1));
  const staying = bks.find(b => b.status === 'staying');
  const upcoming = bks.find(b => b.status === 'confirmed' && b.checkOut > td);
  if (rm.flag === 'mnt') return { s: 'mnt', next: upcoming };
  if (staying) return { s: 'occ', bk: staying, until: staying.checkOut, next: upcoming };
  if (rm.occ && rm.occ.until > td) return { s: 'occ', legacy: true, until: rm.occ.until, next: upcoming };
  if (rm.flag === 'cln') return { s: 'cln', next: upcoming };
  if (upcoming) return { s: 'res', bk: upcoming, from: upcoming.checkIn, next: upcoming };
  return { s: 'vac' };
}
const ROOM_ST = { occ: ['입실 중', 'bed'], res: ['입실 예정', 'calendar'], vac: ['공실', 'door'], cln: ['청소 필요', 'broom'], mnt: ['점검 중', 'wrench'] };

/* ---------- coupons ---------- */
const couponOf = w => (w ? get('coupons', w.couponId) : null);
function couponDiscount(c, base) {
  if (!c) return 0;
  if (c.dtype === 'amount') return Math.min(c.value, base);
  let d = Math.floor((base * c.value) / 100 / 100) * 100;
  if (c.max) d = Math.min(d, c.max);
  return d;
}
function walletState(w) {
  if (!w) return 'void';
  if (w.status === 'used') return 'used';
  if (w.status === 'void') return 'void';
  const c = couponOf(w);
  if (!c) return 'void';
  if (c.status === 'ended') return 'ended';
  if (today() > c.to) return 'expired';
  if (today() < c.from) return 'notyet';
  if (c.status === 'paused') return 'paused';
  return 'active';
}
/* ctx: {b: branch, unit, nights, base} */
function couponFit(c, ctx) {
  if (!c) return { ok: false, why: t('cp.err.notfound') };
  if (c.status !== 'active') return { ok: false, why: t('cp.err.inactive') };
  if (today() > c.to) return { ok: false, why: t('cp.err.expired') };
  if (today() < c.from) return { ok: false, why: t('cp.err.notyet', { date: fmtDateLong(c.from) }) };
  if (!ctx) return { ok: true };
  if (c.scope === 'branches' && !(c.branchIds || []).includes(ctx.b.id)) return { ok: false, why: t('cp.err.branch') };
  if ((c.types || []).length && !c.types.includes(ctx.b.type)) return { ok: false, why: t('cp.err.type', { types: c.types.map(x => t('type.' + x)).join(', ') }) };
  if (c.minNights && ctx.nights < c.minNights) return { ok: false, why: t('cp.err.minNights', { n: nightsLabel(c.minNights) }) };
  if (c.minAmount && ctx.base < c.minAmount) return { ok: false, why: t('cp.err.minAmount', { amount: fmtMoney(c.minAmount) }) };
  return { ok: true };
}
function couponCond(c) {
  const p = [];
  if (c.minNights) p.push(t('cp.cond.minNights', { n: nightsLabel(c.minNights) }));
  if (c.minAmount) p.push(t('cp.cond.minAmount', { amount: fmtMoney(c.minAmount) }));
  if (c.dtype === 'percent' && c.max) p.push(t('cp.cond.max', { amount: fmtMoney(c.max) }));
  if (c.scope === 'branches') p.push((c.branchIds || []).map(id => { const b = get('branches', id); return b ? bName(b) : id; }).join(', '));
  if ((c.types || []).length) p.push(c.types.map(x => t('type.' + x)).join('·'));
  return p.join(' · ');
}
function couponAmt(c) { return c.dtype === 'percent' ? c.value + '%' : fmtShortWon(c.value); }
function fmtCompactWon(v) {
  if (S.lang === 'ko') return fmtShortWon(v);
  try { return new Intl.NumberFormat(loc(), { style: 'currency', currency: 'KRW', notation: 'compact', maximumFractionDigits: 1 }).format(v); } catch { return fmtMoney(v); }
}
function fmtShortWon(v) { if (S.lang === 'ko') return v >= 10000 && v % 10000 === 0 ? (v / 10000) + '만원' : v.toLocaleString('ko-KR') + '원'; return fmtMoney(v); }
const normCode = s => String(s || '').toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '');
async function redeemCode(userId, raw) {
  let code = normCode(raw);
  if (!code) return { ok: false, msg: t('cp.err.empty') };
  let c = all('coupons').find(x => x.kind === 'code' && x.code === code), via = 'code';
  if (!c) {
    const flat = code.replace(/-/g, '');
    for (const x of all('coupons')) {
      if (x.kind !== 'unique' || !x.codes) continue;
      const k = Object.keys(x.codes).find(k => k.replace(/-/g, '') === flat);
      if (k) { c = x; code = k; via = 'unique'; break; }
    }
  }
  if (!c) return { ok: false, msg: t('cp.err.notfound') };
  const fit = couponFit(c);
  if (!fit.ok) return { ok: false, msg: fit.why };
  const mine = all('wallet').filter(w => w.userId === userId && w.couponId === c.id && w.status !== 'void');
  if (via === 'unique') {
    const st = c.codes[code] || {};
    if (st.s === 'used' && st.u !== userId) return { ok: false, msg: t('cp.err.taken') };
    if (st.u && st.u !== userId) return { ok: false, msg: t('cp.err.taken') };
    if (st.u === userId) { const w = mine.find(w => w.code === code); if (w && w.status === 'active') return { ok: true, already: true, walletId: w.id, coupon: c }; return { ok: false, msg: t('cp.err.used') }; }
  }
  if (mine.length >= (c.perUser || 1)) {
    const usable = mine.find(w => w.status === 'active');
    if (usable) return { ok: true, already: true, walletId: usable.id, coupon: c };
    return { ok: false, msg: t('cp.err.used') };
  }
  if (c.limit && all('wallet').filter(w => w.couponId === c.id && w.status !== 'void').length >= c.limit) return { ok: false, msg: t('cp.err.soldout') };
  const wid = 'w-' + rid(10);
  await put('wallet', wid, { id: wid, couponId: c.id, userId, via, code, issuedAt: nowIso(), by: 'self', status: 'active', usedAt: null, bookingId: null });
  if (via === 'unique') await patch('coupons', c.id, { codes: { [code]: { u: userId, s: 'reg' } } });
  return { ok: true, walletId: wid, coupon: c };
}
async function sendCoupon(couponId, ids, by) {
  const c = get('coupons', couponId);
  const res = { sent: [], missing: [], skipped: [] };
  const seen = new Set();
  for (const raw of ids) {
    const id = String(raw || '').trim().toLowerCase();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (!get('members', id)) { res.missing.push(id); continue; }
    const mine = all('wallet').filter(w => w.userId === id && w.couponId === couponId && w.status !== 'void');
    if (mine.length >= (c.perUser || 1)) { res.skipped.push(id); continue; }
    const wid = 'w-' + rid(10);
    await put('wallet', wid, { id: wid, couponId, userId: id, via: 'direct', code: null, issuedAt: nowIso(), by, status: 'active', usedAt: null, bookingId: null });
    res.sent.push(id);
  }
  if (res.sent.length && by.startsWith('pms:')) await addLog(by.slice(4), 'coupon', `쿠폰 발송 · ${c.name.ko} → ${res.sent.join(', ')}`);
  return res;
}

/* ---------- bookings ---------- */
async function addLog(branchId, kind, text) {
  const cur = get('logs', branchId);
  const items = [{ at: nowIso(), kind, text }, ...((cur && cur.items) || [])].slice(0, 40);
  await put('logs', branchId, { branchId, items });
}
const UNIT_KO = { night: '박', week: '주', month: '개월' };
async function createBooking(o) {
  const b = get('branches', o.branchId);
  const rt = b.types.find(x => x.id === o.typeId);
  const co = stayEnd(o.ci, o.unit, o.qty);
  const room = ((get('rooms', b.id) || {}).list || []).find(r => r.t === rt.id && roomFree(b.id, r, o.ci, co));
  if (!room) throw { key: 'book.err.soldout' };
  const unitPrice = rt.price[o.unit];
  const base = unitPrice * o.qty;
  let disc = 0, cp = null, w = null, c = null;
  if (o.walletId) {
    w = get('wallet', o.walletId); c = couponOf(w);
    const fit = couponFit(c, { b, unit: o.unit, nights: daysBetween(o.ci, co), base });
    if (walletState(w) !== 'active' || !fit.ok) throw { key: 'book.err.coupon' };
    disc = couponDiscount(c, base);
    cp = { walletId: w.id, couponId: c.id, name: c.name, discount: disc, funder: c.funder, code: w.code || null };
  }
  const deposit = o.unit === 'month' ? b.deposit || 0 : 0;
  const now = nowIso();
  const code = 'ML' + now.slice(2, 10).replace(/-/g, '') + '-' + rcode(4);
  const id = 'bk-' + code.slice(2).replace('-', '').toLowerCase();
  const doc = {
    id, code, userId: o.userId, branchId: b.id, typeId: rt.id, roomNo: room.no,
    unit: o.unit, qty: o.qty, checkIn: o.ci, checkOut: co, nights: daysBetween(o.ci, co), guests: o.guests,
    price: { unit: unitPrice, base, discount: disc, deposit, total: base - disc + deposit },
    coupon: cp, guest: o.guest, pay: { method: o.pay, paidAt: now }, status: 'confirmed', createdAt: now, lang: S.lang, source: 'web', ext: [],
  };
  await put('bookings', id, doc);
  if (w) {
    await patch('wallet', w.id, { status: 'used', usedAt: now, bookingId: id });
    if (w.via === 'unique' && w.code) await patch('coupons', c.id, { codes: { [w.code]: { u: o.userId, s: 'used' } } });
  }
  await addLog(b.id, 'booking', `신규 예약 ${code} · ${rt.name.ko} ${kd(o.ci)}~${kd(co)} (${o.qty}${UNIT_KO[o.unit]}) · ${room.no}호 · 결제 ${won(doc.price.total)}` + (cp ? ` · 쿠폰 -${won(disc)}` : ''));
  return id;
}
async function cancelBooking(id, by) {
  const bk = get('bookings', id); if (!bk) return;
  await patch('bookings', id, { status: 'cancelled', cancelledAt: nowIso(), cancelledBy: by || 'user' });
  if (bk.coupon && bk.coupon.walletId) {
    const w = get('wallet', bk.coupon.walletId);
    if (w) {
      await patch('wallet', w.id, { status: 'active', usedAt: null, bookingId: null });
      if (w.via === 'unique' && w.code) await patch('coupons', w.couponId, { codes: { [w.code]: { u: w.userId, s: 'reg' } } });
    }
  }
  await addLog(bk.branchId, 'cancel', `예약 취소 ${bk.code} · 환불 ${won(bk.price.total)}` + (bk.coupon ? ' · 쿠폰 복원' : ''));
}
async function extendBooking(id, months) {
  const bk = get('bookings', id); const b = get('branches', bk.branchId);
  const rt = b.types.find(x => x.id === bk.typeId);
  const newEnd = addMonths(bk.checkOut, months);
  const rm = ((get('rooms', b.id) || {}).list || []).find(r => r.no === bk.roomNo);
  if (rm && !roomFree(b.id, { ...rm, occ: null, flag: null }, bk.checkOut, newEnd, bk.id)) throw { key: 'my.err.extend' };
  const amount = (rt.price.month || 0) * months;
  const ext = [...(bk.ext || []), { months, at: nowIso(), amount, from: bk.checkOut }];
  await patch('bookings', id, { checkOut: newEnd, nights: daysBetween(bk.checkIn, newEnd), ext });
  await addLog(b.id, 'ext', `연장 결제 ${bk.code} · ${months}개월 · ${won(amount)} · ${kd(newEnd)}까지`);
}
async function setRoom(branchId, no, change) {
  const doc = get('rooms', branchId); if (!doc) return;
  const list = doc.list.map(r => (r.no === no ? { ...r, ...change } : r));
  await put('rooms', branchId, { ...doc, list });
}
async function checkIn(id) {
  const bk = get('bookings', id);
  await patch('bookings', id, { status: 'staying', checkedInAt: nowIso() });
  if (bk.roomNo) await setRoom(bk.branchId, bk.roomNo, { flag: null });
  await addLog(bk.branchId, 'checkin', `입실 완료 ${bk.code} · ${bk.roomNo}호`);
}
async function checkOut(id) {
  const bk = get('bookings', id);
  await patch('bookings', id, { status: 'done', checkedOutAt: nowIso() });
  if (bk.roomNo) await setRoom(bk.branchId, bk.roomNo, { flag: 'cln' });
  await addLog(bk.branchId, 'checkout', `퇴실 완료 ${bk.code} · ${bk.roomNo}호 청소 요청`);
}
async function requestTour(o) {
  const id = 'tr-' + rid(8);
  await put('tours', id, { id, branchId: o.branchId, userId: o.userId || null, name: o.name, phone: o.phone, date: o.date, time: o.time, status: 'requested', createdAt: nowIso(), note: o.note || '' });
  await addLog(o.branchId, 'tour', `룸투어 신청 · ${o.name} · ${kd(o.date)} ${o.time}`);
  return id;
}

/* ---------- AI translation (Claude sample capability, or Google Translation API) ---------- */
let sampleFn;
async function getSample() {
  if (sampleFn !== undefined) return sampleFn;
  const C = window.claude;
  if (!C || typeof C.use !== 'function') return (sampleFn = null);
  try { sampleFn = await withTimeout(C.use('sample'), 8000); } catch { sampleFn = null; }
  return sampleFn;
}
function contentSource() {
  const o = {};
  for (const b of publicBranches()) {
    o[`b.${b.id}.name`] = first(b.name.en, b.name.ko);
    o[`b.${b.id}.area`] = first(b.area.en, b.area.ko);
    o[`b.${b.id}.station`] = first(b.station.en, b.station.ko);
    o[`b.${b.id}.desc`] = first(b.desc.en, b.desc.ko);
    for (const rt of b.types) o[`b.${b.id}.t.${rt.id}`] = first(rt.name.en, rt.name.ko);
  }
  return o;
}
function trPrompt(obj, what, nameEn, native, code) {
  return `You are translating ${what} for "monthliv", a website for booking rooms in Seoul (private rooms by the month, hostels and residences).\n` +
    `Translate every value of the JSON object below from English into ${nameEn} (${native}, language code "${code}").\n` +
    `Rules:\n- Keep every key exactly as it is.\n- Keep placeholders in curly braces such as {n}, {date}, {name} exactly as they are.\n` +
    `- Keep the brand name "monthliv" in lowercase Latin letters.\n- Keep numbers, ㎡, currency symbols and coupon codes unchanged.\n` +
    `- Use short, natural wording that fits buttons, labels and menus on a booking website.\n` +
    `Reply with only the JSON object.\n\n` + JSON.stringify(obj);
}
/* machine translation outside Claude: Google Cloud Translation API v2 (key in config.js) */
const GT_CODE = { he: 'iw', 'pt-BR': 'pt', 'pt-PT': 'pt-PT', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW' };
const gtProtect = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/\{(\w+)\}/g, '<span translate="no">{$1}</span>').replace(/monthliv/g, '<span translate="no">monthliv</span>');
function gtUnprotect(s) {
  const plainText = String(s).replace(/<span[^>]*>(.*?)<\/span>/g, '$1').replace(/<[^>]+>/g, '');
  const ta = document.createElement('textarea'); ta.innerHTML = plainText; return ta.value;
}
const canTranslate = async () => !!(await getSample()) || !!CFG.translateApiKey;
async function gTranslate(texts, target, signal, onChunk) {
  const out = [];
  for (let i = 0; i < texts.length; i += 100) {
    const chunk = texts.slice(i, i + 100);
    let r;
    try {
      r = await fetch('https://translation.googleapis.com/language/translate/v2?key=' + encodeURIComponent(CFG.translateApiKey), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
        body: JSON.stringify({ q: chunk.map(gtProtect), target, source: 'en', format: 'html' }),
      });
    } catch (e) { throw { code: e && e.name === 'AbortError' ? 'cancelled' : 'upstream_error', message: String(e) }; }
    if (!r.ok) throw { code: r.status === 403 || r.status === 400 ? 'not_granted' : r.status === 429 ? 'rate_limited' : 'upstream_error', message: 'translate ' + r.status };
    const j = await r.json();
    out.push(...((j.data && j.data.translations) || []).map(x => gtUnprotect(x.translatedText)));
    onChunk && onChunk(Math.min(texts.length, i + 100) / texts.length);
  }
  return out;
}
async function gTranslateLang(code, nameEn, native, onProgress, signal) {
  const ui = I18N.en, content = contentSource();
  const rows = [...Object.keys(ui).map(k => ['ui', k, ui[k]]), ...Object.keys(content).map(k => ['ct', k, content[k]])];
  const todo = rows.filter(r => String(r[2] || '').trim());
  const res = await gTranslate(todo.map(r => r[2]), GT_CODE[code] || code, signal, p => onProgress && onProgress(Math.min(0.98, p)));
  const doc = { lang: code, name: native, nameEn, ui: {}, content: {}, at: nowIso(), v: I18N_VERSION, engine: 'google' };
  for (const r of rows) if (!String(r[2] || '').trim() && r[0] === 'ui') doc.ui[r[1]] = '';
  todo.forEach((r, i) => { if (res[i]) (r[0] === 'ui' ? doc.ui : doc.content)[r[1]] = res[i]; });
  await put('i18n', code, doc);
  return doc;
}
async function aiTranslate(code, nameEn, native, onProgress, signal) {
  const sample = await getSample();
  if (!sample && CFG.translateApiKey) return gTranslateLang(code, nameEn, native, onProgress, signal);
  if (!sample) throw { code: 'unavailable' };
  const ui = I18N.en, content = contentSource();
  const total = Object.keys(ui).length + Object.keys(content).length;
  const prog = { a: 0, b: 0 };
  const tick = (k, text) => { prog[k] = (text.match(/":\s*"/g) || []).length; onProgress && onProgress(Math.min(0.98, (prog.a + prog.b) / total)); };
  const opts = k => ({ signal, modelTier: 'default', cache: { gcTime: 86400000 }, onText: ({ text }) => tick(k, text) });
  const [u, c] = await Promise.all([
    sample.json(trPrompt(ui, 'the interface text', nameEn, native, code), opts('a')),
    sample.json(trPrompt(content, 'branch names and descriptions', nameEn, native, code), opts('b')),
  ]);
  const clean = (src, out) => { const r = {}; for (const k of Object.keys(src)) if (out && typeof out[k] === 'string' && out[k].trim()) r[k] = out[k]; return r; };
  const doc = { lang: code, name: native, nameEn, ui: clean(ui, u), content: clean(content, c), at: nowIso(), v: I18N_VERSION };
  await put('i18n', code, doc);
  return doc;
}
async function aiFillBranch(src) {
  const sample = await getSample();
  const obj = { name: src.name.en || src.name.ko, area: src.area.en || src.area.ko, station: src.station.en || src.station.ko, desc: src.desc.en || src.desc.ko };
  for (const rt of src.types) obj['type_' + rt.id] = rt.name.en || rt.name.ko;
  if (!sample && CFG.translateApiKey) {
    const keys = Object.keys(obj).filter(k => String(obj[k] || '').trim());
    const out = {};
    for (const L of ['ja', 'zh-CN', 'zh-TW', 'vi']) {
      const res = await gTranslate(keys.map(k => obj[k]), L);
      out[L] = {}; keys.forEach((k, i) => { out[L][k] = res[i]; });
    }
    return out;
  }
  if (!sample) throw { code: 'unavailable' };
  const out = await sample.json(
    'Translate the English values of this JSON object for a Seoul accommodation website into Japanese, Simplified Chinese, Traditional Chinese and Vietnamese. ' +
    'Reply with only a JSON object of the form {"ja": {...}, "zh-CN": {...}, "zh-TW": {...}, "vi": {...}} where each inner object has exactly the same keys as the input. ' +
    'Keep "monthliv" in lowercase Latin letters and keep numbers unchanged.\n\n' + JSON.stringify(obj), { modelTier: 'default' });
  return out;
}
const aiErr = e => {
  const c = e && e.code;
  if (c === 'not_granted' || c === 'sampling_disabled' || c === 'unavailable' || c === 'not_declared' || c === 'capability_disabled') return t('ai.err.unavailable');
  if (c === 'rate_limited') return t('ai.err.rate');
  if (c === 'invalid_json') return t('ai.err.json');
  if (c === 'cancelled') return '';
  return t('ai.err.generic');
};

/* ---------- icons ---------- */
const ICONS = {
  search: 'M10.5 4a6.5 6.5 0 1 1 0 13a6.5 6.5 0 0 1 0-13z M15.5 15.5 20 20',
  pin: 'M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11-6.5 11z M12 7.5a2.5 2.5 0 1 1 0 5a2.5 2.5 0 0 1 0-5z',
  calendar: 'M4.5 6.5h15v13h-15z M4.5 10.5h15 M8.5 4v4 M15.5 4v4',
  user: 'M12 12a4 4 0 1 0 0-8a4 4 0 0 0 0 8z M4.5 20c1.2-3.6 4.2-5.5 7.5-5.5s6.3 1.9 7.5 5.5',
  users: 'M9 11.5a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7z M3 19.5c.8-3 3.1-4.5 6-4.5s5.2 1.5 6 4.5 M16 4.8a3.5 3.5 0 0 1 0 6.4 M17.5 15.2c1.7.6 2.9 2 3.5 4.3',
  globe: 'M12 3a9 9 0 1 1 0 18a9 9 0 0 1 0-18z M3 12h18 M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9 M12 3c-2.6 2.6-3.8 5.6-3.8 9s1.2 6.4 3.8 9',
  map: 'M9 5 3.5 7v12L9 17l6 2 5.5-2V5L15 7 9 5z M9 5v12 M15 7v12',
  list: 'M8.5 7h11 M8.5 12h11 M8.5 17h11 M4.5 7h.01 M4.5 12h.01 M4.5 17h.01',
  close: 'M6 6l12 12 M18 6 6 18',
  check: 'M5 12.5 10 17.5 19 7',
  chevR: 'M9.5 6l6 6-6 6', chevL: 'M14.5 6l-6 6 6 6', chevD: 'M6 9.5l6 6 6-6',
  arrowR: 'M5 12h14 M13 6l6 6-6 6', arrowL: 'M19 12H5 M11 6l-6 6 6 6',
  bed: 'M3.5 18.5v-12 M3.5 15h17v3.5 M20.5 15v-2.5a3 3 0 0 0-3-3h-7.5V15 M7 12.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3z',
  bath: 'M4 12h16v2.5a4.5 4.5 0 0 1-4.5 4.5h-7A4.5 4.5 0 0 1 4 14.5V12z M6.5 12V6.5a2 2 0 0 1 3.9-.6 M7.5 19l-1 2 M16.5 19l1 2',
  window: 'M5 4.5h14v15H5z M12 4.5v15 M5 12h14',
  wifi: 'M4 9.5a12 12 0 0 1 16 0 M7 12.8a7.5 7.5 0 0 1 10 0 M10 16a3 3 0 0 1 4 0 M12 19h.01',
  washer: 'M5.5 3.5h13v17h-13z M5.5 7.5h13 M12 10a4 4 0 1 1 0 8a4 4 0 0 1 0-8z M8 5.5h.01 M10.5 5.5h.01',
  kitchen: 'M7 3.5v7 M5 3.5v4a2 2 0 0 0 4 0v-4 M7 10.5v10 M17 3.5v17 M17 3.5c-2 1-3 3-3 6v3h3',
  sofa: 'M5 11V8.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2V11 M3.5 11.5a1.5 1.5 0 0 1 3 0V14h11v-2.5a1.5 1.5 0 0 1 3 0V17h-17z M6 17v2 M18 17v2',
  lock: 'M6.5 10.5h11v9h-11z M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5 M12 14v2.5',
  cctv: 'M3.5 8.5 15 5l1.5 5L5 13.5z M16.2 9.2l3.3-1 M9 12.5l1.5 4H5.5 M5.5 14.5v4',
  desk: 'M3.5 9.5h17 M5 9.5v10 M19 9.5v10 M13.5 9.5v6h5.5 M13.5 12.5h5.5',
  fridge: 'M6.5 3.5h11v17h-11z M6.5 10h11 M9 6v2 M9 12.5v3',
  aircon: 'M3.5 6h17v6h-17z M6.5 9.5h11 M8 15c0 1.5-1 2-1 3.5 M12 15c0 1.5-1 2-1 3.5 M16 15c0 1.5-1 2-1 3.5',
  elevator: 'M5.5 3.5h13v17h-13z M12 3.5v17 M7.3 10.5 8.8 9l1.5 1.5 M13.7 9.5l1.5 1.5 1.5-1.5',
  luggage: 'M7.5 7.5h9v12h-9z M10 7.5V5h4v2.5 M10 7.5v12 M14 7.5v12 M9 19.5V21 M15 19.5V21',
  towel: 'M5 4.5h10v15H5z M15 6.5h3.5v13H15 M5 9h10',
  ticket: 'M3.5 7.5h17v3a1.5 1.5 0 0 0 0 3v3h-17v-3a1.5 1.5 0 0 0 0-3z M14 8v1.5 M14 11.25v1.5 M14 14.5V16',
  clock: 'M12 3.5a8.5 8.5 0 1 1 0 17a8.5 8.5 0 0 1 0-17z M12 7.5V12l3 2',
  home: 'M4 11 12 4.5 20 11 M6 9.5v10h12v-10',
  building: 'M5.5 20.5v-16h9v16 M14.5 9.5h4v11 M3.5 20.5h17 M8 8h1 M11 8h1 M8 11h1 M11 11h1 M8 14h1 M11 14h1',
  chart: 'M4.5 19.5h15 M7.5 16v-4 M11.5 16V8 M15.5 16v-6',
  grid: 'M4.5 4.5h6v6h-6z M13.5 4.5h6v6h-6z M4.5 13.5h6v6h-6z M13.5 13.5h6v6h-6z',
  sliders: 'M4 7h10 M18 7h2 M16 5v4 M4 17h4 M12 17h8 M10 15v4',
  logout: 'M14 4.5H6v15h8 M10.5 12h10 M17 8.5l3.5 3.5-3.5 3.5',
  plus: 'M12 5v14 M5 12h14', minus: 'M5 12h14',
  copy: 'M8.5 8.5h11v11h-11z M5.5 15.5h-1v-11h11v1',
  send: 'M4 12 20 4.5 13.5 20l-2.5-6.5z M11 13.5 20 4.5',
  trash: 'M4.5 7h15 M9.5 7V4.5h5V7 M6.5 7l1 13h9l1-13',
  edit: 'M14.5 5.5l4 4L8 20H4v-4z',
  external: 'M14 4.5h5.5V10 M19.5 4.5 11 13 M17.5 13.5v6h-13v-13h6',
  info: 'M12 3.5a8.5 8.5 0 1 1 0 17a8.5 8.5 0 0 1 0-17z M12 11v5.5 M12 8h.01',
  warn: 'M12 4 21 19.5H3z M12 10v4.5 M12 17h.01',
  door: 'M6.5 20.5V4.5h11v16 M4 20.5h16 M14.5 12.5h.01',
  broom: 'M15 3.5 10.5 12 M7 11.5l6.5 3-1.5 6H4.5z M8.5 16.5l-1 4',
  wrench: 'M15 4a4.5 4.5 0 0 0-4.3 5.9L4.5 16.1 7.9 19.5l6.2-6.2A4.5 4.5 0 0 0 20 9l-3 3-3-3 3-3a4.5 4.5 0 0 0-2-2z',
  walk: 'M13.5 5.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3z M10 21l2.2-6.2 2.8 2.7V21 M8 12.5l2.8-4 3.2 1.2 1.6 3.3 2.4.9 M10.8 8.5 9.3 15',
  train: 'M7 4.5h10a2 2 0 0 1 2 2v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-8a2 2 0 0 1 2-2z M5 11h14 M8.5 14.5h.01 M15.5 14.5h.01 M8 17.5 6 20.5 M16 17.5l2 3',
  spark: 'M12 3.5l1.8 5.2L19 10.5l-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8z M18.5 16v4 M16.5 18h4',
  bell: 'M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5h-14z M10 20.5h4',
  msg: 'M4.5 5.5h15v10h-9l-4 3.5v-3.5h-2z',
  wallet: 'M4.5 7.5h15v12h-15z M4.5 7.5l11-3v3 M15.5 13.5h.01',
  tag: 'M4.5 4.5h7l8 8-7 7-8-8z M8.5 8.5h.01',
  refresh: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3 M19.5 4.5v4h-4',
  filter: 'M4.5 6h15 M7.5 12h9 M10.5 18h3',
  ruler: 'M4 15.5 15.5 4l4.5 4.5L8.5 20z M8 12l1.5 1.5 M10.5 9.5 12 11 M13 7l1.5 1.5',
  people: 'M8 11a3 3 0 1 0 0-6a3 3 0 0 0 0 6z M16.5 11a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5z M3 19c.6-2.8 2.5-4.5 5-4.5s4.4 1.7 5 4.5 M14 14.8c.8-.4 1.6-.6 2.5-.6 2.2 0 3.8 1.5 4.3 4.3',
  moon: 'M19 14.5A7.5 7.5 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5z',
  key: 'M8.5 15.5a4 4 0 1 1 3.5-6 M11.4 11.4 20 20 M16.5 16.5l2-2 M14 14l2-2',
  play: 'M7 5v14l11-7z',
};
const Icon = ({ n, cls, label }) => html`<svg class=${cx('ic', cls)} viewBox="0 0 24 24" aria-hidden=${label ? null : 'true'} role=${label ? 'img' : null} aria-label=${label || null}><path d=${ICONS[n] || ICONS.info} /></svg>`;
const Wordmark = ({ onClick, size }) => html`<a class="wordmark" href="#" style=${size ? `font-size:${size}px` : null} onClick=${e => { e.preventDefault(); onClick && onClick(); }} aria-label="monthliv">
  <svg viewBox="0 0 15 20" aria-hidden="true"><rect class="door" x="1.6" y="1.6" width="11.8" height="16.8" rx="1.2"/><circle class="knob" cx="10" cy="10.6" r="1.6"/></svg>monthliv</a>`;
const Lines = ({ lines }) => html`<span class="lines">${(lines || []).map(l => html`<span class="ln" style=${`background:${LINE_COLORS[l] || '#777'}`} title=${lineLabel(l)}>${lineLabel(l)}</span>`)}</span>`;

/* ---------- shared overlays ---------- */
function Modal({ title, onClose, children, footer, wide }) {
  const ref = useRef();
  useEffect(() => {
    const k = e => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', k);
    const el = ref.current && ref.current.querySelector('input:not([type=hidden]), select, textarea, button.btn');
    el && el.focus && setTimeout(() => el.focus(), 30);
    return () => window.removeEventListener('keydown', k);
  }, []);
  return html`<div class="scrim" onMouseDown=${e => { if (e.target === e.currentTarget) onClose && onClose(); }}>
    <div class=${cx('modal', wide && 'wide')} role="dialog" aria-modal="true" aria-label=${title} ref=${ref}>
      <header><h3>${title}</h3><button class="icon-btn" aria-label=${t('common.close')} onClick=${onClose}><${Icon} n="close"/></button></header>
      <div class="body">${children}</div>
      ${footer && html`<footer>${footer}</footer>`}
    </div></div>`;
}
function Drawer({ title, sub, onClose, children, footer }) {
  useEffect(() => { const k = e => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  return html`<${Fragment}><div class="drawer-scrim" onClick=${onClose}></div>
    <aside class="drawer" role="dialog" aria-modal="true" aria-label=${title}>
      <header><div><h3 style="font-size:18px">${title}</h3>${sub && html`<p class="muted" style="font-size:13px;margin-top:3px">${sub}</p>`}</div>
        <button class="icon-btn" aria-label="닫기" onClick=${onClose}><${Icon} n="close"/></button></header>
      <div class="body">${children}</div>
      ${footer && html`<footer>${footer}</footer>`}
    </aside></${Fragment}>`;
}
function ConfirmHost() {
  const c = S.confirm; if (!c) return null;
  const done = v => { S.confirm = null; emit(); c.res(v); };
  return html`<${Modal} title=${c.title} onClose=${() => done(false)} footer=${html`
    <button class="btn line" onClick=${() => done(false)}>${c.cancel || '취소'}</button>
    <button class=${cx('btn', c.danger && 'danger')} onClick=${() => done(true)}>${c.ok || '확인'}</button>`}>
    ${c.body && html`<p class="sub">${c.body}</p>`}</${Modal}>`;
}
function Toasts() {
  return html`<div class="toasts" aria-live="polite">${S.toasts.map(x => html`<div class=${cx('toast', x.kind === 'error' && 'error')} key=${x.id}>${x.kind === 'error' ? html`<${Icon} n="warn"/>` : html`<${Icon} n="check"/>`}<span>${x.msg}</span></div>`)}</div>`;
}
async function copyText(text, okMsg) {
  try { await navigator.clipboard.writeText(text); toast(okMsg || '복사했습니다'); }
  catch { toast('복사하지 못했습니다. 텍스트를 직접 선택해 복사하세요.', 'error'); }
}
const gmapsUrl = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
const gmapsDir = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=transit`; // open with public transport (subway-first branches)
