/**
 * The partner centre's sample data (점주 센터): a sample partner's rooms at three branches
 * (Seongsu, Sinchon, Konkuk), their bookings, blocked dates and payouts. The branches are real;
 * the partner, the bookings and the money are examples.
 * "Today" is the same day the guest screens use (sampleToday), so both sides tell one story:
 * 서진 is on day 12 of her month in a window room at Seongsu Stay.
 *
 * Guests appear by member ID and first name only; full names, phone numbers and payment
 * details stay with the booking and the payment gateway.
 */
import { getListing, type Text } from "./listings";
import { addDays, feePercentOf, hostQuote, nightsBetween, quote } from "@/lib/pricing";

export const hostId = "sample.partner";

/** The signed-in partner in the sample partner centre. */
export const samplePartner = {
  name: { ko: "예시 점주", en: "Sample partner", ja: "サンプルオーナー", "zh-CN": "示例店主", de: "Beispielpartner" } satisfies Text,
  /** In the round badge at the top right. */
  initial: { ko: "점주", en: "P" } satisfies Text,
};

export type PlaceStatus = "listed" | "snoozed" | "draft";

/** The partner's rooms in the partner centre. The draft isn't on the site yet. */
export const hostPlaces: {
  key: string;
  listingId?: string;
  title?: Text;
  tone: number;
  status: PlaceStatus;
  /** Lodging registration (숙박업 등) as checked by MONTHLIV. */
  registration: "checked" | "checking" | "missing";
}[] = [
  { key: "seongsu-standard", listingId: "seongsu-standard", tone: 1, status: "listed", registration: "checked" },
  { key: "seongsu-window", listingId: "seongsu-window", tone: 1, status: "listed", registration: "checked" },
  { key: "seongsu-premium", listingId: "seongsu-premium", tone: 1, status: "listed", registration: "checked" },
  { key: "sinchon-single", listingId: "sinchon-single", tone: 3, status: "listed", registration: "checked" },
  { key: "geondae-single", listingId: "geondae-single", tone: 6, status: "listed", registration: "checked" },
  { key: "geondae-double", listingId: "geondae-double", tone: 6, status: "listed", registration: "checked" },
  {
    key: "new-room-draft",
    title: {
      ko: "새 객실 (작성 중)",
      en: "New room (draft)",
      ja: "新しい客室（作成中）",
      "zh-CN": "新房间（草稿）",
      de: "Neues Zimmer (Entwurf)",
    },
    tone: 5,
    status: "draft",
    registration: "missing",
  },
];

/** Guests who have booked the partner's rooms, by member ID. */
export const hostGuests: Record<string, { name: Text; languages: string[]; verified: boolean; since: number }> = {
  "seojin.yun": { name: { ko: "서진", en: "Seojin", ja: "ソジン", "zh-CN": "Seojin", de: "Seojin" }, languages: ["ko", "en"], verified: true, since: 2025 },
  "jiyoon.han": { name: { ko: "지윤", en: "Jiyoon", ja: "ジユン", "zh-CN": "Jiyoon", de: "Jiyoon" }, languages: ["ko"], verified: true, since: 2024 },
  "yui.tanaka": { name: { ko: "유이", en: "Yui", ja: "ユイ", "zh-CN": "Yui", de: "Yui" }, languages: ["ja", "en"], verified: true, since: 2026 },
  "james.w": { name: { ko: "제임스", en: "James", ja: "ジェームズ", "zh-CN": "James", de: "James" }, languages: ["en"], verified: true, since: 2025 },
  "lena.fischer": { name: { ko: "레나", en: "Lena", ja: "レーナ", "zh-CN": "Lena", de: "Lena" }, languages: ["de", "en"], verified: true, since: 2026 },
  "lukas.b": { name: { ko: "루카스", en: "Lukas", ja: "ルーカス", "zh-CN": "Lukas", de: "Lukas" }, languages: ["de"], verified: true, since: 2025 },
  "tom.k": { name: { ko: "톰", en: "Tom", ja: "トム", "zh-CN": "Tom", de: "Tom" }, languages: ["en"], verified: true, since: 2026 },
  "minho.kim": { name: { ko: "민호", en: "Minho", ja: "ミンホ", "zh-CN": "Minho", de: "Minho" }, languages: ["ko"], verified: true, since: 2023 },
};

