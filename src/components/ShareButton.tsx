"use client";

import { useState } from "react";
import { Share } from "lucide-react";

/**
 * Share this page: the phone's share sheet where there is one, otherwise the link is copied and
 * the button says so for a moment.
 */
export function ShareButton({
  label,
  copied,
  title,
  className = "lv-tbtn",
}: {
  label: string;
  copied: string;
  title: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setDone(true);
      window.setTimeout(() => setDone(false), 2400);
    } catch {
      // Closing the share sheet is not an error worth showing.
    }
  }

  return (
    <button className={className} type="button" onClick={share}>
      <Share size={18} strokeWidth={1.75} aria-hidden="true" />
      <span aria-live="polite">{done ? copied : label}</span>
    </button>
  );
}
