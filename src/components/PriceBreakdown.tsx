import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@/lib/format";
import type { Quote } from "@/lib/pricing";

/**
 * Everything the guest pays, line by line, ending with the total. A guest fee, if there ever is
 * one, is already in the nightly price and never added; the line under the total says how much
 * of it is fee, and is left out while there is none (MONTHLIV charges guests no fee).
 * A coupon, when one is used, comes off after the stay-length discount and cleaning.
 */
export function PriceBreakdown({
  price,
  coupon,
}: {
  price: Quote;
  coupon?: { label: string; amount: number };
}) {
  const t = useTranslations("price");
  const locale = useLocale();
  const won = (amount: number) => formatPrice(amount, locale);
  const total = price.total - (coupon?.amount ?? 0);

  return (
    <dl className="lv-price">
      <div className="lv-price__line">
        <dt>{t("nightsLine", { price: won(price.nightly), nights: price.nights })}</dt>
        <dd>{won(price.base)}</dd>
      </div>
      {price.discount > 0 && (
        <div className="lv-price__line lv-price__line--save">
          <dt>
            {t("discountLine", {
              length: t(`lengthDiscount.${price.length}`),
              percent: price.discountPercent,
            })}
          </dt>
          <dd>−{won(price.discount)}</dd>
        </div>
      )}
      <div className="lv-price__line">
        <dt>{t("cleaning")}</dt>
        <dd>{won(price.cleaning)}</dd>
      </div>
      {coupon && coupon.amount > 0 && (
        <div className="lv-price__line lv-price__line--save">
          <dt>{coupon.label}</dt>
          <dd>−{won(coupon.amount)}</dd>
        </div>
      )}
      <div className="lv-price__total">
        <dt>{t("total")}</dt>
        <dd>{won(total)}</dd>
      </div>
      {price.service > 0 && (
        <div className="lv-price__incl">
          <dt>{t("serviceIncluded")}</dt>
          <dd>{won(price.service)}</dd>
        </div>
      )}
    </dl>
  );
}
