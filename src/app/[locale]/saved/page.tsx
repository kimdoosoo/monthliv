import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileTabBar } from "@/components/MobileTabBar";
import { PhotoSlot } from "@/components/PhotoSlot";
import { ShareButton } from "@/components/ShareButton";
import { getListings, pick, sampleTrip } from "@/data/listings";
import { savedLists } from "@/data/samples";
import { Link } from "@/i18n/navigation";
import { formatPrice, formatRange } from "@/lib/format";
import { nightsBetween, quote } from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("saved");
  return { title: t("title") };
}

/**
 * Saved lists, each with a cover of its first places, then the places in the list picked
 * (?list=near-campus). Prices follow the trip's dates; a price cut since saving is said out loud.
 */
export default async function SavedPage({ searchParams }: PageProps<"/[locale]/saved">) {
  const locale = await getLocale();
  const t = await getTranslations();
  const { list: picked } = await searchParams;
  const list = savedLists.find((item) => item.id === picked) ?? savedLists[0];
  const items = getListings(list.ids);
  const nights = nightsBetween(sampleTrip.from, sampleTrip.to);

  return (
    <div className="lv-page lv-has-tabbar">
      <Header member current="saved" />

      <main className="lv-wrap lv-wrap--narrow lv-saved">
        <h1 className="lv-h1">{t("saved.title")}</h1>

        <nav className="lv-lists" aria-label={t("saved.lists")}>
          {savedLists.map((item) => {
            const places = getListings(item.ids).slice(0, 3);
            return (
              <Link
                key={item.id}
                className="lv-listcard"
                href={{ pathname: "/saved", query: { list: item.id } }}
                aria-current={item.id === list.id ? "page" : undefined}
                scroll={false}
              >
                <span className={`lv-listcard__cover lv-listcard__cover--${places.length}`}>
                  {places.map((place, index) => {
                    const photo = place.real?.photos[0];
                    return (
                      <PhotoSlot
                        key={place.id}
                        tone={place.tone + index}
                        className="lv-listcard__tile"
                        photo={photo && { listingId: place.id, photo }}
                        sizes="240px"
                        decorative
                      />
                    );
                  })}
                </span>
                <span className="lv-listcard__name">{pick(item.name, locale)}</span>
                <span className="lv-small">{t("saved.count", { count: item.ids.length })}</span>
              </Link>
            );
          })}
          <button className="lv-listcard lv-listcard--new" type="button">
            <span className="lv-listcard__cover lv-listcard__cover--new">
              <Plus size={36} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="lv-listcard__name">{t("saved.newList")}</span>
          </button>
        </nav>

        <section className="lv-saved__list" aria-labelledby="list-title">
          <div className="lv-saved__head">
            <div>
              <h2 id="list-title" className="lv-h2 lv-saved__h2">
                {pick(list.name, locale)}
              </h2>
              <p className="lv-sub">
                {t("saved.priceFor", {
                  dates: formatRange(sampleTrip.from, sampleTrip.to, locale),
                  guests: t("search.guests", { count: sampleTrip.guests }),
                })}
              </p>
            </div>
            <div className="lv-btnrow">
              <ShareButton
                className="lv-btn lv-btn--sm"
                label={t("saved.share")}
                copied={t("listing.shareCopied")}
                title={pick(list.name, locale)}
              />
              <Link className="lv-btn lv-btn--night lv-btn--sm" href="/search">
                {t("saved.map")}
              </Link>
            </div>
          </div>
          <ul className="lv-saveditems">
            {items.map((listing) => {
              const note = list.notes?.[listing.id];
              const drop = list.drops?.[listing.id];
              const photo = listing.real?.photos[0];
              return (
                <li key={listing.id}>
                  <Link className="lv-saveditem" href={`/stays/${listing.id}`}>
                    <PhotoSlot
                      tone={listing.tone}
                      className="lv-saveditem__photo"
                      photo={photo && { listingId: listing.id, photo }}
                      sizes="(max-width: 640px) 100vw, 280px"
                      decorative
                    />
                    <span className="lv-saveditem__title">{pick(listing.title, locale)}</span>
                    <span className="lv-small">
                      {t("saved.itemMeta", {
                        area: pick(listing.area, locale),
                        amount: formatPrice(quote(listing, nights).total, locale),
                      })}
                    </span>
                    {note && (
                      <span className="lv-saveditem__note">
                        {t("saved.note", { note: pick(note, locale) })}
                      </span>
                    )}
                    {drop && (
                      <span className="lv-saveditem__drop">{t("saved.drop", { amount: formatPrice(drop, locale) })}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="lv-note">{t("saved.tip")}</p>
        </section>
      </main>

      <Footer />
      <MobileTabBar active="saved" member />
    </div>
  );
}
