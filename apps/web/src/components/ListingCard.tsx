import Link from "next/link";
import type { Market } from "@/i18n/config";
import { formatMoney, formatMileage } from "@/lib/format";
import type { ListingDTO } from "@/lib/api";
import { useTranslations } from "next-intl";

export function ListingCard({ listing, market }: { listing: ListingDTO; market: Market }) {
  const t = useTranslations("condition");
  const title =
    market === "en" && listing.localeOrigin !== "en" && listing.translations?.title?.en
      ? listing.translations.title.en
      : listing.title;
  const img = listing.images[0]?.url;
  return (
    <Link
      href={`/${market}/l/${listing.id}`}
      className="group block overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-[4/3] bg-slate-100">
        {img ? (
          <img src={img} alt={listing.images[0]?.altEn ?? title} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-medium">{title}</h3>
          <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {t(listing.condition as never)}
          </span>
        </div>
        <p className="mt-1 text-lg font-semibold">{formatMoney(listing.priceCents, listing.currency, market)}</p>
        {listing.vehicle ? (
          <p className="mt-0.5 text-xs text-slate-500">
            {listing.vehicle.year} · {formatMileage(listing.vehicle.mileage, listing.vehicle.mileageUnit, market)}
          </p>
        ) : null}
        <p className="mt-0.5 text-xs text-slate-500">{listing.locationLabel}</p>
      </div>
    </Link>
  );
}
