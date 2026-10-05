import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { isOpen, pick, sampleTrip, type Listing } from "@/data/listings";
import { Link } from "@/i18n/navigation";
import { formatMonth, formatPrice, formatRating } from "@/lib/format";
import { nightsBetween, quote } from "@/lib/pricing";
import { todayInSeoul, tripQuery } from "@/lib/trip";
import { MoonDot, Star } from "./MoonIcon";
import { PhotoSlot } from "./PhotoSlot";
import { SaveButton } from "./SaveButton";

/**
 * One stay in a list: photo, name, ★ rating, where it is and the price for the trip.
 * - `night` (home, saved): the 1-night price after the stay-length discount, the old one struck
 *   through, then the stay: "1박 ~~40,000원~~ 30,000원 · 28박 840,000원".
 * - `total` (search): the full price first — cleaning and service fee in it — then the 1-night
 *   price and discount: "총 922,000원 / 1박 30,000원 · 25% 할인".
 */
export function ListingCard({
  listing,
  trip,
  mode = "night",
  saved = false,
  compact = false,
  active = false,
  children,
}: {
  listing: Listing;
  trip: { from: string; to: string; guests?: number };
  mode?: "night" | "total";
  saved?: boolean;
  compact?: boolean;
  /** Outlined: the card whose pin is picked on the map. */
  active?: boolean;
  /** Extra lines under the price, e.g. a note on a saved list. */
  children?: ReactNode;
}) {
  const t = useTranslations();
  const locale = useLocale();

  const nights = nightsBetween(trip.from, trip.to);
  const price = quote(listing, nights);
  const title = pick(listing.title, locale);
  const rating = formatRating(listing.rating, locale);
  const cover = listing.real?.photos[0];
  const discounted = price.discountPercent > 0;
  // A branch that hasn't opened yet says when it opens, in place of "new".
  const opens = listing.opens && !isOpen(listing, todayInSeoul()) ? listing.opens : undefined;
  // Dates other than the sample trip travel with the link, so the listing shows the same price.
  const guests = trip.guests ?? sampleTrip.guests;
  const query =
    trip.from === sampleTrip.from && trip.to === sampleTrip.to && guests === sampleTrip.guests
      ? undefined
      : tripQuery({ from: trip.from, to: trip.to, guests });
  const where =
    mode === "total"
      ? t(listing.by === "car" ? "card.drive" : "card.walk", {
          station: pick(listing.station, locale),
          minutes: listing.minutes,
        })
      : pick(listing.area, locale);

  return (
    <article
      className={`lv-lcard${compact ? " lv-lcard--compact" : ""}`}
      data-on={active || undefined}
      data-id={listing.id}
    >
      <Link className="lv-lcard__link" href={{ pathname: `/stays/${listing.id}`, query }}>
        <PhotoSlot
          className="lv-lcard__photo"
          tone={listing.tone}
          photo={cover && { listingId: listing.id, photo: cover }}
          sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw"
          slogan={listing.place && pick(listing.place, locale)}
          decorative
        >
          {discounted && mode === "night" && (
            <span className="lv-badge lv-badge--photo lv-lcard__badge">
              <MoonDot size={16} />
              {t("price.discountBadge", {
                length: t(`lengthName.${price.length}`),
                percent: price.discountPercent,
                nights,
              })}
            </span>
          )}
        </PhotoSlot>
        <span className="lv-lcard__body">
          <span className="lv-lcard__top">
            <span className="lv-lcard__title">{title}</span>
            {opens ? (
              <span className="lv-soon">{t("card.opens", { month: formatMonth(`${opens}-01`, locale) })}</span>
            ) : listing.reviews > 0 ? (
              <span className="lv-rating">
                <Star />
                <span aria-hidden="true">{rating}</span>
                <span className="lv-sr">{t("card.ratingLabel", { rating })}</span>
              </span>
            ) : (
              <span className="lv-new">
                <span aria-hidden="true">{t("card.new")}</span>
                <span className="lv-sr">{t("card.newLabel")}</span>
              </span>
            )}
          </span>
          <span className="lv-lcard__meta">
            {where} · {pick(listing.type, locale)}
          </span>
          {mode === "total" ? (
            <>
              <span className="lv-lcard__price">
                {t.rich("price.totalRich", {
                  amount: formatPrice(price.total, locale),
                  b: (chunks) => <b>{chunks}</b>,
                })}
              </span>
              <span className="lv-lcard__per">
                {discounted
                  ? t("price.perNightOff", {
                      price: formatPrice(price.nightlyAfter, locale),
                      percent: price.discountPercent,
                    })
                  : t("price.perNight", { price: formatPrice(price.nightlyAfter, locale) })}
              </span>
            </>
          ) : (
            <span className="lv-lcard__price">
              {t.rich(discounted ? "price.nightWas" : "price.night", {
                was: formatPrice(price.nightly, locale),
                price: formatPrice(price.nightlyAfter, locale),
                nights,
                stay: formatPrice(price.nightlyAfter * nights, locale),
                s: (chunks) => (
                  <>
                    <s>{chunks}</s>
                    <span className="lv-sr">{t("price.was")}</span>
                  </>
                ),
                b: (chunks) => <b>{chunks}</b>,
              })}
            </span>
          )}
        </span>
      </Link>
      {children}
      <SaveButton label={t("card.save", { title })} initial={saved} />
    </article>
  );
}
