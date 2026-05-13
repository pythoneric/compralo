import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { StripeProvider } from "./providers/stripe.provider";
import { MercadoPagoProvider } from "./providers/mercadopago.provider";
import type { PaymentProvider, PaymentProviderName } from "./providers/provider.interface";
import { PaymentStatus, OrderStatus, stringifyJson } from "@compralo/db";

@Injectable()
export class PaymentsService {
  private readonly providers: Record<PaymentProviderName, PaymentProvider>;

  constructor(
    private readonly prisma: PrismaService,
    stripe: StripeProvider,
    mp: MercadoPagoProvider,
  ) {
    this.providers = { stripe, mercadopago: mp };
  }

  async createCheckoutSession(input: { orderId: string; provider: PaymentProviderName; returnUrl: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: { buyer: true },
    });
    if (!order) throw new NotFoundException("order");

    const provider = this.providers[input.provider];
    const checkout = await provider.createCheckout({
      orderId: order.id,
      amountCents: Number(order.grossCents),
      currency: order.currency,
      returnUrl: input.returnUrl,
      buyer: { email: order.buyer.email },
    });

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: provider.name,
        providerRef: checkout.providerRef,
        amountCents: order.grossCents,
        currency: order.currency,
        status: PaymentStatus.initiated,
      },
    });

    return checkout;
  }

  async handleWebhook(name: PaymentProviderName, headers: Record<string, string>, body: unknown) {
    const provider = this.providers[name];
    const evt = await provider.parseWebhook(headers, body);

    const payment = await this.prisma.payment.findFirst({ where: { providerRef: evt.providerRef } });
    if (!payment) return { ok: true, ignored: true };

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: evt.status, raw: stringifyJson(evt.raw) },
    });

    if (evt.status === "succeeded") {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.paid },
      });
    }
    return { ok: true };
  }
}
