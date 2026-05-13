import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Market } from "@/i18n/config";

export function Nav({ market }: { market: Market }) {
  const t = useTranslations("nav");
  const tSite = useTranslations("site");

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href={`/${market}`} className="text-xl font-semibold text-brand">
          {tSite("name")}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href={`/${market}/search`}>{t("search")}</Link>
          <Link href={`/${market}/sell`} className="font-medium text-brand">
            {t("sell")}
          </Link>
          <Link href={`/${market}/dashboard`}>{t("dashboard")}</Link>
          <Link href={`/${market}/sign-in`}>{t("signIn")}</Link>
          <MarketSwitcher current={market} />
        </nav>
      </div>
    </header>
  );
}

function MarketSwitcher({ current }: { current: Market }) {
  const other = current === "en" ? "mx" : "en";
  return (
    <Link
      href={`/${other}`}
      className="ml-2 rounded border px-2 py-1 text-xs uppercase"
      aria-label={`Switch market to ${other}`}
    >
      {other}
    </Link>
  );
}