export type ReservationStatus = "request" | "upcoming" | "staying" | "past" | "cancelled";

/** Badge colour for each status; the status is always written out as well. */
export const statusBadge: Record<ReservationStatus, string> = {
  request: "lv-badge--moon",
  upcoming: "",
  staying: "lv-badge--celadon",
  past: "lv-badge--line",
  cancelled: "lv-badge--danger",
};

export type HostReservation = {
  code: string;
  guestId: string;
  listingId: string;
  from: string;
  to: string;
  guests: number;
  status: ReservationStatus;
  /** Requests: when the host's answer is due. */
  replyBy?: string;
  /** The guest's first message, in the language they wrote it. */
  note?: { lang: string; text: Text };
  /** Cancelled: whether it was before the free-cancellation deadline. */
  freeCancel?: boolean;
};

/** Bookings at the partner's rooms, newest stay first. Statuses are as of sampleToday. */
export const hostReservations: HostReservation[] = [
  {
    code: "ML-9D2P6R",
    guestId: "lena.fischer",
    listingId: "seongsu-standard",
    from: "2026-12-12",
    to: "2027-03-12",
    guests: 1,
    status: "request",
    replyBy: "2026-11-14T08:30:00+09:00",
    note: {
      lang: "de",
      text: {
        ko: "안녕하세요! 12월 중순부터 서울에서 석 달 동안 연구 연수를 해요. 조용히 일할 수 있는 곳을 찾고 있는데, 방에 책상이 있나요?",
        en: "Hello! I'm on a three-month research stay in Seoul from mid-December. I'm looking for somewhere quiet to work – is there a desk in the room?",
        ja: "こんにちは！12月中旬から3か月、ソウルで研究滞在をします。静かに仕事ができる場所を探しているのですが、部屋に机はありますか？",
        "zh-CN": "你好！我从12月中旬开始在首尔做三个月的研究访问，正在找能安静工作的地方。房间里有书桌吗？",
        de: "Hallo! Ich bin ab Mitte Dezember für einen dreimonatigen Forschungsaufenthalt in Seoul und suche einen ruhigen Ort zum Arbeiten – gibt es im Zimmer einen Schreibtisch?",
      },
    },
  },
  { code: "ML-5H8K3T", guestId: "james.w", listingId: "seongsu-premium", from: "2026-11-20", to: "2026-11-27", guests: 1, status: "upcoming" },
  { code: "ML-8C3M6V", guestId: "jiyoon.han", listingId: "seongsu-standard", from: "2026-11-13", to: "2026-12-11", guests: 1, status: "staying" },
  { code: "ML-2B7N4Q", guestId: "yui.tanaka", listingId: "geondae-double", from: "2026-11-10", to: "2026-11-13", guests: 1, status: "staying" },
  { code: "ML-7Q4K2M", guestId: "seojin.yun", listingId: "seongsu-window", from: "2026-11-02", to: "2026-11-30", guests: 1, status: "staying" },
  { code: "ML-2W8F5J", guestId: "minho.kim", listingId: "sinchon-single", from: "2026-10-26", to: "2026-11-23", guests: 1, status: "staying" },
  { code: "ML-6T3Q8B", guestId: "tom.k", listingId: "geondae-single", from: "2026-11-01", to: "2026-11-08", guests: 1, status: "past" },
  { code: "ML-4K9T2X", guestId: "tom.k", listingId: "seongsu-premium", from: "2026-10-05", to: "2026-10-08", guests: 1, status: "cancelled", freeCancel: true },
  { code: "ML-6F4R9W", guestId: "lukas.b", listingId: "seongsu-window", from: "2026-06-01", to: "2026-09-01", guests: 1, status: "past" },
  { code: "ML-7M2C8D", guestId: "seojin.yun", listingId: "sinchon-single", from: "2026-03-02", to: "2026-04-06", guests: 1, status: "past" },
  { code: "ML-5P9V3H", guestId: "seojin.yun", listingId: "geondae-single", from: "2026-02-09", to: "2026-02-15", guests: 1, status: "past" },
];

