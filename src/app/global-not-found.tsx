import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "@fontsource/noto-serif-kr/600.css";
import "@fontsource/libre-caslon-text/latin-400.css";
import "@fontsource/jost/latin-500.css";
import "./globals.css";
import "./pages.css";

import type { Metadata } from "next";
import { Wordmark } from "@/components/Logo";

// Shown for addresses outside the language folders, e.g. a mistyped file name.
// It can't know the visitor's language, so it speaks Korean and English.
export const metadata: Metadata = {
  title: "먼슬리브 · 페이지를 찾을 수 없어요 · Page not found",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="ko">
      <body>
        <div className="lv-page">
          <header className="lv-header">
            <div className="lv-wrap lv-header__in">
              <Wordmark className="lv-logo" />
            </div>
          </header>
          <main className="lv-wrap">
            <div className="lv-empty">
              <h1 className="lv-h1">찾는 페이지가 없어요</h1>
              <p className="lv-sub" lang="en">
                We can&apos;t find that page.
              </p>
              {/* A plain link: this page sits outside the language folders. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a className="lv-btn lv-btn--night" href="/">
                먼슬리브 홈 · MONTHLIV home
              </a>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
