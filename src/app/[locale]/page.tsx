import type { ComponentProps } from "react";
import { BedDouble, Building2, Languages, Map as MapIcon, Receipt, TrainFront, Wallet } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ListingCard } from "@/components/ListingCard";
import { MapThumb } from "@/components/MapThumb";
import { MobileTabBar } from "@/components/MobileTabBar";
import { MoonIcon } from "@/components/MoonIcon";
import { PhotoSlot } from "@/components/PhotoSlot";
import { SearchForm } from "@/components/SearchForm";
import {
  getListing,
  getListings,
  getSearchArea,
  homeSections,
  pick,
  sampleTrip,
  weekendTrip,
  type Listing,
} from "@/data/listings";
import { getPathname, Link } from "@/i18n/navigation";
import { formatPrice, formatRange } from "@/lib/format";
import { discountFor, guestNightlyFor, nightsBetween, quote, stayTiers } from "@/lib/pricing";

/** Neighbourhoods with MONTHLIV branches and a small map on the home page; Seongsu has a full guide. */
const hoods = ["seongsu", "sinchon", "konkuk", "cheonho"] as const;

/** What every MONTHLIV branch comes with. */
const living = [
  { key: "furnished", Glyph: BedDouble },
  { key: "managed", Glyph: Building2 },
  { key: "station", Glyph: TrainFront },
  { key: "deposit", Glyph: Wallet },
  { key: "translate", Glyph: Languages },
  { key: "price", Glyph: Receipt },
] as const;

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getTranslations();

  // The hero card is MONTHLIV in Jeju (real photos); the price tiers use a Seongsu Stay room.
  const featured = getListing("monthliv-in-jeju");
  const example = getListing("seongsu-window");
  const nights = nightsBetween(sampleTrip.from, sampleTrip.to);

  return (
    <div className="lv-page lv-has-tabbar">
      <Header />

      <main>
        <section className="lv-wrap lv-hero" aria-labelledby="hero-title">
          <div className="lv-hero__text">
            <p className="lv-label">
              {t.rich("home.heroLabel", { b: (chunks) => <b className="lv-slogan-fill">{chunks}</b> })}
            </p>
            <h1 id="hero-title" className="lv-display">
              {t("home.heroTitle")}
            </h1>
            <p className="lv-lead lv-hero__lead">{t("home.heroLead")}</p>
            <SearchForm
              action={getPathname({ href: "/search", locale })}
              variant="hero"
              initial={{
                where: t("home.searchWhere"),
                from: sampleTrip.from,
                to: sampleTrip.to,
                guests: sampleTrip.guests,
              }}
            />
          </div>
          <div className="lv-hero__art">
            {/* eslint-disable-next-line @next/next/no-img-element -- the brand's illustrated logo, as drawn */}
            <img
              className="lv-hero__slippers"
              src="/brand/monthliv-logo-mixed-illustration.png"
              alt=""
              width={1137}
              height={826}
            />
            {featured && <FeaturedCard listing={featured} nights={nights} />}
          </div>
        </section>

        {example && (
          <section className="lv-band" id="tiers" aria-labelledby="tiers-title">
            <div className="lv-wrap lv-tiers">
              <div className="lv-tiers__head">
                <p className="lv-label">{t("home.tiersLabel")}</p>
                <h2 id="tiers-title" className="lv-h2 lv-h2--lg">
                  {t("home.tiersTitle")}
                </h2>
                <p className="lv-lead">{t("home.tiersLead")}</p>
              </div>
              <ul className="lv-tiers__grid">
                {stayTiers.map((tier) => {
                  const percent = discountFor(example.discounts, tier.length);
                  return (
                    <li
                      key={tier.length}
                      className="lv-tier"
                      aria-current={tier.length === "month" ? "true" : undefined}
                    >
                      <MoonIcon length={tier.length} size={40} className="lv-moon lv-moon--lg" />
                      <div>
                        <h3 className="lv-h3">{t(`length.${tier.length}`)}</h3>
                        <p className="lv-tier__range">{t(`length.${tier.length}Range`)}</p>
                      </div>
                      <span className={`lv-badge${percent > 0 ? " lv-badge--moon" : ""}`}>
                        {percent > 0 ? t("tiers.off", { percent }) : t("tiers.base")}
                      </span>
                      <p className="lv-tier__price">
                        {t.rich("home.tierPrice", {
                          price: formatPrice(guestNightlyFor(example.nightly, example.discounts, tier.length), locale),
                          b: (chunks) => <b>{chunks}</b>,
                        })}
                      </p>
                    </li>
                  );
                })}
              </ul>
              <p className="lv-small">
                {t("home.tiersNote", { title: pick(example.title, locale), area: pick(example.area, locale) })}
              </p>
            </div>
          </section>
        )}

        <ListingSection
          id="month"
          title={t("home.monthTitle")}
          sub={t("home.monthSub", { dates: formatRange(sampleTrip.from, sampleTrip.to, locale), nights })}
          more={t("home.seeAll")}
          moreHref={{ pathname: "/search", query: { category: "month" } }}
          listings={getListings(homeSections.monthly).slice(0, 4)}
          trip={sampleTrip}
        />
        <ListingSection
          id="short"
          title={t("home.shortTitle")}
          sub={t("home.shortSub", {
            dates: formatRange(weekendTrip.from, weekendTrip.to, locale),
            nights: nightsBetween(weekendTrip.from, weekendTrip.to),
          })}
          more={t("home.seeAll")}
          moreHref={{ pathname: "/search", query: { category: "hostel" } }}
          listings={getListings(homeSections.short).slice(0, 4)}
          trip={weekendTrip}
        />

        <section className="lv-wrap lv-section lv-home__hoods" aria-labelledby="hoods-title">
          <div className="lv-section__head">
            <div>
              <h2 id="hoods-title" className="lv-h2">
                {t("home.hoodsTitle")}
              </h2>
              <p className="lv-sub">{t("home.hoodsSub")}</p>
            </div>
            <Link className="lv-link" href="/neighbourhoods/seongsu">
              {t("home.hoodsGuide")}
            </Link>
          </div>
          <ul className="lv-hoodcards">
            {hoods.map((key) => {
              const area = getSearchArea(key);
              if (!area) return null;
              const href =
                key === "seongsu"
                  ? "/neighbourhoods/seongsu"
                  : { pathname: "/search" as const, query: { where: pick(area.name, locale) } };
              return (
                <li key={key}>
                  <Link className="lv-hoodcard" href={href}>
                    <MapThumb lat={area.center.lat} lng={area.center.lng} />
                    <span className="lv-hoodcard__name">{pick(area.name, locale)}</span>
                    <span className="lv-hoodcard__text">{t(`home.hoods.${key}`)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="lv-band" aria-labelledby="living-title">
          <div className="lv-wrap lv-living">
            <h2 id="living-title" className="lv-h2 lv-h2--lg lv-living__title">
              {t("home.livingTitle")}
            </h2>
            <ul className="lv-living__grid">
              {living.map(({ key, Glyph }) => (
                <li key={key} className="lv-living__item">
                  <span className="lv-living__icon">
                    <Glyph size={24} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="lv-h4">{t(`home.living.${key}.title`)}</h3>
                    <p className="lv-sub">{t(`home.living.${key}.text`)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="lv-wrap lv-how" aria-labelledby="how-title">
          <h2 id="how-title" className="lv-h2 lv-h2--lg">
            {t("home.howTitle")}
          </h2>
          <ol className="lv-how__steps">
            {(["dates", "pay", "move"] as const).map((key, index) => (
              <li key={key}>
                <span className="lv-how__num" aria-hidden="true">
                  {index + 1}
                </span>
                <h3 className="lv-h3">{t(`home.how.${key}.title`)}</h3>
                <p className="lv-sub">{t(`home.how.${key}.text`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="lv-wrap lv-hostcta-wrap" aria-labelledby="host-title">
          <div className="lv-hostcta lv-on-night">
            <div className="lv-hostcta__text">
              <h2 id="host-title" className="lv-h2">
                {t("home.hostTitle")}
              </h2>
              <p>{t("home.hostText")}</p>
            </div>
            <div className="lv-btnrow">
              <Link className="lv-btn lv-btn--hanji" href="/host">
                {t("home.hostStart")}
              </Link>
              <Link className="lv-btn lv-btn--onnight" href="/host/today">
                {t("home.hostPricing")}
              </Link>
            </div>
          </div>
        </section>

        <section className="lv-band" aria-labelledby="app-title">
          <div className="lv-wrap lv-appband">
            {/* eslint-disable-next-line @next/next/no-img-element -- the app icon, as drawn */}
            <img
              className="lv-appband__icon"
              src="/brand/monthliv-app-icon.svg"
              alt={t("home.appIcon")}
              width={112}
              height={112}
            />
            <div className="lv-appband__text">
              <h2 id="app-title" className="lv-h2 lv-appband__title">
                {t("home.appTitle")}
              </h2>
              <p className="lv-sub">{t("home.appText")}</p>
            </div>
            <ul className="lv-appband__stores" aria-label={t("home.appStores")}>
              <li className="lv-store">
                App Store<small>{t("home.appSoon")}</small>
              </li>
              <li className="lv-store">
                Google Play<small>{t("home.appSoon")}</small>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <Footer />

      <Link className="lv-fab" href="/search">
        <MapIcon size={18} strokeWidth={1.75} aria-hidden="true" />
        {t("map.show")}
      </Link>
      <MobileTabBar active="explore" />
    </div>
  );
}

/** The real place on the moon panel: its cover photo and this month's price. */
async function FeaturedCard({ listing, nights }: { listing: Listing; nights: number }) {
  const t = await getTranslations();
  const locale = await getLocale();
  const price = quote(listing, nights);
  const cover = listing.real?.photos[0];
  return (
    <Link className="lv-featured" href={`/stays/${listing.id}`}>
      <PhotoSlot
        className="lv-featured__photo"
        tone={listing.tone}
        photo={cover && { listingId: listing.id, photo: cover }}
        sizes="300px"
        priority
        decorative
      />
      <span className="lv-featured__body">
        <span className="lv-featured__title">{pick(listing.title, locale)}</span>
        <span className="lv-small">
          {pick(listing.area, locale)} · {pick(listing.type, locale)}
        </span>
        <span className="lv-featured__price">
          {t.rich(price.discountPercent > 0 ? "price.nightOnlyWas" : "price.nightOnly", {
            was: formatPrice(price.nightly, locale),
            price: formatPrice(price.nightlyAfter, locale),
            s: (chunks) => (
              <>
                <s>{chunks}</s>
                <span className="lv-sr">{t("price.was")}</span>
              </>
            ),
            b: (chunks) => <b>{chunks}</b>,
          })}
        </span>
        <span className="lv-featured__stay">
          {t("price.stay", { nights, amount: formatPrice(price.nightlyAfter * nights, locale) })}
        </span>
      </span>
    </Link>
  );
}

function ListingSection({
  id,
  title,
  sub,
  more,
  moreHref = "/search",
  listings,
  trip,
}: {
  id: string;
  title: string;
  sub: string;
  more: string;
  /** Where "see all" goes. Defaults to the search. */
  moreHref?: ComponentProps<typeof Link>["href"];
  listings: Listing[];
  trip: { from: string; to: string };
}) {
  return (
    <section className="lv-wrap lv-section lv-home__list" aria-labelledby={`${id}-title`}>
      <div className="lv-section__head">
        <div>
          <h2 id={`${id}-title`} className="lv-h2">
            {title}
          </h2>
          <p className="lv-sub">{sub}</p>
        </div>
        <Link className="lv-link" href={moreHref}>
          {more}
        </Link>
      </div>
      <div className="lv-grid">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} trip={trip} />
        ))}
      </div>
    </section>
  );
}
