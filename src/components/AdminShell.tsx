import type { ReactNode } from "react";
import {
  CalendarCheck,
  House,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  TicketPercent,
  Users,
  Wallet,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Wordmark } from "./Logo";

export type AdminSection =
  | "dashboard"
  | "reservations"
  | "listings"
  | "members"
  | "coupons"
  | "payouts"
  | "support"
  | "settings";

const items: { key: AdminSection; href: string; Glyph: typeof House }[] = [
  { key: "dashboard", href: "/admin", Glyph: LayoutDashboard },
  { key: "reservations", href: "/admin/reservations", Glyph: CalendarCheck },
  { key: "listings", href: "/admin/listings", Glyph: House },
  { key: "members", href: "/admin/members", Glyph: Users },
  { key: "coupons", href: "/admin/coupons", Glyph: TicketPercent },
  { key: "payouts", href: "/admin/payouts", Glyph: Wallet },
  { key: "support", href: "/admin/support", Glyph: LifeBuoy },
  { key: "settings", href: "/admin/settings", Glyph: Settings },
];

/**
 * The back office: a bar across the top, the sections down the side (across the top on
 * phones), and the page. Sample screens: sign-in and staff roles come with the database.
 */
export async function AdminShell({ current, children }: { current: AdminSection; children: ReactNode }) {
  const t = await getTranslations("admin");

  return (
    <div className="lv-page lv-page--work lv-page--admin">
      <header className="lv-header lv-header--work">
        <div className="lv-adminbar">
          <Link className="lv-logolink" href="/admin" aria-label={t("home")}>
            <Wordmark className="lv-logo" label="" />
          </Link>
          <span className="lv-workmode lv-workmode--night">{t("name")}</span>
          <div className="lv-tools">
            <Link className="lv-tools__link" href="/">
              {t("toSite")}
            </Link>
            <span className="lv-me lv-me--admin" role="img" aria-label={t("signedInAs")}>
              <span aria-hidden="true">{t("staffShort")}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="lv-admin">
        <nav className="lv-adminnav" aria-label={t("menu")}>
          {items.map(({ key, href, Glyph }) => (
            <Link key={key} href={href} aria-current={key === current ? "page" : undefined}>
              <Glyph size={20} strokeWidth={1.75} aria-hidden="true" />
              {t(`nav.${key}`)}
            </Link>
          ))}
        </nav>
        <main className="lv-admin__main lv-work">{children}</main>
      </div>
    </div>
  );
}
