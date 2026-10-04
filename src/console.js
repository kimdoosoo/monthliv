/* ================= console shared (PMS + Admin), Korean UI ================= */
const TYPE_KO = { stay: '스테이', hostel: '호스텔', residence: '레지던스', hotel: '호텔스테이' };
const STATUS_KO = { open: '운영 중', soon: '오픈 예정', prep: '준비 중', closed: '운영 종료' };
const STATUS_BADGE = { open: 'good', soon: 'oak', prep: '', closed: 'bad' };
const BK_KO = { confirmed: '입실 예정', staying: '투숙 중', done: '이용 완료', cancelled: '취소' };
const PAY_KO = { card: '카드', easy: '간편결제', intl: '해외 카드', transfer: '계좌이체' };
const KIND_KO = { code: '번호 공개형', unique: '1회용 번호', direct: '아이디 발송' };
const VIA_KO = { code: '번호 등록', unique: '1회용 번호', direct: '아이디 발송', signup: '가입 축하' };
const TOUR_KO = { requested: '확인 필요', confirmed: '확정', done: '방문 완료', cancelled: '취소' };
const UNIT_KO_L = { night: '1박', week: '1주', month: '1개월' };
const WIN_KO = { outer: '외창', inner: '내창', none: '창 없음' };
const BED_KO = { single: '싱글', double: '더블', queen: '퀸', bunk: '이층 침대' };
const AM_KO = { private_bath: '개인 욕실', aircon: '개별 냉난방', wifi: '와이파이', desk: '책상', fridge: '개인 냉장고', washer: '세탁실(워시타워)', kitchen: '공용 주방', kitchenette: '간이 주방', lounge: '라운지', towels: '수건·침구 제공', luggage: '짐 보관', elevator: '엘리베이터', smartlock: '스마트 도어락', cctv: '공용부 CCTV' };
const HL_KO = { flagship: '첫 직영점', near_station: '역세권', long_stay: '장기 거주', short_stay: '1박부터', business: '직장인 추천', university: '대학가', hospital: '병원 인근', family: '보호자·가족', foreigner: '외국인 환영', new_open: '신규 오픈', quiet: '조용한 주거지', airport: '공항 가까움', nature: '산책·자연' };
const LINE_KO = { GJ: '경의중앙', SB: '수인분당', SL: '신림', SBD: '신분당', AREX: '공항철도', UI: '우이신설' };
const nightsKo = n => (!n ? '' : n % 28 === 0 ? `${n / 28}개월` : n % 7 === 0 ? `${n / 7}주` : `${n}박`);
const cpAmtKo = c => (c.dtype === 'percent' ? `${c.value}%` + (c.max ? ` (최대 ${won(c.max)})` : '') : won(c.value));
const condKo = c => [c.minNights ? `${nightsKo(c.minNights)} 이상` : '', c.minAmount ? `${won(c.minAmount)} 이상 결제` : '', (c.types || []).length ? c.types.map(x => TYPE_KO[x]).join('·') + ' 전용' : ''].filter(Boolean).join(' · ') || '조건 없음';
const scopeKo = c => (c.scope === 'branches' ? (c.branchIds || []).map(id => { const b = get('branches', id); return b ? b.name.ko : id; }).join(', ') : '전체 지점');
const bTitleKo = b => (b ? `${b.name.ko} ${TYPE_KO[b.type]}` : '—');
const cpStats = id => { const ws = all('wallet').filter(w => w.couponId === id && w.status !== 'void'); return { issued: ws.length, used: ws.filter(w => w.status === 'used').length }; };
const cpStateKo = c => (c.status === 'ended' ? ['종료', ''] : c.status === 'paused' ? ['일시중지', 'warn'] : today() > c.to ? ['기간 만료', ''] : today() < c.from ? ['시작 전', 'info'] : ['진행 중', 'good']);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
function occStats(b) {
  const list = ((get('rooms', b.id) || {}).list) || [];
  const c = { occ: 0, res: 0, vac: 0, cln: 0, mnt: 0 };
  for (const r of list) c[roomNow(b.id, r).s]++;
  return { ...c, total: list.length, rate: list.length ? c.occ / list.length : 0 };
}
function settle(b, ym) {
  const rows = [];
  for (const bk of all('bookings')) {
    if (bk.branchId !== b.id || bk.status === 'cancelled') continue;
    if (((bk.pay && bk.pay.paidAt) || '').slice(0, 7) === ym) {
      const d = bk.price.discount || 0, f = bk.coupon && bk.coupon.funder;
      rows.push({ at: bk.pay.paidAt, code: bk.code, kind: '예약', sale: bk.price.base, br: f === 'BRANCH' ? d : 0, hq: f === 'HQ' ? d : 0, bk });
    }
    for (const e of bk.ext || []) if ((e.at || '').slice(0, 7) === ym) rows.push({ at: e.at, code: bk.code, kind: '연장', sale: e.amount, br: 0, hq: 0, bk });
  }
  rows.sort((a, c) => (a.at < c.at ? -1 : 1));
  const sum = k => rows.reduce((a, r) => a + r[k], 0);
  const sale = sum('sale'), br = sum('br'), hq = sum('hq'), basis = sale - br;
  const fee = Math.round(basis * (b.feeRate || 0));
  return { rows, sale, br, hq, basis, fee, pay: basis - fee };
}
const ymList = n => { const d = new Date(); const out = []; for (let i = 0; i < n; i++) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push(x.getFullYear() + '-' + z2(x.getMonth() + 1)); } return out; };
const ymKo = ym => `${ym.slice(0, 4)}년 ${+ym.slice(5, 7)}월`;

