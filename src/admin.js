/* ================= HQ ADMIN ================= */
function AdminApp() {
  const tab = S.a.tab;
  const setTab = k => { S.a.tab = k; S.a.edit = null; S.a.coupon = null; S.a.drawer = null; emit(); try { window.scrollTo({ top: 0 }); } catch {} };
  const nav = [['dash', '운영 현황', 'chart'], ['branches', '지점', 'building'], ['bookings', '예약', 'ticket'], ['members', '회원', 'users'], ['coupons', '쿠폰', 'send'], ['owners', '점주 계정', 'key'], ['settings', '설정', 'sliders']];
  const page = { dash: AdminDash, branches: AdminBranches, bookings: AdminBookings, members: AdminMembers, coupons: AdminCoupons, owners: AdminOwners, settings: AdminSettings }[tab] || AdminDash;
  return html`<div class="console">
    <aside class="side">
      <div class="brand"><${Wordmark} onClick=${() => setTab('dash')}/><span class="role">HQ Admin</span></div>
      <nav aria-label="Admin 메뉴">${nav.map(([k, l, ic]) => html`<button aria-current=${tab === k ? 'page' : null} onClick=${() => setTab(k)}><${Icon} n=${ic}/>${l}</button>`)}</nav>
      <div class="foot"><span>주식회사 고수플러스<br/>본사 운영팀</span></div>
    </aside>
    <main class="main"><${page} key=${tab}/></main>
    ${S.a.drawer && S.a.drawer.kind === 'booking' && html`<${BookingDrawer} admin id=${S.a.drawer.id} onClose=${() => { S.a.drawer = null; emit(); }}/>`}
    ${S.a.drawer && S.a.drawer.kind === 'send' && html`<${SendDrawer} ...${S.a.drawer}/>`}
  </div>`;
}

function AdminDash() {
  const bs = all('branches');
  const open = bs.filter(b => b.status === 'open'), soon = bs.filter(b => b.status === 'soon'), prep = bs.filter(b => b.status === 'prep');
  const occ = open.map(b => ({ b, s: occStats(b) }));
  const tot = occ.reduce((a, x) => a + x.s.total, 0), used = occ.reduce((a, x) => a + x.s.occ, 0);
  const ym = today().slice(0, 7);
  const bks = all('bookings');
  const monthBks = bks.filter(x => x.status !== 'cancelled' && (x.pay.paidAt || '').slice(0, 7) === ym);
  const prevYm = ymList(2)[1];
  const prevBks = bks.filter(x => x.status !== 'cancelled' && (x.pay.paidAt || '').slice(0, 7) === prevYm);
  const sumPay = list => list.reduce((a, x) => a + x.price.total - (x.price.deposit || 0), 0);
  const wal = all('wallet').filter(w => w.status !== 'void');
  const recent = bks.slice().sort((a, c) => (a.createdAt < c.createdAt ? 1 : -1)).slice(0, 8);
  const [sel, setSel] = useState(null);
  return html`<${Fragment}>
    <div class="page-head"><div><h1>운영 현황</h1><p>${kdw(today())} 기준 · ${S.mode === 'cloud' ? '공유 데이터 실시간' : S.mode === 'sandbox' ? '쓰기 권한 없는 사본' : '이 브라우저의 데모 데이터'}</p></div>
      <button class="btn" onClick=${() => { S.a.tab = 'branches'; S.a.edit = 'new'; emit(); }}><${Icon} n="plus" cls="sm"/>지점 추가</button></div>
    ${S.cloudEmpty && S.mode === 'cloud' && html`<${SeedCallout}/>`}
    <div class="kpis">
      <${Kpi} k="운영 지점" icon="building" v=${open.length} small="곳" d=${`오픈 예정 ${soon.length} · 준비 중 ${prep.length}`}/>
      <${Kpi} k="운영 객실 점유율" icon="bed" v=${pct(used, tot)} small="%" meter=${tot ? used / tot : 0} d=${`${used} / ${tot}실 입실 중`}/>
      <${Kpi} k=${`${+ym.slice(5)}월 결제`} icon="wallet" v=${won(sumPay(monthBks))} d=${`${monthBks.length}건 · 지난달 ${won(sumPay(prevBks))}`}/>
      <${Kpi} k="쿠폰 사용" icon="ticket" v=${wal.filter(w => w.status === 'used').length} small=${`/ ${wal.length}장`} d=${`사용률 ${pct(wal.filter(w => w.status === 'used').length, wal.length)}%`}/>
      <${Kpi} k="회원" icon="users" v=${all('members').length} small="명" d=${`외국인 ${all('members').filter(m => m.country !== 'KR').length}명`}/>
    </div>
    <div class="cols2 even">
      <section class="panel"><header><div><h2>지점별 점유율</h2><p>운영 중인 지점 · 지금 입실 중인 객실 비율</p></div></header>
        <${HBars} rows=${occ.sort((a, c) => c.s.rate - a.s.rate).map(x => ({ id: x.b.id, label: bTitleKo(x.b), value: x.s.rate, sub: `${x.s.occ}/${x.s.total}실 · 공실 ${x.s.vac}` }))} onPick=${r => { S.a.tab = 'branches'; S.a.edit = r.id; emit(); }}/></section>
      <section class="panel" style="overflow:hidden"><header><div><h2>지점 지도</h2><p>운영 ${open.length} · 오픈 예정 ${soon.length} · 준비 중 ${prep.length}</p></div></header>
        <div style="position:relative;height:420px"><${MapView} fitKey="city" items=${bs.map(b => ({ id: b.id, lat: b.lat, lng: b.lng, status: b.status, label: b.name.ko, aria: bTitleKo(b) }))} selected=${sel} onSelect=${setSel}
          renderPop=${it => { const b = get('branches', it.id); const s = occStats(b); return html`<h4>${bTitleKo(b)}</h4><span class="muted" style="font-size:13px">${STATUS_KO[b.status]} · ${s.total}실${b.status === 'open' ? ` · 점유율 ${pct(s.occ, s.total)}%` : ''}</span><button class="btn sm" onClick=${() => { S.a.tab = 'branches'; S.a.edit = b.id; emit(); }}>지점 수정</button>`; }}/></div></section>
    </div>
    <section class="panel"><header><h2>최근 예약</h2><button class="btn quiet sm" onClick=${() => { S.a.tab = 'bookings'; emit(); }}>전체 보기</button></header><${BookingTable} rows=${recent} showBranch/></section>
  </${Fragment}>`;
}

function SeedCallout() {
  const [prog, setProg] = useState(null);
  return html`<div class="callout"><b>공유 데이터가 비어 있습니다</b><span>데모 지점·예약·쿠폰을 불러오면 모든 화면을 바로 체험할 수 있습니다.</span>
    ${prog ? html`<div class="progress"><i style=${`width:${Math.round((prog[0] / prog[1]) * 100)}%`}></i></div>` : html`<div><button class="btn sm" onClick=${async () => { setProg([0, 1]); await seedDemo((i, n) => setProg([i, n])); setProg(null); toast('데모 데이터를 불러왔습니다'); }}>데모 데이터 불러오기</button></div>`}</div>`;
}

