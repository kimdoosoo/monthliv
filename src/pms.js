/* ================= OWNER PMS ================= */
function PmsLogin() {
  const owners = all('owners').sort((a, b) => (a.name < b.name ? -1 : 1));
  return html`<div class="wrap" style="padding-block:40px 64px;max-width:1000px">
    <div class="stack" style="gap:8px;margin-bottom:22px"><${Wordmark} size=${30}/><span class="mono" style="font-size:12px;letter-spacing:.12em;color:var(--oak)">PARTNER PMS</span>
      <h1 style="font-size:26px;letter-spacing:-.02em;margin-top:6px">점주 계정으로 로그인</h1>
      <p class="sub">프로토타입이라 비밀번호 없이 계정을 고르면 들어갑니다. 실서비스에서는 점주별 아이디·비밀번호와 휴대폰 인증을 씁니다.</p></div>
    ${owners.length === 0 ? html`<div class="empty"><strong>점주 계정이 없습니다</strong><span>운영 Admin › 점주 계정에서 만드세요.</span></div>` : html`<div class="login-pick">${owners.map(o => {
      const bs = (o.branchIds || []).map(id => get('branches', id)).filter(Boolean);
      return html`<button onClick=${() => { S.owner = o.id; store.set('owner', o.id); S.p = { tab: 'dash', branch: bs[0] && bs[0].id }; emit(); }}>
        <b>${o.name}</b><small class="mono">${o.id}</small><span class="row tight" style="margin-top:6px">${bs.map(b => html`<span class=${cx('badge', STATUS_BADGE[b.status])}>${bTitleKo(b)}</span>`)}</span></button>`;
    })}</div>`}
  </div>`;
}

function PmsApp() {
  const owner = S.owner && get('owners', S.owner);
  if (!owner) return html`<${PmsLogin}/>`;
  const bs = (owner.branchIds || []).map(id => get('branches', id)).filter(Boolean);
  if (!bs.length) return html`<div class="wrap section"><div class="empty"><strong>이 계정에 연결된 지점이 없습니다</strong><button class="btn line sm" onClick=${() => { S.owner = null; store.set('owner', null); emit(); }}>다른 계정으로</button></div></div>`;
  if (!S.p.branch || !bs.some(b => b.id === S.p.branch)) S.p.branch = bs[0].id;
  const b = get('branches', S.p.branch);
  const tab = S.p.tab;
  const setTab = k => { S.p.tab = k; S.p.drawer = null; emit(); try { window.scrollTo({ top: 0 }); } catch {} };
  const pendingTours = all('tours').filter(x => x.branchId === b.id && x.status === 'requested').length;
  const upcoming = all('bookings').filter(x => x.branchId === b.id && x.status === 'confirmed').length;
  const nav = [['dash', '대시보드', 'chart'], ['rooms', '객실 현황', 'grid'], ['bookings', '예약', 'ticket', upcoming], ['tours', '룸투어', 'calendar', pendingTours], ['rates', '요금', 'tag'], ['coupons', '쿠폰', 'send'], ['settle', '정산', 'wallet'], ['alerts', '알림톡', 'msg'], ['info', '지점 정보', 'building']];
  const page = { dash: PmsDash, rooms: PmsRooms, bookings: PmsBookings, tours: PmsTours, rates: PmsRates, coupons: PmsCoupons, settle: PmsSettle, alerts: PmsAlerts, info: PmsInfo }[tab] || PmsDash;
  return html`<div class="console">
    <aside class="side">
      <div class="brand"><${Wordmark} onClick=${() => setTab('dash')}/><span class="role">Partner PMS</span></div>
      ${bs.length > 1 && html`<label class="field" style="padding:0 6px 10px"><span>지점</span><select class="select" id="pms-branch" value=${b.id} onChange=${e => { S.p.branch = e.target.value; emit(); }}>${bs.map(x => html`<option value=${x.id}>${bTitleKo(x)}</option>`)}</select></label>`}
      <nav aria-label="PMS 메뉴">${nav.map(([k, l, ic, n]) => html`<button aria-current=${tab === k ? 'page' : null} onClick=${() => setTab(k)}><${Icon} n=${ic}/>${l}${n ? html`<span class="cnt">${n}</span>` : ''}</button>`)}</nav>
      <div class="foot"><span><b style="color:var(--ink)">${owner.name}</b><br/><span class="mono">${owner.id}</span></span>
        <button class="btn line sm" onClick=${() => { S.owner = null; store.set('owner', null); emit(); }}><${Icon} n="logout" cls="sm"/>계정 바꾸기</button></div>
    </aside>
    <main class="main"><${page} b=${b} key=${b.id + tab}/></main>
    ${S.p.drawer && S.p.drawer.kind === 'booking' && html`<${BookingDrawer} id=${S.p.drawer.id} onClose=${() => { S.p.drawer = null; emit(); }}/>`}
  </div>`;
}
const openBk = id => { S.p.drawer = { kind: 'booking', id }; emit(); };

