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
import { RewardsService } from './rewards.service';
import type { ConfigureLoyaltyProgramInput } from './rewards.types';

@Controller('v1/staff/rewards')
@UseGuards(StaffAuthGuard, StaffPermissionsGuard)
@RequireStaffPermissions(StaffPermission.RewardsManage)
export class StaffRewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('programs')
  programs() {
    return this.rewardsService.listPrograms();
  }

  @Put('programs/:currency')
  configure(
    @Req() request: AuthenticatedStaffRequest,
    @Param('currency') currency: string,
    @Body() body: ConfigureLoyaltyProgramInput,
  ) {
    return this.rewardsService.configureProgram(
      request.staffAuth!.staffUserId,
      currency,
      body,
    );
  }
}
