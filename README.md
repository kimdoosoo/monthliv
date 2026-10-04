# MONTHLIV 먼슬리브

한 달을 살아도, 하루를 묵어도 내 방처럼. 먼슬리브 지점을 찾고 하룻밤부터 한 계절까지 예약하는 사이트입니다.
주식회사 고수플러스가 운영합니다.

리버와일(Livawhile)과 같은 코드, 같은 제공 방식으로 만들고 먼슬리브 지점만 올렸습니다.
웹(데스크톱·모바일)과 iOS·Android 앱이 이 저장소 하나를 같이 씁니다.

## 지금 들어 있는 것

- **게스트 화면**: 홈, 검색 결과와 지도, 객실 상세와 사진, 같은 지점의 다른 방, 결제(쿠폰 포함), 예약 완료, 예약 내역, 지금 사는 곳(입실 안내·와이파이·생활 안내·기간 연장), 메시지, 저장, 동네 가이드, 도움말, 회사 소개, 로그인, 언어와 통화, 페이지 없음(404)
- **마이페이지** (`/account`): 쿠폰함(사용 가능·사용함·만료, 쿠폰 번호 확인), 후기 쓰기, 개인 정보, 로그인과 보안, 결제와 영수증, 알림
- **점주 센터(PMS)** (`/host/today`): 오늘 할 일, 예약(요청 수락·거절, 예약 상세), 캘린더(날짜 막기·특정 날짜 요금), 객실 목록과 객실 정보·요금 편집, 정산(CSV 내려받기), 쿠폰 만들어 게스트 아이디로 보내기
  - `/host`는 점주를 모집하는 소개 페이지입니다(운영 방식, 운영수수료, 지점을 여는 순서, 자주 묻는 질문).
- **운영 관리(어드민)** (`/admin`): 현황, 예약, 객실 심사, 회원(이름 가림), 쿠폰(번호형·아이디 발송·조건별 발송), 정산과 보류, 문의·신고, 운영 설정(수수료·기본 할인·헤더 메뉴·직원 권한)
- **지점**: 서울 15개 지점(10월 오픈 예정 5곳 포함)과 먼슬리브 인 제주, 객실 유형 35개. 헤더 메뉴는 한달살기·스테이·호스텔·레지던스·함께살기입니다.
  - 마포(용강동)는 점주 직접 운영(도급 단독 계약)이라 목록에서 빼 두었습니다. 먼슬리브가 운영을 맡게 되면 `scripts/make-listings.py`의 `HIDDEN`에서 지우면 됩니다.
  - 지점 이름·위치·오픈 예정 달은 회사 자료 기준이고, 가격·객실 정보(넓이·인원)·역까지 걸리는 시간은 예시이거나 확인이 필요합니다.
  - 실제 사진은 먼슬리브 인 제주만 있습니다. 사진이 없는 지점은 빈 사진 자리에 `MONTHLY [ 성수 ] BY MONTHLIV` 슬로건이 들어갑니다(만든 이미지·스톡 사진은 쓰지 않음).
  - 오픈 전 지점은 카드와 객실 페이지에 "10월 오픈 예정"처럼 오픈 달이 보입니다(회사 지점 목록에 달만 있어서 날짜는 적지 않음).
