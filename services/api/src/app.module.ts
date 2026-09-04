import { Module } from '@nestjs/common';
import { AddressesModule } from './addresses/addresses.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { DatabaseModule } from './database/database.module';
import { FavoritesModule } from './favorites/favorites.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { RewardsModule } from './rewards/rewards.module';
import { StaffModule } from './staff/staff.module';
import { VouchersModule } from './vouchers/vouchers.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AddressesModule,
    CatalogModule,
    FavoritesModule,
    OrdersModule,
    PaymentsModule,
    RewardsModule,
    StaffModule,
    VouchersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
