import type { Metadata } from "next";
import { BellRing, Camera, Wrench } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MoonIcon } from "@/components/MoonIcon";
import { sampleTrip } from "@/data/listings";
import { Link } from "@/i18n/navigation";
import { formatPrice, formatRange } from "@/lib/format";
import {
  defaultDiscounts,
  directFeeBps,
  directFeePercent,
  discountFor,
  hostQuote,
  nightlyFor,
  nightsBetween,
  otherFeePercent,
  stayTiers,
} from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("host");
  return { title: t("metaTitle") };
}

const steps = ["list", "price", "welcome", "paid"] as const;
const faqs = ["oneRoom", "fees", "leaveEarly", "english", "allowed"] as const;

/** The 1-night price the page uses to show how discounts work. */
const exampleNightly = 40000;

/**
 * Partner with MONTHLIV (점주 모집): how MONTHLIV runs a branch for its partner, the operating
 * fee and how a branch opens. One brown button (look round the partner centre); the closing
 * panel asks to talk. The picture beside the title is the brand's illustrated logo, not a photo.
 */
export default async function HostPage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const nights = nightsBetween(sampleTrip.from, sampleTrip.to);

  return (
    <div className="lv-page">
      <Header current="host" />

      <main>
        <section className="lv-wrap lv-wrap--narrow lv-hosthero" aria-labelledby="host-title">
          <div className="lv-hosthero__text">
            <p className="lv-label">{t("host.label")}</p>
            <h1 id="host-title" className="lv-display lv-hosthero__h1">
              {t("host.title")}
            </h1>
            <p className="lv-hosthero__lead">{t("host.lead")}</p>
            <div className="lv-btnrow">
              <Link className="lv-btn lv-btn--moon lv-btn--lg" href="/host/today">
                {t("host.start")}
              </Link>
              <a className="lv-btn lv-btn--line lv-btn--lg" href="#how">
                {t("host.how")}
              </a>
            </div>
          </div>
          <div className="lv-hosthero__art">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="lv-hosthero__slippers"
              src="/brand/monthliv-logo-mixed-illustration.png"
              alt=""
              width={1137}
              height={826}
            />
            <div className="lv-hostnotice" aria-label={t("host.noticeLabel")} role="group">
              <span className="lv-hostnotice__new">
                <span className="lv-hostnotice__dot" aria-hidden="true" />
                {t("host.noticeNew")}
              </span>
              <span className="lv-hostnotice__stay">
                {formatRange(sampleTrip.from, sampleTrip.to, locale)} · {t("price.nights", { nights })}
              </span>
              <span className="lv-small">{t("host.noticeMeta")}</span>
            </div>
          </div>
        </section>

        <section className="lv-band" aria-labelledby="why-title">
          <div className="lv-wrap lv-wrap--narrow lv-hostwhy">
            <h2 id="why-title" className="lv-h2 lv-hostwhy__title">
              {t("host.whyTitle")}
            </h2>
            <ul className="lv-hostwhy__grid">
              <li className="lv-hostwhy__card">
                <Wrench size={32} strokeWidth={1.75} aria-hidden="true" />
                <h3 className="lv-h3">{t("host.reasons.cleaning.title")}</h3>
                <p className="lv-sub">{t("host.reasons.cleaning.text")}</p>
              </li>
              <li className="lv-hostwhy__card">
                <Camera size={32} strokeWidth={1.75} aria-hidden="true" />
                <h3 className="lv-h3">{t("host.reasons.income.title")}</h3>
                <p className="lv-sub">{t("host.reasons.income.text")}</p>
              </li>
              <li className="lv-hostwhy__card">
                <BellRing size={32} strokeWidth={1.75} aria-hidden="true" />
                <h3 className="lv-h3">{t("host.reasons.guests.title")}</h3>
                <p className="lv-sub">{t("host.reasons.guests.text")}</p>
              </li>
            </ul>
          </div>
        </section>

        <section className="lv-wrap lv-wrap--narrow lv-hostrate" aria-labelledby="rate-title">
          <div className="lv-hostrate__text">
            <h2 id="rate-title" className="lv-h2">
              {t("host.rateTitle")}
            </h2>
            <p className="lv-hostrate__lead">{t("host.rateText")}</p>
            <Link className="lv-link lv-self-start" href="/host/pricing">
              {t("host.rateLink")}
            </Link>
          </div>
          <dl className="lv-ratecard">
            <div className="lv-ratecard__head">
              <dt>{t("host.rateHead")}</dt>
              <dd>{formatPrice(exampleNightly, locale)}</dd>
            </div>
            {stayTiers
              .filter((tier) => tier.length !== "night")
              .map((tier) => (
                <div key={tier.length} className="lv-ratecard__row">
                  <dt>
                    <MoonIcon length={tier.length} size={22} />
                    {t("host.rateRow", { length: t(`length.${tier.length}`), from: tier.from })}
                  </dt>
                  <dd>
                    {t.rich("host.rateOff", {
                      percent: discountFor(defaultDiscounts, tier.length),
                      price: formatPrice(nightlyFor(exampleNightly, defaultDiscounts, tier.length), locale),
                      b: (chunks) => <b>{chunks}</b>,
                    })}
                  </dd>
                </div>
              ))}
          </dl>
        </section>

        <section id="how" className="lv-on-night lv-hoststeps" aria-labelledby="steps-title">
          <div className="lv-wrap lv-wrap--narrow lv-hoststeps__in">
            <h2 id="steps-title" className="lv-h2">
              {t("host.stepsTitle")}
            </h2>
            <ol className="lv-hoststeps__list">
              {steps.map((key, index) => (
                <li key={key}>
                  <span className="lv-how__num" aria-hidden="true">
                    {index + 1}
                  </span>
                  <h3 className="lv-h3">{t(`host.steps.${key}.title`)}</h3>
                  <p>{t(`host.steps.${key}.text`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="lv-wrap lv-wrap--narrow lv-hostfaq" aria-labelledby="hostfaq-title">
          <h2 id="hostfaq-title" className="lv-h1 lv-h1--sm">
            {t("host.faqTitle")}
          </h2>
          <div className="lv-faq">
            {faqs.map((key, index) => (
              <details key={key} open={index === 0}>
                <summary>{t(`host.faq.${key}.q`)}</summary>
                <p>
                  {key === "fees"
                    ? t("host.faq.fees.a", {
                        direct: directFeePercent,
                        other: otherFeePercent,
                        price: formatPrice(exampleNightly, locale),
                        payout: formatPrice(
                          hostQuote(
                            { nightly: exampleNightly, discounts: defaultDiscounts, cleaning: 0, feeBps: directFeeBps },
                            1,
                          ).payout,
                          locale,
                        ),
                      })
                    : t(`host.faq.${key}.a`)}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="lv-wrap lv-wrap--narrow lv-hostend" aria-labelledby="cta-title">
          <div className="lv-hostend__panel">
            <h2 id="cta-title" className="lv-hostend__title">
              {t("host.ctaTitle")}
            </h2>
            <Link className="lv-btn lv-btn--night lv-btn--lg" href={{ pathname: "/help", hash: "contact" }}>
              {t("host.contact")}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
