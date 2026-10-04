# monthliv

서울 역세권 스테이·호스텔·레지던스 브랜드 **monthliv**의 홍보·안내·검색·예약 사이트입니다.
한 사이트 안에 세 화면이 있고, 같은 데이터를 함께 씁니다.

| 화면 | 주소 | 쓰는 사람 |
|---|---|---|
| 이용자 사이트 | https://kimdoosoo.github.io/monthliv/ | 고객 — 지도로 지점 찾기, 예약, 쿠폰, 6개 언어 + 자동 번역 |
| 점주 PMS | https://kimdoosoo.github.io/monthliv/#pms | 지점 점주 — 객실·예약·룸투어·요금·쿠폰 발송·정산 |
| 운영 Admin | https://kimdoosoo.github.io/monthliv/#admin | 본사 — 지점 추가·수정, 쿠폰 발행, 회원·점주 관리 |

빌드 과정이 없습니다. 저장소 파일이 그대로 사이트가 됩니다.

---

## 1. 사이트 공개하기 (처음 한 번)

1. 이 저장소에서 **Settings → Pages**
2. **Build and deployment → Source: Deploy from a branch**, Branch: **main**, 폴더: **/ (root)** → **Save**
3. 1~2분 뒤 https://kimdoosoo.github.io/monthliv/ 가 열립니다.

이후에는 `main`에 커밋할 때마다 1~2분 안에 자동으로 반영됩니다.

> 키를 하나도 넣지 않아도 사이트는 동작합니다. 이때 지도는 서울 구 경계를 그린 기본 지도(＋“Google 지도에서 보기·길찾기” 링크), 언어는 기본 6개, 데이터는 **방문자 각자의 브라우저에만** 저장되는 데모 데이터입니다.

## 2. 설정은 `config.js` 한 곳에서

| 항목 | 넣으면 | 비워 두면 |
|---|---|---|
| `googleMapsApiKey` | 실제 Google 지도 (지점 지도·검색 지도·Admin 좌표 지정) | 서울 구 경계 기본 지도 |
| `googleMapId` | Google 콘솔에서 만든 지도 스타일 사용 | monthliv 색(크림·샌드)으로 칠한 지도 |
| `translateApiKey` | 6개 외 약 40개 언어 자동 번역 | 한국어·English·日本語·简体中文·繁體中文·Tiếng Việt |
| `firebase` | 점주·본사·이용자가 같은 데이터를 실시간으로 공유 | 브라우저마다 따로 저장(데모) |
| `autoLang` | `true`: 처음 온 방문자에게 브라우저 언어로 표시 | `defaultLang`으로 시작 |
| `showPrototypeBar` | `true`: 맨 위 화면 전환 막대 표시 | `false`: 막대를 숨기고 `#pms`, `#admin` 주소로 진입 |

`config.js`에 넣은 키는 웹페이지에서 누구나 볼 수 있습니다(웹 지도 키는 원래 그렇습니다). 그래서 아래처럼 **키마다 웹사이트 제한과 API 제한을 꼭** 거세요.

깃허브 웹에서 `config.js`를 바로 고쳐도 됩니다(파일 열기 → 연필 아이콘 → Commit changes). 브라우저가 옛 파일을 기억하고 있으면 반영까지 최대 10분쯤 걸리니, 바로 확인하려면 강력 새로고침(Ctrl+Shift+R, Mac은 Cmd+Shift+R)을 하세요.

## 3. Google 지도 켜기

