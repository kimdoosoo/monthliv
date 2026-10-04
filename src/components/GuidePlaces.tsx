"use client";

import { useMemo, useState } from "react";
import { StayMap, type PricePin } from "./StayMap";

export type GuidePlace = {
  key: string;
  category: string;
  name: string;
  text: string;
  pin: PricePin;
};

/**
 * Everyday places on a neighbourhood guide: the chips pick a kind of place, and the map and
 * the list show only those. Pointing at a place in the list darkens its pin. Text comes formatted
 * from the server.
 */
export function GuidePlaces({
  categories,
  places,
  groupLabel,
  mapLabel,
}: {
  categories: { key: string; label: string }[];
  places: GuidePlace[];
  groupLabel: string;
  mapLabel: string;
}) {
  const [category, setCategory] = useState("all");
  const [active, setActive] = useState<string | null>(null);
  const shown = useMemo(
    () => (category === "all" ? places : places.filter((place) => place.category === category)),
    [category, places],
  );
  const pins = useMemo(() => shown.map((place) => place.pin), [shown]);

  return (
    <>
      <div className="lv-chips" role="group" aria-label={groupLabel}>
        {categories.map(({ key, label }) => (
          <button
            key={key}
            className="lv-chip"
            type="button"
            aria-pressed={category === key}
            onClick={() => setCategory(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="lv-guide__living">
        <div className="lv-guide__map">
          <StayMap mode="results" pins={pins} activeId={active} searchAsMove={false} label={mapLabel} />
        </div>
        <ul className="lv-pois" aria-live="polite">
          {shown.map(({ key, name, text }) => (
            <li key={key} onMouseEnter={() => setActive(key)} onMouseLeave={() => setActive(null)}>
              <b>{name}</b>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
