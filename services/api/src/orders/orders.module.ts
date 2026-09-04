import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BenefitsModule } from '../benefits/benefits.module';
import { OperationsModule } from '../operations/operations.module';
import { RewardsModule } from '../rewards/rewards.module';
import { StaffModule } from '../staff/staff.module';
import { CustomerOrderStreamService } from './customer-order-stream.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { StaffOrderStreamService } from './staff-order-stream.service';
import { StaffOrdersController } from './staff-orders.controller';
import { StaffOrdersService } from './staff-orders.service';

@Module({
  imports: [
    AuthModule,
    BenefitsModule,
    OperationsModule,
    RewardsModule,
    StaffModule,
  ],
  controllers: [OrdersController, StaffOrdersController],
  providers: [
    OrdersService,
    StaffOrdersService,
    StaffOrderStreamService,
    CustomerOrderStreamService,
  ],
  exports: [OrdersService, StaffOrdersService],
})
export class OrdersModule {}
