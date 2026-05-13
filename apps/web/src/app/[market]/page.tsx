import { setRequestLocale, getTranslations } from "next-intl/server";
import { SearchBar } from "@/components/SearchBar";
import { ListingCard } from "@/components/ListingCard";
import { api } from "@/lib/api";
import type { Market } from "@/i18n/config";

export default async function HomePage({ params }: { params: Promise<{ market: string }> }) {
  const { market } = await params;
  setRequestLocale(market);
  const t = await getTranslations("site");
  const tCommon = await getTranslations("common");

  let items: Awaited<ReturnType<typeof api.listings.list>>["items"] = [];
  try {
    const res = await api.listings.list({ market: market === "mx" ? "MX" : "US", limit: 12 });
    items = res.items;
  } catch {
    // API may not be running yet; render the empty state.
  }

  return (
    <div className="space-y-10">
      <section className="rounded-xl bg-brand/10 p-8 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("name")}</h1>
        <p className="mt-2 text-lg text-slate-700">{t("tagline")}</p>
        <div className="mx-auto mt-6 max-w-2xl">
          <SearchBar market={market as Market} />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">{tCommon("viewAll")}</h2>
        </div>
        {items.length === 0 ? (
          <p className="rounded border border-dashed p-6 text-center text-sm text-slate-500">
            No listings yet. Start the API and run `pnpm db:seed`.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((l) => (
              <ListingCard key={l.id} listing={l} market={market as Market} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