function AdminBranches() {
  const [flt, setFlt] = useState('');
  const [qq, setQq] = useState('');
  if (S.a.edit) return html`<${BranchEditor} id=${S.a.edit} key=${S.a.edit}/>`;
  const order = { open: 0, soon: 1, prep: 2, closed: 3 };
  const rows = all('branches').filter(b => (!flt || b.status === flt) && (!qq || (b.name.ko + b.area.ko + b.station.ko + b.id).includes(qq)))
    .sort((a, c) => order[a.status] - order[c.status] || (a.openDate < c.openDate ? -1 : 1));
  return html`<${Fragment}>
    <div class="page-head"><div><h1>지점</h1><p>지점을 추가하거나 수정하면 이용자 사이트와 점주 PMS에 바로 반영됩니다</p></div>
      <button class="btn" onClick=${() => { S.a.edit = 'new'; emit(); }}><${Icon} n="plus" cls="sm"/>지점 추가</button></div>
    <div class="toolbar"><input class="input" id="br-q" placeholder="지점명·동·역 검색" value=${qq} onInput=${e => setQq(e.target.value)}/>
      ${['', 'open', 'soon', 'prep', 'closed'].map(s => html`<button class="chip" aria-pressed=${flt === s} onClick=${() => setFlt(s)}>${s ? STATUS_KO[s] : '전체'} ${all('branches').filter(b => !s || b.status === s).length}</button>`)}</div>
    <section class="panel"><${Table} rows=${rows} onRow=${b => { S.a.edit = b.id; emit(); }} cols=${[
      { h: '지점', v: b => html`<span class="two"><span class="nm">${bTitleKo(b)}${b.no ? html` <span class="muted mono" style="font-size:11.5px">${b.no}호점</span>` : ''}</span><small>${b.area.ko} · ${b.station.ko} ${b.walk}분</small></span>` },
      { h: '상태', v: b => html`<span class=${cx('badge', STATUS_BADGE[b.status])}>${STATUS_KO[b.status]}</span>` },
      { h: '오픈', v: b => html`<span class="num">${b.openDate ? kdy(b.openDate) : '—'}</span>` },
      { h: '객실', r: true, v: b => b.types.reduce((a, r) => a + r.count, 0) },
      { h: '점유율', r: true, v: b => { if (b.status !== 'open') return '—'; const s = occStats(b); return pct(s.occ, s.total) + '%'; } },
      { h: '최저가', r: true, v: b => { const u = bestUnit(b); const p = minPrice(b, u); return p != null ? `${UNIT_KO_L[u]} ${won(p)}` : '—'; } },
      { h: '수수료', r: true, v: b => Math.round(b.feeRate * 100) + '%' },
      { h: '점주', v: b => { const o = b.ownerId && get('owners', b.ownerId); return o ? o.name : html`<span class="muted">미배정</span>`; } },
    ]}/></section>
  </${Fragment}>`;
}

const BLANK_TYPE = id => ({ id, name: { ko: '', en: '' }, size: 8, bath: 'private', window: 'outer', cap: 1, bed: 'single', count: 10, price: { night: null, week: null, month: null } });
function nextRoomNo(list) {
  if (!list.length) return '201';
  const nums = list.map(r => r.no).filter(n => /^\d+$/.test(n)).map(Number).sort((a, b) => a - b);
  const last = nums[nums.length - 1] || 200;
  return String(last % 100 >= 30 ? (Math.floor(last / 100) + 1) * 100 + 1 : last + 1);
}
function syncRooms(b) {
  const cur = get('rooms', b.id);
  const list = cur ? cur.list.map(r => ({ ...r })) : [];
  const want = Object.fromEntries(b.types.map(r => [r.id, Math.max(0, +r.count || 0)]));
  const have = {}, keep = [], spare = [];
  for (const r of list) { if ((have[r.t] || 0) < (want[r.t] || 0)) { keep.push(r); have[r.t] = (have[r.t] || 0) + 1; } else spare.push(r); }
  for (const [tid, n] of Object.entries(want)) {
    while ((have[tid] || 0) < n) {
      let r = spare.shift();
      if (r) r = { ...r, t: tid }; else r = { no: nextRoomNo([...keep, ...spare]), t: tid, flag: null, occ: null };
      keep.push(r); have[tid] = (have[tid] || 0) + 1;
    }
  }
  keep.sort((a, c) => (+a.no || 0) - (+c.no || 0));
  return { branchId: b.id, list: keep };
}