/** Days the host closed (from, to: the last night is the day before `to`). */
export const blockedDates: { listingId: string; from: string; to: string; reason: Text }[] = [
  {
    listingId: "seongsu-window",
    from: "2026-12-24",
    to: "2026-12-27",
    reason: { ko: "시설 점검", en: "Maintenance check", ja: "設備点検", "zh-CN": "设施检修", de: "Wartung" },
  },
  {
    listingId: "seongsu-premium",
    from: "2026-11-16",
    to: "2026-11-18",
    reason: { ko: "도배 공사", en: "Redecorating", ja: "壁紙の張り替え", "zh-CN": "重新贴壁纸", de: "Renovierung" },
  },
];

export function getReservation(code: string): HostReservation | undefined {
  return hostReservations.find((reservation) => reservation.code === code);
}

/**
 * What one booking is worth: to the partner (the nights less the branch's operating fee, plus
 * cleaning), to the guest (what they paid) and to MONTHLIV (the operating fee; guests pay no fee).
 */
export function hostEarnings(reservation: HostReservation) {
  const listing = getListing(reservation.listingId);
  const nights = nightsBetween(reservation.from, reservation.to);
  if (!listing) return { nights, stay: 0, cleaning: 0, fee: 0, feePercent: 0, payout: 0, guestTotal: 0, guestFee: 0 };
  const host = hostQuote(listing, nights);
  const guest = quote(listing, nights);
  return {
    nights,
    stay: host.stay,
    cleaning: host.cleaning,
    fee: host.fee,
    feePercent: feePercentOf(listing),
    payout: host.payout,
    guestTotal: guest.total,
    guestFee: guest.service,
  };
}

export type Payout = { code: string; date: string; amount: number; part: number; parts: number };

/**
 * Payouts: the day after check-in, and for stays of 28 nights or more one more each 28 nights,
 * split by nights. Requests and cancelled bookings pay nothing.
 */
export function payoutsOf(reservation: HostReservation): Payout[] {
  if (reservation.status === "request" || reservation.status === "cancelled") return [];
  const { nights, payout } = hostEarnings(reservation);
  const parts = Math.max(1, Math.ceil(nights / 28));
  if (nights < 28 || parts === 1) {
    return [{ code: reservation.code, date: addDays(reservation.from, 1), amount: payout, part: 1, parts: 1 }];
  }
  const out: Payout[] = [];
  let paid = 0;
  for (let part = 0; part < parts; part += 1) {
    const partNights = Math.min(28, nights - part * 28);
    const amount = part === parts - 1 ? payout - paid : Math.round((payout * partNights) / nights / 10) * 10;
    paid += amount;
    out.push({ code: reservation.code, date: addDays(reservation.from, part * 28 + 1), amount, part: part + 1, parts });
  }
  return out;
}

/** Nights of `listingId` booked within the month (YYYY-MM). */
export function bookedNightsIn(listingId: string, month: string): number {
  const first = `${month}-01`;
  const next = addDays(first, 32).slice(0, 7) + "-01";
  return hostReservations
    .filter((reservation) => reservation.listingId === listingId && reservation.status !== "request" && reservation.status !== "cancelled")
    .reduce((sum, reservation) => {
      const from = reservation.from > first ? reservation.from : first;
      const to = reservation.to < next ? reservation.to : next;
      return sum + Math.max(0, nightsBetween(from, to));
    }, 0);
}

/** Days in a month (YYYY-MM). */
export function daysIn(month: string): number {
  return nightsBetween(`${month}-01`, addDays(`${month}-01`, 32).slice(0, 7) + "-01");
}

/**
 * Where a booking stands on `today`: requests and cancellations as they are, otherwise by the
 * dates. The check-out day still counts as staying until the guest leaves.
 */
export function statusOn(reservation: HostReservation, today: string): ReservationStatus {
  if (reservation.status === "request" || reservation.status === "cancelled") return reservation.status;
  if (reservation.to < today) return "past";
  if (reservation.from > today) return "upcoming";
  return "staying";
}

/** Member IDs the host may send a coupon to: guests with a booking at the host's places. */
export function sendableGuests(): string[] {
  return [...new Set(hostReservations.filter((item) => item.status !== "request").map((item) => item.guestId))];
}

/** Payouts on hold, with why. */
export const payoutHolds: { code: string; reason: Text }[] = [
  {
    code: "ML-8C3M6V",
    reason: {
      ko: "출입 문제 문의(T-2041)를 확인하는 동안 첫 정산을 멈췄어요",
      en: "First payout paused while the access ticket (T-2041) is checked",
    },
  },
];
