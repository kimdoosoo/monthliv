"use client";

import { useEffect } from "react";

/**
 * Opens the <details> that holds the element a link points at (/help#refunds), on arrival and
 * when the hash changes, so the answer is showing rather than folded away.
 */
export function HashDetails() {
  useEffect(() => {
    function open() {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      const details = target?.closest("details");
      if (details && !details.open) {
        details.open = true;
        target?.scrollIntoView({ block: "start" });
      }
    }
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);

  return null;
}