function BranchEditor({ id }) {
  const isNew = id === 'new';
  const src = isNew ? null : get('branches', id);
  const [f, setF] = useState(() => (src ? plain(src) : {
    id: '', no: null, type: 'stay', status: 'prep', openDate: addMonths(today(), 2), name: { ko: '', en: '' }, area: { ko: '', en: '' }, gu: '강남구', station: { ko: '', en: '' }, lines: ['2'], walk: 5,
    lat: 37.5665, lng: 126.978, feeRate: 0.15, deposit: 100000, checkin: null, checkout: null, art: Math.floor(Math.random() * 18), ownerId: null,
    types: [{ ...BLANK_TYPE('A'), name: { ko: '스탠다드 룸', en: 'Standard Room' }, price: { night: null, week: 180000, month: 560000 } }],
    amenities: ['private_bath', 'aircon', 'wifi', 'desk', 'washer', 'smartlock'], highlights: ['near_station'], desc: { ko: '', en: '' },
  }));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);
  const [ai, setAi] = useState(null);
  const [addr, setAddr] = useState('');
  const [geo, setGeo] = useState(null);       // null | 'working' | error text
  const [geoKey, setGeoKey] = useState(0);    // bumps the map focus after an address lookup
  if (!isNew && !src) return html`<div class="empty"><strong>지점을 찾을 수 없습니다</strong></div>`;
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const setL = (k, lang, v) => setF(x => ({ ...x, [k]: { ...x[k], [lang]: v } }));
  const setT = (i, k, v) => setF(x => ({ ...x, types: x.types.map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));
  const save = async () => {
    setErr('');
    const nid = isNew ? f.id.trim().toLowerCase() : f.id;
    if (isNew && !/^[a-z0-9-]{3,30}$/.test(nid)) return setErr('지점 코드는 영문 소문자·숫자·하이픈 3~30자로 입력하세요 (예: gangnam-stay)');
    if (isNew && get('branches', nid)) return setErr('이미 있는 지점 코드입니다');
    if (!f.name.ko.trim()) return setErr('지점명을 입력하세요');
    if (!f.types.length) return setErr('객실 타입을 하나 이상 추가하세요');
    if (f.types.some(r => !r.name.ko.trim())) return setErr('객실 타입 이름을 입력하세요');
    if (f.types.some(r => r.price.night == null && r.price.week == null && r.price.month == null)) return setErr('객실 타입마다 요금을 하나 이상 입력하세요');
    if (!(f.lat > 33 && f.lat < 39 && f.lng > 124 && f.lng < 132)) return setErr('좌표가 올바르지 않습니다. 지도를 눌러 위치를 지정하세요');
    setBusy(true);
    const doc = { ...f, id: nid, name: { ...f.name, en: f.name.en || f.name.ko }, rooms: f.types.reduce((a, r) => a + (+r.count || 0), 0), updatedAt: nowIso(),
      types: f.types.map(r => ({ ...r, size: +r.size || 0, cap: +r.cap || 1, count: +r.count || 0 })) };
    await put('branches', nid, doc);
    await put('rooms', nid, syncRooms(doc));
    if (doc.ownerId) { const o = get('owners', doc.ownerId); if (o && !o.branchIds.includes(nid)) await patch('owners', o.id, { branchIds: [...o.branchIds, nid] }); }
    setBusy(false); toast(isNew ? '지점을 추가했습니다' : '저장했습니다');
    S.a.edit = null; emit();
  };
  const del = async () => {
    if (all('bookings').some(x => x.branchId === f.id && (x.status === 'confirmed' || x.status === 'staying'))) return toast('진행 중인 예약이 있어 삭제할 수 없습니다. 상태를 운영 종료로 바꾸세요', 'error');
    if (!(await askConfirm({ title: '지점을 삭제할까요?', body: `${bTitleKo(f)} 지점과 객실 정보를 삭제합니다. 지난 예약 기록은 남습니다.`, ok: '삭제', danger: true }))) return;
    await removeDoc('branches', f.id); await removeDoc('rooms', f.id);
    for (const o of all('owners').filter(o => o.branchIds.includes(f.id))) await patch('owners', o.id, { branchIds: o.branchIds.filter(x => x !== f.id) });
    toast('지점을 삭제했습니다'); S.a.edit = null; emit();
  };
  const findAddr = async () => {
    if (!addr.trim() || geo === 'working') return;
    setGeo('working');
    try {
      const r = await geocodeKR(addr.trim());
      const guOk = r.gu && GEO.gu.some(g => g.ko === r.gu);
      setF(x => ({ ...x, lat: r.lat, lng: r.lng, gu: guOk ? r.gu : x.gu, area: !x.area.ko && guOk && r.dong ? { ...x.area, ko: `${r.gu} ${r.dong}` } : x.area }));
      setGeoKey(k => k + 1); setGeo(null);
      toast(`좌표를 찾았습니다 · ${r.formatted}`);
    } catch (e) {
      const c = e && e.message;
      setGeo(c === 'ZERO_RESULTS' ? '주소를 찾지 못했습니다. 도로명 주소나 건물명으로 다시 입력해 보세요.'
        : c === 'REQUEST_DENIED' ? 'Google Cloud에서 이 키에 Geocoding API를 허용해야 주소로 찾을 수 있습니다. 지도를 눌러 지정할 수는 있습니다.'
        : c === 'OVER_QUERY_LIMIT' ? '요청이 많습니다. 잠시 후 다시 시도하세요.'
        : GM.state === 'failed' ? 'Google 지도를 불러오지 못해 주소 검색을 쓸 수 없습니다. 지도를 눌러 지정하세요.' : '좌표를 찾지 못했습니다. 잠시 후 다시 시도하세요.');
    }
  };
  const fillAi = async () => {
    setAi('working');
    try {
      const out = await aiFillBranch(f);
      setF(x => {
        const n = plain(x);
        for (const L of ['ja', 'zh-CN', 'zh-TW', 'vi']) {
          const o = out && out[L]; if (!o) continue;
          for (const k of ['name', 'area', 'station', 'desc']) if (o[k]) n[k][L] = o[k];
          n.types.forEach(r => { if (o['type_' + r.id]) r.name[L] = o['type_' + r.id]; });
        }
        return n;
      });
      setAi(null); setMore(true); toast('일본어·중국어·베트남어 번역을 채웠습니다. 저장해야 반영됩니다');
    } catch (e) { setAi(aiErr(e) || null); }
  };
  const owners = all('owners');
  const preview = { ...f, types: f.types.length ? f.types : [BLANK_TYPE('A')] };
  return html`<${Fragment}>
    <div class="page-head"><div><button class="btn quiet sm" onClick=${() => { S.a.edit = null; emit(); }}><${Icon} n="arrowL" cls="sm"/>지점 목록</button>
      <h1 style="margin-top:6px">${isNew ? '새 지점' : bTitleKo(src)}</h1><p>${isNew ? '저장하면 객실이 자동으로 만들어지고 이용자 사이트에 상태에 맞게 노출됩니다 (준비 중은 비공개)' : `코드 ${f.id} · 마지막 수정 ${kdt(f.updatedAt)}`}</p></div>
      <div class="row">${!isNew && (f.status === 'open' || f.status === 'soon') && html`<button class="btn line sm" onClick=${() => { S.role = 'user'; S.u.route = { name: 'branch', id: f.id }; emit(); }}><${Icon} n="external" cls="sm"/>이용자 화면</button>`}
        ${!isNew && html`<button class="btn quiet sm" onClick=${del}><${Icon} n="trash" cls="sm"/>삭제</button>`}
        <button class="btn" disabled=${busy} onClick=${save}>${busy ? html`<span class="spinner"></span>` : ''}저장</button></div></div>
    ${err && html`<span class="cp-msg err"><${Icon} n="warn" cls="sm"/>${err}</span>`}
    <div class="editor-grid">
      <section class="panel"><div class="pad stack" style="gap:18px">
        <div class="ed-sec"><h3>기본 정보</h3>
          <div class="grid3">
            ${isNew ? html`<label class="field"><span>지점 코드</span><input class="input mono" id="ed-id" placeholder="gangnam-stay" value=${f.id} onInput=${e => set('id', e.target.value)}/></label>` : html`<label class="field"><span>지점 코드</span><input class="input mono" disabled value=${f.id}/></label>`}
            <label class="field"><span>지점명 (한국어)</span><input class="input" id="ed-name" placeholder="예: 성수" value=${f.name.ko} onInput=${e => setL('name', 'ko', e.target.value)}/></label>
            <label class="field"><span>지점명 (영문)</span><input class="input" id="ed-name-en" placeholder="Seongsu" value=${f.name.en} onInput=${e => setL('name', 'en', e.target.value)}/></label>
          </div>
          <div class="grid3">
            <label class="field"><span>유형</span><select class="select" id="ed-type" value=${f.type} onChange=${e => set('type', e.target.value)}>${TYPES.map(x => html`<option value=${x}>${TYPE_KO[x]}</option>`)}</select></label>
            <label class="field"><span>상태</span><select class="select" id="ed-status" value=${f.status} onChange=${e => set('status', e.target.value)}>${['open', 'soon', 'prep', 'closed'].map(x => html`<option value=${x}>${STATUS_KO[x]}${x === 'prep' ? ' (비공개)' : ''}</option>`)}</select></label>
            <label class="field"><span>${f.status === 'open' ? '운영 시작일' : '오픈 예정일'}</span><input class="input" id="ed-open" type="date" value=${f.openDate} onChange=${e => set('openDate', e.target.value)}/></label>
          </div>
          <div class="grid3"><label class="field"><span>호점 번호</span><input class="input num" id="ed-no" type="number" placeholder="예: 31" value=${f.no ?? ''} onInput=${e => set('no', e.target.value ? +e.target.value : null)}/></label>
            <label class="field"><span>점주 계정</span><select class="select" id="ed-owner" value=${f.ownerId || ''} onChange=${e => set('ownerId', e.target.value || null)}><option value="">미배정</option>${owners.map(o => html`<option value=${o.id}>${o.name}</option>`)}</select></label>
            <label class="field"><span>운영 수수료 (%)</span><input class="input num" id="ed-fee" type="number" min="0" max="50" value=${Math.round(f.feeRate * 100)} onInput=${e => set('feeRate', (+e.target.value || 0) / 100)}/></label></div>
        </div>
        <div class="ed-sec"><h3>위치</h3>
          <div class="grid3"><label class="field"><span>구</span><select class="select" id="ed-gu" value=${f.gu} onChange=${e => set('gu', e.target.value)}>${GEO.gu.map(g => g.ko).sort().map(g => html`<option>${g}</option>`)}</select></label>
            <label class="field"><span>동 주소 (한국어)</span><input class="input" id="ed-area" placeholder="성동구 성수동" value=${f.area.ko} onInput=${e => setL('area', 'ko', e.target.value)}/></label>
            <label class="field"><span>동 주소 (영문)</span><input class="input" id="ed-area-en" placeholder="Seongsu-dong, Seongdong-gu" value=${f.area.en} onInput=${e => setL('area', 'en', e.target.value)}/></label></div>
          <div class="grid3"><label class="field"><span>가까운 역</span><input class="input" id="ed-st" placeholder="성수역" value=${f.station.ko} onInput=${e => setL('station', 'ko', e.target.value)}/></label>
            <label class="field"><span>역 (영문)</span><input class="input" id="ed-st-en" placeholder="Seongsu Stn." value=${f.station.en} onInput=${e => setL('station', 'en', e.target.value)}/></label>
            <label class="field"><span>도보 (분)</span><input class="input num" id="ed-walk" type="number" min="1" max="30" value=${f.walk} onInput=${e => set('walk', +e.target.value || 1)}/></label></div>
          <div class="field"><span>노선</span><div class="row tight">${LINE_LIST.map(l => html`<button type="button" class="chip" aria-pressed=${f.lines.includes(l)} onClick=${() => set('lines', f.lines.includes(l) ? f.lines.filter(x => x !== l) : [...f.lines, l])}><span class="ln" style=${`background:${LINE_COLORS[l]}`}>${/^\d$/.test(l) ? l : LINE_KO[l][0]}</span>${/^\d$/.test(l) ? l + '호선' : LINE_KO[l]}</button>`)}</div></div>
          <div class="grid2"><label class="field"><span>위도</span><input class="input mono" id="ed-lat" type="number" step="0.0001" value=${f.lat} onInput=${e => set('lat', +e.target.value)}/></label>
            <label class="field"><span>경도</span><input class="input mono" id="ed-lng" type="number" step="0.0001" value=${f.lng} onInput=${e => set('lng', +e.target.value)}/></label></div>
          ${gmWanted() && GM.state !== 'failed' && html`<div class="row" style="align-items:end">
            <label class="field" style="flex:1;min-width:220px"><span>주소로 좌표 찾기</span><input class="input" id="ed-addr" placeholder="예: 서울 성동구 아차산로 100" value=${addr} onInput=${e => setAddr(e.target.value)} onKeyDown=${e => { if (e.key === 'Enter') { e.preventDefault(); findAddr(); } }}/></label>
            <button class="btn line" disabled=${!addr.trim() || geo === 'working'} onClick=${findAddr}>${geo === 'working' ? html`<span class="spinner"></span>` : html`<${Icon} n="search" cls="sm"/>`}좌표 찾기</button></div>`}
          ${geo && geo !== 'working' && html`<span class="cp-msg err"><${Icon} n="warn" cls="sm"/>${geo}</span>`}
          <p class="note"><${Icon} n="pin" cls="sm"/>${gmWanted() && GM.state !== 'failed' ? '주소로 찾거나 오른쪽 지도를 눌러 위치를 정합니다. 지도에서 한 번 더 눌러 미세 조정할 수 있습니다.' : '오른쪽 지도를 누르면 좌표가 들어갑니다. config.js에 Google 지도 키를 넣으면 주소로 좌표를 찾을 수 있습니다.'}</p>
        </div>
        <div class="ed-sec"><h3>운영 조건</h3>
          <div class="grid3"><label class="field"><span>보증금 (월 단위 예약, 원)</span><input class="input num" id="ed-dep" type="number" min="0" step="10000" value=${f.deposit} onInput=${e => set('deposit', +e.target.value || 0)}/></label>
            <label class="field"><span>입실 시간 <span class="hint">비우면 ‘입실일 협의’</span></span><input class="input" id="ed-in" placeholder="15:00" value=${f.checkin || ''} onInput=${e => set('checkin', e.target.value || null)}/></label>
            <label class="field"><span>퇴실 시간</span><input class="input" id="ed-out" placeholder="11:00" value=${f.checkout || ''} onInput=${e => set('checkout', e.target.value || null)}/></label></div>
        </div>
        <div class="ed-sec"><div class="row between"><h3>객실 타입·요금</h3><button class="btn line sm" onClick=${() => set('types', [...f.types, BLANK_TYPE(String.fromCharCode(65 + f.types.length))])}><${Icon} n="plus" cls="sm"/>타입 추가</button></div>
          ${f.types.map((r, i) => html`<div class="rt-edit">
            <div class="head"><b class="mono">${r.id}</b><button class="btn quiet sm" disabled=${f.types.length < 2} onClick=${() => set('types', f.types.filter((_, j) => j !== i))}><${Icon} n="trash" cls="sm"/>삭제</button></div>
            <div class="grid3"><label class="field"><span>이름 (한국어)</span><input class="input" id=${`ed-t${i}-ko`} value=${r.name.ko} onInput=${e => setT(i, 'name', { ...r.name, ko: e.target.value })}/></label>
              <label class="field"><span>이름 (영문)</span><input class="input" id=${`ed-t${i}-en`} value=${r.name.en} onInput=${e => setT(i, 'name', { ...r.name, en: e.target.value })}/></label>
              <label class="field"><span>객실 수</span><input class="input num" id=${`ed-t${i}-cnt`} type="number" min="0" value=${r.count} onInput=${e => setT(i, 'count', +e.target.value || 0)}/></label></div>
            <div class="grid3"><label class="field"><span>면적 (㎡)</span><input class="input num" id=${`ed-t${i}-size`} type="number" step="0.1" value=${r.size} onInput=${e => setT(i, 'size', +e.target.value)}/></label>
              <label class="field"><span>창</span><select class="select" id=${`ed-t${i}-win`} value=${r.window} onChange=${e => setT(i, 'window', e.target.value)}>${Object.keys(WIN_KO).map(k => html`<option value=${k}>${WIN_KO[k]}</option>`)}</select></label>
              <label class="field"><span>침대·정원</span><div class="row tight" style="flex-wrap:nowrap"><select class="select" id=${`ed-t${i}-bed`} value=${r.bed} onChange=${e => setT(i, 'bed', e.target.value)}>${Object.keys(BED_KO).map(k => html`<option value=${k}>${BED_KO[k]}</option>`)}</select>
                <select class="select" id=${`ed-t${i}-cap`} style="width:90px" value=${r.cap} onChange=${e => setT(i, 'cap', +e.target.value)}>${[1, 2, 3, 4].map(n => html`<option value=${n}>${n}명</option>`)}</select></div></label></div>
            <div class="grid3">${['night', 'week', 'month'].map(u => html`<label class="field"><span>${UNIT_KO_L[u]} 요금 <span class="hint">비우면 판매 안 함</span></span><input class="input num" id=${`ed-t${i}-${u}`} type="number" min="0" step="1000" value=${r.price[u] ?? ''} onInput=${e => setT(i, 'price', { ...r.price, [u]: e.target.value === '' ? null : +e.target.value })}/></label>`)}</div>
          </div>`)}
        </div>
        <div class="ed-sec"><h3>편의시설</h3><div class="amen-pick">${AMENITIES.map(a => html`<label class="check"><input type="checkbox" checked=${f.amenities.includes(a)} onChange=${e => set('amenities', e.target.checked ? [...f.amenities, a] : f.amenities.filter(x => x !== a))}/>${AM_KO[a]}</label>`)}</div>
          <h3 style="margin-top:6px">특징 태그</h3><div class="row tight">${HIGHLIGHTS.map(k => html`<button type="button" class="chip" aria-pressed=${f.highlights.includes(k)} onClick=${() => set('highlights', f.highlights.includes(k) ? f.highlights.filter(x => x !== k) : [...f.highlights, k])}>${HL_KO[k]}</button>`)}</div></div>
        <div class="ed-sec"><h3>소개 문구</h3>
          <label class="field"><span>한국어</span><textarea class="textarea" id="ed-desc" value=${f.desc.ko} onInput=${e => setL('desc', 'ko', e.target.value)}></textarea></label>
          <label class="field"><span>English</span><textarea class="textarea" id="ed-desc-en" value=${f.desc.en} onInput=${e => setL('desc', 'en', e.target.value)}></textarea></label>
          <div class="row"><button class="btn line sm" onClick=${() => setMore(!more)}>${more ? '다른 언어 접기' : '일본어·중국어·베트남어 직접 입력'}</button>
            <button class="btn line sm" disabled=${ai === 'working'} onClick=${fillAi}>${ai === 'working' ? html`<span class="spinner"></span>번역 중` : html`<${Icon} n="spark" cls="sm"/>영문을 바탕으로 AI 번역 채우기`}</button></div>
          ${ai && ai !== 'working' && html`<span class="cp-msg err"><${Icon} n="warn" cls="sm"/>${ai}</span>`}
          ${more && ['ja', 'zh-CN', 'zh-TW', 'vi'].map(L => html`<div class="rt-edit"><b>${langName(L)}</b><div class="grid3">
            ${['name', 'area', 'station'].map(k => html`<label class="field"><span>${{ name: '지점명', area: '동 주소', station: '역' }[k]}</span><input class="input" id=${`ed-${k}-${L}`} value=${f[k][L] || ''} onInput=${e => setL(k, L, e.target.value)}/></label>`)}</div>
            <label class="field"><span>소개</span><textarea class="textarea" id=${`ed-desc-${L}`} value=${f.desc[L] || ''} onInput=${e => setL('desc', L, e.target.value)}></textarea></label></div>`)}
          <p class="note"><${Icon} n="globe" cls="sm"/>비워 둔 언어는 영문으로 보이고, 그 밖의 언어는 이용자가 언어를 고를 때 AI 번역이 함께 만들어집니다.</p>
        </div>
      </div></section>
      <div class="stack" style="position:sticky;top:calc(var(--protobar) + 16px)">
        <div class="pick-map"><${MapView} focus=${{ lat: f.lat, lng: f.lng, zoom: isNew && !geoKey ? 1.4 : 6, key: geoKey }} pick=${{ lat: f.lat, lng: f.lng }} onPick=${(lat, lng) => setF(x => ({ ...x, lat, lng }))} items=${all('branches').filter(b => b.id !== f.id).map(b => ({ id: b.id, lat: b.lat, lng: b.lng, status: b.status, label: b.name.ko }))}/></div>
        <div class="panel"><div class="pad stack" style="gap:10px"><span class="label">미리보기</span>
          <div class="bcard" style="pointer-events:none"><div class="ph">${artFor(preview, preview.types[0])}<div class="badges"><span class="badge">${TYPE_KO[f.type]}</span></div></div>
            <h3>${f.name.ko || '지점명'} ${TYPE_KO[f.type]} <small>${f.area.ko}</small></h3>
            <div class="meta"><span class="lines">${f.lines.map(l => html`<span class="ln" style=${`background:${LINE_COLORS[l]}`}>${/^\d$/.test(l) ? l : LINE_KO[l]}</span>`)}</span><span>${f.station.ko || '역'} · 도보 ${f.walk}분</span></div>
            <div class="price">${(() => { const u = bestUnit(f); const p = minPrice(preview, u); return p != null ? html`<span><b>${won(p)}</b> <span class="muted">/ ${UNIT_KO_L[u]}~</span></span>` : ''; })()}</div></div></div></div>
      </div>
    </div>
  </${Fragment}>`;
}

