/* ================= USER SITE ================= */
function go(name, params) {
  S.u.route = { name, ...(params || {}) };
  emit();
  try { window.scrollTo({ top: 0 }); } catch {}
}
const q = () => S.u.q;
const ciDefault = () => q().ci || today();
function needLogin(after) { S.u.after = after || null; openModal('login'); }
function setLang(code) {
  S.lang = code; store.set('lang', code); emit();
}
const UNIT_OPTS = { night: [1, 2, 3, 4, 5, 6, 10, 14], week: [1, 2, 3, 4, 6, 8], month: [1, 2, 3, 6, 12] };
const unitQty = (unit, n) => t('qty.' + unit, { n });
const PriceFrom = ({ p, unit }) => html`${t('price.pre') ? t('price.pre') + ' ' : ''}<b>${fmtMoney(p)}</b> <span class="muted">/ ${t('per.' + unit)}${t('price.post')}</span>`;

function SiteHeader() {
  const r = S.u.route.name;
  const me = S.me && get('members', S.me);
  return html`<header class="site-head"><div class="wrap">
    <${Wordmark} onClick=${() => go('home')}/>
    <nav class="site-nav" aria-label=${t('nav.aria')}>
      <button aria-current=${r === 'search' ? 'page' : null} onClick=${() => go('search')}>${t('nav.find')}</button>
      <button onClick=${() => { go('home'); setTimeout(() => { const el = document.getElementById('how'); el && el.scrollIntoView({ behavior: 'smooth' }); }, 60); }}>${t('nav.how')}</button>
      <button aria-current=${r === 'my' ? 'page' : null} onClick=${() => (me ? go('my', { tab: 'coupons' }) : needLogin({ name: 'my', tab: 'coupons' }))}>${t('nav.coupons')}</button>
    </nav>
    <div class="grow"></div>
    <button class="lang-btn" onClick=${() => openModal('lang')} aria-label=${t('lang.title')}><${Icon} n="globe" cls="sm"/>${langName(S.lang)}</button>
    ${me ? html`<button class="acct" onClick=${() => go('my', { tab: 'bookings' })}><span class="avatar">${(me.name || me.id).slice(0, 1).toUpperCase()}</span><span class="nm">${me.id}</span></button>`
      : html`<button class="btn sm" onClick=${() => needLogin()}>${t('nav.login')}</button>`}
  </div></header>`;
}

