/**
 * Prices are shown as totals: the whole stay, with taxes and cleaning in it.
 * Every place can be booked from one night. Longer stays move the whole booking to a lower
 * nightly price (each branch sets its discounts):
 *
 *   night  1–6 nights    the 1-night price
 *   week   7–27 nights   week discount
 *   month  28–89 nights  month discount
 *   season 90+ nights    season discount
 *
 * Fees (MONTHLIV): guests pay no fee — they see the branch's price as it is. At payout the
 * branch's operating fee comes off the price for the nights: 10% at branches MONTHLIV built
 * (직영공사), from 15% at the others. Cleaning has no fee.
 */

export type StayLength = "night" | "week" | "month" | "season";

/** Discounts in per cent of the 1-night price. */
export type Discounts = { week: number; month: number; season: number };

export const defaultDiscounts: Discounts = { week: 10, month: 25, season: 35 };

export const stayTiers: { length: StayLength; from: number; to: number | null }[] = [
  { length: "night", from: 1, to: 6 },
  { length: "week", from: 7, to: 27 },
  { length: "month", from: 28, to: 89 },
  { length: "season", from: 90, to: null },
];

/**
 * MONTHLIV's fees in basis points (hundredths of a per cent), so the sums stay in whole numbers.
 * There is no guest fee. The operating fee is set per branch (`Listing.feeBps`) and comes off the
 * price for the nights at payout; these are the defaults for new branches.
 */
export const guestFeeBps = 0;
/** Operating fee at branches MONTHLIV built (직영공사). */
export const directFeeBps = 1000;
/** Where the operating fee starts at branches another firm built; agreed branch by branch. */
export const otherFeeBps = 1500;
/** The operating fee when a place doesn't say. */
export const hostFeeBps = directFeeBps;

/** The same rates in per cent, for showing: 0, 10 and 15. */
export const guestFeePercent = guestFeeBps / 100;
export const directFeePercent = directFeeBps / 100;
export const otherFeePercent = otherFeeBps / 100;
export const hostFeePercent = hostFeeBps / 100;

/** A place's operating fee in per cent. */
export function feePercentOf(place: { feeBps?: number }): number {
  return (place.feeBps ?? hostFeeBps) / 100;
}

/** A host's price as guests see it: the guest fee in, to the nearest ₩10 so the fee stays exact. */
function withGuestFee(hostPrice: number): number {
  return Math.round((hostPrice * (10_000 + guestFeeBps)) / 10_000 / 10) * 10;
}

/** The 1-night price guests see for a host's 1-night price. */
export function guestNightly(hostNightly: number): number {
  return withGuestFee(hostNightly);
}

export function stayLengthFor(nights: number): StayLength {
  if (nights >= 90) return "season";
  if (nights >= 28) return "month";
  if (nights >= 7) return "week";
  return "night";
}

export function discountFor(discounts: Discounts, length: StayLength): number {
  return length === "night" ? 0 : discounts[length];
}

/**
 * The nightly price for a stay length. Discounted prices round down to ₩100, so the guest
 * always gets at least the discount shown.
 */
export function nightlyFor(nightly: number, discounts: Discounts, length: StayLength): number {
  const percent = discountFor(discounts, length);
  if (percent === 0) return nightly;
  return Math.floor((nightly * (100 - percent)) / 100 / 100) * 100;
}

/**
 * The nightly price guests see for a stay length: the host's price for that length with the guest
 * fee in, but never more than the guest's 1-night price less the discount shown.
 */
export function guestNightlyFor(hostNightly: number, discounts: Discounts, length: StayLength): number {
  const percent = discountFor(discounts, length);
  const fromHost = withGuestFee(nightlyFor(hostNightly, discounts, length));
  if (percent === 0) return fromHost;
  const cap = Math.floor((guestNightly(hostNightly) * (100 - percent)) / 100 / 10) * 10;
  return Math.min(fromHost, cap);
}

export type Priced = {
  nightly: number;
  discounts: Discounts;
  cleaning: number;
  /** The branch's operating fee in basis points; hostFeeBps when missing. */
  feeBps?: number;
};

/** What a stay costs the guest. Every price in it has the guest fee in. */
export type Quote = {
  nights: number;
  length: StayLength;
  /** The 1-night price before any discount. */
  nightly: number;
  /** The nightly price this stay gets. */
  nightlyAfter: number;
  /** nights × 1-night price */
  base: number;
  discountPercent: number;
  discount: number;
  cleaning: number;
  /** The guest fee inside the nights (0 at MONTHLIV; shown as included, never added). */
  service: number;
  total: number;
};

/**
 * The full price of a stay: everything the guest pays, nothing added later.
 * The stay is the guest's nightly price (guestNightlyFor) × nights, so the price a night shown on
 * a page and the breakdown always agree.
 */
export function quote(place: Priced, nights: number): Quote {
  const length = stayLengthFor(nights);
  const discountPercent = discountFor(place.discounts, length);
  const nightly = guestNightly(place.nightly);
  const nightlyAfter = guestNightlyFor(place.nightly, place.discounts, length);
  const base = nightly * nights;
  const stay = nightlyAfter * nights;
  const hostStay = nightlyFor(place.nightly, place.discounts, length) * nights;
  return {
    nights,
    length,
    nightly,
    nightlyAfter,
    base,
    discountPercent,
    discount: base - stay,
    cleaning: place.cleaning,
    service: stay - hostStay,
    total: stay + place.cleaning,
  };
}

/** What a stay pays the branch's partner (점주), in the branch's own prices. */
export type HostQuote = {
  nights: number;
  length: StayLength;
  /** The host's 1-night price. */
  nightly: number;
  /** The host's nightly price for this stay. */
  nightlyAfter: number;
  /** The host's price for the nights. */
  stay: number;
  cleaning: number;
  /** The operating fee on the nights, rounded down to the won (in the partner's favour). */
  fee: number;
  /** The nights less the operating fee, plus cleaning. */
  payout: number;
};

export function hostQuote(place: Priced, nights: number): HostQuote {
  const length = stayLengthFor(nights);
  const nightlyAfter = nightlyFor(place.nightly, place.discounts, length);
  const stay = nightlyAfter * nights;
  const fee = Math.floor((stay * (place.feeBps ?? hostFeeBps)) / 10_000);
  return {
    nights,
    length,
    nightly: place.nightly,
    nightlyAfter,
    stay,
    cleaning: place.cleaning,
    fee,
    payout: stay - fee + place.cleaning,
  };
}

/** Nights between two dates written as YYYY-MM-DD. */
export function nightsBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

/** YYYY-MM-DD plus or minus whole days. */
export function addDays(date: string, days: number): string {
  const time = Date.parse(`${date}T00:00:00Z`) + days * 86_400_000;
  return new Date(time).toISOString().slice(0, 10);
}

/** Which day of the stay a date is: the check-in day is day 1. */
export function stayDay(checkIn: string, today: string): number {
  return nightsBetween(checkIn, today) + 1;
}

/** Free cancellation ends at 3 pm, 7 days before check-in. */
export function freeCancellationDate(checkIn: string): string {
  return addDays(checkIn, -7);
}

/** Stays of 28 nights or more can be paid in two parts. */
export const splitFromNights = 28;

/** A split payment: half today, rounded up to ₩10, and the rest halfway through the stay. */
export function splitTotal(total: number): [number, number] {
  const first = Math.ceil(total / 2 / 10) * 10;
  return [first, total - first];
}
