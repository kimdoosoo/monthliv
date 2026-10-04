"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { formatCount } from "@/lib/format";

const digits = (value: string) => Number(value.replace(/\D/g, "")) || 0;

/**
 * An amount in won: typing is left alone, and when the field loses focus the amount rounds to
 * the step and gets its thousands separators back.
 */
export function AmountInput({
  initial,
  step = 100,
  unit,
  name,
  big = false,
}: {
  initial: number;
  step?: number;
  unit: string;
  name?: string;
  big?: boolean;
}) {
  const locale = useLocale();
  const [text, setText] = useState(() => formatCount(initial, locale));

  return (
    <span className={`lv-amount${big ? " lv-amount--big" : ""}`}>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        name={name}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => setText(formatCount(Math.round(digits(text) / step) * step, locale))}
      />
      <span aria-hidden="true">{unit}</span>
    </span>
  );
}
