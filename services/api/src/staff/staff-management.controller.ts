import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedStaffRequest } from './staff-auth.guard';
import { StaffAuthGuard } from './staff-auth.guard';
import { RequireStaffPermissions } from './staff.decorators';
import { StaffManagementService } from './staff-management.service';
import { StaffPermissionsGuard } from './staff-permissions.guard';
import { StaffPermission } from './staff.types';
import type {
  CreateStaffInput,
  ResetStaffPasswordInput,
  UpdateStaffInput,
} from './staff.types';

@Controller('v1/staff/users')
@UseGuards(StaffAuthGuard, StaffPermissionsGuard)
@RequireStaffPermissions(StaffPermission.StaffManage)
export class StaffManagementController {
  constructor(private readonly staffService: StaffManagementService) {}

  @Get()
  list() {
    return this.staffService.listStaff();
  }

  @Post()
  create(
    @Req() request: AuthenticatedStaffRequest,
    @Body() body: CreateStaffInput,
  ) {
    return this.staffService.createStaff(request.staffAuth!.staffUserId, body);
  }

  @Patch(':staffUserId')
  update(
    @Req() request: AuthenticatedStaffRequest,
    @Param('staffUserId') staffUserId: string,
    @Body() body: UpdateStaffInput,
  ) {
    return this.staffService.updateStaff(
      request.staffAuth!.staffUserId,
      staffUserId,
      body,
    );
  }

  @Post(':staffUserId/reset-password')
  resetPassword(
    @Req() request: AuthenticatedStaffRequest,
    @Param('staffUserId') staffUserId: string,
    @Body() body: ResetStaffPasswordInput,
  ) {
    return this.staffService.resetPassword(
      request.staffAuth!.staffUserId,
      staffUserId,
      body,
    );
  }

  @Post(':staffUserId/reset-totp')
  resetTotp(
    @Req() request: AuthenticatedStaffRequest,
    @Param('staffUserId') staffUserId: string,
  ) {
    return this.staffService.resetTotp(
      request.staffAuth!.staffUserId,
      staffUserId,
    );
  }
}
