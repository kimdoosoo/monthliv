import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/AccountShell";
import { DoneButton } from "@/components/DoneButton";
import { ReviewText } from "@/components/ReviewText";
import { sampleReviews } from "@/data/listings";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { languageName, nativeNames } from "@/lib/languages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("language");
  return { title: t("title"), robots: { index: false } };
}

/** Currencies an estimate can be shown in. Payment is always in won. */
const currencies = [
  { code: "KRW", symbol: "₩" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "JPY", symbol: "¥" },
  { code: "CNY", symbol: "¥" },
  { code: "TWD", symbol: "NT$" },
  { code: "SGD", symbol: "S$" },
] as const;

/** A Monday, to show how dates are written. */
const exampleDay = new Date("2026-11-02T12:00:00+09:00");
const sunday = new Date("2026-11-01T12:00:00+09:00");

function currencyName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * Language and currency, in the account. A language applies as soon as it's picked (each one is
 * a link to this page in that language); the other settings wait for 저장.
 */
export default async function LanguagePage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const review = sampleReviews.find((item) => item.original === "de" && locale !== "de") ??
    sampleReviews.find((item) => item.original !== locale) ??
    sampleReviews[0];
  const textIn = (lang: string) => review.text[lang as keyof typeof review.text] ?? review.text.en;
  const zone = { timeZone: "Asia/Seoul" } as const;
  const dateStyles = [
    { key: "long", text: new Intl.DateTimeFormat(locale, { ...zone, dateStyle: "full" }).format(exampleDay) },
    {
      key: "short",
      text: new Intl.DateTimeFormat(locale, { ...zone, year: "numeric", month: "numeric", day: "numeric", weekday: "short" }).format(exampleDay),
    },
    {
      key: "iso",
      text: `2026-11-02 (${new Intl.DateTimeFormat(locale, { ...zone, weekday: "short" }).format(exampleDay)})`,
    },
  ];
  const weekday = (day: Date) => new Intl.DateTimeFormat(locale, { ...zone, weekday: "long" }).format(day);

  return (
    <AccountShell current="language">
      <div className="lv-editor__head">
        <h1 className="lv-editor__h1">{t("language.title")}</h1>
        <p className="lv-sub">{t("language.lead")}</p>
      </div>

      <section className="lv-editcard" aria-labelledby="lang-title">
        <div>
          <h2 id="lang-title" className="lv-editcard__title">
            {t("language.languageTitle")}
          </h2>
          <p className="lv-editcard__sub">{t("language.languageNote")}</p>
        </div>
        <ul className="lv-optcards" aria-label={t("language.languagePick")}>
          {routing.locales.map((language) => {
            const current = language === locale;
            return (
              <li key={language}>
                <Link
                  className="lv-optcard"
                  href="/language"
                  locale={language}
                  aria-current={current ? "true" : undefined}
                >
                  <span className="lv-optcard__dot" aria-hidden="true" />
                  <span className="lv-optcard__text">
                    <b lang={language}>{nativeNames[language]}</b>
                    <span>{current ? t("language.current") : languageName(language, locale)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <form className="lv-editor__form" action="#">
        <section className="lv-editcard" aria-labelledby="translate-title">
          <div>
            <h2 id="translate-title" className="lv-editcard__title">
              {t("language.translateTitle")}
            </h2>
            <p className="lv-editcard__sub">{t("language.translateLead")}</p>
          </div>
          <label className="lv-optrow lv-optrow--first">
            <span>
              <b>{t("language.translateListings")}</b>
              <span className="lv-small">{t("language.translateListingsText")}</span>
            </span>
            <input type="checkbox" defaultChecked />
          </label>
          <label className="lv-optrow">
            <span>
              <b>{t("language.translateMessages")}</b>
              <span className="lv-small">{t("language.translateMessagesText")}</span>
            </span>
            <input type="checkbox" defaultChecked />
          </label>
          <label className="lv-optrow">
            <span>
              <b>{t("language.showOriginal")}</b>
              <span className="lv-small">{t("language.showOriginalText")}</span>
            </span>
            <input type="checkbox" />
          </label>
          <div className="lv-transpreview">
            <span className="lv-transpreview__label">{t("language.previewLabel", { name: review.name })}</span>
            <ReviewText
              translated={textIn(locale)}
              translatedLang={locale in review.text ? locale : "en"}
              original={textIn(review.original)}
              originalLang={review.original}
              note={t("listing.translatedFrom", { language: languageName(review.original, locale) })}
              showOriginal={t("listing.showOriginal")}
              showTranslation={t("listing.showTranslation")}
            />
          </div>
        </section>

        <section className="lv-editcard" aria-labelledby="currency-title">
          <div>
            <h2 id="currency-title" className="lv-editcard__title">
              {t("language.currencyTitle")}
            </h2>
            <p className="lv-editcard__sub">{t("language.currencyLead")}</p>
          </div>
          <fieldset className="lv-optcards">
            <legend className="lv-sr">{t("language.currencyPick")}</legend>
            {currencies.map(({ code, symbol }) => (
              <label key={code} className="lv-optcard">
                <input type="radio" name="currency" value={code} defaultChecked={code === "KRW"} />
                <span className="lv-optcard__text">
                  <b>{currencyName(code, locale)}</b>
                  <span>
                    {code} · {symbol}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        </section>

        <section className="lv-editcard" aria-labelledby="format-title">
          <h2 id="format-title" className="lv-editcard__title">
            {t("language.formatTitle")}
          </h2>
          <div className="lv-editcard__grid">
            <label className="lv-field">
              <span className="lv-field__label lv-field__label--plain">{t("language.timezone")}</span>
              <select className="lv-select" defaultValue="seoul">
                <option value="seoul">{t("language.zones.seoul")}</option>
                <option value="london">{t("language.zones.london")}</option>
                <option value="newYork">{t("language.zones.newYork")}</option>
              </select>
            </label>
            <label className="lv-field">
              <span className="lv-field__label lv-field__label--plain">{t("language.dateFormat")}</span>
              <select className="lv-select" defaultValue="long">
                {dateStyles.map(({ key, text }) => (
                  <option key={key} value={key}>
                    {text}
                  </option>
                ))}
              </select>
            </label>
            <label className="lv-field">
              <span className="lv-field__label lv-field__label--plain">{t("language.weekStart")}</span>
              <select className="lv-select" defaultValue="sunday">
                <option value="sunday">{weekday(sunday)}</option>
                <option value="monday">{weekday(exampleDay)}</option>
              </select>
            </label>
            <label className="lv-field">
              <span className="lv-field__label lv-field__label--plain">{t("language.area")}</span>
              <select className="lv-select" defaultValue="sqm">
                <option value="sqm">{t("language.areas.sqm")}</option>
                <option value="pyeong">{t("language.areas.pyeong")}</option>
                <option value="sqft">{t("language.areas.sqft")}</option>
              </select>
            </label>
          </div>
        </section>

        <div className="lv-btnrow lv-btnrow--end">
          <Link className="lv-btn" href="/account">
            {t("language.cancel")}
          </Link>
          <DoneButton className="lv-btn lv-btn--night" label={t("language.save")} done={t("language.saved")} />
        </div>
      </form>
    </AccountShell>
  );
}
