"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatDayWeekday, formatRange } from "@/lib/format";
import {
  addDays,
  defaultDiscounts,
  discountFor,
  nightsBetween,
  stayLengthFor,
  type StayLength,
} from "@/lib/pricing";
import { MoonIcon } from "./MoonIcon";

export type Trip = { where: string; from: string; to: string; guests: number };

const lengths: StayLength[] = ["night", "week", "month", "season"];
/** Nights a Moon Scale chip sets from the check-in date. */
const chipNights: Record<StayLength, number> = { night: 1, week: 7, month: 28, season: 90 };

/** Today's date in Seoul as YYYY-MM-DD, for the earliest check-in. */
function todayInSeoul(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

/**
 * A date written the MONTHLIV way ("11월 2일(월)") over the browser's own date input, which
 * stays in place (invisible) for picking, typing and screen readers.
 */
function DateField({
  label,
  name,
  value,
  min,
  onChange,
  plain = false,
}: {
  label: string;
  name: string;
  value: string;
  min: string;
  onChange: (value: string) => void;
  /** Inside the compact bar: no box of its own. */
  plain?: boolean;
}) {
  const t = useTranslations("search");
  const locale = useLocale();
  const input = useRef<HTMLInputElement>(null);
  return (
    <label className={plain ? "lv-sbar__field" : "lv-field"}>
      <span className="lv-field__label">{label}</span>
      <span className={plain ? "lv-datefield lv-datefield--plain" : "lv-datefield"}>
        <span className="lv-datefield__text" aria-hidden="true">
          {value ? formatDayWeekday(value, locale) : t("pickDate")}
        </span>
        <input
          ref={input}
          className="lv-datefield__input"
          type="date"
          name={name}
          value={value}
          min={min}
          onChange={(event) => onChange(event.target.value)}
          onClick={() => {
            try {
              input.current?.showPicker();
            } catch {
              // Older browsers open their own picker on focus.
            }
          }}
        />
      </span>
    </label>
  );
}

/** Moon + "28박 · 한 달" + "1박 요금 25% 할인", for the dates picked so far. */
function StaySummary({ nights, length }: { nights: number; length: StayLength | null }) {
  const t = useTranslations();
  if (!length) return <span className="lv-small">{t("search.pickDates")}</span>;
  const percent = discountFor(defaultDiscounts, length);
  return (
    <span className="lv-staysum" aria-live="polite">
      <MoonIcon length={length} size={22} />
      {t("search.staySummary", { nights, length: t(`length.${length}`) })}
      {percent > 0 && (
        <span className="lv-badge lv-badge--moon lv-badge--sm">
          {t("search.nightOff", { percent })}
        </span>
      )}
    </span>
  );
}

/**
 * The search: where, check-in, check-out and guests, then the stay those dates make on the Moon
 * Scale. `hero` is the home page card with the "how long?" chips under it; `bar` is the compact
 * row above the results.
 */
export function SearchForm({
  action,
  variant,
  initial,
}: {
  action: string;
  variant: "hero" | "bar";
  initial: Trip;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [where, setWhere] = useState(initial.where);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [guests, setGuests] = useState(initial.guests);
  const [open, setOpen] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  const nights = from && to ? nightsBetween(from, to) : 0;
  const length = nights > 0 ? stayLengthFor(nights) : null;
  const today = todayInSeoul();

  function pickFrom(value: string) {
    setFrom(value);
    // Keep the stay's length when the check-in moves.
    if (value && nights > 0) setTo(addDays(value, nights));
    else if (to && value && to <= value) setTo("");
  }

  function pickLength(next: StayLength) {
    const start = from || addDays(today, 1);
    setFrom(start);
    setTo(addDays(start, chipNights[next]));
  }

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (form.current && !form.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const guestOptions = Array.from({ length: 8 }, (_, index) => index + 1);

  const chips = (
    <div className="lv-chips" role="group" aria-label={t("search.howLong")}>
      {lengths.map((item) => {
        const percent = discountFor(defaultDiscounts, item);
        return (
          <button
            key={item}
            className="lv-chip lv-chip--stay"
            type="button"
            aria-pressed={length === item}
            onClick={() => pickLength(item)}
          >
            <MoonIcon length={item} />
            {t(`length.${item}`)}
            <small>{percent > 0 ? t("search.minus", { percent }) : t(`length.${item}Range`)}</small>
          </button>
        );
      })}
    </div>
  );

  if (variant === "hero") {
    return (
      <div className="lv-hsearch">
        <form className="lv-hsearch__card" role="search" action={action} aria-label={t("search.label")}>
          <div className="lv-hsearch__fields">
            <label className="lv-field">
              <span className="lv-field__label">{t("search.where")}</span>
              <input
                className="lv-input"
                type="search"
                name="where"
                value={where}
                placeholder={t("search.wherePlaceholder")}
                autoComplete="off"
                onChange={(event) => setWhere(event.target.value)}
              />
            </label>
            <DateField label={t("search.checkIn")} name="from" value={from} min={today} onChange={pickFrom} />
            <DateField
              label={t("search.checkOut")}
              name="to"
              value={to}
              min={from ? addDays(from, 1) : addDays(today, 1)}
              onChange={setTo}
            />
            <label className="lv-field">
              <span className="lv-field__label">{t("search.guestsLabel")}</span>
              <select
                className="lv-select"
                name="guests"
                value={guests}
                onChange={(event) => setGuests(Number(event.target.value))}
              >
                {guestOptions.map((count) => (
                  <option key={count} value={count}>
                    {t("search.guests", { count })}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="lv-hsearch__foot">
            <StaySummary nights={nights} length={length} />
            <button className="lv-btn lv-btn--moon" type="submit">
              <Search size={20} strokeWidth={2} aria-hidden="true" />
              {t("search.submit")}
            </button>
          </div>
        </form>
        <div className="lv-hsearch__how">
          <span className="lv-label">{t("search.howLongQuestion")}</span>
          {chips}
        </div>
      </div>
    );
  }

  const range = nights > 0 ? formatRange(from, to, locale) : t("search.pickDate");
  return (
    <form ref={form} className="lv-sbar" role="search" action={action} aria-label={t("search.change")}>
      <label className="lv-sbar__field lv-sbar__field--where">
        <span className="lv-field__label">{t("search.where")}</span>
        <input
          className="lv-sbar__input"
          type="search"
          name="where"
          value={where}
          placeholder={t("search.wherePlaceholder")}
          autoComplete="off"
          onChange={(event) => setWhere(event.target.value)}
        />
      </label>
      <div className="lv-sbar__when">
        <button
          className="lv-sbar__field lv-sbar__field--when"
          type="button"
          aria-expanded={open}
          aria-controls="lv-when"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="lv-field__label">{t("search.dates")}</span>
          <span className="lv-sbar__value">{range}</span>
        </button>
        <div className="lv-pop" id="lv-when" hidden={!open}>
          <div className="lv-pop__dates">
            <DateField label={t("search.checkIn")} name="from" value={from} min={today} onChange={pickFrom} />
            <DateField
              label={t("search.checkOut")}
              name="to"
              value={to}
              min={from ? addDays(from, 1) : addDays(today, 1)}
              onChange={setTo}
            />
          </div>
          {chips}
          <p className="lv-small">{t("search.tierHint")}</p>
          <button className="lv-btn lv-btn--night lv-btn--sm" type="button" onClick={() => setOpen(false)}>
            {t("search.done")}
          </button>
        </div>
      </div>
      <label className="lv-sbar__field lv-sbar__field--who">
        <span className="lv-field__label">{t("search.guestsLabel")}</span>
        <select
          className="lv-sbar__select"
          name="guests"
          value={guests}
          onChange={(event) => setGuests(Number(event.target.value))}
        >
          {guestOptions.map((count) => (
            <option key={count} value={count}>
              {t("search.guests", { count })}
            </option>
          ))}
        </select>
      </label>
      {length && (
        <span className="lv-sbar__stay">
          <MoonIcon length={length} />
          {discountFor(defaultDiscounts, length) > 0
            ? t("search.barSummary", {
                nights,
                length: t(`length.${length}`),
                percent: discountFor(defaultDiscounts, length),
              })
            : t("search.staySummary", { nights, length: t(`length.${length}`) })}
        </span>
      )}
      <button className="lv-sbar__go" type="submit" aria-label={t("search.submit")}>
        <Search size={22} strokeWidth={2} aria-hidden="true" />
      </button>
    </form>
  );
}