function PmsHead({ b, title, sub, right }) {
  return html`<div class="page-head"><div><h1>${title}</h1><p>${sub || html`${bTitleKo(b)} · <span class=${cx('badge', STATUS_BADGE[b.status])}>${STATUS_KO[b.status]}</span>`}</p></div>${right}</div>`;
}

function PmsDash({ b }) {
  const st = occStats(b);
  const td = today(), tm = addDays(td, 1);
  const bks = all('bookings').filter(x => x.branchId === b.id);
  const inToday = bks.filter(x => x.status === 'confirmed' && x.checkIn === td);
  const rooms = ((get('rooms', b.id) || {}).list) || [];
  const outSoon = bks.filter(x => x.status === 'staying' && (x.checkOut === td || x.checkOut === tm)).length + rooms.filter(r => r.occ && (r.occ.until === td || r.occ.until === tm)).length;
  const ym = td.slice(0, 7);
  const s = settle(b, ym);
  const tours = all('tours').filter(x => x.branchId === b.id);
  const days = Array.from({ length: 7 }, (_, i) => addDays(td, i));
  const items = d => {
    const out = [];
    for (const x of bks) {
      if (x.status === 'confirmed' && x.checkIn === d) out.push(html`<span class="it"><span class="badge oak">입실</span><button class="btn quiet sm" style="padding:0" onClick=${() => openBk(x.id)}>${x.guest.name} · ${x.roomNo || '미배정'}호</button></span>`);
      if ((x.status === 'staying' || x.status === 'confirmed') && x.checkOut === d) out.push(html`<span class="it"><span class="badge">퇴실</span><button class="btn quiet sm" style="padding:0" onClick=${() => openBk(x.id)}>${x.guest.name} · ${x.roomNo}호</button></span>`);
    }
    for (const r of rooms) if (r.occ && r.occ.until === d) out.push(html`<span class="it"><span class="badge">계약 만료</span>${r.no}호 기존 입실자</span>`);
    for (const x of tours) if (x.date === d && x.status !== 'cancelled') out.push(html`<span class="it"><span class=${cx('badge', x.status === 'requested' ? 'warn' : 'info')}>룸투어 ${x.time}</span>${x.name} · ${TOUR_KO[x.status]}</span>`);
    return out;
  };
  const logs = (get('logs', b.id) || {}).items || [];
  return html`<${Fragment}>
    <${PmsHead} b=${b} title=${bTitleKo(b)} sub=${html`<span class=${cx('badge', STATUS_BADGE[b.status])}>${STATUS_KO[b.status]}</span> · ${b.status === 'soon' ? `오픈 ${kdy(b.openDate)}` : `운영 시작 ${kdy(b.openDate)}`} · 객실 ${st.total}실 · 운영 수수료 ${Math.round(b.feeRate * 100)}%`}
      right=${html`<button class="btn line sm" onClick=${() => { S.role = 'user'; S.u.route = { name: 'branch', id: b.id }; emit(); }}><${Icon} n="external" cls="sm"/>이용자 화면에서 보기</button>`}/>
    <div class="kpis">
      <${Kpi} k="점유율" icon="bed" v=${pct(st.occ, st.total)} small="%" meter=${st.rate} d=${`입실 중 ${st.occ} / ${st.total}실`}/>
      <${Kpi} k="공실" icon="door" v=${st.vac} small="실" d=${`입실 예정 ${st.res} · 청소 ${st.cln} · 점검 ${st.mnt}`}/>
      <${Kpi} k="오늘 입실" icon="key" v=${inToday.length} small="건" d=${inToday.length ? inToday.map(x => x.guest.name).join(', ') : '예정 없음'}/>
      <${Kpi} k="오늘·내일 퇴실" icon="logout" v=${outSoon} small="건"/>
      <${Kpi} k=${`${+ym.slice(5)}월 정산 기준 매출`} icon="wallet" v=${won(s.basis)} d=${`시스템 예약 ${s.rows.length}건`}/>
      <${Kpi} k="룸투어 확인 필요" icon="calendar" v=${tours.filter(x => x.status === 'requested').length} small="건"/>
    </div>
    <div class="cols2">
      <section class="panel"><header><h2>앞으로 7일</h2><p>입실·퇴실·룸투어</p></header><div class="agenda">
        ${days.map(d => { const its = items(d); return html`<div class="day"><span class="d">${d === td ? '오늘' : d === tm ? '내일' : KO_WD[pd(d).getDay()] + '요일'}<b>${kd(d)}</b></span><div class="items">${its.length ? its : html`<span class="muted" style="font-size:13px">일정 없음</span>`}</div></div>`; })}
      </div></section>
      <section class="panel"><header><div><h2>알림톡 발송 내역</h2><p>예약·결제·연장·룸투어가 생기면 점주에게 자동 발송됩니다</p></div><button class="btn quiet sm" onClick=${() => { S.p.tab = 'alerts'; emit(); }}>전체 보기</button></header><${Feed} items=${logs} limit=${7}/></section>
    </div>
  </${Fragment}>`;
}

