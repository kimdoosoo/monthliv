import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { samplePartner } from "@/data/host";
import { pick } from "@/data/listings";
import { Link } from "@/i18n/navigation";
import { Footer } from "./Footer";
import { Wordmark } from "./Logo";

export type HostSection = "today" | "reservations" | "calendar" | "listings" | "payouts" | "coupons";

const items: { key: HostSection; href: string }[] = [
  { key: "today", href: "/host/today" },
  { key: "reservations", href: "/host/reservations" },
  { key: "calendar", href: "/host/calendar" },
  { key: "listings", href: "/host/listings" },
  { key: "payouts", href: "/host/payouts" },
  { key: "coupons", href: "/host/coupons" },
];

/**
 * The host centre (PMS): its own header with the host's sections, then the page. Guests never
 * see it; the way back to the guest site is in the header.
 */
export async function HostShell({
  current,
  children,
  wide = false,
}: {
  current?: HostSection;
  children: ReactNode;
  wide?: boolean;
}) {
  const locale = await getLocale();
  const t = await getTranslations("pms");

  return (
    <div className="lv-page lv-page--work">
      <header className="lv-header lv-header--work">
        <div className="lv-wrap lv-header__in">
          <Link className="lv-logolink" href="/host/today" aria-label={t("home")}>
            <Wordmark className="lv-logo" label="" />
          </Link>
          <span className="lv-workmode">{t("name")}</span>
          <div className="lv-tools">
            <Link className="lv-tools__link" href="/">
              {t("toGuest")}
            </Link>
            <span className="lv-me lv-me--host" role="img" aria-label={t("signedInAs", { name: pick(samplePartner.name, locale) })}>
              <span aria-hidden="true">{pick(samplePartner.initial, locale)}</span>
            </span>
          </div>
        </div>
        <nav className="lv-subnav" aria-label={t("menu")}>
          <div className="lv-wrap lv-subnav__in">
            {items.map(({ key, href }) => (
              <Link key={key} href={href} aria-current={key === current ? "page" : undefined}>
                {t(`nav.${key}`)}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className={`lv-wrap lv-work${wide ? " lv-work--wide" : ""}`}>{children}</main>

      <Footer />
    </div>
  );
}
