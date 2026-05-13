import { Body, Controller, Headers, Param, Post } from "@nestjs/common";
import { IsString } from "class-validator";
import { PaymentsService } from "./payments.service";
import type { PaymentProviderName } from "./providers/provider.interface";

class CheckoutSessionDto {
  @IsString() orderId!: string;
  @IsString() provider!: PaymentProviderName;
  @IsString() returnUrl!: string;
}

@Controller()
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  @Post("checkout/sessions")
  create(@Body() dto: CheckoutSessionDto) {
    return this.svc.createCheckoutSession(dto);
  }

  @Post("webhooks/payments/:provider")
  webhook(
    @Param("provider") provider: PaymentProviderName,
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ) {
    return this.svc.handleWebhook(provider, headers, body);
  }
}
