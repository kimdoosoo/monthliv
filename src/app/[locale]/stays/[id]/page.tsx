import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AirVent,
  AppWindow,
  Bath,
  BedDouble,
  Building2,
  CalendarClock,
  Car,
  Coffee,
  CookingPot,
  Dog,
  Fence,
  Images,
  KeyRound,
  Languages,
  LampDesk,
  MapPin,
  Package,
  Refrigerator,
  TrainFront,
  TreePalm,
  WashingMachine,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { BookingDates } from "@/components/BookingDates";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ListingCard } from "@/components/ListingCard";
import { MoonIcon, Star } from "@/components/MoonIcon";
import { PhotoSlot } from "@/components/PhotoSlot";
import { PriceBreakdown } from "@/components/PriceBreakdown";
import { ReviewText } from "@/components/ReviewText";
import { SaveButton } from "@/components/SaveButton";
import { ShareButton } from "@/components/ShareButton";
import { StayCalendar } from "@/components/StayCalendar";
import { StayMap } from "@/components/StayMap";
import { StayTiers } from "@/components/StayTiers";
import {
  branchName,
  cityOf,
  findSearchArea,
  getListing,
  hasSelfCheckIn,
  isOpen,
  listings,
  pick,
  sampleHost,
  sampleRatings,
  sampleReviews,
  siblingsOf,
  type Amenity,
  type Travel,
} from "@/data/listings";
import { Link } from "@/i18n/navigation";
import {
  formatArea,
  formatDate,
  formatDayWeekday,
  formatMonth,
  formatMonthYear,
  formatPrice,
  formatRating,
  formatScore,
  formatTime,
} from "@/lib/format";
import { languageName } from "@/lib/languages";
import {
  discountFor,
  freeCancellationDate,
  guestNightlyFor,
  nightsBetween,
  quote,
  stayTiers,
} from "@/lib/pricing";
import { todayInSeoul, tripFromParams, tripQuery } from "@/lib/trip";

