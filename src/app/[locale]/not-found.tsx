import { getTranslations } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="lv-page">
      <Header />
      <main className="lv-wrap lv-wrap--narrow">
        <div className="lv-empty">
          {/* eslint-disable-next-line @next/next/no-img-element -- the brand's emblem, as drawn */}
          <img className="lv-empty__mark" src="/brand/monthliv-logo-emblem.png" alt="" width={100} height={120} />
          <h1 className="lv-h1">{t("title")}</h1>
          <p className="lv-sub">{t("text")}</p>
          <div className="lv-btnrow">
            <Link className="lv-btn lv-btn--night" href="/">
              {t("back")}
            </Link>
            <Link className="lv-btn" href="/help">
              {t("help")}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
