import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/AdminShell";
import { CouponForm } from "@/components/CouponForm";
import { CouponTicket } from "@/components/CouponTicket";
import { DoneButton } from "@/components/DoneButton";
import { couponRecipients, maskName, members, segment } from "@/data/admin";
import { coupons } from "@/data/coupons";
import { pick } from "@/data/listings";
import { sampleToday } from "@/data/samples";
import { getPathname, Link } from "@/i18n/navigation";
import { readCouponForm } from "@/lib/couponForm";
import { formatDate, formatPrice } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("coupons.title"), robots: { index: false } };
}

const segments = ["consented", "noBooking", "longStay"] as const;

/**
 * Coupons across MONTHLIV: make a code coupon (anyone with the code) or send one to member IDs,
 * one by one or by segment; then every coupon, the admin's and hosts', with how it's doing.
 */
export default async function AdminCouponsPage({ searchParams }: PageProps<"/[locale]/admin/coupons">) {
  const locale = await getLocale();
  const t = await getTranslations();
  const params = await searchParams;
  const allowed = couponRecipients();
  const picked = (Array.isArray(params.segment) ? params.segment : params.segment ? [params.segment] : []).filter(
    (key): key is (typeof segments)[number] => (segments as readonly string[]).includes(key),
  );
  const toParam = Array.isArray(params.to) ? params.to : params.to ? [params.to] : [];
  const to = [...toParam, ...picked.flatMap((key) => segment(key))];
  const quickPicks = members
    .filter((member) => member.status === "active" && member.role !== "host")
    .slice(0, 8)
    .map((member) => ({ id: member.id, name: { ko: maskName(member.name), en: maskName(member.name) } }));
  // Arriving from a member row or a segment (?to=…): tick the ones shown, type in the rest.
  const prefill = params.send === "1" ? [] : toParam.filter((id) => allowed.includes(id));
  const form = readCouponForm(
    { ...params, to },
    {
      issuer: "admin",
      today: sampleToday,
      canSendTo: (id) => allowed.includes(id),
      takenCodes: coupons.map((coupon) => coupon.code),
      defaults: {
        to: prefill.filter((id) => quickPicks.some((member) => member.id === id)),
        ids: prefill.filter((id) => !quickPicks.some((member) => member.id === id)).join(", "),
        kind: "amount",
        value: "10000",
        audience: "users",
      },
    },
  );
  const consented = new Set(members.filter((member) => member.marketing).map((member) => member.id));

  return (
    <AdminShell current="coupons">
      <div className="lv-workhead">
        <div>
          <h1 className="lv-workhead__h1">{t("admin.coupons.title")}</h1>
          <p className="lv-sub">{t("admin.coupons.lead")}</p>
        </div>
      </div>

      {form.coupon ? (
        <section className="lv-editcard lv-editcard--done" role="status" aria-labelledby="made-title">
          <h2 id="made-title" className="lv-editcard__title">
            {t("couponForm.made", { count: form.recipients.length })}
          </h2>
          <CouponTicket coupon={form.coupon} today={sampleToday} />
          {form.coupon.audience === "code" ? (
            <p className="lv-small">{t("admin.coupons.codeReady", { code: form.coupon.code })}</p>
          ) : (
            <p className="lv-small">
              {t("admin.coupons.sentSummary", {
                count: form.recipients.length,
                notified: form.recipients.filter((id) => consented.has(id)).length,
              })}
            </p>
          )}
          <p className="lv-small">{t("couponForm.previewNote")}</p>
          <Link className="lv-link lv-self-start" href="/admin/coupons">
            {t("couponForm.another")}
          </Link>
        </section>
      ) : (
        <>
          <CouponForm
            action={getPathname({ href: "/admin/coupons", locale })}
            values={form.values}
            errors={form.errors}
            issuer="admin"
            quickPicks={quickPicks}
          />
          <section className="lv-editcard" aria-labelledby="segment-title">
            <div>
              <h2 id="segment-title" className="lv-editcard__title">
                {t("admin.coupons.segmentsTitle")}
              </h2>
              <p className="lv-editcard__sub">{t("admin.coupons.segmentsLead")}</p>
            </div>
            <ul className="lv-rows">
              {segments.map((key) => (
                <li key={key} className="lv-rows__row">
                  <span className="lv-rows__main">
                    <b>{t(`admin.coupons.segments.${key}`)}</b>
                    <span className="lv-small">{t("admin.coupons.segmentCount", { count: segment(key).length })}</span>
                  </span>
                  <Link
                    className="lv-btn lv-btn--xs"
                    href={{ pathname: "/admin/coupons", query: { to: segment(key) }, hash: "new" }}
                  >
                    {t("admin.coupons.pick")}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <section className="lv-editcard" aria-labelledby="list-title">
        <h2 id="list-title" className="lv-editcard__title">
          {t("admin.coupons.listTitle")}
        </h2>
        <div className="lv-tablewrap">
          <table className="lv-table">
            <thead>
              <tr>
                <th scope="col">{t("admin.cols.coupon")}</th>
                <th scope="col">{t("admin.cols.issuer")}</th>
                <th scope="col">{t("admin.cols.how")}</th>
                <th scope="col">{t("admin.cols.benefit")}</th>
                <th scope="col">{t("admin.cols.until")}</th>
                <th scope="col" className="lv-table__num">
                  {t("admin.cols.used")}
                </th>
                <th scope="col">{t("pms.cols.status")}</th>
                <th scope="col">
                  <span className="lv-sr">{t("admin.cols.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const running = coupon.expires >= sampleToday;
                return (
                  <tr key={coupon.id}>
                    <th scope="row">
                      <b>{pick(coupon.title, locale)}</b>
                      <span className="lv-table__sub" translate="no">
                        {coupon.code}
                      </span>
                    </th>
                    <td>
                      {coupon.issuer === "admin"
                        ? t("admin.coupons.issuerAdmin")
                        : t("admin.coupons.issuerHost", { host: coupon.hostId ?? "" })}
                    </td>
                    <td>
                      {coupon.audience === "code"
                        ? t("admin.coupons.byCode")
                        : t("admin.coupons.byId", { count: coupon.sentTo?.length ?? 0 })}
                    </td>
                    <td className="lv-table__nowrap">
                      {coupon.kind === "percent" ? `${coupon.value}%` : formatPrice(coupon.value, locale)}
                    </td>
                    <td className="lv-table__nowrap">{formatDate(coupon.expires, locale)}</td>
                    <td className="lv-table__num">
                      {coupon.limit
                        ? t("admin.coupons.usage", { used: coupon.used, limit: coupon.limit })
                        : t("admin.coupons.usedCount", { used: coupon.used })}
                    </td>
                    <td>
                      <span className={`lv-badge lv-badge--sm${running ? " lv-badge--celadon" : ""}`}>
                        {running ? t("admin.coupons.running") : t("coupon.status.expired")}
                      </span>
                    </td>
                    <td>
                      {running && (
                        <DoneButton className="lv-btn lv-btn--xs" label={t("pms.coupons.stop")} done={t("pms.coupons.stopped")} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="lv-small">{t("admin.coupons.rules")}</p>
      </section>
      <p className="lv-small">{t("admin.sampleNote")}</p>
    </AdminShell>
  );
}