function SearchBar({ compact }) {
  const Q = q();
  const [text, setText] = useState(Q.q);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  useEffect(() => setText(Q.q), [Q.q]);
  const sugg = useMemo(() => suggestions(text), [text, S.ver, S.lang]);
  const submit = (val) => { S.u.q = { ...Q, q: val != null ? val : text }; setOpen(false); go('search'); };
  const dur = Q.unit + ':' + Q.qty;
  return html`<form class="steel" role="search" onSubmit=${e => { e.preventDefault(); submit(); }}>
    <div class="cell q">
      <label for="sb-q">${t('search.where')}</label>
      <input id="sb-q" autocomplete="off" placeholder=${t('search.wherePh')} value=${text}
        onInput=${e => { setText(e.target.value); setOpen(true); setHi(0); }} onFocus=${() => setOpen(true)} onBlur=${() => setTimeout(() => setOpen(false), 150)}
        onKeyDown=${e => {
          if (!open || !sugg.length) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setHi(i => Math.min(sugg.length - 1, i + 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(i => Math.max(0, i - 1)); }
          else if (e.key === 'Enter' && text && sugg[hi]) { e.preventDefault(); setText(sugg[hi].label); submit(sugg[hi].label); }
        }}/>
      ${open && sugg.length > 0 && html`<div class="suggest" role="listbox">${sugg.map((s, i) => html`<button type="button" role="option" class=${i === hi ? 'on' : ''} onMouseDown=${e => e.preventDefault()} onClick=${() => { setText(s.label); submit(s.label); }}>
        <${Icon} n=${s.icon} cls="sm"/><span>${s.label}</span><span class="k">${s.kind}</span></button>`)}</div>`}
    </div>
    <div class="cell"><label for="sb-ci">${t('search.checkin')}</label>
      <input id="sb-ci" type="date" min=${today()} value=${ciDefault()} onChange=${e => { S.u.q = { ...q(), ci: e.target.value || today() }; emit(); }}/></div>
    <div class="cell"><label for="sb-dur">${t('search.duration')}</label>
      <select id="sb-dur" value=${dur} onChange=${e => { const [u, n] = e.target.value.split(':'); S.u.q = { ...q(), unit: u, qty: +n }; emit(); }}>
        ${UNITS.map(u => html`<optgroup label=${t('unit.' + u)}>${UNIT_OPTS[u].map(n => html`<option value=${u + ':' + n}>${unitQty(u, n)}</option>`)}</optgroup>`)}
      </select></div>
    <div class="cell"><label for="sb-g">${t('search.guests')}</label>
      <select id="sb-g" value=${Q.guests} onChange=${e => { S.u.q = { ...q(), guests: +e.target.value }; emit(); }}>${[1, 2, 3, 4].map(n => html`<option value=${n}>${t('qty.guests', { n })}</option>`)}</select></div>
    <button class="go" type="submit"><${Icon} n="search"/>${t('search.go')}</button>
  </form>`;
}
function norm(s) { return String(s || '').toLowerCase().replace(/[\s·・.,'’()-]/g, ''); }
function branchHay(b) {
  const parts = [];
  for (const f of ['name', 'area', 'station']) { const o = b[f] || {}; for (const k of Object.keys(o)) parts.push(o[k]); }
  parts.push(b.gu, tx(b.name, `b.${b.id}.name`), tx(b.station, `b.${b.id}.station`));
  const g = GEO.gu.find(x => x.ko === b.gu); if (g) parts.push(g.en, g.ja, g['zh-CN'], g['zh-TW']);
  return norm(parts.join('|'));
}
function suggestions(text) {
  const n = norm(text); if (!n) return [];
  const out = [], seen = new Set();
  const add = (label, kind, icon) => { if (!seen.has(label)) { seen.add(label); out.push({ label, kind, icon }); } };
  for (const b of publicBranches()) {
    if (branchHay(b).includes(n)) {
      if (norm(bName(b)).includes(n) || norm(b.name.ko).includes(n)) add(bName(b), t('sugg.branch'), 'building');
      if (norm(bStation(b)).includes(n) || norm(b.station.ko).includes(n)) add(bStation(b), t('sugg.station'), 'train');
    }
  }
  for (const g of GEO.gu) if ([g.ko, g.en, g.ja, g['zh-CN'], g['zh-TW']].some(x => norm(x).includes(n))) add(GU_NAME(g), t('sugg.area'), 'pin');
  return out.slice(0, 8);
}
function matchBranch(b, text) {
  const n = norm(text); if (!n) return true;
  return branchHay(b).includes(n);
}

function BranchMapPop({ b }) {
  const unit = bestUnit(b), p = minPrice(b, unit);
  return html`<div class="ph">${artFor(b, b.types[0])}</div>
    <div style="display:grid;gap:3px"><h4>${bTitle(b)}</h4>
      <div class="muted" style="font-size:12.5px;display:flex;gap:6px;align-items:center;flex-wrap:wrap"><${Lines} lines=${b.lines}/> ${bStation(b)} · ${t('walk.min', { n: b.walk })}</div>
      ${p != null && html`<div style="font-size:14px"><${PriceFrom} p=${p} unit=${unit}/></div>`}</div>
    <button class="btn sm" onClick=${() => go('branch', { id: b.id })}>${t('common.view')}<${Icon} n="arrowR" cls="sm"/></button>`;
}

function Home() {
  const pubs = publicBranches();
  const open = pubs.filter(b => b.status === 'open'), soon = pubs.filter(b => b.status === 'soon');
  const [sel, setSel] = useState(null);
  const ci = today();
  const avail = open.map(b => ({ b, n: availBranch(b, ci, bestUnit(b), 1, 1) })).sort((x, y) => y.n - x.n || (x.b.openDate < y.b.openDate ? 1 : -1));
  const avgWalk = pubs.length ? (pubs.reduce((a, b) => a + (b.walk || 0), 0) / pubs.length).toFixed(1).replace(/\.0$/, '') : '-';
  const typesShown = TYPES.filter(ty => pubs.some(b => b.type === ty));
  if (!pubs.length) return html`<div class="wrap section"><div class="empty"><strong>${t('home.empty')}</strong><span>${t('home.emptySub')}</span></div></div>`;
  return html`<${Fragment}>
    <section class="hero"><div class="wrap hero-grid">
      <div class="hero-left">
        <div>
          <div class="eyebrow"><span>Seoul</span><span>·</span><span>${t('home.openN', { n: open.length })}</span><span>·</span><span>${t('home.soonN', { n: soon.length })}</span></div>
          <h1>${t('home.h1a')}<br/>${t('home.h1b')} <em>${t('home.h1em')}</em></h1>
          <p class="lede">${t('home.lede')}</p>
        </div>
        <${SearchBar}/>
        <div class="quick"><span>${t('home.popular')}</span>${['성수', '신촌', '건대입구역', '삼성서울병원'].map(k => {
          const b = pubs.find(b => b.name.ko === k || b.station.ko === k || b.name.ko.startsWith(k));
          const label = b ? (b.station.ko === k ? bStation(b) : bName(b)) : k;
          return html`<button class="chip" onClick=${() => { S.u.q = { ...q(), q: label }; go('search'); }}>${label}</button>`;
        })}</div>
      </div>
      <div class="hero-map">
        <${MapView} fitKey="city" items=${pubs.map(b => ({ id: b.id, lat: b.lat, lng: b.lng, status: b.status, label: bName(b), aria: bTitle(b) }))}
          selected=${sel} onSelect=${setSel} renderPop=${it => html`<${BranchMapPop} b=${get('branches', it.id)}/>`}/>
      </div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="sec-head"><div><h2>${t('home.typesH')}</h2><p>${t('home.typesP')}</p></div></div>
      <div class="types" style=${`grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))`}>${typesShown.map(ty => {
        const list = pubs.filter(b => b.type === ty);
        const unit = ty === 'stay' ? 'month' : 'night';
        const p = Math.min(...list.map(b => minPrice(b, unit)).filter(x => x != null));
        return html`<button class="type-card" onClick=${() => { S.u.q = { ...q(), types: [ty], unit, qty: 1 }; go('search'); }}>
          <span class="unit">${t('type.' + ty + '.unit')}</span><h3>${t('type.' + ty)}</h3><p>${t('type.' + ty + '.desc')}</p>
          <span class="from"><span>${t('home.branchCount', { n: list.length })}</span><span><${PriceFrom} p=${p} unit=${unit}/></span></span></button>`;
      })}</div>
    </div></section>

    <section class="section"><div class="wrap">
      <div class="sec-head"><div><h2>${t('home.availH')}</h2><p>${t('home.availP', { date: fmtDate(ci) })}</p></div>
        <button class="btn line" onClick=${() => go('search')}>${t('home.seeAll')}<${Icon} n="arrowR" cls="sm"/></button></div>
      <div class="cards">${avail.slice(0, 8).map(({ b, n }) => html`<${BranchCard} b=${b} n=${n}/>`)}</div>
    </div></section>

    ${soon.length > 0 && html`<section class="section"><div class="wrap">
      <div class="sec-head"><div><h2>${t('home.soonH')}</h2><p>${t('home.soonP')}</p></div></div>
      <div class="cards">${soon.sort((a, b) => (a.openDate < b.openDate ? -1 : 1)).map(b => html`<${BranchCard} b=${b} n=${availBranch(b, b.openDate || ci, bestUnit(b), 1, 1)}/>`)}</div>
    </div></section>`}

    <section class="section" id="how"><div class="wrap">
      <div class="sec-head"><div><h2>${t('home.howH')}</h2><p>${t('home.howP')}</p></div></div>
      <div class="why">
        <div><div class="fig">${avgWalk}<small>${t('why.walk.unit')}</small></div><h4>${t('why.walk.h')}</h4><p>${t('why.walk.p')}</p></div>
        <div><div class="fig">${t('why.flex.fig')}</div><h4>${t('why.flex.h')}</h4><p>${t('why.flex.p')}</p></div>
        <div><div class="fig">${BUILTIN.length}<small>+</small></div><h4>${t('why.lang.h')}</h4><p>${t('why.lang.p')}</p></div>
        <div><div class="fig">${pubs.length}<small>${t('why.ops.unit')}</small></div><h4>${t('why.ops.h')}</h4><p>${t('why.ops.p')}</p></div>
      </div>
      <ol class="steps-list" style="list-style:none;padding:0;margin:28px 0 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:18px">
        ${[1, 2, 3, 4].map(i => html`<li style="display:grid;gap:6px;align-content:start"><span class="mono" style="font-size:12px;color:var(--oak);letter-spacing:.1em">STEP ${i}</span><b style="font-size:16px">${t('how.' + i + '.h')}</b><span class="sub" style="font-size:14px">${t('how.' + i + '.p')}</span></li>`)}
      </ol>
    </div></section>
  </${Fragment}>`;
}

function BranchCard({ b, n }) {
  const unit = bestUnit(b), p = minPrice(b, unit);
  return html`<button class="bcard" onClick=${() => go('branch', { id: b.id })}>
    <div class="ph">${artFor(b, b.types[0])}<div class="badges"><span class=${cx('badge', b.type === 'stay' ? '' : 'ink')}>${t('type.' + b.type)}</span>${b.status === 'soon' && html`<span class="badge">${t('status.soonOn', { date: fmtDate(b.openDate, { month: 'short', day: 'numeric' }) })}</span>`}</div></div>
    <h3>${bName(b)} <small>${bArea(b)}</small></h3>
    <div class="meta"><${Lines} lines=${b.lines}/><span>${bStation(b)} · ${t('walk.min', { n: b.walk })}</span></div>
    <div class="price"><span>${p != null ? html`<${PriceFrom} p=${p} unit=${unit}/>` : ''}</span>
      ${b.status === 'soon' ? html`<span class="avail soon"><${Icon} n="calendar" cls="sm"/>${t('avail.pre')}</span>` : n > 0 ? html`<span class="avail yes"><span class="dot"></span>${t('avail.n', { n })}</span>` : html`<span class="avail no">${t('avail.none')}</span>`}</div>
  </button>`;
}

function SearchPage() {
  const Q = q();
  const ci = ciDefault();
  const [sel, setSel] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const setQ = patchQ => { S.u.q = { ...q(), ...patchQ }; emit(); };
  let list = publicBranches().filter(b => matchBranch(b, Q.q))
    .filter(b => !Q.types.length || Q.types.includes(b.type))
    .filter(b => b.types.some(rt => rt.price[Q.unit] != null));
  const has = (b, o) => o === 'window' ? b.types.some(r => r.window === 'outer') : o === 'kitchen' ? b.amenities.some(a => a === 'kitchen' || a === 'kitchenette') : o === 'deposit0' ? !b.deposit || Q.unit !== 'month' : o === 'open' ? b.status === 'open' : b.amenities.includes(o);
  list = list.filter(b => Q.opts.every(o => has(b, o)));
  const rows = list.map(b => ({ b, n: availBranch(b, ci, Q.unit, Q.qty, Q.guests), p: minPrice(b, Q.unit) }));
  let shown = Q.avail ? rows.filter(r => r.n > 0) : rows;
  if (Q.max) shown = shown.filter(r => r.p != null && r.p <= Q.max);
  const sorters = { rec: (a, b) => (b.b.status === 'open') - (a.b.status === 'open') || b.n - a.n, price: (a, b) => a.p - b.p, walk: (a, b) => a.b.walk - b.b.walk, new: (a, b) => (a.b.openDate < b.b.openDate ? 1 : -1) };
  shown.sort(sorters[Q.sort] || sorters.rec);
  const hlGu = (() => { const n = norm(Q.q); if (!n) return null; const g = GEO.gu.find(g => [g.ko, g.en, g.ja, g['zh-CN'], g['zh-TW']].some(x => norm(x) === n || norm(x).replace(/gu$|구$|区$|區$/, '') === n)); return g ? g.ko : null; })();
  const toggle = (k, v) => setQ({ [k]: Q[k].includes(v) ? Q[k].filter(x => x !== v) : [...Q[k], v] });
  const maxOpts = Q.unit === 'month' ? [600000, 700000, 900000, 1200000] : Q.unit === 'week' ? [200000, 300000, 400000] : [50000, 70000, 100000];
  return html`<${Fragment}>
    <div class="search-top"><div class="wrap">
      <${SearchBar}/>
      <div class="filters">
        ${TYPES.filter(ty => publicBranches().some(b => b.type === ty)).map(ty => html`<button class="chip" aria-pressed=${Q.types.includes(ty)} onClick=${() => toggle('types', ty)}>${t('type.' + ty)}</button>`)}
        <span class="sep"></span>
        ${['window', 'kitchen', 'washer', 'deposit0', 'open'].map(o => html`<button class="chip" aria-pressed=${Q.opts.includes(o)} onClick=${() => toggle('opts', o)}>${t('opt.' + o)}</button>`)}
        <button class="chip" aria-pressed=${Q.avail} onClick=${() => setQ({ avail: !Q.avail })}><${Icon} n="check" cls="sm"/>${t('opt.avail')}</button>
        <span class="sep"></span>
        <label class="sr" for="f-max">${t('filter.max')}</label>
        <select id="f-max" class="chip select" value=${Q.max} onChange=${e => setQ({ max: +e.target.value })}>
          <option value="0">${t('filter.maxAny')}</option>${maxOpts.map(v => html`<option value=${v}>${t('filter.maxUnder', { amount: fmtMoney(v), unit: t('per.' + Q.unit) })}</option>`)}</select>
        <label class="sr" for="f-sort">${t('filter.sort')}</label>
        <select id="f-sort" class="chip select" value=${Q.sort} onChange=${e => setQ({ sort: e.target.value })}>${['rec', 'price', 'walk', 'new'].map(s => html`<option value=${s}>${t('sort.' + s)}</option>`)}</select>
      </div>
    </div></div>
    <div class=${cx('results', showMap && 'show-map')}>
      <div class="list">
        <div class="count"><span>${t('search.count', { n: shown.length, date: fmtDate(ci), dur: unitQty(Q.unit, Q.qty) })}</span>
          <button class="btn line sm view-toggle" onClick=${() => setShowMap(true)}><${Icon} n="map" cls="sm"/>${t('search.showMap')}</button></div>
        ${shown.length === 0 && html`<div class="empty"><strong>${t('search.none')}</strong><span>${t('search.noneSub')}</span>
          <button class="btn line sm" onClick=${() => { S.u.q = { ...q(), q: '', types: [], opts: [], avail: false, max: 0 }; emit(); }}>${t('search.reset')}</button></div>`}
        ${shown.map(({ b, n, p }) => html`<button class=${cx('rcard', sel === b.id && 'on')} onMouseEnter=${() => setSel(b.id)} onFocus=${() => setSel(b.id)} onClick=${() => go('branch', { id: b.id })}>
          <div class="ph">${artFor(b, b.types[0])}</div>
          <div class="info">
            <h3>${bTitle(b)}${b.status === 'soon' && html`<span class="badge oak">${t('status.soonOn', { date: fmtDate(b.openDate, { month: 'short', day: 'numeric' }) })}</span>`}</h3>
            <div class="muted" style="font-size:13.5px">${bArea(b)}</div>
            <div class="row tight" style="font-size:13.5px;color:var(--ink-2)"><${Lines} lines=${b.lines}/>${bStation(b)} · ${t('walk.min', { n: b.walk })}</div>
            <div class="tags">${(b.highlights || []).slice(0, 3).map(hk => html`<span class="badge line">${t('hl.' + hk)}</span>`)}</div>
            <div class="bottom">
              <div class="p">${p != null ? html`${t('price.pre') ? html`<small>${t('price.pre')} </small>` : ''}${fmtMoney(p)}<small> / ${t('per.' + Q.unit)}${t('price.post')}</small>` : html`<small>${t('search.noUnit')}</small>`}</div>
              ${n > 0 ? html`<span class="avail yes"><span class="dot"></span>${t('avail.n', { n })}</span>` : html`<span class="avail no">${t('avail.none')}</span>`}
            </div>
          </div></button>`)}
      </div>
      <div class="mapcol">
        <${MapView} fitKey=${'r' + shown.map(r => r.b.id).join(',')} items=${shown.map(({ b, p }) => ({ id: b.id, lat: b.lat, lng: b.lng, status: b.status, label: p != null ? fmtShort(p) : bName(b), aria: bTitle(b) }))}
          selected=${sel} onSelect=${setSel} hlGu=${hlGu} renderPop=${it => html`<${BranchMapPop} b=${get('branches', it.id)}/>`}/>
        <div style="position:absolute;top:12px;inset-inline-start:12px;z-index:9" class="view-toggle"><button class="btn sm" onClick=${() => setShowMap(false)}><${Icon} n="list" cls="sm"/>${t('search.showList')}</button></div>
      </div>
    </div>
  </${Fragment}>`;
}

function BranchPage({ id }) {
  const b = get('branches', id);
  const minCi = b && b.status === 'soon' && b.openDate > today() ? b.openDate : today();
  const Q = q();
  const [typeId, setType] = useState(() => (b ? (b.types.find(r => r.price[Q.unit] != null) || b.types[0]).id : null));
  const [unit, setUnit] = useState(() => (b && b.types.some(r => r.price[Q.unit] != null) ? Q.unit : b ? bestUnit(b) : 'month'));
  const [ci, setCi] = useState(() => maxDate(ciDefault(), minCi));
  const [qty, setQty] = useState(Q.unit === unit ? Q.qty : 1);
  const [guests, setGuests] = useState(Q.guests || 1);
  if (!b || b.status === 'prep' || b.status === 'closed') return html`<div class="wrap section"><div class="empty"><strong>${t('branch.missing')}</strong><button class="btn line sm" onClick=${() => go('search')}>${t('nav.find')}</button></div></div>`;
  const rt = b.types.find(r => r.id === typeId) || b.types[0];
  const unitOk = u => rt.price[u] != null;
  const curUnit = unitOk(unit) ? unit : UNITS.find(unitOk);
  const co = stayEnd(ci, curUnit, qty);
  const nAvail = availFor(b, rt.id, ci, co);
  const base = (rt.price[curUnit] || 0) * qty;
  const deposit = curUnit === 'month' ? b.deposit || 0 : 0;
  const g = GEO.gu.find(x => x.ko === b.gu);
  const book = () => {
    const params = { name: 'book', bid: b.id, tid: rt.id, ci, unit: curUnit, qty, guests: Math.min(guests, rt.cap) };
    if (!S.me) return needLogin(params);
    go('book', params);
  };
  const maxQty = curUnit === 'night' ? 30 : curUnit === 'week' ? 12 : 12;
  return html`<div class="wrap">
    <nav class="crumbs" aria-label="breadcrumb"><button onClick=${() => go('search')}>${t('nav.find')}</button><${Icon} n="chevR" cls="sm"/>
      <button onClick=${() => { S.u.q = { ...q(), q: g ? GU_NAME(g) : b.gu }; go('search'); }}>${g ? GU_NAME(g) : b.gu}</button><${Icon} n="chevR" cls="sm"/><span>${bName(b)}</span></nav>
    <div class="b-title"><div>
      <h1>${bTitle(b)}</h1>
      <div class="meta">${b.status === 'soon' ? html`<span class="badge oak">${t('status.soonOn', { date: fmtDateLong(b.openDate) })}</span>` : html`<span class="badge good">${t('status.open')}</span>`}
        <span>${bArea(b)}</span><span class="row tight"><${Lines} lines=${b.lines}/>${bStation(b)} · ${t('walk.min', { n: b.walk })}</span></div></div>
      <div class="row"><a class="btn line sm" href=${gmapsUrl(b.lat, b.lng)} target="_blank" rel="noopener"><${Icon} n="map" cls="sm"/>${t('map.google')}</a>
        <button class="btn line sm" onClick=${() => openModal('tour', { branchId: b.id })}><${Icon} n="calendar" cls="sm"/>${t('tour.cta')}</button></div>
    </div>
    <div class="gallery">
      <div>${artFor(b, rt)}<span class="cap">${rtName(b, rt)}</span></div>
      <div><${Art} kind="lounge" seed=${b.art} label=${t('gal.lounge')}/><span class="cap">${t('gal.lounge')}</span></div>
      <div><${Art} kind="laundry" seed=${b.art} label=${t('gal.laundry')}/><span class="cap">${t('gal.laundry')}</span></div>
      <div><${Art} kind="facade" seed=${b.art} label=${t('gal.facade')}/><span class="cap">${t('gal.facade')} · ${t('gal.note')}</span></div>
    </div>
    <div class="b-body">
      <div class="b-main">
        <section><p class="desc">${bDesc(b)}</p><div class="hl-row">${(b.highlights || []).map(hk => html`<span class="badge oak">${t('hl.' + hk)}</span>`)}</div></section>
        <section><h2>${t('branch.rooms')}</h2><div class="rt-list">${b.types.map(r => {
          const n = availFor(b, r.id, ci, stayEnd(ci, r.price[curUnit] != null ? curUnit : UNITS.find(u => r.price[u] != null), qty));
          return html`<div class=${cx('rt', r.id === rt.id && 'on')}>
            <div class="ph">${artFor(b, r)}</div>
            <div><h3>${rtName(b, r)}</h3><div class="specs">
              <span><${Icon} n="ruler" cls="sm"/>${r.size}㎡</span><span><${Icon} n="bath" cls="sm"/>${t('rt.bath.' + r.bath)}</span>
              <span><${Icon} n="window" cls="sm"/>${t('rt.win.' + r.window)}</span><span><${Icon} n="users" cls="sm"/>${t('rt.cap', { n: r.cap })}</span><span><${Icon} n="bed" cls="sm"/>${t('rt.bed.' + r.bed)}</span></div>
              <div style="margin-top:6px">${n > 0 ? html`<span class="avail yes"><span class="dot"></span>${t('avail.n', { n })}</span>` : html`<span class="avail no">${t('avail.noneDates')}</span>`}</div></div>
            <div class="act" style="display:grid;gap:8px;justify-items:end"><div class="prices">${UNITS.filter(u => r.price[u] != null).map(u => html`<span><b>${fmtMoney(r.price[u])}</b> / ${t('per.' + u)}</span>`)}</div>
              <button class="btn sm" disabled=${r.id === rt.id} onClick=${() => { setType(r.id); if (r.price[unit] == null) setUnit(UNITS.find(u => r.price[u] != null)); }}>${r.id === rt.id ? t('common.selected') : t('common.select')}</button></div>
          </div>`;
        })}</div></section>
        <section><h2>${t('branch.amenities')}</h2><div class="amen">${b.amenities.map(a => html`<div><${Icon} n=${AMEN_ICON[a] || 'check'}/>${t('am.' + a)}</div>`)}</div></section>
        <section><h2>${t('branch.rules')}</h2><dl class="rules">
          <div><dt>${t('rule.in')}</dt><dd>${b.checkin ? b.checkin : t('rule.inStay')}</dd></div>
          <div><dt>${t('rule.out')}</dt><dd>${b.checkout ? b.checkout : t('rule.outStay')}</dd></div>
          <div><dt>${t('rule.deposit')}</dt><dd>${b.deposit ? t('rule.depositV', { amount: fmtMoney(b.deposit) }) : t('rule.none')}</dd></div>
          <div><dt>${t('rule.min')}</dt><dd>${b.types.some(r => r.price.night != null) ? t('rule.min1n') : t('rule.min1w')}</dd></div>
        </dl></section>
        <section><h2>${t('branch.location')}</h2>
          <div class="loc-map"><${MapView} focus=${{ lat: b.lat, lng: b.lng, zoom: 7 }} items=${[{ id: b.id, lat: b.lat, lng: b.lng, status: b.status, label: bName(b), aria: bTitle(b) }]} selected=${null} onSelect=${() => {}}/></div>
          <div class="row" style="margin-top:12px"><span class="sub" style="font-size:14px">${bArea(b)} · ${bStation(b)} ${t('walk.min', { n: b.walk })}</span>
            <a class="btn line sm" href=${gmapsDir(b.lat, b.lng)} target="_blank" rel="noopener"><${Icon} n="walk" cls="sm"/>${t('map.directions')}</a></div>
        </section>
      </div>
      <aside class="book-card" aria-label=${t('book.card')}>
        <div class="big">${fmtMoney(rt.price[curUnit])} <small>/ ${t('per.' + curUnit)}</small></div>
        <div class="field"><span>${t('book.type')}</span>
          <select class="select" id="bk-type" value=${rt.id} onChange=${e => { const r = b.types.find(x => x.id === e.target.value); setType(r.id); if (r.price[unit] == null) setUnit(UNITS.find(u => r.price[u] != null)); }}>
            ${b.types.map(r => html`<option value=${r.id}>${rtName(b, r)}</option>`)}</select></div>
        <div class="unit-tabs" role="group" aria-label=${t('search.duration')}>${UNITS.map(u => html`<button type="button" aria-pressed=${curUnit === u} disabled=${!unitOk(u)} onClick=${() => { setUnit(u); setQty(1); }}>${t('unit.' + u)}</button>`)}</div>
        <div class="grid2">
          <label class="field"><span>${t('search.checkin')}</span><input class="input" id="bk-ci" type="date" min=${minCi} value=${ci} onChange=${e => setCi(maxDate(e.target.value || minCi, minCi))}/></label>
          <div class="field"><span>${t('book.length')}</span><div class="stepper"><button type="button" aria-label="-" onClick=${() => setQty(Math.max(1, qty - 1))}><${Icon} n="minus" cls="sm"/></button><span>${unitQty(curUnit, qty)}</span><button type="button" aria-label="+" onClick=${() => setQty(Math.min(maxQty, qty + 1))}><${Icon} n="plus" cls="sm"/></button></div></div>
        </div>
        <div class="field"><span>${t('search.guests')}</span><div class="stepper" style="width:max-content"><button type="button" aria-label="-" onClick=${() => setGuests(Math.max(1, guests - 1))}><${Icon} n="minus" cls="sm"/></button><span>${t('qty.guests', { n: Math.min(guests, rt.cap) })}</span><button type="button" aria-label="+" onClick=${() => setGuests(Math.min(rt.cap, guests + 1))}><${Icon} n="plus" cls="sm"/></button></div></div>
        <div class="note"><${Icon} n="calendar" cls="sm"/>${fmtDateLong(ci)} → ${fmtDateLong(co)} · ${t('nights', { n: daysBetween(ci, co) })}</div>
        <div class="stack" style="gap:8px">
          <div class="sumline"><span>${fmtMoney(rt.price[curUnit])} × ${unitQty(curUnit, qty)}</span><span>${fmtMoney(base)}</span></div>
          ${deposit > 0 && html`<div class="sumline"><span>${t('sum.deposit')}</span><span>${fmtMoney(deposit)}</span></div>`}
          <div class="sumline total"><span>${t('sum.total')}</span><span>${fmtMoney(base + deposit)}</span></div>
        </div>
        ${nAvail > 0 ? html`<span class="avail yes"><span class="dot"></span>${t('avail.nDates', { n: nAvail })}</span>` : html`<span class="avail no">${t('avail.noneDates')}</span>`}
        <button class="btn lg block" disabled=${nAvail === 0} onClick=${book}>${t('book.cta')}</button>
        <button class="btn line block" onClick=${() => openModal('tour', { branchId: b.id })}>${t('tour.cta')}</button>
        <p class="note"><${Icon} n="ticket" cls="sm"/>${t('book.couponHint')}</p>
      </aside>
    </div>
  </div>`;
}

function CheckoutPage(r) {
  const b = get('branches', r.bid);
  const me = S.me && get('members', S.me);
  const [guest, setGuest] = useState(() => ({ name: (me && me.name) || '', phone: (me && me.phone && !me.phone.includes('•') ? me.phone : ''), email: (me && me.email) || '', country: (me && me.country) || 'KR', note: '' }));
  const [walletId, setWallet] = useState(null);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);
  const [pay, setPay] = useState('card');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (!b || !me) return html`<div class="wrap section"><div class="empty"><strong>${t('book.missing')}</strong><button class="btn line sm" onClick=${() => go('search')}>${t('nav.find')}</button></div></div>`;
  const rt = b.types.find(x => x.id === r.tid);
  const co = stayEnd(r.ci, r.unit, r.qty);
  const nights = daysBetween(r.ci, co);
  const base = rt.price[r.unit] * r.qty;
  const ctx = { b, unit: r.unit, nights, base };
  const mine = all('wallet').filter(w => w.userId === me.id && walletState(w) === 'active');
  const opts = mine.map(w => { const c = couponOf(w); const fit = couponFit(c, ctx); return { w, c, fit, d: fit.ok ? couponDiscount(c, base) : 0 }; }).sort((a, b2) => b2.d - a.d);
  const best = opts.find(o => o.fit.ok);
  const selOpt = opts.find(o => o.w.id === walletId && o.fit.ok);
  const disc = selOpt ? selOpt.d : 0;
  const deposit = r.unit === 'month' ? b.deposit || 0 : 0;
  const total = base - disc + deposit;
  const applyCode = async () => {
    setMsg(null);
    const res = await redeemCode(me.id, code);
    if (!res.ok) return setMsg({ ok: false, text: res.msg });
    const c = res.coupon || couponOf(get('wallet', res.walletId));
    const fit = couponFit(c, ctx);
    if (fit.ok) { setWallet(res.walletId); setCode(''); setMsg({ ok: true, text: t(res.already ? 'cp.ok.already' : 'cp.ok.applied', { amount: fmtMoney(couponDiscount(c, base)) }) }); }
    else setMsg({ ok: false, text: t('cp.ok.savedButNot', { why: fit.why }) });
  };
  const submit = async () => {
    setErr('');
    if (!guest.name.trim()) return setErr(t('book.err.name'));
    if (!guest.phone.trim() && !guest.email.trim()) return setErr(t('book.err.contact'));
    if (!agree) return setErr(t('book.err.agree'));
    setBusy(true);
    try {
      const id = await createBooking({ userId: me.id, branchId: b.id, typeId: rt.id, ci: r.ci, unit: r.unit, qty: r.qty, guests: r.guests, guest: { ...guest, phone: guest.phone || me.phone }, walletId: selOpt ? walletId : null, pay });
      go('done', { id });
    } catch (e) { setErr(t(e && e.key ? e.key : 'book.err.generic')); }
    finally { setBusy(false); }
  };
  const fld = (k, label, type) => html`<label class="field"><span>${label}</span><input class="input" id=${'co-' + k} type=${type || 'text'} value=${guest[k]} onInput=${e => setGuest({ ...guest, [k]: e.target.value })}/></label>`;
  return html`<div class="wrap"><div class="co">
    <div class="stack" style="gap:26px">
      <div><button class="btn quiet sm" onClick=${() => go('branch', { id: b.id })}><${Icon} n="arrowL" cls="sm"/>${t('common.back')}</button><h1 style="margin-top:8px">${t('book.title')}</h1></div>
      <section class="co-step"><h2><span class="n">1</span>${t('book.s1')}</h2>
        <dl class="kv"><dt>${t('book.branch')}</dt><dd>${bTitle(b)}</dd><dt>${t('book.type')}</dt><dd>${rtName(b, rt)} · ${rt.size}㎡</dd>
          <dt>${t('book.dates')}</dt><dd>${fmtDateLong(r.ci)} → ${fmtDateLong(co)} (${unitQty(r.unit, r.qty)}, ${t('nights', { n: nights })})</dd><dt>${t('search.guests')}</dt><dd>${t('qty.guests', { n: r.guests })}</dd></dl></section>
      <section class="co-step"><h2><span class="n">2</span>${t('book.s2')}</h2>
        <div class="grid2">${fld('name', t('guest.name'))}${fld('phone', t('guest.phone'), 'tel')}${fld('email', t('guest.email'), 'email')}
          <label class="field"><span>${t('guest.country')}</span><select class="select" id="co-country" value=${guest.country} onChange=${e => setGuest({ ...guest, country: e.target.value })}>${COUNTRIES.map(c => html`<option value=${c}>${countryName(c)}</option>`)}</select></label></div>
        <label class="field"><span>${t('guest.note')}</span><textarea class="textarea" id="co-note" placeholder=${t('guest.notePh')} value=${guest.note} onInput=${e => setGuest({ ...guest, note: e.target.value })}></textarea></label></section>
      <section class="co-step"><h2><span class="n">3</span>${t('book.s3')}</h2>
        <div class="field"><span>${t('cp.enter')}</span><div class="cp-code"><input class="input" id="co-code" placeholder=${t('cp.enterPh')} value=${code} onInput=${e => setCode(e.target.value)} onKeyDown=${e => { if (e.key === 'Enter') { e.preventDefault(); applyCode(); } }}/><button class="btn" type="button" onClick=${applyCode} disabled=${!code.trim()}>${t('cp.apply')}</button></div>
          ${msg && html`<span class=${cx('cp-msg', msg.ok ? 'ok' : 'err')}><${Icon} n=${msg.ok ? 'check' : 'warn'} cls="sm"/>${msg.text}</span>`}</div>
        <div class="field"><span>${t('cp.mine', { n: opts.length })}</span>
          ${opts.length === 0 ? html`<p class="muted" style="font-size:13.5px">${t('cp.mineNone')}</p>` : html`<div class="tickets">
            <button type="button" class=${cx('ticket pick plain', !selOpt && 'sel')} style="grid-template-columns:1fr auto" onClick=${() => setWallet(null)}><div class="det"><h4>${t('cp.noneUse')}</h4></div><div class="tk-side"><span class="radio">${!selOpt && html`<${Icon} n="check" cls="sm"/>`}</span></div></button>
            ${opts.map(o => html`<${Ticket} c=${o.c} w=${o.w} pick=${o.fit.ok} sel=${selOpt && selOpt.w.id === o.w.id} off=${!o.fit.ok} onClick=${() => o.fit.ok && setWallet(o.w.id)}
              note=${o.fit.ok ? html`<span class="badge good">-${fmtMoney(o.d)}</span>${best && best.w.id === o.w.id && html`<span class="badge oak">${t('cp.best')}</span>`}` : html`<span class="muted" style="font-size:12px;text-align:end">${o.fit.why}</span>`}/>`)}
          </div>`}</div></section>
      <section class="co-step"><h2><span class="n">4</span>${t('book.s4')}</h2>
        <div class="pay-opts" role="radiogroup">${['card', 'easy', 'intl', 'transfer'].map(m => html`<label><input type="radio" name="pay" value=${m} checked=${pay === m} onChange=${() => setPay(m)}/>${t('pay.' + m)}</label>`)}</div>
        <label class="check"><input type="checkbox" id="co-agree" checked=${agree} onChange=${e => setAgree(e.target.checked)}/>${t('book.agree')}</label>
        ${err && html`<span class="cp-msg err"><${Icon} n="warn" cls="sm"/>${err}</span>`}
        <button class="btn lg" disabled=${busy} onClick=${submit}>${busy ? html`<span class="spinner"></span>` : html`<${Icon} n="lock" cls="sm"/>`}${t('book.payBtn', { amount: fmtMoney(total) })}</button>
        <p class="note"><${Icon} n="info" cls="sm"/>${t('book.demoPay')}</p></section>
    </div>
    <aside class="sum-card"><div class="ph">${artFor(b, rt)}</div><div class="in">
      <div><b style="font-size:16px">${bTitle(b)}</b><div class="muted" style="font-size:13px">${rtName(b, rt)} · ${fmtDate(r.ci)} → ${fmtDate(co)}</div></div>
      <div class="sumline"><span>${fmtMoney(rt.price[r.unit])} × ${unitQty(r.unit, r.qty)}</span><span>${fmtMoney(base)}</span></div>
      ${selOpt && html`<div class="sumline"><span>${t('sum.coupon')} · ${cpName(selOpt.c)}</span><span class="neg">-${fmtMoney(disc)}</span></div>`}
      ${deposit > 0 && html`<div class="sumline"><span>${t('sum.depositRefund')}</span><span>${fmtMoney(deposit)}</span></div>`}
      <div class="sumline total"><span>${t('sum.total')}</span><span>${fmtMoney(total)}</span></div>
    </div></aside>
  </div></div>`;
}

