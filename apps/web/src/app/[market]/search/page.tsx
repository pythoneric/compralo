import { setRequestLocale, getTranslations } from "next-intl/server";
import { SearchBar } from "@/components/SearchBar";
import { ListingCard } from "@/components/ListingCard";
import { api } from "@/lib/api";
import type { Market } from "@/i18n/config";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ market: string }>;
  searchParams: Promise<{ q?: string; categoryId?: string }>;
}) {
  const { market } = await params;
  const { q, categoryId } = await searchParams;
  setRequestLocale(market);
  const t = await getTranslations("search");

  let results: Awaited<ReturnType<typeof api.search>> = { hits: [], total: 0 };
  try {
    results = await api.search({ q, categoryId, market: market === "mx" ? "MX" : "US" });
  } catch {
    // API may be down; fall through to empty state.
  }

  return (
    <div className="space-y-6">
      <SearchBar market={market as Market} />
      <p className="text-sm text-slate-600">{t("resultsCount", { count: results.total })}</p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold">{t("filters.title")}</h3>
          <FacetGroup label={t("filters.condition")} />
          <FacetGroup label={t("filters.price")} />
          <FacetGroup label={t("filters.make")} />
          <FacetGroup label={t("filters.yearRange")} />
        </aside>

        {results.hits.length === 0 ? (
          <p className="rounded border border-dashed p-6 text-center text-sm text-slate-500">
            No results. Try a different query.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {results.hits.map((l) => (
              <ListingCard key={l.id} listing={l} market={market as Market} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FacetGroup({ label }: { label: string }) {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</h4>
      <p className="mt-1 text-xs text-slate-400">— wiring to /v1/search facets pending</p>
    </div>
  );
}
