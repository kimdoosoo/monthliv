import type { Locale } from "@/i18n/routing";

/**
 * Numbers, prices and dates for every language.
 * Korean follows the MONTHLIV style: 486,000원, 3월 12일(목), 3월 12–15일, 오후 3시.
 * English is British: ₩184,000, Thu 12 Mar, 12–15 Mar, 3 pm.
 */

/** Locale used for number and date formatting (British English for "en"). */
export function formatLocale(locale: string): string {
  return locale === "en" ? "en-GB" : locale;
}

const zone = "Asia/Seoul";

function day(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00+09:00`);
}

/**
 * Won amounts with the locale's number style and the plain ₩ sign. Browsers and Node disagree on
 * the sign for some locales (Chrome writes ￦ in Japanese), which would break hydration.
 */
function won(amount: number, locale: string, options: Intl.NumberFormatOptions = {}): string {
  const text = new Intl.NumberFormat(formatLocale(locale), {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
    ...options,
  })
    .formatToParts(amount)
    .map((part) => (part.type === "currency" ? "₩" : part.value))
    .join("");
  return sameSpaces(text);
}

/** ICU versions differ on narrow and regular no-break spaces (French, German); use one kind. */
function sameSpaces(text: string): string {
  return text.replace(/[\u00a0\u202f]/g, "\u00a0");
}

/** Full price: "922,000원" in Korean, "₩922,000" / "922.000 ₩" elsewhere. */
export function formatPrice(amount: number, locale: string): string {
  if (locale === "ko") {
    return `${amount.toLocaleString("ko-KR")}원`;
  }
  return won(amount, locale);
}

/** Short price for map pins: "92만", "₩922K", "₩1.24M". */
export function formatPinPrice(amount: number, locale: string): string {
  if (locale === "ko") {
    return amount >= 10000
      ? `${Math.round(amount / 10000).toLocaleString("ko-KR")}만`
      : `${amount.toLocaleString("ko-KR")}원`;
  }
  // Above a million, whole numbers would turn ₩1,240,000 into ₩1M.
  return won(amount, locale, {
    notation: "compact",
    maximumFractionDigits: amount >= 1_000_000 ? 2 : 0,
  });
}

/** Guest rating out of 5 with two decimals, as after the ★: "4.92", "4.90", "4,92". */
export function formatRating(value: number, locale: string): string {
  return new Intl.NumberFormat(formatLocale(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** A category score out of 5 with one decimal: "4.9", "5.0". */
export function formatScore(value: number, locale: string): string {
  return new Intl.NumberFormat(formatLocale(locale), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(formatLocale(locale), { style: "percent" }).format(value / 100);
}

/** "11월 2일", "2 November", "11月2日", "2. November" */
export function formatDayMonth(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(formatLocale(locale), {
    month: "long",
    day: "numeric",
    timeZone: zone,
  }).format(day(isoDate));
}

/** "11월 2일(월)", "Mon 2 Nov", "11月2日(月)", "11月2日周一", "Mo., 2. Nov." */
export function formatDayWeekday(isoDate: string, locale: string): string {
  const date = day(isoDate);
  if (locale === "ko" || locale === "ja") {
    const parts = new Intl.DateTimeFormat(locale, {
      month: "numeric",
      day: "numeric",
      weekday: "short",
      timeZone: zone,
    }).formatToParts(date);
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
    return locale === "ko"
      ? `${get("month")}월 ${get("day")}일(${get("weekday")})`
      : `${get("month")}月${get("day")}日(${get("weekday")})`;
  }
  const parts = new Intl.DateTimeFormat(formatLocale(locale), {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: zone,
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  // Built from parts: Node's and the browser's ICU disagree on the punctuation in between
  // ("Mon, 2 Nov" against "Mon 2 Nov"), which breaks hydration.
  if (locale === "en") return `${get("weekday")} ${get("day")} ${get("month")}`;
  if (locale === "de") return `${get("weekday")}, ${get("day")}. ${get("month")}`;
  if (locale.startsWith("zh")) return `${get("month")}月${get("day")}日${get("weekday")}`;
  return sameSpaces(parts.map((part) => part.value).join(""));
}

/**
 * "11월 2–30일", "11月2日～30日", "11月2日–30日", "2–30 Nov", "2.–30. Nov."
 * Korean, Japanese and Chinese are written out by hand: ICU writes 11/02～11/30 for them.
 */
export function formatRange(from: string, to: string, locale: string): string {
  const cjk = locale === "ko" || locale === "ja" || locale.startsWith("zh");
  if (cjk) {
    const part = (isoDate: string, unit: "month" | "day") =>
      Number(new Intl.DateTimeFormat("en", { [unit]: "numeric", timeZone: zone }).format(day(isoDate)));
    const [m1, d1, m2, d2] = [part(from, "month"), part(from, "day"), part(to, "month"), part(to, "day")];
    if (locale === "ko") {
      return m1 === m2 ? `${m1}월 ${d1}–${d2}일` : `${m1}월 ${d1}일–${m2}월 ${d2}일`;
    }
    const dash = locale === "ja" ? "～" : "–";
    return m1 === m2 ? `${m1}月${d1}日${dash}${d2}日` : `${m1}月${d1}日${dash}${m2}月${d2}日`;
  }
  return new Intl.DateTimeFormat(formatLocale(locale), {
    day: "numeric",
    month: "short",
    timeZone: zone,
  }).formatRange(day(from), day(to));
}

/** "2026. 11. 2.", "2 Nov 2026", "2026/11/02", "02.11.2026" */
export function formatDate(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(formatLocale(locale), {
    dateStyle: "medium",
    timeZone: zone,
  }).format(day(isoDate));
}

/** "2026년 9월", "September 2026" */
export function formatMonthYear(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(formatLocale(locale), {
    year: "numeric",
    month: "long",
    timeZone: zone,
  }).format(day(isoDate));
}

/** "11월", "November" */
export function formatMonth(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(formatLocale(locale), {
    month: "long",
    timeZone: zone,
  }).format(day(isoDate));
}

/** A clock time in Seoul: "오후 3시", "3 pm", "15時", "15 Uhr". `time` is "HH:MM". */
export function formatTime(time: string, locale: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  // German: "9 Uhr", "9:30 Uhr" (ICU writes "09 Uhr").
  if (locale === "de") {
    return minutes ? `${hours}:${String(minutes).padStart(2, "0")} Uhr` : `${hours} Uhr`;
  }
  const date = new Date(Date.UTC(2026, 0, 1, hours - 9, minutes));
  return new Intl.DateTimeFormat(formatLocale(locale), {
    hour: "numeric",
    minute: minutes ? "2-digit" : undefined,
    hour12: locale === "en" ? true : undefined,
    timeZone: zone,
  }).format(date);
}

/** Floor area: "9.1㎡" in Korean, Japanese and Chinese, "9.1 m²" / "9,1 m²" elsewhere. */
export function formatArea(size: number, locale: string): string {
  const number = new Intl.NumberFormat(formatLocale(locale), { maximumFractionDigits: 1 }).format(size);
  return /^(ko|ja|zh)/.test(locale) ? `${number}㎡` : `${number} m²`;
}

export function formatCount(value: number, locale: Locale | string): string {
  return sameSpaces(new Intl.NumberFormat(formatLocale(locale)).format(value));
}
