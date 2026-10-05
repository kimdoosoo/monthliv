import * as rootParams from "next/root-params";
import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

type Messages = { [key: string]: string | Messages };

function merge(base: Messages, own: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(own)) {
    const current = out[key];
    out[key] =
      typeof value === "object" && typeof current === "object"
        ? merge(current, value)
        : value;
  }
  return out;
}

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const paramValue = await rootParams.locale();
    if (hasLocale(routing.locales, paramValue)) {
      locale = paramValue;
    } else {
      notFound();
    }
  }

  // English fills keys a language has not translated yet.
  const english = (await import("../../messages/en.json")).default as Messages;
  const own = (await import(`../../messages/${locale}.json`)).default as Messages;

  return {
    locale,
    messages: merge(english, own),
  };
});
