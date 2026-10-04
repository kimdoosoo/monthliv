/* ==================================================================
   monthliv 사이트 설정 — 키와 옵션은 이 파일에서만 바꾸면 됩니다.
   ------------------------------------------------------------------
   여기 넣는 키는 웹페이지에 그대로 보입니다(웹 지도 키는 원래 그렇습니다).
   그래서 Google Cloud 콘솔에서 키마다 꼭 두 가지 제한을 거세요.
     1) 웹사이트 제한: https://kimdoosoo.github.io/*  (쓰는 주소만)
     2) API 제한: 그 키로 쓸 API만 선택
   방법은 README.md의 "Google 지도 켜기"를 보세요.
   ================================================================== */
window.MONTHLIV_CONFIG = {
  // Google 지도 — Maps JavaScript API 키.
  // 비워 두면 서울 구 경계를 그린 기본 지도를 씁니다. (같은 키에 Geocoding API를 허용하면
  // Admin 지점 편집에서 주소로 좌표 찾기가 켜집니다)
  googleMapsApiKey: '',

  // (선택) Google Cloud 콘솔에서 만든 지도 ID. 지도 색을 콘솔에서 직접 관리할 때만 넣으세요.
  // 비워 두면 monthliv 색(크림·샌드)으로 칠한 지도가 나옵니다.
  googleMapId: '',

  // (선택) 자동 번역 — Cloud Translation API 키.
  // 비워 두면 한국어·English·日本語·简体中文·繁體中文·Tiếng Việt 6개 언어만 고를 수 있고,
  // 넣으면 Français·ไทย·العربية 등 다른 언어도 고를 때 자동 번역됩니다.
  translateApiKey: '',

  // (선택) 공유 데이터 — Firebase(Cloud Firestore).
  // 비워 두면 예약·쿠폰·지점 수정이 각 방문자의 브라우저에만 저장됩니다(데모용).
  // 점주 PMS·본사 Admin·이용자가 같은 데이터를 보려면 Firebase 콘솔 → 프로젝트 설정 →
  // 내 앱(웹)의 firebaseConfig 값을 아래처럼 붙여 넣으세요. README.md "공유 데이터 연결" 참고.
  firebase: null,
  // firebase: {
  //   apiKey: 'AIza...',
  //   authDomain: 'monthliv-xxxx.firebaseapp.com',
  //   projectId: 'monthliv-xxxx',
  //   storageBucket: 'monthliv-xxxx.appspot.com',
  //   messagingSenderId: '000000000000',
  //   appId: '1:000000000000:web:xxxxxxxx',
  // },

  // 처음 온 방문자의 언어: true면 브라우저 언어를 따릅니다(6개 언어 중 하나면 그 언어, 아니면 English).
  autoLang: true,
  // autoLang이 false일 때 시작 언어 (ko, en, ja, zh-CN, zh-TW, vi)
  defaultLang: 'ko',

  // 맨 위 "이용자 사이트 · 점주 PMS · 운영 Admin" 전환 막대.
  // false로 바꾸면 숨겨지고, 점주·본사는 주소 끝에 #pms, #admin을 붙여 들어갑니다.
  showPrototypeBar: true,
};
