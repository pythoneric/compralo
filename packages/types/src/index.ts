export type Market = "US" | "MX";
export type Locale = "en" | "es-MX";

export const MARKETS: readonly Market[] = ["US", "MX"] as const;
export const LOCALES: readonly Locale[] = ["en", "es-MX"] as const;

export const MARKET_DEFAULTS: Record<Market, { locale: Locale; currency: string; distanceUnit: "mi" | "km" }> = {
  US: { locale: "en", currency: "USD", distanceUnit: "mi" },
  MX: { locale: "es-MX", currency: "MXN", distanceUnit: "km" },
};

export interface Money {
  cents: number;
  currency: string;
}

export interface SearchFilters {
  q?: string;
  categoryId?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  condition?: string[];
  market?: Market;
  // vehicle-specific
  make?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  maxMileage?: number;
}

export interface ListingSummary {
  id: string;
  title: string;
  priceCents: number;
  currency: string;
  condition: string;
  locationLabel: string;
  imageUrl?: string;
  isVehicle: boolean;
  vehicle?: {
    year: number;
    make: string;
    model: string;
    mileage: number;
    mileageUnit: "km" | "mi";
  };
}
