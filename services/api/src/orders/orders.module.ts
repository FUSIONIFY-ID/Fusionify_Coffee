import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RewardsModule } from '../rewards/rewards.module';
import { StaffModule } from '../staff/staff.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { StaffOrdersController } from './staff-orders.controller';
import { StaffOrdersService } from './staff-orders.service';

@Module({
  imports: [AuthModule, RewardsModule, StaffModule],
  controllers: [OrdersController, StaffOrdersController],
  providers: [OrdersService, StaffOrdersService],
  exports: [OrdersService, StaffOrdersService],
})
export class OrdersModule {}