function Ticket({ c, w, pick, sel, off, onClick, note }) {
  if (!c) return null;
  const st = w ? walletState(w) : 'active';
  return html`<${pick ? 'button' : 'div'} type=${pick ? 'button' : null} class=${cx('ticket', pick && 'pick', sel && 'sel', (off || (st !== 'active')) && 'off')} onClick=${onClick}>
    <div class="amt"><b>${c.dtype === 'percent' ? c.value + '%' : fmtCompactWon(c.value)}</b><small>${t('cp.off')}</small></div>
    <div class="det"><h4>${cpName(c)}</h4><div class="cond">${couponCond(c) || t('cp.noCond')}</div>
      <div class="cond">${t('cp.until', { date: fmtDateLong(c.to) })}${w && w.code ? html` · <span class="mono">${w.code}</span>` : ''}</div></div>
    <div class="tk-side">${note}${pick && html`<span class="radio">${sel && html`<${Icon} n="check" cls="sm"/>`}</span>`}
      ${!pick && w && st !== 'active' && html`<span class="badge">${t('cp.st.' + st)}</span>`}</div>
  </${pick ? 'button' : 'div'}>`;
}

function DonePage({ id }) {
  const bk = get('bookings', id);
  if (!bk) return html`<div class="wrap section"><div class="empty"><strong>${t('book.missing')}</strong></div></div>`;
  const b = get('branches', bk.branchId), rt = b.types.find(x => x.id === bk.typeId);
  return html`<div class="wrap"><div class="done-hero">
    <span class="tick"><${Icon} n="check" cls="lg"/></span>
    <h1>${t('done.h')}</h1><p class="sub">${t('done.p')}</p>
    <div class="row"><span class="code-box">${bk.code}</span><button class="btn line sm" onClick=${() => copyText(bk.code, t('common.copied'))}><${Icon} n="copy" cls="sm"/>${t('common.copy')}</button></div>
  </div>
  <div class="cols2" style="padding-bottom:56px">
    <div class="panel"><div class="pad"><dl class="kv">
      <dt>${t('book.branch')}</dt><dd>${bTitle(b)}</dd><dt>${t('book.type')}</dt><dd>${rtName(b, rt)}</dd>
      <dt>${t('book.dates')}</dt><dd>${fmtDateLong(bk.checkIn)} → ${fmtDateLong(bk.checkOut)} (${unitQty(bk.unit, bk.qty)})</dd>
      <dt>${t('book.room')}</dt><dd>${t('done.roomLater')}</dd>
      <dt>${t('sum.total')}</dt><dd><b>${fmtMoney(bk.price.total)}</b>${bk.coupon ? html` <span class="badge good">${t('sum.coupon')} -${fmtMoney(bk.coupon.discount)}</span>` : ''}</dd>
      <dt>${t('book.pay')}</dt><dd>${t('pay.' + bk.pay.method)}</dd>
    </dl></div></div>
    <div class="stack">
      <div class="callout"><b>${t('done.nextH')}</b><span>${t('done.next')}</span></div>
      <div class="row"><button class="btn" onClick=${() => go('my', { tab: 'bookings' })}>${t('done.my')}</button>
        <a class="btn line" href=${gmapsDir(b.lat, b.lng)} target="_blank" rel="noopener"><${Icon} n="walk" cls="sm"/>${t('map.directions')}</a></div>
    </div>
  </div></div>`;
}

