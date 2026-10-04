import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { HostShell } from "@/components/HostShell";
import { MoonIcon } from "@/components/MoonIcon";
import {
  hostEarnings,
  hostGuests,
  hostReservations,
  statusBadge,
  statusOn,
  type ReservationStatus,
} from "@/data/host";
import { getListing, pick } from "@/data/listings";
import { sampleToday } from "@/data/samples";
import { Link } from "@/i18n/navigation";
import { formatPrice, formatRange } from "@/lib/format";
import { stayLengthFor } from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pms");
  return { title: t("reservations.title"), robots: { index: false } };
}

const tabs: ("all" | ReservationStatus)[] = ["all", "request", "upcoming", "staying", "past", "cancelled"];

/** Every booking at the host's places, by where it stands today (?tab=request and so on). */
export default async function HostReservationsPage({ searchParams }: PageProps<"/[locale]/host/reservations">) {
  const locale = await getLocale();
  const t = await getTranslations();
  const { tab: picked } = await searchParams;
  const tab = tabs.includes(picked as ReservationStatus) ? (picked as ReservationStatus) : "all";
  const today = sampleToday;
  const withStatus = hostReservations.map((item) => ({ ...item, now: statusOn(item, today) }));
  const shown = tab === "all" ? withStatus : withStatus.filter((item) => item.now === tab);
  const count = (key: (typeof tabs)[number]) =>
    key === "all" ? withStatus.length : withStatus.filter((item) => item.now === key).length;

  return (
    <HostShell current="reservations">
      <div className="lv-workhead">
        <div>
          <h1 className="lv-workhead__h1">{t("pms.reservations.title")}</h1>
          <p className="lv-sub">{t("pms.reservations.lead")}</p>
        </div>
      </div>

      <nav className="lv-tabs" aria-label={t("pms.reservations.tabsLabel")}>
        {tabs.map((key) => (
          <Link
            key={key}
            className="lv-tabs__tab"
            href={{ pathname: "/host/reservations", query: key === "all" ? {} : { tab: key } }}
            aria-current={key === tab ? "page" : undefined}
            scroll={false}
          >
            {t(`pms.status.${key}`)} <span className="lv-tabs__count">{count(key)}</span>
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <p className="lv-note">{t("pms.reservations.empty")}</p>
      ) : (
        <div className="lv-tablewrap">
          <table className="lv-table">
            <thead>
              <tr>
                <th scope="col">{t("pms.cols.code")}</th>
                <th scope="col">{t("pms.cols.guest")}</th>
                <th scope="col">{t("pms.cols.place")}</th>
                <th scope="col">{t("pms.cols.dates")}</th>
                <th scope="col" className="lv-table__num">
                  {t("pms.cols.payout")}
                </th>
                <th scope="col">{t("pms.cols.status")}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((item) => {
                const listing = getListing(item.listingId);
                const money = hostEarnings(item);
                const guest = hostGuests[item.guestId];
                return (
                  <tr key={item.code}>
                    <th scope="row">
                      <Link className="lv-table__link" href={`/host/reservations/${item.code}`} translate="no">
                        {item.code}
                      </Link>
                    </th>
                    <td>
                      <b>{guest ? pick(guest.name, locale) : item.guestId}</b>
                      <span className="lv-table__sub" translate="no">
                        {item.guestId}
                      </span>
                    </td>
                    <td>{listing ? pick(listing.title, locale) : item.listingId}</td>
                    <td>
                      <span className="lv-table__nowrap">{formatRange(item.from, item.to, locale)}</span>
                      <span className="lv-table__sub lv-table__tier">
                        <MoonIcon length={stayLengthFor(money.nights)} size={14} />
                        {t("price.nights", { nights: money.nights })}
                      </span>
                    </td>
                    <td className="lv-table__num">
                      {item.now === "cancelled" || item.now === "request" ? "—" : formatPrice(money.payout, locale)}
                    </td>
                    <td>
                      <span className={`lv-badge lv-badge--sm ${statusBadge[item.now]}`}>{t(`pms.status.${item.now}`)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="lv-small">{t("pms.feeNote")}</p>
    </HostShell>
  );
}