function Kpi({ k, v, small, d, meter, icon }) {
  return html`<div class="kpi"><span class="k">${icon && html`<${Icon} n=${icon} cls="sm"/>`}${k}</span><span class="v">${v}${small && html`<small>${small}</small>`}</span>
    ${meter != null && html`<div class="meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(meter * 100)} aria-label=${k}><i style=${`width:${Math.round(meter * 100)}%`}></i></div>`}
    ${d && html`<span class="d">${d}</span>`}</div>`;
}
function RoomChip({ s }) { const [l, ic] = ROOM_ST[s]; return html`<span class=${'st st-' + s} style="display:inline-flex;gap:5px;align-items:center;font-size:12px;font-weight:600"><${Icon} n=${ic} cls="sm"/>${l}</span>`; }
function HBars({ rows, onPick }) {
  const [hov, setHov] = useState(null);
  const ref = useRef();
  return html`<div style="position:relative" ref=${ref}>
    <div class="hbars" role="list">${rows.map((r, i) => html`<button class="hbar" role="listitem" onMouseEnter=${() => setHov(i)} onMouseLeave=${() => setHov(null)} onFocus=${() => setHov(i)} onBlur=${() => setHov(null)} onClick=${() => onPick && onPick(r)}
        aria-label=${`${r.label} ${Math.round(r.value * 100)}%`}>
      <span class="lbl">${r.label}</span>
      <span class="track">${[0.25, 0.5, 0.75].map(x => html`<span class="grid" style=${`left:${x * 100}%`}></span>`)}<span class="bar" style=${`width:${Math.max(0.5, r.value * 100)}%`}></span></span>
      <span class="val">${Math.round(r.value * 100)}%</span></button>`)}</div>
    <div class="axis"><span></span><span class="ticks">${[0, 25, 50, 75, 100].map(x => html`<span style=${`left:${x}%`}>${x}%</span>`)}</span><span></span></div>
    ${hov != null && rows[hov] && html`<div class="tip" style=${`left:${Math.min(64, 22 + rows[hov].value * 60)}%;top:${16 + hov * 30 - 6}px;transform:translateY(-100%)`}>
      <b>${Math.round(rows[hov].value * 100)}%</b><span>${rows[hov].label}</span><span class="k">${rows[hov].sub}</span></div>`}
  </div>`;
}
function Table({ cols, rows, onRow, empty }) {
  if (!rows.length) return html`<div class="pad"><div class="empty"><strong>${empty || '항목이 없습니다'}</strong></div></div>`;
  return html`<div class="tbl-wrap"><table class="tbl"><thead><tr>${cols.map(c => html`<th class=${c.r ? 'r' : ''}>${c.h}</th>`)}</tr></thead>
    <tbody>${rows.map(r => html`<tr class=${onRow ? 'click' : ''} onClick=${onRow ? () => onRow(r) : null}>${cols.map(c => html`<td class=${c.r ? 'r' : ''}>${c.v(r)}</td>`)}</tr>`)}</tbody></table></div>`;
}
function Feed({ items, limit }) {
  const list = (items || []).slice(0, limit || 40);
  if (!list.length) return html`<div class="pad"><div class="empty"><strong>발송 내역이 없습니다</strong></div></div>`;
  const icon = { booking: 'ticket', checkin: 'key', checkout: 'door', cancel: 'close', ext: 'refresh', tour: 'calendar', coupon: 'send', price: 'tag' };
  const label = { booking: '예약', checkin: '입실', checkout: '퇴실', cancel: '취소', ext: '연장', tour: '룸투어', coupon: '쿠폰', price: '요금' };
  return html`<div class="feed">${list.map(x => html`<div class="msg"><span class="ico"><${Icon} n=${icon[x.kind] || 'msg'} cls="sm"/></span>
    <div class="bubble"><span class="t"><b>알림톡 · ${label[x.kind] || '안내'}</b><span class="num">${kdt(x.at)}</span></span><span>${x.text}</span></div></div>`)}</div>`;
}

function BookingDrawer({ id, onClose, admin }) {
  const bk = get('bookings', id);
  const [room, setRoomSel] = useState('');
  if (!bk) return null;
  const b = get('branches', bk.branchId); const rt = b && b.types.find(x => x.id === bk.typeId);
  const m = get('members', bk.userId);
  const free = ((get('rooms', b.id) || {}).list || []).filter(r => r.t === bk.typeId && r.no !== bk.roomNo && roomFree(b.id, r, bk.status === 'staying' ? today() : bk.checkIn, bk.checkOut, bk.id));
  const act = async (fn, msg) => { await fn(); toast(msg); };
  return html`<${Drawer} title=${bk.code} sub=${`${bTitleKo(b)} · ${BK_KO[bk.status]}`} onClose=${onClose} footer=${html`
    ${bk.status === 'confirmed' && html`<button class="btn" onClick=${() => act(() => checkIn(bk.id), '입실 처리했습니다')}><${Icon} n="key" cls="sm"/>입실 처리</button>`}
    ${bk.status === 'staying' && html`<button class="btn" onClick=${() => act(() => checkOut(bk.id), '퇴실 처리했습니다. 객실이 청소 필요로 바뀌었습니다')}><${Icon} n="door" cls="sm"/>퇴실 처리</button>`}
    ${bk.status === 'confirmed' && html`<button class="btn line" onClick=${async () => { if (await askConfirm({ title: '예약을 취소할까요?', body: `${bk.code} 예약을 취소하고 ${won(bk.price.total)}을 환불 처리합니다. 사용한 쿠폰은 이용자 쿠폰함으로 돌아갑니다.`, ok: '예약 취소', cancel: '닫기', danger: true })) act(() => cancelBooking(bk.id, admin ? 'admin' : 'pms'), '예약을 취소했습니다'); }}>예약 취소</button>`}`}>
    <dl class="kv">
      <dt>투숙객</dt><dd>${bk.guest.name} <span class="muted mono">${bk.userId}</span></dd>
      <dt>연락처</dt><dd>${bk.guest.phone || '—'} · ${bk.guest.email || '—'}</dd>
      <dt>국가·언어</dt><dd>${bk.guest.country || (m && m.country) || '—'} · ${langName(bk.lang)}</dd>
      <dt>객실</dt><dd>${rt ? rt.name.ko : bk.typeId} · ${bk.roomNo ? bk.roomNo + '호' : '미배정'}</dd>
      <dt>일정</dt><dd>${kdw(bk.checkIn)} → ${kdw(bk.checkOut)} · ${bk.qty}${UNIT_KO[bk.unit]} (${bk.nights}박)</dd>
      <dt>인원</dt><dd>${bk.guests}명</dd>
      <dt>결제</dt><dd>${won(bk.price.total)} · ${PAY_KO[bk.pay.method] || bk.pay.method} · ${kdt(bk.pay.paidAt)}</dd>
      <dt>요금 내역</dt><dd>${won(bk.price.unit)} × ${bk.qty} = ${won(bk.price.base)}${bk.price.discount ? ` − 쿠폰 ${won(bk.price.discount)}` : ''}${bk.price.deposit ? ` + 보증금 ${won(bk.price.deposit)}` : ''}</dd>
      <dt>쿠폰</dt><dd>${bk.coupon ? html`${bk.coupon.name.ko} <span class=${cx('badge', bk.coupon.funder === 'HQ' ? 'info' : 'warn')}>${bk.coupon.funder === 'HQ' ? '본사 부담' : '지점 부담'}</span>${bk.coupon.code ? html` <span class="mono muted">${bk.coupon.code}</span>` : ''}` : '—'}</dd>
      ${(bk.ext || []).length > 0 && html`<dt>연장</dt><dd>${bk.ext.map(e => `${e.months}개월 ${won(e.amount)} (${kd(e.at)})`).join(', ')}</dd>`}
      ${bk.guest.note && html`<dt>요청 사항</dt><dd>${bk.guest.note}</dd>`}
      ${bk.cancelledAt && html`<dt>취소</dt><dd>${kdt(bk.cancelledAt)}</dd>`}
    </dl>
    ${(bk.status === 'confirmed' || bk.status === 'staying') && html`<div class="field"><span>객실 변경</span>
      ${free.length ? html`<div class="row"><select class="select" id="bk-room" style="width:auto" value=${room} onChange=${e => setRoomSel(e.target.value)}><option value="">호실 선택</option>${free.map(r => html`<option value=${r.no}>${r.no}호</option>`)}</select>
        <button class="btn line sm" disabled=${!room} onClick=${async () => { await patch('bookings', bk.id, { roomNo: room }); await addLog(bk.branchId, 'booking', `객실 변경 ${bk.code} · ${bk.roomNo}호 → ${room}호`); toast(`${room}호로 바꿨습니다`); setRoomSel(''); }}>변경</button></div>`
        : html`<span class="muted" style="font-size:13px">같은 타입에서 이 기간에 비어 있는 객실이 없습니다</span>`}</div>`}
  </${Drawer}>`;
}

/* coupon form shared by Admin and PMS */
function CouponForm({ mode, branchId, onDone, onCancel }) {
  const pms = mode === 'pms';
  const [f, setF] = useState({ nameKo: '', nameEn: '', kind: pms ? 'direct' : 'code', code: '', qty: 20, dtype: 'amount', value: 30000, max: 50000, minAmount: 0, minNights: 0,
    scope: pms ? 'branches' : 'all', branchIds: pms ? [branchId] : [], types: [], from: today(), to: addMonths(today(), 2), perUser: 1, limit: '', funder: pms ? 'BRANCH' : 'HQ' });
  const [err, setErr] = useState('');
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const taken = c => all('coupons').some(x => x.code === c || (x.codes && x.codes[c]));
  const save = async () => {
    setErr('');
    if (!f.nameKo.trim()) return setErr('쿠폰 이름을 입력하세요');
    if (!(+f.value > 0)) return setErr('할인 금액(또는 %)을 입력하세요');
    if (f.dtype === 'percent' && +f.value > 90) return setErr('할인율은 90% 이하로 입력하세요');
    if (f.to < f.from) return setErr('종료일이 시작일보다 빠릅니다');
    if (f.scope === 'branches' && !f.branchIds.length) return setErr('적용 지점을 하나 이상 고르세요');
    let code = null, codes = null;
    if (f.kind === 'code') {
      code = normCode(f.code);
      if (!/^[A-Z0-9-]{4,20}$/.test(code)) return setErr('쿠폰 번호는 영문 대문자·숫자·하이픈 4~20자로 입력하세요');
      if (taken(code)) return setErr('이미 쓰고 있는 쿠폰 번호입니다');
    }
    if (f.kind === 'unique') {
      const n = Math.max(1, Math.min(500, +f.qty || 0)); codes = {};
      while (Object.keys(codes).length < n) { const c = `MLV-${rcode(4)}-${rcode(4)}`; if (!taken(c)) codes[c] = { u: null, s: 'new' }; }
    }
    const id = 'cp-' + rid(8);
    const doc = { id, name: { ko: f.nameKo.trim(), en: f.nameEn.trim() || f.nameKo.trim() }, kind: f.kind, code, codes, dtype: f.dtype, value: +f.value, max: f.dtype === 'percent' && +f.max ? +f.max : null,
      minAmount: +f.minAmount || 0, minNights: +f.minNights || 0, scope: f.scope, branchIds: f.scope === 'branches' ? f.branchIds : [], types: f.types, from: f.from, to: f.to,
      perUser: +f.perUser || 1, limit: +f.limit || null, funder: pms ? 'BRANCH' : f.funder, issuer: pms ? 'pms' : 'admin', issuerBranch: pms ? branchId : null, status: 'active', createdAt: nowIso() };
    await put('coupons', id, doc);
    toast('쿠폰을 만들었습니다'); onDone && onDone(id);
  };
  const branches = all('branches').filter(b => b.status !== 'closed').sort((a, b) => (a.name.ko < b.name.ko ? -1 : 1));
  return html`<div class="stack">
    <div class="grid2"><label class="field"><span>쿠폰 이름</span><input class="input" id="cf-name" placeholder="예: 가을 장기 투숙 5만원" value=${f.nameKo} onInput=${e => set('nameKo', e.target.value)}/></label>
      <label class="field"><span>영문 이름 <span class="hint">외국어 화면에 표시</span></span><input class="input" id="cf-name-en" placeholder="e.g. ₩50,000 off long stays" value=${f.nameEn} onInput=${e => set('nameEn', e.target.value)}/></label></div>
    <div class="field"><span>발급 방식</span><div class="pay-opts">${['code', 'unique', 'direct'].map(k => html`<label><input type="radio" name="cf-kind" checked=${f.kind === k} onChange=${() => set('kind', k)}/>${KIND_KO[k]}</label>`)}</div>
      <span class="hint">${f.kind === 'code' ? '모든 이용자가 같은 번호를 입력해 쿠폰함에 등록하거나 결제할 때 바로 적용합니다.' : f.kind === 'unique' ? '번호마다 한 사람만 쓸 수 있는 쿠폰 번호를 만듭니다. 제휴처·오프라인 배포용입니다.' : '번호 없이 회원 아이디로 쿠폰함에 바로 넣습니다. 만든 뒤 아이디로 보내세요.'}</span></div>
    ${f.kind === 'code' && html`<label class="field"><span>쿠폰 번호</span><div class="cp-code"><input class="input mono" id="cf-code" placeholder="AUTUMN50K" value=${f.code} onInput=${e => set('code', e.target.value.toUpperCase())}/><button class="btn line" type="button" onClick=${() => set('code', 'ML' + rcode(6))}>자동 생성</button></div></label>`}
    ${f.kind === 'unique' && html`<label class="field" style="max-width:220px"><span>만들 번호 수</span><input class="input" id="cf-qty" type="number" min="1" max="500" value=${f.qty} onInput=${e => set('qty', e.target.value)}/></label>`}
    <div class="grid3">
      <label class="field"><span>할인 방식</span><select class="select" id="cf-dtype" value=${f.dtype} onChange=${e => set('dtype', e.target.value)}><option value="amount">정액 (원)</option><option value="percent">정률 (%)</option></select></label>
      <label class="field"><span>${f.dtype === 'amount' ? '할인 금액(원)' : '할인율(%)'}</span><input class="input num" id="cf-value" type="number" min="1" value=${f.value} onInput=${e => set('value', e.target.value)}/></label>
      ${f.dtype === 'percent' ? html`<label class="field"><span>최대 할인(원)</span><input class="input num" id="cf-max" type="number" min="0" value=${f.max} onInput=${e => set('max', e.target.value)}/></label>` : html`<div></div>`}
    </div>
    <div class="grid3">
      <label class="field"><span>최소 이용 기간</span><select class="select" id="cf-minn" value=${f.minNights} onChange=${e => set('minNights', +e.target.value)}>${[0, 2, 7, 14, 28, 84, 168].map(n => html`<option value=${n}>${n ? nightsKo(n) + ' 이상' : '제한 없음'}</option>`)}</select></label>
      <label class="field"><span>최소 결제 금액(원)</span><input class="input num" id="cf-mina" type="number" min="0" step="10000" value=${f.minAmount} onInput=${e => set('minAmount', e.target.value)}/></label>
      <label class="field"><span>1인당 발급 한도</span><select class="select" id="cf-per" value=${f.perUser} onChange=${e => set('perUser', +e.target.value)}>${[1, 2, 3, 5].map(n => html`<option value=${n}>${n}장</option>`)}</select></label>
    </div>
    <div class="grid3">
      <label class="field"><span>시작일</span><input class="input" id="cf-from" type="date" value=${f.from} onChange=${e => set('from', e.target.value)}/></label>
      <label class="field"><span>종료일</span><input class="input" id="cf-to" type="date" value=${f.to} onChange=${e => set('to', e.target.value)}/></label>
      <label class="field"><span>총 발급 한도 <span class="hint">비우면 제한 없음</span></span><input class="input num" id="cf-limit" type="number" min="0" value=${f.limit} onInput=${e => set('limit', e.target.value)}/></label>
    </div>
    ${pms ? html`<div class="callout"><b>${bTitleKo(get('branches', branchId))} 전용 · 지점 부담</b><span>점주가 만든 쿠폰은 이 지점에서만 쓸 수 있고, 할인 금액은 정산 때 지점 매출에서 차감됩니다.</span></div>`
      : html`<div class="grid2">
        <div class="field"><span>적용 지점</span><div class="row tight"><button type="button" class="chip" aria-pressed=${f.scope === 'all'} onClick=${() => set('scope', 'all')}>전체 지점</button><button type="button" class="chip" aria-pressed=${f.scope === 'branches'} onClick=${() => set('scope', 'branches')}>지점 선택</button></div>
          ${f.scope === 'branches' && html`<div class="amen-pick" style="max-height:160px;overflow:auto;margin-top:6px">${branches.map(b => html`<label class="check"><input type="checkbox" checked=${f.branchIds.includes(b.id)} onChange=${e => set('branchIds', e.target.checked ? [...f.branchIds, b.id] : f.branchIds.filter(x => x !== b.id))}/>${bTitleKo(b)}</label>`)}</div>`}</div>
        <div class="stack" style="gap:12px"><div class="field"><span>적용 유형 <span class="hint">고르지 않으면 전체</span></span><div class="row tight">${TYPES.map(ty => html`<button type="button" class="chip" aria-pressed=${f.types.includes(ty)} onClick=${() => set('types', f.types.includes(ty) ? f.types.filter(x => x !== ty) : [...f.types, ty])}>${TYPE_KO[ty]}</button>`)}</div></div>
          <div class="field"><span>할인 부담</span><div class="row tight"><button type="button" class="chip" aria-pressed=${f.funder === 'HQ'} onClick=${() => set('funder', 'HQ')}>본사 부담</button><button type="button" class="chip" aria-pressed=${f.funder === 'BRANCH'} onClick=${() => set('funder', 'BRANCH')}>지점 부담</button></div>
            <span class="hint">본사 부담 할인은 점주 정산에서 차감하지 않습니다.</span></div></div></div>`}
    ${err && html`<span class="cp-msg err"><${Icon} n="warn" cls="sm"/>${err}</span>`}
    <div class="row"><button class="btn" onClick=${save}><${Icon} n="ticket" cls="sm"/>쿠폰 만들기</button>${onCancel && html`<button class="btn line" onClick=${onCancel}>취소</button>`}</div>
  </div>`;
}

function KoTicket({ c }) {
  return html`<div class="ticket" style="max-width:520px"><div class="amt"><b>${c.dtype === 'percent' ? c.value + '%' : (c.value % 10000 === 0 ? c.value / 10000 + '만원' : won(c.value))}</b><small>할인</small></div>
    <div class="det"><h4>${c.name.ko}</h4><div class="cond">${condKo(c)} · ${scopeKo(c)}</div><div class="cond">${kdy(c.from)} ~ ${kdy(c.to)}${c.code ? html` · <span class="mono">${c.code}</span>` : ''}</div></div>
    <div class="tk-side"><span class=${cx('badge', c.funder === 'HQ' ? 'info' : 'warn')}>${c.funder === 'HQ' ? '본사 부담' : '지점 부담'}</span></div></div>`;
}

function SendBox({ coupon, by, preset }) {
  const [ids, setIds] = useState(preset || '');
  const [qq, setQq] = useState('');
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const list = ids.split(/[\s,;]+/).filter(Boolean);
  const hits = qq.trim() ? all('members').filter(m => (m.id + ' ' + m.name).toLowerCase().includes(qq.trim().toLowerCase())).slice(0, 6) : [];
  const fit = couponFit(coupon);
  const send = async () => { setBusy(true); const r = await sendCoupon(coupon.id, list, by); setBusy(false); setRes(r); if (r.sent.length) { toast(`${r.sent.length}명에게 쿠폰을 보냈습니다`); setIds(''); } };
  return html`<div class="stack" style="gap:10px">
    ${!fit.ok && html`<div class="callout"><b>지금은 보낼 수 없는 쿠폰입니다</b><span>${coupon.status !== 'active' ? '진행 중인 쿠폰만 보낼 수 있습니다.' : '사용 기간이 아닙니다.'}</span></div>`}
    <label class="field"><span>받는 회원 아이디 <span class="hint">쉼표나 줄바꿈으로 여러 명</span></span><textarea class="textarea mono" id=${'send-ids-' + coupon.id} placeholder="minji92, leo.martin" value=${ids} onInput=${e => setIds(e.target.value)}></textarea></label>
    <div class="field"><span>회원 찾기</span><input class="input" id=${'send-q-' + coupon.id} placeholder="아이디 또는 이름" value=${qq} onInput=${e => setQq(e.target.value)}/>
      ${hits.length > 0 && html`<div class="row tight">${hits.map(m => html`<button class="chip" onClick=${() => { if (!list.includes(m.id)) setIds((ids.trim() ? ids.trim() + ', ' : '') + m.id); }}><span class="mono">${m.id}</span> ${m.name}</button>`)}</div>`}</div>
    <div class="row"><button class="btn" disabled=${!list.length || busy || !fit.ok} onClick=${send}><${Icon} n="send" cls="sm"/>${list.length ? `${list.length}명에게 보내기` : '보내기'}</button></div>
    ${res && html`<div class="callout">${res.sent.length > 0 && html`<span>보냄: <span class="mono">${res.sent.join(', ')}</span></span>`}${res.skipped.length > 0 && html`<span>이미 한도만큼 받은 회원: <span class="mono">${res.skipped.join(', ')}</span></span>`}${res.missing.length > 0 && html`<span style="color:var(--bad)">없는 아이디: <span class="mono">${res.missing.join(', ')}</span></span>`}</div>`}
  </div>`;
}

function CouponDetail({ id, by, back }) {
  const c = get('coupons', id);
  const [more, setMore] = useState(20);
  if (!c) return html`<div class="empty"><strong>쿠폰을 찾을 수 없습니다</strong></div>`;
  const st = cpStats(c.id);
  const [stLabel, stCls] = cpStateKo(c);
  const issued = all('wallet').filter(w => w.couponId === c.id).sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1));
  const codes = c.codes ? Object.entries(c.codes) : [];
  const unused = codes.filter(([, v]) => !v.u).map(([k]) => k);
  const canManage = by === 'admin' || c.issuerBranch === by.slice(4);
  const addCodes = async () => {
    const add = {}; const n = Math.max(1, Math.min(500, +more || 0));
    while (Object.keys(add).length < n) { const k = `MLV-${rcode(4)}-${rcode(4)}`; if (!c.codes[k]) add[k] = { u: null, s: 'new' }; }
    await patch('coupons', c.id, { codes: add }); toast(`쿠폰 번호 ${n}개를 더 만들었습니다`);
  };
  return html`<div class="stack" style="gap:18px">
    ${back && html`<div><button class="btn quiet sm" onClick=${back}><${Icon} n="arrowL" cls="sm"/>쿠폰 목록</button></div>`}
    <div class="row between" style="align-items:flex-start"><${KoTicket} c=${c}/>
      ${canManage && html`<div class="row tight">${c.status === 'active' && html`<button class="btn line sm" onClick=${() => patch('coupons', c.id, { status: 'paused' })}>일시중지</button>`}
        ${c.status === 'paused' && html`<button class="btn line sm" onClick=${() => patch('coupons', c.id, { status: 'active' })}>다시 진행</button>`}
        ${c.status !== 'ended' && html`<button class="btn quiet sm" onClick=${async () => { if (await askConfirm({ title: '쿠폰을 종료할까요?', body: '종료하면 이용자 쿠폰함에 있는 쿠폰도 더 이상 쓸 수 없습니다.', ok: '종료', danger: true })) patch('coupons', c.id, { status: 'ended' }); }}>종료</button>`}</div>`}</div>
    <div class="kpis"><${Kpi} k="상태" v=${html`<span class=${cx('badge', stCls)} style="font-size:14px">${stLabel}</span>`}/><${Kpi} k="발급" v=${st.issued} small="장"/><${Kpi} k="사용" v=${st.used} small="장" d=${`사용률 ${pct(st.used, st.issued)}%`}/>
      <${Kpi} k="할인 합계" v=${won(all('bookings').filter(b => b.coupon && b.coupon.couponId === c.id && b.status !== 'cancelled').reduce((a, b) => a + b.coupon.discount, 0))}/></div>
    <div class="cols2 even">
      <section class="panel"><header><h2>아이디로 보내기</h2><p>회원 아이디를 넣으면 쿠폰함에 바로 들어갑니다</p></header><div class="pad">${canManage ? html`<${SendBox} coupon=${c} by=${by}/>` : html`<p class="muted">본사가 발행한 쿠폰은 본사에서 발송합니다.</p>`}</div></section>
      <section class="panel"><header><h2>쿠폰 정보</h2></header><div class="pad"><dl class="kv">
        <dt>발급 방식</dt><dd>${KIND_KO[c.kind]}</dd>${c.code && html`<dt>쿠폰 번호</dt><dd><span class="mono">${c.code}</span> <button class="btn quiet sm" onClick=${() => copyText(c.code)}><${Icon} n="copy" cls="sm"/></button></dd>`}
        <dt>할인</dt><dd>${cpAmtKo(c)}</dd><dt>조건</dt><dd>${condKo(c)}</dd><dt>적용</dt><dd>${scopeKo(c)}</dd><dt>기간</dt><dd>${kdy(c.from)} ~ ${kdy(c.to)}</dd>
        <dt>한도</dt><dd>1인 ${c.perUser}장 · 총 ${c.limit ? c.limit + '장' : '제한 없음'}</dd><dt>발행</dt><dd>${c.issuer === 'pms' ? bTitleKo(get('branches', c.issuerBranch)) + ' (PMS)' : '본사 (Admin)'} · ${kdt(c.createdAt)}</dd></dl></div></section>
    </div>
    ${c.kind === 'unique' && html`<section class="panel"><header><div><h2>1회용 쿠폰 번호</h2><p>${codes.length}개 중 ${codes.length - unused.length}개 등록·사용</p></div>
      <div class="row tight"><button class="btn line sm" onClick=${() => copyText(unused.join('\n'), `미사용 번호 ${unused.length}개를 복사했습니다`)}><${Icon} n="copy" cls="sm"/>미사용 번호 복사</button>
      ${canManage && html`<input class="input" style="width:80px;padding-block:6px" type="number" min="1" max="500" id="more-codes" value=${more} onInput=${e => setMore(e.target.value)}/><button class="btn sm" onClick=${addCodes}>더 만들기</button>`}</div></header>
      <div class="pad"><div class="codes">${codes.map(([k, v]) => html`<div class=${v.s === 'used' ? 'used' : ''}><span>${k}</span><small>${v.u ? (v.s === 'used' ? '사용 ' : '등록 ') + v.u : '미사용'}</small></div>`)}</div></div></section>`}
    <section class="panel"><header><h2>발급 내역</h2><p>${issued.length}건</p></header>
      <${Table} empty="아직 발급된 쿠폰이 없습니다" rows=${issued} cols=${[
        { h: '아이디', v: w => html`<span class="mono">${w.userId}</span>` },
        { h: '이름', v: w => (get('members', w.userId) || {}).name || '—' },
        { h: '경로', v: w => VIA_KO[w.via] || w.via },
        { h: '발급', v: w => kdt(w.issuedAt) },
        { h: '보낸 곳', v: w => (w.by === 'admin' ? '본사' : w.by && w.by.startsWith('pms:') ? '점주' : '이용자') },
        { h: '상태', v: w => { const s = walletState(w); return html`<span class=${cx('badge', s === 'active' ? 'good' : s === 'used' ? 'ink' : '')}>${{ active: '사용 가능', used: '사용 완료', expired: '기간 만료', ended: '종료', paused: '일시중지', notyet: '시작 전', void: '회수' }[s]}</span>`; } },
        { h: '사용 예약', v: w => (w.bookingId && get('bookings', w.bookingId) ? html`<span class="mono">${get('bookings', w.bookingId).code}</span>` : '—') },
      ]}/></section>
  </div>`;
}
