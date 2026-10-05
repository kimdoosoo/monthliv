/**
 * Stars to rate with, made of radio buttons so they work before any script loads. The stars up
 * to the one picked fill in (CSS :has); each star's name is read out ("별 4개").
 */
export function StarInput({
  name,
  legend,
  starLabel,
  size = 34,
  defaultValue,
  words,
}: {
  name: string;
  legend: string;
  /** Accessible name for each star, by value: 1 → "별 1개". */
  starLabel: (value: number) => string;
  size?: number;
  defaultValue?: number;
  /** A word under the stars for each value, e.g. 4 → "좋았어요". */
  words?: Record<number, string>;
}) {
  return (
    <fieldset className="lv-stars">
      <legend className="lv-stars__legend">{legend}</legend>
      <span className="lv-stars__row">
        {[1, 2, 3, 4, 5].map((value) => (
          <label key={value} className="lv-stars__star" data-value={value}>
            <input
              className="lv-sr"
              type="radio"
              name={name}
              value={value}
              defaultChecked={value === defaultValue}
              aria-label={starLabel(value)}
            />
            <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
              <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8Z" />
            </svg>
          </label>
        ))}
      </span>
      {words && (
        <span className="lv-stars__words" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((value) => (
            <span key={value} data-value={value}>
              {words[value]}
            </span>
          ))}
        </span>
      )}
    </fieldset>
  );
}
