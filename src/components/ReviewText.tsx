"use client";

import { useState } from "react";

/** A review in the reader's language, with a button to switch to what the guest wrote. */
export function ReviewText({
  translated,
  translatedLang,
  original,
  originalLang,
  note,
  showOriginal,
  showTranslation,
}: {
  translated: string;
  /** Language of `translated`; it can differ from the page when a language has no translation yet. */
  translatedLang: string;
  original: string;
  originalLang: string;
  /** e.g. "Translated from German" */
  note: string;
  showOriginal: string;
  showTranslation: string;
}) {
  const [seeOriginal, setSeeOriginal] = useState(false);

  return (
    <>
      <p className="lv-review__text" lang={seeOriginal ? originalLang : translatedLang}>
        {seeOriginal ? original : translated}
      </p>
      <p className="lv-review__trans">
        {note} ·{" "}
        <button className="lv-textbtn" type="button" onClick={() => setSeeOriginal((value) => !value)}>
          {seeOriginal ? showTranslation : showOriginal}
        </button>
      </p>
    </>
  );
}
