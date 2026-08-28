import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CatalogModule } from './catalog/catalog.module';
import { DatabaseModule } from './database/database.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [DatabaseModule, CatalogModule, OrdersModule],
  controllers: [AppController],
})
export class AppModule {}
