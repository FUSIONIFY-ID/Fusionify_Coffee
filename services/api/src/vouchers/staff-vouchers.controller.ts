import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedStaffRequest } from '../staff/staff-auth.guard';
import { StaffAuthGuard } from '../staff/staff-auth.guard';
import { RequireStaffPermissions } from '../staff/staff.decorators';
import { StaffPermissionsGuard } from '../staff/staff-permissions.guard';
import { StaffPermission } from '../staff/staff.types';
import type { ConfigureVoucherInput, IssueVoucherInput } from './vouchers.types';
import { VouchersService } from './vouchers.service';

@Controller('v1/staff/vouchers')
@UseGuards(StaffAuthGuard, StaffPermissionsGuard)
@RequireStaffPermissions(StaffPermission.RewardsManage)
export class StaffVouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get()
  list() {
    return this.vouchersService.listConfigured();
  }

  @Put(':code')
  configure(
    @Req() request: AuthenticatedStaffRequest,
    @Param('code') code: string,
    @Body() body: ConfigureVoucherInput,
  ) {
    return this.vouchersService.configure(
      request.staffAuth!.staffUserId,
      code,
      body,
    );
  }

  @Post(':code/issue')
  issue(
    @Req() request: AuthenticatedStaffRequest,
    @Param('code') code: string,
    @Body() body: IssueVoucherInput,
  ) {
    return this.vouchersService.issue(
      request.staffAuth!.staffUserId,
      code,
      body,
    );
  }
}
