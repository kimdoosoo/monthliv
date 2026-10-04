"use client";

import { useState } from "react";

/** On/off switch, e.g. for automatic translation. */
export function Switch({ label, initial = false }: { label: string; initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <button
      className="lv-switch"
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => setOn((value) => !value)}
    />
  );
}
