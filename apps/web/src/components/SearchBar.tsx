"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Market } from "@/i18n/config";

export function SearchBar({ market }: { market: Market }) {
  const t = useTranslations("search");
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const qs = new URLSearchParams({ q });
        router.push(`/${market}/search?${qs.toString()}`);
      }}
      className="flex w-full gap-2"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("placeholder")}
        className="flex-1 rounded-lg border px-4 py-3 text-base shadow-sm focus:border-brand focus:outline-none"
      />
      <button type="submit" className="rounded-lg bg-brand px-5 py-3 font-medium text-white">
        {t("submit")}
      </button>
    </form>
  );
}