- **브랜드**: 공식 로고(원본을 따라 그린 SVG), 공식 컬러(브라운 #4B362C, 레드 #881C21, 코랄핑크 #B99A9D, 베이지 #F3E5DB), 무료 서체만(제목 Noto Serif KR·Libre Caslon Text, 본문 Pretendard, 라벨 Jost). 머무는 기간은 창문에 불이 켜지는 집 아이콘(하룻밤 1칸 · 일주일 2칸 · 한 달 4칸 · 한 계절 4칸과 테두리)으로 보여 줍니다.
- **12개 언어 주소**: `/ko` `/en` `/ja` `/zh-CN` `/zh-TW` `/de` `/fr` `/es` `/vi` `/th` `/id` `/ru`
  - 게스트 화면과 마이페이지는 한국어·영어·일본어·중국어(간체)·독일어로 번역했고, 나머지 7개 언어는 아직 영어로 보입니다.
  - 점주 센터와 어드민은 한국어·영어로 만들었습니다. 다른 언어에서는 영어로 보입니다.
- **지도**: Google Maps 키가 없으면 OpenStreetMap 지도(MapLibre + OpenFreeMap, 키 필요 없음)가 나옵니다. 위치는 대략적인 위치만 보냅니다.
- **아직 연결 전**: 로그인, 데이터베이스, 결제, 메시지 발송. 저장·보내기·승인 같은 버튼은 "했어요"라고만 보여 줍니다. 예약·회원·정산·쿠폰·후기는 모두 예시입니다(`src/data/`).
- **검색엔진 차단과 미리보기 안내**: 예시 데이터가 검색에 잡히지 않도록 막고, 모든 화면 맨 위에 "미리보기, 가격·객실 정보·예약 내역은 예시" 한 줄을 띄웁니다. 출시 때 `NEXT_PUBLIC_ALLOW_INDEXING=true`로 둘 다 없어집니다.

## 수수료 (먼슬리브 실제 구조)

- **게스트 수수료 없음**: 게스트에게는 지점 요금이 그대로 보이고, 결제할 때 더 붙지 않습니다. 총액에는 청소비까지 들어 있습니다.
- **운영수수료**: 점주 정산에서 숙박 요금의 **10%(먼슬리브 직영공사 지점)** 또는 **15%부터(그 밖의 지점, 협의)** 를 뺍니다. 청소비에는 붙지 않습니다.
  - 예: 1박 40,000원 → 게스트 결제 40,000원, 점주 정산 36,000원(10% 지점).
- 지점별 비율은 `scripts/make-listings.py`의 지점 목록에 있고, 객실마다 `feeBps`(만분율, 1000 = 10%)로 들어갑니다.
- 계산은 `src/lib/pricing.ts`의 `quote()`(게스트가 내는 금액)와 `hostQuote()`(점주가 받는 금액)에 있습니다. `guestFeeBps` 0, `directFeeBps` 1000, `otherFeeBps` 1500.

## 쿠폰

- **결제할 때**: 쿠폰함에 있는 쿠폰을 고르거나, 쿠폰 번호를 입력합니다. 쿠폰은 장기 할인이 적용된 뒤의 총액에서 빠지고, 예약 한 건에 하나만 씁니다.
- **누가 만드나**: 먼슬리브 본사(어드민)와 점주(점주 센터). 점주가 만든 지점 쿠폰은 그 점주의 지점에서만 쓰고, 할인 금액은 그 점주의 정산에서 빠집니다.
- **어떻게 받나**: 쿠폰 번호형은 번호를 아는 누구나 씁니다. 아이디 발송형은 회원 아이디(예: `seojin.yun`)로 보내면 쿠폰함에 바로 들어갑니다. 점주는 자기 지점을 예약했던 게스트에게만 보낼 수 있습니다.
- **광고 알림**: 쿠폰함에는 모두 들어가지만, 알림은 광고성 정보 수신에 동의한 회원에게만 보냅니다(밤 9시~아침 8시는 따로 동의).
- 쿠폰 확인은 서버에서 합니다(`src/data/coupons.ts`의 `checkCoupon`). 데이터베이스를 붙이면 쿠폰 번호는 브라우저로 보내지 않고, 결제와 같은 단계에서 사용 처리합니다.

## 지점과 객실 데이터

`src/data/listings.ts`는 `scripts/make-listings.py`가 만듭니다. 지점을 더하거나 고칠 때는 스크립트의 `BRANCHES`를 고친 뒤 다시 만듭니다.

```bash
python3 scripts/make-listings.py
```

- 객실 ID는 `<지점>-<객실>`입니다(예: `seongsu-window`, `geondae-single`).
- 지점마다 운영수수료(10·15%), 오픈 예정 달, 역까지 걸리는 시간, 5개 언어 이름·동네·역·소개, 객실(넓이·창·인원·침대·1박 또는 한 달 요금)이 들어 있습니다.
- 스테이·레지던스의 1박 요금은 한 달 요금에서 거꾸로 계산합니다(30박·한 달 할인 25% 기준). 호스텔은 1박 요금을 그대로 씁니다.
- 먼슬리브 인 제주는 실제 사진이 있어 `scripts/jeju-listing.ts.txt`에 따로 적어 두었습니다.

## 폴더 구조

```
src/app/[locale]/              페이지 (언어별 주소)
  page.tsx                     홈
  search/  stays/[id]/  book/[id]/  my-stays/  messages/  saved/  neighbourhoods/[slug]/
  help/  about/  login/  language/
  account/                     마이페이지 (쿠폰함, 후기, 개인 정보, 보안, 결제, 알림)
  host/page.tsx                점주 모집
  host/today/ …                점주 센터 (reservations, calendar, listings, listing, pricing, payouts, coupons)
  admin/                       운영 관리 (reservations, listings, members, coupons, payouts, support, settings)
  layout.tsx                   모든 페이지의 바깥 틀 (글꼴, 언어, 검색엔진 설정)
src/app/globals.css            디자인 시스템 (색, 글꼴, 버튼, 카드, 표…)
src/app/pages.css              화면별 배치 (맨 끝에 먼슬리브 브랜드 덮어쓰기)
src/components/                화면 조각 (Header, ListingCard, OpenMap, AccountShell, HostShell, AdminShell…)
src/data/                      지점·객실(listings, 자동 생성)과 예시 데이터 (samples, coupons, host, admin)
src/lib/                       가격 계산(pricing), 표시 방식(format), 일정(trip), 쿠폰 양식(couponForm)
src/i18n/routing.ts            언어 목록
src/proxy.ts                   언어별 주소로 보내는 부분
messages/*.json                언어별 문구 (ko.json이 기준)
public/brand/                  먼슬리브 로고(워드마크·타이포형·M·엠블럼·일러스트 혼합형)와 앱 아이콘
public/photos/                 실제 지점 사진 (scripts/photos.mjs로 변환)
scripts/                       지점 데이터 생성(make-listings.py), 사진 변환(photos.mjs), 지도 라이브러리 복사(vendor.mjs)
wrangler.jsonc                 Cloudflare Workers 설정
open-next.config.ts            Cloudflare용 Next.js 변환 설정
capacitor.config.ts            iOS·Android 앱 설정
app-shell/                     앱이 인터넷에 연결되지 않았을 때 보이는 화면
```

## 실행하기

Node.js 20.9 이상이 필요합니다.

```bash
npm install
cp .env.example .env.local   # 필요한 값 채우기
npm run dev                  # http://localhost:3000
```

올리기 전에 확인:

```bash
npm run lint && npm run typecheck && npm run build
```

## 환경 변수

| 이름 | 뜻 |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 사이트 주소(공유 미리보기 링크에 쓰임). 예: `https://monthliv.<계정 주소>.workers.dev` 또는 연결한 도메인 |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps 키. 비우면 OpenStreetMap 지도 |
| `NEXT_PUBLIC_GOOGLE_MAP_ID` | Google Maps 지도 ID (가격 핀에 필요). 비우면 Google의 데모 ID |
| `NEXT_PUBLIC_ALLOW_INDEXING` | `true`면 검색엔진 노출, 미리보기 안내 줄 숨김. 출시 전까지 `false` |
| `CAP_SERVER_URL` | 앱이 여는 주소(운영 사이트 주소) |

`NEXT_PUBLIC_`으로 시작하는 값은 브라우저에 그대로 보입니다. 비밀 키(예: Supabase `service_role`)에는 절대 붙이지 마세요.

## Google Maps 키 만들기 (선택)

키가 없어도 OpenStreetMap 지도가 나옵니다. Google 지도로 바꾸고 싶을 때만 만드세요.

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트를 만들고 결제 계정을 연결합니다.
2. **Maps JavaScript API**를 사용 설정합니다.
3. 사용자 인증 정보 → API 키 만들기 → 키 제한:
   - 애플리케이션 제한: 웹사이트 운영 주소(예: `https://monthliv.<계정 주소>.workers.dev/*`, 연결한 도메인), `https://*.workers.dev/*`(미리보기), `http://localhost:3000/*`
   - API 제한: Maps JavaScript API
4. 지도 관리(Map Management)에서 JavaScript용 지도 ID를 만들어 `NEXT_PUBLIC_GOOGLE_MAP_ID`에 넣습니다.
5. 요금은 Google 요금표에서 확인하세요(무료 사용량을 넘으면 사용량만큼 청구). 예산 알림을 꼭 켜 두세요.

## 번역

- 문구는 `messages/<언어>.json`에 있습니다. 새 문구는 `ko.json`에 먼저 넣고, `en`·`ja`·`zh-CN`·`de`에도 넣습니다.
  점주 센터(`pms`), 쿠폰 양식(`couponForm`), 어드민(`admin`)은 한국어·영어만 넣습니다.
- 어떤 언어 파일에 문구가 없으면 영어 문구가 보입니다. `zh-TW`, `fr`, `es`, `vi`, `th`, `id`, `ru` 파일을 채우면 그 언어가 바로 완성됩니다.
- 언어를 새로 추가할 때: `src/i18n/routing.ts`의 목록, `messages/<언어>.json`, `src/lib/languages.ts`의 언어 이름.

## 실제 지점 사진 올리기

```bash
node scripts/photos.mjs <객실-id> 대표사진.jpg 사진2.jpg …
```

640·1280·1920px WebP로 바꿔 `public/photos/<객실-id>/`에 넣고, 위치 정보(GPS) 같은 촬영 정보는 지웁니다. 그다음 `scripts/make-listings.py`(제주는 `scripts/jeju-listing.ts.txt`)에 사진과 5개 언어 설명(alt)을 적고 데이터를 다시 만듭니다. 직접 찍은 그 지점의 사진만 씁니다. 대표 사진(첫 장)이 검색 결과에 나옵니다.

## 배포 (Cloudflare Workers)

이 저장소는 Cloudflare Workers에 올릴 수 있게 설정되어 있습니다(`wrangler.jsonc`, `open-next.config.ts`).
지금 GitHub Pages(`main` 브랜치)에 떠 있는 예전 한 파일짜리 사이트는 이 코드가 `main`에 합쳐지면 더 이상 나오지 않습니다. Cloudflare 연결을 먼저 하고 합치세요.

**처음 한 번 연결하기**
1. [Cloudflare](https://dash.cloudflare.com/sign-up)에 가입합니다(리버와일과 같은 계정을 써도 됩니다).
2. **Workers & Pages** → **Create application** → **Import a repository** → GitHub 연결.
   GitHub 권한은 **Only select repositories**로 `kimdoosoo/monthliv`를 고릅니다.
3. 저장소 `monthliv`를 고르고 설정을 아래처럼 넣은 뒤 배포합니다.
   - 이름(Project name): `monthliv` (`wrangler.jsonc`의 `name`과 같아야 함)
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
   - Non-production branch deploy command (미리보기): `npm run deploy:preview`
4. 몇 분 뒤 `https://monthliv.<계정 주소>.workers.dev`로 열립니다.
5. 다 되면 GitHub 저장소의 **Settings → Pages**에서 GitHub Pages를 끕니다.

연결한 뒤에는 `main`에 올라가는 코드가 자동으로 다시 배포되고, 다른 브랜치와 PR은 미리보기 주소가 따로 생깁니다.

- `NEXT_PUBLIC_`으로 시작하는 값(사이트 주소, 지도 키 등)은 빌드할 때 들어가므로 Worker 설정의 **Build → Build variables and secrets**에 넣습니다. 미리보기는 운영 값을 물려받지 않으니 `wrangler.jsonc`의 `previews`에 따로 넣습니다.
- 도메인 연결: 도메인의 네임서버를 Cloudflare로 옮긴 뒤 Worker의 **Settings → Domains & Routes**에서 추가합니다.
- 무료 플랜은 Worker 크기 3MB(압축 기준)까지입니다. 지금은 약 2.9MB입니다. 빌드 뒤 `npx wrangler versions upload --dry-run`으로 크기를 확인하고, 넘으면 유료 플랜(월 5달러)이 필요합니다.
- 지도 라이브러리(MapLibre)는 빌드 전에 `scripts/vendor.mjs`가 `public/vendor/`로 복사해 브라우저에서만 불러옵니다(Worker 크기를 줄이려고).
- 언어를 고르는 `src/proxy.ts`는 Cloudflare에서 아직 시험 기능(Node.js middleware)으로 돌아갑니다. 문제가 생기면 `next.config.ts`의 redirects로 바꿀 수 있습니다.

내 컴퓨터에서 Cloudflare와 같은 환경으로 확인하기:

```bash
npm run preview    # http://localhost:8787
```

## 모바일 앱 (Capacitor)

앱은 운영 사이트를 열어 보여 줍니다(`CAP_SERVER_URL`). 웹을 배포하면 앱 화면도 같이 바뀝니다.

```bash
npm install @capacitor/ios @capacitor/android
npx cap add ios        # macOS와 Xcode 필요
npx cap add android    # Android Studio 필요
CAP_SERVER_URL=https://<운영 주소> npx cap sync
npx cap open ios       # 또는 android
```

- **스토어 심사**: 웹사이트를 감싸기만 한 앱은 Apple 심사(4.2)에서 거절될 수 있습니다. 앱에만 있는 기능을 넣습니다 — 결제일·연장·입실 안내 푸시 알림, 내 위치 주변 지점 찾기 등.
- **앱 ID**: `com.gosuplus.monthliv`(`capacitor.config.ts`). 이미 스토어에 있는 앱을 업데이트하는 경우 그 앱의 ID와 서명 키를 써야 합니다.
- **계정**: Apple Developer(연 99달러, 법인은 D-U-N-S 번호 필요), Google Play(25달러 1회).

## 보안 원칙

- Supabase를 붙일 때 **모든 테이블에 RLS**를 켭니다.
- `service_role` 키는 서버에서만 씁니다.
- **카드번호·주민등록번호·여권번호는 저장하지 않습니다.** 결제는 PG사 토큰으로만 합니다. 정산 계좌도 끝 네 자리만 보여 줍니다.
- 관리자 계정은 모두 2단계 인증을 켜고, 회원 정보를 열어 본 기록을 남깁니다. 어드민 목록에서는 이름을 가립니다.
- 정확한 주소는 계약 뒤에만 알려 주고, 지도에는 대략적인 위치만 보냅니다.
- 마이페이지·점주 센터·어드민은 지금 로그인 없이 열리는 예시 화면입니다. 실제 데이터를 넣기 전에 로그인과 역할(게스트·점주·직원 권한)을 붙입니다.
- 보안 헤더는 `next.config.ts`에 있습니다. 출시 전에 KISA 보안 점검을 받습니다.

## 다음 단계

1. Cloudflare 배포 연결 → GitHub Pages 끄기 → 도메인 연결
2. 지점별 실제 사진(대표 사진·객실·라운지·외관)과 객실 구성·가격·편의시설 확인
3. Supabase: 회원·지점·객실·예약·결제·쿠폰·정산·후기 테이블(RLS 포함), 로그인(카카오·네이버·Apple·Google·이메일), 점주·직원 역할
4. 알림톡: 예약·결제·연장 내용을 점주에게 자동 발송
5. PG 계약(해외 카드 결제 포함)과 점주 정산
6. 정할 것: 푸터의 거래 당사자 고지 문구, 일찍 퇴실할 때의 정책, 환불 정책, 이용약관·개인정보 처리방침 전문, 통신판매업 신고번호·고객센터 번호
7. 남은 7개 언어 번역
