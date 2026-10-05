import { Heart, MessageSquare, Search, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type Tab = "explore" | "saved" | "trips" | "messages" | "profile";

/** The trips tab is a small house with lit windows: the stay you're in. */
function TripsIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="2.5" width="17" height="19" rx="2" fill="#ffffff" stroke="currentColor" strokeWidth="1.7" />
      <rect x="6" y="12" width="5.5" height="5.5" rx="0.8" fill="#f2c46b" stroke="currentColor" strokeWidth="1.1" />
      <rect x="12.5" y="12" width="5.5" height="5.5" rx="0.8" fill="#f2c46b" stroke="currentColor" strokeWidth="1.1" />
      <rect x="6" y="5.5" width="5.5" height="5.5" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <rect x="12.5" y="5.5" width="5.5" height="5.5" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

/**
 * Bottom tab bar on phones and in the app: explore, saved, trips, messages, profile.
 * `unread` puts a moon dot on messages. Profile opens the account for members, sign-in otherwise.
 */
export async function MobileTabBar({
  active,
  member = false,
  unread = false,
}: {
  active?: Tab;
  member?: boolean;
  unread?: boolean;
}) {
  const t = await getTranslations("tabs");
  const icon = { size: 26, strokeWidth: 1.7, "aria-hidden": true } as const;
  const current = (tab: Tab) => (tab === active ? "page" : undefined);

  return (
    <nav className="lv-tabbar" aria-label={t("label")}>
      <Link className="lv-tab" href="/" aria-current={current("explore")}>
        <Search {...icon} strokeWidth={active === "explore" ? 2.1 : 1.7} />
        {t("explore")}
      </Link>
      <Link className="lv-tab" href="/saved" aria-current={current("saved")}>
        <Heart {...icon} />
        {t("saved")}
      </Link>
      <Link className="lv-tab" href="/my-stays" aria-current={current("trips")}>
        <TripsIcon />
        {t("trips")}
      </Link>
      <Link className="lv-tab" href="/messages" aria-current={current("messages")}>
        <MessageSquare {...icon} />
        {t("messages")}
        {unread && <span className="lv-tab__dot" role="img" aria-label={t("unread")} />}
      </Link>
      <Link
        className="lv-tab"
        href={member ? "/account" : "/login"}
        aria-current={current("profile")}
      >
        <UserRound {...icon} />
        {t("profile")}
      </Link>
    </nav>
  );
}
