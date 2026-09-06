import { Module } from '@nestjs/common';
import { StaffModule } from '../staff/staff.module';
import { OwnerDashboardController } from './owner-dashboard.controller';
import { OwnerDashboardService } from './owner-dashboard.service';

@Module({
  imports: [StaffModule],
  controllers: [OwnerDashboardController],
  providers: [OwnerDashboardService],
})
export class OwnerDashboardModule {}
