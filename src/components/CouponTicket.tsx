import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { daysLeft, hostIdOf, type Coupon, type WalletStatus } from "@/data/coupons";
import { branchName, listings, pick } from "@/data/listings";
import { formatDayWeekday, formatPrice } from "@/lib/format";

/** Where a partner's coupon works, as guests see it: the partner's branches by name. */
export function hostLabel(hostId: string | undefined, locale: string): string {
  if (!hostId || hostId === "monthliv") return "MONTHLIV";
  const names = new Set(listings.filter((listing) => hostIdOf(listing.id) === hostId).map((listing) => branchName(listing, locale)));
  return [...names].join(" · ") || hostId;
}

/**
 * One coupon as a ticket: what it takes off on the stub, then its name, conditions, the last
 * day and who issued it. Used and expired coupons are dimmed and say so in words.
 */
export async function CouponTicket({
  coupon,
  status = "available",
  today,
  children,
}: {
  coupon: Coupon;
  status?: WalletStatus;
  today: string;
  children?: ReactNode;
}) {
  const locale = await getLocale();
  const t = await getTranslations("coupon");
  const value = coupon.kind === "percent" ? `${coupon.value}%` : formatPrice(coupon.value, locale);
  const conditions = [
    coupon.maxDiscount && t("cond.max", { amount: formatPrice(coupon.maxDiscount, locale) }),
    coupon.minNights && t("cond.minNights", { nights: coupon.minNights }),
    coupon.minTotal && t("cond.minTotal", { amount: formatPrice(coupon.minTotal, locale) }),
    coupon.issuer === "host"
      ? t("cond.hostOnly", { host: hostLabel(coupon.hostId, locale) })
      : t("cond.allPlaces"),
  ].filter(Boolean);
  const left = daysLeft(coupon.expires, today);

  return (
    <div className={`lv-ticket${status === "available" ? "" : " is-off"}`}>
      <div className="lv-ticket__stub">
        <b>{value}</b>
        <span>{t("off")}</span>
      </div>
      <div className="lv-ticket__body">
        <div className="lv-ticket__top">
          <span className={`lv-badge lv-badge--sm${coupon.issuer === "host" ? " lv-badge--celadon" : ""}`}>
            {coupon.issuer === "host" ? t("issuer.host") : t("issuer.admin")}
          </span>
          {status !== "available" && <span className="lv-badge lv-badge--sm">{t(`status.${status}`)}</span>}
        </div>
        <b className="lv-ticket__title">{pick(coupon.title, locale)}</b>
        <span className="lv-small">{conditions.join(" · ")}</span>
        <span className="lv-small">
          {t("until", { date: formatDayWeekday(coupon.expires, locale) })}
          {status === "available" && left >= 0 && ` · ${left === 0 ? t("lastDay") : t("daysLeft", { days: left })}`}
        </span>
        {children}
      </div>
    </div>
  );
}
