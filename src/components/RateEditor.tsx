"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatCount, formatPrice } from "@/lib/format";
import { guestNightly, hostFeeBps, hostQuote, nightlyFor, quote, stayTiers, type Discounts } from "@/lib/pricing";
import { MoonIcon } from "./MoonIcon";

const examples = [3, 7, 28, 90];
const minNightly = 10_000;
const maxDiscount = 70;

type Tier = keyof Discounts;

const digits = (value: string) => Number(value.replace(/\D/g, "")) || 0;
const percent = (value: string) => Math.min(maxDiscount, digits(value));

/**
 * One 1-night price and three discounts for a room; every stay length's nightly price, what
 * guests pay (no fee added) and what the partner is paid (less the branch's operating fee) update
 * as they type. Each field keeps what is typed until it loses focus, then settles to a whole amount.
 */
export function RateEditor({
  initialNightly,
  initialDiscounts,
  feeBps = hostFeeBps,
}: {
  initialNightly: number;
  initialDiscounts: Discounts;
  /** The branch's operating fee in basis points. */
  feeBps?: number;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [nightly, setNightly] = useState(initialNightly);
  const [nightlyText, setNightlyText] = useState(() => formatCount(initialNightly, locale));
  const [discounts, setDiscounts] = useState<Discounts>(initialDiscounts);
  const [discountText, setDiscountText] = useState<Record<Tier, string>>(() => ({
    week: String(initialDiscounts.week),
    month: String(initialDiscounts.month),
    season: String(initialDiscounts.season),
  }));

  // Longer stays should never cost more a night than shorter ones.
  const inOrder = discounts.week <= discounts.month && discounts.month <= discounts.season;

  function settleNightly() {
    const value = Math.max(minNightly, Math.round(digits(nightlyText) / 100) * 100);
    setNightly(value);
    setNightlyText(formatCount(value, locale));
  }

  function editDiscount(tier: Tier, value: string) {
    setDiscountText((current) => ({ ...current, [tier]: value }));
    setDiscounts((current) => ({ ...current, [tier]: percent(value) }));
  }

  return (
    <>
      <section className="lv-editcard">
        <label className="lv-rate__nightly">
          {t("pricing.nightly")}
          <span className="lv-amount lv-amount--big">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={nightlyText}
              onChange={(event) => {
                setNightlyText(event.target.value);
                setNightly(digits(event.target.value));
              }}
              onBlur={settleNightly}
            />
            <span aria-hidden="true">{t("pricing.won")}</span>
          </span>
        </label>
        <p className="lv-small">
          {t("pricing.guestNightly", { price: formatPrice(guestNightly(nightly), locale) })}
        </p>
        <p className="lv-small">{t("pricing.nightlyHint")}</p>
      </section>

      <section className="lv-editcard" aria-labelledby="discount-title">
        <div>
          <h2 id="discount-title" className="lv-editcard__title">
            {t("pricing.discountTitle")}
          </h2>
          <p className="lv-editcard__sub">{t("pricing.discountSub")}</p>
        </div>
        <div className="lv-raterows">
          {stayTiers.map((tier) => (
            <div
              key={tier.length}
              className={`lv-raterow${tier.length === "night" ? " lv-raterow--base" : ""}${tier.length === "month" ? " is-on" : ""}`}
            >
              <span className="lv-raterow__name">
                <MoonIcon length={tier.length} size={28} />
                <span>
                  {t(`length.${tier.length}`)}
                  <span className="lv-raterow__range">{t(`length.${tier.length}Range`)}</span>
                </span>
              </span>
              {tier.length === "night" ? (
                <span className="lv-raterow__base">{t("pricing.base")}</span>
              ) : (
                <label className="lv-raterow__pct">
                  <span aria-hidden="true">{t("pricing.off")}</span>
                  <span className="lv-sr">{t("pricing.discountFor", { length: t(`length.${tier.length}`) })}</span>
                  <span className="lv-amount">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={2}
                      value={discountText[tier.length]}
                      onChange={(event) => editDiscount(tier.length as Tier, event.target.value)}
                      onBlur={() =>
                        setDiscountText((current) => ({
                          ...current,
                          [tier.length]: String(discounts[tier.length as Tier]),
                        }))
                      }
                    />
                    <span aria-hidden="true">%</span>
                  </span>
                </label>
              )}
              <span className="lv-raterow__price">
                {formatPrice(nightlyFor(nightly, discounts, tier.length), locale)}
              </span>
            </div>
          ))}
        </div>
        {!inOrder && (
          <p className="lv-note lv-note--danger" role="status">
            <TriangleAlert size={18} strokeWidth={1.75} aria-hidden="true" />
            {t("pricing.orderWarning")}
          </p>
        )}
      </section>

      <section className="lv-editcard lv-editcard--night lv-on-night" aria-labelledby="guestsee-title">
        <h2 id="guestsee-title" className="lv-editcard__title">
          {t("pricing.guestSees")}
        </h2>
        <ul className="lv-guestsee" aria-live="polite">
          {examples.map((nights) => {
            // The nights only: cleaning is set below and passes to the partner with no fee.
            const place = { nightly, discounts, cleaning: 0, feeBps };
            return (
              <li key={nights}>
                <span>{t("price.nights", { nights })}</span>
                <b>{formatPrice(quote(place, nights).total, locale)}</b>
                <span>{t("pricing.payoutLine", { amount: formatPrice(hostQuote(place, nights).payout, locale) })}</span>
              </li>
            );
          })}
        </ul>
        <p className="lv-editcard__note">
          {t("pricing.guestSeesNote", { hostFee: feeBps / 100 })}
        </p>
      </section>
    </>
  );
}
