import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Sends "/" and any path without a language to the visitor's language
// (browser setting, then the last language they picked), e.g. "/" -> "/ko".
const proxy = createMiddleware(routing);

export default proxy;

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
