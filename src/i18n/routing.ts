import { defineRouting } from "next-intl/routing";

/**
 * Languages offered in the language picker.
 * ko is the reference language; en fills any key a locale has not translated yet.
 */
export const locales = [
  "ko",
  "en",
  "ja",
  "zh-CN",
  "zh-TW",
  "de",
  "fr",
  "es",
  "vi",
  "th",
  "id",
  "ru",
] as const;

export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "ko",
});
