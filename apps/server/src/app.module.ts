import { Module, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { CorrelationIdMiddleware } from "./middleware/correlation-id.middleware";
import { AuditLoggerMiddleware } from "./middleware/audit-logger.middleware";
import { InputSanitizerMiddleware } from "./middleware/input-sanitizer.middleware";
import { SsrfGuardMiddleware } from "./middleware/ssrf-guard.middleware";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ProductsModule } from "./modules/products/products.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { CartModule } from "./modules/cart/cart.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { VendorModule } from "./modules/vendor/vendor.module";
import { WalletModule } from "./modules/wallet/wallet.module";
import { WishlistModule } from "./modules/wishlist/wishlist.module";
import { AddressesModule } from "./modules/addresses/addresses.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { CouponsModule } from "./modules/coupons/coupons.module";
import { ServicesModule } from "./modules/services/services.module";
import { ReelsModule } from "./modules/reels/reels.module";
import { VendorCouponsModule } from "./modules/vendor-coupons/vendor-coupons.module";
import { VendorStaffModule } from "./modules/vendor-staff/vendor-staff.module";
import { VendorReviewsModule } from "./modules/vendor-reviews/vendor-reviews.module";
import { VendorCustomersModule } from "./modules/vendor-customers/vendor-customers.module";
import { VendorPaymentMethodsModule } from "./modules/vendor-payment-methods/vendor-payment-methods.module";
import { VendorHoursModule } from "./modules/vendor-hours/vendor-hours.module";
import { VendorDocumentsModule } from "./modules/vendor-documents/vendor-documents.module";
import { UploadModule } from "./modules/upload/upload.module";
import { FlashSalesModule } from "./modules/flash-sales/flash-sales.module";
import { BannersModule } from "./modules/banners/banners.module";
import { ReferralsModule } from "./modules/referrals/referrals.module";
import { CustomerReelsModule } from "./modules/customer-reels/customer-reels.module";
import { CustomerServicesModule } from "./modules/customer-services/customer-services.module";
import { FoodModule } from "./modules/food/food.module";
import { EscrowModule } from "./modules/escrow/escrow.module";
import { ChatModule } from "./modules/chat/chat.module";
import { SupportModule } from "./modules/support/support.module";
import { AdminModule } from "./modules/admin/admin.module";
import { HealthModule } from "./modules/health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { DispatcherModule } from "./modules/dispatcher/dispatcher.module";
import { DeliveryModule } from "./modules/delivery/delivery.module";
import { StoryModule } from "./modules/story/story.module";
import { MetricsModule } from "./modules/metrics/metrics.module";
import { CollectionsModule } from "./modules/collections/collections.module";

import { WinstonModule } from "nest-winston";
import * as winston from "winston";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.json()
          ),
        }),
      ],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    CartModule,
    PaymentsModule,
    VendorModule,
    WalletModule,
    WishlistModule,
    AddressesModule,
    NotificationsModule,
    ReviewsModule,
    CouponsModule,
    ServicesModule,
    ReelsModule,
    VendorCouponsModule,
    VendorStaffModule,
    VendorReviewsModule,
    VendorCustomersModule,
    VendorPaymentMethodsModule,
    VendorHoursModule,
    VendorDocumentsModule,
    UploadModule,
    FlashSalesModule,
    BannersModule,
    ReferralsModule,
    CustomerReelsModule,
    CustomerServicesModule,
    FoodModule,
    EscrowModule,
    ChatModule,
    SupportModule,
    AdminModule,
    HealthModule,
    DispatcherModule,
    DeliveryModule,
    StoryModule,
    MetricsModule,
    CollectionsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, InputSanitizerMiddleware, AuditLoggerMiddleware)
      .forRoutes("*")
      .apply(SsrfGuardMiddleware)
      .forRoutes(
        { path: "api/v1/story", method: 1 },
        { path: "api/v1/upload", method: 1 },
        { path: "api/v1/vendor/products", method: 1 },
        { path: "api/v1/payments/webhook", method: 1 },
        { path: "api/v1/collections", method: 1 },
        { path: "api/v1/coupons/validate", method: 1 },
        { path: "api/v1/referrals/generate", method: 1 },
        { path: "api/v1/referrals/apply", method: 1 },
        { path: "api/v1/reviews", method: 1 }
      );
  }
}
