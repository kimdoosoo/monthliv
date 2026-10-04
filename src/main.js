/* ================= root ================= */
/* config.js showPrototypeBar:false hides the top switcher; PMS and Admin stay reachable at #pms and #admin */
const SHOW_BAR = CFG.showPrototypeBar !== false;
if (!SHOW_BAR) document.documentElement.style.setProperty('--protobar', '0px');
window.addEventListener('hashchange', () => {
  const h = (location.hash || '').slice(1);
  if ((h === 'user' || h === 'pms' || h === 'admin') && h !== S.role) { S.role = h; S.modal = null; emit(); try { window.scrollTo({ top: 0 }); } catch {} }
});
function setRole(r) { S.role = r; S.modal = null; emit(); try { history.replaceState(null, '', '#' + r); } catch {} try { window.scrollTo({ top: 0 }); } catch {} }
function ProtoBar() {
  const mode = { cloud: ['공유 데이터 · 실시간', ''], sandbox: ['쓰기 권한 없음 · 이 화면에서만 저장', 'sandbox'], local: ['데모 데이터 · 이 브라우저에만 저장', 'local'], boot: ['불러오는 중', 'local'] }[S.mode];
  return html`<div class="proto" role="banner">
    <span class="tag">monthliv · 서비스 프로토타입</span>
    <div class="seg" role="group" aria-label="화면 전환">
      ${[['user', '이용자 사이트'], ['pms', '점주 PMS'], ['admin', '운영 Admin']].map(([k, l]) => html`<button aria-pressed=${S.role === k} onClick=${() => setRole(k)}>${l}</button>`)}
    </div>
    <span class="grow"></span>
    <span class=${cx('pill', mode[1])} title=${mode[0]}><i></i><span>${mode[0]}</span></span>
    <button class="ghost" onClick=${() => openModal('guide')} aria-label="체험 가이드"><${Icon} n="play" cls="sm"/><span>체험 가이드</span></button>
  </div>`;
}
function GuideModal() {
  const jump = fn => { closeModal(); fn(); emit(); try { window.scrollTo({ top: 0 }); } catch {} };
  return html`<${Modal} title="체험 가이드" onClose=${closeModal} wide>
    <p class="sub">세 화면은 같은 데이터를 씁니다. 한쪽에서 바꾼 내용이 다른 화면에 바로 나타납니다.</p>
    <div class="guide-steps">
      <div><h4><${Icon} n="ticket"/>쿠폰 번호로 할인받기</h4><ol><li>이용자 사이트에서 <code>minji92</code>로 로그인</li><li>성수 스테이 → 1개월 예약하기</li><li>쿠폰 번호 칸에 <code>AUTUMN50K</code> 입력 → 적용 (보유 쿠폰에서 ‘재계약 감사 10만원’은 3개월 이상일 때만 선택 가능)</li></ol>
        <div><button class="btn sm" onClick=${() => jump(() => { S.role = 'user'; S.me = 'minji92'; store.set('me', 'minji92'); S.u.route = { name: 'branch', id: 'seongsu' }; S.u.q = { ...S.u.q, unit: 'month', qty: 1 }; })}>minji92로 성수 스테이 열기</button></div></div>
      <div><h4><${Icon} n="send"/>점주가 아이디로 쿠폰 보내기</h4><ol><li>점주 PMS → ‘건대 호스텔 점주’ 계정 → 쿠폰</li><li>‘건대 호스텔 오픈 기념 15%’ → 아이디로 보내기에 <code>sophie.b</code> 입력 → 보내기</li><li>이용자 사이트에서 <code>sophie.b</code>로 로그인 → 쿠폰함 또는 건대 호스텔 예약 시 보유 쿠폰에서 선택</li></ol>
        <div><button class="btn sm" onClick=${() => jump(() => { S.role = 'pms'; S.owner = 'o-geondae'; store.set('owner', 'o-geondae'); S.p = { tab: 'coupons', branch: 'geondae' }; })}>건대 호스텔 PMS 쿠폰 열기</button></div></div>
      <div><h4><${Icon} n="sliders"/>본사가 쿠폰 번호 발행</h4><ol><li>운영 Admin → 쿠폰 → 쿠폰 만들기</li><li>‘번호 공개형’으로 번호를 정하거나 ‘1회용 번호’로 여러 개를 만들고, 회원 화면에서 그 번호를 입력</li><li>회원 메뉴에서 아이디 옆 ‘쿠폰 보내기’로 바로 보낼 수도 있습니다</li></ol>
        <div><button class="btn sm" onClick=${() => jump(() => { S.role = 'admin'; S.a = { ...S.a, tab: 'coupons', coupon: null, edit: null }; })}>Admin 쿠폰 열기</button></div></div>
      <div><h4><${Icon} n="grid"/>예약이 PMS에 반영되는지 보기</h4><ol><li>이용자 사이트에서 예약을 마친 뒤</li><li>점주 PMS → 해당 지점 → 대시보드·예약·객실 현황·알림톡에서 새 예약 확인, 입실 처리</li></ol></div>
      <div><h4><${Icon} n="globe"/>다국어</h4><ol><li>이용자 사이트 오른쪽 위 언어 버튼 → 日本語·English 등 기본 6개 언어는 바로 전환</li><li>Français·ไทย·العربية 같은 다른 언어는 AI가 화면 문구와 지점 소개를 번역해 저장 (아랍어는 오른쪽→왼쪽 배치)</li></ol>
        <div><button class="btn sm" onClick=${() => jump(() => { S.role = 'user'; S.modal = { kind: 'lang', props: {} }; })}>언어 선택 열기</button></div></div>
    </div>
    <p class="note"><${Icon} n="info" cls="sm"/>지점명·오픈 시기는 회사 지점 목록 기준이고, 요금·객실 수·회원·예약은 예시 데이터입니다. Admin에서 실제 값으로 바꿀 수 있습니다.</p>
  </${Modal}>`;
}
function App() {
  useVer();
  if (S.mode === 'boot') return html`${SHOW_BAR && html`<${ProtoBar}/>`}<div class="boot"><div class="stack" style="justify-items:center;gap:12px"><${Wordmark} size=${34}/><span class="row tight"><span class="spinner"></span>데이터를 불러오는 중</span></div></div>`;
  const view = S.role === 'pms' ? html`<${PmsApp}/>` : S.role === 'admin' ? html`<${AdminApp}/>` : html`<${UserApp}/>`;
  return html`<${Fragment}>
    ${SHOW_BAR && html`<${ProtoBar}/>`}
    ${view}
    ${S.modal && S.modal.kind === 'guide' && html`<${GuideModal}/>`}
    ${S.modal && S.role !== 'user' && S.modal.kind !== 'guide' && null}
    <${ConfirmHost}/>
    <${Toasts}/>
  </${Fragment}>`;
}
render(html`<${App}/>`, document.getElementById('app'));
boot().catch(e => { console.warn('boot failed', e); startLocal(); });
