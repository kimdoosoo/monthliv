import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { DoneButton } from "@/components/DoneButton";
import { HostShell } from "@/components/HostShell";
import { MoonIcon } from "@/components/MoonIcon";
import { PhotoSlot } from "@/components/PhotoSlot";
import {
  getReservation,
  hostEarnings,
  hostGuests,
  hostReservations,
  payoutHolds,
  payoutsOf,
  statusBadge,
  statusOn,
} from "@/data/host";
import { getListing, pick } from "@/data/listings";
import { sampleBooking, sampleToday } from "@/data/samples";
import { Link } from "@/i18n/navigation";
import { formatDayWeekday, formatPrice, formatRange, formatTime } from "@/lib/format";
import { languageName } from "@/lib/languages";
import { stayLengthFor } from "@/lib/pricing";

export function generateStaticParams() {
  return hostReservations.map((item) => ({ code: item.code }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/host/reservations/[code]">): Promise<Metadata> {
  const { code } = await params;
  return { title: code, robots: { index: false } };
}

/**
 * One booking from the host's side: the guest (member ID and first name), the stay, what the
 * host is paid and when, and what can be done next.
 */
export default async function HostReservationPage({ params }: PageProps<"/[locale]/host/reservations/[code]">) {
  const { code } = await params;
  const item = getReservation(code);
  if (!item) notFound();
  const listing = getListing(item.listingId);
  if (!listing) notFound();

  const locale = await getLocale();
  const t = await getTranslations();
  const today = sampleToday;
  const now = statusOn(item, today);
  const guest = hostGuests[item.guestId];
  const name = guest ? pick(guest.name, locale) : item.guestId;
  const money = hostEarnings(item);
  const payouts = payoutsOf(item);
  const hold = payoutHolds.find((entry) => entry.code === item.code);
  const length = stayLengthFor(money.nights);
  const cover = listing.real?.photos[0];

  return (
    <HostShell current="reservations">
      <nav className="lv-crumbs" aria-label={t("pms.crumbs")}>
        <Link href="/host/reservations">{t("pms.reservations.title")}</Link>
        <span aria-hidden="true"> / </span>
        <span translate="no">{item.code}</span>
      </nav>
      <div className="lv-workhead">
        <div>
          <h1 className="lv-workhead__h1">{t("pms.detail.title", { name })}</h1>
          <p className="lv-sub">
            <span translate="no">{item.code}</span> · {formatRange(item.from, item.to, locale)} ·{" "}
            {t("price.nights", { nights: money.nights })}
          </p>
        </div>
        <span className={`lv-badge ${statusBadge[now]}`}>{t(`pms.status.${now}`)}</span>
      </div>

      {now === "request" && (
        <section className="lv-editcard lv-editcard--moon" aria-labelledby="answer-title">
          <h2 id="answer-title" className="lv-editcard__title">
            {t("pms.detail.answerTitle")}
          </h2>
          {item.note && (
            <blockquote className="lv-request__note">
              <p>{pick(item.note.text, locale)}</p>
              {item.note.lang !== locale && (
                <span className="lv-small">
                  {t("listing.translatedFrom", { language: languageName(item.note.lang, locale) })}
                </span>
              )}
            </blockquote>
          )}
          <div className="lv-request__act">
            <DoneButton className="lv-btn lv-btn--night lv-btn--sm" label={t("pms.accept")} done={t("pms.accepted")} />
            <DoneButton className="lv-btn lv-btn--sm" label={t("pms.decline")} done={t("pms.declined")} />
            {item.replyBy && (
              <span className="lv-small lv-request__due">
                {t("pms.today.replyBy", {
                  date: formatDayWeekday(item.replyBy.slice(0, 10), locale),
                  time: formatTime(item.replyBy.slice(11, 16), locale),
                })}
              </span>
            )}
          </div>
        </section>
      )}

      <div className="lv-worksplit">
        <section className="lv-editcard" aria-labelledby="guest-title">
          <h2 id="guest-title" className="lv-editcard__title">
            {t("pms.detail.guestTitle")}
          </h2>
          <div className="lv-guestcard">
            <span className="lv-avatar" aria-hidden="true">
              {name.slice(0, 2)}
            </span>
            <span className="lv-rows__main">
              <b>{name}</b>
              <span className="lv-small" translate="no">
                {item.guestId}
              </span>
            </span>
          </div>
          <ul className="lv-factlist">
            {guest?.verified && (
              <li className="lv-verified">
                <BadgeCheck size={18} strokeWidth={1.75} aria-hidden="true" />
                {t("pms.detail.verified")}
              </li>
            )}
            {guest && (
              <li>
                {t("pms.detail.languages", {
                  languages: guest.languages.map((language) => languageName(language, locale)).join(", "),
                })}
              </li>
            )}
            {guest && <li>{t("account.since", { year: guest.since })}</li>}
            <li>{t("search.guests", { count: item.guests })}</li>
          </ul>
          <p className="lv-small">{t("pms.detail.privacy")}</p>
          <div className="lv-btnrow">
            <Link className="lv-btn lv-btn--sm" href="/messages">
              {t("pms.detail.message")}
            </Link>
            {now !== "request" && (
              <Link className="lv-btn lv-btn--sm" href={{ pathname: "/host/coupons", query: { to: item.guestId } }}>
                {t("pms.detail.coupon")}
              </Link>
            )}
          </div>
        </section>

        <section className="lv-editcard" aria-labelledby="stay-title">
          <h2 id="stay-title" className="lv-editcard__title">
            {t("pms.detail.stayTitle")}
          </h2>
          <Link className="lv-guestcard" href={`/stays/${listing.id}`}>
            <PhotoSlot
              tone={listing.tone}
              className="lv-guestcard__photo"
              photo={cover && { listingId: listing.id, photo: cover }}
              sizes="64px"
              decorative
            />
            <span className="lv-rows__main">
              <b>{pick(listing.title, locale)}</b>
              <span className="lv-small">{pick(listing.area, locale)}</span>
            </span>
          </Link>
          <ul className="lv-factlist">
            <li>
              {t("pms.detail.checkIn", { date: formatDayWeekday(item.from, locale), time: formatTime(sampleBooking.checkIn, locale) })}
            </li>
            <li>
              {t("pms.detail.checkOut", { date: formatDayWeekday(item.to, locale), time: formatTime(sampleBooking.checkOut, locale) })}
            </li>
            <li className="lv-factlist__tier">
              <MoonIcon length={length} size={18} />
              {t("pms.detail.tier", { length: t(`length.${length}`), nights: money.nights })}
            </li>
          </ul>
          {(now === "upcoming" || now === "staying") && (
            <div className="lv-rows__row">
              <span className="lv-rows__main">
                <b>{t("pms.detail.doorTitle")}</b>
                <span className="lv-small">{t("pms.detail.doorText", { time: formatTime(sampleBooking.doorCodeAt, locale) })}</span>
              </span>
              <DoneButton className="lv-btn lv-btn--xs" label={t("pms.detail.doorResend")} done={t("pms.detail.doorSent")} />
            </div>
          )}
        </section>
      </div>

      <section className="lv-editcard" aria-labelledby="money-title">
        <h2 id="money-title" className="lv-editcard__title">
          {t("pms.detail.moneyTitle")}
        </h2>
        {now === "cancelled" ? (
          <p className="lv-sub">{t(item.freeCancel ? "pms.detail.cancelledFree" : "pms.detail.cancelledPaid")}</p>
        ) : (
          <>
            <dl className="lv-breakdown">
              <div>
                <dt>{t("pms.detail.stay", { nights: money.nights })}</dt>
                <dd>{formatPrice(money.stay, locale)}</dd>
              </div>
              <div>
                <dt>{t("pms.detail.fee", { percent: money.feePercent })}</dt>
                <dd>−{formatPrice(money.fee, locale)}</dd>
              </div>
              <div>
                <dt>{t("pms.detail.cleaning")}</dt>
                <dd>{formatPrice(money.cleaning, locale)}</dd>
              </div>
              <div className="lv-breakdown__total">
                <dt>{t("pms.detail.payout")}</dt>
                <dd>{formatPrice(money.payout, locale)}</dd>
              </div>
            </dl>
            <p className="lv-small">
              {t("pms.detail.guestPays", { amount: formatPrice(money.guestTotal, locale) })}
            </p>
            {hold && <p className="lv-note lv-note--danger">{pick(hold.reason, locale)}</p>}
            {payouts.length > 0 && (
              <ul className="lv-rows">
                {payouts.map((payout) => (
                  <li key={payout.part} className="lv-rows__row">
                    <span className="lv-rows__main">
                      <b>{t("pms.detail.payoutPart", { part: payout.part, parts: payout.parts })}</b>
                      <span className="lv-small">{formatDayWeekday(payout.date, locale)}</span>
                    </span>
                    <span className="lv-rows__end">
                      <b className="lv-rows__amount">{formatPrice(payout.amount, locale)}</b>
                      <span
                        className={`lv-badge lv-badge--sm${
                          payout.date <= today ? " lv-badge--celadon" : hold ? " lv-badge--danger" : ""
                        }`}
                      >
                        {payout.date <= today ? t("pms.paidOut") : hold ? t("pms.onHold") : t("pms.scheduled")}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </HostShell>
  );
}
