import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AmountInput } from "@/components/AmountInput";
import { DoneButton } from "@/components/DoneButton";
import { HostShell } from "@/components/HostShell";
import { ListingEditorNav } from "@/components/ListingEditorNav";
import { RateEditor } from "@/components/RateEditor";
import { hostPlaces } from "@/data/host";
import { getListing } from "@/data/listings";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pricing");
  return { title: t("title"), robots: { index: false } };
}

/**
 * Prices and stay-length discounts for one room, in the partner centre's room editor
 * (?listing= picks the room; the partner's first room by default).
 */
export default async function HostPricingPage({ searchParams }: PageProps<"/[locale]/host/pricing">) {
  const locale = await getLocale();
  const t = await getTranslations();
  const { listing: picked } = await searchParams;
  const place = hostPlaces.find((item) => item.listingId && item.listingId === picked) ?? hostPlaces[0];
  const listing = getListing(place.listingId ?? "seongsu-window");
  if (!listing) return null;

  return (
    <HostShell current="listings" wide>
      <div className="lv-editor lv-editor--work">
        <ListingEditorNav listingId={listing.id} current="pricing" />

        <div className="lv-editor__main">
          <div className="lv-editor__head">
            <h1 className="lv-editor__h1">{t("pricing.title")}</h1>
            <p className="lv-sub">{t("pricing.lead")}</p>
          </div>

          <RateEditor
            key={listing.id}
            initialNightly={listing.nightly}
            initialDiscounts={listing.discounts}
            feeBps={listing.feeBps}
          />

          <section className="lv-editcard" aria-labelledby="terms-title">
            <h2 id="terms-title" className="lv-editcard__title">
              {t("pricing.termsTitle")}
            </h2>
            <div className="lv-editcard__grid">
              <label className="lv-field">
                <span className="lv-field__label lv-field__label--plain">{t("pricing.minNights")}</span>
                <select className="lv-select" defaultValue="1">
                  <option value="1">{t("pricing.minOne")}</option>
                  <option value="2">{t("price.nights", { nights: 2 })}</option>
                  <option value="7">{t("price.nights", { nights: 7 })}</option>
                  <option value="28">{t("price.nights", { nights: 28 })}</option>
                </select>
              </label>
              <label className="lv-field">
                <span className="lv-field__label lv-field__label--plain">{t("pricing.maxNights")}</span>
                <select className="lv-select" defaultValue="180">
                  <option value="180">{t("price.nights", { nights: 180 })}</option>
                  <option value="90">{t("price.nights", { nights: 90 })}</option>
                  <option value="0">{t("pricing.noLimit")}</option>
                </select>
              </label>
              <label className="lv-field">
                <span className="lv-field__label lv-field__label--plain">{t("pricing.cleaning")}</span>
                <AmountInput initial={listing.cleaning} step={1000} unit={t("pricing.won")} />
              </label>
              <label className="lv-field">
                <span className="lv-field__label lv-field__label--plain">{t("pricing.midClean")}</span>
                <select className="lv-select" defaultValue="included">
                  <option value="included">{t("pricing.midIncluded")}</option>
                  <option value="request">{t("pricing.midRequest", { amount: formatPrice(25000, locale) })}</option>
                  <option value="none">{t("pricing.midNone")}</option>
                </select>
              </label>
            </div>
            <label className="lv-optrow lv-optrow--first">
              <span>
                <b>{t("pricing.monthly")}</b>
                <span className="lv-small">{t("pricing.monthlyText")}</span>
              </span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="lv-optrow">
              <span>
                <b>{t("pricing.instant")}</b>
                <span className="lv-small">{t("pricing.instantText")}</span>
              </span>
              <input type="checkbox" />
            </label>
          </section>

          <div className="lv-btnrow">
            <DoneButton className="lv-btn lv-btn--moon" label={t("pricing.save")} done={t("pricing.saved")} />
            <Link className="lv-btn lv-btn--line" href={`/stays/${listing.id}`}>
              {t("pricing.preview")}
            </Link>
          </div>
        </div>
      </div>
    </HostShell>
  );
}
