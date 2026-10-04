import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, KeyRound, Wifi } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { CopyButton } from "@/components/CopyButton";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileTabBar } from "@/components/MobileTabBar";
import { StayMap, type PricePin } from "@/components/StayMap";
import { getListing, pick, sampleHost } from "@/data/listings";
import { seongsuPlaces } from "@/data/places";
import { sampleBooking, sampleStayInfo, sampleToday } from "@/data/samples";
import { Link } from "@/i18n/navigation";
import { formatDate, formatDayWeekday, formatPrice, formatTime } from "@/lib/format";
import { addDays, guestNightlyFor, nightsBetween, quote, stayDay, stayLengthFor } from "@/lib/pricing";

export function generateStaticParams() {
  return [{ code: sampleBooking.code }];
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("stay");
  return { title: t("title") };
}

/** Ways to make the stay longer: a week, a month, or up to a season (91 nights). */
const extensions = [
  { key: "week", days: 7 },
  { key: "month", days: 28 },
  { key: "season", to: 91 },
] as const;

/**
 * The place you live now: the door code, Wi-Fi and check-out up top, then the host's house guide,
 * what's nearby, a longer stay and help. Sample stay on day 12 of 28.
 */
export default async function StayPage({ params, searchParams }: PageProps<"/[locale]/my-stays/[code]">) {
  const { code } = await params;
  if (code !== sampleBooking.code) notFound();
  const listing = getListing(sampleBooking.listingId);
  if (!listing) notFound();

  const locale = await getLocale();
  const t = await getTranslations();
  const query = await searchParams;
  const requested = typeof query.extend === "string" ? query.extend : undefined;

  const nights = nightsBetween(sampleBooking.from, sampleBooking.to);
  const day = stayDay(sampleBooking.from, sampleToday);
  const left = nights - day;
  const host = pick(sampleHost.name, locale);
  const checkOut = formatTime(sampleBooking.checkOut, locale);
  const current = quote(listing, nights);

  const options = extensions.map((option) => {
    const total = "to" in option ? option.to : nights + option.days;
    const next = quote(listing, total);
    const length = stayLengthFor(total);
    return {
      key: option.key,
      total,
      until: addDays(sampleBooking.from, total),
      extra: next.total - current.total,
      length,
      changes: length !== current.length,
      percent: next.discountPercent,
      saved: (current.nightlyAfter - guestNightlyFor(listing.nightly, listing.discounts, length)) * total,
    };
  });
  const chosen = options.find((option) => option.key === requested);

  const pins: PricePin[] = [
    { id: "home", label: "", title: pick(listing.title, locale), lat: listing.lat, lng: listing.lng, kind: "home" },
    ...seongsuPlaces
      .filter((place) => place.key !== "forest")
      .map((place) => ({
        id: place.key,
        label: t(`guide.places.${place.key}.short`),
        title: t(`guide.places.${place.key}.name`),
        lat: place.lat,
        lng: place.lng,
        kind: "place" as const,
      })),
  ];
  const near = [
    ...seongsuPlaces.filter((place) => place.key !== "cafe").map((place) => ({
      key: place.key,
      name: t(`guide.places.${place.key}.short`),
      note: t(`stay.nearNote.${place.key}`),
      minutes: place.minutes,
    })),
    { key: "station", name: pick(listing.station, locale), note: t("stay.nearNote.station"), minutes: listing.minutes },
  ].sort((a, b) => a.minutes - b.minutes);

  return (
    <div className="lv-page lv-has-tabbar">
      <Header member current="trips" />

      <main className="lv-wrap lv-wrap--narrow lv-stay">
        <div className="lv-stay__head">
          <nav className="lv-crumbs" aria-label={t("stay.crumbs")}>
            <Link href="/my-stays">{t("stays.title")}</Link>
            <span aria-hidden="true"> / </span>
            <span aria-current="page">{pick(listing.title, locale)}</span>
          </nav>
          <h1 className="lv-h1">{t("stay.title")}</h1>
          <p className="lv-stay__meta">
            {t("stay.meta", {
              area: pick(listing.area, locale),
              day,
              nights,
              date: formatDayWeekday(sampleBooking.to, locale),
              time: checkOut,
            })}
          </p>
        </div>

        <div className="lv-stay__cards">
          <section className="lv-staycard lv-staycard--night lv-on-night" aria-labelledby="door-title">
            <h2 id="door-title" className="lv-staycard__label">
              <KeyRound size={20} strokeWidth={1.75} aria-hidden="true" />
              {t("stay.door")}
            </h2>
            <p className="lv-staycard__code" translate="no">
              {sampleStayInfo.doorCode}
            </p>
            <p className="lv-staycard__note">
              {t("stay.doorNote", { date: formatDayWeekday(sampleBooking.to, locale), time: checkOut })}
            </p>
            <CopyButton
              className="lv-btn lv-btn--onnight lv-btn--xs"
              value={sampleStayInfo.doorCode.replace(/\D/g, "")}
              label={t("stay.copyCode")}
              done={t("stay.copied")}
            />
          </section>

          <section className="lv-staycard" aria-labelledby="wifi-title">
            <h2 id="wifi-title" className="lv-staycard__label lv-staycard__label--plain">
              <Wifi size={20} strokeWidth={1.75} aria-hidden="true" />
              {t("stay.wifi", { mbps: sampleStayInfo.wifi.mbps })}
            </h2>
            <dl className="lv-staycard__dl">
              <div>
                <dt>{t("stay.network")}</dt>
                <dd translate="no">{sampleStayInfo.wifi.name}</dd>
              </div>
              <div>
                <dt>{t("stay.password")}</dt>
                <dd translate="no">{sampleStayInfo.wifi.password}</dd>
              </div>
            </dl>
            <CopyButton
              value={sampleStayInfo.wifi.password}
              label={t("stay.copyPassword")}
              done={t("stay.copied")}
            />
          </section>

          <section className="lv-staycard" aria-labelledby="out-title">
            <h2 id="out-title" className="lv-staycard__label">
              <CalendarDays size={20} strokeWidth={1.75} aria-hidden="true" />
              {t("stay.checkout")}
            </h2>
            <p className="lv-staycard__big">
              {t("stay.checkoutWhen", { date: formatDayWeekday(sampleBooking.to, locale), time: checkOut })}
            </p>
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
            <p className="lv-small">{t("stay.checkoutNote", { left, time: checkOut })}</p>
            <a className="lv-btn lv-btn--xs lv-self-start" href="#extend">
              {t("stays.extend")}
            </a>
          </section>
        </div>

        <section className="lv-stay__sec" aria-labelledby="guide-title">
          <h2 id="guide-title" className="lv-h2 lv-stay__h2">
            {t("stay.guideTitle")}
          </h2>
          <div className="lv-accordion">
            {sampleStayInfo.guide.map((key, index) => (
              <details key={key} open={index === 0}>
                <summary>{t(`stay.guide.${key}.title`)}</summary>
                <div className="lv-accordion__body">
                  <p>{t(`stay.guide.${key}.text`)}</p>
                </div>
              </details>
            ))}
          </div>
          <p className="lv-stay__by">
            <span className="lv-avatar lv-avatar--xs" aria-hidden="true">
              {host}
            </span>
            {t("stay.guideBy", { name: host })}
          </p>
        </section>

        <section className="lv-stay__near" aria-labelledby="near-title">
          <div className="lv-stay__nearlist">
            <h2 id="near-title" className="lv-h2 lv-stay__h2">
              {t("stay.nearTitle")}
            </h2>
            <ul className="lv-nearlist">
              {near.map((item) => (
                <li key={item.key}>
                  <span>
                    <b>{item.name}</b>
                    {item.note && <> · {item.note}</>}
                  </span>
                  <span className="lv-muted">{t("stay.minutes", { minutes: item.minutes })}</span>
                </li>
              ))}
            </ul>
            <Link className="lv-link lv-self-start" href="/neighbourhoods/seongsu">
              {t("stay.nearGuide", { area: pick(listing.area, locale) })}
            </Link>
          </div>
          <div className="lv-stay__map">
            <StayMap mode="results" pins={pins} searchAsMove={false} label={t("stay.mapLabel")} />
          </div>
        </section>

        <section className="lv-extend" id="extend" aria-labelledby="extend-title">
          <div className="lv-extend__head">
            <h2 id="extend-title" className="lv-h2 lv-stay__h2">
              {t("stay.extendTitle")}
            </h2>
            <p className="lv-sub">
              {t("stay.extendText", { date: formatDayWeekday(sampleBooking.to, locale) })}
            </p>
          </div>
          {chosen ? (
            <p className="lv-note lv-note--celadon" role="status">
              {t("stay.requested", {
                name: host,
                date: formatDate(chosen.until, locale),
                amount: formatPrice(chosen.extra, locale),
              })}
            </p>
          ) : (
            <form className="lv-extend__form" method="get" action={`/${locale}/my-stays/${sampleBooking.code}#extend`}>
              <div className="lv-extend__options" role="radiogroup" aria-labelledby="extend-title">
                {options.map((option) => (
                  <label key={option.key} className="lv-extopt">
                    <span className="lv-extopt__top">
                      <span className="lv-extopt__name">{t(`stay.options.${option.key}`)}</span>
                      <input type="radio" name="extend" value={option.key} defaultChecked={option.key === "season"} />
                    </span>
                    <span className="lv-small">
                      {t("stay.until", { date: formatDayWeekday(option.until, locale), nights: option.total })}
                    </span>
                    <span className="lv-extopt__price">
                      {t("stay.extra", { amount: formatPrice(option.extra, locale) })}
                    </span>
                    <span className="lv-extopt__deal">
                      {option.changes
                        ? t("stay.newRate", {
                            nights: option.total,
                            percent: option.percent,
                            amount: formatPrice(option.saved, locale),
                          })
                        : t("stay.sameRate", { percent: option.percent })}
                    </span>
                  </label>
                ))}
              </div>
              <div className="lv-extend__go">
                <button className="lv-btn lv-btn--moon" type="submit">
                  {t("stay.request")}
                </button>
                <span className="lv-small">{t("stay.requestNote", { name: host })}</span>
              </div>
            </form>
          )}
        </section>

        <section className="lv-helpbox" aria-labelledby="trouble-title">
          <div>
            <h2 id="trouble-title" className="lv-h4">
              {t("stay.troubleTitle")}
            </h2>
            <p className="lv-sub">{t("stay.troubleText", { name: host })}</p>
          </div>
          <div className="lv-btnrow">
            <Link className="lv-btn lv-btn--sm" href="/messages">
              {t("stays.messageHost", { name: host })}
            </Link>
            <Link className="lv-btn lv-btn--sm lv-btn--plain" href="/help">
              {t("stay.contactHelp")}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <MobileTabBar active="trips" member unread />
    </div>
  );
}