function AdminBookings() {
  const [br, setBr] = useState('');
  const [st, setSt] = useState('');
  const [qq, setQq] = useState('');
  const rows = all('bookings').filter(x => (!br || x.branchId === br) && (!st || x.status === st) && (!qq || (x.code + x.userId + x.guest.name).toLowerCase().includes(qq.toLowerCase())))
    .sort((a, c) => (a.createdAt < c.createdAt ? 1 : -1));
  const sum = rows.filter(x => x.status !== 'cancelled').reduce((a, x) => a + x.price.total - (x.price.deposit || 0), 0);
  return html`<${Fragment}>
    <div class="page-head"><div><h1>예약</h1><p>${rows.length}건 · 결제 합계 ${won(sum)} (보증금 제외, 취소 제외)</p></div></div>
    <div class="toolbar"><input class="input" id="ab-q" placeholder="예약번호·아이디·이름" value=${qq} onInput=${e => setQq(e.target.value)}/>
      <select class="select" id="ab-br" value=${br} onChange=${e => setBr(e.target.value)}><option value="">모든 지점</option>${all('branches').filter(b => b.status !== 'prep').map(b => html`<option value=${b.id}>${bTitleKo(b)}</option>`)}</select>
      <select class="select" id="ab-st" value=${st} onChange=${e => setSt(e.target.value)}><option value="">모든 상태</option>${Object.keys(BK_KO).map(k => html`<option value=${k}>${BK_KO[k]}</option>`)}</select></div>
    <section class="panel"><${BookingTable} rows=${rows} showBranch/></section>
  </${Fragment}>`;
}

