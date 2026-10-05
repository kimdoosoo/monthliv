/**
 * The admin's sample data: members, listings waiting for review, support tickets and payout
 * holds. Bookings and coupons come from the same samples the guest and host screens use, and
 * "today" is the same sample day.
 *
 * The admin shows names masked and phone numbers never; a member's details open only when a
 * task needs them (and every look is logged, once the back office is connected).
 */
import { hostGuests, hostId, hostReservations, type HostReservation } from "./host";

export { payoutHolds } from "./host";
import type { Text } from "./listings";

export type MemberRole = "guest" | "host" | "both";

export type Member = {
  id: string;
  name: string;
  role: MemberRole;
  joined: string;
  verified: boolean;
  /** Agreed to advertising messages (needed before sending promotional notices). */
  marketing: boolean;
  status: "active" | "suspended";
  country: string;
};

export const members: Member[] = [
  { id: "seojin.yun", name: "윤서진", role: "guest", joined: "2025-03-14", verified: true, marketing: false, status: "active", country: "KR" },
  { id: "sample.partner", name: "예시점주", role: "host", joined: "2024-02-02", verified: true, marketing: false, status: "active", country: "KR" },
  { id: "jiyoon.han", name: "한지윤", role: "guest", joined: "2024-08-21", verified: true, marketing: true, status: "active", country: "KR" },
  { id: "minho.kim", name: "김민호", role: "guest", joined: "2023-11-05", verified: true, marketing: false, status: "active", country: "KR" },
  { id: "yui.tanaka", name: "Tanaka Yui", role: "guest", joined: "2026-05-30", verified: true, marketing: true, status: "active", country: "JP" },
  { id: "james.w", name: "James Walker", role: "guest", joined: "2025-12-01", verified: true, marketing: false, status: "active", country: "GB" },
  { id: "lena.fischer", name: "Lena Fischer", role: "guest", joined: "2026-09-18", verified: true, marketing: true, status: "active", country: "DE" },
  { id: "lukas.b", name: "Lukas Braun", role: "guest", joined: "2025-04-11", verified: true, marketing: false, status: "active", country: "DE" },
  { id: "tom.k", name: "Tom Kelly", role: "guest", joined: "2026-08-02", verified: true, marketing: false, status: "active", country: "IE" },
  { id: "seohyun.j", name: "정서현", role: "host", joined: "2024-06-12", verified: true, marketing: false, status: "active", country: "KR" },
  { id: "sora.lee", name: "이소라", role: "both", joined: "2025-01-20", verified: true, marketing: true, status: "active", country: "KR" },
  { id: "bora.k", name: "강보라", role: "host", joined: "2026-10-28", verified: false, marketing: false, status: "active", country: "KR" },
  { id: "no.show99", name: "박도윤", role: "guest", joined: "2026-07-07", verified: false, marketing: false, status: "suspended", country: "KR" },
];

export function getMember(id: string): Member | undefined {
  return members.find((member) => member.id === id);
}

/** 윤서진 → 윤*진, James Walker → J**** W*****: enough to tell people apart, not to identify them. */
export function maskName(name: string): string {
  if (/^[ㄱ-힝]+$/.test(name)) {
    if (name.length <= 2) return `${name[0]}*`;
    return `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}`;
  }
  return name
    .split(" ")
    .map((part) => `${part[0]}${"*".repeat(Math.max(1, part.length - 1))}`)
    .join(" ");
}

/** Bookings the admin sees: the sample partner's bookings plus one at another partner's branch. */
export const allReservations: (HostReservation & { hostId: string; title?: Text })[] = [
  ...hostReservations.map((item) => ({ ...item, hostId })),
  {
    code: "ML-3H8C5N",
    guestId: "seojin.yun",
    hostId: "seohyun.j",
    listingId: "wangsimni-single",
    from: "2026-07-17",
    to: "2026-07-20",
    guests: 1,
    status: "past",
  },
];

