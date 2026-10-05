import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { DoneButton } from "@/components/DoneButton";
import { HostShell } from "@/components/HostShell";
import { blockedDates, hostGuests, hostPlaces, hostReservations, statusBadge, statusOn } from "@/data/host";
import { getListing, pick } from "@/data/listings";
import { sampleToday } from "@/data/samples";
import { Link } from "@/i18n/navigation";
import { formatCount, formatMonthYear, formatPrice, formatRange } from "@/lib/format";
import { addDays } from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pms");
  return { title: t("calendar.title"), robots: { index: false } };
}

const monthPattern = /^20\d{2}-(0[1-9]|1[0-2])$/;

/** Months from `a` to `b` (YYYY-MM). */
function monthsBetween(a: string, b: string): number {
  return (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7));
}

function shiftMonth(month: string, by: number): string {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, number - 1 + by, 1));
  return date.toISOString().slice(0, 7);
}

/**
 * One place's month: booked nights carry the guest's name on their first night, closed days are
 * hatched, open days show the 1-night price. ?listing= picks the place, ?month=YYYY-MM the month.
 */
export default async function HostCalendarPage({ searchParams }: PageProps<"/[locale]/host/calendar">) {
  const locale = await getLocale();
  const t = await getTranslations();
  const params = await searchParams;
  const places = hostPlaces.filter((place) => place.status === "listed" && place.listingId);
  const placeId = places.some((place) => place.listingId === params.listing)
    ? String(params.listing)
    : places[0].listingId!;
  // Two years either side of today; anything else (or a malformed month) shows this month.
  const asked = typeof params.month === "string" && monthPattern.test(params.month) ? params.month : null;
  const month =
    asked && Math.abs(monthsBetween(sampleToday.slice(0, 7), asked)) <= 24 ? asked : sampleToday.slice(0, 7);
  const listing = getListing(placeId)!;
  const today = sampleToday;

  const first = `${month}-01`;
  const lead = new Date(`${first}T00:00:00Z`).getUTCDay();
  const nextMonth = shiftMonth(month, 1);
  const days: string[] = [];
  for (let day = first; day < `${nextMonth}-01`; day = addDays(day, 1)) days.push(day);

  const bookings = hostReservations.filter(
    (item) => item.listingId === placeId && item.status !== "cancelled" && item.from < `${nextMonth}-01` && item.to > first,
  );
  const blocks = blockedDates.filter((item) => item.listingId === placeId);
  const bookingOn = (day: string) => bookings.find((item) => item.from <= day && day < item.to);
  const blockOn = (day: string) => blocks.find((item) => item.from <= day && day < item.to);
  const weekday = (index: number) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 10, 1 + index)));
  const query = (extra: Record<string, string>) => ({ listing: placeId, month, ...extra });

  return (
    <HostShell current="calendar" wide>
      <div className="lv-workhead">
        <div>
          <h1 className="lv-workhead__h1">{t("pms.calendar.title")}</h1>
          <p className="lv-sub">{t("pms.calendar.lead")}</p>
        </div>
      </div>

      <nav className="lv-chips lv-chips--scroll" aria-label={t("pms.calendar.places")}>
        {places.map((place) => {
          const item = getListing(place.listingId!)!;
          return (
            <Link
              key={place.key}
              className="lv-chip"
              href={{ pathname: "/host/calendar", query: { listing: item.id, month } }}
              aria-current={item.id === placeId ? "page" : undefined}
              scroll={false}
            >
              {pick(item.title, locale)}
            </Link>
          );
        })}
      </nav>

      <div className="lv-calwork">
        <section className="lv-editcard lv-calwork__main" aria-labelledby="month-title">
          <div className="lv-calhead">
            <Link
              className="lv-iconbtn"
              href={{ pathname: "/host/calendar", query: query({ month: shiftMonth(month, -1) }) }}
              aria-label={t("pms.calendar.prev")}
              scroll={false}
            >
              <ChevronLeft size={22} strokeWidth={1.75} aria-hidden="true" />
            </Link>
            <h2 id="month-title" className="lv-editcard__title">
              {formatMonthYear(first, locale)}
            </h2>
            <Link
              className="lv-iconbtn"
              href={{ pathname: "/host/calendar", query: query({ month: nextMonth }) }}
              aria-label={t("pms.calendar.next")}
              scroll={false}
            >
              <ChevronRight size={22} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>
          <ol className="lv-hostcal" aria-label={pick(listing.title, locale)}>
            {Array.from({ length: 7 }, (_, index) => (
              <li key={`w${index}`} className="lv-hostcal__wd" aria-hidden="true">
                {weekday(index)}
              </li>
            ))}
            {Array.from({ length: lead }, (_, index) => (
              <li key={`e${index}`} className="lv-hostcal__empty" aria-hidden="true" />
            ))}
            {days.map((day) => {
              const booking = bookingOn(day);
              const block = blockOn(day);
              const status = booking ? statusOn(booking, today) : null;
              const starts = booking && (booking.from === day || day === first || new Date(`${day}T00:00:00Z`).getUTCDay() === 0);
              const guest = booking ? hostGuests[booking.guestId] : undefined;
              const classes = [
                "lv-hostcal__day",
                booking ? (status === "request" ? "is-request" : "is-booked") : "",
                block ? "is-blocked" : "",
                day === today ? "is-today" : "",
                day < today ? "is-past" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <li key={day} className={classes}>
                  <span className="lv-hostcal__num">{Number(day.slice(8))}</span>
                  {booking ? (
                    starts ? (
                      <Link className="lv-hostcal__who" href={`/host/reservations/${booking.code}`}>
                        {guest ? pick(guest.name, locale) : booking.guestId}
                      </Link>
                    ) : (
                      <span className="lv-sr">
                        {t(`pms.status.${status ?? "upcoming"}`)} · {guest ? pick(guest.name, locale) : booking.guestId}
                      </span>
                    )
                  ) : block ? (
                    day === block.from || day === first ? (
                      <span className="lv-hostcal__note">{pick(block.reason, locale)}</span>
                    ) : (
                      <span className="lv-sr">{t("pms.calendar.legendBlocked")}</span>
                    )
                  ) : (
                    <span className="lv-hostcal__price">
                      <span className="lv-sr">
                        {t("pms.calendar.open")} · {formatPrice(listing.nightly, locale)}
                      </span>
                      <span className="lv-hostcal__amount" aria-hidden="true">
                        {formatCount(listing.nightly, locale)}
                      </span>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          <ul className="lv-legend">
            <li><span className="lv-legend__swatch is-booked" aria-hidden="true" />{t("pms.calendar.legendBooked")}</li>
            <li><span className="lv-legend__swatch is-request" aria-hidden="true" />{t("pms.calendar.legendRequest")}</li>
            <li><span className="lv-legend__swatch is-blocked" aria-hidden="true" />{t("pms.calendar.legendBlocked")}</li>
            <li><span className="lv-legend__swatch" aria-hidden="true" />{t("pms.calendar.legendOpen")}</li>
          </ul>
        </section>

        <aside className="lv-calwork__side">
          <form className="lv-editcard" action="#">
            <h2 className="lv-editcard__title">{t("pms.calendar.blockTitle")}</h2>
            <div className="lv-editcard__grid">
              <label className="lv-field">
                <span className="lv-field__label lv-field__label--plain">{t("pms.calendar.from")}</span>
                <input className="lv-input" type="date" defaultValue={`${month}-20`} />
              </label>
              <label className="lv-field">
                <span className="lv-field__label lv-field__label--plain">{t("pms.calendar.to")}</span>
                <input className="lv-input" type="date" defaultValue={`${month}-22`} />
              </label>
            </div>
            <label className="lv-field">
              <span className="lv-field__label lv-field__label--plain">{t("pms.calendar.reason")}</span>
              <input className="lv-input" placeholder={t("pms.calendar.reasonPlaceholder")} />
            </label>
            <DoneButton className="lv-btn lv-btn--night" label={t("pms.calendar.block")} done={t("pms.calendar.blocked")} />
          </form>

          <form className="lv-editcard" action="#">
            <h2 className="lv-editcard__title">{t("pms.calendar.priceTitle")}</h2>
            <p className="lv-small">{t("pms.calendar.priceLead", { price: formatCount(listing.nightly, locale) })}</p>
            <label className="lv-field">
              <span className="lv-field__label lv-field__label--plain">{t("pricing.nightly")}</span>
              <span className="lv-amount">
                <input inputMode="numeric" defaultValue={formatCount(listing.nightly + 5000, locale)} />
                <span aria-hidden="true">{t("pricing.won")}</span>
              </span>
            </label>
            <DoneButton className="lv-btn" label={t("pms.calendar.applyPrice")} done={t("pms.calendar.priceApplied")} />
            <Link className="lv-link lv-self-start" href={{ pathname: "/host/pricing", query: { listing: placeId } }}>
              {t("pms.calendar.discounts")}
            </Link>
          </form>

          <section className="lv-editcard" aria-labelledby="list-title">
            <h2 id="list-title" className="lv-editcard__title">
              {t("pms.calendar.thisMonth")}
            </h2>
            {bookings.length === 0 ? (
              <p className="lv-small">{t("pms.calendar.noBookings")}</p>
            ) : (
              <ul className="lv-rows">
                {bookings.map((item) => {
                  const status = statusOn(item, today);
                  const guest = hostGuests[item.guestId];
                  return (
                    <li key={item.code} className="lv-rows__row">
                      <span className="lv-rows__main">
                        <Link className="lv-table__link" href={`/host/reservations/${item.code}`}>
                          {guest ? pick(guest.name, locale) : item.guestId}
                        </Link>
                        <span className="lv-small">{formatRange(item.from, item.to, locale)}</span>
                      </span>
                      <span className={`lv-badge lv-badge--sm ${statusBadge[status]}`}>{t(`pms.status.${status}`)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </HostShell>
  );
}
