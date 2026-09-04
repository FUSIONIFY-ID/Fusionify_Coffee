import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedStaffRequest } from '../staff/staff-auth.guard';
import { StaffAuthGuard } from '../staff/staff-auth.guard';
import { RequireStaffPermissions } from '../staff/staff.decorators';
import { StaffPermissionsGuard } from '../staff/staff-permissions.guard';
import { StaffPermission } from '../staff/staff.types';
import { RewardCatalogService } from './reward-catalog.service';
import type { ConfigureRewardCatalogItemInput } from './reward-catalog.types';

@Controller('v1/staff/rewards/catalog')
@UseGuards(StaffAuthGuard, StaffPermissionsGuard)
@RequireStaffPermissions(StaffPermission.RewardsManage)
export class StaffRewardCatalogController {
  constructor(private readonly rewardCatalogService: RewardCatalogService) {}

  @Get()
  list() {
    return this.rewardCatalogService.listConfigured();
  }

  @Put(':itemId')
  configure(
    @Req() request: AuthenticatedStaffRequest,
    @Param('itemId') itemId: string,
    @Body() body: ConfigureRewardCatalogItemInput,
  ) {
    return this.rewardCatalogService.configure(
      request.staffAuth!.staffUserId,
      itemId,
      body,
    );
  }
}
