import type { Metadata } from "next";
import { Heart, MessageSquare, Smartphone } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getPathname, Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login");
  return { title: t("metaTitle") };
}

const providers = ["kakao", "naver", "apple", "google", "phone"] as const;

const benefits = [
  { key: "save", Glyph: Heart },
  { key: "translate", Glyph: MessageSquare },
  { key: "stay", Glyph: Smartphone },
] as const;

/**
 * Sign in or sign up with one form. Korean guests mostly use Kakao or Naver, so those come first.
 * The provider buttons are plain until the login is connected; then they take each provider's
 * official button. In this preview every way in opens the sample account.
 */
export default async function LoginPage() {
  const locale = await getLocale();
  const t = await getTranslations("login");

  return (
    <div className="lv-page lv-page--hanji">
      <Header />

      <main className="lv-auth">
        <section className="lv-auth__card" aria-labelledby="login-title">
          <div className="lv-auth__head">
            <h1 id="login-title" className="lv-auth__h1">
              {t("title")}
            </h1>
            <p className="lv-auth__lead">{t("lead")}</p>
          </div>
          {/* The email is not sent anywhere in the preview, so the field has no name. */}
          <form className="lv-auth__form" action={getPathname({ href: "/account", locale })} method="get">
            <label className="lv-field">
              <span className="lv-field__label lv-field__label--plain">{t("email")}</span>
              <input
                className="lv-input"
                type="email"
                autoComplete="email"
                required
                placeholder={t("emailPlaceholder")}
              />
            </label>
            <button className="lv-btn lv-btn--moon lv-btn--block" type="submit">
              {t("continue")}
            </button>
          </form>
          <p className="lv-or">
            <span>{t("or")}</span>
          </p>
          <div className="lv-auth__ways">
            {providers.map((key) => (
              <Link key={key} className="lv-btn lv-btn--block lv-auth__way" href="/account">
                {t(key)}
              </Link>
            ))}
          </div>
          <p className="lv-auth__terms">
            {t.rich("terms", {
              terms: (chunks) => <Link href={{ pathname: "/about", hash: "terms" }}>{chunks}</Link>,
              privacy: (chunks) => <Link href={{ pathname: "/about", hash: "privacy" }}>{chunks}</Link>,
            })}
          </p>
        </section>

        <aside className="lv-auth__why" aria-labelledby="why-title">
          <h2 id="why-title" className="lv-auth__h2">
            {t("whyTitle")}
          </h2>
          <ul className="lv-why">
            {benefits.map(({ key, Glyph }) => (
              <li key={key}>
                <span className="lv-why__icon">
                  <Glyph size={22} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="lv-why__text">
                  <b>{t(`why.${key}.title`)}</b>
                  <span>{t(`why.${key}.text`)}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="lv-auth__host">
            {t("hostQ")}{" "}
            <Link className="lv-link" href="/host/today">
              {t("hostLink")}
            </Link>
          </p>
        </aside>
      </main>

      <Footer />
    </div>
  );
}
