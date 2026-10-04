import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { connection } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/AccountShell";
import { CopyButton } from "@/components/CopyButton";
import { CouponTicket } from "@/components/CouponTicket";
import { daysLeft, todayInSeoul, walletOf, walletStatus } from "@/data/coupons";
import { getListing, pick } from "@/data/listings";
import {
  myReviews,
  pastStays,
  sampleBooking,
  sampleGuest,
  sampleMember,
  sampleToday,
  savedLists,
} from "@/data/samples";
import { Link } from "@/i18n/navigation";
import { nightsBetween, stayDay } from "@/lib/pricing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("home.title"), robots: { index: false } };
}

/** A coupon counts as ending soon in its last 60 days. */
const soonDays = 60;

/**
 * My page: who you are at MONTHLIV (with the member ID coupons are sent to), then the stay,
 * coupons, bookings, reviews and saved lists at a glance.
 */
export default async function AccountPage() {
  // Coupon days left depend on today's date, so this page renders per request.
  await connection();
  const locale = await getLocale();
  const t = await getTranslations();
  const today = todayInSeoul();
  const listing = getListing(sampleBooking.listingId);
  const nights = nightsBetween(sampleBooking.from, sampleBooking.to);

  const wallet = walletOf(sampleMember.id);
  const available = wallet.filter((coupon) => walletStatus(coupon, today) === "available");
  const soon = available
    .filter((coupon) => daysLeft(coupon.expires, today) <= soonDays)
    .sort((a, b) => a.expires.localeCompare(b.expires));
  const drops = savedLists.reduce((sum, list) => sum + Object.keys(list.drops ?? {}).length, 0);
  const toReview = pastStays.filter((stay) => stay.action === "review").length;

  const glance: {
    key: "now" | "coupons" | "trips" | "reviews" | "saved";
    href: string;
    value: string;
    meta: string;
  }[] = [
    {
      key: "now",
      href: `/my-stays/${sampleBooking.code}`,
      value: listing ? pick(listing.title, locale) : "",
      meta: t("stays.dayOf", { day: stayDay(sampleBooking.from, sampleToday), nights }),
    },
    {
      key: "coupons",
      href: "/account/coupons",
      value: t("account.home.couponsAvailable", { count: available.length }),
      meta: t("account.home.couponsSoon", { count: soon.length }),
    },
    {
      key: "trips",
      href: "/my-stays",
      value: t("account.home.tripsUpcoming", { count: 1 }),
      meta: t("account.home.tripsPast", { count: pastStays.length }),
    },
    {
      key: "reviews",
      href: "/account/reviews",
      value: t("account.home.reviewsToWrite", { count: toReview }),
      meta: t("account.home.reviewsWritten", { count: myReviews.length }),
    },
    {
      key: "saved",
      href: "/saved",
      value: t("account.home.savedLists", { count: savedLists.length }),
      meta: t("account.home.savedDrops", { count: drops }),
    },
  ];

  return (
    <AccountShell current="home">
      <div className="lv-editor__head">
        <h1 className="lv-editor__h1">{t("account.home.title")}</h1>
        <p className="lv-sub">{t("account.home.hello", { name: pick(sampleGuest.name, locale) })}</p>
      </div>

      <section className="lv-profilecard" aria-label={t("account.home.profile")}>
        <span className="lv-avatar lv-avatar--lg" aria-hidden="true">
          {pick(sampleGuest.name, locale)}
        </span>
        <div className="lv-profilecard__body">
          <b className="lv-profilecard__name">{pick(sampleGuest.fullName, locale)}</b>
          <span className="lv-small">
            {t("account.home.facts", { stays: sampleMember.stays, year: sampleMember.since })}
          </span>
          <span className="lv-profilecard__id">
            {t("account.home.memberId")} <code translate="no">{sampleMember.id}</code>
            <CopyButton
              className="lv-textbtn"
              value={sampleMember.id}
              label={t("account.home.copy")}
              done={t("account.home.copied")}
            />
          </span>
        </div>
        <Link className="lv-btn lv-btn--sm" href="/account/profile">
          {t("account.home.editProfile")}
        </Link>
      </section>
      <p className="lv-small lv-account__idnote">{t("account.home.idNote")}</p>

      <ul className="lv-glance" aria-label={t("account.home.glance")}>
        {glance.map(({ key, href, value, meta }) => (
          <li key={key}>
            <Link className="lv-glance__item" href={href}>
              <span className="lv-glance__label">{t(`account.home.glanceLabels.${key}`)}</span>
              <b>{value}</b>
              <span className="lv-small">{meta}</span>
              <ChevronRight className="lv-glance__go" size={18} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      {soon[0] && (
        <section className="lv-editcard" aria-labelledby="soon-title">
          <h2 id="soon-title" className="lv-editcard__title">
            {t("account.home.soonTitle")}
          </h2>
          <CouponTicket coupon={soon[0]} today={today}>
            <Link className="lv-link lv-self-start" href="/account/coupons">
              {t("account.home.allCoupons")}
            </Link>
          </CouponTicket>
        </section>
      )}

      <Link className="lv-hostcard lv-on-night" href="/host">
        <span className="lv-hostcard__text">
          <b>{t("account.home.hostTitle")}</b>
          <span>{t("account.home.hostText")}</span>
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element -- the brand's M, as drawn */}
        <img src="/brand/monthliv-mark-reverse.svg" alt="" width={44} height={34} />
      </Link>
    </AccountShell>
  );
}
