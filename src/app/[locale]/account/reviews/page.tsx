import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/AccountShell";
import { DoneButton } from "@/components/DoneButton";
import { PhotoSlot } from "@/components/PhotoSlot";
import { Star } from "@/components/MoonIcon";
import { StarInput } from "@/components/StarInput";
import { getListing, pick, sampleHost, type Text } from "@/data/listings";
import { myReviews, pastStays } from "@/data/samples";
import { Link } from "@/i18n/navigation";
import { formatDate, formatMonthYear } from "@/lib/format";
import { nightsBetween } from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("reviews.title"), robots: { index: false } };
}

const details = ["clean", "checkin", "quiet", "value"] as const;

/**
 * Reviews: stays waiting for one (?tab=written for the ones already written). The form works
 * without scripts; in this preview sending it only says it was sent.
 */
export default async function ReviewsPage({ searchParams }: PageProps<"/[locale]/account/reviews">) {
  const locale = await getLocale();
  const t = await getTranslations();
  const { tab } = await searchParams;
  const written = tab === "written";

  /** Title, area, host and photo of a past stay, from the place when it's still listed. */
  const stayInfo = (stay: (typeof pastStays)[number]) => {
    const listing = stay.listingId ? getListing(stay.listingId) : undefined;
    const title: Text | undefined = listing?.title ?? stay.title;
    const area: Text | undefined = listing?.area ?? stay.area;
    return {
      listing,
      title: title ? pick(title, locale) : "",
      area: area ? pick(area, locale) : "",
      host: pick(stay.host ?? sampleHost.name, locale),
      nights: nightsBetween(stay.from, stay.to),
    };
  };
  const toWrite = pastStays.filter((stay) => stay.action === "review");
  const words = Object.fromEntries(([1, 2, 3, 4, 5] as const).map((value) => [value, t(`account.reviews.words.${value}`)]));

  return (
    <AccountShell current="reviews">
      <div className="lv-editor__head">
        <h1 className="lv-editor__h1">{t("account.reviews.title")}</h1>
        <p className="lv-sub">{t("account.reviews.lead")}</p>
      </div>

      <nav className="lv-tabs" aria-label={t("account.reviews.tabsLabel")}>
        <Link
          className="lv-tabs__tab"
          href="/account/reviews"
          aria-current={written ? undefined : "page"}
          scroll={false}
        >
          {t("account.reviews.toWrite")} <span className="lv-tabs__count">{toWrite.length}</span>
        </Link>
        <Link
          className="lv-tabs__tab"
          href={{ pathname: "/account/reviews", query: { tab: "written" } }}
          aria-current={written ? "page" : undefined}
          scroll={false}
        >
          {t("account.reviews.written")} <span className="lv-tabs__count">{myReviews.length}</span>
        </Link>
      </nav>

      {!written &&
        toWrite.map((stay) => {
          const info = stayInfo(stay);
          return (
            <form key={stay.key} className="lv-editcard lv-reviewform" action="#">
              <div className="lv-reviewform__stay">
                <PhotoSlot tone={stay.tone} className="lv-reviewform__photo" decorative />
                <span>
                  <b>{info.title}</b>
                  <span className="lv-small">
                    {t("account.reviews.stayMeta", {
                      area: info.area,
                      nights: info.nights,
                      date: formatMonthYear(stay.from, locale),
                      host: info.host,
                    })}
                  </span>
                </span>
              </div>

              <StarInput
                name={`overall-${stay.key}`}
                legend={t("account.reviews.overall")}
                starLabel={(value) => t("account.reviews.stars", { count: value })}
                words={words}
              />

              <fieldset className="lv-reviewform__details">
                <legend className="lv-editcard__title">{t("account.reviews.details")}</legend>
                {details.map((key) => (
                  <div key={key} className="lv-reviewform__row">
                    <StarInput
                      name={`${key}-${stay.key}`}
                      legend={t(`account.reviews.categories.${key}`)}
                      starLabel={(value) => t("account.reviews.points", { count: value })}
                      size={24}
                    />
                  </div>
                ))}
              </fieldset>

              <label className="lv-field">
                <span className="lv-field__label lv-field__label--plain lv-reviewform__q">
                  {t("account.reviews.textLabel")}
                </span>
                <textarea className="lv-textarea" rows={5} placeholder={t("account.reviews.textPlaceholder")} />
                <span className="lv-small">{t("account.reviews.textNote")}</span>
              </label>
              <label className="lv-field">
                <span className="lv-field__label lv-field__label--plain">
                  {t("account.reviews.privateLabel", { host: info.host })}
                </span>
                <span className="lv-small">{t("account.reviews.privateNote", { host: info.host })}</span>
                <textarea className="lv-textarea" rows={3} />
              </label>
              <div className="lv-reviewform__send">
                <DoneButton
                  className="lv-btn lv-btn--night"
                  type="button"
                  label={t("account.reviews.submit")}
                  done={t("account.reviews.submitted")}
                />
                <span className="lv-small">{t("account.reviews.publicNote")}</span>
              </div>
            </form>
          );
        })}

      {written && (
        <ul className="lv-myreviews">
          {myReviews.map((review) => {
            const stay = pastStays.find((item) => item.key === review.stayKey);
            if (!stay) return null;
            const info = stayInfo(stay);
            const cover = info.listing?.real?.photos[0];
            return (
              <li key={review.stayKey} className="lv-editcard">
                <div className="lv-reviewform__stay">
                  <PhotoSlot
                    tone={stay.tone}
                    className="lv-reviewform__photo"
                    photo={cover && info.listing && { listingId: info.listing.id, photo: cover }}
                    sizes="64px"
                    decorative
                  />
                  <span>
                    {info.listing ? (
                      <Link className="lv-myreviews__title" href={`/stays/${info.listing.id}`}>
                        {info.title}
                      </Link>
                    ) : (
                      <b>{info.title}</b>
                    )}
                    <span className="lv-small">
                      {t("account.reviews.stayMeta", {
                        area: info.area,
                        nights: info.nights,
                        date: formatMonthYear(stay.from, locale),
                        host: info.host,
                      })}
                    </span>
                  </span>
                </div>
                <p className="lv-myreviews__rating">
                  <Star />
                  <b>{review.rating}</b>
                  <span className="lv-small">· {t("account.reviews.writtenOn", { date: formatDate(review.date, locale) })}</span>
                </p>
                <p className="lv-myreviews__text">{pick(review.text, locale)}</p>
                {review.reply && (
                  <div className="lv-myreviews__reply">
                    <b>{t("account.reviews.replyFrom", { host: info.host })}</b>
                    <p>{pick(review.reply, locale)}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AccountShell>
  );
}
