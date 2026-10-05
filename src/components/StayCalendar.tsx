import { useLocale } from "next-intl";
import { formatMonthYear } from "@/lib/format";

/** The weekday names, Sunday first, in the page's language ("일", "Sun"). */
function weekdays(locale: string): string[] {
  const sunday = new Date(Date.UTC(2026, 0, 4));
  const format = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, {
    weekday: locale === "ko" || locale === "ja" || locale.startsWith("zh") ? "narrow" : "short",
    timeZone: "UTC",
  });
  return Array.from({ length: 7 }, (_, day) => format.format(new Date(sunday.getTime() + day * 86_400_000)));
}

function parts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

/**
 * The stay on a month calendar: check-in and check-out as dark circles, the nights between on
 * moon-soft. Shows each month the stay touches, up to three.
 */
export function StayCalendar({ from, to, label }: { from: string; to: string; label: string }) {
  const locale = useLocale();
  const names = weekdays(locale);
  const start = parts(from);
  const end = parts(to);
  const months: { year: number; month: number }[] = [];
  let year = start.year;
  let month = start.month;
  while (months.length < 3 && (year < end.year || (year === end.year && month <= end.month))) {
    months.push({ year, month });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return (
    <div className="lv-cal" role="group" aria-label={label}>
      {months.map(({ year, month }) => {
        const first = `${year}-${String(month).padStart(2, "0")}-01`;
        const lead = new Date(`${first}T00:00:00Z`).getUTCDay();
        const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
        return (
          <div key={first} className="lv-cal__month">
            <p className="lv-cal__title">{formatMonthYear(first, locale)}</p>
            <div className="lv-cal__grid" aria-hidden="true">
              {names.map((name, index) => (
                <span key={name + index} className={`lv-cal__wd${index === 0 ? " is-sun" : ""}`}>
                  {name}
                </span>
              ))}
              {Array.from({ length: lead }, (_, index) => (
                <span key={`lead${index}`} />
              ))}
              {Array.from({ length: days }, (_, index) => {
                const day = index + 1;
                const date = `${first.slice(0, 8)}${String(day).padStart(2, "0")}`;
                const sunday = (lead + index) % 7 === 0;
                const edge = date === from ? "is-from" : date === to ? "is-to" : "";
                const inside = date > from && date < to;
                return (
                  <span
                    key={date}
                    className={`lv-cal__day${inside ? " is-in" : ""}${edge ? ` ${edge}` : ""}${sunday ? " is-sun" : ""}`}
                  >
                    {edge ? <b>{day}</b> : day}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