function MyPage({ tab }) {
  const me = S.me && get('members', S.me);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);
  const [open, setOpen] = useState(null);
  if (!me) return html`<div class="wrap section"><div class="empty"><strong>${t('my.login')}</strong><button class="btn sm" onClick=${() => needLogin({ name: 'my', tab })}>${t('nav.login')}</button></div></div>`;
  const cur = tab || 'bookings';
  const bks = all('bookings').filter(x => x.userId === me.id).sort((a, b) => (a.checkIn < b.checkIn ? 1 : -1));
  const upcoming = bks.filter(x => x.status === 'confirmed' || x.status === 'staying');
  const past = bks.filter(x => x.status === 'done' || x.status === 'cancelled');
  const wal = all('wallet').filter(w => w.userId === me.id).sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1));
  const usable = wal.filter(w => walletState(w) === 'active');
  const rest = wal.filter(w => walletState(w) !== 'active');
  const tours = all('tours').filter(x => x.userId === me.id).sort((a, b) => (a.date < b.date ? 1 : -1));
  const reg = async () => {
    setMsg(null);
    const r = await redeemCode(me.id, code);
    if (r.ok) { setCode(''); setMsg({ ok: true, text: r.already ? t('cp.reg.already') : t('cp.reg.ok', { name: cpName(r.coupon || couponOf(get('wallet', r.walletId))) }) }); }
    else setMsg({ ok: false, text: r.msg });
  };
  const tabs = [['bookings', t('my.tab.bookings'), upcoming.length], ['coupons', t('my.tab.coupons'), usable.length], ['tours', t('my.tab.tours'), tours.length], ['profile', t('my.tab.profile')]];
  const BkCard = ({ bk }) => {
    const b = get('branches', bk.branchId); const rt = b && b.types.find(x => x.id === bk.typeId);
    if (!b || !rt) return null;
    const canCancel = bk.status === 'confirmed' && bk.checkIn > today();
    const canExt = bk.unit === 'month' && (bk.status === 'staying' || bk.status === 'confirmed');
    return html`<div class="bk-card">
      <div class="ph">${artFor(b, rt)}</div>
      <div style="display:grid;gap:4px;min-width:0"><h3>${bTitle(b)} <span class=${cx('badge', BK_BADGE[bk.status])}>${t('bk.' + bk.status)}</span></h3>
        <span class="sub" style="font-size:13.5px">${rtName(b, rt)} · ${fmtDateLong(bk.checkIn)} → ${fmtDateLong(bk.checkOut)} (${unitQty(bk.unit, bk.qty)}${(bk.ext || []).length ? ' + ' + t('my.extended', { n: bk.ext.reduce((a, e) => a + e.months, 0) }) : ''})</span>
        <span class="muted" style="font-size:12.5px"><span class="mono">${bk.code}</span> · ${fmtMoney(bk.price.total)}${bk.coupon ? ' · ' + t('sum.coupon') + ' -' + fmtMoney(bk.coupon.discount) : ''}${bk.roomNo && bk.status !== 'cancelled' ? ' · ' + t('my.room', { no: bk.roomNo }) : ''}</span>
        ${open === bk.id && html`<dl class="kv" style="margin-top:8px;font-size:13px"><dt>${t('guest.name')}</dt><dd>${bk.guest.name}</dd><dt>${t('book.pay')}</dt><dd>${t('pay.' + bk.pay.method)} · ${fmtDateLong(bk.pay.paidAt)}</dd>
          ${bk.price.deposit > 0 && html`<dt>${t('sum.deposit')}</dt><dd>${fmtMoney(bk.price.deposit)}</dd>`}${(bk.ext || []).map(e => html`<dt>${t('my.extPay')}</dt><dd>${t('qty.month', { n: e.months })} · ${fmtMoney(e.amount)}</dd>`)}</dl>`}
      </div>
      <div class="act">
        <button class="btn line sm" onClick=${() => setOpen(open === bk.id ? null : bk.id)}>${open === bk.id ? t('common.close') : t('common.details')}</button>
        ${canExt && html`<button class="btn sm" onClick=${() => openModal('extend', { id: bk.id })}>${t('my.extend')}</button>`}
        ${canCancel && html`<button class="btn quiet sm" onClick=${async () => { if (await askConfirm({ title: t('my.cancelQ'), body: t('my.cancelBody', { code: bk.code }), ok: t('my.cancel'), cancel: t('common.keep'), danger: true })) { await cancelBooking(bk.id, 'user'); toast(t('my.cancelled')); } }}>${t('my.cancel')}</button>`}
      </div></div>`;
  };
  return html`<div class="wrap" style="padding-bottom:56px">
    <div class="my-head"><span class="avatar">${(me.name || me.id).slice(0, 1).toUpperCase()}</span><div><h1>${me.name}</h1><span class="muted mono" style="font-size:13px">${me.id}</span></div>
      <div class="grow" style="flex:1"></div><button class="btn line sm" onClick=${() => { S.me = null; store.set('me', null); go('home'); }}><${Icon} n="logout" cls="sm"/>${t('my.logout')}</button></div>
    <div class="seg-tabs" role="tablist">${tabs.map(([k, l, n]) => html`<button role="tab" aria-selected=${cur === k} onClick=${() => go('my', { tab: k })}>${l}${n != null && html`<span class="count">${n}</span>`}</button>`)}</div>
    <div style="padding-top:20px" class="stack">
    ${cur === 'bookings' && html`<${Fragment}>
      ${bks.length === 0 && html`<div class="empty"><strong>${t('my.noBk')}</strong><button class="btn sm" onClick=${() => go('search')}>${t('nav.find')}</button></div>`}
      ${upcoming.length > 0 && html`<h3 style="font-size:15px">${t('my.upcoming')}</h3>${upcoming.map(bk => html`<${BkCard} bk=${bk}/>`)}`}
      ${past.length > 0 && html`<h3 style="font-size:15px;margin-top:10px">${t('my.past')}</h3>${past.map(bk => html`<${BkCard} bk=${bk}/>`)}`}
    </${Fragment}>`}
    ${cur === 'coupons' && html`<${Fragment}>
      <div class="panel"><div class="pad stack" style="gap:10px"><label class="field" for="my-code"><span>${t('cp.register')}</span></label>
        <div class="cp-code"><input class="input" id="my-code" placeholder=${t('cp.enterPh')} value=${code} onInput=${e => setCode(e.target.value)} onKeyDown=${e => { if (e.key === 'Enter') reg(); }}/><button class="btn" onClick=${reg} disabled=${!code.trim()}>${t('cp.registerBtn')}</button></div>
        ${msg && html`<span class=${cx('cp-msg', msg.ok ? 'ok' : 'err')}><${Icon} n=${msg.ok ? 'check' : 'warn'} cls="sm"/>${msg.text}</span>`}
        <p class="note"><${Icon} n="info" cls="sm"/>${t('cp.registerHint')}</p></div></div>
      <h3 style="font-size:15px">${t('cp.usable', { n: usable.length })}</h3>
      ${usable.length === 0 ? html`<p class="muted">${t('cp.mineNone')}</p>` : html`<div class="tickets">${usable.map(w => html`<${Ticket} c=${couponOf(w)} w=${w} note=${html`<span class="muted" style="font-size:12px">${t('cp.via.' + w.via)}</span>`}/>`)}</div>`}
      ${rest.length > 0 && html`<h3 style="font-size:15px;margin-top:8px">${t('cp.history')}</h3><div class="tickets">${rest.map(w => html`<${Ticket} c=${couponOf(w)} w=${w}/>`)}</div>`}
    </${Fragment}>`}
    ${cur === 'tours' && html`<${Fragment}>
      ${tours.length === 0 ? html`<div class="empty"><strong>${t('my.noTour')}</strong></div>` : tours.map(tr => { const b = get('branches', tr.branchId); return b && html`<div class="bk-card" style="grid-template-columns:minmax(0,1fr) auto"><div style="display:grid;gap:3px"><h3>${bTitle(b)} <span class=${cx('badge', TOUR_BADGE[tr.status])}>${t('tour.st.' + tr.status)}</span></h3><span class="sub" style="font-size:13.5px">${fmtDateLong(tr.date)} ${tr.time}</span></div><a class="btn line sm" href=${gmapsDir(b.lat, b.lng)} target="_blank" rel="noopener">${t('map.directions')}</a></div>`; })}
    </${Fragment}>`}
    ${cur === 'profile' && html`<div class="panel"><div class="pad stack">
      <dl class="kv"><dt>${t('profile.id')}</dt><dd class="mono">${me.id}</dd><dt>${t('guest.name')}</dt><dd>${me.name}</dd><dt>${t('guest.country')}</dt><dd>${countryName(me.country)}</dd><dt>${t('guest.email')}</dt><dd>${me.email}</dd><dt>${t('profile.joined')}</dt><dd>${fmtDateLong(me.joinedAt)}</dd></dl>
      <label class="field" style="max-width:320px"><span>${t('profile.lang')}</span><select class="select" id="pf-lang" value=${S.lang} onChange=${e => { setLang(e.target.value); patch('members', me.id, { lang: e.target.value }); }}>${LANGS.filter(l => BUILTIN.includes(l[0]) || get('i18n', l[0])).map(l => html`<option value=${l[0]}>${l[1]}</option>`)}</select></label>
    </div></div>`}
    </div>
  </div>`;
}
const BK_BADGE = { confirmed: 'oak', staying: 'good', done: '', cancelled: 'bad' };
const TOUR_BADGE = { requested: 'warn', confirmed: 'good', done: '', cancelled: 'bad' };
const COUNTRIES = ['KR', 'JP', 'CN', 'TW', 'VN', 'US', 'GB', 'FR', 'DE', 'ES', 'IT', 'NL', 'TH', 'ID', 'PH', 'MN', 'UZ', 'IN', 'NP', 'RU', 'AU', 'CA', 'SG', 'MY', 'OTHER'];
function countryName(c) {
  if (c === 'OTHER') return t('country.other');
  try { return new Intl.DisplayNames([loc()], { type: 'region' }).of(c) || c; } catch { return c; }
}

