/**
 * Coupons for the first build. A coupon comes off the total after the stay-length discount.
 *
 * - MONTHLIV (the admin) or a partner (점주, in the partner centre) issues it. A partner's coupon
 *   works only at that partner's branches, and its discount comes out of the partner's payout.
 * - `code` coupons work for anyone who types the code at checkout.
 * - `users` coupons are sent to member IDs and wait in their coupon wallet (My page), where they
 *   can be picked at checkout without typing anything.
 *
 * These are samples. When coupons come from the database, the checkout asks the server to check a
 * code (codes are never sent to the browser), and using a coupon marks it used in the same step
 * as the payment.
 */
import { getListing, type Text } from "./listings";

export type Coupon = {
  id: string;
  /** What a guest types, in capitals. Wallet coupons have one too, for support staff. */
  code: string;
  title: Text;
  kind: "percent" | "amount";
  /** Per cent off, or won off. */
  value: number;
  /** Most a percent coupon takes off, in won. */
  maxDiscount?: number;
  /** Least the stay must cost before the coupon, in won. */
  minTotal?: number;
  minNights?: number;
  /** Last day it can be used (Seoul time). */
  expires: string;
  issuer: "admin" | "host";
  /** The partner who issued it; their branches only. */
  hostId?: string;
  audience: "code" | "users";
  /** Member IDs a `users` coupon was sent to. */
  sentTo?: string[];
  /** How many times it can be used in all; unlimited when missing. */
  limit?: number;
  used: number;
  createdOn: string;
};

/** The sample guest's member ID (윤서진). */
export const sampleGuestId = "seojin.yun";

/**
 * Partners (점주) by branch, for the sample partner centre and admin. MONTHLIV runs every branch;
 * the partner is who the branch pays out to. Branches not listed pay out to MONTHLIV itself.
 */
export const partnerOfBranch: Record<string, string> = {
  seongsu: "sample.partner",
  sinchon: "sample.partner",
  geondae: "sample.partner",
  wangsimni: "seohyun.j",
};

/** The partner a place pays out to: a member ID, or "monthliv". */
export function hostIdOf(listingId: string): string {
  const listing = getListing(listingId);
  return (listing && partnerOfBranch[listing.branch]) ?? "monthliv";
}

export const coupons: Coupon[] = [
  {
    id: "welcome",
    code: "WELCOME-ML",
    title: { ko: "첫 예약 웰컴 쿠폰", en: "Welcome coupon for your first booking", ja: "初回予約のウェルカムクーポン", "zh-CN": "首次预订欢迎优惠券", de: "Willkommensgutschein für die erste Buchung" },
    kind: "percent",
    value: 10,
    maxDiscount: 30000,
    expires: "2026-12-31",
    issuer: "admin",
    audience: "users",
    sentTo: ["seojin.yun", "minho.kim", "yui.tanaka"],
    used: 1,
    createdOn: "2026-09-01",
  },
  {
    id: "month-stay",
    code: "MONTH-20000",
    title: { ko: "한 달 살기 응원 쿠폰", en: "Month-stay coupon", ja: "1か月滞在応援クーポン", "zh-CN": "月租鼓励优惠券", de: "Gutschein für Monatsaufenthalte" },
    kind: "amount",
    value: 20000,
    minNights: 28,
    expires: "2026-11-30",
    issuer: "admin",
    audience: "users",
    sentTo: ["seojin.yun"],
    used: 0,
    createdOn: "2026-09-20",
  },
  {
    id: "stay-again",
    code: "STAY-AGAIN",
    title: { ko: "다시 머물기 쿠폰", en: "Stay with us again", ja: "また泊まるクーポン", "zh-CN": "再次入住优惠券", de: "Wieder bei uns wohnen" },
    kind: "amount",
    value: 15000,
    minNights: 7,
    expires: "2027-01-31",
    issuer: "host",
    hostId: "sample.partner",
    audience: "users",
    sentTo: ["seojin.yun"],
    used: 0,
    createdOn: "2026-09-28",
  },
  {
    id: "autumn",
    code: "MONTHLIV-AUTUMN",
    title: { ko: "가을 맞이 5% 할인", en: "5% off this autumn", ja: "秋の5%オフ", "zh-CN": "秋季九五折", de: "5 % Herbstrabatt" },
    kind: "percent",
    value: 5,
    maxDiscount: 50000,
    minTotal: 100000,
    expires: "2026-11-30",
    issuer: "admin",
    audience: "code",
    limit: 1000,
    used: 268,
    createdOn: "2026-09-15",
  },
  {
    id: "chuseok",
    code: "CHUSEOK-5000",
    title: { ko: "추석 연휴 5천 원 할인", en: "₩5,000 off for Chuseok", ja: "秋夕連休5千ウォン引き", "zh-CN": "中秋假期立减5千韩元", de: "₩5.000 Rabatt zu Chuseok" },
    kind: "amount",
    value: 5000,
    expires: "2026-09-30",
    issuer: "admin",
    audience: "users",
    sentTo: ["seojin.yun", "minho.kim"],
    used: 1,
    createdOn: "2026-09-10",
  },
  {
    id: "summer",
    code: "SUMMER-ML",
    title: { ko: "여름 한정 1만 원 할인", en: "₩10,000 off this summer", ja: "夏限定1万ウォン引き", "zh-CN": "夏季限定立减1万韩元", de: "₩10.000 Sommerrabatt" },
    kind: "amount",
    value: 10000,
    expires: "2026-08-31",
    issuer: "admin",
    audience: "users",
    sentTo: ["seojin.yun"],
    used: 1,
    createdOn: "2026-06-01",
  },
];

