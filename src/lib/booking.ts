import {
  checkCoupon,
  findCouponByCode,
  sampleGuestId,
  todayInSeoul,
  walletCoupon,
  type Coupon,
} from "@/data/coupons";
import type { Listing } from "@/data/listings";
import { quote, splitFromNights, splitTotal, type Quote } from "./pricing";
import { nightsBetween } from "./pricing";
import { tripFromParams, type TripDates } from "./trip";

type Params = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export type BookingSummary = {
  trip: TripDates;
  nights: number;
  price: Quote;
  coupon?: Coupon;
  couponAmount: number;
  total: number;
  plan: "now" | "split";
  /** Today and later, when the plan is split. */
  payments: [number] | [number, number];
  method: "card" | "kakaopay" | "naverpay" | "tosspay";
};

const methods = ["card", "kakaopay", "naverpay", "tosspay"] as const;

/**
 * What a booking comes to, from the checkout's answers in the address: the dates, the coupon
 * (checked again here), when to pay and how. Used by the confirmation page.
 */
export function bookingFromParams(listing: Listing, params: Params): BookingSummary {
  const trip = tripFromParams(params);
  const nights = nightsBetween(trip.from, trip.to);
  const price = quote(listing, nights);
  const code = one(params.code);
  const id = one(params.coupon);
  let coupon = code ? findCouponByCode(code) : id ? walletCoupon(id, sampleGuestId) : undefined;
  let couponAmount = 0;
  if (coupon) {
    const check = checkCoupon(coupon, {
      listingId: listing.id,
      nights,
      total: price.total,
      today: todayInSeoul(),
      memberId: sampleGuestId,
    });
    if (check.ok) couponAmount = check.amount;
    else coupon = undefined;
  }
  const total = price.total - couponAmount;
  const plan = one(params.when) === "split" && nights >= splitFromNights ? "split" : "now";
  const methodParam = one(params.method);
  const method = methods.includes(methodParam as (typeof methods)[number])
    ? (methodParam as (typeof methods)[number])
    : "card";
  return {
    trip,
    nights,
    price,
    coupon,
    couponAmount,
    total,
    plan,
    payments: plan === "split" ? splitTotal(total) : [total],
    method,
  };
}