function SiteFooter() {
  return html`<footer class="site-foot"><div class="wrap">
    <${Wordmark} onClick=${() => go('home')}/>
    <div class="cols">
      <div><h5>${t('foot.company')}</h5><p>주식회사 고수플러스 · GOSUPLUS Inc.<br/>${t('foot.ceo')} 박영은 · ${t('foot.reg')} 270-81-01999<br/>경기도 하남시 미사강변중앙로7번안길 25, D동 609호${!SHOW_BAR && html`<br/><a class="foot-link" href="#pms">점주 PMS</a> · <a class="foot-link" href="#admin">운영 Admin</a>`}</p></div>
      <div><h5>${t('foot.brands')}</h5><p>monthliv · ${t('foot.monthliv')}<br/>독립생활 · ${t('foot.indep')}<br/>방소녀 · ${t('foot.bang')}</p></div>
      <div><h5>${t('foot.lang')}</h5><p>${BUILTIN.map(c => html`<button class="btn quiet sm" style="color:#CFC6B8;padding:2px 6px" onClick=${() => setLang(c)}>${langName(c)}</button>`)}<button class="btn quiet sm" style="color:#D4A771;padding:2px 6px" onClick=${() => openModal('lang')}>${t('lang.more')}</button></p></div>
    </div>
  </div></footer>`;
}