function AdminMembers() {
  const [qq, setQq] = useState('');
  const rows = all('members').filter(m => !qq || (m.id + m.name + m.email).toLowerCase().includes(qq.toLowerCase())).sort((a, c) => (a.joinedAt < c.joinedAt ? 1 : -1));
  const bk = id => all('bookings').filter(x => x.userId === id);
  const wl = id => all('wallet').filter(w => w.userId === id && walletState(w) === 'active').length;
  return html`<${Fragment}>
    <div class="page-head"><div><h1>회원</h1><p>${all('members').length}명 · 아이디를 골라 쿠폰을 바로 보낼 수 있습니다</p></div></div>
    <div class="toolbar"><input class="input" id="am-q" placeholder="아이디·이름·이메일" value=${qq} onInput=${e => setQq(e.target.value)}/></div>
    <section class="panel"><${Table} rows=${rows} cols=${[
      { h: '아이디', v: m => html`<span class="mono nm">${m.id}</span>` },
      { h: '이름', v: m => m.name },
      { h: '국가·언어', v: m => `${m.country} · ${langName(m.lang)}` },
      { h: '가입일', v: m => html`<span class="num">${kdy(m.joinedAt)}</span>` },
      { h: '예약', r: true, v: m => { const x = bk(m.id); return `${x.length}건`; } },
      { h: '쿠폰', r: true, v: m => `${wl(m.id)}장` },
      { h: '', v: m => html`<button class="btn line sm" onClick=${e => { e.stopPropagation(); S.a.drawer = { kind: 'send', ids: m.id }; emit(); }}><${Icon} n="send" cls="sm"/>쿠폰 보내기</button>` },
    ]}/></section>
  </${Fragment}>`;
}

