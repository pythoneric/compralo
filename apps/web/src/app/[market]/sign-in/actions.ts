"use server";

import { redirect } from "next/navigation";
import { setSessionCookie } from "@/lib/session";
import { MARKETS, type Market } from "@/i18n/config";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// RFC 5321 caps the local-part at 64 and the domain at 255; 254 is the practical envelope max.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL = 254;
const MAX_PASSWORD = 256;

export type SignInState = { error?: "invalid" | "rate_limited" | "unknown" };

// Only allow same-origin relative paths inside the current market segment as a post-login
// destination — defends against `?next=//evil.example` open-redirects.
function safeNext(market: Market, next: string | null): string {
  const fallback = `/${market}/dashboard`;
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  if (!next.startsWith(`/${market}/`) && next !== `/${market}`) return fallback;
  return next;
}

function isMarket(value: unknown): value is Market {
  return typeof value === "string" && (MARKETS as readonly string[]).includes(value);
}

export async function signInAction(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const hp = String(formData.get("hp") ?? "");
  const marketRaw = formData.get("market");
  const next = formData.get("next");

  // Honeypot trip or any input shape error -> generic invalid response.
  // Don't differentiate: bots probing validation rules learn nothing this way.
  if (hp !== "") return { error: "invalid" };
  if (!isMarket(marketRaw)) return { error: "invalid" };
  if (email.length === 0 || email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
    return { error: "invalid" };
  }
  if (password.length === 0 || password.length > MAX_PASSWORD) {
    return { error: "invalid" };
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/v1/auth/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return { error: "unknown" };
  }

  if (res.status === 429) return { error: "rate_limited" };
  if (res.status === 401 || res.status === 400) return { error: "invalid" };
  if (!res.ok) return { error: "unknown" };

  const body = (await res.json().catch(() => null)) as { token?: string } | null;
  if (!body?.token) return { error: "unknown" };

  await setSessionCookie(body.token);
  redirect(safeNext(marketRaw, typeof next === "string" ? next : null));
}