/** Coupons the guest has used already (coupon ID → booking code). */
export const usedByGuest: Record<string, string> = { summer: "ML-3H8C5N" };

export function getCoupon(id: string): Coupon | undefined {
  return coupons.find((coupon) => coupon.id === id);
}

/**
 * A coupon picked from the member's wallet (?coupon=ID). Only coupons sent to that member come
 * back: a code coupon can't be used by its ID without knowing the code.
 */
export function walletCoupon(id: string, memberId: string): Coupon | undefined {
  const coupon = getCoupon(id);
  return coupon && coupon.audience === "users" && coupon.sentTo?.includes(memberId) ? coupon : undefined;
}

/** A typed code: spaces and case don't matter. */
export function findCouponByCode(code: string): Coupon | undefined {
  const clean = code.trim().toUpperCase().replace(/\s+/g, "");
  if (!clean) return undefined;
  return coupons.find((coupon) => coupon.code === clean);
}

/** The guest's wallet: coupons sent to them, newest first. */
export function walletOf(memberId: string): Coupon[] {
  return coupons
    .filter((coupon) => coupon.audience === "users" && coupon.sentTo?.includes(memberId))
    .sort((a, b) => b.createdOn.localeCompare(a.createdOn));
}

export type CouponCheck =
  | { ok: true; amount: number }
  | {
      ok: false;
      reason: "expired" | "used" | "minNights" | "minTotal" | "otherHost" | "notYours" | "soldOut";
    };

/**
 * Can this coupon be used on this booking, and how much does it take off?
 * `total` is the price before the coupon: stay after the length discount, cleaning, service fee.
 * Percent coupons round down to ₩100.
 */
export function checkCoupon(
  coupon: Coupon,
  booking: { listingId: string; nights: number; total: number; today: string; memberId: string },
): CouponCheck {
  if (coupon.expires < booking.today) return { ok: false, reason: "expired" };
  if (usedByGuest[coupon.id] && booking.memberId === sampleGuestId) return { ok: false, reason: "used" };
  if (coupon.audience === "users" && !coupon.sentTo?.includes(booking.memberId)) {
    return { ok: false, reason: "notYours" };
  }
  if (coupon.limit !== undefined && coupon.used >= coupon.limit) return { ok: false, reason: "soldOut" };
  if (coupon.issuer === "host" && coupon.hostId !== hostIdOf(booking.listingId)) {
    return { ok: false, reason: "otherHost" };
  }
  if (coupon.minNights && booking.nights < coupon.minNights) return { ok: false, reason: "minNights" };
  if (coupon.minTotal && booking.total < coupon.minTotal) return { ok: false, reason: "minTotal" };
  const raw =
    coupon.kind === "percent"
      ? Math.floor((booking.total * coupon.value) / 100 / 100) * 100
      : coupon.value;
  const capped = coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
  return { ok: true, amount: Math.min(capped, booking.total) };
}

/** Today's date in Seoul as YYYY-MM-DD. */
export function todayInSeoul(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

export type WalletStatus = "available" | "used" | "expired";

/** Where a coupon in the guest's wallet stands today: used beats expired. */
export function walletStatus(coupon: Coupon, today: string): WalletStatus {
  if (usedByGuest[coupon.id]) return "used";
  if (coupon.expires < today) return "expired";
  return "available";
}

/** Whole days from `today` to the last day a coupon works; 0 on the last day. */
export function daysLeft(expires: string, today: string): number {
  const day = (value: string) => Date.UTC(+value.slice(0, 4), +value.slice(5, 7) - 1, +value.slice(8, 10));
  return Math.round((day(expires) - day(today)) / 86_400_000);
}
