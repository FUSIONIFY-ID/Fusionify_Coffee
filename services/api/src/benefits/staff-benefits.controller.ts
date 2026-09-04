import { Body, Controller, Param, Put, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedStaffRequest } from '../staff/staff-auth.guard';
import { StaffAuthGuard } from '../staff/staff-auth.guard';
import { RequireStaffPermissions } from '../staff/staff.decorators';
import { StaffPermissionsGuard } from '../staff/staff-permissions.guard';
import { StaffPermission } from '../staff/staff.types';
import { BenefitsService } from './benefits.service';
import type {
  ConfigureAiBenefitInput,
  ConfigureWifiBenefitInput,
} from './benefits.types';

@Controller('v1/staff/benefits')
@UseGuards(StaffAuthGuard, StaffPermissionsGuard)
@RequireStaffPermissions(StaffPermission.SystemManage)
export class StaffBenefitsController {
  constructor(private readonly benefitsService: BenefitsService) {}

  @Put('outlets/:outletId/wifi')
  wifi(
    @Req() request: AuthenticatedStaffRequest,
    @Param('outletId') outletId: string,
    @Body() body: ConfigureWifiBenefitInput,
  ) {
    return this.benefitsService.configureWifi(
      request.staffAuth!.staffUserId,
      outletId,
      body,
    );
  }

  @Put('outlets/:outletId/ai')
  ai(
    @Req() request: AuthenticatedStaffRequest,
    @Param('outletId') outletId: string,
    @Body() body: ConfigureAiBenefitInput,
  ) {
    return this.benefitsService.configureAi(
      request.staffAuth!.staffUserId,
      outletId,
      body,
    );
  }
}
