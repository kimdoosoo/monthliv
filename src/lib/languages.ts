import type { Locale } from "@/i18n/routing";

/** Each language written in itself, as shown in the language picker. */
export const nativeNames: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  vi: "Tiếng Việt",
  th: "ภาษาไทย",
  id: "Bahasa Indonesia",
  ru: "Русский",
};

const displayCode: Record<Locale, string> = {
  ko: "ko",
  en: "en",
  ja: "ja",
  "zh-CN": "zh-Hans",
  "zh-TW": "zh-Hant",
  de: "de",
  fr: "fr",
  es: "es",
  vi: "vi",
  th: "th",
  id: "id",
  ru: "ru",
};

/** The name of `language` in the reader's language, e.g. "일본어" for ja when reading in Korean. */
export function languageName(language: Locale | string, inLocale: string): string {
  const code = displayCode[language as Locale] ?? language;
  try {
    const name = new Intl.DisplayNames([displayCode[inLocale as Locale] ?? inLocale], {
      type: "language",
    }).of(code);
    return name ?? String(language);
  } catch {
    return String(language);
  }
}