function PmsRooms({ b }) {
  const [flt, setFlt] = useState('all');
  const [typ, setTyp] = useState('');
  const [sel, setSel] = useState(null);
  const doc = get('rooms', b.id);
  const list = (doc && doc.list) || [];
  const rows = list.map(r => ({ r, now: roomNow(b.id, r) }));
  const counts = rows.reduce((a, x) => ((a[x.now.s] = (a[x.now.s] || 0) + 1), a), {});
  const shown = rows.filter(x => (flt === 'all' || x.now.s === flt) && (!typ || x.r.t === typ));
  const floors = {};
  for (const x of shown) { const f = x.r.no.slice(0, -2) || '1'; (floors[f] = floors[f] || []).push(x); }
  const rt = id => b.types.find(x => x.id === id);
  const cur = sel && rows.find(x => x.r.no === sel);
  const act = async (fn, msg) => { await fn(); toast(msg); setSel(null); };
  return html`<${Fragment}>
    <${PmsHead} b=${b} title="객실 현황" right=${html`<div class="legend">${Object.keys(ROOM_ST).map(k => html`<span class=${'st-' + k}><${Icon} n=${ROOM_ST[k][1]} cls="sm"/>${ROOM_ST[k][0]} ${counts[k] || 0}</span>`)}</div>`}/>
    <div class="toolbar">
      <button class="chip" aria-pressed=${flt === 'all'} onClick=${() => setFlt('all')}>전체 ${list.length}</button>
      ${Object.keys(ROOM_ST).map(k => html`<button class="chip" aria-pressed=${flt === k} onClick=${() => setFlt(k)}>${ROOM_ST[k][0]} ${counts[k] || 0}</button>`)}
      <span class="grow"></span>
      <select class="select" id="rm-type" value=${typ} onChange=${e => setTyp(e.target.value)}><option value="">모든 객실 타입</option>${b.types.map(x => html`<option value=${x.id}>${x.name.ko}</option>`)}</select>
    </div>
    ${list.length === 0 && html`<div class="empty"><strong>등록된 객실이 없습니다</strong><span>운영 Admin에서 객실 타입과 객실 수를 입력하면 만들어집니다.</span></div>`}
    ${Object.keys(floors).sort((a, c) => +a - +c).map(f => html`<div class="floor"><h3>${f}F</h3><div class="rooms">${floors[f].map(({ r, now }) => html`<button class=${cx('room', now.s)} onClick=${() => setSel(r.no)}>
      <span class="no">${r.no}<small>${(rt(r.t) || {}).name ? rt(r.t).name.ko : r.t}</small></span>
      <${RoomChip} s=${now.s}/>
      <span class="who">${now.s === 'occ' ? (now.bk ? `${now.bk.guest.name} ~${kd(now.until)}` : `기존 계약 ~${kd(now.until)}`) : now.s === 'res' ? `${now.bk.guest.name} ${kd(now.from)} 입실` : now.next ? `다음 예약 ${kd(now.next.checkIn)}` : ' '}</span>
    </button>`)}</div></div>`)}
    ${cur && html`<${Drawer} title=${`${cur.r.no}호`} sub=${`${(rt(cur.r.t) || {}).name ? rt(cur.r.t).name.ko : ''} · ${ROOM_ST[cur.now.s][0]}`} onClose=${() => setSel(null)} footer=${html`
      ${cur.now.s === 'cln' && html`<button class="btn" onClick=${() => act(() => setRoom(b.id, cur.r.no, { flag: null }), '청소 완료로 바꿨습니다')}><${Icon} n="check" cls="sm"/>청소 완료</button>`}
      ${cur.now.s === 'mnt' && html`<button class="btn" onClick=${() => act(() => setRoom(b.id, cur.r.no, { flag: null }), '점검을 마쳤습니다')}><${Icon} n="check" cls="sm"/>점검 완료</button>`}
      ${(cur.now.s === 'vac' || cur.now.s === 'cln') && html`<button class="btn line" onClick=${() => act(() => setRoom(b.id, cur.r.no, { flag: 'mnt' }), '점검 중으로 바꿨습니다. 이 객실은 예약을 받지 않습니다')}><${Icon} n="wrench" cls="sm"/>점검 시작</button>`}
      ${cur.now.s === 'occ' && cur.now.legacy && html`<button class="btn" onClick=${() => act(() => setRoom(b.id, cur.r.no, { occ: null, flag: 'cln' }), '퇴실 처리했습니다')}><${Icon} n="door" cls="sm"/>퇴실 처리</button>
        <button class="btn line" onClick=${() => act(() => setRoom(b.id, cur.r.no, { occ: { ...cur.r.occ, until: addMonths(cur.r.occ.until, 1) } }), '계약을 1개월 연장했습니다')}>1개월 연장</button>`}
      ${cur.now.bk && html`<button class="btn line" onClick=${() => { setSel(null); openBk(cur.now.bk.id); }}>예약 상세</button>`}`}>
      <dl class="kv"><dt>객실 타입</dt><dd>${(rt(cur.r.t) || {}).name ? `${rt(cur.r.t).name.ko} · ${rt(cur.r.t).size}㎡ · ${WIN_KO[rt(cur.r.t).window]}` : cur.r.t}</dd>
        <dt>현재 상태</dt><dd><${RoomChip} s=${cur.now.s}/></dd>
        ${cur.now.s === 'occ' && html`<dt>입실자</dt><dd>${cur.now.bk ? `${cur.now.bk.guest.name} (${cur.now.bk.userId})` : '기존 계약 입실자'}</dd><dt>계약 종료</dt><dd>${kdy(cur.now.until)}</dd>`}
        ${cur.now.s === 'res' && html`<dt>입실 예정</dt><dd>${cur.now.bk.guest.name} · ${kdy(cur.now.bk.checkIn)} ~ ${kdy(cur.now.bk.checkOut)}</dd>`}
        ${cur.now.next && cur.now.s !== 'res' && html`<dt>다음 예약</dt><dd>${cur.now.next.guest.name} · ${kdy(cur.now.next.checkIn)}</dd>`}</dl>
      <p class="note"><${Icon} n="info" cls="sm"/>퇴실 처리하면 객실이 청소 필요로 바뀌고, 청소 완료를 누르면 이용자 사이트에 공실로 열립니다.</p>
    </${Drawer}>`}
  </${Fragment}>`;
}

