import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/AccountShell";
import { CouponTicket } from "@/components/CouponTicket";
import {
  findCouponByCode,
  todayInSeoul,
  usedByGuest,
  walletOf,
  walletStatus,
  type Coupon,
  type WalletStatus,
} from "@/data/coupons";
import { pick } from "@/data/listings";
import { sampleMember } from "@/data/samples";
import { getPathname, Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("coupons.title"), robots: { index: false } };
}

const tabs: WalletStatus[] = ["available", "used", "expired"];

/** Where to look for places a coupon works on. */
function findHref(coupon: Coupon) {
  return coupon.minNights && coupon.minNights >= 28
    ? { pathname: "/search", query: { category: "month" } }
    : { pathname: "/search" };
}

/**
 * The coupon wallet: coupons sent to this member ID, by what can still be used. A code typed
 * here (?code=) is checked on the server; code coupons are then used by typing the code at
 * checkout, wallet coupons are already here.
 */
export default async function CouponsPage({ searchParams }: PageProps<"/[locale]/account/coupons">) {
  const locale = await getLocale();
  const t = await getTranslations();
  const params = await searchParams;
  const tab = tabs.includes(params.tab as WalletStatus) ? (params.tab as WalletStatus) : "available";
  const typed = typeof params.code === "string" ? params.code.trim() : "";
  const today = todayInSeoul();

  const wallet = walletOf(sampleMember.id);
  const byStatus = (status: WalletStatus) => wallet.filter((coupon) => walletStatus(coupon, today) === status);
  const shown = byStatus(tab);

  let notice: { tone: "ok" | "error"; text: string } | null = null;
  if (typed) {
    const found = findCouponByCode(typed);
    if (!found) notice = { tone: "error", text: t("coupon.errors.notFound") };
    else if (found.expires < today) notice = { tone: "error", text: t("coupon.errors.expired") };
    else if (found.audience === "users" && !found.sentTo?.includes(sampleMember.id)) {
      notice = { tone: "error", text: t("coupon.errors.notYours") };
    } else if (found.audience === "users") notice = { tone: "ok", text: t("account.coupons.inWallet") };
    else if (found.limit !== undefined && found.used >= found.limit) {
      notice = { tone: "error", text: t("coupon.errors.soldOut") };
    } else {
      notice = {
        tone: "ok",
        text: t("account.coupons.codeOk", { code: found.code, title: pick(found.title, locale) }),
      };
    }
  }

  return (
    <AccountShell current="coupons">
      <div className="lv-editor__head">
        <h1 className="lv-editor__h1">{t("account.coupons.title")}</h1>
        <p className="lv-sub">{t("account.coupons.lead")}</p>
      </div>

      <section className="lv-editcard" aria-labelledby="code-title">
        <h2 id="code-title" className="lv-editcard__title">
          {t("account.coupons.codeTitle")}
        </h2>
        <form className="lv-inlineform" action={getPathname({ href: "/account/coupons", locale })} method="get">
          <label className="lv-field lv-inlineform__field">
            <span className="lv-sr">{t("coupon.codeLabel")}</span>
            <input
              className="lv-input lv-input--code"
              name="code"
              defaultValue={typed}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder={t("coupon.codePlaceholder")}
            />
          </label>
          <button className="lv-btn lv-btn--night" type="submit">
            {t("account.coupons.check")}
          </button>
        </form>
        {notice && (
          <p className={`lv-note ${notice.tone === "ok" ? "lv-note--celadon" : "lv-note--danger"}`} role="status">
            {notice.text}
          </p>
        )}
      </section>

      <nav className="lv-tabs" aria-label={t("account.coupons.tabsLabel")}>
        {tabs.map((status) => (
          <Link
            key={status}
            className="lv-tabs__tab"
            href={{ pathname: "/account/coupons", query: status === "available" ? {} : { tab: status } }}
            aria-current={status === tab ? "page" : undefined}
            scroll={false}
          >
            {t(`account.coupons.tabs.${status}`)} <span className="lv-tabs__count">{byStatus(status).length}</span>
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <p className="lv-note">{t(`account.coupons.empty.${tab}`)}</p>
      ) : (
        <ul className="lv-tickets">
          {shown.map((coupon) => (
            <li key={coupon.id}>
              <CouponTicket coupon={coupon} status={tab} today={today}>
                {tab === "available" && (
                  <Link className="lv-link lv-self-start" href={findHref(coupon)}>
                    {t("account.coupons.find")}
                  </Link>
                )}
                {tab === "used" && usedByGuest[coupon.id] && (
                  <span className="lv-small">{t("account.coupons.usedOn", { code: usedByGuest[coupon.id] })}</span>
                )}
              </CouponTicket>
            </li>
          ))}
        </ul>
      )}

      <p className="lv-small">
        {t("account.coupons.note")}
      </p>
    </AccountShell>
  );
}
