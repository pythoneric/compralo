import { setRequestLocale, getTranslations } from "next-intl/server";

export default async function SellPage({ params }: { params: Promise<{ market: string }> }) {
  const { market } = await params;
  setRequestLocale(market);
  const t = await getTranslations("sell");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">{t("vinPrompt")}</p>
        <form className="mt-4 flex gap-2">
          <input
            placeholder="VIN"
            className="flex-1 rounded border px-3 py-2 font-mono uppercase tracking-wider"
            maxLength={17}
          />
          <button type="submit" className="rounded bg-brand px-4 py-2 text-white">
            {t("next")}
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-400">
          Wiring to <code>POST /v1/vehicles/decode-vin</code> pending.
        </p>
      </div>
    </div>
  );
}
