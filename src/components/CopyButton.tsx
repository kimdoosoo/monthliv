"use client";

import { useState } from "react";

/** Copies `value` and says so on the button for a moment. */
export function CopyButton({
  value,
  label,
  done,
  className = "lv-btn lv-btn--xs",
}: {
  value: string;
  label: string;
  done: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={className}
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2400);
        } catch {
          // Clipboard blocked: the value is on screen to copy by hand.
        }
      }}
    >
      <span aria-live="polite">{copied ? done : label}</span>
    </button>
  );
}
