import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/AccountShell";
import { DoneButton } from "@/components/DoneButton";
import { getListing, pick } from "@/data/listings";
import { pastStays, sampleBooking, sampleGuest } from "@/data/samples";
import { Link } from "@/i18n/navigation";
import { formatDate, formatPrice, formatRange } from "@/lib/format";
import { addDays, nightsBetween, quote, splitTotal } from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("payments.title"), robots: { index: false } };
}

const easyPays = ["kakaopay", "naverpay", "tosspay"] as const;

/**
 * Payments: the saved card (a payment-gateway token and the last four digits, nothing more),
 * what is due next and what has been paid.
 */
export default async function PaymentsPage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const listing = getListing(sampleBooking.listingId);
  if (!listing) return null;

  const nights = nightsBetween(sampleBooking.from, sampleBooking.to);
  const [first, second] = splitTotal(quote(listing, nights).total);
  const secondOn = addDays(sampleBooking.from, Math.floor(nights / 2));

  const history = [
    {
      key: "first",
      title: `${pick(listing.title, locale)} · ${t("stays.firstPayment")}`,
      meta: `${formatDate(sampleBooking.bookedOn, locale)} · ${sampleBooking.code}`,
      amount: first,
    },
    ...pastStays.flatMap((stay) => {
      const place = stay.listingId ? getListing(stay.listingId) : undefined;
      if (!place) return [];
      const stayNights = nightsBetween(stay.from, stay.to);
      return [
        {
          key: stay.key,
          title: pick(place.title, locale),
          meta: `${formatRange(stay.from, stay.to, locale)} · ${t("price.nights", { nights: stayNights })}`,
          amount: quote(place, stayNights).total,
        },
      ];
    }),
  ];

  return (
    <AccountShell current="payments">
      <div className="lv-editor__head">
        <h1 className="lv-editor__h1">{t("account.payments.title")}</h1>
        <p className="lv-sub">{t("account.payments.lead")}</p>
      </div>

      <section className="lv-editcard" aria-labelledby="methods-title">
        <h2 id="methods-title" className="lv-editcard__title">
          {t("account.payments.methodsTitle")}
        </h2>
        <ul className="lv-rows">
          <li className="lv-rows__row">
            <span className="lv-rows__icon" aria-hidden="true">
              <CreditCard size={22} strokeWidth={1.75} />
            </span>
            <span className="lv-rows__main">
              <b>{t("book.savedCard", { last4: sampleGuest.card })}</b>
              <span className="lv-small">{t("account.payments.defaultCard")}</span>
            </span>
            <DoneButton className="lv-btn lv-btn--xs" label={t("account.payments.remove")} done={t("account.payments.removed")} />
          </li>
          <li className="lv-rows__row">
            <span className="lv-rows__main">
              <b>{t("account.payments.easyPay")}</b>
              <span className="lv-small">
                {t("account.payments.easyPayText", { names: easyPays.map((key) => t(`book.methods.${key}`)).join(", ") })}
              </span>
            </span>
          </li>
        </ul>
        <p className="lv-note">{t("account.payments.tokenNote")}</p>
        <DoneButton className="lv-btn lv-btn--sm lv-self-start" label={t("account.payments.addCard")} done={t("account.payments.addCardDone")} />
      </section>

      <section className="lv-editcard" aria-labelledby="due-title">
        <h2 id="due-title" className="lv-editcard__title">
          {t("account.payments.dueTitle")}
        </h2>
        <div className="lv-rows__row">
          <span className="lv-rows__main">
            <b>
              {pick(listing.title, locale)} · {t("stays.secondPayment")}
            </b>
            <span className="lv-small">
              {formatDate(secondOn, locale)} · {t("stays.sameCard")} · {sampleBooking.code}
            </span>
          </span>
          <b className="lv-rows__amount">{formatPrice(second, locale)}</b>
        </div>
      </section>

      <section className="lv-editcard" aria-labelledby="history-title">
        <h2 id="history-title" className="lv-editcard__title">
          {t("account.payments.historyTitle")}
        </h2>
        <ul className="lv-rows">
          {history.map((row) => (
            <li key={row.key} className="lv-rows__row">
              <span className="lv-rows__main">
                <b>{row.title}</b>
                <span className="lv-small">{row.meta}</span>
              </span>
              <span className="lv-rows__end">
                <b className="lv-rows__amount">{formatPrice(row.amount, locale)}</b>
                <span className="lv-badge lv-badge--celadon lv-badge--sm">{t("stays.paid")}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="lv-small">{t("account.payments.receiptNote")}</p>
        <Link className="lv-link lv-self-start" href={{ pathname: "/help", hash: "refunds" }}>
          {t("footer.refunds")}
        </Link>
      </section>
    </AccountShell>
  );
}