function BookingTable({ rows, showBranch }) {
  return html`<${Table} empty="해당하는 예약이 없습니다" rows=${rows} onRow=${r => openBkAny(r.id)} cols=${[
    { h: '예약번호', v: r => html`<span class="mono">${r.code}</span>` },
    ...(showBranch ? [{ h: '지점', v: r => bTitleKo(get('branches', r.branchId)) }] : []),
    { h: '투숙객', v: r => html`<span class="two"><span class="nm">${r.guest.name}</span><small class="mono">${r.userId}</small></span>` },
    { h: '객실', v: r => { const b = get('branches', r.branchId); const t2 = b && b.types.find(x => x.id === r.typeId); return html`<span class="two"><span>${t2 ? t2.name.ko : r.typeId}</span><small>${r.roomNo ? r.roomNo + '호' : '미배정'}</small></span>`; } },
    { h: '일정', v: r => html`<span class="two"><span class="num">${kd(r.checkIn)} → ${kd(r.checkOut)}</span><small>${r.qty}${UNIT_KO[r.unit]}</small></span>` },
    { h: '결제', r: true, v: r => won(r.price.total) },
    { h: '쿠폰', v: r => (r.coupon ? html`<span class=${cx('badge', r.coupon.funder === 'HQ' ? 'info' : 'warn')}>-${won(r.coupon.discount)}</span>` : html`<span class="muted">—</span>`) },
    { h: '상태', v: r => html`<span class=${cx('badge', { confirmed: 'oak', staying: 'good', done: '', cancelled: 'bad' }[r.status])}>${BK_KO[r.status]}</span>` },
  ]}/>`;
}
function openBkAny(id) { if (S.role === 'admin') { S.a.drawer = { kind: 'booking', id }; emit(); } else openBk(id); }

