import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileTabBar } from "@/components/MobileTabBar";
import { MoonDot } from "@/components/MoonIcon";
import { PhotoSlot } from "@/components/PhotoSlot";
import { getListing, pick, sampleHost } from "@/data/listings";
import { pastStays, sampleBooking, sampleGuest, sampleToday, upcomingRequest } from "@/data/samples";
import { Link } from "@/i18n/navigation";
import { formatDate, formatDayWeekday, formatMonthYear, formatPrice, formatTime } from "@/lib/format";
import { addDays, nightsBetween, quote, splitTotal, stayDay, stayLengthFor } from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("stays");
  return { title: t("title") };
}

/**
 * Bookings: the place you live now, requests waiting for a host, stays that are over, and what
 * has been paid. A sample guest for now; this page will need a login.
 */
export default async function MyStaysPage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const listing = getListing(sampleBooking.listingId);
  if (!listing) return null;

  const nights = nightsBetween(sampleBooking.from, sampleBooking.to);
  const price = quote(listing, nights);
  const [first, second] = splitTotal(price.total);
  const day = stayDay(sampleBooking.from, sampleToday);
  const host = pick(sampleHost.name, locale);
  const stayHref = `/my-stays/${sampleBooking.code}`;
  const cover = listing.real?.photos[0];
  const upcomingNights = nightsBetween(upcomingRequest.from, upcomingRequest.to);
  const upcomingLength = stayLengthFor(upcomingNights);

  return (
    <div className="lv-page lv-has-tabbar">
      <Header member current="trips" />

      <main className="lv-wrap lv-wrap--narrow lv-trips">
        <h1 className="lv-h1">{t("stays.title")}</h1>

        <section className="lv-trips__sec" aria-labelledby="now-title">
          <h2 id="now-title" className="lv-h3">
            {t("stays.now")}
          </h2>
          <div className="lv-nowcard">
            <PhotoSlot
              tone={listing.tone}
              className="lv-nowcard__photo"
              photo={cover && { listingId: listing.id, photo: cover }}
              sizes="(max-width: 900px) 100vw, 400px"
              decorative
            />
            <div className="lv-nowcard__body">
              <span className="lv-badge lv-badge--celadon">{t("stays.dayOf", { day, nights })}</span>
              <div>
                <h3 className="lv-nowcard__title">{pick(listing.title, locale)}</h3>
                <p className="lv-sub">
                  {t("stays.nowMeta", {
                    area: pick(listing.area, locale),
                    host,
                    date: formatDayWeekday(sampleBooking.to, locale),
                    time: formatTime(sampleBooking.checkOut, locale),
                  })}
                </p>
              </div>
              <div
                className="lv-progress"
                role="progressbar"
                aria-label={t("stays.progress")}
                aria-valuemin={0}
                aria-valuemax={nights}
                aria-valuenow={day}
              >
                <span style={{ width: `${Math.round((day / nights) * 100)}%` }} />
              </div>
              <div className="lv-btnrow">
                <Link className="lv-btn lv-btn--moon lv-btn--sm" href={stayHref}>
                  {t("stays.open")}
                </Link>
                <Link className="lv-btn lv-btn--sm" href={{ pathname: stayHref, hash: "extend" }}>
                  {t("stays.extend")}
                </Link>
                <Link className="lv-btn lv-btn--sm lv-btn--plain" href="/messages">
                  {t("stays.messageHost", { name: host })}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="lv-trips__sec" aria-labelledby="next-title">
          <h2 id="next-title" className="lv-h3">
            {t("stays.upcoming")}
          </h2>
          <div className="lv-reqcard">
            <PhotoSlot tone={upcomingRequest.tone} className="lv-reqcard__photo" />
            <div className="lv-reqcard__body">
              <h3 className="lv-reqcard__title">{pick(upcomingRequest.title, locale)}</h3>
              <p className="lv-sub">
                {t("stays.requestMeta", {
                  area: pick(upcomingRequest.area, locale),
                  from: formatDate(upcomingRequest.from, locale),
                  to: formatDate(upcomingRequest.to, locale),
                  nights: upcomingNights,
                })}
              </p>
              <p className="lv-chips">
                <span className="lv-badge lv-badge--moon">
                  <MoonDot size={16} />
                  {t("stays.lengthOff", { length: t(`length.${upcomingLength}`), percent: upcomingRequest.discount })}
                </span>
                <span className="lv-badge">{t("stays.pending")}</span>
              </p>
            </div>
            <Link className="lv-btn lv-btn--sm" href="/messages">
              {t("stays.viewRequest")}
            </Link>
          </div>
        </section>

        <section className="lv-trips__sec" aria-labelledby="past-title">
          <h2 id="past-title" className="lv-h3">
            {t("stays.past")}
          </h2>
          <div className="lv-pastgrid">
            {pastStays.map((stay) => {
              const place = stay.listingId ? getListing(stay.listingId) : undefined;
              const title = place ? pick(place.title, locale) : stay.title ? pick(stay.title, locale) : "";
              const area = place ? pick(place.area, locale) : stay.area ? pick(stay.area, locale) : "";
              const photo = place?.real?.photos[0];
              return (
                <article key={stay.key} className="lv-past">
                  <PhotoSlot
                    tone={stay.tone}
                    className="lv-past__photo"
                    photo={photo && place && { listingId: place.id, photo }}
                    sizes="(max-width: 900px) 100vw, 360px"
                    decorative
                  />
                  <h3 className="lv-past__title">{title}</h3>
                  <p className="lv-small">
                    {t("stays.pastMeta", {
                      area,
                      nights: nightsBetween(stay.from, stay.to),
                      date: formatMonthYear(stay.from, locale),
                    })}
                  </p>
                  {stay.action === "review" ? (
                    <Link className="lv-link lv-self-start" href="/account/reviews">
                      {t("stays.writeReview")}
                    </Link>
                  ) : (
                    place && (
                      <Link className="lv-link lv-self-start" href={`/stays/${place.id}`}>
                        {t("stays.rebook")}
                      </Link>
                    )
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="lv-trips__sec" id="payments" aria-labelledby="pay-title">
          <h2 id="pay-title" className="lv-h3">
            {t("stays.payments")}
          </h2>
          <div className="lv-paylist">
            <div className="lv-payrow">
              <div>
                <p className="lv-payrow__t">{t("stays.firstPayment")}</p>
                <p className="lv-small">
                  {formatDate(sampleBooking.bookedOn, locale)} · {t("book.savedCard", { last4: sampleGuest.card })} ·{" "}
                  {sampleBooking.code}
                </p>
              </div>
              <div className="lv-payrow__amt">
                <b>{formatPrice(first, locale)}</b>
                <span className="lv-badge lv-badge--celadon lv-badge--sm">{t("stays.paid")}</span>
              </div>
            </div>
            <div className="lv-payrow">
              <div>
                <p className="lv-payrow__t">{t("stays.secondPayment")}</p>
                <p className="lv-small">
                  {formatDate(addDays(sampleBooking.from, Math.floor(nights / 2)), locale)} · {t("stays.sameCard")}
                </p>
              </div>
              <div className="lv-payrow__amt">
                <b>{formatPrice(second, locale)}</b>
                <span className="lv-badge lv-badge--sm">{t("stays.scheduled")}</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileTabBar active="trips" member unread />
    </div>
  );
}
