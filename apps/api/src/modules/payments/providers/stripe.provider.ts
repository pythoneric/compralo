import { Injectable } from "@nestjs/common";
import type { CheckoutInput, CheckoutOutput, PaymentProvider, WebhookEvent } from "./provider.interface";

// Stripe integration stub — switch to the real `stripe` SDK before US launch.
// Keeping it stubbed avoids requiring API keys to boot the dev environment.
@Injectable()
export class StripeProvider implements PaymentProvider {
  readonly name = "stripe" as const;

  async createCheckout(input: CheckoutInput): Promise<CheckoutOutput> {
    return {
      providerRef: `pi_test_${Date.now()}`,
      redirectUrl: `${input.returnUrl}?stub=stripe&order=${input.orderId}`,
    };
  }

  async parseWebhook(_headers: Record<string, string>, body: unknown): Promise<WebhookEvent> {
    const b = body as { id?: string; data?: { object?: { amount?: number; currency?: string } } };
    return {
      providerRef: b.id ?? "unknown",
      status: "succeeded",
      amountCents: b.data?.object?.amount ?? 0,
      currency: (b.data?.object?.currency ?? "usd").toUpperCase(),
      raw: body,
    };
  }
}
