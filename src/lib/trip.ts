import { sampleTrip } from "@/data/listings";
import { nightsBetween } from "./pricing";

export type TripDates = { from: string; to: string; guests: number };

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The dates and guests in a page address (?from=2026-11-02&to=2026-11-30&guests=1), checked.
 * Anything missing or out of range falls back to the sample trip, so prices always show.
 */
export function tripFromParams(params: Record<string, string | string[] | undefined>): TripDates {
  const from = one(params.from);
  const to = one(params.to);
  const guests = Number(one(params.guests));
  const datesOk =
    from !== undefined &&
    to !== undefined &&
    isoDate.test(from) &&
    isoDate.test(to) &&
    !Number.isNaN(Date.parse(from)) &&
    !Number.isNaN(Date.parse(to)) &&
    nightsBetween(from, to) >= 1 &&
    nightsBetween(from, to) <= 365;
  return {
    from: datesOk ? from : sampleTrip.from,
    to: datesOk ? to : sampleTrip.to,
    guests: Number.isInteger(guests) && guests >= 1 && guests <= 8 ? guests : sampleTrip.guests,
  };
}

/** The trip as page-address values, to carry it from search to a listing and on to checkout. */
export function tripQuery(trip: TripDates): Record<string, string> {
  return { from: trip.from, to: trip.to, guests: String(trip.guests) };
}

/** Today's date in Seoul as YYYY-MM-DD (for opening days; pages built ahead use the build day). */
export function todayInSeoul(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}