/** Rooms waiting for review before they go on the site: what the branch sent and what's missing. */
export const reviewQueue: {
  key: string;
  hostId: string;
  title: Text;
  area: Text;
  type: "studio" | "share" | "coliving" | "stay" | "hostel" | "residence" | "guesthouse";
  submitted: string;
  photos: number;
  registration: "uploaded" | "missing";
  nightly: number;
}[] = [
  {
    key: "hwagok-premium",
    hostId: "sora.lee",
    title: { ko: "화곡 스테이 · 프리미엄 룸", en: "Hwagok Stay · Premium Room" },
    area: { ko: "강서구 화곡동", en: "Hwagok-dong, Gangseo-gu" },
    type: "stay",
    submitted: "2026-11-11",
    photos: 9,
    registration: "uploaded",
    nightly: 27800,
  },
  {
    key: "bulgwang-family",
    hostId: "bora.k",
    title: { ko: "불광 호스텔 · 패밀리룸", en: "Bulgwang Hostel · Family Room" },
    area: { ko: "은평구 불광동", en: "Bulgwang-dong, Eunpyeong-gu" },
    type: "hostel",
    submitted: "2026-11-12",
    photos: 4,
    registration: "missing",
    nightly: 89000,
  },
];

export type Ticket = {
  id: string;
  memberId: string;
  booking?: string;
  topic: "access" | "refund" | "receipt" | "review" | "registration";
  priority: "urgent" | "normal";
  status: "open" | "waiting" | "done";
  opened: string;
  message: Text;
};

export const tickets: Ticket[] = [
  {
    id: "T-2041",
    memberId: "jiyoon.han",
    booking: "ML-8C3M6V",
    topic: "access",
    priority: "urgent",
    status: "open",
    opened: "2026-11-13T15:20:00+09:00",
    message: {
      ko: "공동현관 비밀번호는 열리는데 방 현관문이 안 열려요. 지금 문 앞이에요.",
      en: "The building door opens with the code, but my room's door doesn't. I'm standing outside it now.",
    },
  },
  {
    id: "T-2038",
    memberId: "tom.k",
    booking: "ML-4K9T2X",
    topic: "refund",
    priority: "normal",
    status: "waiting",
    opened: "2026-10-03T11:02:00+09:00",
    message: {
      ko: "무료 취소 기간에 취소했는데 환불이 언제 들어오는지 궁금해요.",
      en: "I cancelled within the free-cancellation period. When will the refund arrive?",
    },
  },
  {
    id: "T-2033",
    memberId: "sora.lee",
    topic: "registration",
    priority: "normal",
    status: "open",
    opened: "2026-11-11T09:40:00+09:00",
    message: {
      ko: "화곡 스테이 프리미엄 룸 등록증을 올렸어요. 확인 부탁드려요.",
      en: "I've uploaded the registration for the Hwagok Stay premium room. Could you check it?",
    },
  },
  {
    id: "T-2019",
    memberId: "minho.kim",
    booking: "ML-2W8F5J",
    topic: "receipt",
    priority: "normal",
    status: "done",
    opened: "2026-10-27T18:15:00+09:00",
    message: {
      ko: "회사 제출용으로 현금영수증을 다시 받고 싶어요.",
      en: "I need the cash receipt again to hand in at work.",
    },
  },
];

/** Whether a member agreed to advertising notices (coupons sent to them still reach the wallet). */
export function hasAdConsent(id: string): boolean {
  return members.some((member) => member.id === id && member.marketing);
}

/** Every member ID the admin may send a coupon to (suspended members excluded). */
export function couponRecipients(): string[] {
  return members.filter((member) => member.status === "active").map((member) => member.id);
}

/** Members by segment, for sending coupons in bulk. */
export function segment(key: "consented" | "noBooking" | "longStay"): string[] {
  // A request isn't a booking until the host accepts it.
  const real = allReservations.filter((item) => item.status !== "cancelled" && item.status !== "request");
  const booked = new Set(real.map((item) => item.guestId));
  const long = new Set(
    real.filter((item) => Date.parse(item.to) - Date.parse(item.from) >= 28 * 86_400_000).map((item) => item.guestId),
  );
  const active = members.filter((member) => member.status === "active" && member.role !== "host");
  if (key === "consented") return active.filter((member) => member.marketing).map((member) => member.id);
  if (key === "noBooking") return active.filter((member) => !booked.has(member.id)).map((member) => member.id);
  return active.filter((member) => long.has(member.id)).map((member) => member.id);
}

/** First names as the host centre knows them, for members who are guests there. */
export function firstName(id: string, locale: string): string | undefined {
  const guest = hostGuests[id];
  if (!guest) return undefined;
  return guest.name[locale as keyof typeof guest.name] ?? guest.name.en;
}
