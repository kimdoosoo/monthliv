import type { Metadata } from "next";
import { BadgeCheck, Search } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/AdminShell";
import { DoneButton } from "@/components/DoneButton";
import { allReservations, maskName, members, type MemberRole } from "@/data/admin";
import { getPathname, Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("members.title"), robots: { index: false } };
}

const roles: ("all" | MemberRole)[] = ["all", "guest", "host", "both"];

/**
 * Members, with names masked and no contact details in the list. Search by member ID (?q=);
 * send a coupon or suspend from the row.
 */
export default async function AdminMembersPage({ searchParams }: PageProps<"/[locale]/admin/members">) {
  const locale = await getLocale();
  const t = await getTranslations();
  const params = await searchParams;
  const role = roles.includes(params.role as MemberRole) ? (params.role as MemberRole) : "all";
  const query = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const filtered = members.filter((member) => !query || member.id.includes(query));
  const shown = role === "all" ? filtered : filtered.filter((member) => member.role === role);
  const bookings = (id: string) => allReservations.filter((item) => item.guestId === id && item.status !== "cancelled").length;

  return (
    <AdminShell current="members">
      <div className="lv-workhead">
        <div>
          <h1 className="lv-workhead__h1">{t("admin.members.title")}</h1>
          <p className="lv-sub">{t("admin.members.lead", { count: members.length })}</p>
        </div>
        <form className="lv-searchbox" role="search" action={getPathname({ href: "/admin/members", locale })}>
          <Search size={18} strokeWidth={1.75} aria-hidden="true" />
          <input name="q" type="search" defaultValue={query} placeholder={t("admin.members.search")} aria-label={t("admin.members.search")} />
        </form>
      </div>

      <nav className="lv-tabs" aria-label={t("admin.members.roles")}>
        {roles.map((key) => (
          <Link
            key={key}
            className="lv-tabs__tab"
            href={{ pathname: "/admin/members", query: { ...(key === "all" ? {} : { role: key }), ...(query ? { q: query } : {}) } }}
            aria-current={key === role ? "page" : undefined}
            scroll={false}
          >
            {t(`admin.members.role.${key}`)}{" "}
            <span className="lv-tabs__count">
              {key === "all" ? filtered.length : filtered.filter((member) => member.role === key).length}
            </span>
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <p className="lv-note">{t("admin.noResults")}</p>
      ) : (
        <div className="lv-tablewrap">
          <table className="lv-table">
            <thead>
              <tr>
                <th scope="col">{t("admin.cols.memberId")}</th>
                <th scope="col">{t("admin.cols.name")}</th>
                <th scope="col">{t("admin.cols.role")}</th>
                <th scope="col">{t("admin.cols.joined")}</th>
                <th scope="col">{t("admin.cols.verified")}</th>
                <th scope="col" className="lv-table__num">
                  {t("admin.cols.bookings")}
                </th>
                <th scope="col">{t("admin.cols.marketing")}</th>
                <th scope="col">{t("pms.cols.status")}</th>
                <th scope="col">
                  <span className="lv-sr">{t("admin.cols.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((member) => (
                <tr key={member.id}>
                  <th scope="row" translate="no">
                    {member.id}
                  </th>
                  <td translate="no">{maskName(member.name)}</td>
                  <td>{t(`admin.members.role.${member.role}`)}</td>
                  <td className="lv-table__nowrap">{formatDate(member.joined, locale)}</td>
                  <td>
                    {member.verified ? (
                      <span className="lv-verified">
                        <BadgeCheck size={16} strokeWidth={1.75} aria-hidden="true" />
                        {t("admin.members.done")}
                      </span>
                    ) : (
                      <span className="lv-small">{t("admin.members.notYet")}</span>
                    )}
                  </td>
                  <td className="lv-table__num">{bookings(member.id)}</td>
                  <td>{member.marketing ? t("admin.members.agreed") : t("admin.members.no")}</td>
                  <td>
                    <span className={`lv-badge lv-badge--sm${member.status === "active" ? "" : " lv-badge--danger"}`}>
                      {t(`admin.members.status.${member.status}`)}
                    </span>
                  </td>
                  <td>
                    <span className="lv-btnrow lv-btnrow--tight">
                      {member.status === "active" && member.role !== "host" && (
                        <Link className="lv-btn lv-btn--xs" href={{ pathname: "/admin/coupons", query: { to: member.id }, hash: "new" }}>
                          {t("admin.members.sendCoupon")}
                        </Link>
                      )}
                      <DoneButton
                        className="lv-btn lv-btn--xs"
                        label={member.status === "active" ? t("admin.members.suspend") : t("admin.members.restore")}
                        done={t("admin.done")}
                      />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="lv-small">{t("admin.members.privacy")}</p>
    </AdminShell>
  );
}
