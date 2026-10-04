import type { Metadata } from "next";
import { Search, SendHorizontal } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/Header";
import { MobileTabBar } from "@/components/MobileTabBar";
import { MoonIcon } from "@/components/MoonIcon";
import { PhotoSlot } from "@/components/PhotoSlot";
import { getListing, pick, sampleHost } from "@/data/listings";
import { sampleBooking, sampleConversation, sampleToday, threads } from "@/data/samples";
import { Link } from "@/i18n/navigation";
import { formatRange, formatTime } from "@/lib/format";
import { languageName } from "@/lib/languages";
import { nightsBetween, stayDay, stayLengthFor } from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inbox");
  return { title: t("title") };
}

/**
 * Inbox, the open conversation and the booking it belongs to.
 * Messages in another language are shown translated, with the language they came from.
 */
export default async function MessagesPage() {
  const locale = await getLocale();
  const t = await getTranslations();
  const listing = getListing(sampleBooking.listingId);
  if (!listing) return null;

  const nights = nightsBetween(sampleBooking.from, sampleBooking.to);
  const range = formatRange(sampleBooking.from, sampleBooking.to, locale);
  const host = pick(sampleHost.name, locale);
  const cover = listing.real?.photos[0];

  return (
    <div className="lv-page lv-has-tabbar">
      <Header member current="messages" />

      <main className="lv-inbox">
        <section className="lv-inbox__list" aria-labelledby="inbox-title">
          <div className="lv-inbox__top">
            <h1 id="inbox-title" className="lv-inbox__h1">
              {t("inbox.title")}
            </h1>
            <label className="lv-inbox__search">
              <Search size={18} strokeWidth={1.75} aria-hidden="true" />
              <input type="search" aria-label={t("inbox.search")} placeholder={t("inbox.search")} />
            </label>
          </div>
          <ul>
            {threads.map((thread, index) => (
              <li key={thread.id}>
                <a className="lv-threadlink" href="#thread" aria-current={index === 0 ? "true" : undefined}>
                  {thread.icon === "brand" ? (
                    <span className="lv-avatar lv-avatar--brand" aria-hidden="true">
                      M
                    </span>
                  ) : (
                    <span
                      className={`lv-avatar${thread.role === "past" ? " lv-avatar--hanji" : ""}`}
                      aria-hidden="true"
                    >
                      {thread.initial ? pick(thread.initial, locale) : ""}
                    </span>
                  )}
                  <span className="lv-threadlink__body">
                    <span className="lv-threadlink__top">
                      <b>{pick(thread.who, locale)}</b>
                      <span className="lv-threadlink__time">
                        {pick(thread.time, locale)}
                        {thread.unread && (
                          <span className="lv-threadlink__dot" role="img" aria-label={t("tabs.unread")} />
                        )}
                      </span>
                    </span>
                    <span className="lv-threadlink__last">{pick(thread.last, locale)}</span>
                    <span className="lv-threadlink__ctx">{pick(thread.context, locale)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="lv-thread" id="thread" aria-labelledby="thread-title">
          <header className="lv-thread__head">
            <div>
              <h2 id="thread-title" className="lv-h4 lv-thread__name">
                {host}
              </h2>
              <p className="lv-small">{t("inbox.hostReplies")}</p>
            </div>
            <label className="lv-check">
              <input type="checkbox" defaultChecked />
              {t("inbox.autoTranslate")}
            </label>
          </header>

          <div className="lv-thread__body">
            <p className="lv-thread__day">{t("inbox.today")}</p>
            <p className="lv-thread__ctx">
              <MoonIcon length={stayLengthFor(nights)} size={18} />
              {t("inbox.stayDay", { dates: range, day: stayDay(sampleBooking.from, sampleToday), nights })}
            </p>
            {sampleConversation.map((message) => {
              const fromHost = message.from === "host";
              const translated = fromHost && locale !== message.original;
              return (
                <div key={message.time} className={`lv-msg lv-msg--${message.from}`}>
                  <p lang={translated || !fromHost ? locale : message.original}>{pick(message.text, locale)}</p>
                  <span className="lv-msg__meta">
                    {translated && `${t("inbox.translated", { language: languageName(message.original, locale) })} · `}
                    {formatTime(message.time, locale)}
                    {message.read ? ` · ${t("inbox.read")}` : ""}
                  </span>
                </div>
              );
            })}
          </div>

          <form className="lv-composer" action="#thread">
            <label className="lv-composer__field">
              <span>{t("inbox.translateNote")}</span>
              <textarea rows={2} placeholder={t("inbox.write")} />
            </label>
            <button className="lv-composer__send" type="submit" aria-label={t("inbox.send")}>
              <SendHorizontal size={22} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </form>
        </section>

        <aside className="lv-inbox__trip" aria-label={t("inbox.booking")}>
          <PhotoSlot
            tone={listing.tone}
            className="lv-inbox__photo"
            photo={cover && { listingId: listing.id, photo: cover }}
            sizes="300px"
            decorative
          />
          <div>
            <h2 className="lv-inbox__title">{pick(listing.title, locale)}</h2>
            <p className="lv-small">
              {range} · {t("price.nights", { nights })} · {t("search.guests", { count: sampleBooking.guests })}
            </p>
          </div>
          <Link className="lv-btn lv-btn--night lv-btn--sm" href={`/my-stays/${sampleBooking.code}`}>
            {t("inbox.viewBooking")}
          </Link>
          <Link className="lv-link lv-self-start" href={{ pathname: "/help", hash: "contact" }}>
            {t("inbox.report")}
          </Link>
        </aside>
      </main>

      <MobileTabBar active="messages" member />
    </div>
  );
}