function PmsBookings({ b }) {
  const [tab, setTab] = useState('confirmed');
  const all2 = all('bookings').filter(x => x.branchId === b.id);
  const rows = (tab === 'all' ? all2 : all2.filter(x => x.status === tab)).sort((a, c) => (tab === 'done' || tab === 'cancelled' || tab === 'all' ? (a.createdAt < c.createdAt ? 1 : -1) : (a.checkIn < c.checkIn ? -1 : 1)));
  const n = k => all2.filter(x => x.status === k).length;
  return html`<${Fragment}>
    <${PmsHead} b=${b} title="예약"/>
    <section class="panel"><div class="seg-tabs" role="tablist" style="padding:0 8px">${[['confirmed', '입실 예정'], ['staying', '투숙 중'], ['done', '이용 완료'], ['cancelled', '취소'], ['all', '전체']].map(([k, l]) => html`<button role="tab" aria-selected=${tab === k} onClick=${() => setTab(k)}>${l}<span class="count">${k === 'all' ? all2.length : n(k)}</span></button>`)}</div>
      <${BookingTable} rows=${rows}/></section>
  </${Fragment}>`;
}

function PmsTours({ b }) {
  const rows = all('tours').filter(x => x.branchId === b.id).sort((a, c) => (a.date + a.time < c.date + c.time ? 1 : -1));
  const set = async (x, status, msg) => { await patch('tours', x.id, { status }); if (status === 'confirmed') await addLog(b.id, 'tour', `룸투어 확정 · ${x.name} · ${kd(x.date)} ${x.time}`); toast(msg); };
  return html`<${Fragment}>
    <${PmsHead} b=${b} title="룸투어"/>
    <section class="panel"><${Table} empty="룸투어 신청이 없습니다" rows=${rows} cols=${[
      { h: '방문 일시', v: x => html`<span class="num">${kdw(x.date)} ${x.time}</span>` },
      { h: '신청자', v: x => html`<span class="two"><span class="nm">${x.name}</span><small class="mono">${x.userId || '비회원'}</small></span>` },
      { h: '연락처', v: x => x.phone },
      { h: '신청일', v: x => kdt(x.createdAt) },
      { h: '상태', v: x => html`<span class=${cx('badge', TOUR_BADGE[x.status])}>${TOUR_KO[x.status]}</span>` },
      { h: '', v: x => html`<span class="row tight" style="flex-wrap:nowrap">${x.status === 'requested' && html`<button class="btn sm" onClick=${() => set(x, 'confirmed', '룸투어를 확정했습니다')}>확정</button>`}
        ${x.status === 'confirmed' && html`<button class="btn line sm" onClick=${() => set(x, 'done', '방문 완료로 바꿨습니다')}>방문 완료</button>`}
        ${(x.status === 'requested' || x.status === 'confirmed') && html`<button class="btn quiet sm" onClick=${() => set(x, 'cancelled', '룸투어를 취소했습니다')}>취소</button>`}</span>` },
    ]}/></section>
  </${Fragment}>`;
}

