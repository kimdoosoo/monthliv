"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { StayMap, type PricePin } from "./StayMap";

/**
 * Results on the left, map on the right. Pointing at a card darkens its pin on the map.
 * Cards are rendered on the server and passed in.
 */
export function SearchSplit({
  head,
  items,
  pins,
  empty,
}: {
  head: ReactNode;
  items: { id: string; card: ReactNode }[];
  pins: PricePin[];
  /** Shown instead of the grid when nothing matches. */
  empty?: ReactNode;
}) {
  const t = useTranslations("map");
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="lv-split">
      <section className="lv-results" aria-label={t("results")}>
        {head}
        {items.length === 0 ? (
          empty
        ) : (
          <div className="lv-results__grid">
            {items.map(({ id, card }) => (
              <div
                key={id}
                onMouseEnter={() => setActive(id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(id)}
                onBlur={() => setActive(null)}
              >
                {card}
              </div>
            ))}
          </div>
        )}
      </section>
      <aside className="lv-mapcol" aria-label={t("label")}>
        <StayMap mode="results" pins={pins} activeId={active} />
      </aside>
    </div>
  );
}
