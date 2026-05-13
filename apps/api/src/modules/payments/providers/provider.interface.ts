// Single seam between Compralo and the two payment rails (Stripe in US, Mercado Pago in MX).
// The plan calls out that we should keep a unified ledger from day one — see how
// `PaymentsService` always writes a `Payment` row regardless of provider.

export type PaymentProviderName = "stripe" | "mercadopago";

export interface CheckoutInput {
  orderId: string;
  amountCents: number;
  currency: string;
  returnUrl: string;
  buyer: { email: string };
}

export interface CheckoutOutput {
  providerRef: string;
  redirectUrl: string;
}

export interface WebhookEvent {
  providerRef: string;
  status: "authorized" | "succeeded" | "failed" | "refunded";
  amountCents: number;
  currency: string;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createCheckout(input: CheckoutInput): Promise<CheckoutOutput>;
  parseWebhook(headers: Record<string, string>, body: unknown): Promise<WebhookEvent>;
}
