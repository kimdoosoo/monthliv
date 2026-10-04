// Free fonts only (SIL Open Font License), served from the site: Pretendard for text,
// Noto Serif KR and Libre Caslon Text for headings, Jost for labels and the slogan.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
// Noto Serif KR comes in ~120 unicode-range slices; a page loads only the slices its headings use.
import "@fontsource/noto-serif-kr/600.css";
import "@fontsource/libre-caslon-text/latin-400.css";
import "@fontsource/libre-caslon-text/latin-700.css";
import "@fontsource/jost/latin-500.css";
import "../globals.css";
import "../pages.css";

import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Message namespaces that client components read. Everything else is rendered on the server,
 * so it stays out of the page (the host centre and admin copy alone is tens of kilobytes).
 */
const clientNamespaces = ["map", "search", "results", "price", "pricing", "length"] as const;
// Keep search engines out until launch: the first build shows sample places.
const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fbf6f1",
};

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale: requested } = await params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(siteUrl),
    title: { default: t("title"), template: `%s · ${t("brand")}` },
    description: t("description"),
    applicationName: t("brand"),
    appleWebApp: { title: t("brand"), statusBarStyle: "default" },
    formatDetection: { telephone: false },
    robots: allowIndexing ? undefined : { index: false, follow: false },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "preview" });
  const messages = await getMessages();
  const clientMessages = Object.fromEntries(clientNamespaces.map((key) => [key, messages[key]]));

  return (
    <html lang={locale}>
      <body>
        {/* Until launch the site shows sample places, so say so on every page. */}
        {!allowIndexing && (
          <p className="lv-preview" role="note">
            {t("notice")}
          </p>
        )}
        <NextIntlClientProvider messages={clientMessages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
