import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@/lib/format";
import { discountFor, guestNightlyFor, stayTiers, type Discounts, type StayLength } from "@/lib/pricing";
import { MoonIcon } from "./MoonIcon";

/** Nights used for each tier's example stay, except the tier of the dates picked. */
const exampleNights: Record<StayLength, number> = { night: 3, week: 7, month: 28, season: 90 };

/**
 * The nightly price guests pay for each stay length (service fee in), on the Moon Scale. Booking a
 * longer stay moves the whole booking to the lower price. The row of the dates picked is lit, with
 * that stay as its example.
 */
export function StayTiers({
  hostNightly,
  discounts,
  current,
  nights,
  caption,
}: {
  /** The host's 1-night price; the table shows guest prices. */
  hostNightly: number;
  discounts: Discounts;
  current: StayLength;
  /** Nights of the dates picked. */
  nights: number;
  caption?: string;
}) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="lv-tiertable">
      <table>
        {caption && <caption className="lv-sr">{caption}</caption>}
        <thead>
          <tr>
            <th scope="col">{t("tiers.length")}</th>
            <th scope="col" className="lv-tiertable__nights">
              {t("tiers.nights")}
            </th>
            <th scope="col">{t("tiers.perNight")}</th>
            <th scope="col">{t("tiers.example")}</th>
          </tr>
        </thead>
        <tbody>
          {stayTiers.map((tier) => {
            const percent = discountFor(discounts, tier.length);
            const price = guestNightlyFor(hostNightly, discounts, tier.length);
            const on = tier.length === current;
            const count = on ? nights : exampleNights[tier.length];
            return (
              <tr key={tier.length} aria-current={on ? "true" : undefined}>
                <th scope="row">
                  <span className="lv-tiertable__name">
                    <MoonIcon length={tier.length} size={22} />
                    {t(`length.${tier.length}`)}
                  </span>
                  <span className="lv-tiertable__range">{t(`length.${tier.length}Range`)}</span>
                </th>
                <td className="lv-tiertable__nights">{t(`length.${tier.length}Range`)}</td>
                <td>
                  <b>{formatPrice(price, locale)}</b>
                  {percent > 0 && <span className="lv-tiertable__off"> {t("search.minus", { percent })}</span>}
                </td>
                <td className="lv-tiertable__example">
                  {on
                    ? t("tiers.picked", { nights: count, amount: formatPrice(price * count, locale) })
                    : t("tiers.exampleStay", { nights: count, amount: formatPrice(price * count, locale) })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
