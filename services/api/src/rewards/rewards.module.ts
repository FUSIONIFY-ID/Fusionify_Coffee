import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StaffModule } from '../staff/staff.module';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { StaffRewardsController } from './staff-rewards.controller';

@Module({
  imports: [AuthModule, StaffModule],
  controllers: [RewardsController, StaffRewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
