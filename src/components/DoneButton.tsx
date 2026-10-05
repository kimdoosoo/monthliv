"use client";

import { useState } from "react";
import { Check } from "lucide-react";

/**
 * A button whose work happens on the page (save, send): pressing it says it is done for a
 * moment. The sample screens keep what was typed on the page only.
 */
export function DoneButton({
  label,
  done,
  className = "lv-btn",
  type = "button",
}: {
  label: string;
  done: string;
  className?: string;
  type?: "button" | "submit";
}) {
  const [shown, setShown] = useState(false);

  return (
    <button
      className={className}
      type={type}
      onClick={() => {
        setShown(true);
        window.setTimeout(() => setShown(false), 2400);
      }}
    >
      {shown && <Check size={18} strokeWidth={2} aria-hidden="true" />}
      <span aria-live="polite">{shown ? done : label}</span>
    </button>
  );
}
