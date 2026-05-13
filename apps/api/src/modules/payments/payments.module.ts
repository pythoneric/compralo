import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { StripeProvider } from "./providers/stripe.provider";
import { MercadoPagoProvider } from "./providers/mercadopago.provider";
import { OrdersModule } from "../orders/orders.module";

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeProvider, MercadoPagoProvider],
})
export class PaymentsModule {}
