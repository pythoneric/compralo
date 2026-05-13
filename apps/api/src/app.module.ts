import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { PrismaModule } from "./common/prisma/prisma.module";
import { HealthModule } from "./modules/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ListingsModule } from "./modules/listings/listings.module";
import { VehiclesModule } from "./modules/vehicles/vehicles.module";
import { SearchModule } from "./modules/search/search.module";
import { MessagesModule } from "./modules/messages/messages.module";
import { OffersModule } from "./modules/offers/offers.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ModerationModule } from "./modules/moderation/moderation.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { UploadsModule } from "./modules/uploads/uploads.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ListingsModule,
    VehiclesModule,
    SearchModule,
    MessagesModule,
    OffersModule,
    OrdersModule,
    PaymentsModule,
    ModerationModule,
    ReviewsModule,
    UploadsModule,
  ],
})
export class AppModule {}
