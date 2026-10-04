"use client";

import { useRef, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { formatDayWeekday } from "@/lib/format";
import { addDays, nightsBetween } from "@/lib/pricing";

/** Today's date in Seoul as YYYY-MM-DD, for the earliest check-in. */
function todayInSeoul(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

/**
 * Check-in, check-out and guests in the booking card. A change reloads the page with the new
 * dates in the address, so every price on it is worked out again on the server.
 */
export function BookingDates({ from, to, guests }: { from: string; to: string; guests: number }) {
  const t = useTranslations("search");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const fromInput = useRef<HTMLInputElement>(null);
  const toInput = useRef<HTMLInputElement>(null);
  const today = todayInSeoul();

  function go(next: { from: string; to: string; guests: number }) {
    if (!next.from || !next.to || nightsBetween(next.from, next.to) < 1) return;
    start(() => {
      router.replace(
        { pathname, query: { from: next.from, to: next.to, guests: String(next.guests) } },
        { scroll: false },
      );
    });
  }

  function open(input: HTMLInputElement | null) {
    try {
      input?.showPicker();
    } catch {
      // Older browsers open their own picker on focus.
    }
  }

  const nights = nightsBetween(from, to);
  return (
    <div className="lv-bookbox" aria-busy={pending}>
      <div className="lv-bookbox__row">
        <label className="lv-bookbox__cell">
          <span className="lv-bookbox__k">{t("checkIn")}</span>
          <span className="lv-bookbox__v" aria-hidden="true">
            {formatDayWeekday(from, locale)}
          </span>
          <input
            ref={fromInput}
            className="lv-datefield__input"
            type="date"
            value={from}
            min={today}
            onClick={() => open(fromInput.current)}
            onChange={(event) => {
              const value = event.target.value;
              if (value) go({ from: value, to: addDays(value, nights), guests });
            }}
          />
        </label>
        <label className="lv-bookbox__cell">
          <span className="lv-bookbox__k">{t("checkOut")}</span>
          <span className="lv-bookbox__v" aria-hidden="true">
            {formatDayWeekday(to, locale)}
          </span>
          <input
            ref={toInput}
            className="lv-datefield__input"
            type="date"
            value={to}
            min={addDays(from, 1)}
            onClick={() => open(toInput.current)}
            onChange={(event) => go({ from, to: event.target.value, guests })}
          />
        </label>
      </div>
      <label className="lv-bookbox__cell lv-bookbox__cell--full">
        <span className="lv-bookbox__k">{t("guestsLabel")}</span>
        <select
          className="lv-bookbox__select"
          value={guests}
          onChange={(event) => go({ from, to, guests: Number(event.target.value) })}
        >
          {Array.from({ length: 8 }, (_, index) => index + 1).map((count) => (
            <option key={count} value={count}>
              {t("guests", { count })}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
