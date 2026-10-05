import type { Metadata } from "next";
import { Check } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { ListingCard } from "@/components/ListingCard";
import { MobileTabBar } from "@/components/MobileTabBar";
import { SearchForm } from "@/components/SearchForm";
import { SearchSplit } from "@/components/SearchSplit";
import { SortSelect } from "@/components/SortSelect";
import type { PricePin } from "@/components/StayMap";
import {
  categoryListings,
  findSearchArea,
  getListings,
  getSearchArea,
  isCategory,
  pick,
  type Category,
  type Listing,
} from "@/data/listings";
import { getPathname, Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/format";
import { sorts, type Sort } from "@/lib/sorts";
import { nightsBetween, quote, stayLengthFor } from "@/lib/pricing";
import { tripFromParams, type TripDates } from "@/lib/trip";

type SearchParams = Awaited<PageProps<"/[locale]/search">["searchParams"]>;
type Translate = Awaited<ReturnType<typeof getTranslations<never>>>;

/**
 * Quick filters: each is a word in the address (?free=1), so they work without scripts.
 * (No self check-in filter: no MONTHLIV branch has confirmed self check-in yet.)
 */
const filters = [
  { key: "free", test: (listing: Listing) => listing.freeCancellation },
  { key: "near", test: (listing: Listing) => (listing.by ?? "walk") === "walk" && listing.minutes <= 5 },
] as const;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Results until search comes from the database: an area the search box knows (성수, 제주…),
 * then a header section (?category=solo). Anything else shows Seongsu, and says so.
 */
function search(params: SearchParams, locale: string, t: Translate) {
  const where = one(params.where)?.trim() ?? "";
  const category = one(params.category);
  const area = findSearchArea(where);
  if (area) {
    const name = pick(area.name, locale);
    const results = getListings(area.ids);
    return { results, where, title: t("results.title", { area: name, count: results.length }) };
  }
  if (!where && isCategory(category)) {
    const name = t(`nav.sections.${category}`);
    const results = categoryListings(category);
    return {
      results,
      where,
      category: category as Category,
      title: t("results.categoryTitle", { category: name, count: results.length }),
      intro: t(`results.sections.${category}`),
    };
  }
  const seongsu = getSearchArea("seongsu");
  const results = getListings(seongsu?.ids ?? []);
  const name = seongsu ? pick(seongsu.name, locale) : "";
  return {
    results,
    where,
    title: t("results.title", { area: name, count: results.length }),
    // Somewhere we don't have places for yet: say so, then show Seongsu.
    notice: where ? t("results.unknownArea", { where, area: name }) : undefined,
  };
}

function sortResults(results: Listing[], sort: Sort, nights: number): Listing[] {
  if (sort === "price") {
    return [...results].sort((a, b) => quote(a, nights).total - quote(b, nights).total);
  }
  if (sort === "station") {
    const minutes = (listing: Listing) => listing.minutes * (listing.by === "car" ? 3 : 1);
    return [...results].sort((a, b) => minutes(a) - minutes(b));
  }
  return results;
}

export async function generateMetadata({ searchParams }: PageProps<"/[locale]/search">): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations();
  const { title } = search(await searchParams, locale, t);
  return { title };
}

export default async function SearchPage({ searchParams }: PageProps<"/[locale]/search">) {
  const locale = await getLocale();
  const t = await getTranslations();
  const params = await searchParams;

  const found = search(params, locale, t);
  const trip: TripDates = tripFromParams(params);
  const nights = nightsBetween(trip.from, trip.to);
  const length = stayLengthFor(nights);
  const sortParam = one(params.sort);
  const sort: Sort = sorts.includes(sortParam as Sort) ? (sortParam as Sort) : "recommended";
  const on = new Set<string>(filters.filter(({ key }) => one(params[key]) === "1").map(({ key }) => key));
  const filtered = found.results.filter((listing) =>
    filters.every(({ key, test }) => !on.has(key) || test(listing)),
  );
  const results = sortResults(filtered, sort, nights);

  // The places on this page, with their nightly price at this stay length.
  const pins: PricePin[] = results.map((listing) => {
    const nightly = quote(listing, nights).nightlyAfter;
    return {
      id: listing.id,
      label: formatPrice(nightly, locale),
      title: `${pick(listing.title, locale)}, ${t("price.perNight", { price: formatPrice(nightly, locale) })}`,
      lat: listing.lat,
      lng: listing.lng,
      href: `/stays/${listing.id}`,
    };
  });

  // Every link here keeps the search; a filter link switches only its own word.
  const base: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    const text = one(value);
    if (text) base[key] = text;
  }
  const cleared = { ...base };
  for (const { key } of filters) delete cleared[key];
  const toggled = (key: string) => {
    const query = { ...base };
    if (on.has(key)) delete query[key];
    else query[key] = "1";
    return query;
  };

  const lengthName = t(`lengthName.${length}`);
  const head = (
    <div className="lv-results__head">
      <div className="lv-results__titles">
        <h1 className="lv-results__title">{found.title}</h1>
        {found.notice && <p className="lv-results__notice">{found.notice}</p>}
        {found.intro && <p className="lv-small">{found.intro}</p>}
        <p className="lv-small">
          {length === "night"
            ? t("results.noteNight", { nights })
            : t("results.note", { nights, length: lengthName })}
        </p>
      </div>
      <SortSelect value={sort} />
    </div>
  );

  return (
    <div className="lv-page lv-page--search lv-has-tabbar">
      <Header current={found.category} />
      <div className="lv-sbarband">
        <div className="lv-sbarband__in">
          <SearchForm
            action={getPathname({ href: "/search", locale })}
            variant="bar"
            initial={{
              // The sample results are Seongsu's: say so in the box, unless a section was picked.
              where: found.where || (found.category ? "" : t("home.searchWhere")),
              ...trip,
            }}
          />
          <div className="lv-sfilters">
            <nav className="lv-chips" aria-label={t("results.filters")}>
              {filters.map(({ key }) => (
                <Link
                  key={key}
                  className="lv-chip"
                  href={{ pathname: "/search", query: toggled(key) }}
                  aria-current={on.has(key) ? "true" : undefined}
                  scroll={false}
                >
                  {on.has(key) && <Check size={16} strokeWidth={2} aria-hidden="true" />}
                  {t(`results.filter.${key}`)}
                  {on.has(key) && <span className="lv-sr">{t("results.filterOn")}</span>}
                </Link>
              ))}
            </nav>
            <label className="lv-check">
              <input id="lv-show-total" type="checkbox" defaultChecked />
              {t("results.showTotal", { nights })}
            </label>
          </div>
        </div>
      </div>
      <main>
        <SearchSplit
          head={head}
          items={results.map((listing) => ({
            id: listing.id,
            card: (
              <ListingCard
                listing={listing}
                trip={trip}
                mode="total"
                compact
                saved={listing.id === "seongsu-window"}
              />
            ),
          }))}
          pins={pins}
          empty={
            <div className="lv-results__empty">
              <p className="lv-h4">{t("results.emptyTitle")}</p>
              <p className="lv-small">{t("results.emptyText")}</p>
              <Link className="lv-btn lv-btn--sm" href={{ pathname: "/search", query: cleared }}>
                {t("results.clearFilters")}
              </Link>
            </div>
          }
        />
      </main>
      <MobileTabBar active="explore" />
    </div>
  );
}
