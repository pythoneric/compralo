import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MARKETS, MARKET_TO_LOCALE, type Market } from "@/i18n/config";
import { Nav } from "@/components/Nav";

export function generateStaticParams() {
  return MARKETS.map((m) => ({ market: m }));
}

export default async function MarketLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ market: string }>;
}) {
  const { market } = await params;
  if (!MARKETS.includes(market as Market)) notFound();
  const locale = MARKET_TO_LOCALE[market as Market];
  setRequestLocale(market);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Nav market={market as Market} />
          <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
          <footer className="mt-12 border-t py-6 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Compralo
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
