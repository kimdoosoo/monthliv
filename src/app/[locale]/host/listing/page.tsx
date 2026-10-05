import type { Metadata } from "next";
import { Gauge, ImagePlus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { DoneButton } from "@/components/DoneButton";
import { HashDetails } from "@/components/HashDetails";
import { HostShell } from "@/components/HostShell";
import { ListingEditorNav } from "@/components/ListingEditorNav";
import { PhotoSlot } from "@/components/PhotoSlot";
import { hostPlaces } from "@/data/host";
import { getListing, pick, type Amenity } from "@/data/listings";
import { sampleStayInfo } from "@/data/samples";
import { formatDate, formatTime } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pms");
  return { title: t("listing.title"), robots: { index: false } };
}

const slots = ["photoRoom", "photoDesk", "photoBath", "photoLounge", "photoEntrance"] as const;
const amenityChoices: Amenity[] = ["wifi", "desk", "bath", "window", "aircon", "fridge", "bedding", "laundry", "kitchen", "parcel", "parking"];
const studioAmenities: Amenity[] = ["laundry", "desk", "wifi", "kitchen", "aircon", "bedding", "bath", "window", "fridge", "parcel"];
const guideKeys = ["trash", "laundry", "heating", "building"] as const;
const times = ["14:00", "15:00", "16:00"];
const outTimes = ["10:00", "11:00", "12:00"];

/**
 * The listing editor's info page: photos, about, amenities and Wi-Fi, house rules and the house
 * guide, and the lodging registration. A draft (?listing=mangwon-draft) starts mostly empty.
 */
