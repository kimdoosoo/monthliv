import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/AdminShell";
import { DoneButton } from "@/components/DoneButton";
import { Star } from "@/components/MoonIcon";
import { PhotoSlot } from "@/components/PhotoSlot";
import { reviewQueue } from "@/data/admin";
import { hostIdOf } from "@/data/coupons";
import { listings, pick } from "@/data/listings";
import { Link } from "@/i18n/navigation";
import { formatDate, formatMonth, formatPrice, formatRating } from "@/lib/format";
import { feePercentOf } from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("listings.title"), robots: { index: false } };
}

const reasons = ["photos", "registration", "address", "other"] as const;

/**
 * Rooms: the review queue first (registration and photos checked by a person), then every
 * room on the site with its partner, operating fee, opening day and registration check.
 */
export default async function AdminListingsPage() {
  const locale = await getLocale();
  const t = await getTranslations();

  return (
    <AdminShell current="listings">
      <div className="lv-workhead">
        <div>
          <h1 className="lv-workhead__h1">{t("admin.listings.title")}</h1>
          <p className="lv-sub">{t("admin.listings.lead", { count: listings.length })}</p>
        </div>
      </div>

      <section className="lv-editcard" aria-labelledby="queue-title">
        <h2 id="queue-title" className="lv-editcard__title">
          {t("admin.listings.queueTitle", { count: reviewQueue.length })}
        </h2>
        <ul className="lv-rows">
          {reviewQueue.map((item, index) => (
            <li key={item.key} className="lv-rows__row lv-queue">
              <PhotoSlot tone={index + 3} className="lv-placerow__photo" decorative />
              <span className="lv-rows__main">
                <b>{pick(item.title, locale)}</b>
                <span className="lv-small">
                  <span translate="no">{item.hostId}</span> · {pick(item.area, locale)} · {t(`types.${item.type}`)} ·{" "}
                  {t("pms.listings.nightly", { price: formatPrice(item.nightly, locale) })}
                </span>
                <span className="lv-small">{t("admin.listings.submitted", { date: formatDate(item.submitted, locale) })}</span>
                <span className="lv-queue__checks">
                  <span className={`lv-badge lv-badge--sm${item.photos >= 5 ? " lv-badge--celadon" : " lv-badge--danger"}`}>
                    {t("admin.listings.photos", { count: item.photos })}
                  </span>
                  <span className={`lv-badge lv-badge--sm${item.registration === "uploaded" ? " lv-badge--moon" : " lv-badge--danger"}`}>
                    {t(`admin.listings.registration.${item.registration}`)}
                  </span>
                </span>
              </span>
              <form className="lv-queue__act" action="#">
                <label className="lv-field">
                  <span className="lv-sr">{t("admin.listings.reason")}</span>
                  <select className="lv-select lv-select--sm" defaultValue={item.registration === "missing" ? "registration" : "photos"}>
                    {reasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {t(`admin.listings.reasons.${reason}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <DoneButton className="lv-btn lv-btn--xs" label={t("admin.listings.reject")} done={t("admin.listings.rejected")} />
                <DoneButton
                  className="lv-btn lv-btn--night lv-btn--xs"
                  label={t("admin.listings.approve")}
                  done={t("admin.listings.approved")}
                />
              </form>
            </li>
          ))}
        </ul>
        <p className="lv-small">{t("admin.listings.reviewRule")}</p>
      </section>

      <section className="lv-editcard" aria-labelledby="all-title">
        <h2 id="all-title" className="lv-editcard__title">
          {t("admin.listings.allTitle")}
        </h2>
        <div className="lv-tablewrap">
          <table className="lv-table">
            <thead>
              <tr>
                <th scope="col">{t("pms.cols.place")}</th>
                <th scope="col">{t("admin.cols.hostId")}</th>
                <th scope="col">{t("types.label")}</th>
                <th scope="col" className="lv-table__num">
                  {t("admin.cols.hostNightly")}
                </th>
                <th scope="col">{t("admin.cols.rating")}</th>
                <th scope="col">{t("admin.cols.registration")}</th>
                <th scope="col">
                  <span className="lv-sr">{t("admin.cols.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => {
                const host = hostIdOf(listing.id);
                return (
                  <tr key={listing.id}>
                    <th scope="row">
                      <Link className="lv-table__link" href={`/stays/${listing.id}`}>
                        {pick(listing.title, locale)}
                      </Link>
                      <span className="lv-table__sub">
                        {pick(listing.area, locale)}
                        {listing.opens ? ` · ${t("card.opens", { month: formatMonth(`${listing.opens}-01`, locale) })}` : ""}
                      </span>
                    </th>
                    <td translate="no">{host}</td>
                    <td>{pick(listing.type, locale)}</td>
                    <td className="lv-table__num">
                      {formatPrice(listing.nightly, locale)}
                      <span className="lv-table__sub">
                        {t("admin.listings.fee", { percent: feePercentOf(listing) })}
                      </span>
                    </td>
                    <td className="lv-table__nowrap">
                      {listing.reviews ? (
                        <>
                          <Star /> {formatRating(listing.rating, locale)}
                        </>
                      ) : (
                        t("card.new")
                      )}
                    </td>
                    <td>
                      <span className="lv-badge lv-badge--sm lv-badge--moon">{t("admin.listings.notChecked")}</span>
                    </td>
                    <td>
                      <DoneButton className="lv-btn lv-btn--xs" label={t("admin.listings.pause")} done={t("admin.listings.paused")} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="lv-small">{t("admin.listings.sampleRegistration")}</p>
      </section>
    </AdminShell>
  );
}