export function generateStaticParams() {
  return listings.map((listing) => ({ id: listing.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/stays/[id]">): Promise<Metadata> {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing) return {};
  const locale = await getLocale();
  return {
    title: pick(listing.title, locale),
    description: listing.description ? pick(listing.description, locale) : undefined,
  };
}

// Sample places: photo slots and the amenities of a studio, as in the design.
const slots = ["photoRoom", "photoDesk", "photoBath", "photoLounge", "photoEntrance"] as const;
const sampleAmenities: Amenity[] = [
  "laundry",
  "desk",
  "wifi",
  "kitchen",
  "aircon",
  "bedding",
  "bath",
  "window",
  "fridge",
  "parcel",
];
const amenityIcons: Record<Amenity, LucideIcon> = {
  bath: Bath,
  window: AppWindow,
  aircon: AirVent,
  desk: LampDesk,
  fridge: Refrigerator,
  bedding: BedDouble,
  wifi: Wifi,
  laundry: WashingMachine,
  kitchen: CookingPot,
  parcel: Package,
  parking: Car,
  garden: TreePalm,
  balcony: Fence,
  dogPlayground: Dog,
  petCafe: Coffee,
};

export default async function ListingPage({ params, searchParams }: PageProps<"/[locale]/stays/[id]">) {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing) notFound();

  const locale = await getLocale();
  const t = await getTranslations();

  const trip = tripFromParams(await searchParams);
  const nights = nightsBetween(trip.from, trip.to);
  const price = quote(listing, nights);
  const title = pick(listing.title, locale);
  const area = pick(listing.area, locale);
  const place = t("listing.place", { area, city: pick(cityOf(listing), locale) });
  const rating = formatRating(listing.rating, locale);
  const reviewed = listing.reviews > 0;
  const lengthName = t(`length.${price.length}`);
  const bookHref = { pathname: `/book/${listing.id}`, query: tripQuery(trip) };
  const monthOff = discountFor(listing.discounts, "month");
  const next = stayTiers[stayTiers.findIndex((tier) => tier.length === price.length) + 1];
  const guideArea = findSearchArea(pick(listing.area, "ko"));

  // A real place shows its own photos, host, highlight and amenities; samples show the design's.
  const { real } = listing;
  const photos = real?.photos ?? [];
  const photosHref = `/stays/${listing.id}/photos`;
  const siblings = siblingsOf(listing);
  const opens = listing.opens && !isOpen(listing, todayInSeoul()) ? listing.opens : undefined;
  const host = real
    ? { name: pick(real.host.name, locale), initial: pick(real.host.initial, locale), line: pick(real.host.note, locale) }
    : {
        name: pick(sampleHost.name, locale),
        initial: pick(sampleHost.name, locale),
        line: [
          t("listing.hostYears", { years: 2026 - sampleHost.since }),
          t("listing.hostLangs"),
          t("listing.hostReplies"),
        ].join(" · "),
      };
  const long = {
    icon: <MoonIcon length="month" size={28} />,
    title: t("listing.pointLong"),
    text: t("listing.pointLongText", { percent: monthOff }),
  };
  const translate = {
    icon: <Languages size={28} strokeWidth={1.75} aria-hidden="true" />,
    title: t("listing.pointTranslate"),
    text: t("listing.pointTranslateText"),
  };
  const points = real
    ? [
        {
          icon:
            listing.branch === "jeju" ? (
              <TreePalm size={28} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Building2 size={28} strokeWidth={1.75} aria-hidden="true" />
            ),
          title: pick(real.highlight.title, locale),
          text: pick(real.highlight.text, locale),
        },
        long,
        translate,
      ]
    : [
        long,
        {
          icon: <KeyRound size={28} strokeWidth={1.75} aria-hidden="true" />,
          title: t("listing.pointSelf"),
          text: t("listing.pointSelfText", { time: formatTime("09:00", locale) }),
        },
        {
          icon: <Wifi size={28} strokeWidth={1.75} aria-hidden="true" />,
          title: t("listing.pointWifi", { speed: 500 }),
          text: t("listing.pointWifiText", { date: formatDate("2026-09-14", locale) }),
        },
      ];
  const amenities = real?.amenities ?? sampleAmenities;
  const minutesText = (minutes: number, by: Travel | undefined) =>
    t(by === "car" ? "listing.driveMinutes" : "listing.walkMinutes", { minutes });
  const freeUntil = formatDayWeekday(freeCancellationDate(trip.from), locale);

  return (
    <div className="lv-page lv-has-bookbar">
      <Header />

      <main className="lv-wrap lv-wrap--narrow lv-listing">
        <div className="lv-ltitle">
          <div className="lv-ltitle__text">
            <h1 className="lv-ltitle__h">{title}</h1>
            <p className="lv-ltitle__meta">
              {reviewed ? (
                <>
                  <span className="lv-rating">
                    <Star />
                    <span aria-hidden="true">{rating}</span>
                    <span className="lv-sr">{t("card.ratingLabel", { rating })}</span>
                  </span>
                  <span className="lv-muted" aria-hidden="true">
                    ·
                  </span>
                  <a className="lv-link" href="#reviews">
                    {t("listing.reviews", { count: listing.reviews })}
                  </a>
                </>
              ) : (
                <>
                  <span className="lv-new">{t("card.new")}</span>
                  <span>{t("listing.noReviews")}</span>
                </>
              )}
              <span className="lv-muted" aria-hidden="true">
                ·
              </span>
              <span>{place}</span>
            </p>
          </div>
          <div className="lv-ltitle__tools">
            <ShareButton label={t("listing.share")} copied={t("listing.shareCopied")} title={title} />
            <SaveButton className="lv-tbtn" label={t("listing.save")} text />
          </div>
        </div>

        <div className="lv-gallery">
          {photos.length > 0
            ? photos.slice(0, 5).map((photo, index) => (
                // Each photo opens the photo page at that photo.
                <Link
                  key={photo.file}
                  className={`lv-gallery__tile${index === 0 ? " lv-gallery__main" : ""}`}
                  href={`${photosHref}#photo-${photo.file}`}
                >
                  <PhotoSlot
                    tone={listing.tone}
                    photo={{ listingId: listing.id, photo }}
                    sizes={index === 0 ? "(max-width: 900px) 100vw, 590px" : "(max-width: 900px) 50vw, 295px"}
                    priority={index === 0}
                  />
                </Link>
              ))
            : slots.map((key, index) => (
                <PhotoSlot
                  key={key}
                  tone={listing.tone + index}
                  className={`lv-gallery__tile${index === 0 ? " lv-gallery__main" : ""}`}
                  label={t(`listing.${key}`)}
                  slogan={index === 0 && listing.place ? pick(listing.place, locale) : undefined}
                />
              ))}
          {photos.length > 0 && (
            <Link className="lv-gallery__all" href={photosHref}>
              <Images size={18} strokeWidth={1.75} aria-hidden="true" />
              {t("listing.allPhotos", { count: photos.length })}
            </Link>
          )}
        </div>

        <div className="lv-lbody">
          <div className="lv-lmain">
            <section className="lv-lsec lv-lsec--host">
              <div>
                <h2 className="lv-h3">{t("listing.hostedBy", { name: host.name, type: pick(listing.type, locale) })}</h2>
                <p className="lv-sub">
                  {real
                    ? listing.size
                      ? t("listing.factsSize", { guests: listing.guests, size: formatArea(listing.size, locale) })
                      : t("listing.factsReal", { guests: listing.guests })
                    : t("listing.facts", { guests: listing.guests, size: formatArea(22, locale) })}
                </p>
              </div>
              <span className="lv-avatar lv-avatar--host" aria-hidden="true">
                {real ? (
                  // MONTHLIV runs every branch: its M stands in for a host's initial.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/brand/monthliv-mark.svg" alt="" width={26} height={20} />
                ) : (
                  host.initial
                )}
              </span>
            </section>

            {opens && (
              <section className="lv-lsec">
                <p className="lv-note lv-note--moon">
                  <CalendarClock size={20} strokeWidth={1.75} aria-hidden="true" />
                  {t("listing.opensNote", { month: formatMonth(`${opens}-01`, locale) })}
                </p>
              </section>
            )}

            <section className="lv-lsec">
              <ul className="lv-points">
                {points.map((point) => (
                  <li key={point.title} className="lv-point">
                    {point.icon}
                    <div>
                      <h3 className="lv-point__t">{point.title}</h3>
                      <p className="lv-point__d">{point.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {listing.description && (
              <section className="lv-lsec lv-ltext">
                <p>{pick(listing.description, locale)}</p>
              </section>
            )}

            <section className="lv-lsec" aria-labelledby="tiers-title">
              <div className="lv-lsec__head">
                <h2 id="tiers-title" className="lv-h3">
                  {t("listing.tiersTitle")}
                </h2>
                <p className="lv-small">{t("listing.tiersSub")}</p>
              </div>
              <StayTiers
                hostNightly={listing.nightly}
                discounts={listing.discounts}
                current={price.length}
                nights={nights}
                caption={t("listing.tiersTitle")}
              />
              <p className="lv-small">
                {t("listing.tiersNote", { cleaning: formatPrice(listing.cleaning, locale) })}
              </p>
            </section>

            <section className="lv-lsec" aria-labelledby="amen-title">
              <h2 id="amen-title" className="lv-h3">
                {t("listing.amenitiesTitle")}
              </h2>
              <ul className="lv-amen">
                {amenities.map((key) => {
                  const Glyph = amenityIcons[key];
                  return (
                    <li key={key}>
                      <Glyph size={24} strokeWidth={1.75} aria-hidden="true" />
                      {t(`listing.amenity.${key}`)}
                    </li>
                  );
                })}
              </ul>
            </section>

            {siblings.length > 0 && (
              <section className="lv-lsec" aria-labelledby="siblings-title">
                <h2 id="siblings-title" className="lv-h3">
                  {t("listing.siblingsTitle", { branch: branchName(listing, locale) })}
                </h2>
                <div className="lv-grid lv-grid--3 lv-siblings">
                  {siblings.slice(0, 3).map((item) => (
                    <ListingCard key={item.id} listing={item} trip={trip} compact />
                  ))}
                </div>
              </section>
            )}

            <section className="lv-lsec" aria-labelledby="cal-title">
              <div className="lv-lsec__head">
                <h2 id="cal-title" className="lv-h3">
                  {t("listing.calendarTitle", { area, nights })}
                </h2>
                <p className="lv-small">
                  {formatDayWeekday(trip.from, locale)} – {formatDayWeekday(trip.to, locale)}
                </p>
              </div>
              <StayCalendar from={trip.from} to={trip.to} label={t("listing.calendarLabel")} />
            </section>

            <section className="lv-lsec" id="reviews" aria-labelledby="reviews-title">
              {reviewed ? (
                <>
                  <h2 id="reviews-title" className="lv-h3 lv-reviews__title">
                    <Star size={20} />
                    {t("listing.reviewsTitle", { rating, count: listing.reviews })}
                  </h2>
                  <div className="lv-ratings">
                    {sampleRatings.map(([key, value]) => (
                      <div className="lv-ratingbar" key={key}>
                        <span className="lv-ratingbar__top">
                          {t(`listing.ratings.${key}`)}
                          <b>{formatScore(value, locale)}</b>
                        </span>
                        <span className="lv-ratingbar__track" aria-hidden="true">
                          <span style={{ width: `${(value / 5) * 100}%` }} />
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="lv-reviews">
                    {sampleReviews.map((review) => {
                      // Languages without their own translation read the English one.
                      const shownLang = review.text[locale as keyof typeof review.text] ? locale : "en";
                      const shown = pick(review.text, locale);
                      return (
                        <article className="lv-review" key={review.name}>
                          <div className="lv-review__who">
                            <span className="lv-avatar lv-avatar--hanji lv-avatar--review" aria-hidden="true">
                              {review.initial}
                            </span>
                            <div>
                              <p className="lv-review__name">{review.name}</p>
                              <p className="lv-small">
                                {t("listing.stayedNights", {
                                  nights: review.nights,
                                  date: formatMonthYear(review.date, locale),
                                })}
                              </p>
                            </div>
                          </div>
                          {shownLang === review.original ? (
                            <p className="lv-review__text">{shown}</p>
                          ) : (
                            <ReviewText
                              translated={shown}
                              translatedLang={shownLang}
                              original={review.text[review.original] ?? shown}
                              originalLang={review.original}
                              note={t("listing.translatedFrom", {
                                language: languageName(review.original, locale),
                              })}
                              showOriginal={t("listing.showOriginal")}
                              showTranslation={t("listing.showTranslation")}
                            />
                          )}
                        </article>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="lv-lsec__head">
                  <h2 id="reviews-title" className="lv-h3">
                    {t("listing.noReviews")}
                  </h2>
                  <p className="lv-small">{t("listing.reviewsSub")}</p>
                </div>
              )}
            </section>

            <section className="lv-lsec" aria-labelledby="where-title">
              <h2 id="where-title" className="lv-h3">
                {t("listing.locationTitle")}
              </h2>
              <div className="lv-lmap">
                <StayMap mode="place" lat={listing.lat} lng={listing.lng} caption={`${place} · ${t("listing.approx")}`} />
                <span className="lv-lmap__tag">{t("listing.approx")}</span>
              </div>
              <ul className="lv-near">
                <li>
                  <TrainFront size={22} strokeWidth={1.75} aria-hidden="true" />
                  <span>
                    <b>{pick(listing.station, locale)}</b> · {minutesText(listing.minutes, listing.by)}
                  </span>
                </li>
                {listing.nearby?.map((spot) => (
                  <li key={spot.name.en}>
                    <MapPin size={22} strokeWidth={1.75} aria-hidden="true" />
                    <span>
                      <b>{pick(spot.name, locale)}</b> · {minutesText(spot.minutes, spot.by)}
                    </span>
                  </li>
                ))}
              </ul>
              {guideArea?.key === "seongsu" && (
                <Link className="lv-link lv-self-start" href="/neighbourhoods/seongsu">
                  {t("listing.hoodGuide", { area })}
                </Link>
              )}
            </section>

            <section className="lv-lsec" aria-labelledby="host-title">
              <h2 id="host-title" className="lv-h3">
                {t("listing.hostTitle")}
              </h2>
              <div className="lv-hostbox">
                <span className="lv-avatar lv-avatar--xl" aria-hidden="true">
                  {host.initial}
                </span>
                <div className="lv-hostbox__text">
                  <p className="lv-hostbox__name">{host.name}</p>
                  <p className="lv-small">{host.line}</p>
                </div>
                <Link className="lv-btn lv-btn--night lv-btn--sm" href="/login">
                  {t("listing.messageHost", { name: host.name })}
                </Link>
              </div>
              <p className="lv-small">{t("listing.hostTranslate")}</p>
            </section>

            <section className="lv-lsec lv-lsec--last" aria-labelledby="rules-title">
              <h2 id="rules-title" className="lv-h3">
                {t("listing.rulesTitle")}
              </h2>
              <div className="lv-rules">
                <div>
                  <h3>{t("listing.rulesHouse")}</h3>
                  <span>{t("listing.checkInAfter", { time: formatTime("15:00", locale) })}</span>
                  <span>{t("listing.checkOutBy", { time: formatTime("11:00", locale) })}</span>
                  <span>{t("listing.maxGuests", { count: listing.guests })}</span>
                  {hasSelfCheckIn(listing) && <span>{t("listing.selfCheckIn")}</span>}
                  {!real && <span>{t("listing.noParty")}</span>}
                </div>
                {!real && (
                  <div>
                    <h3>{t("listing.rulesSafety")}</h3>
                    <span>{t("listing.safetyAlarm")}</span>
                    <span>
                      {t("listing.quietHours", { from: formatTime("22:00", locale), to: formatTime("07:00", locale) })}
                    </span>
                  </div>
                )}
                <div>
                  <h3>{t("listing.rulesCancel")}</h3>
                  {listing.freeCancellation ? (
                    <span>{t("listing.freeBefore", { date: freeUntil })}</span>
                  ) : (
                    <span>{t("listing.noFree")}</span>
                  )}
                  <span>{t("listing.splitPay")}</span>
                  <Link className="lv-link lv-self-start" href={{ pathname: "/help", hash: "refunds" }}>
                    {t("listing.refundLink")}
                  </Link>
                </div>
              </div>
            </section>
          </div>

          <aside className="lv-lside" aria-label={t("listing.bookLabel")}>
            <div className="lv-bookcard">
              <p className="lv-bookcard__price">
                {price.discountPercent > 0 && (
                  <>
                    <s>{formatPrice(price.nightly, locale)}</s>
                    <span className="lv-sr">{t("price.was")}</span>
                  </>
                )}
                <b>{formatPrice(price.nightlyAfter, locale)}</b>
                <span className="lv-muted">{t("listing.perNightUnit")}</span>
              </p>
              <BookingDates from={trip.from} to={trip.to} guests={trip.guests} />
              <p className="lv-bookcard__stay">
                <MoonIcon length={price.length} size={22} />
                {price.discountPercent > 0
                  ? t("listing.staySummaryOff", { nights, length: lengthName, percent: price.discountPercent })
                  : t("search.staySummary", { nights, length: lengthName })}
              </p>
              {/* On phones the same button sits in the bar at the bottom of the screen. */}
              <Link className="lv-btn lv-btn--moon lv-btn--block lv-bookcard__go" href={bookHref}>
                {t("listing.book")}
              </Link>
              <p className="lv-bookcard__hint">{t("listing.notCharged")}</p>
              <PriceBreakdown price={price} />
            </div>
            {next && (
              <p className="lv-bookcard__next">
                {t.rich("listing.nextTier", {
                  nights: next.from,
                  price: formatPrice(guestNightlyFor(listing.nightly, listing.discounts, next.length), locale),
                  b: (chunks) => <b>{chunks}</b>,
                })}
              </p>
            )}
          </aside>
        </div>
      </main>

      <Footer />

      <div className="lv-bookbar">
        <div className="lv-bookbar__p">
          <b>{formatPrice(price.total, locale)}</b>
          <span>
            {formatDayWeekday(trip.from, locale)} – {formatDayWeekday(trip.to, locale)} ·{" "}
            {t("price.nights", { nights })}
          </span>
        </div>
        <Link className="lv-btn lv-btn--moon" href={bookHref}>
          {t("listing.book")}
        </Link>
      </div>
    </div>
  );
}
