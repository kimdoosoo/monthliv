import { Globe } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { nativeNames } from "@/lib/languages";
import { Wordmark } from "./Logo";

/** The Fair Trade Commission's page for the company's mail-order registration. */
const businessInfo = "https://www.ftc.go.kr/bizCommPop.do?wrkr_no=2708101999";

/** Night footer: reverse wordmark and tagline, the main links and the business details. */
export async function Footer() {
  const t = await getTranslations("footer");
  const locale = (await getLocale()) as Locale;

  return (
    <footer className="lv-footer">
      <div className="lv-wrap lv-footer__in">
        <div className="lv-footer__top">
          <div className="lv-footer__brand">
            <Wordmark variant="reverse" className="lv-footer__logo" height={30} />
            <p className="lv-footer__line">{t("line")}</p>
          </div>
          <nav aria-labelledby="footer-stay">
            <h2 id="footer-stay">{t("stay")}</h2>
            <Link href="/search">{t("find")}</Link>
            <Link href="/neighbourhoods/seongsu">{t("guide")}</Link>
            <Link href={{ pathname: "/", hash: "tiers" }}>{t("discounts")}</Link>
            <Link href="/help">{t("help")}</Link>
          </nav>
          <nav aria-labelledby="footer-host">
            <h2 id="footer-host">{t("hosting")}</h2>
            <Link href="/host">{t("becomeHost")}</Link>
            <Link href="/host/pricing">{t("pricing")}</Link>
            <Link href={{ pathname: "/help", hash: "hosting" }}>{t("hostHelp")}</Link>
          </nav>
          <nav aria-labelledby="footer-company">
            <h2 id="footer-company">{t("company")}</h2>
            <Link href="/about">{t("about")}</Link>
            <Link href={{ pathname: "/help", hash: "contact" }}>{t("contact")}</Link>
            <Link href={{ pathname: "/help", hash: "safety" }}>{t("safety")}</Link>
          </nav>
        </div>

        <div className="lv-footer__bottom">
          <div className="lv-footer__bar">
            <div className="lv-footer__links">
              <Link href={{ pathname: "/about", hash: "privacy" }}>{t("privacy")}</Link>
              <Link href={{ pathname: "/about", hash: "terms" }}>{t("terms")}</Link>
              <Link href={{ pathname: "/help", hash: "refunds" }}>{t("refunds")}</Link>
              <a href={businessInfo} target="_blank" rel="noopener noreferrer">
                {t("business")}
              </a>
            </div>
            <Link className="lv-footer__set" href="/language">
              <Globe size={18} strokeWidth={1.75} aria-hidden="true" />
              <span translate="no">
                {nativeNames[locale]} · {t("currency")}
              </span>
            </Link>
          </div>
          <p className="lv-footer__legal">
            {t("legal1")}
            <br />
            {t("legal2")}
            <br />
            {t("intermediary")}
          </p>
          <p className="lv-footer__legal">{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
