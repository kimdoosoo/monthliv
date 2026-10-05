import { Globe } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { categories, pick, type Category } from "@/data/listings";
import { sampleGuest } from "@/data/samples";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { nativeNames } from "@/lib/languages";
import { Wordmark } from "./Logo";

type Section = Category | "host" | "saved" | "trips" | "messages" | "account";

/**
 * Web header: the wordmark, the five sections (혼자살기, 함께살기, 한달살기, 원룸텔, 호스텔), then
 * language and currency, saved, trips and the account. Signed-in pages pass `member`; checkout
 * passes `slim` for the wordmark alone.
 */
export async function Header({
  member = false,
  current,
  slim = false,
}: {
  member?: boolean;
  current?: Section;
  slim?: boolean;
}) {
  const t = await getTranslations("nav");
  const locale = (await getLocale()) as Locale;
  const on = (section: Section) => (current === section ? "page" : undefined);

  return (
    <header className="lv-header">
      <div className="lv-wrap lv-header__in">
        <Link className="lv-logolink" href="/" aria-label={t("home")}>
          <Wordmark className="lv-logo" label="" />
        </Link>

        {!slim && (
          <>
            <nav className="lv-nav" aria-label={t("main")}>
              {categories.map((category) => (
                <Link
                  key={category}
                  href={{ pathname: "/search", query: { category } }}
                  aria-current={on(category)}
                >
                  {t(`sections.${category}`)}
                </Link>
              ))}
            </nav>

            <div className="lv-tools">
              <Link
                className="lv-langpill"
                href="/language"
                aria-label={t("languageLabel", { language: nativeNames[locale] })}
              >
                <Globe size={18} strokeWidth={1.75} aria-hidden="true" />
                <span className="lv-hide-mobile" translate="no">
                  {nativeNames[locale]} · {t("currency")}
                </span>
              </Link>
              {!member && (
                <Link
                  className="lv-tools__link lv-tools__link--wide lv-hide-mobile"
                  href="/host"
                  aria-current={on("host")}
                >
                  {t("host")}
                </Link>
              )}
              <Link className="lv-tools__link lv-hide-mobile" href="/saved" aria-current={on("saved")}>
                {t("saved")}
              </Link>
              <Link
                className="lv-tools__link lv-hide-mobile"
                href="/my-stays"
                aria-current={on("trips")}
              >
                {t("trips")}
              </Link>
              {member ? (
                <>
                  <Link
                    className="lv-tools__link lv-hide-mobile"
                    href="/messages"
                    aria-current={on("messages")}
                  >
                    {t("messages")}
                  </Link>
                  <Link className="lv-me" href="/account" aria-current={on("account")}>
                    <span className="lv-sr">{t("account")}</span>
                    <span aria-hidden="true">{pick(sampleGuest.name, locale)}</span>
                  </Link>
                </>
              ) : (
                <Link className="lv-btn lv-btn--night lv-btn--sm" href="/login">
                  {t("login")}
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
