/* ================= maps =================
   MapView picks the map:
   - Google Maps when config.js has googleMapsApiKey (GitHub Pages / own domain)
   - otherwise SeoulMap, a drawn Seoul district map (also the fallback when Google fails to load)
   Both take the same props: items[{id,lat,lng,status,label,aria}], selected, onSelect, label,
   fitKey, pick, onPick, renderPop, hlGu, focus{lat,lng,zoom,key}, showGu, hideGm, note */
const PROJ = GEO.proj;
const toXY = (lat, lng) => [(lng - PROJ.lngMin) * PROJ.cos * PROJ.k, (PROJ.latMax - lat) * PROJ.k];
const toLL = (x, y) => [PROJ.latMax - y / PROJ.k, x / (PROJ.cos * PROJ.k) + PROJ.lngMin];
const GU_NAME = gu => { const L = S.lang; if (L === 'ko') return gu.ko; if (L === 'ja') return gu.ja; if (L === 'zh-CN') return gu['zh-CN']; if (L === 'zh-TW') return gu['zh-TW']; return gu.en; };
const RIVER_AT = toXY(37.5172, 126.9625);
/* popup above the marker when it fits, otherwise below it, kept inside the map (ph: popup height) */
function popStyle([x, y], size, ph = 262) {
  const left = Math.max(132, Math.min(size.w - 132, x));
  if (size.h < ph + 16) return `left:${left}px;top:8px;transform:translateX(-50%)`;
  if (y > ph + 48) return `left:${left}px;top:${y}px;transform:translate(-50%, calc(-100% - 40px))`;
  return `left:${left}px;top:${Math.max(8, Math.min(y + 14, size.h - ph - 8))}px;transform:translateX(-50%)`;
}
/* every branch keeps a clickable dot; a name label goes above the dot, or below it when above is taken,
   and is left out where it would cover another label or another branch's dot.
   placed: [{it, sx, sy, (dx, dy)}] in screen px (dx/dy: where to draw, if different) */
const pillW = txt => 24 + [...String(txt || '')].reduce((a, ch) => a + (/[\u1100-\u11ff\u3040-\u30ff\u3130-\u318f\u3400-\u9fff\uac00-\ud7af]/.test(ch) ? 12.5 : 7.2), 0);
function layoutMarks(placed, selected, label) {
  for (let i = 0; i < placed.length; i++) for (let j = 0; j < i; j++) if (Math.hypot(placed[i].sx - placed[j].sx, placed[i].sy - placed[j].sy) < 7) { placed[i].sx += 16; if (placed[i].dx != null) placed[i].dx += 16; }
  const rank = m => (m.it.id === selected ? 0 : m.it.status === 'open' ? 1 : m.it.status === 'soon' ? 2 : 3);
  const hit = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  const dots = placed.map(m => ({ m, b: [m.sx - 8, m.sy - 8, m.sx + 8, m.sy + 8] }));
  const labels = [];
  return placed.slice().sort((a, b) => rank(a) - rank(b) || a.sy - b.sy).map(m => {
    const text = label ? label(m.it) : m.it.label;
    const w = pillW(text);
    const up = [m.sx - w / 2 - 2, m.sy - 39, m.sx + w / 2 + 2, m.sy - 9];
    const down = [m.sx - w / 2 - 2, m.sy + 9, m.sx + w / 2 + 2, m.sy + 39];
    const free = b => !labels.some(x => hit(b, x)) && !dots.some(d => d.m !== m && hit(b, d.b));
    let pos = free(up) ? 'up' : free(down) ? 'down' : null;
    if (!pos && m.it.id === selected) pos = 'up';
    if (pos) labels.push(pos === 'up' ? up : down);
    return { ...m, text, show: !!pos, below: pos === 'down' };
  }).sort((a, b) => (a.it.id === selected) - (b.it.id === selected) || b.show - a.show); // dots above labelled markers' empty hit area
}
const markerBtn = (m, selected, onSelect, x, y) => html`<button key=${m.it.id} class=${cx('marker', m.it.status, m.it.id === selected && 'on', !m.show && 'dotonly', m.below && 'below')} style=${`transform:translate(${x}px,${y}px) translate(-50%,-100%) translateY(12px)`}
    onClick=${e => { e.stopPropagation(); onSelect && onSelect(m.it.id); }} aria-label=${m.it.aria || m.it.label} title=${m.show ? null : m.it.aria || m.it.label}>
    ${m.show && html`<span class="pill">${m.text}</span>`}<span class="pin"></span></button>`;
const pickPin = (x, y) => html`<div class="pick-pin" style=${`left:${x}px;top:${y}px`}><svg viewBox="0 0 24 24"><path d=${ICONS.pin.split(' M12 7.5')[0]}/></svg></div>`;
const MAP_NOTE_PICK = '지도를 눌러 위치를 지정하세요';

function MapView(p) {
  if (gmWanted() && GM.state !== 'failed') return html`<${GoogleMap} ...${p}/>`;
  return html`<${SeoulMap} ...${p}/>`;
}

