import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/AdminShell";
import { DoneButton } from "@/components/DoneButton";
import { HashDetails } from "@/components/HashDetails";
import { tickets } from "@/data/admin";
import { pick } from "@/data/listings";
import { formatDayWeekday, formatTime } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("support.title"), robots: { index: false } };
}

const order = { urgent: 0, normal: 1 } as const;
const statusOrder = { open: 0, waiting: 1, done: 2 } as const;

/** Questions and reports: urgent first, then by status; each opens in place with a reply box. */
export default async function AdminSupportPage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const sorted = [...tickets].sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status] || order[a.priority] - order[b.priority],
  );

  return (
    <AdminShell current="support">
      <div className="lv-workhead">
        <div>
          <h1 className="lv-workhead__h1">{t("admin.support.title")}</h1>
          <p className="lv-sub">{t("admin.support.lead")}</p>
        </div>
      </div>

      <ul className="lv-tickets-list">
        {sorted.map((ticket) => (
          <li key={ticket.id}>
            <details className="lv-ticketrow" id={ticket.id} open={ticket.priority === "urgent" && ticket.status !== "done"}>
              <summary>
                <span className={`lv-badge lv-badge--sm${ticket.priority === "urgent" ? " lv-badge--danger" : ""}`}>
                  {t(`admin.support.priority.${ticket.priority}`)}
                </span>
                <span className="lv-ticketrow__main">
                  <b>{t(`admin.support.topics.${ticket.topic}`)}</b>
                  <span className="lv-small">
                    {ticket.id} · <span translate="no">{ticket.memberId}</span>
                    {ticket.booking ? ` · ${ticket.booking}` : ""} · {formatDayWeekday(ticket.opened.slice(0, 10), locale)}{" "}
                    {formatTime(ticket.opened.slice(11, 16), locale)}
                  </span>
                </span>
                <span className={`lv-badge lv-badge--sm${ticket.status === "done" ? " lv-badge--celadon" : ticket.status === "open" ? " lv-badge--moon" : ""}`}>
                  {t(`admin.support.status.${ticket.status}`)}
                </span>
              </summary>
              <div className="lv-ticketrow__body">
                <blockquote className="lv-request__note">
                  <p>{pick(ticket.message, locale)}</p>
                </blockquote>
                {ticket.status !== "done" && (
                  <form className="lv-ticketrow__reply" action="#">
                    <label className="lv-field">
                      <span className="lv-field__label lv-field__label--plain">{t("admin.support.reply")}</span>
                      <textarea className="lv-textarea" rows={3} placeholder={t("admin.support.replyPlaceholder")} />
                      <span className="lv-small">{t("admin.support.translateNote")}</span>
                    </label>
                    <div className="lv-btnrow">
                      <DoneButton className="lv-btn lv-btn--night lv-btn--sm" label={t("admin.support.send")} done={t("admin.support.sent")} />
                      <DoneButton className="lv-btn lv-btn--sm" label={t("admin.support.close")} done={t("admin.done")} />
                      {ticket.topic === "access" && (
                        <DoneButton className="lv-btn lv-btn--sm" label={t("admin.support.callHost")} done={t("admin.support.called")} />
                      )}
                    </div>
                  </form>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>
      <HashDetails />
    </AdminShell>
  );
}
