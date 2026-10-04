import type { Metadata } from "next";
import { CalendarDays, House, KeyRound, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { HashDetails } from "@/components/HashDetails";
import { Header } from "@/components/Header";
import { MobileTabBar } from "@/components/MobileTabBar";
import { MoonIcon } from "@/components/MoonIcon";
import { PhotoSlot } from "@/components/PhotoSlot";
import { getListing, pick } from "@/data/listings";
import { sampleBooking, sampleGuest, sampleToday } from "@/data/samples";
import { getPathname, Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { defaultDiscounts, discountFor, nightlyFor, nightsBetween, stayDay, stayTiers } from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("help");
  return { title: t("metaTitle") };
}

/** Topics and where each one starts. */
const topics = [
  { key: "booking", href: "/help#faq" },
  { key: "discounts", href: "/help#discounts" },
  { key: "changes", href: "/help#refunds" },
  { key: "staying", href: `/my-stays/${sampleBooking.code}` },
  { key: "account", href: "/help#safety" },
  { key: "hosting", href: "/host" },
] as const;

const topicIcon = {
  booking: <CalendarDays size={28} strokeWidth={1.75} aria-hidden="true" />,
  discounts: <MoonIcon length="month" size={28} />,
  changes: <RefreshCw size={28} strokeWidth={1.75} aria-hidden="true" />,
  staying: <KeyRound size={28} strokeWidth={1.75} aria-hidden="true" />,
  account: <ShieldCheck size={28} strokeWidth={1.75} aria-hidden="true" />,
  hosting: <House size={28} strokeWidth={1.75} aria-hidden="true" />,
};

/** Questions after the stay-length one; some have an id the footer links to. */
const faqs = [
  { key: "oneNight" },
  { key: "extend" },
  { key: "leaveEarly" },
  { key: "monthly" },
  { key: "refunds", id: "refunds" },
  { key: "safety", id: "safety" },
  { key: "translate" },
  { key: "hosting", id: "hosting" },
] as const;

/** The example place in the stay-length answer. */
const exampleNightly = 40000;

/**
 * Help: start from the stay you're in, then topics, common questions and emergency numbers.
 * The search looks through the questions here (?q=), on the server.
 */
export default async function HelpPage({ searchParams }: PageProps<"/[locale]/help">) {
  const locale = await getLocale();
  const t = await getTranslations();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const listing = getListing(sampleBooking.listingId);
  const nights = nightsBetween(sampleBooking.from, sampleBooking.to);
  const cover = listing?.real?.photos[0];

  const matches = (...texts: string[]) =>
    !query || texts.some((text) => text.toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale)));
  const showDiscount = matches(t("help.discountQ"), t("help.discountA"), t("help.discountMove"));
  const shown = faqs.filter(({ key }) => matches(t(`help.faq.${key}.q`), t(`help.faq.${key}.a`)));
  const found = shown.length + (showDiscount ? 1 : 0);

  return (
    <div className="lv-page lv-has-tabbar">
      <Header member />

      <main>
        <section className="lv-band" aria-labelledby="help-title">
          <div className="lv-wrap lv-wrap--narrow lv-helphero">
            <p className="lv-helphero__hello">{t("help.hello", { name: pick(sampleGuest.name, locale) })}</p>
            <h1 id="help-title" className="lv-helphero__h1">
              {t("help.title")}
            </h1>
            <form className="lv-helpsearch" role="search" action={`${getPathname({ href: "/help", locale })}#faq`}>
              <Search size={22} strokeWidth={1.75} aria-hidden="true" />
              <input
                type="search"
                name="q"
                defaultValue={query}
                aria-label={t("help.searchLabel")}
                placeholder={t("help.searchHint")}
              />
              <button className="lv-helpsearch__go" type="submit">
                {t("help.search")}
              </button>
            </form>
          </div>
        </section>

        <div className="lv-wrap lv-wrap--narrow lv-help">
          {listing && (
            <Link className="lv-helpstay" href={{ pathname: "/messages", hash: "thread" }}>
              <PhotoSlot
                tone={listing.tone}
                className="lv-helpstay__photo"
                photo={cover && { listingId: listing.id, photo: cover }}
                sizes="72px"
                decorative
              />
              <span className="lv-helpstay__body">
                <span className="lv-helpstay__label">{t("help.currentLabel")}</span>
                <span className="lv-helpstay__title">
                  {t("help.currentStay", {
                    title: pick(listing.title, locale),
                    day: stayDay(sampleBooking.from, sampleToday),
                    nights,
                  })}
                </span>
                <span className="lv-small">{t("help.currentHint")}</span>
              </span>
              <span className="lv-btn lv-btn--moon lv-btn--sm">{t("help.askHost")}</span>
            </Link>
          )}

          <section className="lv-help__sec" aria-labelledby="topics-title">
            <h2 id="topics-title" className="lv-help__h2">
              {t("help.topicsTitle")}
            </h2>
            <ul className="lv-topics">
              {topics.map(({ key, href }) => (
                <li key={key}>
                  <Link className="lv-topic" href={href}>
                    {topicIcon[key]}
                    <b>{t(`help.topics.${key}.title`)}</b>
                    <span>{t(`help.topics.${key}.text`)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="lv-help__split">
            <section className="lv-help__faq" id="faq" aria-labelledby="faq-title">
              <h2 id="faq-title" className="lv-help__h2">
                {query ? t("help.results", { query, count: found }) : t("help.faqTitle")}
              </h2>
              {query && found === 0 && <p className="lv-note">{t("help.noResults")}</p>}
              <div className="lv-faq">
                {showDiscount && (
                  <details open id="discounts">
                    <summary>{t("help.discountQ")}</summary>
                    <div className="lv-faq__body">
                      <p>{t("help.discountA")}</p>
                      <table className="lv-helptiers">
                        <caption>{t("help.discountExample", { price: formatPrice(exampleNightly, locale) })}</caption>
                        <thead>
                          <tr>
                            <th scope="col">{t("tiers.length")}</th>
                            <th scope="col">{t("tiers.nights")}</th>
                            <th scope="col">{t("help.off")}</th>
                            <th scope="col">{t("tiers.perNight")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stayTiers.map((tier) => {
                            const percent = discountFor(defaultDiscounts, tier.length);
                            return (
                              <tr key={tier.length} className={tier.length === "month" ? "is-on" : undefined}>
                                <th scope="row">{t(`length.${tier.length}`)}</th>
                                <td>{t(`length.${tier.length}Range`)}</td>
                                <td>{percent ? `${percent}%` : "—"}</td>
                                <td>{formatPrice(nightlyFor(exampleNightly, defaultDiscounts, tier.length), locale)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <p>{t("help.discountMove")}</p>
                    </div>
                  </details>
                )}
                {shown.map((faq) => (
                  <details key={faq.key} open={Boolean(query)}>
                    <summary>{t(`help.faq.${faq.key}.q`)}</summary>
                    <div className="lv-faq__body" id={"id" in faq ? faq.id : undefined}>
                      <p>{t(`help.faq.${faq.key}.a`)}</p>
                      {faq.key === "hosting" && (
                        <Link className="lv-link lv-self-start" href="/host">
                          {t("nav.host")}
                        </Link>
                      )}
                    </div>
                  </details>
                ))}
              </div>
              <HashDetails />
            </section>

            <aside className="lv-help__side" aria-label={t("help.contactLabel")}>
              <div className="lv-emergency lv-on-night">
                <h2 className="lv-editcard__title">{t("help.emergencyTitle")}</h2>
                <p>{t("help.emergencyText")}</p>
                <ul>
                  <li>
                    <span>{t("help.police")}</span>
                    <a href="tel:112">112</a>
                  </li>
                  <li>
                    <span>{t("help.fire")}</span>
                    <a href="tel:119">119</a>
                  </li>
                  <li>
                    <span>{t("help.tourist")}</span>
                    <a href="tel:1330">1330</a>
                  </li>
                </ul>
              </div>
              <div className="lv-editcard" id="contact">
                <h2 className="lv-editcard__title">{t("help.stillTitle")}</h2>
                <p className="lv-sub">{t("help.stillText")}</p>
                <Link className="lv-btn lv-btn--night lv-btn--block" href="/messages">
                  {t("help.message")}
                </Link>
                <span className="lv-btn lv-btn--block" aria-disabled="true">
                  {t("help.call")}
                </span>
                <p className="lv-small">{t("help.hours")}</p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
      <MobileTabBar member />
    </div>
  );
}
