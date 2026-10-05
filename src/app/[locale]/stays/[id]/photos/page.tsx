import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { PhotoSlot } from "@/components/PhotoSlot";
import { SaveButton } from "@/components/SaveButton";
import { ShareButton } from "@/components/ShareButton";
import { getListing, listings, pick, type Photo } from "@/data/listings";
import { Link } from "@/i18n/navigation";

// Only places with real photos have a photo page; any other address is a 404.
export function generateStaticParams() {
  return listings.filter((listing) => listing.real?.photos.length).map((listing) => ({ id: listing.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/stays/[id]/photos">): Promise<Metadata> {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing?.real?.photos.length) return {};
  const locale = await getLocale();
  const t = await getTranslations();
  return {
    title: t("listing.photosTitle", {
      title: pick(listing.title, locale),
      count: listing.real.photos.length,
    }),
  };
}

/** Every photo of a place, grouped by part of the place. The listing page's photos link here. */
export default async function PhotosPage({ params }: PageProps<"/[locale]/stays/[id]/photos">) {
  const { id } = await params;
  const listing = getListing(id);
  if (!listing?.real?.photos.length) notFound();

  const locale = await getLocale();
  const t = await getTranslations();
  const { photos, spaces } = listing.real;
  const title = pick(listing.title, locale);
  const byFile = new Map(photos.map((photo) => [photo.file, photo] as [string, Photo]));

  return (
    <div className="lv-page">
      <div className="lv-photobar">
        <div className="lv-wrap lv-wrap--narrow lv-photobar__in">
          <Link className="lv-photobar__back" href={`/stays/${listing.id}`}>
            <ChevronLeft size={22} strokeWidth={1.75} aria-hidden="true" />
            {t("photos.back")}
          </Link>
          <div className="lv-ltitle__tools">
            <ShareButton label={t("listing.share")} copied={t("listing.shareCopied")} title={title} />
            <SaveButton className="lv-tbtn" label={t("listing.save")} text />
          </div>
        </div>
      </div>

      <main className="lv-wrap lv-wrap--narrow lv-photos">
        <div className="lv-photos__head">
          <h1 className="lv-ltitle__h">{t("photos.title")}</h1>
          <p className="lv-sub">{t("listing.photosTitle", { title, count: photos.length })}</p>
          <nav className="lv-photos__nav" aria-label={t("photos.spaces")}>
            {spaces.map((space) => {
              const cover = byFile.get(space.files[0]);
              return (
                <a key={space.key} className="lv-photos__navitem" href={`#${space.key}`}>
                  {cover && (
                    <PhotoSlot
                      className="lv-photos__thumb"
                      tone={listing.tone}
                      photo={{ listingId: listing.id, photo: cover }}
                      sizes="150px"
                      decorative
                    />
                  )}
                  {pick(space.title, locale)}
                </a>
              );
            })}
          </nav>
        </div>

        {spaces.map((space, spaceIndex) => (
          <section key={space.key} id={space.key} className="lv-photos__space" aria-labelledby={`${space.key}-title`}>
            <div className="lv-photos__text">
              <h2 id={`${space.key}-title`} className="lv-photos__h2">
                {pick(space.title, locale)}
              </h2>
              <p className="lv-small">{pick(space.note, locale)}</p>
            </div>
            <ul className="lv-photos__grid">
              {space.files.map((file, index) => {
                const photo = byFile.get(file);
                if (!photo) return null;
                return (
                  <li key={file} id={`photo-${file}`}>
                    <PhotoSlot
                      className="lv-photos__photo"
                      tone={listing.tone}
                      photo={{ listingId: listing.id, photo }}
                      sizes="(max-width: 900px) 100vw, 400px"
                      priority={spaceIndex === 0 && index < 2}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>

      <Footer />
    </div>
  );
}
