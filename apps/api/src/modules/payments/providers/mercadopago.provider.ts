import { Injectable } from "@nestjs/common";
import type { CheckoutInput, CheckoutOutput, PaymentProvider, WebhookEvent } from "./provider.interface";

// Mercado Pago Marketplace integration stub.
// OXXO / SPEI / MSI all surface as MP "payment_method_id" values on the real API.
@Injectable()
export class MercadoPagoProvider implements PaymentProvider {
  readonly name = "mercadopago" as const;

  async createCheckout(input: CheckoutInput): Promise<CheckoutOutput> {
    return {
      providerRef: `mp_test_${Date.now()}`,
      redirectUrl: `${input.returnUrl}?stub=mp&order=${input.orderId}`,
    };
  }

  async parseWebhook(_headers: Record<string, string>, body: unknown): Promise<WebhookEvent> {
    const b = body as { id?: string; transaction_amount?: number; currency_id?: string };
    return {
      providerRef: String(b.id ?? "unknown"),
      status: "succeeded",
      amountCents: Math.round((b.transaction_amount ?? 0) * 100),
      currency: b.currency_id ?? "MXN",
      raw: body,
    };
  }
}