1. [Google Cloud 콘솔](https://console.cloud.google.com/)에서 프로젝트를 만들고 **결제 계정**을 연결합니다. (Google Maps Platform은 결제 계정이 있어야 켜집니다. 무료 사용량 안에서는 청구되지 않습니다.)
2. **API 및 서비스 → 라이브러리**에서 **Maps JavaScript API**를 사용 설정합니다. Admin에서 주소로 좌표를 찾으려면 **Geocoding API**도 켭니다.
3. **API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → API 키**
4. 만든 키를 눌러 제한을 겁니다.
   - 애플리케이션 제한사항: **웹사이트** → `https://kimdoosoo.github.io/monthliv/*`
     (내 컴퓨터에서 시험하려면 `http://localhost:8000/*`도 추가)
   - API 제한사항: **키 제한** → Maps JavaScript API, Geocoding API
5. `config.js`의 `googleMapsApiKey: ''` 따옴표 안에 키를 붙여 넣고 커밋합니다.
6. (권장) 예상 밖 요금을 막으려면 Maps JavaScript API의 **할당량**에서 하루 지도 로드 수 상한(예: 300)을 겁니다.

- 요금: 동적 지도(Maps JavaScript API)와 Geocoding은 각각 **월 10,000회까지 무료**, 넘으면 1,000회당 약 $7, $5입니다. 지도가 있는 화면(홈·검색·지점 상세 등)을 열 때마다 1회로 셉니다. 최신 요금은 [요금표](https://developers.google.com/maps/billing-and-pricing/pricing)에서 확인하세요.
- 키가 틀리거나 막히면 사이트는 자동으로 기본 지도로 바뀌고, **Admin → 설정 → 연동 상태**에 이유가 표시됩니다.
- 지도 위 글자(도로·역 이름)는 처음 지도를 불러올 때의 언어로 나옵니다. 언어를 바꾼 뒤 새로고침하면 그 언어로 바뀝니다.
- “길찾기”는 Google 지도 대중교통 경로로 열립니다.

## 4. 자동 번역 켜기 (선택)

1. 같은 Google Cloud 프로젝트에서 **Cloud Translation API**를 사용 설정합니다.
2. API 키를 새로 만들고 웹사이트 제한(위와 같은 주소) + API 제한(**Cloud Translation API**만)을 겁니다.
3. `config.js`의 `translateApiKey`에 넣습니다.
4. (권장) 할당량에서 하루 번역 글자 수 상한을 겁니다.

- 기본 6개 언어는 저장소에 들어 있는 번역 파일을 씁니다. 그 밖의 언어(Français, ไทย, العربية 등)를 고르면 화면 문구와 지점 소개를 번역해 저장합니다. 아랍어·히브리어 등은 오른쪽→왼쪽으로 배치됩니다.
- 한 언어를 처음 번역할 때 약 1만 2천 자가 듭니다. **월 50만 자까지 무료**, 이후 100만 자당 $20입니다([요금표](https://cloud.google.com/translate/pricing)).
- Firebase를 연결하면 한 번 만든 번역을 모든 방문자가 같이 씁니다. 연결하지 않으면 번역이 그 브라우저에만 저장돼 방문자마다 다시 번역하므로, **자동 번역은 Firebase와 함께 쓰는 것을 권장**합니다.

## 5. 공유 데이터 연결 (Firebase)

Firebase를 연결하지 않으면 예약·쿠폰·지점 수정이 방문자 각자의 브라우저에만 남습니다. 점주 PMS와 본사 Admin, 이용자가 같은 데이터를 보려면 연결하세요.

1. [Firebase 콘솔](https://console.firebase.google.com/) → **프로젝트 추가** (Google 애널리틱스는 꺼도 됩니다)
2. **빌드 → Firestore Database → 데이터베이스 만들기** → 위치 **asia-northeast3 (서울)** → **프로덕션 모드**
3. **규칙** 탭에 저장소의 `firestore.rules` 내용을 붙여 넣고 **게시**
4. **프로젝트 설정(톱니바퀴) → 일반 → 내 앱 → 웹 앱 추가(`</>`)** → 앱 등록 후 나오는 `firebaseConfig` 값을 `config.js`의 `firebase`에 붙여 넣기
5. 사이트를 열고 **운영 Admin → “데모 데이터 불러오기”**를 누르면 지점·예약·쿠폰 예시가 들어갑니다.

- 무료 한도: 하루 읽기 5만 건, 쓰기 2만 건. 사이트를 한 번 열 때 문서 수(지금 약 120개)만큼 읽으므로 **하루 약 400번 열기**까지 무료입니다. 넘으면 Blaze(종량제) 요금제로 바꿉니다.
- ⚠ `firestore.rules`는 **데모용**입니다. 로그인 없이 누구나 읽고 쓸 수 있고(2027-03-31까지), 그 뒤에는 쓰기가 막혀 사이트가 읽기 전용으로 바뀝니다. **실제 고객 정보와 예약을 받기 전에는 반드시 로그인과 규칙을 바꿔야 합니다**(아래 7번).

## 6. 체험용 계정과 쿠폰 번호

- **이용자 로그인**(아이디만 누르면 들어가는 데모): `minji92`, `jihun.park`, `leo.martin`(영어), `yuki_t`(일본어), `an.nguyen`(베트남어), `wei.chen`(중국어), `sophie.b`(영어)
- **점주 PMS**: 계정 선택 화면에서 고릅니다. 예) 본사 직영팀(성수), 건대 호스텔 점주, 화곡 점주(2개 지점)
- **쿠폰 번호**
  - `WELCOME10` 첫 예약 10% (30만 원 이상, 최대 10만 원)
  - `AUTUMN50K` 스테이 28박 이상 5만 원
  - `CARE20` 삼성서울병원 레지던스 7박 이상 2만 원
  - 1회용 번호 `MLV-7AEA-86P9`, `MLV-V46F-F9DY` 대학 제휴 3만 원 (20만 원 이상)
- **아이디로 쿠폰 보내기**: 점주 PMS → 쿠폰 → 쿠폰 선택 → 아이디 입력, 또는 Admin → 회원 → “쿠폰 보내기”
- 맨 위 **체험 가이드** 버튼에 따라 하기 쉬운 시나리오가 있습니다.
- 지점 목록·지역·오픈 시기는 회사 지점 목록 기준이고, 요금·객실 수·회원·예약은 예시입니다. 예시 예약·쿠폰 기간은 오늘 날짜에 맞춰 자동으로 옮겨집니다.

## 7. 실서비스 전에 꼭 할 일

1. **로그인**: 지금은 아이디만 누르면 들어가는 데모입니다. 휴대폰 본인인증·이메일 가입, 해외 고객용 Google·Apple 로그인, 점주·본사 권한 분리가 필요합니다(Firebase Authentication 등).
2. **서버 검증**: 쿠폰 적용, 금액 계산, 객실 배정을 지금은 브라우저에서 처리합니다. 결제 전에 서버(예: Firebase Cloud Functions)에서 다시 계산하고 검증해야 합니다.
3. **결제(PG)**: 토스페이먼츠·포트원 등 PG 계약, 취소·부분환불, 보증금 환급.
4. **알림톡**: 예약·결제·룸투어·쿠폰 알림(카카오 비즈메시지 발신 프로필, 외국인은 이메일·SMS).
5. **보안 규칙**: 로그인 기반 Firestore 규칙(이용자는 자기 예약만, 점주는 자기 지점만, 본사는 전체).
6. **약관·개인정보**: 개인정보 처리방침, 이용약관, 위치기반서비스·마케팅 수신 동의, 국외 이용자 고지.
7. **사진**: 지금 객실 이미지는 일러스트입니다. 지점별 실제 사진으로 바꿉니다.
8. **번역 검수**: 기본 6개 언어 파일을 원어민이 한 번 검토합니다.
9. **도메인**(선택): 자체 도메인을 쓰면 Settings → Pages → Custom domain에 등록하고, 지도·번역 키의 웹사이트 제한과 `index.html`의 `og:image` 주소도 새 주소로 바꿉니다.

## 8. 파일 구조

```
index.html        페이지 뼈대 (스크립트 순서)
config.js         키·옵션  ← 보통 이 파일만 고칩니다
assets/           styles.css, 파비콘, 링크 공유 이미지(og.png)
  brand/            공식 로고 파일 (워드마크·타이포형 SVG, 혼합형·엠블럼 PNG)
src/              앱 코드 (빌드 없이 그대로 실행)
  core.js           저장소 연결, 번역, 쿠폰·예약·정산 규칙, 공통 UI
  map.js            지도 (Google 지도 / 기본 서울 지도)
  user.js           이용자 사이트
  console.js        PMS·Admin 공통 부품
  pms.js            점주 PMS
  admin.js          운영 Admin
  main.js           화면 전환
  i18n_ko_en.js     한국어·영어 문구
  i18n_more.js      일본어·중국어(간체/번체)·베트남어 문구
data/             demo.js (데모 데이터), seoul-geo.js (서울 구 경계)
vendor/           Preact 10.27.2, htm 3.1.1
tools/            데이터 생성·번역 키 점검·캐시 갱신·한 파일 빌드
firestore.rules   Firebase 데모 규칙
```

### 데이터 (Firestore 컬렉션)

| 컬렉션 | 내용 |
|---|---|
| `branches` | 지점: 이름·위치·역·노선·객실 타입별 요금(1박/1주/1개월)·편의시설·소개(6개 언어)·수수료율 |
| `rooms` | 지점별 호실과 상태(입실·공실·청소·점검) |
| `bookings` | 예약: 기간·호실·금액·쿠폰·투숙객 |
| `members` | 회원 |
| `owners` | 점주 계정과 담당 지점 |
| `coupons` | 쿠폰: 번호 공개형 / 1회용 번호 / 아이디 발송, 정액·정률, 조건(최소 박수·금액·지점·유형·기간), 부담 주체(본사/지점) |
| `wallet` | 회원별 보유 쿠폰(쿠폰함) |
| `tours` | 룸투어 신청 |
| `logs` | 지점별 알림 기록 |
| `i18n` | 자동 번역 결과(언어별) |

정산: 지점 부담 할인은 매출에서 빼고 수수료를 계산하고, 본사 부담 할인은 본사가 지점에 보전합니다.

## 9. 고칠 때

- **문구**: `src/i18n_ko_en.js`, `src/i18n_more.js` — 빠진 번역 확인 `node tools/check_i18n.js`
- **지점·요금**: Firebase 연결 후에는 Admin 화면에서 고칩니다. 데모 데이터 자체를 바꾸려면 `tools/make_data.py`를 고치고 `python3 tools/make_data.py`
- **내 컴퓨터에서 보기**: 저장소 폴더에서 `python3 -m http.server 8000` → http://localhost:8000
- **고친 뒤 커밋 전**: `python3 tools/stamp.py` — 방문자 브라우저가 옛 파일을 기억하지 않도록 파일 주소에 버전을 붙입니다.
- **한 파일 버전**(Claude 화면·오프라인 시연용): `python3 tools/bundle.py` → `dist/monthliv.html`

## 출처

- 서울 구 경계: 통계청(KOSTAT) 2013 경계, [southkorea/seoul-maps](https://github.com/southkorea/seoul-maps)
- [Preact](https://preactjs.com/) (MIT), [htm](https://github.com/developit/htm) (Apache-2.0)
- 글꼴(모두 무료, SIL Open Font License): Noto Serif KR·Libre Caslon Text·Jost(Google Fonts), [Pretendard](https://github.com/orioncactus/pretendard)
- 로고·컬러: MONTHLIV 디자인 시스템 ver.02 (메인 먼슬리브 브라운 #4B362C, 서브 레드 #881C21·코랄핑크 #B99A9D·베이지 #F3E5DB). 로고는 `assets/brand`의 원본 파일만 씁니다.

운영: 주식회사 고수플러스
