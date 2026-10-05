import { getLocale, getTranslations } from "next-intl/server";
import type { CouponFormError, CouponFormValues } from "@/lib/couponForm";
import { pick, type Text } from "@/data/listings";

/**
 * The coupon form for hosts and the admin. It sends itself back to the page as GET parameters
 * (send=1), so it works without scripts; the page checks it and shows the result.
 */
export async function CouponForm({
  action,
  values,
  errors,
  issuer,
  quickPicks,
  hash = "new",
}: {
  action: string;
  values: CouponFormValues;
  errors: CouponFormError[];
  issuer: "admin" | "host";
  /** Members to tick instead of typing their IDs. */
  quickPicks: { id: string; name: Text }[];
  hash?: string;
}) {
  const locale = await getLocale();
  const t = await getTranslations("couponForm");
  const has = (key: CouponFormError["key"]) => errors.some((error) => error.key === key);

  return (
    <form className="lv-editcard lv-couponform" action={`${action}#${hash}`} method="get" id={hash}>
      <input type="hidden" name="send" value="1" />
      <h2 className="lv-editcard__title">{t("title")}</h2>

      {errors.length > 0 && (
        <ul className="lv-note lv-note--danger lv-couponform__errors" role="alert">
          {errors.map((error) => (
            <li key={error.key}>
              {error.key === "unknownIds"
                ? t(`errors.unknownIds.${issuer}`, { ids: error.ids })
                : error.key === "codeTaken"
                  ? t("errors.codeTaken", { code: error.code })
                  : t(`errors.${error.key}`)}
            </li>
          ))}
        </ul>
      )}

      <label className="lv-field">
        <span className="lv-field__label lv-field__label--plain">{t("name")}</span>
        <input
          className="lv-input"
          name="title"
          defaultValue={values.title}
          maxLength={40}
          placeholder={t(`namePlaceholder.${issuer}`)}
          aria-invalid={has("title") || undefined}
        />
      </label>

      <div className="lv-editcard__grid">
        <fieldset className="lv-field">
          <legend className="lv-field__label lv-field__label--plain">{t("kind")}</legend>
          <div className="lv-chips">
            <label className="lv-chip">
              <input type="radio" name="kind" value="amount" defaultChecked={values.kind === "amount"} />
              {t("kindAmount")}
            </label>
            <label className="lv-chip">
              <input type="radio" name="kind" value="percent" defaultChecked={values.kind === "percent"} />
              {t("kindPercent")}
            </label>
          </div>
        </fieldset>
        <label className="lv-field">
          <span className="lv-field__label lv-field__label--plain">{t("value")}</span>
          <input
            className="lv-input"
            name="value"
            inputMode="numeric"
            defaultValue={values.value}
            placeholder={t("valuePlaceholder")}
            aria-invalid={has("amount") || has("percent") || undefined}
          />
          <span className="lv-small">{t("valueHint")}</span>
        </label>
        <label className="lv-field">
          <span className="lv-field__label lv-field__label--plain">{t("max")}</span>
          <input className="lv-input" name="max" inputMode="numeric" defaultValue={values.max} placeholder="30000" />
          <span className="lv-small">{t("maxHint")}</span>
        </label>
        <label className="lv-field">
          <span className="lv-field__label lv-field__label--plain">{t("minNights")}</span>
          <select className="lv-select" name="minNights" defaultValue={values.minNights || "0"}>
            {[0, 7, 28, 90].map((nights) => (
              <option key={nights} value={nights}>
                {nights ? t("nightsOrMore", { nights }) : t("anyLength")}
              </option>
            ))}
          </select>
        </label>
        {issuer === "admin" && (
          <label className="lv-field">
            <span className="lv-field__label lv-field__label--plain">{t("minTotal")}</span>
            <input className="lv-input" name="minTotal" inputMode="numeric" defaultValue={values.minTotal} placeholder="100000" />
          </label>
        )}
        <label className="lv-field">
          <span className="lv-field__label lv-field__label--plain">{t("expires")}</span>
          <input
            className="lv-input"
            type="date"
            name="expires"
            defaultValue={values.expires}
            aria-invalid={has("expires") || undefined}
          />
        </label>
      </div>

      {issuer === "admin" && (
        <fieldset className="lv-field">
          <legend className="lv-field__label lv-field__label--plain">{t("audience")}</legend>
          <div className="lv-optcards lv-optcards--2">
            <label className="lv-optcard">
              <input type="radio" name="audience" value="users" defaultChecked={values.audience === "users"} />
              <span className="lv-optcard__text">
                <b>{t("audienceUsers")}</b>
                <span>{t("audienceUsersText")}</span>
              </span>
            </label>
            <label className="lv-optcard">
              <input type="radio" name="audience" value="code" defaultChecked={values.audience === "code"} />
              <span className="lv-optcard__text">
                <b>{t("audienceCode")}</b>
                <span>{t("audienceCodeText")}</span>
              </span>
            </label>
          </div>
        </fieldset>
      )}

      {issuer === "admin" && (
        <div className="lv-editcard__grid lv-couponform__code">
          <label className="lv-field">
            <span className="lv-field__label lv-field__label--plain">{t("code")}</span>
            <input
              className="lv-input lv-input--code"
              name="code"
              defaultValue={values.code}
              placeholder="LIVA-WINTER"
              autoCapitalize="characters"
              spellCheck={false}
              aria-invalid={has("code") || has("codeTaken") || undefined}
            />
            <span className="lv-small">{t("codeHint")}</span>
          </label>
          <label className="lv-field">
            <span className="lv-field__label lv-field__label--plain">{t("limit")}</span>
            <input className="lv-input" name="limit" inputMode="numeric" defaultValue={values.limit} placeholder="1000" />
          </label>
        </div>
      )}

      <fieldset className="lv-field lv-couponform__to">
        <legend className="lv-field__label lv-field__label--plain">{t(`to.${issuer}`)}</legend>
        {quickPicks.length > 0 && (
          <div className="lv-chips">
            {quickPicks.map((member) => (
              <label key={member.id} className="lv-chip">
                <input type="checkbox" name="to" value={member.id} defaultChecked={values.to.includes(member.id)} />
                {pick(member.name, locale)} <span className="lv-chip__id">{member.id}</span>
              </label>
            ))}
          </div>
        )}
        <input
          className="lv-input"
          name="ids"
          defaultValue={values.ids}
          placeholder={t("idsPlaceholder")}
          aria-label={t("ids")}
          aria-invalid={has("unknownIds") || has("noRecipients") || undefined}
          autoCapitalize="none"
          spellCheck={false}
        />
        <span className="lv-small">{t(`toHint.${issuer}`)}</span>
      </fieldset>

      <div className="lv-btnrow">
        <button className="lv-btn lv-btn--night" type="submit">
          {t(`submit.${issuer}`)}
        </button>
      </div>
    </form>
  );
}
