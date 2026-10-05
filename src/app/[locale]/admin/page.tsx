import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/AdminShell";
import { allReservations, payoutHolds, reviewQueue, tickets } from "@/data/admin";
import { coupons } from "@/data/coupons";
import { hostEarnings, payoutsOf, statusBadge, statusOn } from "@/data/host";
import { getListing, pick } from "@/data/listings";
import { sampleToday } from "@/data/samples";
import { Link } from "@/i18n/navigation";
import { formatDayWeekday, formatPrice, formatRange } from "@/lib/format";
import { addDays } from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("dashboard.title"), robots: { index: false } };
}

/** The back office's first page: this month in numbers, what needs a person now, recent bookings, coupons. */
export default async function AdminDashboardPage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const today = sampleToday;
  const month = today.slice(0, 7);

  const live = allReservations.filter((item) => item.status !== "cancelled" && item.status !== "request");
  const thisMonth = live.filter((item) => item.from.startsWith(month));
  const money = thisMonth.filter((item) => item.listingId).map((item) => hostEarnings(item));
  const gmv = money.reduce((sum, item) => sum + item.guestTotal, 0);
  // MONTHLIV's revenue: the operating fee taken from partner payouts (guests pay no fee).
  const hostFees = money.reduce((sum, item) => sum + item.fee, 0);
  const open = tickets.filter((ticket) => ticket.status !== "done");
  const urgent = open.filter((ticket) => ticket.priority === "urgent");
  const held = new Set(payoutHolds.map((hold) => hold.code));
  const weekPayouts = allReservations
    .flatMap((item) => (item.listingId ? payoutsOf(item) : []))
    .filter((payout) => payout.date > today && payout.date <= addDays(today, 7) && !held.has(payout.code));
  const recent = [...allReservations].sort((a, b) => b.from.localeCompare(a.from)).slice(0, 6);
  const running = coupons.filter((coupon) => coupon.expires >= today);

  const stats = [
    { key: "gmv", value: formatPrice(gmv, locale), note: t("admin.dashboard.gmvNote", { count: thisMonth.length }) },
    {
      key: "revenue",
      value: formatPrice(hostFees, locale),
      note: t("admin.dashboard.revenueNote"),
    },
    { key: "bookings", value: String(thisMonth.length), note: t("admin.dashboard.bookingsNote", { count: live.length }) },
    { key: "reviews", value: String(reviewQueue.length), note: t("admin.dashboard.reviewsNote") },
    { key: "tickets", value: String(open.length), note: t("admin.dashboard.ticketsNote", { count: urgent.length }) },
    {
      key: "payouts",
      value: formatPrice(weekPayouts.reduce((sum, payout) => sum + payout.amount, 0), locale),
      note: t("admin.dashboard.payoutsNote", { count: weekPayouts.length }),
    },
  ] as const;

  return (
    <AdminShell current="dashboard">
      <div className="lv-workhead">
        <div>
          <p className="lv-workhead__date">
            {formatDayWeekday(today, locale)} · {t("pms.sampleDay")}
          </p>
          <h1 className="lv-workhead__h1">{t("admin.dashboard.title")}</h1>
        </div>
      </div>

      <ul className="lv-stats lv-stats--three">
        {stats.map(({ key, value, note }) => (
          <li key={key} className="lv-stat">
            <span className="lv-stat__label">{t(`admin.dashboard.stats.${key}`)}</span>
            <b className="lv-stat__value">{value}</b>
            <span className="lv-small">{note}</span>
          </li>
        ))}
      </ul>

      <section className="lv-editcard lv-editcard--moon" aria-labelledby="now-title">
        <h2 id="now-title" className="lv-editcard__title">
          {t("admin.dashboard.nowTitle")}
        </h2>
        <ul className="lv-rows">
          {urgent.map((ticket) => (
            <li key={ticket.id} className="lv-rows__row">
              <span className="lv-badge lv-badge--danger lv-badge--sm">{t("admin.support.priority.urgent")}</span>
              <span className="lv-rows__main">
                <b>{t(`admin.support.topics.${ticket.topic}`)}</b>
                <span className="lv-small">
                  {ticket.id} · <span translate="no">{ticket.memberId}</span>
                  {ticket.booking ? ` · ${ticket.booking}` : ""}
                </span>
              </span>
              <Link className="lv-link" href={{ pathname: "/admin/support", hash: ticket.id }}>
                {t("admin.open")}
              </Link>
            </li>
          ))}
          <li className="lv-rows__row">
            <span className="lv-badge lv-badge--moon lv-badge--sm">{t("admin.dashboard.review")}</span>
            <span className="lv-rows__main">
              <b>{t("admin.dashboard.reviewWaiting", { count: reviewQueue.length })}</b>
              <span className="lv-small">{reviewQueue.map((item) => pick(item.title, locale)).join(" · ")}</span>
            </span>
            <Link className="lv-link" href="/admin/listings">
              {t("admin.open")}
            </Link>
          </li>
          {payoutHolds.map((hold) => (
            <li key={hold.code} className="lv-rows__row">
              <span className="lv-badge lv-badge--sm">{t("admin.payouts.hold")}</span>
              <span className="lv-rows__main">
                <b>{hold.code}</b>
                <span className="lv-small">{pick(hold.reason, locale)}</span>
              </span>
              <Link className="lv-link" href="/admin/payouts">
                {t("admin.open")}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="lv-worksplit">
        <section className="lv-editcard" aria-labelledby="recent-title">
          <div className="lv-editcard__head">
            <h2 id="recent-title" className="lv-editcard__title">
              {t("admin.dashboard.recentTitle")}
            </h2>
            <Link className="lv-link" href="/admin/reservations">
              {t("admin.all")}
            </Link>
          </div>
          <ul className="lv-rows">
            {recent.map((item) => {
              const listing = item.listingId ? getListing(item.listingId) : undefined;
              const title = listing ? pick(listing.title, locale) : item.title ? pick(item.title, locale) : "";
              const now = statusOn(item, today);
              return (
                <li key={item.code} className="lv-rows__row">
                  <span className="lv-rows__main">
                    <b translate="no">{item.code}</b>
                    <span className="lv-small">
                      {title} · {formatRange(item.from, item.to, locale)}
                    </span>
                  </span>
                  <span className={`lv-badge lv-badge--sm ${statusBadge[now]}`}>{t(`pms.status.${now}`)}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="lv-editcard" aria-labelledby="coupon-title">
          <div className="lv-editcard__head">
            <h2 id="coupon-title" className="lv-editcard__title">
              {t("admin.dashboard.couponsTitle")}
            </h2>
            <Link className="lv-link" href="/admin/coupons">
              {t("admin.all")}
            </Link>
          </div>
          <ul className="lv-rows">
            {running.map((coupon) => {
              const rate = coupon.limit ? Math.min(100, Math.round((coupon.used / coupon.limit) * 100)) : null;
              return (
                <li key={coupon.id} className="lv-rows__row">
                  <span className="lv-rows__main">
                    <b>{pick(coupon.title, locale)}</b>
                    <span className="lv-small" translate="no">
                      {coupon.code}
                    </span>
                    {rate !== null && (
                      <span className="lv-meter" aria-hidden="true">
                        <span style={{ width: `${rate}%` }} />
                      </span>
                    )}
                  </span>
                  <span className="lv-small lv-rows__amount">
                    {coupon.limit
                      ? t("admin.coupons.usage", { used: coupon.used, limit: coupon.limit })
                      : t("admin.coupons.usedCount", { used: coupon.used })}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
      <p className="lv-small">{t("admin.sampleNote")}</p>
    </AdminShell>
  );
}