export default async function HostListingPage({ searchParams }: PageProps<"/[locale]/host/listing">) {
  const locale = await getLocale();
  const t = await getTranslations();
  const { listing: picked } = await searchParams;
  // ?listing=new starts an empty place, as a new host does from the hosting page.
  const place =
    picked === "new"
      ? { key: "new", tone: 1, status: "draft" as const, registration: "missing" as const, title: undefined, listingId: undefined }
      : (hostPlaces.find((item) => item.key === picked) ?? hostPlaces[0]);
  const listing = place.listingId ? getListing(place.listingId) : undefined;
  const draft = !listing;
  const title = listing ? pick(listing.title, locale) : "";

  return (
    <HostShell current="listings" wide>
      <div className="lv-editor lv-editor--work">
        {listing ? (
          <ListingEditorNav listingId={listing.id} current="photos" />
        ) : (
          <nav className="lv-editor__nav" aria-label={t("pricing.sections")}>
            <div className="lv-editor__stay">
              <PhotoSlot tone={place.tone} className="lv-editor__photo" decorative />
              <b>{place.title ? pick(place.title, locale) : t("pms.listing.newPlace")}</b>
            </div>
          </nav>
        )}

        <form className="lv-editor__main" action="#">
          <div className="lv-editor__head">
            <h1 className="lv-editor__h1">{draft ? t("pms.listing.draftTitle") : t("pms.listing.title")}</h1>
            <p className="lv-sub">{draft ? t("pms.listing.draftLead") : t("pms.listing.lead")}</p>
          </div>

          <section className="lv-editcard" id="photos" aria-labelledby="photos-title">
            <div>
              <h2 id="photos-title" className="lv-editcard__title">
                {t("pricing.section.photos")}
              </h2>
              <p className="lv-editcard__sub">{t("pms.listing.photosLead")}</p>
            </div>
            <ul className="lv-photogrid">
              {(draft ? slots.slice(0, 2) : slots).map((key, index) => (
                <li key={key}>
                  <PhotoSlot tone={place.tone + index} className="lv-photogrid__slot" label={t(`listing.${key}`)} decorative />
                  {index === 0 && <span className="lv-badge lv-badge--sm lv-photogrid__cover">{t("pms.listing.cover")}</span>}
                </li>
              ))}
              <li>
                <label className="lv-photogrid__add">
                  <ImagePlus size={28} strokeWidth={1.75} aria-hidden="true" />
                  <span>{t("pms.listing.addPhoto")}</span>
                  <input className="lv-sr" type="file" accept="image/jpeg,image/png,image/webp" multiple />
                </label>
              </li>
            </ul>
            <p className="lv-note">{t("pms.listing.realPhotos")}</p>
          </section>

          <section className="lv-editcard" id="about" aria-labelledby="about-title">
            <h2 id="about-title" className="lv-editcard__title">
              {t("pricing.section.about")}
            </h2>
            <label className="lv-field">
              <span className="lv-field__label lv-field__label--plain">{t("pms.listing.name")}</span>
              <input className="lv-input" defaultValue={title} placeholder={t("pms.listing.namePlaceholder")} maxLength={40} />
            </label>
            <div className="lv-editcard__grid">
              <label className="lv-field">
                <span className="lv-field__label lv-field__label--plain">{t("types.label")}</span>
                <select className="lv-select" defaultValue="studio">
                  {(["studio", "share", "coliving", "stay", "hostel", "residence", "guesthouse"] as const).map((key) => (
                    <option key={key} value={key}>
                      {t(`types.${key}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="lv-field">
                <span className="lv-field__label lv-field__label--plain">{t("pms.listing.guests")}</span>
                <select className="lv-select" defaultValue={String(listing?.guests ?? 1)}>
                  {[1, 2, 3, 4].map((count) => (
                    <option key={count} value={count}>
                      {t("search.guests", { count })}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="lv-field">
              <span className="lv-field__label lv-field__label--plain">{t("pms.listing.description")}</span>
              <textarea
                className="lv-textarea"
                rows={6}
                defaultValue={listing?.description ? pick(listing.description, locale) : ""}
                placeholder={t("pms.listing.descriptionPlaceholder")}
              />
              <span className="lv-small">{t("pms.listing.translateNote")}</span>
            </label>
          </section>

          <section className="lv-editcard" id="amenities" aria-labelledby="amenities-title">
            <h2 id="amenities-title" className="lv-editcard__title">
              {t("pricing.section.amenities")}
            </h2>
            <fieldset className="lv-field">
              <legend className="lv-sr">{t("listing.amenitiesTitle")}</legend>
              <div className="lv-chips">
                {amenityChoices.map((key) => (
                  <label key={key} className="lv-chip">
                    <input type="checkbox" defaultChecked={!draft && studioAmenities.includes(key)} />
                    {t(`listing.amenity.${key}`)}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="lv-rows__row lv-wifirow">
              <span className="lv-rows__icon" aria-hidden="true">
                <Gauge size={22} strokeWidth={1.75} />
              </span>
              <span className="lv-rows__main">
                <b>{draft ? t("pms.listing.wifiNone") : t("pms.listing.wifiSpeed", { mbps: sampleStayInfo.wifi.mbps })}</b>
                <span className="lv-small">
                  {draft ? t("pms.listing.wifiHow") : t("pms.listing.wifiMeasured", { date: formatDate("2026-10-02", locale) })}
                </span>
              </span>
              <DoneButton className="lv-btn lv-btn--xs" label={t("pms.listing.measure")} done={t("pms.listing.measuring")} />
            </div>
          </section>

          <section className="lv-editcard" id="rules" aria-labelledby="rules-title">
            <h2 id="rules-title" className="lv-editcard__title">
              {t("pricing.section.rules")}
            </h2>
            <div className="lv-editcard__grid">
              <label className="lv-field">
                <span className="lv-field__label lv-field__label--plain">{t("pms.listing.checkIn")}</span>
                <select className="lv-select" defaultValue="15:00">
                  {times.map((time) => (
                    <option key={time} value={time}>
                      {t("pms.listing.after", { time: formatTime(time, locale) })}
                    </option>
                  ))}
                </select>
              </label>
              <label className="lv-field">
                <span className="lv-field__label lv-field__label--plain">{t("pms.listing.checkOut")}</span>
                <select className="lv-select" defaultValue="11:00">
                  {outTimes.map((time) => (
                    <option key={time} value={time}>
                      {t("pms.listing.before", { time: formatTime(time, locale) })}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="lv-optrow lv-optrow--first">
              <span>
                <b>{t("pms.listing.selfCheckIn")}</b>
                <span className="lv-small">{t("pms.listing.selfCheckInText")}</span>
              </span>
              <input type="checkbox" defaultChecked={!draft} />
            </label>
            <label className="lv-optrow">
              <span>
                <b>{t("pms.listing.pets")}</b>
                <span className="lv-small">{t("pms.listing.petsText")}</span>
              </span>
              <input type="checkbox" />
            </label>
            <label className="lv-optrow">
              <span>
                <b>{t("pms.listing.quiet")}</b>
                <span className="lv-small">{t("pms.listing.quietText")}</span>
              </span>
              <input type="checkbox" defaultChecked />
            </label>
            <div className="lv-guideedit">
              <h3 className="lv-h4">{t("stay.guideTitle")}</h3>
              <p className="lv-small">{t("pms.listing.guideLead")}</p>
              {guideKeys.map((key) => (
                <details key={key} className="lv-guideedit__item">
                  <summary>{t(`stay.guide.${key}.title`)}</summary>
                  <textarea
                    className="lv-textarea"
                    rows={4}
                    aria-label={t(`stay.guide.${key}.title`)}
                    defaultValue={draft ? "" : t(`stay.guide.${key}.text`)}
                  />
                </details>
              ))}
            </div>
          </section>

          <section className="lv-editcard" id="registration" aria-labelledby="reg-title">
            <div>
              <h2 id="reg-title" className="lv-editcard__title">
                {t("pms.listing.registrationTitle")}
              </h2>
              <p className="lv-editcard__sub">{t("pms.listing.registrationLead")}</p>
            </div>
            <div className="lv-rows__row">
              <span className="lv-rows__main">
                <b>{t(`pms.listings.registration.${place.registration}`)}</b>
                <span className="lv-small">
                  {place.registration === "checked" ? t("pms.listing.registrationChecked") : t("pms.listing.registrationNeeded")}
                </span>
              </span>
              <label className="lv-btn lv-btn--xs">
                {t("pms.listing.upload")}
                <input className="lv-sr" type="file" accept="application/pdf,image/jpeg,image/png" />
              </label>
            </div>
          </section>

          <div className="lv-btnrow">
            <DoneButton className="lv-btn lv-btn--moon" label={draft ? t("pms.listing.saveDraft") : t("language.save")} done={t("language.saved")} />
          </div>
          <HashDetails />
        </form>
      </div>
    </HostShell>
  );
}
