import createMiddleware from "next-intl/middleware";
import { MARKETS, DEFAULT_MARKET } from "./i18n/config";

export default createMiddleware({
  locales: MARKETS as unknown as string[],
  defaultLocale: DEFAULT_MARKET,
  localePrefix: "always",
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