function SendDrawer({ ids }) {
  const usable = all('coupons').filter(c => couponFit(c).ok).sort((a, c) => (a.createdAt < c.createdAt ? 1 : -1));
  const [cid, setCid] = useState(usable[0] ? usable[0].id : '');
  const c = get('coupons', cid);
  return html`<${Drawer} title="쿠폰 보내기" sub="고른 쿠폰을 회원 쿠폰함에 넣습니다" onClose=${() => { S.a.drawer = null; emit(); }}>
    <label class="field"><span>보낼 쿠폰</span><select class="select" id="sd-cp" value=${cid} onChange=${e => setCid(e.target.value)}>${usable.map(x => html`<option value=${x.id}>${x.name.ko} · ${cpAmtKo(x)}</option>`)}</select></label>
    ${c ? html`<${KoTicket} c=${c}/><${SendBox} coupon=${c} by="admin" preset=${ids} key=${cid}/>` : html`<div class="empty"><strong>보낼 수 있는 쿠폰이 없습니다</strong></div>`}
  </${Drawer}>`;
}

function AdminCoupons() {
  const [qq, setQq] = useState('');
  if (S.a.coupon === 'new') return html`<${Fragment}><div class="page-head"><div><button class="btn quiet sm" onClick=${() => { S.a.coupon = null; emit(); }}><${Icon} n="arrowL" cls="sm"/>쿠폰 목록</button><h1 style="margin-top:6px">쿠폰 만들기</h1></div></div>
    <section class="panel"><div class="pad"><${CouponForm} mode="admin" onDone=${id => { S.a.coupon = id; emit(); }} onCancel=${() => { S.a.coupon = null; emit(); }}/></div></section></${Fragment}>`;
  if (S.a.coupon) return html`<${CouponDetail} id=${S.a.coupon} by="admin" back=${() => { S.a.coupon = null; emit(); }}/>`;
  const rows = all('coupons').filter(c => !qq || (c.name.ko + (c.code || '')).toLowerCase().includes(qq.toLowerCase())).sort((a, c) => (a.createdAt < c.createdAt ? 1 : -1));
  return html`<${Fragment}>
    <div class="page-head"><div><h1>쿠폰</h1><p>쿠폰 번호(공개형·1회용)를 발행하거나 회원 아이디로 쿠폰함에 보냅니다. 점주가 PMS에서 만든 지점 쿠폰도 여기서 함께 봅니다.</p></div>
      <button class="btn" onClick=${() => { S.a.coupon = 'new'; emit(); }}><${Icon} n="plus" cls="sm"/>쿠폰 만들기</button></div>
    <div class="toolbar"><input class="input" id="ac-q" placeholder="쿠폰명·번호" value=${qq} onInput=${e => setQq(e.target.value)}/></div>
    <section class="panel"><${Table} rows=${rows} onRow=${c => { S.a.coupon = c.id; emit(); }} cols=${[
      { h: '쿠폰', v: c => html`<span class="two"><span class="nm">${c.name.ko}</span><small>${c.issuer === 'pms' ? '점주 발행 · ' + bTitleKo(get('branches', c.issuerBranch)) : '본사 발행'}</small></span>` },
      { h: '방식', v: c => html`<span class="two"><span>${KIND_KO[c.kind]}</span><small class="mono">${c.code || (c.codes ? Object.keys(c.codes).length + '개 번호' : '')}</small></span>` },
      { h: '할인', v: c => cpAmtKo(c) },
      { h: '조건·적용', v: c => html`<span class="two"><span>${condKo(c)}</span><small>${scopeKo(c)}</small></span>` },
      { h: '기간', v: c => html`<span class="num">${kd(c.from)} ~ ${kdy(c.to)}</span>` },
      { h: '부담', v: c => html`<span class=${cx('badge', c.funder === 'HQ' ? 'info' : 'warn')}>${c.funder === 'HQ' ? '본사' : '지점'}</span>` },
      { h: '발급·사용', r: true, v: c => { const s = cpStats(c.id); return `${s.issued} · ${s.used}`; } },
      { h: '상태', v: c => { const [l, k] = cpStateKo(c); return html`<span class=${cx('badge', k)}>${l}</span>`; } },
    ]}/></section>
  </${Fragment}>`;
}

