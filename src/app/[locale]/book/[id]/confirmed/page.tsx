import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PhotoSlot } from "@/components/PhotoSlot";
import { cityOf, getListing, hasSelfCheckIn, listings, pick, sampleHost } from "@/data/listings";
import { sampleBooking, sampleGuest } from "@/data/samples";
import { Link } from "@/i18n/navigation";
import { bookingFromParams } from "@/lib/booking";
import { formatDayWeekday, formatPrice, formatTime } from "@/lib/format";
import { addDays, freeCancellationDate } from "@/lib/pricing";

export function generateStaticParams() {
  return listings.map((listing) => ({ id: listing.id }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("confirmed");
  return { title: t("metaTitle") };
}

/** A calendar file for the stay, as a link the browser downloads (no server needed). */
function calendarLink(title: string, from: string, to: string, code: string): string {
  const day = (date: string) => date.replaceAll("-", "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MONTHLIV//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${code}@booking.monthliv`,
    `DTSTAMP:${day(from)}T000000Z`,
    `DTSTART;VALUE=DATE:${day(from)}`,
    `DTEND;VALUE=DATE:${day(to)}`,
    `SUMMARY:${title} (${code})`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}

/**
 * Booking confirmed: the night panel with the slippers by the door, then the stay, what happens
 * next and what was paid. One moon button.
 */
export default async function ConfirmedPage({ params, searchParams }: PageProps<"/[locale]/book/[id]/confirmed">) {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing) notFound();

  const locale = await getLocale();
  const t = await getTranslations();
  const booking = bookingFromParams(listing, await searchParams);
  const { trip, nights, price } = booking;
  const host = pick(listing.real?.host.name ?? sampleHost.name, locale);
  const title = pick(listing.title, locale);
  const cover = listing.real?.photos[0];
  // The exact address belongs to a real booking. This preview page opens without one, so a
  // real place shows its area only; sample places show where the address will go.
  const real = Boolean(listing.real);
  const address = real
    ? t("confirmed.addressAfter", { area: pick(listing.area, locale), city: pick(cityOf(listing), locale) })
    : t("confirmed.addressValue", { area: pick(listing.area, locale), city: pick(cityOf(listing), locale) });
  const at = (date: string, time: string) =>
    t("confirmed.at", { date: formatDayWeekday(date, locale), time: formatTime(time, locale) });
  const secondOn = addDays(trip.from, Math.floor(nights / 2));

  const bold = (chunks: ReactNode) => <b>{chunks}</b>;
  const steps = [
    { key: "hello", done: true, text: t.rich("confirmed.stepHello", { when: t("confirmed.today"), name: host, b: bold }) },
    // Only places with free cancellation get this step.
    ...(listing.freeCancellation
      ? [
          {
            key: "free",
            done: false,
            text: t.rich("confirmed.stepFree", { when: at(freeCancellationDate(trip.from), "15:00"), b: bold }),
          },
        ]
      : []),
    // A real place's check-in times and door code aren't confirmed, so its steps carry no times.
    {
      key: "code",
      done: false,
      text: real
        ? t("confirmed.stepInfoReal", { name: host })
        : t.rich(hasSelfCheckIn(listing) ? "confirmed.stepCode" : "confirmed.stepInfo", {
            when: at(trip.from, sampleBooking.doorCodeAt),
            b: bold,
          }),
    },
    {
      key: "checkin",
      done: false,
      text: real
        ? t.rich("confirmed.stepCheckInReal", { when: formatDayWeekday(trip.from, locale), name: host, b: bold })
        : t.rich("confirmed.stepCheckIn", { when: at(trip.from, sampleBooking.checkIn), b: bold }),
    },
  ];

  return (
    <div className="lv-page">
      <Header member current="trips" />

      <main className="lv-wrap lv-wrap--narrow lv-confirm">
        <section className="lv-confirm__hero lv-on-night" aria-labelledby="done-title">
          {/* eslint-disable-next-line @next/next/no-img-element -- the brand's illustrated logo, in beige for the dark panel */}
          <img
            className="lv-confirm__slippers"
            src="/brand/monthliv-logo-mixed-illustration-reverse.png"
            alt=""
            width={1137}
            height={826}
          />
          <div className="lv-confirm__text">
            <p className="lv-label lv-confirm__label">{t("confirmed.label")}</p>
            <h1 id="done-title" className="lv-confirm__title">
              {t("confirmed.title", { name: pick(sampleGuest.name, locale) })}
            </h1>
            <p className="lv-confirm__lead">
              {t("confirmed.lead", {
                area: pick(listing.area, locale),
                length: t(`length.${price.length}`),
                date: formatDayWeekday(trip.from, locale),
              })}
            </p>
            <p className="lv-confirm__code">
              {t("confirmed.code")} <b translate="no">{sampleBooking.code}</b>
            </p>
            <div className="lv-btnrow">
              <Link className="lv-btn lv-btn--moon" href="/my-stays">
                {t("confirmed.view")}
              </Link>
              <Link className="lv-btn lv-btn--onnight" href="/messages">
                {t("confirmed.message", { name: host })}
              </Link>
            </div>
          </div>
          <div className="lv-confirm__space" aria-hidden="true" />
        </section>

        <div className="lv-confirm__grid">
          <section className="lv-ccard" aria-labelledby="stay-title">
            <div className="lv-ccard__stay">
              <PhotoSlot
                tone={listing.tone}
                className="lv-ccard__photo"
                photo={cover && { listingId: listing.id, photo: cover }}
                sizes="96px"
                decorative
              />
              <div>
                <h2 id="stay-title" className="lv-h4">
                  {title}
                </h2>
                <p className="lv-small">
                  {t("confirmed.hostArea", { name: host, area: pick(listing.area, locale) })}
                </p>
              </div>
            </div>
            <dl className="lv-ccard__facts">
              <div>
                <dt>{t("search.checkIn")}</dt>
                <dd>
                  {real
                    ? formatDayWeekday(trip.from, locale)
                    : t("confirmed.from", { date: formatDayWeekday(trip.from, locale), time: formatTime(sampleBooking.checkIn, locale) })}
                </dd>
              </div>
              <div>
                <dt>{t("search.checkOut")}</dt>
                <dd>
                  {real
                    ? formatDayWeekday(trip.to, locale)
                    : t("confirmed.until", { date: formatDayWeekday(trip.to, locale), time: formatTime(sampleBooking.checkOut, locale) })}
                </dd>
              </div>
              <div>
                <dt>{t("confirmed.length")}</dt>
                <dd>{t("search.staySummary", { nights, length: t(`length.${price.length}`) })}</dd>
              </div>
              <div>
                <dt>{t("search.guestsLabel")}</dt>
                <dd>{t("search.guests", { count: trip.guests })}</dd>
              </div>
              <div className="lv-ccard__wide">
                <dt>{t("confirmed.address")}</dt>
                <dd>{address}</dd>
              </div>
            </dl>
            <div className="lv-ccard__links">
              <a
                className="lv-link"
                href={calendarLink(title, trip.from, trip.to, sampleBooking.code)}
                download={`${sampleBooking.code}.ics`}
              >
                {t("confirmed.calendar")}
              </a>
              <Link className="lv-link" href={{ pathname: "/my-stays", hash: "payments" }}>
                {t("confirmed.receipt")}
              </Link>
            </div>
          </section>

          <section className="lv-ccard" aria-labelledby="next-title">
            <h2 id="next-title" className="lv-h4">
              {t("confirmed.nextTitle")}
            </h2>
            <ol className="lv-steps">
              {steps.map((step) => (
                <li key={step.key} className={step.done ? "is-done" : undefined}>
                  <span className="lv-steps__dot" aria-hidden="true" />
                  <span>{step.text}</span>
                </li>
              ))}
            </ol>
            <p className="lv-note">{t("confirmed.extend")}</p>
          </section>

          <section className="lv-ccard" aria-labelledby="paid-title">
            <h2 id="paid-title" className="lv-h4">
              {t("confirmed.paidTitle")}
            </h2>
            <p className="lv-ccard__line">
              <span>{t("confirmed.paidToday")}</span>
              <b>{formatPrice(booking.payments[0], locale)}</b>
            </p>
            {booking.payments[1] !== undefined && (
              <p className="lv-ccard__line">
                <span>{t("confirmed.nextPayment", { date: formatDayWeekday(secondOn, locale) })}</span>
                <b>{formatPrice(booking.payments[1], locale)}</b>
              </p>
            )}
            {price.discount > 0 && (
              <p className="lv-ccard__line lv-ccard__line--save">
                <span>{t("confirmed.saved", { length: t(`lengthName.${price.length}`) })}</span>
                <span>{formatPrice(price.discount, locale)}</span>
              </p>
            )}
            {booking.coupon && (
              <p className="lv-ccard__line lv-ccard__line--save">
                <span>{t("confirmed.couponSaved", { title: pick(booking.coupon.title, locale) })}</span>
                <span>{formatPrice(booking.couponAmount, locale)}</span>
              </p>
            )}
            <p className="lv-small">
              {booking.method === "card"
                ? t("book.savedCard", { last4: sampleGuest.card })
                : t(`book.methods.${booking.method}`)}
              {!real && ` · ${t("confirmed.noDeposit")}`}
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