function PmsRates({ b }) {
  const [rows, setRows] = useState(() => b.types.map(r => ({ id: r.id, night: r.price.night ?? '', week: r.price.week ?? '', month: r.price.month ?? '' })));
  const [busy, setBusy] = useState(false);
  const changed = rows.some(r => { const o = b.types.find(x => x.id === r.id).price; return ['night', 'week', 'month'].some(u => String(o[u] ?? '') !== String(r[u])); });
  const save = async () => {
    const bad = rows.find(r => ['night', 'week', 'month'].every(u => r[u] === '' || r[u] == null));
    if (bad) return toast('객실 타입마다 요금을 하나 이상 입력하세요', 'error');
    setBusy(true);
    const types = b.types.map(t0 => { const r = rows.find(x => x.id === t0.id); const n = v => (v === '' || v == null ? null : Math.max(0, Math.round(+v))); return { ...t0, price: { night: n(r.night), week: n(r.week), month: n(r.month) } }; });
    await patch('branches', b.id, { types, updatedAt: nowIso() });
    await addLog(b.id, 'price', '요금 변경 · ' + types.map(x => `${x.name.ko} ${['night', 'week', 'month'].filter(u => x.price[u] != null).map(u => UNIT_KO_L[u] + ' ' + won(x.price[u])).join(' / ')}`).join(' · '));
    setBusy(false); toast('요금을 저장했습니다. 이용자 사이트에 바로 반영됩니다');
  };
  const st = occStats(b);
  return html`<${Fragment}>
    <${PmsHead} b=${b} title="요금" right=${html`<button class="btn" disabled=${!changed || busy} onClick=${save}>저장</button>`}/>
    <div class="callout"><b>비워 두면 그 기간 단위로는 판매하지 않습니다</b><span>예: 스테이는 1박 요금을 비워 두면 1주·1개월 단위로만 예약됩니다. 이미 결제된 예약 금액은 바뀌지 않습니다.</span></div>
    <section class="panel"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>객실 타입</th><th>면적·창</th><th class="r">객실 수</th><th class="r">1박</th><th class="r">1주</th><th class="r">1개월</th></tr></thead>
      <tbody>${rows.map((r, i) => { const t0 = b.types.find(x => x.id === r.id); return html`<tr><td class="nm">${t0.name.ko}</td><td>${t0.size}㎡ · ${WIN_KO[t0.window]}</td><td class="r">${t0.count}</td>
        ${['night', 'week', 'month'].map(u => html`<td class="r"><input class="input num" id=${`rate-${r.id}-${u}`} style="width:130px;text-align:end;padding:7px 9px" type="number" min="0" step="1000" placeholder="판매 안 함" value=${r[u]} onInput=${e => { const v = e.target.value; setRows(rs => rs.map((x, j) => (j === i ? { ...x, [u]: v } : x))); }}/></td>`)}</tr>`; })}</tbody></table></div></section>
    <p class="muted" style="font-size:13px">현재 공실 ${st.vac}실 · 점유율 ${pct(st.occ, st.total)}%</p>
  </${Fragment}>`;
}

