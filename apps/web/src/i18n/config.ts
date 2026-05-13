// Market-coded routing: `/en/...` (US, English) and `/mx/...` (Mexico, es-MX).
// Path segments carry the *market*, not the language — that lets us add
// es-CO or es-AR later without ambiguity.

export type Market = "en" | "mx";

export const MARKETS: readonly Market[] = ["en", "mx"] as const;
export const DEFAULT_MARKET: Market = "en";

export const MARKET_TO_LOCALE: Record<Market, string> = {
  en: "en",
  mx: "es-MX",
};

export const MARKET_TO_CURRENCY: Record<Market, string> = {
  en: "USD",
  mx: "MXN",
};

export const MARKET_TO_COUNTRY: Record<Market, string> = {
  en: "US",
  mx: "MX",
};

export const MARKET_TO_DISTANCE: Record<Market, "mi" | "km"> = {
  en: "mi",
  mx: "km",
};
