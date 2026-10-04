import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/AccountShell";
import { DoneButton } from "@/components/DoneButton";
import { pick } from "@/data/listings";
import { sampleGuest, sampleMember } from "@/data/samples";
import { routing } from "@/i18n/routing";
import { formatDate } from "@/lib/format";
import { languageName } from "@/lib/languages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("profile.title"), robots: { index: false } };
}

/**
 * Personal info, split into what hosts see and what only MONTHLIV keeps. Identity checks keep
 * the result, never a resident registration or passport number.
 */
export default async function ProfilePage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const spoken: readonly string[] = sampleMember.languages;

  return (
    <AccountShell current="profile">
      <div className="lv-editor__head">
        <h1 className="lv-editor__h1">{t("account.profile.title")}</h1>
        <p className="lv-sub">{t("account.profile.lead")}</p>
      </div>

      <form className="lv-editor__form" action="#">
        <section className="lv-editcard" aria-labelledby="shown-title">
          <div>
            <h2 id="shown-title" className="lv-editcard__title">
              {t("account.profile.shownTitle")}
            </h2>
            <p className="lv-editcard__sub">{t("account.profile.shownLead")}</p>
          </div>
          <label className="lv-field">
            <span className="lv-field__label lv-field__label--plain">{t("account.profile.displayName")}</span>
            <input className="lv-input" defaultValue={pick(sampleGuest.name, locale)} autoComplete="nickname" />
            <span className="lv-small">{t("account.profile.displayNameNote")}</span>
          </label>
          <fieldset className="lv-field">
            <legend className="lv-field__label lv-field__label--plain">{t("account.profile.languages")}</legend>
            <div className="lv-chips lv-chips--check">
              {routing.locales.map((language) => (
                <label key={language} className="lv-chip lv-chip--check">
                  <input type="checkbox" defaultChecked={spoken.includes(language)} />
                  {languageName(language, locale)}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="lv-field">
            <span className="lv-field__label lv-field__label--plain">{t("account.profile.bio")}</span>
            <textarea className="lv-textarea" rows={3} placeholder={t("account.profile.bioPlaceholder")} />
          </label>
        </section>

        <section className="lv-editcard" aria-labelledby="private-title">
          <div>
            <h2 id="private-title" className="lv-editcard__title">
              {t("account.profile.privateTitle")}
            </h2>
            <p className="lv-editcard__sub">{t("account.profile.privateLead")}</p>
          </div>
          <dl className="lv-facts lv-facts--edit">
            <div>
              <dt>{t("account.profile.legalName")}</dt>
              <dd>
                <b>{pick(sampleGuest.fullName, locale)}</b>
                <span className="lv-small">{t("account.profile.legalNameNote")}</span>
              </dd>
            </div>
            <div>
              <dt>{t("account.profile.memberId")}</dt>
              <dd>
                <b translate="no">{sampleMember.id}</b>
                <span className="lv-small">{t("account.profile.memberIdNote")}</span>
              </dd>
            </div>
            <div>
              <dt>{t("account.profile.email")}</dt>
              <dd>
                <b translate="no">{sampleMember.email}</b>
                <details className="lv-inlineedit">
                  <summary>{t("account.profile.change")}</summary>
                  <span className="lv-inlineform">
                    <input
                      className="lv-input lv-inlineform__field"
                      type="email"
                      autoComplete="email"
                      aria-label={t("account.profile.newEmail")}
                      placeholder={t("account.profile.newEmail")}
                    />
                    <DoneButton
                      className="lv-btn lv-btn--night"
                      label={t("account.profile.sendCheck")}
                      done={t("account.profile.sent")}
                    />
                  </span>
                </details>
              </dd>
            </div>
            <div>
              <dt>{t("account.profile.phone")}</dt>
              <dd>
                <b translate="no">{sampleMember.phone}</b>
                <details className="lv-inlineedit">
                  <summary>{t("account.profile.change")}</summary>
                  <span className="lv-inlineform">
                    <input
                      className="lv-input lv-inlineform__field"
                      type="tel"
                      autoComplete="tel"
                      aria-label={t("account.profile.newPhone")}
                      placeholder={t("account.profile.newPhone")}
                    />
                    <DoneButton
                      className="lv-btn lv-btn--night"
                      label={t("account.profile.sendCode")}
                      done={t("account.profile.sent")}
                    />
                  </span>
                </details>
              </dd>
            </div>
            <div>
              <dt>{t("account.profile.verify")}</dt>
              <dd>
                <b className="lv-verified">
                  <BadgeCheck size={18} strokeWidth={1.75} aria-hidden="true" />
                  {t("account.profile.verifiedOn", { date: formatDate(sampleMember.verifiedOn, locale) })}
                </b>
                <span className="lv-small">{t("account.profile.verifyNote")}</span>
              </dd>
            </div>
          </dl>
        </section>

        <div className="lv-btnrow lv-btnrow--end">
          <DoneButton className="lv-btn lv-btn--night" label={t("language.save")} done={t("language.saved")} />
        </div>
      </form>
    </AccountShell>
  );
}