/* ---------- user modals ---------- */
function LoginModal() {
  const [tab, setTab] = useState('login');
  const [id, setId] = useState('');
  const [err, setErr] = useState('');
  const [f, setF] = useState({ id: '', name: '', country: 'KR', email: '' });
  const after = () => { const a = S.u.after; S.u.after = null; closeModal(); if (a) go(a.name, a); };
  const login = uid => {
    const m = get('members', String(uid || '').trim().toLowerCase());
    if (!m) return setErr(t('login.err.none'));
    S.me = m.id; store.set('me', m.id);
    if (m.lang && m.lang !== S.lang && (BUILTIN.includes(m.lang) || get('i18n', m.lang)) && !store.get('lang')) S.lang = m.lang;
    toast(t('login.hello', { name: m.name })); after();
  };
  const signup = async () => {
    const nid = f.id.trim().toLowerCase();
    if (!/^[a-z0-9._-]{4,20}$/.test(nid)) return setErr(t('signup.err.id'));
    if (get('members', nid)) return setErr(t('signup.err.taken'));
    if (!f.name.trim()) return setErr(t('book.err.name'));
    await put('members', nid, { id: nid, name: f.name.trim(), country: f.country, lang: S.lang, joinedAt: nowIso(), phone: '', email: f.email.trim(), marketing: true });
    const welcome = get('coupons', 'cp-welcome');
    if (welcome && welcome.status === 'active' && today() <= welcome.to) {
      const wid = 'w-' + rid(10);
      await put('wallet', wid, { id: wid, couponId: welcome.id, userId: nid, via: 'signup', code: welcome.code, issuedAt: nowIso(), by: 'signup', status: 'active', usedAt: null, bookingId: null });
      toast(t('signup.coupon'));
    }
    S.me = nid; store.set('me', nid); after();
  };
  const demo = all('members').sort((a, b) => (a.joinedAt < b.joinedAt ? -1 : 1)).slice(0, 8);
  return html`<${Modal} title=${tab === 'login' ? t('nav.login') : t('signup.title')} onClose=${closeModal}>
    <div class="seg-tabs" role="tablist"><button role="tab" aria-selected=${tab === 'login'} onClick=${() => { setTab('login'); setErr(''); }}>${t('nav.login')}</button><button role="tab" aria-selected=${tab === 'signup'} onClick=${() => { setTab('signup'); setErr(''); }}>${t('signup.title')}</button></div>
    ${tab === 'login' ? html`<form class="stack" onSubmit=${e => { e.preventDefault(); login(id); }}>
        <label class="field"><span>${t('login.id')}</span><input class="input mono" id="lg-id" autocomplete="username" value=${id} onInput=${e => { setId(e.target.value); setErr(''); }}/></label>
        ${err && html`<span class="cp-msg err"><${Icon} n="warn" cls="sm"/>${err}</span>`}
        <button class="btn block" type="submit">${t('nav.login')}</button>
        <div class="field"><span>${t('login.demo')}</span><div class="demo-ids">${demo.map(m => html`<button type="button" class="chip" onClick=${() => login(m.id)}>${m.id}</button>`)}</div></div>
        <p class="note"><${Icon} n="info" cls="sm"/>${t('login.note')}</p></form>`
      : html`<form class="stack" onSubmit=${e => { e.preventDefault(); signup(); }}>
        <label class="field"><span>${t('login.id')} <span class="hint">${t('signup.idHint')}</span></span><input class="input mono" id="su-id" value=${f.id} onInput=${e => setF({ ...f, id: e.target.value })}/></label>
        <label class="field"><span>${t('guest.name')}</span><input class="input" id="su-name" value=${f.name} onInput=${e => setF({ ...f, name: e.target.value })}/></label>
        <div class="grid2"><label class="field"><span>${t('guest.country')}</span><select class="select" id="su-country" value=${f.country} onChange=${e => setF({ ...f, country: e.target.value })}>${COUNTRIES.map(c => html`<option value=${c}>${countryName(c)}</option>`)}</select></label>
          <label class="field"><span>${t('guest.email')}</span><input class="input" id="su-email" type="email" value=${f.email} onInput=${e => setF({ ...f, email: e.target.value })}/></label></div>
        ${err && html`<span class="cp-msg err"><${Icon} n="warn" cls="sm"/>${err}</span>`}
        <button class="btn block" type="submit">${t('signup.cta')}</button>
        <p class="note"><${Icon} n="ticket" cls="sm"/>${t('signup.couponHint')}</p></form>`}
  </${Modal}>`;
}