function PmsCoupons({ b }) {
  const [mode, setMode] = useState(null); // 'new' | coupon id
  const mine = all('coupons').filter(c => (c.issuer === 'pms' && c.issuerBranch === b.id) || (c.funder === 'BRANCH' && c.scope === 'branches' && (c.branchIds || []).includes(b.id))).sort((a, c) => (a.createdAt < c.createdAt ? 1 : -1));
  const hq = all('coupons').filter(c => c.funder === 'HQ' && (c.scope === 'all' || (c.branchIds || []).includes(b.id)) && (!(c.types || []).length || c.types.includes(b.type)) && c.status !== 'ended' && today() <= c.to);
  if (mode === 'new') return html`<${Fragment}><${PmsHead} b=${b} title="쿠폰 만들기"/><section class="panel"><div class="pad"><${CouponForm} mode="pms" branchId=${b.id} onDone=${id => setMode(id)} onCancel=${() => setMode(null)}/></div></section></${Fragment}>`;
  if (mode) return html`<${Fragment}><${PmsHead} b=${b} title="쿠폰"/><${CouponDetail} id=${mode} by=${'pms:' + b.id} back=${() => setMode(null)}/></${Fragment}>`;
  const cols = [
    { h: '쿠폰', v: c => html`<span class="two"><span class="nm">${c.name.ko}</span><small>${KIND_KO[c.kind]}${c.code ? html` · <span class="mono">${c.code}</span>` : ''}</small></span>` },
    { h: '할인', v: c => cpAmtKo(c) },
    { h: '조건', v: c => condKo(c) },
    { h: '기간', v: c => html`<span class="num">${kd(c.from)} ~ ${kd(c.to)}</span>` },
    { h: '발급·사용', r: true, v: c => { const s = cpStats(c.id); return `${s.issued} · ${s.used}`; } },
    { h: '상태', v: c => { const [l, k] = cpStateKo(c); return html`<span class=${cx('badge', k)}>${l}</span>`; } },
  ];
  return html`<${Fragment}>
    <${PmsHead} b=${b} title="쿠폰" right=${html`<button class="btn" onClick=${() => setMode('new')}><${Icon} n="plus" cls="sm"/>쿠폰 만들기</button>`}/>
    <div class="callout"><b>회원 아이디로 쿠폰을 보낼 수 있습니다</b><span>쿠폰을 누르고 ‘아이디로 보내기’에 회원 아이디를 넣으면 이용자 쿠폰함에 바로 들어갑니다. 이용자는 예약할 때 보유 쿠폰에서 고르거나 쿠폰 번호를 입력해 할인받습니다.</span></div>
    <section class="panel"><header><h2>지점 부담 쿠폰</h2><p>할인 금액이 정산에서 차감됩니다</p></header><${Table} empty="아직 만든 쿠폰이 없습니다" rows=${mine} onRow=${c => setMode(c.id)} cols=${cols}/></section>
    <section class="panel"><header><h2>본사 쿠폰</h2><p>이 지점에서 쓸 수 있는 본사 부담 쿠폰 · 정산 때 본사가 보전합니다</p></header><${Table} empty="진행 중인 본사 쿠폰이 없습니다" rows=${hq} onRow=${c => setMode(c.id)} cols=${cols}/></section>
  </${Fragment}>`;
}

