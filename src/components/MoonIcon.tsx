import type { StayLength } from "@/lib/pricing";

/**
 * The stay scale: a small building whose windows light up as the stay grows — one window for a
 * night, two for a week, all four for a month, all four with an outline round the house for a
 * season. Only ever used for length of stay. (The name comes from the Livawhile codebase.)
 */
export function MoonIcon({
  length,
  size = 20,
  className = "lv-moon",
}: {
  length: StayLength;
  size?: number;
  className?: string;
}) {
  const lit = length === "night" ? 1 : length === "week" ? 2 : 4;
  // Bottom row first, so a short stay lights the ground floor.
  const panes = [
    { x: 6, y: 12 },
    { x: 12.5, y: 12 },
    { x: 6, y: 5.5 },
    { x: 12.5, y: 5.5 },
  ];
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect className="ring" x="3.5" y="2.5" width="17" height="19" rx="2" />
      {panes.map((pane, index) => (
        <rect
          key={index}
          className={index < lit ? "lit pane" : "pane"}
          x={pane.x}
          y={pane.y}
          width="5.5"
          height="5.5"
          rx="0.8"
        />
      ))}
      {length === "season" && <rect className="halo" x="1" y="0.6" width="22" height="22.8" rx="3.4" />}
    </svg>
  );
}

/** A plain dot: map pins, the stay summary, discount badges. */
export function MoonDot({ size = 16, className = "lv-moondot" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

/** The filled star before a rating: ★ 4.92. */
export function Star({ size = 14 }: { size?: number }) {
  return (
    <svg className="lv-star" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
    </svg>
  );
}