function LangModal() {
  const [query, setQuery] = useState('');
  const [custom, setCustom] = useState('');
  const [job, setJob] = useState(null); // {code, name, p, ctl, err}
  const [canAi, setCanAi] = useState(null);
  const [canCustom, setCanCustom] = useState(false);
  useEffect(() => { canTranslate().then(setCanAi); getSample().then(s => setCanCustom(!!s)); }, []);
  const nq = norm(query);
  const list = LANGS.filter(l => !nq || norm(l[1] + l[2] + l[0]).includes(nq));
  const builtin = list.filter(l => BUILTIN.includes(l[0]));
  const others = list.filter(l => !BUILTIN.includes(l[0]));
  const extra = all('i18n').filter(d => !LANGS.some(l => l[0] === d.lang));
  const pick = async (code, native, nameEn) => {
    if (BUILTIN.includes(code) || get('i18n', code)) { setLang(code); closeModal(); return; }
    if (!canAi) return;
    const ctl = new AbortController();
    setJob({ code, name: native, p: 0, ctl, err: '' });
    try {
      await aiTranslate(code, nameEn, native, p => setJob(j => (j && j.code === code ? { ...j, p } : j)), ctl.signal);
      setLang(code); closeModal(); toast(t('lang.done', { name: native }));
    } catch (e) {
      const m = aiErr(e);
      setJob(j => (j ? { ...j, err: m || '', p: 0, done: true } : j));
      if (!m) setJob(null);
    }
  };
  const addCustom = () => {
    const name = custom.trim(); if (!name) return;
    const slug = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || rid(5);
    pick('x-' + slug, name, name);
  };
  if (job && !job.done) return html`<${Modal} title=${t('lang.title')} onClose=${() => { job.ctl.abort(); setJob(null); }}>
    <div class="stack" style="padding-block:10px"><b>${t('lang.working', { name: job.name })}</b>
      <div class="progress"><i style=${`width:${Math.max(4, Math.round(job.p * 100))}%`}></i></div>
      <p class="note"><${Icon} n="spark" cls="sm"/>${job.p > 0 ? t('lang.progress', { p: Math.round(job.p * 100) }) : t('lang.thinking')}</p>
      <p class="muted" style="font-size:13px">${t('lang.once')}</p>
      <button class="btn line" onClick=${() => { job.ctl.abort(); setJob(null); }}>${t('common.stop')}</button></div></${Modal}>`;
  const cell = l => {
    const cached = get('i18n', l[0]);
    const ai = !BUILTIN.includes(l[0]);
    const disabled = ai && !cached && canAi === false;
    return html`<button aria-pressed=${S.lang === l[0]} disabled=${disabled} style=${disabled ? 'opacity:.45;cursor:not-allowed' : null} onClick=${() => pick(l[0], l[1], l[2])}>
      <b>${l[1]}</b><small class=${ai ? 'ai' : ''}>${ai ? html`<${Icon} n="spark" cls="sm"/>${cached ? t('lang.cached') : t('lang.ai')}` : l[2]}</small></button>`;
  };
  return html`<${Modal} title=${t('lang.title')} onClose=${closeModal} wide>
    <input class="input" id="lang-q" placeholder=${t('lang.search')} value=${query} onInput=${e => setQuery(e.target.value)}/>
    ${job && job.err && html`<span class="cp-msg err"><${Icon} n="warn" cls="sm"/>${job.err}</span>`}
    <div class="field"><span>${t('lang.builtin')}</span><div class="lang-grid">${builtin.map(cell)}</div></div>
    <div class="field"><span>${t('lang.others')}</span>
      <p class="muted" style="font-size:12.5px">${canAi === false ? t('lang.aiOff') : t('lang.aiOn')}</p>
      <div class="lang-grid">${others.map(cell)}${extra.map(d => cell([d.lang, d.name, d.nameEn || d.name]))}</div></div>
    ${canCustom && html`<div class="field"><span>${t('lang.custom')}</span><div class="cp-code"><input class="input" id="lang-custom" style="text-transform:none;font-family:var(--f-body);letter-spacing:0" placeholder=${t('lang.customPh')} value=${custom} onInput=${e => setCustom(e.target.value)} onKeyDown=${e => { if (e.key === 'Enter') addCustom(); }}/><button class="btn" onClick=${addCustom} disabled=${!custom.trim()}>${t('lang.translate')}</button></div></div>`}
  </${Modal}>`;
}

