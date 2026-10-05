import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { GuidePlaces, type GuidePlace } from "@/components/GuidePlaces";
import { Header } from "@/components/Header";
import { MapThumb } from "@/components/MapThumb";
import { MobileTabBar } from "@/components/MobileTabBar";
import { PhotoSlot } from "@/components/PhotoSlot";
import { getListings, getSearchArea, pick } from "@/data/listings";
import { placeCategories, seongsuPlaces } from "@/data/places";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { guestNightlyFor } from "@/lib/pricing";

export function generateStaticParams() {
  return [{ slug: "seongsu" }];
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("guide");
  return { title: t("metaTitle") };
}

const commute = [
  { key: "gangnam", minutes: 20 },
  { key: "cityHall", minutes: 25 },
  { key: "hongdae", minutes: 35 },
  { key: "airport", minutes: 90 },
] as const;

/** A neighbourhood guide written for living there, not for passing through. */
export default async function NeighbourhoodPage({ params }: PageProps<"/[locale]/neighbourhoods/[slug]">) {
  const { slug } = await params;
  const area = getSearchArea(slug);
  if (slug !== "seongsu" || !area) notFound();

  const locale = await getLocale();
  const t = await getTranslations();
  const stays = getListings(area.ids).slice(0, 4);
  const name = pick(area.name, locale);

  const guidePlaces: GuidePlace[] = seongsuPlaces.map((place) => ({
    key: place.key,
    category: place.category,
    name: t(`guide.places.${place.key}.name`),
    text: t(`guide.places.${place.key}.text`),
    pin: {
      id: place.key,
      label: t(`guide.places.${place.key}.short`),
      title: t(`guide.places.${place.key}.name`),
      lat: place.lat,
      lng: place.lng,
      kind: "place",
    },
  }));

  return (
    <div className="lv-page lv-has-tabbar">
      <Header />

      <main>
        <section className="lv-wrap lv-wrap--narrow lv-guide__hero" aria-labelledby="guide-title">
          <div className="lv-guide__intro">
            <nav className="lv-crumbs" aria-label={t("guide.crumbs")}>
              <Link href={{ pathname: "/search", query: { where: t("guide.city") } }}>{t("guide.city")}</Link>
              <span aria-hidden="true"> / </span>
              <span>{t("guide.district")}</span>
            </nav>
            <h1 id="guide-title" className="lv-guide__h1">
              {name}
            </h1>
            <p className="lv-guide__lead">{t("guide.intro")}</p>
            <ul className="lv-chips">
              <li className="lv-badge lv-badge--tag">{t("guide.tags.remote")}</li>
              <li className="lv-badge lv-badge--tag">{t("guide.tags.park")}</li>
              <li className="lv-badge lv-badge--tag">{t("guide.tags.line2")}</li>
            </ul>
            <Link
              className="lv-btn lv-btn--moon lv-self-start lv-guide__cta"
              href={{ pathname: "/search", query: { where: name } }}
            >
              {t("guide.seeStays", { count: area.ids.length })}
            </Link>
          </div>
          <div className="lv-guide__visual">
            <MapThumb lat={area.center.lat} lng={area.center.lng} zoom={14.6} />
          </div>
        </section>

        <section className="lv-band" aria-labelledby="commute-title">
          <div className="lv-wrap lv-wrap--narrow lv-commute">
            <h2 id="commute-title" className="lv-guide__h2">
              {t("guide.commuteTitle")}
            </h2>
            <ul className="lv-commute__list">
              {commute.map(({ key, minutes }) => (
                <li key={key}>
                  <span className="lv-commute__place">{t(`guide.commute.${key}.place`)}</span>
                  <span className="lv-commute__time">{t("guide.about", { minutes })}</span>
                  <span className="lv-small">{t(`guide.commute.${key}.how`)}</span>
                </li>
              ))}
            </ul>
            <p className="lv-small">{t("guide.commuteNote")}</p>
          </div>
        </section>

        <section className="lv-wrap lv-wrap--narrow lv-guide__sec" aria-labelledby="living-title">
          <div className="lv-guide__head">
            <h2 id="living-title" className="lv-guide__h2">
              {t("guide.livingTitle")}
            </h2>
            <p className="lv-sub">{t("guide.livingSub")}</p>
          </div>
          <GuidePlaces
            categories={placeCategories.map((key) => ({ key, label: t(`guide.categories.${key}`) }))}
            places={guidePlaces}
            groupLabel={t("guide.kinds")}
            mapLabel={t("guide.mapLabel")}
          />
        </section>

        <section className="lv-wrap lv-wrap--narrow lv-guide__sec lv-guide__stays" aria-labelledby="stays-title">
          <div className="lv-section__head lv-guide__staysHead">
            <h2 id="stays-title" className="lv-guide__h2">
              {t("guide.staysTitle", { area: name })}
            </h2>
            <Link className="lv-link" href={{ pathname: "/search", query: { where: name } }}>
              {t("guide.allOnMap")}
            </Link>
          </div>
          <ul className="lv-guide__grid">
            {stays.map((listing) => (
              <li key={listing.id}>
                <Link className="lv-guidestay" href={`/stays/${listing.id}`}>
                  <PhotoSlot tone={listing.tone} className="lv-guidestay__photo" />
                  <span className="lv-guidestay__title">{pick(listing.title, locale)}</span>
                  <span className="lv-small">
                    {t("guide.fromSeason", {
                      price: formatPrice(guestNightlyFor(listing.nightly, listing.discounts, "season"), locale),
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Footer />
      <MobileTabBar active="explore" />
    </div>
  );
}
