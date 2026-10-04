import type { Metadata } from "next";
import { Laptop, Smartphone } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/AccountShell";
import { DoneButton } from "@/components/DoneButton";
import { pick } from "@/data/listings";
import { sampleDevices, sampleMember } from "@/data/samples";
import { formatDate } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("security.title"), robots: { index: false } };
}

const providers = ["kakao", "naver", "apple", "google", "email"] as const;

/**
 * Login and security: the ways to sign in, the password, two-step sign-in, signed-in devices,
 * and the member's data (download, delete).
 */
export default async function SecurityPage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const linked = providers.filter((key) => sampleMember.logins[key]).length;

  return (
    <AccountShell current="security">
      <div className="lv-editor__head">
        <h1 className="lv-editor__h1">{t("account.security.title")}</h1>
        <p className="lv-sub">{t("account.security.lead")}</p>
      </div>

      <section className="lv-editcard" aria-labelledby="logins-title">
        <div>
          <h2 id="logins-title" className="lv-editcard__title">
            {t("account.security.loginsTitle")}
          </h2>
          <p className="lv-editcard__sub">{t("account.security.lastOne")}</p>
        </div>
        <ul className="lv-rows">
          {providers.map((key) => {
            const on = sampleMember.logins[key];
            return (
              <li key={key} className="lv-rows__row">
                <span className="lv-rows__main">
                  <b>{t(`account.security.providers.${key}`)}</b>
                  <span className="lv-small">
                    {on
                      ? key === "email"
                        ? sampleMember.email
                        : t("account.security.connected")
                      : t("account.security.notConnected")}
                  </span>
                </span>
                {on ? (
                  linked > 1 && (
                    <DoneButton
                      className="lv-btn lv-btn--xs"
                      label={t("account.security.disconnect")}
                      done={t("account.security.requested")}
                    />
                  )
                ) : (
                  <DoneButton
                    className="lv-btn lv-btn--xs"
                    label={t("account.security.connect")}
                    done={t("account.security.requested")}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="lv-editcard" aria-labelledby="password-title">
        <h2 id="password-title" className="lv-editcard__title">
          {t("account.security.passwordTitle")}
        </h2>
        <div className="lv-rows__row">
          <span className="lv-rows__main">
            <b>{t("account.security.password")}</b>
            <span className="lv-small">
              {t("account.security.passwordChanged", { date: formatDate(sampleMember.passwordChangedOn, locale) })}
            </span>
          </span>
          <DoneButton
            className="lv-btn lv-btn--xs"
            label={t("account.security.changePassword")}
            done={t("account.security.linkSent")}
          />
        </div>
        <label className="lv-optrow lv-optrow--first">
          <span>
            <b>{t("account.security.twoStep")}</b>
            <span className="lv-small">{t("account.security.twoStepText")}</span>
          </span>
          <input type="checkbox" />
        </label>
      </section>

      <section className="lv-editcard" aria-labelledby="devices-title">
        <h2 id="devices-title" className="lv-editcard__title">
          {t("account.security.devicesTitle")}
        </h2>
        <ul className="lv-rows">
          {sampleDevices.map((device) => (
            <li key={device.key} className="lv-rows__row">
              <span className="lv-rows__icon" aria-hidden="true">
                {device.key === "phone" ? (
                  <Smartphone size={22} strokeWidth={1.75} />
                ) : (
                  <Laptop size={22} strokeWidth={1.75} />
                )}
              </span>
              <span className="lv-rows__main">
                <b translate="no">{device.name}</b>
                <span className="lv-small">
                  {pick(device.place, locale)} ·{" "}
                  {device.lastSeen
                    ? t("account.security.lastSeen", { date: formatDate(device.lastSeen, locale) })
                    : t("account.security.thisDevice")}
                </span>
              </span>
              {device.lastSeen && (
                <DoneButton
                  className="lv-btn lv-btn--xs"
                  label={t("account.security.logoutDevice")}
                  done={t("account.security.loggedOut")}
                />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="lv-editcard" aria-labelledby="data-title">
        <h2 id="data-title" className="lv-editcard__title">
          {t("account.security.dataTitle")}
        </h2>
        <div className="lv-rows__row">
          <span className="lv-rows__main">
            <b>{t("account.security.download")}</b>
            <span className="lv-small">{t("account.security.downloadText")}</span>
          </span>
          <DoneButton
            className="lv-btn lv-btn--xs"
            label={t("account.security.requestDownload")}
            done={t("account.security.requested")}
          />
        </div>
        <details className="lv-danger">
          <summary>{t("account.security.deleteTitle")}</summary>
          <p className="lv-small">{t("account.security.deleteText")}</p>
          <DoneButton
            className="lv-btn lv-btn--xs lv-btn--danger"
            label={t("account.security.deleteAction")}
            done={t("account.security.requested")}
          />
        </details>
      </section>
    </AccountShell>
  );
}
