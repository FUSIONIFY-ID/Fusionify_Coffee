import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StaffModule } from '../staff/staff.module';
import { RewardCatalogController } from './reward-catalog.controller';
import { RewardCatalogService } from './reward-catalog.service';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { StaffRewardCatalogController } from './staff-reward-catalog.controller';
import { StaffRewardsController } from './staff-rewards.controller';

@Module({
  imports: [AuthModule, StaffModule],
  controllers: [
    RewardsController,
    StaffRewardsController,
    RewardCatalogController,
    StaffRewardCatalogController,
  ],
  providers: [RewardsService, RewardCatalogService],
  exports: [RewardsService, RewardCatalogService],
})
export class RewardsModule {}
