import type { Metadata } from "next";
import { Search } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/AdminShell";
import { DoneButton } from "@/components/DoneButton";
import { allReservations } from "@/data/admin";
import { hostEarnings, statusBadge, statusOn, type ReservationStatus } from "@/data/host";
import { getListing, pick } from "@/data/listings";
import { sampleToday } from "@/data/samples";
import { getPathname, Link } from "@/i18n/navigation";
import { formatPrice, formatRange } from "@/lib/format";
import { nightsBetween } from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("reservations.title"), robots: { index: false } };
}

const tabs: ("all" | ReservationStatus)[] = ["all", "request", "upcoming", "staying", "past", "cancelled"];

/** Every booking at MONTHLIV, by status, searchable by booking code or member ID (?q=). */
export default async function AdminReservationsPage({ searchParams }: PageProps<"/[locale]/admin/reservations">) {
  const locale = await getLocale();
  const t = await getTranslations();
  const params = await searchParams;
  const tab = tabs.includes(params.tab as ReservationStatus) ? (params.tab as ReservationStatus) : "all";
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const today = sampleToday;

  const rows = allReservations
    .map((item) => ({ ...item, now: statusOn(item, today) }))
    .filter((item) => !query || item.code.toLowerCase().includes(query) || item.guestId.includes(query) || item.hostId.includes(query));
  const shown = tab === "all" ? rows : rows.filter((item) => item.now === tab);
  const count = (key: (typeof tabs)[number]) => (key === "all" ? rows.length : rows.filter((item) => item.now === key).length);

  return (
    <AdminShell current="reservations">
      <div className="lv-workhead">
        <div>
          <h1 className="lv-workhead__h1">{t("admin.reservations.title")}</h1>
          <p className="lv-sub">{t("admin.reservations.lead")}</p>
        </div>
        <form className="lv-searchbox" role="search" action={getPathname({ href: "/admin/reservations", locale })}>
          <Search size={18} strokeWidth={1.75} aria-hidden="true" />
          <input name="q" type="search" defaultValue={query} placeholder={t("admin.reservations.search")} aria-label={t("admin.reservations.search")} />
          {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
        </form>
      </div>

      <nav className="lv-tabs" aria-label={t("pms.reservations.tabsLabel")}>
        {tabs.map((key) => (
          <Link
            key={key}
            className="lv-tabs__tab"
            href={{ pathname: "/admin/reservations", query: { ...(key === "all" ? {} : { tab: key }), ...(query ? { q: query } : {}) } }}
            aria-current={key === tab ? "page" : undefined}
            scroll={false}
          >
            {t(`pms.status.${key}`)} <span className="lv-tabs__count">{count(key)}</span>
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <p className="lv-note">{t("admin.noResults")}</p>
      ) : (
        <div className="lv-tablewrap">
          <table className="lv-table">
            <thead>
              <tr>
                <th scope="col">{t("pms.cols.code")}</th>
                <th scope="col">{t("admin.cols.guestId")}</th>
                <th scope="col">{t("admin.cols.hostId")}</th>
                <th scope="col">{t("pms.cols.place")}</th>
                <th scope="col">{t("pms.cols.dates")}</th>
                <th scope="col" className="lv-table__num">
                  {t("admin.cols.paid")}
                </th>
                <th scope="col">{t("pms.cols.status")}</th>
                <th scope="col">
                  <span className="lv-sr">{t("admin.cols.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((item) => {
                const listing = item.listingId ? getListing(item.listingId) : undefined;
                const title = listing ? pick(listing.title, locale) : item.title ? pick(item.title, locale) : "";
                return (
                  <tr key={item.code}>
                    <th scope="row" translate="no">
                      {item.code}
                    </th>
                    <td translate="no">
                      <Link className="lv-table__link" href={{ pathname: "/admin/members", query: { q: item.guestId } }}>
                        {item.guestId}
                      </Link>
                    </td>
                    <td translate="no">{item.hostId}</td>
                    <td>{title}</td>
                    <td>
                      <span className="lv-table__nowrap">{formatRange(item.from, item.to, locale)}</span>
                      <span className="lv-table__sub">{t("price.nights", { nights: nightsBetween(item.from, item.to) })}</span>
                    </td>
                    <td className="lv-table__num">
                      {listing && item.now !== "request" && item.now !== "cancelled"
                        ? formatPrice(hostEarnings(item).guestTotal, locale)
                        : "—"}
                    </td>
                    <td>
                      <span className={`lv-badge lv-badge--sm ${statusBadge[item.now]}`}>{t(`pms.status.${item.now}`)}</span>
                    </td>
                    <td>
                      {item.now === "cancelled" ? (
                        <DoneButton className="lv-btn lv-btn--xs" label={t("admin.reservations.refund")} done={t("admin.done")} />
                      ) : item.now === "upcoming" || item.now === "staying" ? (
                        <DoneButton className="lv-btn lv-btn--xs" label={t("admin.reservations.contact")} done={t("admin.done")} />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
