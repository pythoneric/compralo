import { setRequestLocale, getTranslations } from "next-intl/server";

export default async function DashboardPage({ params }: { params: Promise<{ market: string }> }) {
  const { market } = await params;
  setRequestLocale(market);
  const t = await getTranslations("dashboard");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card title={t("listings")} placeholder="GET /v1/sellers/me/listings" />
        <Card title={t("messages")} placeholder="GET /v1/threads" />
        <Card title={t("payouts")} placeholder="GET /v1/sellers/me/payouts" />
      </div>
    </div>
  );
}

function Card({ title, placeholder }: { title: string; placeholder: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-xs text-slate-400">{placeholder}</p>
    </div>
  );
}