function SeoulMap(p) {
  const { items = [], selected, onSelect, label, fitKey = 'city', pick, onPick, renderPop, hlGu, focus } = p;
  const wrap = useRef(), popRef = useRef();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState(null);
  const [popH, setPopH] = useState(262);
  useLayoutEffect(() => { const el = popRef.current; const hh = el && el.offsetHeight; if (hh && Math.abs(hh - popH) > 2) setPopH(hh); });
  const ptr = useRef(new Map());
  const drag = useRef(null);
  useLayoutEffect(() => {
    const el = wrap.current;
    const set = () => { const r = el.getBoundingClientRect(); setSize(s => (Math.abs(s.w - r.width) > 1 || Math.abs(s.h - r.height) > 1 ? { w: r.width, h: r.height } : s)); };
    set();
    let ro; try { ro = new ResizeObserver(set); ro.observe(el); } catch {}
    return () => ro && ro.disconnect();
  }, []);
  const sMin = size.w ? Math.min(size.w / GEO.w, size.h / GEO.h) * 0.75 : 0.3;
  const sMax = sMin * 16;
  const clampS = s => Math.max(sMin, Math.min(sMax, s));
  const fit = useCallback(() => {
    if (!size.w) return null;
    if (focus) { const [x, y] = toXY(focus.lat, focus.lng); return { cx: x, cy: y, s: clampS(sMin * (focus.zoom || 6)) }; }
    const pts = fitKey === 'city' ? [] : items.map(it => toXY(it.lat, it.lng));
    if (!pts.length) return { cx: GEO.w / 2, cy: GEO.h / 2, s: Math.min(size.w / GEO.w, size.h / GEO.h) * 0.97 };
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const pad = Math.min(80, size.w * 0.12);
    const w = Math.max(x1 - x0, 90), hgt = Math.max(y1 - y0, 90);
    const s = Math.min((size.w - pad * 2) / w, (size.h - pad * 2) / hgt);
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 + 6 / Math.max(s, 0.1), s: clampS(s) };
  }, [size.w, size.h, fitKey, focus && focus.lat, focus && focus.lng, items.length]);
  useEffect(() => { const v = fit(); if (v) setView(v); }, [fit]);
  const v = view || { cx: GEO.w / 2, cy: GEO.h / 2, s: 0.5 };
  const vbx = v.cx - size.w / 2 / v.s, vby = v.cy - size.h / 2 / v.s;
  const screen = (x, y) => [(x - vbx) * v.s, (y - vby) * v.s];
  const zoomAt = (px, py, f) => {
    setView(cur => {
      const c = cur || v;
      const bx = c.cx - size.w / 2 / c.s, by = c.cy - size.h / 2 / c.s;
      const mx = bx + px / c.s, my = by + py / c.s;
      const ns = clampS(c.s * f);
      const nbx = mx - px / ns, nby = my - py / ns;
      return { cx: nbx + size.w / 2 / ns, cy: nby + size.h / 2 / ns, s: ns };
    });
  };
  const local = e => { const r = wrap.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const onDown = e => {
    if (e.target.closest('.marker, .map-ctl, .map-foot, .map-pop')) return;
    try { wrap.current.setPointerCapture(e.pointerId); } catch {}
    ptr.current.set(e.pointerId, local(e));
    const pts = [...ptr.current.values()];
    if (pts.length === 1) drag.current = { start: pts[0], view: { ...v }, moved: false };
    else if (pts.length === 2) {
      const d = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]);
      drag.current = { pinch: { d, s: v.s, mid: [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2] }, view: { ...v }, moved: true };
    }
  };
  const onMove = e => {
    if (!ptr.current.has(e.pointerId) || !drag.current) return;
    ptr.current.set(e.pointerId, local(e));
    const pts = [...ptr.current.values()];
    const d0 = drag.current;
    if (d0.pinch && pts.length >= 2) {
      const d = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]);
      const ns = clampS(d0.pinch.s * (d / d0.pinch.d));
      const [px, py] = d0.pinch.mid; const c = d0.view;
      const bx = c.cx - size.w / 2 / c.s, by = c.cy - size.h / 2 / c.s;
      const mx = bx + px / c.s, my = by + py / c.s;
      setView({ cx: mx - px / ns + size.w / 2 / ns, cy: my - py / ns + size.h / 2 / ns, s: ns });
      return;
    }
    const [x, y] = pts[0];
    const dx = x - d0.start[0], dy = y - d0.start[1];
    if (!d0.moved && Math.hypot(dx, dy) > 4) { d0.moved = true; wrap.current.classList.add('dragging'); }
    if (d0.moved) setView({ cx: d0.view.cx - dx / d0.view.s, cy: d0.view.cy - dy / d0.view.s, s: d0.view.s });
  };
  const onUp = e => {
    const d0 = drag.current;
    const pos = ptr.current.get(e.pointerId);
    ptr.current.delete(e.pointerId);
    wrap.current && wrap.current.classList.remove('dragging');
    if (ptr.current.size === 0) {
      if (d0 && !d0.moved && pos) {
        if (pick && onPick) { const [lat, lng] = toLL(vbx + pos[0] / v.s, vby + pos[1] / v.s); onPick(+lat.toFixed(5), +lng.toFixed(5)); }
        else { onSelect && onSelect(null); }
      }
      drag.current = null;
    }
  };
  const onWheel = e => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); const [x, y] = local(e); zoomAt(x, y, e.deltaY < 0 ? 1.18 : 1 / 1.18); };
  const onDbl = e => { if (e.target.closest('.marker, .map-ctl, .map-foot, .map-pop')) return; const [x, y] = local(e); zoomAt(x, y, 1.7); };

  const placed = items.map(it => { const [x, y] = toXY(it.lat, it.lng); const [sx, sy] = screen(x, y); return { it, x, y, sx, sy }; })
    .filter(m => m.sx > -60 && m.sx < size.w + 60 && m.sy > -40 && m.sy < size.h + 60);
  const marks = layoutMarks(placed, selected, label);
  const fs = 12 / v.s;
  const showLabels = p.showGu !== false && size.w > 380 && v.s > 0.36;
  const sel = selected && items.find(i => i.id === selected);
  const selPos = sel ? screen(...toXY(sel.lat, sel.lng)) : null;
  const pickPos = pick ? screen(...toXY(pick.lat, pick.lng)) : null;
  const centerLL = toLL(v.cx, v.cy);
  const gm = sel ? gmapsUrl(sel.lat, sel.lng) : gmapsUrl(centerLL[0].toFixed(5), centerLL[1].toFixed(5));
  return html`<div class=${cx('map', pick && 'pick')} ref=${wrap} onPointerDown=${onDown} onPointerMove=${onMove} onPointerUp=${onUp} onPointerCancel=${onUp} onWheel=${onWheel} onDblClick=${onDbl}>
    ${size.w > 0 && html`<svg class="base" viewBox=${`${vbx} ${vby} ${size.w / v.s} ${size.h / v.s}`} preserveAspectRatio="none" aria-label=${t('map.aria')} role="img">
      ${GEO.gu.map(g => html`<path class=${cx('land', hlGu && hlGu === g.ko && 'hl')} d=${g.d}/>`)}
      <path class="river" d=${GEO.river} style=${`stroke-width:${Math.max(24, 9 / v.s)}px`}/>
      <path class="outline" d=${GEO.outline}/>
      ${showLabels && GEO.gu.map(g => html`<text class="gu-label" x=${g.x} y=${g.y} style=${`font-size:${fs}px`}>${GU_NAME(g)}</text>`)}
      ${showLabels && html`<text class="river-label" x=${RIVER_AT[0]} y=${RIVER_AT[1]} style=${`font-size:${10 / v.s}px`} text-anchor="middle">${t('map.river')}</text>`}
    </svg>`}
    ${marks.map(m => markerBtn(m, selected, onSelect, m.sx, m.sy))}
    ${pickPos && pickPin(pickPos[0], pickPos[1])}
    ${sel && selPos && renderPop && html`<div class="map-pop" ref=${popRef} style=${popStyle(selPos, size, popH)} onPointerDown=${e => e.stopPropagation()}>
      <button class="x" aria-label=${t('common.close')} onClick=${() => onSelect && onSelect(null)}><${Icon} n="close" cls="sm"/></button>${renderPop(sel)}</div>`}
    <div class="map-ctl">
      <button aria-label=${t('map.zoomIn')} onClick=${() => zoomAt(size.w / 2, size.h / 2, 1.5)}><${Icon} n="plus"/></button>
      <button aria-label=${t('map.zoomOut')} onClick=${() => zoomAt(size.w / 2, size.h / 2, 1 / 1.5)}><${Icon} n="minus"/></button>
      <button aria-label=${t('map.reset')} onClick=${() => { const f = fit(); f && setView(f); }}><${Icon} n="refresh"/></button>
    </div>
    <div class="map-foot">
      ${p.hideGm ? null : html`<a class="gmap" href=${gm} target="_blank" rel="noopener"><${Icon} n="external" cls="sm"/>${t('map.google')}</a>`}
      ${p.note !== false && html`<span class="map-note">${pick ? MAP_NOTE_PICK : t('map.note')}</span>`}
    </div>
  </div>`;
}

