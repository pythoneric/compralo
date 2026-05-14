import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { MARKETS, type Market } from "@/i18n/config";
import { getSessionToken } from "@/lib/session";
import { SignInForm } from "./SignInForm";

export const dynamic = "force-dynamic"; // sign-in must never be statically cached

export async function generateMetadata({ params }: { params: Promise<{ market: string }> }) {
  const { market } = await params;
  if (!MARKETS.includes(market as Market)) return {};
  const t = await getTranslations({ locale: market, namespace: "signIn" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ market: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { market } = await params;
  if (!MARKETS.includes(market as Market)) redirect("/en/sign-in");
  setRequestLocale(market);

  // Already authenticated: bounce straight to the destination.
  if (await getSessionToken()) {
    redirect(`/${market}/dashboard`);
  }

  const { next } = await searchParams;
  const t = await getTranslations("signIn");

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-1 text-2xl font-semibold">{t("title")}</h1>
      <p className="mb-6 text-sm text-slate-600">{t("subtitle")}</p>
      <SignInForm market={market as Market} next={next} />
    </div>
  );
}
