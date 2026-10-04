/* eslint-disable @next/next/no-img-element -- SVG logos are served as they are, without resizing. */

/**
 * The MONTHLIV wordmark and the M mark, from public/brand (traced from the official logo files;
 * never retyped in a font). The wordmark is 707 × 96, so its width is height × 7.365.
 * Reverse versions are beige, for dark surfaces (footer, dark panels).
 */
export function Wordmark({
  variant = "full",
  height = 22,
  className,
  label = "MONTHLIV",
}: {
  variant?: "full" | "reverse";
  height?: number;
  className?: string;
  /** Spoken name; pass "" when a link around it already names it. */
  label?: string;
}) {
  const src = variant === "reverse" ? "/brand/monthliv-wordmark-reverse.svg" : "/brand/monthliv-wordmark.svg";
  return (
    <img
      className={className}
      src={src}
      alt={label}
      width={Math.round(height * 7.365)}
      height={height}
      translate="no"
    />
  );
}

/** The M from the wordmark on its own: brown on light surfaces, beige on dark ones. */
export function Mark({
  variant = "full",
  size = 40,
  className,
}: {
  variant?: "full" | "reverse";
  size?: number;
  className?: string;
}) {
  const src = variant === "reverse" ? "/brand/monthliv-mark-reverse.svg" : "/brand/monthliv-mark.svg";
  // The M is 113 × 88: `size` is its width.
  return <img className={className} src={src} alt="" width={size} height={Math.round((size * 88) / 113)} />;
}
