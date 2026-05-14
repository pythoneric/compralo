"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { signInAction, type SignInState } from "./actions";
import type { Market } from "@/i18n/config";

const initialState: SignInState = {};

export function SignInForm({ market, next }: { market: Market; next?: string }) {
  const [state, formAction] = useFormState(signInAction, initialState);
  const t = useTranslations("signIn");

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="market" value={market} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {/* Honeypot: visually + semantically hidden from humans, harvested by naive bots. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
        <label>
          Leave this field empty
          <input type="text" name="hp" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          spellCheck={false}
          autoCapitalize="off"
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          maxLength={256}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      {state.error ? (
        <p role="alert" aria-live="polite" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error === "rate_limited" ? t("rateLimited") : t("invalid")}
        </p>
      ) : null}

      <Submit label={t("submit")} pendingLabel={t("submitting")} />
    </form>
  );
}

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
