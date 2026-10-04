import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { pick } from "@/data/listings";
import { sampleGuest } from "@/data/samples";
import { Link } from "@/i18n/navigation";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { MobileTabBar } from "./MobileTabBar";

export type AccountSection =
  | "home"
  | "coupons"
  | "reviews"
  | "profile"
  | "security"
  | "payments"
  | "language"
  | "notifications";

const items = [
  { key: "home", href: "/account" },
  { key: "coupons", href: "/account/coupons" },
  { key: "reviews", href: "/account/reviews" },
  { key: "profile", href: "/account/profile" },
  { key: "security", href: "/account/security" },
  { key: "payments", href: "/account/payments" },
  { key: "language", href: "/language" },
  { key: "notifications", href: "/account/notifications" },
  { key: "hosting", href: "/host/today" },
] as const;

/** The year the sample guest joined. */
const memberSince = 2025;

/**
 * My page: the member's name and the account sections on the left, the section on the right.
 * On phones the sections become a row that scrolls sideways.
 */
export async function AccountShell({ current, children }: { current: AccountSection; children: ReactNode }) {
  const locale = await getLocale();
  const t = await getTranslations("account");

  return (
    <div className="lv-page lv-has-tabbar">
      <Header member current="account" />

      <div className="lv-wrap lv-editor">
        <nav className="lv-editor__nav" aria-label={t("nav")}>
          <div className="lv-editor__stay">
            <span className="lv-avatar lv-avatar--md" aria-hidden="true">
              {pick(sampleGuest.name, locale)}
            </span>
            <span className="lv-editor__who">
              <b>{pick(sampleGuest.fullName, locale)}</b>
              <span className="lv-small">{t("since", { year: memberSince })}</span>
            </span>
          </div>
          <ul>
            {items.map(({ key, href }) => (
              <li key={key}>
                <Link href={href} aria-current={key === current ? "page" : undefined}>
                  {t(`items.${key}`)}
                </Link>
              </li>
            ))}
            <li className="lv-editor__out">
              <Link href="/">{t("logout")}</Link>
            </li>
          </ul>
        </nav>

        <main className="lv-editor__main">{children}</main>
      </div>

      <Footer />
      <MobileTabBar active="profile" member />
    </div>
  );
}
