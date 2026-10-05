import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { HostShell } from "@/components/HostShell";
import { PhotoSlot } from "@/components/PhotoSlot";
import { Star } from "@/components/MoonIcon";
import { bookedNightsIn, daysIn, hostPlaces } from "@/data/host";
import { getListing, pick } from "@/data/listings";
import { sampleToday } from "@/data/samples";
import { Link } from "@/i18n/navigation";
import { formatPrice, formatRating } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pms");
  return { title: t("listings.title"), robots: { index: false } };
}

const registrationBadge = { checked: "lv-badge--celadon", checking: "lv-badge--moon", missing: "lv-badge--danger" } as const;

/** The host's places: status, registration check, prices, this month's bookings, and edits. */
export default async function HostListingsPage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const month = sampleToday.slice(0, 7);

  return (
    <HostShell current="listings">
      <div className="lv-workhead">
        <div>
          <h1 className="lv-workhead__h1">{t("pms.listings.title")}</h1>
          <p className="lv-sub">{t("pms.listings.lead", { count: hostPlaces.length })}</p>
        </div>
        <Link className="lv-btn lv-btn--moon lv-btn--sm" href={{ pathname: "/host/listing", query: { listing: "new" } }}>
          <Plus size={18} strokeWidth={2} aria-hidden="true" />
          {t("pms.listings.add")}
        </Link>
      </div>

      <ul className="lv-placelist">
        {hostPlaces.map((place) => {
          const listing = place.listingId ? getListing(place.listingId) : undefined;
          const title = listing ? pick(listing.title, locale) : place.title ? pick(place.title, locale) : place.key;
          const booked = listing ? bookedNightsIn(listing.id, month) : 0;
          const days = daysIn(month);
          return (
            <li key={place.key} className="lv-placerow">
              <PhotoSlot tone={place.tone} className="lv-placerow__photo" decorative />
              <div className="lv-placerow__main">
                <div className="lv-placerow__badges">
                  <span className={`lv-badge lv-badge--sm${place.status === "listed" ? " lv-badge--celadon" : ""}`}>
                    {t(`pms.listings.status.${place.status}`)}
                  </span>
                  <span className={`lv-badge lv-badge--sm ${registrationBadge[place.registration]}`}>
                    {t(`pms.listings.registration.${place.registration}`)}
                  </span>
                </div>
                <b className="lv-placerow__title">{title}</b>
                {listing ? (
                  <span className="lv-small">
                    {pick(listing.area, locale)} · {t("pms.listings.nightly", { price: formatPrice(listing.nightly, locale) })} ·{" "}
                    {t("pms.listings.discounts", {
                      week: listing.discounts.week,
                      month: listing.discounts.month,
                      season: listing.discounts.season,
                    })}
                  </span>
                ) : (
                  <span className="lv-small">{t("pms.listings.draftNote")}</span>
                )}
              </div>
              {listing && (
                <div className="lv-placerow__nums">
                  <span>
                    <b>{Math.round((booked / days) * 100)}%</b>
                    <span className="lv-small">{t("pms.listings.booked", { booked, days })}</span>
                  </span>
                  <span>
                    <b>
                      <Star /> {formatRating(listing.rating, locale)}
                    </b>
                    <span className="lv-small">{t("listing.reviews", { count: listing.reviews })}</span>
                  </span>
                </div>
              )}
              <div className="lv-placerow__act">
                {listing ? (
                  <>
                    <Link className="lv-btn lv-btn--xs" href={{ pathname: "/host/pricing", query: { listing: listing.id } }}>
                      {t("pms.listings.editPrices")}
                    </Link>
                    <Link className="lv-btn lv-btn--xs" href={{ pathname: "/host/listing", query: { listing: listing.id } }}>
                      {t("pms.listings.editInfo")}
                    </Link>
                    <Link className="lv-btn lv-btn--xs" href={{ pathname: "/host/calendar", query: { listing: listing.id } }}>
                      {t("pms.nav.calendar")}
                    </Link>
                    <Link className="lv-link" href={`/stays/${listing.id}`}>
                      {t("pricing.preview")}
                    </Link>
                  </>
                ) : (
                  <Link className="lv-btn lv-btn--xs" href={{ pathname: "/host/listing", query: { listing: place.key } }}>
                    {t("pms.listings.continue")}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </HostShell>
  );
}
