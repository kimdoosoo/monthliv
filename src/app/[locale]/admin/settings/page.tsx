import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/AdminShell";
import { DoneButton } from "@/components/DoneButton";
import { categories } from "@/data/listings";
import { defaultDiscounts, directFeePercent, guestFeePercent, otherFeePercent, splitFromNights } from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("settings.title"), robots: { index: false } };
}

const roles = ["owner", "operations", "support", "finance"] as const;
const permissions = ["reservations", "listings", "members", "coupons", "payouts", "settings"] as const;
const grants: Record<(typeof roles)[number], (typeof permissions)[number][]> = {
  owner: ["reservations", "listings", "members", "coupons", "payouts", "settings"],
  operations: ["reservations", "listings", "coupons"],
  support: ["reservations", "members"],
  finance: ["payouts"],
};

/**
 * Settings that shape the whole service: fees, default stay-length discounts, payment rules,
 * the sections in the header, and who on the team can do what. Changes are logged.
 */
export default async function AdminSettingsPage() {
  const t = await getTranslations();

  return (
    <AdminShell current="settings">
      <div className="lv-workhead">
        <div>
          <h1 className="lv-workhead__h1">{t("admin.settings.title")}</h1>
          <p className="lv-sub">{t("admin.settings.lead")}</p>
        </div>
      </div>

      <form className="lv-editor__form" action="#">
        <section className="lv-editcard" aria-labelledby="fees-title">
          <h2 id="fees-title" className="lv-editcard__title">
            {t("admin.settings.feesTitle")}
          </h2>
          <div className="lv-editcard__grid">
            <label className="lv-field">
              <span className="lv-field__label lv-field__label--plain">{t("admin.settings.serviceFee")}</span>
              <span className="lv-amount">
                <input inputMode="decimal" defaultValue={guestFeePercent} />
                <span aria-hidden="true">%</span>
              </span>
              <span className="lv-small">{t("admin.settings.serviceFeeNote")}</span>
            </label>
            <label className="lv-field">
              <span className="lv-field__label lv-field__label--plain">{t("admin.settings.hostFee")}</span>
              <span className="lv-amount">
                <input inputMode="decimal" defaultValue={directFeePercent} />
                <span aria-hidden="true">%</span>
              </span>
              <span className="lv-small">{t("admin.settings.hostFeeNote")}</span>
            </label>
            <label className="lv-field">
              <span className="lv-field__label lv-field__label--plain">{t("admin.settings.otherFee")}</span>
              <span className="lv-amount">
                <input inputMode="decimal" defaultValue={otherFeePercent} />
                <span aria-hidden="true">%</span>
              </span>
              <span className="lv-small">{t("admin.settings.otherFeeNote")}</span>
            </label>
          </div>
        </section>

        <section className="lv-editcard" aria-labelledby="stay-title">
          <h2 id="stay-title" className="lv-editcard__title">
            {t("admin.settings.stayTitle")}
          </h2>
          <div className="lv-editcard__grid">
            {(["week", "month", "season"] as const).map((key) => (
              <label key={key} className="lv-field">
                <span className="lv-field__label lv-field__label--plain">
                  {t("admin.settings.defaultDiscount", { length: t(`length.${key}`) })}
                </span>
                <span className="lv-amount">
                  <input inputMode="numeric" defaultValue={defaultDiscounts[key]} />
                  <span aria-hidden="true">%</span>
                </span>
              </label>
            ))}
            <label className="lv-field">
              <span className="lv-field__label lv-field__label--plain">{t("admin.settings.splitFrom")}</span>
              <span className="lv-amount">
                <input inputMode="numeric" defaultValue={splitFromNights} />
                <span aria-hidden="true">{t("admin.settings.nightsUnit")}</span>
              </span>
            </label>
            <label className="lv-field">
              <span className="lv-field__label lv-field__label--plain">{t("admin.settings.freeCancel")}</span>
              <span className="lv-amount">
                <input inputMode="numeric" defaultValue={7} />
                <span aria-hidden="true">{t("admin.settings.daysBefore")}</span>
              </span>
            </label>
          </div>
          <p className="lv-small">{t("admin.settings.stayNote")}</p>
        </section>

        <section className="lv-editcard" aria-labelledby="sections-title">
          <div>
            <h2 id="sections-title" className="lv-editcard__title">
              {t("admin.settings.sectionsTitle")}
            </h2>
            <p className="lv-editcard__sub">{t("admin.settings.sectionsLead")}</p>
          </div>
          <div className="lv-chips">
            {categories.map((key) => (
              <label key={key} className="lv-chip">
                <input type="checkbox" defaultChecked />
                {t(`nav.sections.${key}`)}
              </label>
            ))}
          </div>
        </section>

        <section className="lv-editcard" aria-labelledby="roles-title">
          <div>
            <h2 id="roles-title" className="lv-editcard__title">
              {t("admin.settings.rolesTitle")}
            </h2>
            <p className="lv-editcard__sub">{t("admin.settings.rolesLead")}</p>
          </div>
          <div className="lv-tablewrap">
            <table className="lv-checktable lv-checktable--roles">
              <thead>
                <tr>
                  <th scope="col">
                    <span className="lv-sr">{t("admin.settings.role")}</span>
                  </th>
                  {permissions.map((key) => (
                    <th key={key} scope="col">
                      {t(`admin.nav.${key}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role}>
                    <th scope="row">
                      <b>{t(`admin.settings.roles.${role}`)}</b>
                    </th>
                    {permissions.map((key) => (
                      <td key={key}>
                        <input
                          type="checkbox"
                          defaultChecked={grants[role].includes(key)}
                          disabled={role === "owner"}
                          aria-label={`${t(`admin.settings.roles.${role}`)} · ${t(`admin.nav.${key}`)}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="lv-small">{t("admin.settings.securityNote")}</p>
        </section>

        <div className="lv-btnrow lv-btnrow--end">
          <DoneButton className="lv-btn lv-btn--night" label={t("language.save")} done={t("language.saved")} />
        </div>
      </form>
    </AdminShell>
  );
}