function PmsSettle({ b }) {
  const months = ymList(6);
  const [ym, setYm] = useState(months[1] || months[0]);
  const s = settle(b, ym);
  return html`<${Fragment}>
    <${PmsHead} b=${b} title="정산" right=${html`<select class="select" id="st-month" style="width:auto" value=${ym} onChange=${e => setYm(e.target.value)}>${months.map(m => html`<option value=${m}>${ymKo(m)}${m === months[0] ? ' (진행 중)' : ''}</option>`)}</select>`}/>
    <div class="kpis">
      <${Kpi} k="판매 금액" v=${won(s.sale)} d=${`예약·연장 ${s.rows.length}건`}/>
      <${Kpi} k="지점 부담 할인" v=${s.br ? '-' + won(s.br) : won(0)}/>
      <${Kpi} k="정산 기준 매출" v=${won(s.basis)}/>
      <${Kpi} k=${`운영 수수료 ${Math.round(b.feeRate * 100)}%`} v=${s.fee ? '-' + won(s.fee) : won(0)}/>
      <${Kpi} k="정산 예정액" v=${won(s.pay)} d=${ym === months[0] ? '월말에 확정됩니다' : '다음 달 10일 지급 (예시)'}/>
    </div>
    <div class="callout"><span>본사 부담 쿠폰 할인 <b>${won(s.hq)}</b>은 본사가 보전하므로 정산에서 빼지 않습니다. 보증금은 별도로 맡아 두었다가 퇴실 후 정산합니다. 프로토타입은 시스템으로 받은 예약만 계산하며, 기존 입실자 월세는 포함하지 않습니다.</span></div>
    <section class="panel"><header><h2>${ymKo(ym)} 내역</h2></header>
      <${Table} empty="이 달에 결제된 예약이 없습니다" rows=${s.rows} onRow=${r => openBk(r.bk.id)} cols=${[
        { h: '결제일', v: r => html`<span class="num">${kdt(r.at)}</span>` },
        { h: '예약번호', v: r => html`<span class="mono">${r.code}</span>` },
        { h: '구분', v: r => html`<span class=${cx('badge', r.kind === '연장' ? 'info' : '')}>${r.kind}</span>` },
        { h: '투숙객', v: r => r.bk.guest.name },
        { h: '판매 금액', r: true, v: r => won(r.sale) },
        { h: '지점 부담 할인', r: true, v: r => (r.br ? '-' + won(r.br) : '—') },
        { h: '본사 부담 할인', r: true, v: r => (r.hq ? won(r.hq) : '—') },
        { h: '정산 기준', r: true, v: r => won(r.sale - r.br) },
      ]}/></section>
  </${Fragment}>`;
}

function PmsAlerts({ b }) {
  const logs = (get('logs', b.id) || {}).items || [];
  return html`<${Fragment}><${PmsHead} b=${b} title="알림톡 발송 내역"/>
    <div class="callout"><span>예약·결제·연장·취소·룸투어·쿠폰 발송이 생기면 점주 휴대폰으로 알림톡이 자동 발송됩니다. 프로토타입에서는 발송 내용만 기록되고 실제 메시지는 나가지 않습니다.</span></div>
    <section class="panel"><${Feed} items=${logs}/></section></${Fragment}>`;
}

function PmsInfo({ b }) {
  return html`<${Fragment}><${PmsHead} b=${b} title="지점 정보"/>
    <div class="cols2">
      <section class="panel"><div class="pad"><dl class="kv">
        <dt>지점</dt><dd>${bTitleKo(b)}${b.no ? ` · ${b.no}호점` : ''}</dd><dt>상태</dt><dd>${STATUS_KO[b.status]} · ${kdy(b.openDate)}</dd>
        <dt>위치</dt><dd>${b.area.ko} · ${b.station.ko} 도보 ${b.walk}분</dd><dt>좌표</dt><dd class="mono">${b.lat}, ${b.lng}</dd>
        <dt>객실</dt><dd>${b.types.map(x => `${x.name.ko} ${x.count}실`).join(' · ')}</dd><dt>보증금</dt><dd>${b.deposit ? won(b.deposit) + ' (월 단위 예약)' : '없음'}</dd>
        <dt>운영 수수료</dt><dd>${Math.round(b.feeRate * 100)}%</dd><dt>편의시설</dt><dd>${b.amenities.map(a => AM_KO[a]).join(', ')}</dd></dl>
        <p class="note" style="margin-top:14px"><${Icon} n="info" cls="sm"/>지점명·사진·소개 문구는 본사 운영팀이 관리합니다. 바꿀 내용이 있으면 본사에 요청하세요.</p></div></section>
      <div class="pick-map"><${MapView} focus=${{ lat: b.lat, lng: b.lng, zoom: 7 }} items=${[{ id: b.id, lat: b.lat, lng: b.lng, status: b.status, label: b.name.ko }]}/></div>
    </div></${Fragment}>`;
}