function TourModal({ branchId }) {
  const b = get('branches', branchId);
  const me = S.me && get('members', S.me);
  const minDate = addDays(today(), 1);
  const [f, setF] = useState({ date: minDate, time: '14:00', name: (me && me.name) || '', phone: '', note: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (!b) return null;
  const submit = async () => {
    if (!f.name.trim() || !f.phone.trim()) return setErr(t('tour.err'));
    setBusy(true);
    await requestTour({ branchId, userId: me ? me.id : null, ...f });
    setBusy(false); closeModal(); toast(t('tour.ok', { date: fmtDate(f.date), time: f.time }));
  };
  return html`<${Modal} title=${t('tour.title')} onClose=${closeModal} footer=${html`<button class="btn line" onClick=${closeModal}>${t('common.cancel')}</button><button class="btn" disabled=${busy} onClick=${submit}>${t('tour.submit')}</button>`}>
    <p class="sub">${bTitle(b)} · ${bArea(b)}</p>
    <div class="grid2"><label class="field"><span>${t('tour.date')}</span><input class="input" id="tr-date" type="date" min=${minDate} value=${f.date} onChange=${e => setF({ ...f, date: e.target.value || minDate })}/></label>
      <label class="field"><span>${t('tour.time')}</span><select class="select" id="tr-time" value=${f.time} onChange=${e => setF({ ...f, time: e.target.value })}>${['10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map(x => html`<option>${x}</option>`)}</select></label></div>
    <div class="grid2"><label class="field"><span>${t('guest.name')}</span><input class="input" id="tr-name" value=${f.name} onInput=${e => setF({ ...f, name: e.target.value })}/></label>
      <label class="field"><span>${t('guest.phone')}</span><input class="input" id="tr-phone" type="tel" value=${f.phone} onInput=${e => setF({ ...f, phone: e.target.value })}/></label></div>
    <label class="field"><span>${t('guest.note')}</span><textarea class="textarea" id="tr-note" value=${f.note} onInput=${e => setF({ ...f, note: e.target.value })}></textarea></label>
    ${err && html`<span class="cp-msg err"><${Icon} n="warn" cls="sm"/>${err}</span>`}
    <p class="note"><${Icon} n="info" cls="sm"/>${t('tour.note')}</p>
  </${Modal}>`;
}

function ExtendModal({ id }) {
  const bk = get('bookings', id);
  const [n, setN] = useState(1);
  const [err, setErr] = useState('');
  if (!bk) return null;
  const b = get('branches', bk.branchId), rt = b.types.find(x => x.id === bk.typeId);
  const end = addMonths(bk.checkOut, n);
  const go2 = async () => {
    try { await extendBooking(id, n); closeModal(); toast(t('my.extDone', { date: fmtDateLong(end) })); }
    catch (e) { setErr(t(e && e.key ? e.key : 'book.err.generic')); }
  };
  return html`<${Modal} title=${t('my.extend')} onClose=${closeModal} footer=${html`<button class="btn line" onClick=${closeModal}>${t('common.cancel')}</button><button class="btn" onClick=${go2}>${t('my.extPayBtn', { amount: fmtMoney(rt.price.month * n) })}</button>`}>
    <p class="sub">${bTitle(b)} · ${rtName(b, rt)}</p>
    <div class="field"><span>${t('my.extHow')}</span><div class="stepper" style="width:max-content"><button aria-label="-" onClick=${() => setN(Math.max(1, n - 1))}><${Icon} n="minus" cls="sm"/></button><span>${t('qty.month', { n })}</span><button aria-label="+" onClick=${() => setN(Math.min(12, n + 1))}><${Icon} n="plus" cls="sm"/></button></div></div>
    <dl class="kv"><dt>${t('my.extNow')}</dt><dd>${fmtDateLong(bk.checkOut)}</dd><dt>${t('my.extNew')}</dt><dd><b>${fmtDateLong(end)}</b></dd></dl>
    ${err && html`<span class="cp-msg err"><${Icon} n="warn" cls="sm"/>${err}</span>`}
  </${Modal}>`;
}

function UserApp() {
  const r = S.u.route;
  const page = r.name === 'search' ? html`<${SearchPage}/>`
    : r.name === 'branch' ? html`<${BranchPage} id=${r.id} key=${r.id}/>`
    : r.name === 'book' ? html`<${CheckoutPage} ...${r} key=${r.bid + r.tid + r.ci}/>`
    : r.name === 'done' ? html`<${DonePage} id=${r.id}/>`
    : r.name === 'my' ? html`<${MyPage} tab=${r.tab}/>`
    : html`<${Home}/>`;
  const M = S.modal;
  return html`<div class="site" dir=${isRtl(S.lang) ? 'rtl' : 'ltr'} lang=${S.lang}>
    <${SiteHeader}/><main>${page}</main><${SiteFooter}/>
    ${M && M.kind === 'login' && html`<${LoginModal}/>`}
    ${M && M.kind === 'lang' && html`<${LangModal}/>`}
    ${M && M.kind === 'tour' && html`<${TourModal} ...${M.props}/>`}
    ${M && M.kind === 'extend' && html`<${ExtendModal} ...${M.props}/>`}
  </div>`;
}