/* ================= Google Maps ================= */
const GM = { state: 'off', err: null, promise: null };          // off | loading | ready | failed
const gmWanted = () => !!(CFG.googleMapsApiKey && !window.claude); // Claude's artifact view blocks Google scripts
const SEOUL_SW = (() => { const [lat, lng] = toLL(0, GEO.h); return { lat, lng }; })();
const SEOUL_NE = (() => { const [lat, lng] = toLL(GEO.w, 0); return { lat, lng }; })();
function loadGoogleMaps() {
  if (GM.promise) return GM.promise;
  GM.state = 'loading';
  GM.promise = new Promise((resolve, reject) => {
    const cb = '__monthlivMapsReady';
    let timer = null;
    const fail = why => {
      clearTimeout(timer);
      if (GM.state === 'failed') return;
      GM.state = 'failed'; GM.err = why;
      console.warn('[monthliv] Google Maps unavailable (' + why + '), using the built-in Seoul map');
      reject(new Error(why)); emit();
    };
    timer = setTimeout(() => fail('timeout'), 15000);
    window.gm_authFailure = () => fail('auth'); // wrong key, API not enabled, or this site is not an allowed referrer
    window[cb] = async () => {
      clearTimeout(timer);
      try {
        const g = window.google.maps;
        if (g.importLibrary) await Promise.all([g.importLibrary('core'), g.importLibrary('maps')]);
        if (GM.state === 'failed') return;
        GM.state = 'ready'; resolve(g);
      } catch (e) { fail('init'); }
    };
    const qs = new URLSearchParams({ key: CFG.googleMapsApiKey, v: 'weekly', language: S.lang || 'ko', region: 'KR', loading: 'async', callback: cb });
    const s = document.createElement('script');
    s.src = 'https://maps.googleapis.com/maps/api/js?' + qs.toString();
    s.async = true;
    s.onerror = () => fail('network');
    document.head.appendChild(s);
  });
  GM.promise.catch(() => {});
  return GM.promise;
}
const isDarkUi = () => { const th = document.documentElement.getAttribute('data-theme'); return th === 'dark' || (th !== 'light' && !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches)); };
/* map styling in the brand palette (used when no cloud Map ID is configured) */
const GM_LIGHT = [
  { elementType: 'geometry', stylers: [{ color: '#F6EEE7' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#75615A' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FBF6F1' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#D3BFB3' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ saturation: -100 }, { lightness: 25 }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#E8E6D7' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#F0DFD4' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#E2CCBF' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#D9C6BB' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#881C21' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#DDCCCB' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#8C7375' }] },
];
const GM_DARK = [
  { elementType: 'geometry', stylers: [{ color: '#241A16' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#A8938A' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1D1512' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#4D3D35' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ saturation: -100 }, { lightness: -35 }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#272620' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#372A24' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#48382F' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#3F312A' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#EEA3A6' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#2E2225' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#8E7376' }] },
];
/* district outline for Google (hlGu): the drawn map's SVG path, projected back to lat/lng */
function svgRings(d) {
  const tok = String(d).match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [];
  const rings = []; let cur = null, x = 0, y = 0, sx = 0, sy = 0, cmd = '', i = 0;
  const isCmd = s => /^[a-zA-Z]$/.test(s);
  const add = () => { if (!cur) { cur = [[sx, sy]]; rings.push(cur); } cur.push([x, y]); };
  while (i < tok.length) {
    if (isCmd(tok[i])) cmd = tok[i++];
    const n = () => +tok[i++];
    if (cmd === 'M' || cmd === 'm') { const ax = n(), ay = n(); x = cmd === 'M' ? ax : x + ax; y = cmd === 'M' ? ay : y + ay; sx = x; sy = y; cur = [[x, y]]; rings.push(cur); cmd = cmd === 'M' ? 'L' : 'l'; }
    else if (cmd === 'L') { x = n(); y = n(); add(); }
    else if (cmd === 'l') { x += n(); y += n(); add(); }
    else if (cmd === 'H') { x = n(); add(); } else if (cmd === 'h') { x += n(); add(); }
    else if (cmd === 'V') { y = n(); add(); } else if (cmd === 'v') { y += n(); add(); }
    else { if (cmd === 'Z' || cmd === 'z') { x = sx; y = sy; cur = null; } if (i < tok.length && !isCmd(tok[i])) i++; }
  }
  return rings.filter(r => r.length > 2);
}
const guPathCache = {};
const guLatLng = g => guPathCache[g.ko] || (guPathCache[g.ko] = svgRings(g.d).map(r => r.map(([x, y]) => { const [lat, lng] = toLL(x, y); return { lat, lng }; })));
const gmZoom = z => (z >= 5 ? 15 : z >= 2.5 ? 13 : 11);
let GmLayer = null;
function gmLayerClass() {
  if (GmLayer) return GmLayer;
  GmLayer = class extends google.maps.OverlayView {
    constructor(onDraw) { super(); this.onDraw = onDraw; this.div = document.createElement('div'); this.div.className = 'gm-layer'; }
    onAdd() { this.getPanes().overlayMouseTarget.appendChild(this.div); try { google.maps.OverlayView.preventMapHitsAndGesturesFrom(this.div); } catch {} }
    draw() { this.onDraw(this); }
    onRemove() { render(null, this.div); this.div.remove(); }
  };
  return GmLayer;
}
function GoogleMap(p) {
  const { items = [], selected, fitKey = 'city', pick, renderPop, hlGu, focus } = p;
  const wrap = useRef(), canvas = useRef(), popEl = useRef();
  const live = useRef(p); live.current = p;
  const R = useRef({});
  const [ready, setReady] = useState(false);
  const box = () => { const el = wrap.current; if (!el) return { w: 0, h: 0 }; const b = el.getBoundingClientRect(); return { w: b.width, h: b.height }; };
  const draw = ov => {
    const prj = ov.getProjection(); if (!prj) return;
    const P = live.current, g = google.maps;
    const placed = (P.items || []).map(it => {
      const ll = new g.LatLng(it.lat, it.lng), d = prj.fromLatLngToDivPixel(ll), c = prj.fromLatLngToContainerPixel(ll);
      return { it, sx: c.x, sy: c.y, dx: d.x, dy: d.y };
    });
    const marks = layoutMarks(placed, P.selected, P.label);
    const pk = P.pick ? prj.fromLatLngToDivPixel(new g.LatLng(P.pick.lat, P.pick.lng)) : null;
    render(html`<${Fragment}>${marks.map(m => markerBtn(m, P.selected, P.onSelect, m.dx, m.dy))}${pk && pickPin(pk.x, pk.y)}</${Fragment}>`, ov.div);
  };
  const placePop = () => {
    const el = popEl.current, ov = R.current.ov; if (!el) return;
    const P = live.current, prj = ov && ov.getProjection();
    const it = P.selected && (P.items || []).find(i => i.id === P.selected);
    if (!prj || !it) { el.style.visibility = 'hidden'; return; }
    const c = prj.fromLatLngToContainerPixel(new google.maps.LatLng(it.lat, it.lng));
    el.style.cssText = popStyle([c.x, c.y], box(), el.offsetHeight || 262);
  };
  const fitNow = () => {
    const r = R.current, P = live.current, map = r.map; if (!map) return;
    const sz = box(); if (sz.w < 20 || sz.h < 20) { r.pendingFit = true; return; }
    r.pendingFit = false;
    if (P.focus) { map.setCenter({ lat: P.focus.lat, lng: P.focus.lng }); map.setZoom(gmZoom(P.focus.zoom)); return; }
    const pts = P.items || [];
    if (pts.length === 1) { map.setCenter({ lat: pts[0].lat, lng: pts[0].lng }); map.setZoom(14); return; }
    const b = new google.maps.LatLngBounds();
    if (pts.length) pts.forEach(i => b.extend({ lat: i.lat, lng: i.lng })); else { b.extend(SEOUL_SW); b.extend(SEOUL_NE); }
    const pad = Math.round(Math.min(60, sz.w * 0.08));
    map.fitBounds(b, { top: pad + 36, right: pad + 44, bottom: pad + 30, left: pad + 8 });
  };
  /* load the API, then build the map once */
  useEffect(() => {
    let dead = false, mq = null;
    const onScheme = () => R.current.map && R.current.map.setOptions({ styles: isDarkUi() ? GM_DARK : GM_LIGHT });
    loadGoogleMaps().then(g => {
      if (dead || !canvas.current) return;
      const dark = isDarkUi();
      const opts = { center: { lat: 37.55, lng: 126.99 }, zoom: 11, disableDefaultUI: true, clickableIcons: false, gestureHandling: 'cooperative', backgroundColor: dark ? '#241A16' : '#F6EEE7' };
      if (CFG.googleMapId) { opts.mapId = CFG.googleMapId; if (g.ColorScheme) opts.colorScheme = g.ColorScheme.FOLLOW_SYSTEM; }
      else opts.styles = dark ? GM_DARK : GM_LIGHT;
      const map = new g.Map(canvas.current, opts);
      const ov = new (gmLayerClass())(draw);
      ov.setMap(map);
      map.addListener('click', e => {
        const P = live.current;
        if (P.pick && P.onPick && e.latLng) P.onPick(+e.latLng.lat().toFixed(5), +e.latLng.lng().toFixed(5));
        else if (P.onSelect) P.onSelect(null);
      });
      map.addListener('bounds_changed', placePop);
      if (!CFG.googleMapId && window.matchMedia) { mq = matchMedia('(prefers-color-scheme: dark)'); try { mq.addEventListener('change', onScheme); } catch { mq = null; } }
      R.current = { map, ov };
      setReady(true);
    }, () => {});
    return () => {
      dead = true;
      const r = R.current;
      if (mq) try { mq.removeEventListener('change', onScheme); } catch {}
      if (r.poly) r.poly.setMap(null);
      if (r.ov) r.ov.setMap(null);
      if (r.map) google.maps.event.clearInstanceListeners(r.map);
      R.current = {};
    };
  }, []);
  /* refit when the result set or the focus point changes; a pick inside the visible area keeps the view */
  const sig = [fitKey, items.length, focus ? `${focus.lat},${focus.lng}` : '', focus ? focus.key || 0 : ''].join('|');
  useEffect(() => {
    if (!ready) return;
    const r = R.current, prev = r.sig; r.sig = sig;
    if (prev && pick && focus) {
      const [pf, pn, , pk] = prev.split('|'), bounds = r.map.getBounds();
      if (pf === String(fitKey) && pn === String(items.length) && pk === String(focus.key || 0) && bounds && bounds.contains(focus)) return;
    }
    fitNow();
  }, [ready, sig]);
  /* markers, selection, pick pin and popup follow every render */
  useEffect(() => { if (ready && R.current.ov) draw(R.current.ov); });
  useLayoutEffect(placePop);
  /* district highlight */
  useEffect(() => {
    const r = R.current; if (!ready) return;
    if (r.poly) { r.poly.setMap(null); r.poly = null; }
    const g = hlGu && GEO.gu.find(x => x.ko === hlGu);
    if (g) r.poly = new google.maps.Polygon({ paths: guLatLng(g), map: r.map, clickable: false, strokeColor: '#881C21', strokeOpacity: 0.85, strokeWeight: 1.5, fillColor: '#B99A9D', fillOpacity: 0.18 });
  }, [ready, hlGu]);
  /* the map may start hidden (mobile results view): fit once it gets a size */
  useLayoutEffect(() => {
    const el = wrap.current; let ro;
    try { ro = new ResizeObserver(() => { if (R.current.pendingFit) fitNow(); placePop(); }); ro.observe(el); } catch {}
    return () => ro && ro.disconnect();
  }, []);
  const sel = selected && items.find(i => i.id === selected);
  const gmHref = () => {
    const s = live.current.selected && (live.current.items || []).find(i => i.id === live.current.selected);
    if (s) return gmapsUrl(s.lat, s.lng);
    const c = R.current.map && R.current.map.getCenter();
    return c ? gmapsUrl(c.lat().toFixed(5), c.lng().toFixed(5)) : gmapsUrl(37.5665, 126.978);
  };
  const zoomBy = d => { const m = R.current.map; if (m) m.setZoom((m.getZoom() || 11) + d); };
  return html`<div class=${cx('map', 'gm', pick && 'pick')} ref=${wrap}>
    <div class="gm-canvas" ref=${canvas} role="region" aria-label=${t('map.aria')}></div>
    ${!ready && html`<div class="gm-wait"><span class="spinner"></span></div>`}
    ${sel && renderPop && html`<div class="map-pop" ref=${popEl} style="visibility:hidden">
      <button class="x" aria-label=${t('common.close')} onClick=${() => p.onSelect && p.onSelect(null)}><${Icon} n="close" cls="sm"/></button>${renderPop(sel)}</div>`}
    <div class="map-ctl">
      <button aria-label=${t('map.zoomIn')} onClick=${() => zoomBy(1)}><${Icon} n="plus"/></button>
      <button aria-label=${t('map.zoomOut')} onClick=${() => zoomBy(-1)}><${Icon} n="minus"/></button>
      <button aria-label=${t('map.reset')} onClick=${fitNow}><${Icon} n="refresh"/></button>
    </div>
    <div class="map-foot">
      ${p.hideGm ? null : html`<a class="gmap" href=${sel ? gmapsUrl(sel.lat, sel.lng) : gmapsUrl(37.5665, 126.978)} target="_blank" rel="noopener" onClick=${e => { e.currentTarget.href = gmHref(); }}><${Icon} n="external" cls="sm"/>${t('map.google')}</a>`}
      ${pick && p.note !== false && html`<span class="map-note">${MAP_NOTE_PICK}</span>`}
    </div>
  </div>`;
}

/* address → coordinates for the branch editor (needs the Geocoding API on the same key) */
async function geocodeKR(address) {
  const g = await loadGoogleMaps();
  if (g.importLibrary) { try { await g.importLibrary('geocoding'); } catch {} }
  let res;
  try { res = await new g.Geocoder().geocode({ address, region: 'KR', language: 'ko' }); }
  catch (e) { throw new Error((e && e.code) || (e && e.message && /REQUEST_DENIED|ZERO_RESULTS|OVER_QUERY_LIMIT/.exec(e.message) || [])[0] || 'ERROR'); }
  const r = res && res.results && res.results[0];
  if (!r) throw new Error('ZERO_RESULTS');
  const comp = type => { const c = r.address_components.find(a => a.types.includes(type)); return c ? c.long_name : ''; };
  return { lat: +r.geometry.location.lat().toFixed(6), lng: +r.geometry.location.lng().toFixed(6), gu: comp('sublocality_level_1'), dong: comp('sublocality_level_2'), formatted: r.formatted_address };
}

/* ================= illustrations (stand-ins for real photos) ================= */
const ART_WALL = ['#F5EDE6', '#F2E8E0', '#F7F0EA', '#EFE4DB', '#F4EBE4'];
const ART_THROW = ['#B99A9D', '#8D7A64', '#4B362C', '#A8A9A1', '#C2A27C', '#5E4447'];
const ART_OAK = ['#D2AE83', '#C9A275', '#D8B88F', '#C59D70'];
function Art({ kind = 'room', seed = 0, win = 'outer', bunk, label }) {
  const s = Math.abs(seed) || 0;
  const wall = ART_WALL[s % ART_WALL.length], throwC = ART_THROW[(s * 7 + 3) % ART_THROW.length], oak = ART_OAK[s % ART_OAK.length];
  const steel = '#22201C', floor = '#C79F73', floorLine = '#B98F62';
  const plant = s % 3 !== 1;
  if (kind === 'lounge') return html`<svg class="art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label=${label || ''}>
    <rect width="400" height="300" fill=${wall}/>
    <rect x="215" y="38" width="160" height="150" fill="#DCE6E8"/><path d="M215 38h160v150H215z M268 38v150 M321 38v150 M215 113h160" fill="none" stroke=${steel} stroke-width="5"/>
    <rect x="0" y="212" width="400" height="88" fill=${floor}/>${[226, 246, 270].map(y => html`<line x1="0" x2="400" y1=${y} y2=${y} stroke=${floorLine} stroke-width="1.5"/>`)}
    <polygon points="215,212 375,212 400,262 250,262" fill="#fff" opacity=".18"/>
    <rect x="30" y="70" width="120" height="6" fill=${oak}/><rect x="30" y="118" width="120" height="6" fill=${oak}/>
    <rect x="38" y="48" width="14" height="22" fill="#8A847A"/><rect x="56" y="54" width="10" height="16" fill=${throwC}/><circle cx="118" cy="62" r="8" fill="#E6DFD3"/><rect x="40" y="100" width="44" height="18" fill="#D9D1C4"/><rect x="98" y="96" width="9" height="22" fill="#6E675D"/>
    ${[110, 200, 290].map(x => html`<line x1=${x} x2=${x} y1="0" y2="56" stroke=${steel} stroke-width="1.5"/><path d=${`M${x - 14} 70 L${x - 6} 56 L${x + 6} 56 L${x + 14} 70 Z`} fill=${steel}/><circle cx=${x} cy="74" r="9" fill="#FFF3D6" opacity=".55"/>`)}
    <rect x="70" y="176" width="250" height="10" rx="2" fill=${oak}/><rect x="84" y="186" width="6" height="44" fill=${steel}/><rect x="300" y="186" width="6" height="44" fill=${steel}/>
    ${[95, 155, 215, 275].map(x => html`<path d=${`M${x} 168 v-26 h22 v26 M${x} 192 h22 v38 M${x + 22} 192 v38`} fill="none" stroke=${steel} stroke-width="4"/>`)}
    ${plant && html`<rect x="352" y="196" width="24" height="24" fill="#E9E3D9"/><ellipse cx="358" cy="180" rx="9" ry="20" fill="#7F9A6E"/><ellipse cx="372" cy="176" rx="8" ry="22" fill="#6E8A60"/>`}
  </svg>`;
  if (kind === 'laundry') return html`<svg class="art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label=${label || ''}>
    <rect width="400" height="300" fill="#E7E4DE"/>${Array.from({ length: 19 }, (_, i) => html`<line x1=${i * 22} x2=${i * 22} y1="0" y2="238" stroke="#F6F4F0" stroke-width="1.5"/>`)}${Array.from({ length: 11 }, (_, i) => html`<line x1="0" x2="400" y1=${i * 22} y2=${i * 22} stroke="#F6F4F0" stroke-width="1.5"/>`)}
    <rect x="0" y="238" width="400" height="62" fill="#D6D0C6"/>
    ${[40, 140].map(x => html`<g><rect x=${x} y="40" width="86" height="98" rx="5" fill="#F8F7F4" stroke="#C7C2BA" stroke-width="2"/><rect x=${x} y="140" width="86" height="98" rx="5" fill="#F8F7F4" stroke="#C7C2BA" stroke-width="2"/>
      <rect x=${x + 8} y="48" width="70" height="10" rx="2" fill="#E6E2DB"/><circle cx=${x + 43} cy="96" r="26" fill="#DCE5E8" stroke="#BDB8B0" stroke-width="4"/><rect x=${x + 8} y="148" width="70" height="10" rx="2" fill="#E6E2DB"/><circle cx=${x + 43} cy="196" r="26" fill="#DCE5E8" stroke="#BDB8B0" stroke-width="4"/><circle cx=${x + 70} cy="53" r="2.5" fill=${steel}/><circle cx=${x + 70} cy="153" r="2.5" fill=${steel}/></g>`)}
    <rect x="250" y="150" width="130" height="9" fill=${oak}/><rect x="256" y="159" width="5" height="79" fill=${steel}/><rect x="369" y="159" width="5" height="79" fill=${steel}/>
    <rect x="262" y="134" width="44" height="8" rx="3" fill="#F5F1EA"/><rect x="264" y="126" width="40" height="8" rx="3" fill=${throwC}/><rect x="262" y="118" width="44" height="8" rx="3" fill="#F5F1EA"/>
    <path d="M320 112 h48 l-6 38 h-36z" fill="#CDBA9C"/><path d="M322 120 h44 M324 130 h40 M326 140 h36" stroke="#B9A381" stroke-width="2"/>
    <rect x="255" y="40" width="120" height="70" fill="#FFFDF8" stroke=${steel} stroke-width="4"/><text x="315" y="82" text-anchor="middle" font-size="15" font-weight="500" font-family="Jost, sans-serif" fill=${steel} letter-spacing="3">LAUNDRY</text>
  </svg>`;
  if (kind === 'facade') return html`<svg class="art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label=${label || ''}>
    <rect width="400" height="300" fill="#E4ECEE"/><rect x="0" y="262" width="400" height="38" fill="#CFC9BF"/><rect x="0" y="258" width="400" height="5" fill="#BDB6AA"/>
    <rect x="96" y="34" width="232" height="228" fill="#EEE9E1"/><rect x="96" y="34" width="232" height="10" fill="#D9D2C6"/>
    ${[0, 1, 2, 3, 4].map(r => [0, 1, 2, 3].map(c => html`<rect x=${112 + c * 54} y=${56 + r * 34} width="40" height="24" fill="#CFDDE1" stroke=${steel} stroke-width="2.5"/>`))}
    <rect x="150" y="222" width="124" height="40" fill="#BFCFD3" stroke=${steel} stroke-width="3"/><line x1="212" x2="212" y1="222" y2="262" stroke=${steel} stroke-width="3"/>
    <rect x="160" y="202" width="104" height="17" fill="#4B362C"/><text x="212" y="214.6" text-anchor="middle" font-size="10.5" font-family="Libre Caslon Text, Georgia, serif" fill="#F3E5DB" letter-spacing="1">MONTHLIV</text>
    <rect x="54" y="206" width="6" height="56" fill="#7A6450"/><circle cx="57" cy="194" r="28" fill="#8FA67E"/><circle cx="40" cy="206" r="18" fill="#7F9A6E"/>
    <rect x="344" y="226" width="5" height="36" fill="#7A6450"/><circle cx="347" cy="218" r="18" fill="#8FA67E"/>
  </svg>`;
  /* room */
  const outer = win !== 'inner';
  return html`<svg class="art" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label=${label || ''}>
    <rect width="400" height="300" fill=${wall}/>
    <rect x="34" y="62" width="214" height="164" fill=${oak}/>${Array.from({ length: 15 }, (_, i) => html`<line x1=${46 + i * 14} x2=${46 + i * 14} y1="62" y2="226" stroke="#000" stroke-opacity=".07" stroke-width="2"/>`)}
    ${outer ? html`<rect x="272" y="48" width="100" height="136" fill="#DCE7EA"/><path d="M272 48h100v136H272z M322 48v136 M272 116h100" fill="none" stroke=${steel} stroke-width="6"/><polygon points="272,226 372,226 400,286 300,286" fill="#fff" opacity=".2"/>`
      : html`<rect x="280" y="54" width="84" height="40" fill="#EAE5DC"/><path d="M280 54h84v40h-84z M322 54v40" fill="none" stroke=${steel} stroke-width="4"/>`}
    <rect x="0" y="226" width="400" height="74" fill=${floor}/>${[240, 258, 280].map(y => html`<line x1="0" x2="400" y1=${y} y2=${y} stroke=${floorLine} stroke-width="1.5"/>`)}
    <line x1="150" x2="150" y1="0" y2="34" stroke=${steel} stroke-width="1.5"/><path d="M136 48 L144 34 L156 34 L164 48 Z" fill=${steel}/><circle cx="150" cy="52" r="10" fill="#FFF3D6" opacity=".6"/>
    ${bunk ? html`
      <path d="M50 120 v104 M246 120 v104 M50 150 h196 M50 214 h196" stroke=${steel} stroke-width="5" fill="none"/>
      <rect x="54" y="132" width="188" height="16" rx="4" fill="#FBF8F3"/><rect x="150" y="128" width="92" height="20" rx="6" fill=${throwC}/><rect x="58" y="122" width="38" height="12" rx="4" fill="#F4EFE7"/>
      <rect x="54" y="196" width="188" height="16" rx="4" fill="#FBF8F3"/><rect x="150" y="192" width="92" height="20" rx="6" fill=${throwC}/><rect x="58" y="186" width="38" height="12" rx="4" fill="#F4EFE7"/>`
    : html`
      <rect x="44" y="200" width="200" height="26" fill="#A47B52"/><rect x="50" y="178" width="188" height="26" rx="6" fill="#FBF8F3"/>
      <rect x="96" y="172" width="142" height="34" rx="9" fill="#FFFFFF"/><rect x="168" y="172" width="70" height="34" rx="9" fill=${throwC}/>
      <rect x="56" y="160" width="40" height="20" rx="6" fill="#F4EFE7"/><rect x="100" y="162" width="38" height="18" rx="6" fill="#EFE9E0"/>`}
    <rect x="270" y="196" width="104" height="7" fill=${oak}/><path d="M276 203v23 M368 203v23 M276 214h92" stroke=${steel} stroke-width="3.5" fill="none"/>
    <path d="M300 226v-26 h22 M322 200 v-22" stroke=${steel} stroke-width="4" fill="none"/><rect x="340" y="180" width="18" height="16" fill="#E9E3D9"/><path d="M349 180 v-12 M343 168 h12" stroke=${steel} stroke-width="2.5"/>
    ${plant && html`<rect x="10" y="204" width="18" height="22" fill="#E9E3D9"/><ellipse cx="15" cy="190" rx="7" ry="16" fill="#7F9A6E"/><ellipse cx="24" cy="188" rx="6" ry="17" fill="#6E8A60"/>`}
    ${!outer || s % 2 === 0 ? html`<rect x="94" y="90" width="44" height="54" fill="#F6F1E8" stroke="#2A2723" stroke-width="3"/><rect x="104" y="104" width="24" height="26" fill=${throwC} opacity=".55"/>` : null}
  </svg>`;
}
const artFor = (b, rt) => html`<${Art} kind="room" seed=${(b.art || 0) + (rt ? rt.id.charCodeAt(0) : 0)} win=${rt ? rt.window : 'outer'} bunk=${rt && rt.bed === 'bunk'} label=${b ? bTitle(b) : ''}/>`;
