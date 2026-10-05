import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileTabBar } from "@/components/MobileTabBar";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
  return { title: t("metaTitle") };
}

/** Company facts, as registered; placeholders stay in brackets until they are issued. */
const companyRows = ["name", "ceo", "bizNo", "mailOrder", "address", "phone", "email"] as const;
const privacyPoints = ["ids", "cards", "address", "security", "rights"] as const;

/**
 * About MONTHLIV: what it is, the company behind it, and where the terms and privacy policy
 * will be published (/about#terms, /about#privacy). The full texts are not written yet, so the
 * page says so instead of showing made-up legal text.
 */
export default async function AboutPage() {
  const t = await getTranslations();

  return (
    <div className="lv-page lv-has-tabbar">
      <Header />

      <main>
        <section className="lv-band" aria-labelledby="about-title">
          <div className="lv-wrap lv-wrap--text lv-about__hero">
            <p className="lv-label">{t("about.label")}</p>
            <h1 id="about-title" className="lv-display lv-about__h1">
              {t("footer.line")}
            </h1>
            <p className="lv-hosthero__lead">{t("about.lead")}</p>
          </div>
        </section>

        <div className="lv-wrap lv-wrap--text lv-about">
          <section className="lv-about__sec" aria-labelledby="company-title">
            <h2 id="company-title" className="lv-help__h2">
              {t("about.companyTitle")}
            </h2>
            <dl className="lv-facts">
              {companyRows.map((key) => (
                <div key={key}>
                  <dt>{t(`about.company.${key}.label`)}</dt>
                  <dd>{t(`about.company.${key}.value`)}</dd>
                </div>
              ))}
            </dl>
            <p className="lv-note">{t("footer.intermediary")}</p>
          </section>

          <section className="lv-about__sec" id="terms" aria-labelledby="terms-title">
            <h2 id="terms-title" className="lv-help__h2">
              {t("footer.terms")}
            </h2>
            <p className="lv-sub">{t("about.termsText")}</p>
          </section>

          <section className="lv-about__sec" id="privacy" aria-labelledby="privacy-title">
            <h2 id="privacy-title" className="lv-help__h2">
              {t("footer.privacy")}
            </h2>
            <p className="lv-sub">{t("about.privacyLead")}</p>
            <ul className="lv-about__points">
              {privacyPoints.map((key) => (
                <li key={key}>{t(`about.privacy.${key}`)}</li>
              ))}
            </ul>
            <p className="lv-sub">{t("about.privacyFull")}</p>
          </section>

          <p className="lv-about__more">
            {t("about.questions")}{" "}
            <Link className="lv-link" href={{ pathname: "/help", hash: "contact" }}>
              {t("footer.contact")}
            </Link>
          </p>
        </div>
      </main>

      <Footer />
      <MobileTabBar />
    </div>
  );
}
