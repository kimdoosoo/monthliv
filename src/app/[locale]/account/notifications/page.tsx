import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/AccountShell";
import { DoneButton } from "@/components/DoneButton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("notifications.title"), robots: { index: false } };
}

const channels = ["app", "email", "sms"] as const;
type Channel = (typeof channels)[number];

/** What each kind of notice goes out on by default; `required` ones can't be turned off. */
const kinds: { key: "booking" | "messages" | "prices" | "reviews"; on: Channel[]; required?: Channel[] }[] = [
  { key: "booking", on: ["app", "email", "sms"], required: ["app", "email"] },
  { key: "messages", on: ["app", "email"] },
  { key: "prices", on: ["app"] },
  { key: "reviews", on: ["app", "email"] },
];

/**
 * Notifications: which notices go where. Ads need their own opt-in, and ads at night (9 pm to
 * 8 am) a second one, as Korean law asks.
 */
export default async function NotificationsPage() {
  const t = await getTranslations("account.notifications");

  return (
    <AccountShell current="notifications">
      <div className="lv-editor__head">
        <h1 className="lv-editor__h1">{t("title")}</h1>
        <p className="lv-sub">{t("lead")}</p>
      </div>

      <form className="lv-editor__form" action="#">
        <section className="lv-editcard" aria-labelledby="kinds-title">
          <h2 id="kinds-title" className="lv-editcard__title">
            {t("kindsTitle")}
          </h2>
          <div className="lv-tablewrap">
            <table className="lv-checktable">
              <thead>
                <tr>
                  <th scope="col">
                    <span className="lv-sr">{t("kind")}</span>
                  </th>
                  {channels.map((channel) => (
                    <th key={channel} scope="col">
                      {t(`channels.${channel}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kinds.map((kind) => (
                  <tr key={kind.key}>
                    <th scope="row">
                      <b>{t(`kinds.${kind.key}.title`)}</b>
                      <span className="lv-small">{t(`kinds.${kind.key}.text`)}</span>
                      {kind.required && <span className="lv-small">{t("required")}</span>}
                    </th>
                    {channels.map((channel) => {
                      const locked = kind.required?.includes(channel);
                      return (
                        <td key={channel}>
                          <input
                            type="checkbox"
                            defaultChecked={kind.on.includes(channel)}
                            disabled={locked}
                            aria-label={`${t(`kinds.${kind.key}.title`)} · ${t(`channels.${channel}`)}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="lv-editcard" aria-labelledby="ads-title">
          <div>
            <h2 id="ads-title" className="lv-editcard__title">
              {t("adsTitle")}
            </h2>
            <p className="lv-editcard__sub">{t("adsLead")}</p>
          </div>
          <label className="lv-optrow lv-optrow--first">
            <span>
              <b>{t("adsConsent")}</b>
              <span className="lv-small">{t("adsConsentText")}</span>
            </span>
            <input type="checkbox" />
          </label>
          <label className="lv-optrow">
            <span>
              <b>{t("adsNight")}</b>
              <span className="lv-small">{t("adsNightText")}</span>
            </span>
            <input type="checkbox" />
          </label>
          <p className="lv-small">{t("adsNote")}</p>
        </section>

        <div className="lv-btnrow lv-btnrow--end">
          <DoneButton className="lv-btn lv-btn--night" label={t("save")} done={t("saved")} />
        </div>
      </form>
    </AccountShell>
  );
}
