import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { VehicleSpecs } from "@/components/VehicleSpecs";
import type { Market } from "@/i18n/config";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ market: string; id: string }>;
}) {
  const { market, id } = await params;
  setRequestLocale(market);
  const t = await getTranslations("listing");

  let listing: Awaited<ReturnType<typeof api.listings.byId>>;
  try {
    listing = await api.listings.byId(id);
  } catch {
    notFound();
  }

  const title =
    market === "en" && listing.localeOrigin !== "en" && listing.translations?.title?.en
      ? listing.translations.title.en
      : listing.title;
  const desc =
    market === "en" && listing.localeOrigin !== "en" && listing.translations?.description?.en
      ? listing.translations.description.en
      : listing.description;

  return (
    <article className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <Gallery images={listing.images} alt={title} />
        <h1 className="mt-4 text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{listing.locationLabel}</p>
        <p className="mt-4 whitespace-pre-line text-slate-800">{desc}</p>
        {listing.vehicle ? <VehicleSpecs vehicle={listing.vehicle} market={market as Market} /> : null}
      </div>

      <aside className="space-y-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-3xl font-bold">{formatMoney(listing.priceCents, listing.currency, market as Market)}</p>
          <div className="mt-4 flex flex-col gap-2">
            {listing.vehicle ? (
              <button className="rounded-lg bg-brand px-4 py-2 font-medium text-white">{t("scheduleTestDrive")}</button>
            ) : (
              <button className="rounded-lg bg-brand px-4 py-2 font-medium text-white">{t("buyNow")}</button>
            )}
            <button className="rounded-lg border px-4 py-2 font-medium">{t("makeOffer")}</button>
            <button className="rounded-lg border px-4 py-2">{t("messageSeller")}</button>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm font-medium">{listing.seller.displayName}</p>
          <p className="text-xs text-slate-500">
            ★ {listing.seller.ratingAvg.toFixed(1)} ({listing.seller.ratingCount})
          </p>
        </div>
      </aside>
    </article>
  );
}

function Gallery({ images, alt }: { images: { url: string; altEn?: string; altEs?: string }[]; alt: string }) {
  const [hero, ...rest] = images;
  if (!hero) {
    return <div className="aspect-[4/3] rounded-lg bg-slate-100" />;
  }
  return (
    <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
      <img src={hero.url} alt={alt} className="aspect-[4/3] w-full rounded-lg object-cover" />
      <div className="grid grid-rows-2 gap-2">
        {rest.slice(0, 2).map((img, i) => (
          <img key={i} src={img.url} alt={alt} className="h-full w-full rounded-lg object-cover" />
        ))}
      </div>
    </div>
  );
}
