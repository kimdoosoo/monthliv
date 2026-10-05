import type { Metadata } from "next";
import { Download, Landmark } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { DoneButton } from "@/components/DoneButton";
import { HostShell } from "@/components/HostShell";
import { hostGuests, hostReservations, payoutHolds, payoutsOf } from "@/data/host";
import { getListing, pick } from "@/data/listings";
import { sampleToday } from "@/data/samples";
import { Link } from "@/i18n/navigation";
import { formatDate, formatDayWeekday, formatPrice } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pms");
  return { title: t("payouts.title"), robots: { index: false } };
}

/**
 * Payouts: what's next, what's been paid this year, every payout by date, and the year as a CSV
 * file (made on the server, downloaded as a data link). Only the account's last four digits show.
 */
export default async function HostPayoutsPage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const today = sampleToday;
  const year = today.slice(0, 4);
  const payouts = hostReservations
    .flatMap((reservation) => payoutsOf(reservation).map((payout) => ({ ...payout, reservation })))
    .sort((a, b) => b.date.localeCompare(a.date));
  const holds = new Map(payoutHolds.map((hold) => [hold.code, hold]));
  const onHold = (payout: (typeof payouts)[number]) => payout.date > today && holds.has(payout.code);
  const upcoming = payouts
    .filter((payout) => payout.date > today && !onHold(payout))
    .sort((a, b) => a.date.localeCompare(b.date));
  const paidThisYear = payouts
    .filter((payout) => payout.date <= today && payout.date.startsWith(year))
    .reduce((sum, payout) => sum + payout.amount, 0);
  const scheduled = upcoming.reduce((sum, payout) => sum + payout.amount, 0);

  const csv = [
    ["date", "booking", "guest_id", "place", "part", "amount_krw", "status"].join(","),
    ...payouts
      .filter((payout) => payout.date.startsWith(year))
      .map((payout) =>
        [
          payout.date,
          payout.code,
          payout.reservation.guestId,
          payout.reservation.listingId,
          `${payout.part}/${payout.parts}`,
          payout.amount,
          payout.date <= today ? "paid" : "scheduled",
        ].join(","),
      ),
  ].join("\n");

  return (
    <HostShell current="payouts">
      <div className="lv-workhead">
        <div>
          <h1 className="lv-workhead__h1">{t("pms.payouts.title")}</h1>
          <p className="lv-sub">{t("pms.payouts.lead")}</p>
        </div>
        <a
          className="lv-btn lv-btn--sm"
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(`﻿${csv}`)}`}
          download={`monthliv-payouts-${year}.csv`}
        >
          <Download size={18} strokeWidth={1.75} aria-hidden="true" />
          {t("pms.payouts.download", { year })}
        </a>
      </div>

      <ul className="lv-stats">
        <li className="lv-stat">
          <span className="lv-stat__label">{t("pms.payouts.next")}</span>
          <b className="lv-stat__value">{upcoming[0] ? formatPrice(upcoming[0].amount, locale) : "—"}</b>
          <span className="lv-small">{upcoming[0] ? formatDayWeekday(upcoming[0].date, locale) : t("pms.payouts.none")}</span>
        </li>
        <li className="lv-stat">
          <span className="lv-stat__label">{t("pms.payouts.scheduled")}</span>
          <b className="lv-stat__value">{formatPrice(scheduled, locale)}</b>
          <span className="lv-small">{t("pms.payouts.scheduledNote", { count: upcoming.length })}</span>
        </li>
        <li className="lv-stat">
          <span className="lv-stat__label">{t("pms.payouts.paidYear", { year })}</span>
          <b className="lv-stat__value">{formatPrice(paidThisYear, locale)}</b>
          <span className="lv-small">{t("pms.payouts.paidNote", { date: formatDate(today, locale) })}</span>
        </li>
      </ul>

      <section className="lv-editcard" aria-labelledby="account-title">
        <h2 id="account-title" className="lv-editcard__title">
          {t("pms.payouts.accountTitle")}
        </h2>
        <div className="lv-rows__row">
          <span className="lv-rows__icon" aria-hidden="true">
            <Landmark size={22} strokeWidth={1.75} />
          </span>
          <span className="lv-rows__main">
            <b>{t("pms.payouts.account", { last4: "0417" })}</b>
            <span className="lv-small">{t("pms.payouts.accountNote")}</span>
          </span>
          <DoneButton className="lv-btn lv-btn--xs" label={t("pms.payouts.change")} done={t("pms.payouts.changeStarted")} />
        </div>
      </section>

      <section className="lv-editcard" aria-labelledby="list-title">
        <h2 id="list-title" className="lv-editcard__title">
          {t("pms.payouts.listTitle")}
        </h2>
        <div className="lv-tablewrap">
          <table className="lv-table">
            <thead>
              <tr>
                <th scope="col">{t("pms.cols.date")}</th>
                <th scope="col">{t("pms.cols.code")}</th>
                <th scope="col">{t("pms.cols.guest")}</th>
                <th scope="col">{t("pms.cols.place")}</th>
                <th scope="col" className="lv-table__num">
                  {t("pms.cols.amount")}
                </th>
                <th scope="col">{t("pms.cols.status")}</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => {
                const listing = getListing(payout.reservation.listingId);
                const guest = hostGuests[payout.reservation.guestId];
                const paid = payout.date <= today;
                const hold = onHold(payout) ? holds.get(payout.code) : undefined;
                return (
                  <tr key={`${payout.code}-${payout.part}`}>
                    <th scope="row" className="lv-table__nowrap">
                      {formatDate(payout.date, locale)}
                    </th>
                    <td>
                      <Link className="lv-table__link" href={`/host/reservations/${payout.code}`} translate="no">
                        {payout.code}
                      </Link>
                      {payout.parts > 1 && (
                        <span className="lv-table__sub">{t("pms.detail.payoutPart", { part: payout.part, parts: payout.parts })}</span>
                      )}
                    </td>
                    <td>{guest ? pick(guest.name, locale) : payout.reservation.guestId}</td>
                    <td>{listing ? pick(listing.title, locale) : payout.reservation.listingId}</td>
                    <td className="lv-table__num">{formatPrice(payout.amount, locale)}</td>
                    <td>
                      <span
                        className={`lv-badge lv-badge--sm${paid ? " lv-badge--celadon" : hold ? " lv-badge--danger" : ""}`}
                      >
                        {paid ? t("pms.paidOut") : hold ? t("pms.onHold") : t("pms.scheduled")}
                      </span>
                      {hold && <span className="lv-table__sub">{pick(hold.reason, locale)}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="lv-small">{t("pms.feeNote")}</p>
        <p className="lv-small">{t("pms.payouts.taxNote")}</p>
      </section>
    </HostShell>
  );
}
