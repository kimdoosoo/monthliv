import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/AdminShell";
import { DoneButton } from "@/components/DoneButton";
import { allReservations, payoutHolds } from "@/data/admin";
import { payoutsOf } from "@/data/host";
import { pick } from "@/data/listings";
import { sampleToday } from "@/data/samples";
import { formatDate, formatDayWeekday, formatPrice } from "@/lib/format";
import { directFeePercent, otherFeePercent } from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("payouts.title"), robots: { index: false } };
}

/**
 * Payouts to hosts: the next run, holds with their reason, and every payout by date.
 * Account numbers never appear here; the payout provider holds them.
 */
export default async function AdminPayoutsPage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const today = sampleToday;
  const held = new Map(payoutHolds.map((hold) => [hold.code, hold]));
  const payouts = allReservations
    .flatMap((item) => (item.listingId ? payoutsOf(item).map((payout) => ({ ...payout, hostId: item.hostId })) : []))
    .sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = payouts.filter((payout) => payout.date > today);
  const nextDate = upcoming.find((payout) => !held.has(payout.code))?.date;
  const nextRun = upcoming.filter((payout) => payout.date === nextDate && !held.has(payout.code));
  const status = (payout: (typeof payouts)[number]) =>
    held.has(payout.code) && payout.date > today ? "hold" : payout.date <= today ? "paid" : "scheduled";

  return (
    <AdminShell current="payouts">
      <div className="lv-workhead">
        <div>
          <h1 className="lv-workhead__h1">{t("admin.payouts.title")}</h1>
          <p className="lv-sub">{t("admin.payouts.lead", { direct: directFeePercent, other: otherFeePercent })}</p>
        </div>
      </div>

      <div className="lv-worksplit">
        <section className="lv-editcard" aria-labelledby="run-title">
          <h2 id="run-title" className="lv-editcard__title">
            {t("admin.payouts.nextRun")}
          </h2>
          {nextDate ? (
            <>
              <p className="lv-stat__value">{formatPrice(nextRun.reduce((sum, payout) => sum + payout.amount, 0), locale)}</p>
              <p className="lv-small">
                {t("admin.payouts.runNote", { date: formatDayWeekday(nextDate, locale), count: nextRun.length })}
              </p>
              <DoneButton className="lv-btn lv-btn--night lv-self-start" label={t("admin.payouts.run")} done={t("admin.payouts.ran")} />
            </>
          ) : (
            <p className="lv-sub">{t("pms.payouts.none")}</p>
          )}
        </section>

        <section className="lv-editcard" aria-labelledby="hold-title">
          <h2 id="hold-title" className="lv-editcard__title">
            {t("admin.payouts.holdsTitle")}
          </h2>
          <ul className="lv-rows">
            {payoutHolds.map((hold) => (
              <li key={hold.code} className="lv-rows__row">
                <span className="lv-rows__main">
                  <b translate="no">{hold.code}</b>
                  <span className="lv-small">{pick(hold.reason, locale)}</span>
                </span>
                <DoneButton className="lv-btn lv-btn--xs" label={t("admin.payouts.release")} done={t("admin.done")} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="lv-editcard" aria-labelledby="all-title">
        <h2 id="all-title" className="lv-editcard__title">
          {t("admin.payouts.allTitle")}
        </h2>
        <div className="lv-tablewrap">
          <table className="lv-table">
            <thead>
              <tr>
                <th scope="col">{t("pms.cols.date")}</th>
                <th scope="col">{t("admin.cols.hostId")}</th>
                <th scope="col">{t("pms.cols.code")}</th>
                <th scope="col" className="lv-table__num">
                  {t("pms.cols.amount")}
                </th>
                <th scope="col">{t("pms.cols.status")}</th>
              </tr>
            </thead>
            <tbody>
              {[...payouts].reverse().map((payout) => {
                const state = status(payout);
                return (
                  <tr key={`${payout.code}-${payout.part}`}>
                    <th scope="row" className="lv-table__nowrap">
                      {formatDate(payout.date, locale)}
                    </th>
                    <td translate="no">{payout.hostId}</td>
                    <td>
                      <span translate="no">{payout.code}</span>
                      {payout.parts > 1 && (
                        <span className="lv-table__sub">{t("pms.detail.payoutPart", { part: payout.part, parts: payout.parts })}</span>
                      )}
                    </td>
                    <td className="lv-table__num">{formatPrice(payout.amount, locale)}</td>
                    <td>
                      <span
                        className={`lv-badge lv-badge--sm${state === "paid" ? " lv-badge--celadon" : state === "hold" ? " lv-badge--danger" : ""}`}
                      >
                        {state === "paid" ? t("pms.paidOut") : state === "hold" ? t("admin.payouts.hold") : t("pms.scheduled")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
