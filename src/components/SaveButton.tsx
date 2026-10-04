"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

/**
 * Save a place. By default it is the heart over a card's photo, named by `label`.
 * With `text`, it is a text button with the heart in front (the listing page).
 * Saved fills the heart with moon.
 */
export function SaveButton({
  label,
  initial = false,
  text = false,
  className = "lv-save",
}: {
  label: string;
  initial?: boolean;
  text?: boolean;
  className?: string;
}) {
  const [saved, setSaved] = useState(initial);
  return (
    <button
      className={className}
      type="button"
      aria-label={text ? undefined : label}
      aria-pressed={saved}
      onClick={() => setSaved((value) => !value)}
    >
      <Heart size={text ? 18 : 20} strokeWidth={1.75} aria-hidden="true" />
      {text && label}
    </button>
  );
}
