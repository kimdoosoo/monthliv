import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft, CircleAlert, TicketPercent } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MoonIcon, Star } from "@/components/MoonIcon";
import { PhotoSlot } from "@/components/PhotoSlot";
import { PriceBreakdown } from "@/components/PriceBreakdown";
import {
  checkCoupon,
  findCouponByCode,
  sampleGuestId,
  todayInSeoul,
  walletCoupon,
  walletOf,
  type Coupon,
} from "@/data/coupons";
import { getListing, hasSelfCheckIn, listings, pick, sampleHost } from "@/data/listings";
import { sampleGuest } from "@/data/samples";
import { Link } from "@/i18n/navigation";
import { formatDayWeekday, formatPrice, formatRating } from "@/lib/format";
import {
  addDays,
  freeCancellationDate,
  nightsBetween,
  quote,
  splitFromNights,
  splitTotal,
} from "@/lib/pricing";
import { tripFromParams, tripQuery } from "@/lib/trip";

export function generateStaticParams() {
  return listings.map((listing) => ({ id: listing.id }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("book");
  return { title: t("title") };
}

const methods = ["card", "kakaopay", "naverpay", "tosspay"] as const;
const issuers = ["shinhan", "hyundai", "samsung", "kb", "lotte", "hana", "bc", "woori"] as const;
const installments = ["full", "two", "three", "six"] as const;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Check and pay: the dates, when to pay, how, a coupon, a hello to the host and the cancellation
 * terms; the price on the side. Coupons are picked or typed through the address
 * (?coupon=welcome or ?code=LIVA-AUTUMN), so the server checks them and every amount agrees.
 */
export default async function CheckoutPage({ params, searchParams }: PageProps<"/[locale]/book/[id]">) {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing) notFound();

  const locale = await getLocale();
  const t = await getTranslations();
  const query = await searchParams;

  const trip = tripFromParams(query);
  const nights = nightsBetween(trip.from, trip.to);
  const price = quote(listing, nights);
  const host = pick(listing.real?.host.name ?? sampleHost.name, locale);
  const cover = listing.real?.photos[0];
  const title = pick(listing.title, locale);
  const today = todayInSeoul();
  const booking = { listingId: listing.id, nights, total: price.total, today, memberId: sampleGuestId };

  // The coupon: one from the wallet (?coupon=ID) or a typed code (?code=…).
  const typed = one(query.code)?.trim() ?? "";
  const picked = one(query.coupon);
  let coupon: Coupon | undefined;
  let couponError: string | undefined;
  if (typed) {
    coupon = findCouponByCode(typed);
    if (!coupon) couponError = t("coupon.errors.notFound");
  } else if (picked) {
    coupon = walletCoupon(picked, sampleGuestId);
  }
  let couponAmount = 0;
  if (coupon) {
    const check = checkCoupon(coupon, booking);
    if (check.ok) {
      couponAmount = check.amount;
    } else {
      couponError = t(`coupon.errors.${check.reason}`, {
        nights: coupon.minNights ?? 0,
        amount: formatPrice(coupon.minTotal ?? 0, locale),
      });
      coupon = undefined;
    }
  }
  const total = price.total - couponAmount;
  const [first, second] = splitTotal(total);
  const canSplit = nights >= splitFromNights;
  const secondOn = addDays(trip.from, Math.floor(nights / 2));
  const wallet = walletOf(sampleGuestId).map((item) => ({ item, check: checkCoupon(item, booking) }));
  const baseQuery = tripQuery(trip);
  const couponQuery = coupon
    ? coupon.audience === "code"
      ? { code: coupon.code }
      : { coupon: coupon.id }
    : {};

  return (
    <div className="lv-page">
      <Header slim />

      <main className="lv-wrap lv-wrap--narrow lv-checkout">
        <div className="lv-titlebar">
          <Link className="lv-back" href={{ pathname: `/stays/${listing.id}`, query: baseQuery }} aria-label={t("book.back")}>
            <ChevronLeft size={22} strokeWidth={1.75} aria-hidden="true" />
          </Link>
          <h1 className="lv-h1 lv-h1--sm">{t("book.title")}</h1>
        </div>

        <div className="lv-checkout__grid">
          {/* Sends the trip, the payment choices and the coupon to the confirmation page. */}
          <form className="lv-checkout__main" action={`/${locale}/book/${listing.id}/confirmed`} method="get">
            {Object.entries({ ...baseQuery, ...couponQuery }).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}

            <section className="lv-csec lv-csec--first" aria-labelledby="trip-title">
              <h2 id="trip-title" className="lv-h3">
                {t("book.trip")}
              </h2>
              <div className="lv-csec__row">
                <div>
                  <p className="lv-csec__k">{t("book.dates")}</p>
                  <p className="lv-csec__v">
                    {t("book.datesValue", {
                      from: formatDayWeekday(trip.from, locale),
                      to: formatDayWeekday(trip.to, locale),
                      nights,
                    })}
                  </p>
                </div>
                <Link className="lv-link" href={{ pathname: `/stays/${listing.id}`, query: baseQuery }}>
                  {t("book.change")}
                </Link>
              </div>
              <div className="lv-csec__row">
                <div>
                  <p className="lv-csec__k">{t("search.guestsLabel")}</p>
                  <p className="lv-csec__v">{t("search.guests", { count: trip.guests })}</p>
                </div>
                <Link className="lv-link" href={{ pathname: `/stays/${listing.id}`, query: baseQuery }}>
                  {t("book.change")}
                </Link>
              </div>
            </section>

            <section className="lv-csec" aria-labelledby="when-title">
              <h2 id="when-title" className="lv-h3">
                {t("book.whenPay")}
              </h2>
              <div
                className="lv-csec__group"
                role="radiogroup"
                aria-labelledby="when-title"
                aria-describedby={canSplit ? undefined : "split-note"}
              >
              <label className="lv-payopt">
                <span>
                  <span className="lv-payopt__t">{t("book.payNow", { amount: formatPrice(total, locale) })}</span>
                  <span className="lv-payopt__d">{t("book.payNowText")}</span>
                </span>
                <input type="radio" name="when" value="now" defaultChecked />
              </label>
              {canSplit ? (
                <label className="lv-payopt">
                  <span>
                    <span className="lv-payopt__t">{t("book.paySplit")}</span>
                    <span className="lv-payopt__d">
                      {t("book.paySplitText", {
                        first: formatPrice(first, locale),
                        date: formatDayWeekday(secondOn, locale),
                        second: formatPrice(second, locale),
                      })}
                    </span>
                  </span>
                  <input type="radio" name="when" value="split" />
                </label>
              ) : (
                <p id="split-note" className="lv-small">
                  {t("book.splitFrom")}
                </p>
              )}
              </div>
            </section>

            <section className="lv-csec" aria-labelledby="method-title">
              <h2 id="method-title" className="lv-h3">
                {t("book.method")}
              </h2>
              <div className="lv-methods" role="radiogroup" aria-labelledby="method-title">
                {methods.map((method) => (
                  <label className="lv-method" key={method}>
                    <input type="radio" name="method" value={method} defaultChecked={method === "card"} />
                    {method === "card" ? t("book.savedCard", { last4: sampleGuest.card }) : t(`book.methods.${method}`)}
                  </label>
                ))}
              </div>
              <div className="lv-twocol">
                <label className="lv-field">
                  <span className="lv-field__label lv-field__label--plain">{t("book.issuer")}</span>
                  <select className="lv-select" defaultValue="shinhan">
                    {issuers.map((issuer) => (
                      <option key={issuer} value={issuer}>
                        {t(`book.issuers.${issuer}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="lv-field">
                  <span className="lv-field__label lv-field__label--plain">{t("book.installments")}</span>
                  <select className="lv-select" defaultValue="full">
                    {installments.map((plan) => (
                      <option key={plan} value={plan}>
                        {t(`book.plans.${plan}`)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="lv-csec" id="coupon" aria-labelledby="coupon-title">
              <div className="lv-csec__head">
                <h2 id="coupon-title" className="lv-h3">
                  {t("coupon.title")}
                </h2>
                <p className="lv-small">{t("coupon.lead")}</p>
              </div>
              <ul className="lv-couponlist">
                <li>
                  <Link
                    className="lv-couponopt"
                    href={{ pathname: `/book/${listing.id}`, query: baseQuery, hash: "coupon" }}
                    aria-current={!coupon ? "true" : undefined}
                    scroll={false}
                  >
                    <span className="lv-couponopt__radio" aria-hidden="true" />
                    <span className="lv-couponopt__t">{t("coupon.none")}</span>
                  </Link>
                </li>
                {wallet.map(({ item, check }) => (
                  <li key={item.id}>
                    {check.ok ? (
                      <Link
                        className="lv-couponopt"
                        href={{
                          pathname: `/book/${listing.id}`,
                          query: { ...baseQuery, coupon: item.id },
                          hash: "coupon",
                        }}
                        aria-current={coupon?.id === item.id ? "true" : undefined}
                        scroll={false}
                      >
                        <span className="lv-couponopt__radio" aria-hidden="true" />
                        <span className="lv-couponopt__body">
                          <span className="lv-couponopt__t">{pick(item.title, locale)}</span>
                          <span className="lv-couponopt__d">
                            {t("coupon.until", { date: formatDayWeekday(item.expires, locale) })}
                          </span>
                        </span>
                        <b className="lv-couponopt__amount">−{formatPrice(check.amount, locale)}</b>
                      </Link>
                    ) : (
                      <div className="lv-couponopt is-off">
                        <span className="lv-couponopt__radio" aria-hidden="true" />
                        <span className="lv-couponopt__body">
                          <span className="lv-couponopt__t">{pick(item.title, locale)}</span>
                          <span className="lv-couponopt__d">
                            {t(`coupon.errors.${check.reason}`, {
                              nights: item.minNights ?? 0,
                              amount: formatPrice(item.minTotal ?? 0, locale),
                            })}
                          </span>
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="lv-couponcode">
                <label className="lv-field">
                  <span className="lv-field__label lv-field__label--plain">{t("coupon.codeLabel")}</span>
                  <input
                    className="lv-input"
                    form="lv-coupon-form"
                    name="code"
                    defaultValue={typed}
                    placeholder={t("coupon.codePlaceholder")}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                  />
                </label>
                <button className="lv-btn lv-btn--night" form="lv-coupon-form" type="submit">
                  {t("coupon.apply")}
                </button>
              </div>
              {couponError && (
                <p className="lv-note lv-note--danger" role="alert">
                  <CircleAlert size={18} strokeWidth={1.75} aria-hidden="true" />
                  {couponError}
                </p>
              )}
              {coupon && (
                <p className="lv-note lv-note--celadon" role="status">
                  <TicketPercent size={18} strokeWidth={1.75} aria-hidden="true" />
                  {t("coupon.applied", { title: pick(coupon.title, locale), amount: formatPrice(couponAmount, locale) })}
                </p>
              )}
            </section>

            <section className="lv-csec" aria-labelledby="hello-title">
              <h2 id="hello-title" className="lv-h3">
                {t("book.hello", { name: host })}
              </h2>
              <label className="lv-field">
                <span className="lv-hint">{t("book.helloHint")}</span>
                <textarea className="lv-textarea" rows={4} placeholder={t("book.helloPlaceholder", { name: host })} />
              </label>
              <label className="lv-field">
                <span className="lv-field__label lv-field__label--plain">{t("book.phone")}</span>
                <input className="lv-input" type="tel" autoComplete="tel" placeholder={t("book.phonePlaceholder")} />
                <span className="lv-hint">{t(hasSelfCheckIn(listing) ? "book.phoneHint" : "book.phoneHintGuide")}</span>
              </label>
            </section>

            <section className="lv-csec" aria-labelledby="cancel-title">
              <h2 id="cancel-title" className="lv-h3">
                {t("book.cancelTitle")}
              </h2>
              <p className="lv-csec__text">
                {listing.freeCancellation ? (
                  <>
                    <b>
                      {t("book.freeUntil", { date: formatDayWeekday(freeCancellationDate(trip.from), locale) })}
                    </b>{" "}
                    {t("book.cancelText")}
                  </>
                ) : (
                  t("book.cancelTextNone")
                )}
              </p>
            </section>

            <div className="lv-checkout__pay">
              <p className="lv-small">{t("book.agree")}</p>
              <button className="lv-btn lv-btn--moon lv-checkout__go" type="submit">
                {/* The label follows the payment choice above (see .lv-pay in pages.css). */}
                <span className="lv-pay lv-pay--now">{t("book.confirm", { amount: formatPrice(total, locale) })}</span>
                {canSplit && (
                  <span className="lv-pay lv-pay--split">
                    {t("book.confirmSplit", { amount: formatPrice(first, locale) })}
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* The code box above belongs to this form: it reloads checkout with the code. */}
          <form id="lv-coupon-form" action={`/${locale}/book/${listing.id}#coupon`} method="get" hidden>
            {Object.entries(baseQuery).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
          </form>

          <aside className="lv-checkout__side" aria-label={t("book.priceDetails")}>
            <div className="lv-summary">
              <div className="lv-summary__stay">
                <PhotoSlot
                  tone={listing.tone}
                  className="lv-summary__photo"
                  photo={cover && { listingId: listing.id, photo: cover }}
                  sizes="112px"
                  decorative
                />
                <div>
                  <p className="lv-summary__title">{title}</p>
                  <p className="lv-small">
                    {pick(listing.type, locale)} · {pick(listing.area, locale)}
                  </p>
                  {listing.reviews > 0 ? (
                    <p className="lv-rating lv-summary__rating">
                      <Star />
                      {formatRating(listing.rating, locale)} · {t("listing.reviews", { count: listing.reviews })}
                    </p>
                  ) : (
                    <p className="lv-summary__rating">
                      <span className="lv-new">{t("card.new")}</span>
                    </p>
                  )}
                </div>
              </div>
              {price.discount > 0 && (
                <p className="lv-bookcard__stay">
                  <MoonIcon length={price.length} size={22} />
                  {t("book.saving", {
                    length: t(`length.${price.length}`),
                    amount: formatPrice(price.discount, locale),
                  })}
                </p>
              )}
              <div className="lv-summary__price">
                <h2 className="lv-h4">{t("book.priceDetails")}</h2>
                <PriceBreakdown
                  price={price}
                  coupon={coupon && { label: t("coupon.line", { title: pick(coupon.title, locale) }), amount: couponAmount }}
                />
                <p className="lv-small">{t("book.krw")}</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
