import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { MARKETS, MARKET_TO_LOCALE, type Market } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  if (!requested || !MARKETS.includes(requested as Market)) notFound();
  const market = requested as Market;
  const locale = MARKET_TO_LOCALE[market];
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
