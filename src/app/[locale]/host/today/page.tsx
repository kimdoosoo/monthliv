import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { DoneButton } from "@/components/DoneButton";
import { HostShell } from "@/components/HostShell";
import { MoonIcon, Star } from "@/components/MoonIcon";
import {
  bookedNightsIn,
  daysIn,
  hostGuests,
  hostPlaces,
  hostReservations,
  payoutHolds,
  payoutsOf,
  samplePartner,
  statusOn,
} from "@/data/host";
import { getListing, pick } from "@/data/listings";
import { sampleToday } from "@/data/samples";
import { Link } from "@/i18n/navigation";
import { formatDayWeekday, formatPrice, formatRange, formatRating, formatTime } from "@/lib/format";
import { nightsBetween, stayDay, stayLengthFor } from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pms");
  return { title: t("today.title"), robots: { index: false } };
}

/**
 * The host centre's first page: what needs an answer, who arrives and leaves today, who is
 * staying, and the month in numbers. "Today" is the sample day the guest screens use.
 */
export default async function HostTodayPage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const today = sampleToday;
  const month = today.slice(0, 7);

  const requests = hostReservations.filter((item) => item.status === "request");
  const arriving = hostReservations.filter((item) => item.status !== "cancelled" && item.status !== "request" && item.from === today);
  const leaving = hostReservations.filter((item) => item.status !== "cancelled" && item.to === today);
  const staying = hostReservations.filter(
    (item) => statusOn(item, today) === "staying" && item.from !== today && item.to !== today,
  );
  const listed = hostPlaces.filter((place) => place.status === "listed" && place.listingId);
  const booked = listed.reduce((sum, place) => sum + bookedNightsIn(place.listingId!, month), 0);
  const capacity = listed.length * daysIn(month);
  const monthPayouts = hostReservations
    .flatMap(payoutsOf)
    .filter((payout) => payout.date.slice(0, 7) === month)
    .reduce((sum, payout) => sum + payout.amount, 0);
  const held = new Set(payoutHolds.map((hold) => hold.code));
  const nextPayout = hostReservations
    .flatMap(payoutsOf)
    .filter((payout) => payout.date > today && !held.has(payout.code))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  // Only rooms with reviews count; new branches have none yet.
  const ratings = listed
    .map((place) => getListing(place.listingId!))
    .filter((listing) => listing && listing.reviews > 0)
    .map((listing) => listing!.rating);
  const rating = ratings.reduce((sum, value) => sum + value, 0) / Math.max(1, ratings.length);

  const guestName = (id: string) => pick(hostGuests[id]?.name ?? { ko: id, en: id }, locale);
  const placeName = (id: string) => {
    const listing = getListing(id);
    return listing ? pick(listing.title, locale) : id;
  };

  const stats = [
    { key: "payouts", value: formatPrice(monthPayouts, locale) },
    { key: "occupancy", value: `${Math.round((booked / Math.max(1, capacity)) * 100)}%` },
    { key: "requests", value: String(requests.length) },
    { key: "rating", value: ratings.length > 0 ? formatRating(rating, locale) : "–" },
  ] as const;

  return (
    <HostShell current="today">
      <div className="lv-workhead">
        <div>
          <p className="lv-workhead__date">
            {formatDayWeekday(today, locale)} · {t("pms.sampleDay")}
          </p>
          <h1 className="lv-workhead__h1">{t("pms.today.hello", { name: pick(samplePartner.name, locale) })}</h1>
        </div>
        <div className="lv-btnrow">
          <Link className="lv-btn lv-btn--sm" href="/host/calendar">
            {t("pms.today.blockDates")}
          </Link>
          <Link className="lv-btn lv-btn--sm" href="/host/coupons">
            {t("pms.today.sendCoupon")}
          </Link>
        </div>
      </div>

      <ul className="lv-stats" aria-label={t("pms.today.monthLabel", { month: formatRange(`${month}-01`, `${month}-${String(daysIn(month)).padStart(2, "0")}`, locale) })}>
        {stats.map(({ key, value }) => (
          <li key={key} className="lv-stat">
            <span className="lv-stat__label">{t(`pms.today.stats.${key}`)}</span>
            <b className="lv-stat__value">
              {key === "rating" && ratings.length > 0 && <Star size={22} />}
              {value}
            </b>
            <span className="lv-small">
              {key === "payouts" && nextPayout
                ? t("pms.today.nextPayout", { date: formatDayWeekday(nextPayout.date, locale), amount: formatPrice(nextPayout.amount, locale) })
                : key === "occupancy"
                  ? t("pms.today.occupancyNote", { booked, capacity })
                  : key === "requests"
                    ? t("pms.today.requestsNote")
                    : ratings.length > 0
                      ? t("pms.today.ratingNote", { count: ratings.length })
                      : t("pms.today.noRatings")}
            </span>
          </li>
        ))}
      </ul>

      <section className="lv-editcard" aria-labelledby="req-title">
        <h2 id="req-title" className="lv-editcard__title">
          {t("pms.today.requestsTitle")}
        </h2>
        {requests.length === 0 && <p className="lv-sub">{t("pms.today.noRequests")}</p>}
        {requests.map((item) => {
          const nights = nightsBetween(item.from, item.to);
          return (
            <div key={item.code} className="lv-request">
              <div className="lv-request__who">
                <span className="lv-avatar lv-avatar--sm" aria-hidden="true">
                  {guestName(item.guestId).slice(0, 2)}
                </span>
                <span>
                  <b>{guestName(item.guestId)}</b>
                  <span className="lv-small">
                    {placeName(item.listingId)} · {formatRange(item.from, item.to, locale)} ·{" "}
                    {t("price.nights", { nights })}
                  </span>
                </span>
                <span className="lv-badge lv-badge--moon lv-badge--sm">
                  <MoonIcon length={stayLengthFor(nights)} size={14} />
                  {t(`length.${stayLengthFor(nights)}`)}
                </span>
              </div>
              {item.note && (
                <blockquote className="lv-request__note">
                  <p>{pick(item.note.text, locale)}</p>
                  {item.note.lang !== locale && (
                    <span className="lv-small">{t("pms.today.translated")}</span>
                  )}
                </blockquote>
              )}
              <div className="lv-request__act">
                <DoneButton className="lv-btn lv-btn--night lv-btn--sm" label={t("pms.accept")} done={t("pms.accepted")} />
                <DoneButton className="lv-btn lv-btn--sm" label={t("pms.decline")} done={t("pms.declined")} />
                <Link className="lv-link" href={`/host/reservations/${item.code}`}>
                  {t("pms.details")}
                </Link>
                {item.replyBy && (
                  <span className="lv-small lv-request__due">
                    {t("pms.today.replyBy", {
                      date: formatDayWeekday(item.replyBy.slice(0, 10), locale),
                      time: formatTime(item.replyBy.slice(11, 16), locale),
                    })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <div className="lv-worksplit">
        <section className="lv-editcard" aria-labelledby="day-title">
          <h2 id="day-title" className="lv-editcard__title">
            {t("pms.today.dayTitle")}
          </h2>
          <ul className="lv-rows">
            {arriving.map((item) => (
              <li key={`in-${item.code}`} className="lv-rows__row">
                <span className="lv-badge lv-badge--celadon lv-badge--sm">{t("pms.today.checkIn")}</span>
                <span className="lv-rows__main">
                  <b>{guestName(item.guestId)} · {placeName(item.listingId)}</b>
                  <span className="lv-small">{t("pms.today.checkInNote")}</span>
                </span>
                <Link className="lv-link" href={`/host/reservations/${item.code}`}>
                  {t("pms.details")}
                </Link>
              </li>
            ))}
            {leaving.map((item) => (
              <li key={`out-${item.code}`} className="lv-rows__row">
                <span className="lv-badge lv-badge--sm">{t("pms.today.checkOut")}</span>
                <span className="lv-rows__main">
                  <b>{guestName(item.guestId)} · {placeName(item.listingId)}</b>
                  <span className="lv-small">{t("pms.today.checkOutNote")}</span>
                </span>
                <DoneButton className="lv-btn lv-btn--xs" label={t("pms.today.bookCleaning")} done={t("pms.today.cleaningBooked")} />
              </li>
            ))}
          </ul>
        </section>

        <section className="lv-editcard" aria-labelledby="stay-title">
          <h2 id="stay-title" className="lv-editcard__title">
            {t("pms.today.stayingTitle")}
          </h2>
          <ul className="lv-rows">
            {staying.map((item) => {
              const nights = nightsBetween(item.from, item.to);
              const day = stayDay(item.from, today);
              return (
                <li key={item.code} className="lv-rows__row">
                  <span className="lv-rows__main">
                    <b>{guestName(item.guestId)} · {placeName(item.listingId)}</b>
                    <span className="lv-small">
                      {t("stays.dayOf", { day, nights })} · {formatRange(item.from, item.to, locale)}
                    </span>
                    <span className="lv-progress lv-progress--thin" aria-hidden="true">
                      <span style={{ width: `${Math.round((day / nights) * 100)}%` }} />
                    </span>
                  </span>
                  <Link className="lv-link" href={`/host/reservations/${item.code}`}>
                    {t("pms.details")}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </HostShell>
  );
}
