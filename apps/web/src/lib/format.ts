import { MARKET_TO_LOCALE, MARKET_TO_DISTANCE, type Market } from "@/i18n/config";

export function formatMoney(cents: number | bigint, currency: string, market: Market): string {
  const value = Number(cents) / 100;
  return new Intl.NumberFormat(MARKET_TO_LOCALE[market], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMileage(value: number, unit: "km" | "mi", market: Market): string {
  const displayUnit = MARKET_TO_DISTANCE[market];
  const converted =
    unit === displayUnit
      ? value
      : displayUnit === "mi"
        ? Math.round(value * 0.621371)
        : Math.round(value / 0.621371);
  return `${new Intl.NumberFormat(MARKET_TO_LOCALE[market]).format(converted)} ${displayUnit}`;
}

export function formatDate(date: Date | string, market: Market): string {
  return new Intl.DateTimeFormat(MARKET_TO_LOCALE[market], {
    dateStyle: "medium",
  }).format(typeof date === "string" ? new Date(date) : date);
}
