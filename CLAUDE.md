@AGENTS.md

# MONTHLIV (먼슬리브)

MONTHLIV is 주식회사 고수플러스's brand of furnished rooms in Seoul (and one place in Jeju), run by
MONTHLIV itself: stays (스테이), hostels, a residence. This site is the Livawhile codebase with the
same way of booking — one nightly price, longer stays cheaper — listing MONTHLIV branches only.
One Next.js codebase serves the website and the iOS/Android apps (Capacitor opens the live site).
Code, class and token names follow Livawhile so fixes can move between the two repositories.

## Product rules

- Text first: no banners or promotional images. Real photos only — no stock or generated images.
  Rooms without photos keep tinted photo slots with the branch's slogan (MONTHLY [ 성수 ] BY MONTHLIV).
- Pricing lives in `src/lib/pricing.ts`: one 1-night price, then week (7–27 nights), month (28–89) and season (90+)
  discounts applied to the whole stay; cleaning once per stay. Stays of 28 nights or more can be paid in two halves.
  Free cancellation runs until 7 days before check-in.
- Fees (decided, MONTHLIV's real structure): **no guest fee** — guests see the branch's price as it is
  (`guestFeeBps` 0; the breakdown's "service fee included" line hides while it is 0). The **operating fee** comes off
  the partner's (점주) payout: 10% at branches MONTHLIV built (직영공사), from 15% at the others, set per room as
  `feeBps` (basis points). Cleaning has no fee. `quote()` is what the guest pays, `hostQuote()` what the partner is
  paid. Fee percentages in messages use `{percent, number}` so they read 10 in every language.
- Listings are generated: `python3 scripts/make-listings.py` writes `src/data/listings.ts` from the branch list in the
  script (and `scripts/listings.template.ts.txt`, `scripts/jeju-listing.ts.txt`). One listing per room type,
  ID `<branch>-<room>`; rooms of a branch share `branch`. Edit the script, not the generated file.
- Every listing is a real branch (`real` set): branch names, areas and opening months come from the company's branch
  list; prices, room details and walking times are examples until confirmed. Never give a branch sample reviews,
  a sample host or claims nobody confirmed (self check-in, Wi-Fi speed, pets, registration, facilities beyond
  `amenities`); `reviews: 0` shows it as new. The host on every branch is MONTHLIV (먼슬리브 매니저).
- Branches that haven't opened carry `opens` (YYYY-MM, the month only — the list has no day) and show
  "10월 오픈 예정"; `isOpen()` treats them as open from the next month.
- `HIDDEN` in the script keeps a branch out of the site: Mapo (용강동) is run directly by its partner under a
  construction-only contract, which can't carry the MONTHLIV name.
- Branch photos: `node scripts/photos.mjs <listing-id> <photos…>` (cover first) writes 640/1280/1920 px WebP to
  `public/photos/<listing-id>/` without camera data (no GPS); then list them with alt text in five languages.
- Maps: Google Maps when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set, otherwise MapLibre with OpenFreeMap tiles
  (`src/components/OpenMap.tsx`, restyled in `src/components/mapStyle.ts`). Coordinates are approximate.
  MapLibre is never imported at runtime: `scripts/vendor.mjs` (run by `predev`/`prebuild`) copies it to
  `public/vendor/`, and `src/lib/maplibre.ts` loads it in the browser. Bundled, it would also land in the Worker.
- Trips travel in the address: `?from=YYYY-MM-DD&to=YYYY-MM-DD&guests=N` (`src/lib/trip.ts`).

## Accounts, partner centre and admin (sample screens)

- My page is `/account` (coupon wallet, reviews, personal info, login and security, payments, notifications) and
  `/language`. The partner centre (점주 센터, PMS) is `/host/today` and the pages beside it; `/host` itself is the
  public "partner with us" page (점주 모집). The back office is `/admin`. None of them has sign-in yet: add it, and
  staff roles, with the database before real data goes in. Their pages set `robots: { index: false }`.
- Sample bookings, guests, the sample partner (`samplePartner`, 예시 점주: Seongsu, Sinchon and Konkuk), payouts and
  coupons in `src/data/` sit on real branches only inside the signed-in screens (my page, partner centre, admin).
  They are examples; keep them out of public pages.
- "Today" in the stay, partner-centre and admin screens is `sampleToday` (2026-11-13); coupon checks use the real date.
- Members are addressed by member ID (e.g. `seojin.yun`). Lists in the admin mask names; contact details stay out.
- Coupons (`src/data/coupons.ts`): MONTHLIV (admin) or a partner (partner centre) issues them; a partner's coupon works
  only at that partner's branches (`partnerOfBranch`) and comes out of their payout. A code coupon is typed at
  checkout; a member-ID coupon waits in the wallet. One coupon per booking, taken off after the stay-length discount.
  Checks run on the server (`checkCoupon`). Partners may send coupons only to guests who have booked with them.
  Advertising notices need the member's consent, and a second consent for 9 pm–8 am.
- The coupon form (`src/lib/couponForm.ts`, `CouponForm`) is shared by the partner centre and the admin. It submits as
  GET with `send=1` and, in this preview, shows what it would create without saving it.
- Buttons whose work needs a server (save, send, approve) are `DoneButton`s for now: they say it's done, nothing more.

## Brand (tokens and components live in `src/app/globals.css`, page layouts in `src/app/pages.css`)

- Official palette: 먼슬리브 브라운 #4B362C (main), 레드 #881C21, 코랄핑크 #B99A9D, 베이지 #F3E5DB, plus supporting colours
  made from them (deep brown, ivory, blush, plum, light red, lamp). Design system: claude.ai/artifact/1RSNBf9hKp49JoTyNEK85C.
- Names come from Livawhile: `--moon` is the brown accent (the one primary button per screen, `.lv-btn--moon`),
  `--moon-deep` the red highlight (emphasis text, links), `--moon-soft` blush, `--surface-night` deep brown,
  `--surface-hanji` beige. `.lv-btn--night` is the outlined secondary button (beige on dark panels).
  Red is for emphasis only, never a big area. Coral pink is never text.
- Free fonts only (SIL OFL, from npm): headings Noto Serif KR 600 / Libre Caslon Text, text Pretendard, labels and the
  slogan Jost. Work screens (partner centre, admin) keep headings in Pretendard. Never use paid fonts; ANGSA
  (Angsana New) from the old brand files must not be used, embedded or committed.
- Logos are the official files traced to SVG in `public/brand/` (wordmark, typographic, M mark, app icons) plus the
  illustrated (mixed) logo and emblem PNGs. Never retype MONTHLIV in a font or recolour beyond brown/red, or beige
  on dark surfaces. The slogan is A NEW WAY OF LIFE, MONTHLY [  ] BY MONTHLIV; the blank holds 2–6 Korean characters
  or 1–2 English words, in red.
- Length of stay is always shown with the stay scale — a small building whose windows light up (night 1, week 2,
  month 4, season 4 + outline) — via `MoonIcon`. Use it for nothing else.
- Icons: `lucide-react` with `strokeWidth={1.75}`. No emoji.
- English copy is British English. Notation: 486,000원 · 3월 12일(목) · 3월 12–15일 · 오후 3시; booking codes like `ML-7Q4K2M`.
- Tone (Korean): polite, short sentences, warm without exaggeration. Avoid words that recall a 고시원 (저렴한 방, 쪽방).

## Languages

- Every user-facing string lives in `messages/*.json`. `ko.json` is the reference and the type source
  (`src/global.d.ts`); a key missing from another language falls back to English.
- New keys go into ko, en, ja, zh-CN and de together — except the partner centre (`pms`), the coupon form
  (`couponForm`) and the admin (`admin`), which are written in Korean and English.
- In Korean the brand is 먼슬리브; elsewhere MONTHLIV. Partners are 점주 (ko) and partners (en).
- Prices, dates and numbers go through `src/lib/format.ts`. Prices are KRW. Values that come from data are
  placeholders, never typed into copy.
- Format text on the server and pass strings to client components, so server and browser output match.
  Only the namespaces client components read are sent to the browser (`clientNamespaces` in
  `src/app/[locale]/layout.tsx`): add one there when a client component starts using it.
- Locale list: `src/i18n/routing.ts`. Language names: `src/lib/languages.ts`.

## Security

- Supabase: RLS on every table. The `service_role` key is server-only; never prefix secrets with `NEXT_PUBLIC_`.
- Never store card, resident registration or passport numbers. Payments use PG tokens.
- Send approximate coordinates to the browser; the exact address is shared after the contract.
- Security headers are set in `next.config.ts`.

## Next.js 16 notes

- `src/proxy.ts` (not middleware) sends visitors to a language path.
- The root layout is `src/app/[locale]/layout.tsx`; `next/root-params` provides the locale to `src/i18n/request.ts`.
- `params` and `searchParams` are Promises; use the `PageProps` / `LayoutProps` helpers.
- A page file may export only what Next.js expects; shared helpers and constants go in `src/lib` or `src/data`.
  Values exported from a `"use client"` module can't be used on the server.
- `src/app/global-not-found.tsx` handles addresses outside the language folders.

## Deploy (Cloudflare Workers via OpenNext)

- Build `npx opennextjs-cloudflare build`, deploy `npx opennextjs-cloudflare deploy` (Workers Builds runs these on `main`).
  Plain `wrangler deploy` skips copying the prebuilt pages into the cache — don't use it.
- Other branches and pull requests get a preview: Workers Builds' preview command is `npm run deploy:preview`
  (copies the prebuilt pages into the assets, then `wrangler preview`). It needs the `previews` block in
  `wrangler.jsonc`; previews don't inherit production vars or bindings, so add those there too.
- `open-next.config.ts` uses the read-only static-assets cache. Pages that read `searchParams` and pages with
  `[id]`/`[code]` render on demand. Don't set `dynamicParams = false`: when the cache is missing such pages answer 404.
- `src/proxy.ts` runs as Node.js middleware, which OpenNext marks experimental on Cloudflare.
  If it breaks, move the language redirect to `redirects()` in `next.config.ts`.
- `NEXT_PUBLIC_*` values are inlined at build time: set them as build variables.
- The free plan allows a 3 MiB (gzip) Worker; check with `npx wrangler versions upload --dry-run`
  after building. Keep browser-only libraries out of server code.
- Check locally with `npm run preview` (workerd on port 8787).

## Before committing

```bash
npm run lint && npm run typecheck && npm run build
```
