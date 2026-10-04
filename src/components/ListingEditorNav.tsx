import { getLocale, getTranslations } from "next-intl/server";
import { getListing, pick } from "@/data/listings";
import { Link } from "@/i18n/navigation";
import { PhotoSlot } from "./PhotoSlot";

export type EditorSection = "photos" | "about" | "amenities" | "pricing" | "calendar" | "rules" | "payouts";

/**
 * The listing editor's sections, beside the form. Photos, about, amenities and rules are one
 * page (/host/listing); prices, the calendar and payouts have their own.
 */
export async function ListingEditorNav({ listingId, current }: { listingId: string; current: EditorSection }) {
  const locale = await getLocale();
  const t = await getTranslations();
  const listing = getListing(listingId);
  const sections: { key: EditorSection; href: string | { pathname: string; query: Record<string, string>; hash?: string } }[] = [
    { key: "photos", href: { pathname: "/host/listing", query: { listing: listingId }, hash: "photos" } },
    { key: "about", href: { pathname: "/host/listing", query: { listing: listingId }, hash: "about" } },
    { key: "amenities", href: { pathname: "/host/listing", query: { listing: listingId }, hash: "amenities" } },
    { key: "pricing", href: { pathname: "/host/pricing", query: { listing: listingId } } },
    { key: "calendar", href: { pathname: "/host/calendar", query: { listing: listingId } } },
    { key: "rules", href: { pathname: "/host/listing", query: { listing: listingId }, hash: "rules" } },
    { key: "payouts", href: "/host/payouts" },
  ];
  const onInfoPage = current === "photos" || current === "about" || current === "amenities" || current === "rules";

  return (
    <nav className="lv-editor__nav" aria-label={t("pricing.sections")}>
      <div className="lv-editor__stay">
        <PhotoSlot tone={listing?.tone ?? 1} className="lv-editor__photo" decorative />
        <b>{listing ? pick(listing.title, locale) : listingId}</b>
      </div>
      <ul>
        {sections.map(({ key, href }) => (
          <li key={key}>
            <Link
              href={href}
              aria-current={key === current || (onInfoPage && key === "photos" && current === "photos") ? "page" : undefined}
            >
              {t(`pricing.section.${key}`)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
