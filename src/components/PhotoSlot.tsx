/* eslint-disable @next/next/no-img-element -- photo sizes are made ahead by scripts/photos.mjs. */
import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import { photoSrc, photoWidths, pick, type Photo, type Tone } from "@/data/listings";

/**
 * A place's photo, or, for places without real photos yet, a warm slot where it will go, marked
 * with a faint M and, when given, the branch's slogan (MONTHLY [ 성수 ] BY MONTHLIV): no stock,
 * no generated images (CLAUDE.md, "실제 사진만").
 */
export function PhotoSlot({
  tone,
  className = "",
  label,
  slogan,
  photo,
  sizes = "100vw",
  priority = false,
  decorative = false,
  children,
}: {
  tone: Tone | number;
  className?: string;
  /** What the photo will show, e.g. "Whole room". Slots only. */
  label?: string;
  /** The branch's neighbourhood for the slogan in the corner of a slot (성수). Slots only. */
  slogan?: string;
  /** A real photo and the place it belongs to. */
  photo?: { listingId: string; photo: Photo };
  /** How wide the photo shows, for picking a file (the img sizes attribute). */
  sizes?: string;
  /** Load at once: the first photo on screen. */
  priority?: boolean;
  /** No description for screen readers when the text next to it already says what it is. */
  decorative?: boolean;
  children?: ReactNode;
}) {
  const locale = useLocale();
  const tint = `lv-photo--t${((Number(tone) - 1) % 6) + 1}`;

  if (photo) {
    const { listingId, photo: image } = photo;
    return (
      <div className={`${className} lv-photo ${tint}`.trim()}>
        <img
          className="lv-photo__img"
          src={photoSrc(listingId, image, 1280)}
          srcSet={photoWidths.map((width) => `${photoSrc(listingId, image, width)} ${width}w`).join(", ")}
          sizes={sizes}
          width={image.width}
          height={image.height}
          alt={decorative ? "" : pick(image.alt, locale)}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
        />
        {children}
      </div>
    );
  }

  return (
    <div className={`${className} lv-photo ${tint}`.trim()}>
      <span className="lv-photo__label">
        <img className="lv-photo__mark" src="/brand/monthliv-mark.svg" alt="" width={46} height={36} />
        {label}
      </span>
      {slogan && (
        <span className="lv-photo__slogan" aria-hidden="true" translate="no">
          MONTHLY [ <b>{slogan}</b> ] BY MONTHLIV
        </span>
      )}
      {children}
    </div>
  );
}