function AdminOwners() {
  const [edit, setEdit] = useState(null);
  const rows = all('owners').sort((a, c) => (a.name < c.name ? -1 : 1));
  const unassigned = all('branches').filter(b => !b.ownerId && b.status !== 'closed');
  return html`<${Fragment}>
    <div class="page-head"><div><h1>점주 계정</h1><p>계정에 연결한 지점만 점주 PMS에서 보입니다 · 미배정 지점 ${unassigned.length}곳</p></div>
      <button class="btn" onClick=${() => setEdit({ id: '', name: '', branchIds: [], isNew: true })}><${Icon} n="plus" cls="sm"/>계정 추가</button></div>
    <section class="panel"><${Table} rows=${rows} onRow=${o => setEdit({ ...plain(o) })} cols=${[
      { h: '계정', v: o => html`<span class="two"><span class="nm">${o.name}</span><small class="mono">${o.id}</small></span>` },
      { h: '지점', v: o => html`<span class="row tight">${o.branchIds.map(id => get('branches', id)).filter(Boolean).map(b => html`<span class=${cx('badge', STATUS_BADGE[b.status])}>${bTitleKo(b)}</span>`)}</span>` },
      { h: '', v: o => html`<button class="btn line sm" onClick=${e => { e.stopPropagation(); S.owner = o.id; store.set('owner', o.id); S.p = { tab: 'dash', branch: o.branchIds[0] }; S.role = 'pms'; emit(); }}>PMS로 보기</button>` },
    ]}/></section>
    ${edit && html`<${OwnerModal} o=${edit} onClose=${() => setEdit(null)}/>`}
  </${Fragment}>`;
}
function OwnerModal({ o, onClose }) {
  const [f, setF] = useState(o);
  const [err, setErr] = useState('');
  const save = async () => {
    const id = f.isNew ? f.id.trim().toLowerCase() : f.id;
    if (f.isNew && !/^[a-z0-9._-]{3,30}$/.test(id)) return setErr('계정 아이디는 영문 소문자·숫자 3~30자로 입력하세요');
    if (f.isNew && get('owners', id)) return setErr('이미 있는 계정입니다');
    if (!f.name.trim()) return setErr('이름을 입력하세요');
    await put('owners', id, { id, name: f.name.trim(), branchIds: f.branchIds });
    for (const b of all('branches')) {
      const want = f.branchIds.includes(b.id);
      if (want && b.ownerId !== id) await patch('branches', b.id, { ownerId: id });
      if (!want && b.ownerId === id) await patch('branches', b.id, { ownerId: null });
    }
    for (const other of all('owners').filter(x => x.id !== id && x.branchIds.some(b => f.branchIds.includes(b)))) await patch('owners', other.id, { branchIds: other.branchIds.filter(b => !f.branchIds.includes(b)) });
    toast('점주 계정을 저장했습니다'); onClose();
  };
  return html`<${Modal} title=${f.isNew ? '점주 계정 추가' : f.name} onClose=${onClose} footer=${html`<button class="btn line" onClick=${onClose}>취소</button><button class="btn" onClick=${save}>저장</button>`}>
    <div class="grid2"><label class="field"><span>계정 아이디</span><input class="input mono" id="ow-id" disabled=${!f.isNew} value=${f.id} onInput=${e => setF({ ...f, id: e.target.value })}/></label>
      <label class="field"><span>표시 이름</span><input class="input" id="ow-name" value=${f.name} onInput=${e => setF({ ...f, name: e.target.value })}/></label></div>
    <div class="field"><span>연결 지점</span><div class="amen-pick" style="max-height:260px;overflow:auto">${all('branches').sort((a, c) => (a.name.ko < c.name.ko ? -1 : 1)).map(b => html`<label class="check"><input type="checkbox" checked=${f.branchIds.includes(b.id)} onChange=${e => setF({ ...f, branchIds: e.target.checked ? [...f.branchIds, b.id] : f.branchIds.filter(x => x !== b.id) })}/>${bTitleKo(b)}</label>`)}</div>
      <span class="hint">다른 계정에 연결된 지점을 고르면 그 계정에서는 빠집니다.</span></div>
    ${err && html`<span class="cp-msg err"><${Icon} n="warn" cls="sm"/>${err}</span>`}
  </${Modal}>`;
}

