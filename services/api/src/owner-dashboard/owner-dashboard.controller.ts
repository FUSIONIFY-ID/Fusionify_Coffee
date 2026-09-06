import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedStaffRequest } from '../staff/staff-auth.guard';
import { StaffAuthGuard } from '../staff/staff-auth.guard';
import { RequireStaffPermissions } from '../staff/staff.decorators';
import { StaffPermissionsGuard } from '../staff/staff-permissions.guard';
import { StaffPermission } from '../staff/staff.types';
import { OwnerDashboardService } from './owner-dashboard.service';

@Controller('v1/staff/owner-dashboard')
@UseGuards(StaffAuthGuard, StaffPermissionsGuard)
@RequireStaffPermissions(StaffPermission.FinanceRead)
export class OwnerDashboardController {
  constructor(private readonly dashboard: OwnerDashboardService) {}

  @Get()
  overview(
    @Req() request: AuthenticatedStaffRequest,
    @Query('rangeDays') rangeDays?: string,
    @Query('outletId') outletId?: string,
  ) {
    return this.dashboard.overview(
      request.staffAuth!.outletId,
      outletId,
      rangeDays,
    );
  }
}
