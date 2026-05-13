const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface ListingDTO {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  condition: string;
  saleType: string;
  status: string;
  locationLabel: string;
  market: "US" | "MX";
  localeOrigin: string;
  translations?: Record<string, Record<string, string>>;
  images: { url: string; altEn?: string; altEs?: string }[];
  category: { id: string; nameEn: string; nameEs: string; isVehicle: boolean };
  seller: { id: string; displayName: string; ratingAvg: number; ratingCount: number };
  vehicle?: {
    make: string;
    model: string;
    year: number;
    trim?: string;
    vin: string;
    mileage: number;
    mileageUnit: "km" | "mi";
    transmission: string;
    fuelType: string;
    bodyStyle: string;
    drivetrain: string;
    titleStatus: string;
    accidentHistory: string;
    previousOwners?: number;
  };
}

export interface SearchResultDTO {
  hits: ListingDTO[];
  total: number;
  facets?: Record<string, { value: string; count: number }[]>;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${path} ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  listings: {
    list: (params: { market?: string; categoryId?: string; limit?: number } = {}) => {
      const qs = new URLSearchParams(Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
        if (v !== undefined) acc[k] = String(v);
        return acc;
      }, {}));
      return http<{ items: ListingDTO[] }>(`/v1/listings?${qs.toString()}`);
    },
    byId: (id: string) => http<ListingDTO>(`/v1/listings/${id}`),
  },
  search: (params: { q?: string; market?: string; categoryId?: string }) => {
    const qs = new URLSearchParams(Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
      if (v !== undefined) acc[k] = String(v);
      return acc;
    }, {}));
    return http<SearchResultDTO>(`/v1/search?${qs.toString()}`);
  },
};