function AdminSettings() {
  const [code, setCode] = useState('');
  const [job, setJob] = useState(null);
  const [seed, setSeed] = useState(null);
  const [canAi, setCanAi] = useState(null);
  useEffect(() => { canTranslate().then(setCanAi); }, []);
  const cached = all('i18n').sort((a, c) => (a.name < c.name ? -1 : 1));
  const make = async (lc) => {
    const l = LANGS.find(x => x[0] === lc); if (!l) return;
    const ctl = new AbortController(); setJob({ code: lc, p: 0, ctl });
    try { await aiTranslate(l[0], l[2], l[1], p => setJob(j => (j ? { ...j, p } : j)), ctl.signal); toast(`${l[1]} 번역을 저장했습니다`); setJob(null); }
    catch (e) { const m = aiErr(e); setJob(null); if (m) toast(m, 'error'); }
  };
  const uiKeys = Object.keys(I18N.en).length;
  const mapState = window.claude ? ['Claude 안에서는 기본 지도', '이 화면(Claude)에서는 외부 지도를 불러올 수 없어 서울 구 경계 지도를 씁니다. 깃허브 사이트에서는 config.js의 키로 실제 Google 지도가 열립니다.', '']
    : !CFG.googleMapsApiKey ? ['키 없음 · 기본 지도', 'config.js의 googleMapsApiKey에 Maps JavaScript API 키를 넣으면 이용자 지도·지점 위치·좌표 지정이 실제 Google 지도로 바뀝니다. 지금은 서울 구 경계 지도와 Google 지도 열기·길찾기 링크를 씁니다.', '']
    : GM.state === 'failed' ? ['키 확인 필요', `Google 지도를 불러오지 못해 기본 지도로 보여 주고 있습니다 (${GM.err === 'auth' ? '키가 틀렸거나, Maps JavaScript API가 꺼져 있거나, 이 사이트 주소가 키에 허용되지 않음' : GM.err === 'timeout' ? '응답 시간 초과' : '스크립트를 불러오지 못함'}). README의 Google 지도 설정을 확인하세요.`, 'bad']
    : GM.state === 'ready' ? ['연결됨', 'Maps JavaScript API로 지도를 그립니다. 같은 키에 Geocoding API를 허용하면 지점 편집에서 주소로 좌표를 찾을 수 있습니다.', 'good']
    : ['키 입력됨', '지도를 처음 여는 화면에서 Google 지도를 불러옵니다. 실패하면 기본 지도로 자동 전환됩니다.', ''];
  const trState = window.claude ? ['AI 번역 사용', '기본 6개 언어는 검수된 번역 파일을 쓰고, 그 밖의 언어는 Claude AI 번역을 저장해 모든 방문자가 함께 씁니다.', 'good']
    : CFG.translateApiKey ? ['Google 번역 연결', '기본 6개 언어는 번역 파일을 쓰고, 그 밖의 언어는 Cloud Translation API로 번역해 저장합니다.', 'good']
    : ['기본 6개 언어', '한국어·English·日本語·简体中文·繁體中文·Tiếng Việt를 씁니다. config.js의 translateApiKey에 Cloud Translation API 키를 넣으면 그 밖의 언어도 자동 번역됩니다.', ''];
  const fb = S.backend && S.backend.kind === 'firebase';
  const dataState = S.mode === 'cloud' ? [fb ? 'Firebase 연결됨' : '공유 저장소 연결됨', fb ? 'Cloud Firestore에 저장합니다. 이 사이트를 여는 모든 사람이 같은 지점·예약·쿠폰을 봅니다.' : 'Claude 공유 저장소에 저장합니다. 이 화면을 여는 사람들이 같은 데이터를 봅니다.', 'good']
    : S.mode === 'sandbox' ? ['읽기 전용', '쓰기 권한이 없어 변경 내용은 이 화면에서만 유지됩니다.', 'warn']
    : [CFG.firebase && CFG.firebase.projectId ? '연결 실패 · 이 브라우저만' : '이 브라우저만', CFG.firebase && CFG.firebase.projectId ? 'Firebase에 연결하지 못해 이 브라우저에 저장하고 있습니다. config.js의 firebase 값과 Firestore 규칙을 확인하세요.' : '지금은 예약·쿠폰이 이 브라우저에만 저장됩니다. 점주·본사·이용자가 같은 데이터를 보려면 config.js에 Firebase를 연결하세요.', CFG.firebase && CFG.firebase.projectId ? 'bad' : ''];
  return html`<${Fragment}>
    <div class="page-head"><div><h1>설정</h1><p>언어·지도·데이터와 실서비스 연동 항목</p></div></div>
    <section class="panel"><header><div><h2>언어</h2><p>기본 제공 ${BUILTIN.length}개 언어 + AI 번역으로 그 밖의 언어 · 번역은 한 번 만들면 저장되어 모든 방문자가 바로 씁니다</p></div></header>
      <div class="pad stack">
        <div class="row tight">${BUILTIN.map(c => html`<span class="badge good">${langName(c)}</span>`)}</div>
        <div class="row" style="align-items:end">
          <label class="field" style="min-width:240px"><span>AI 번역 언어 추가</span><select class="select" id="st-lang" value=${code} onChange=${e => setCode(e.target.value)}><option value="">언어 선택</option>${LANGS.filter(l => !BUILTIN.includes(l[0])).map(l => html`<option value=${l[0]}>${l[1]} · ${l[2]}${get('i18n', l[0]) ? ' (저장됨)' : ''}</option>`)}</select></label>
          <button class="btn" disabled=${!code || !!job || canAi === false} onClick=${() => make(code)}><${Icon} n="spark" cls="sm"/>번역 만들기</button>
          ${job && html`<div style="flex:1;min-width:200px" class="stack" style="gap:4px"><span class="muted" style="font-size:13px">${langName(job.code)} 번역 중 ${Math.round(job.p * 100)}%</span><div class="progress"><i style=${`width:${Math.max(4, Math.round(job.p * 100))}%`}></i></div><button class="btn quiet sm" onClick=${() => { job.ctl.abort(); setJob(null); }}>중지</button></div>`}
        </div>
        ${canAi === false && html`<p class="note"><${Icon} n="info" cls="sm"/>자동 번역이 꺼져 있습니다. config.js에 Google 번역 API 키를 넣거나 Claude 안에서 열면 켜집니다. 이미 저장된 번역은 그대로 쓸 수 있습니다.</p>`}
        ${cached.length > 0 && html`<${Table} rows=${cached} cols=${[
          { h: '언어', v: d => html`<span class="two"><span class="nm">${d.name}</span><small class="mono">${d.lang}</small></span>` },
          { h: '화면 문구', r: true, v: d => `${Object.keys(d.ui || {}).length} / ${uiKeys}` },
          { h: '지점 소개', r: true, v: d => `${Object.keys(d.content || {}).length}개` },
          { h: '만든 날', v: d => kdt(d.at) },
          { h: '', v: d => html`<span class="row tight" style="flex-wrap:nowrap"><button class="btn line sm" disabled=${!canAi || !!job} onClick=${() => make(d.lang)}>다시 번역</button><button class="btn quiet sm" onClick=${async () => { if (await askConfirm({ title: `${d.name} 번역을 삭제할까요?`, ok: '삭제', danger: true })) removeDoc('i18n', d.lang); }}>삭제</button></span>` },
        ]}/>`}
      </div></section>
    <section class="panel"><header><div><h2>연동 상태</h2><p>config.js에 키를 넣으면 켜지는 항목과 실서비스 전에 붙일 항목</p></div></header><div class="checklist">
      ${[['map', 'Google 지도', mapState[1], mapState[0], mapState[2]],
        ['globe', '번역', trState[1], trState[0], trState[2]],
        ['grid', '공유 데이터', dataState[1], dataState[0], dataState[2]],
        ['wallet', '결제 (PG)', '국내 카드·간편결제와 해외 카드 결제를 받을 PG를 붙이고, 취소·부분환불과 보증금 환급을 연결합니다. 지금은 결제 단계가 데모입니다.', 'PG 계약 필요', ''],
        ['msg', '알림톡', '예약·결제·연장·룸투어·쿠폰 발송 이벤트를 점주와 이용자에게 카카오 알림톡(외국인은 이메일·SMS)으로 보냅니다. 지금은 화면 안 알림으로만 보입니다.', '발신 프로필 필요', ''],
        ['user', '회원 인증', '지금은 아이디만으로 들어가는 데모 로그인입니다. 휴대폰 본인인증·이메일 가입, 해외 이용자용 Google·Apple 로그인, 점주·본사 권한 분리가 필요합니다.', '실서비스 전 필수', 'warn'],
        ['lock', '개인정보·약관', '숙박 예약 개인정보 처리방침, 위치기반서비스·마케팅 수신 동의, 국외 이용자 고지를 준비합니다.', '', '']]
        .map(([ic, h, p, tag, tone]) => html`<div><${Icon} n=${ic}/><span><b>${h}</b><span class="sub">${p}</span></span>${tag ? html`<span class=${cx('badge', tone)}>${tag}</span>` : html`<span></span>`}</div>`)}
    </div></section>
    <section class="panel"><header><div><h2>데모 데이터</h2><p>${S.mode === 'cloud' ? '공유 데이터에 저장 중 · 이 사이트를 여는 사람과 함께 봅니다' : S.mode === 'sandbox' ? '쓰기 권한 없음 · 변경 내용은 이 화면에서만 유지됩니다' : '이 브라우저에만 저장됩니다 · 다른 방문자와 함께 쓰려면 config.js에 Firebase를 연결하세요'}</p></div></header>
      <div class="pad stack"><p class="sub" style="font-size:14px">지점·객실·예약·쿠폰·회원을 처음 데모 상태로 되돌립니다. 만든 AI 번역은 남겨 둡니다.</p>
        ${seed ? html`<div class="progress"><i style=${`width:${Math.round((seed[0] / seed[1]) * 100)}%`}></i></div>` : html`<div><button class="btn line" onClick=${async () => { if (!(await askConfirm({ title: '데모 데이터로 되돌릴까요?', body: '지금까지 만든 예약·쿠폰·지점 변경이 모두 지워집니다.', ok: '되돌리기', danger: true }))) return; setSeed([0, 1]); await seedDemo((i, n) => setSeed([i, n])); setSeed(null); toast('데모 데이터로 되돌렸습니다'); }}><${Icon} n="refresh" cls="sm"/>데모 데이터로 되돌리기</button></div>`}
      </div></section>
  </${Fragment}>`;
}
