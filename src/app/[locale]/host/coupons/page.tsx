import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { CouponForm } from "@/components/CouponForm";
import { CouponTicket } from "@/components/CouponTicket";
import { DoneButton } from "@/components/DoneButton";
import { HostShell } from "@/components/HostShell";
import { hasAdConsent } from "@/data/admin";
import { coupons } from "@/data/coupons";
import { hostGuests, hostId, sendableGuests } from "@/data/host";
import { pick } from "@/data/listings";
import { sampleToday } from "@/data/samples";
import { getPathname, Link } from "@/i18n/navigation";
import { readCouponForm } from "@/lib/couponForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pms");
  return { title: t("coupons.title"), robots: { index: false } };
}

/**
 * Host coupons: make one for your own places and send it to guests who have booked with you,
 * by member ID. What it takes off comes out of the host's payout. ?to=member.id fills in a guest.
 */
export default async function HostCouponsPage({ searchParams }: PageProps<"/[locale]/host/coupons">) {
  const locale = await getLocale();
  const t = await getTranslations();
  const params = await searchParams;
  const allowed = sendableGuests();
  const prefill = typeof params.to === "string" && allowed.includes(params.to) ? [params.to] : [];
  const form = readCouponForm(params, {
    issuer: "host",
    hostId,
    today: sampleToday,
    canSendTo: (id) => allowed.includes(id),
    takenCodes: coupons.map((coupon) => coupon.code),
    defaults: { to: prefill, title: "", kind: "amount", value: "10000", minNights: "7" },
  });
  const mine = coupons.filter((coupon) => coupon.issuer === "host" && coupon.hostId === hostId);
  const name = (id: string) => (hostGuests[id] ? pick(hostGuests[id].name, locale) : id);

  return (
    <HostShell current="coupons">
      <div className="lv-workhead">
        <div>
          <h1 className="lv-workhead__h1">{t("pms.coupons.title")}</h1>
          <p className="lv-sub">{t("pms.coupons.lead")}</p>
        </div>
      </div>

      {form.coupon && (
        <section className="lv-editcard lv-editcard--done" aria-labelledby="made-title" role="status">
          <h2 id="made-title" className="lv-editcard__title">
            {t("couponForm.made", { count: form.recipients.length })}
          </h2>
          <CouponTicket coupon={form.coupon} today={sampleToday} />
          <p className="lv-small">
            {t("couponForm.sentTo", { names: form.recipients.map((id) => `${name(id)} (${id})`).join(", ") })}
          </p>
          <p className="lv-small">
            {t("pms.coupons.notified", { count: form.recipients.filter((id) => hasAdConsent(id)).length })}
          </p>
          <p className="lv-small">{t("couponForm.previewNote")}</p>
          <Link className="lv-link lv-self-start" href="/host/coupons">
            {t("couponForm.another")}
          </Link>
        </section>
      )}

      {!form.coupon && (
        <CouponForm
          action={getPathname({ href: "/host/coupons", locale })}
          values={form.values}
          errors={form.errors}
          issuer="host"
          quickPicks={allowed.map((id) => ({ id, name: hostGuests[id]?.name ?? { ko: id, en: id } }))}
        />
      )}

      <section className="lv-editcard" aria-labelledby="mine-title">
        <h2 id="mine-title" className="lv-editcard__title">
          {t("pms.coupons.mine")}
        </h2>
        <ul className="lv-tickets lv-tickets--one">
          {mine.map((coupon) => (
            <li key={coupon.id}>
              <CouponTicket coupon={coupon} today={sampleToday} status={coupon.expires < sampleToday ? "expired" : "available"}>
                <span className="lv-small">
                  {t("pms.coupons.stats", { sent: coupon.sentTo?.length ?? 0, used: coupon.used })}
                </span>
                <span className="lv-small">
                  {t("pms.coupons.sentToList", { names: (coupon.sentTo ?? []).map(name).join(", ") })}
                </span>
                <span className="lv-btnrow">
                  <Link className="lv-btn lv-btn--xs" href={{ pathname: "/host/coupons", hash: "new" }}>
                    {t("pms.coupons.sendMore")}
                  </Link>
                  <DoneButton className="lv-btn lv-btn--xs" label={t("pms.coupons.stop")} done={t("pms.coupons.stopped")} />
                </span>
              </CouponTicket>
            </li>
          ))}
        </ul>
        <p className="lv-small">{t("pms.coupons.rules")}</p>
      </section>
    </HostShell>
  );
}
