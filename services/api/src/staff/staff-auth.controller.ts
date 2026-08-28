import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedStaffRequest } from './staff-auth.guard';
import { StaffAuthGuard } from './staff-auth.guard';
import { StaffAuthService } from './staff-auth.service';
import { RequireStaffPermissions } from './staff.decorators';
import { StaffPermissionsGuard } from './staff-permissions.guard';
import { StaffPermission } from './staff.types';
import type {
  StaffLoginInput,
  StaffRefreshInput,
  StaffTotpVerifyInput,
} from './staff.types';

@Controller('v1/staff')
export class StaffAuthController {
  constructor(private readonly authService: StaffAuthService) {}

  @Post('auth/login')
  login(
    @Body() body: StaffLoginInput,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.login(body, { ipAddress, userAgent });
  }

  @Post('auth/totp/setup')
  setupTotp(@Body() body: { challengeToken: string }) {
    return this.authService.setupTotp(body.challengeToken);
  }

  @Post('auth/totp/verify')
  verifyTotp(
    @Body() body: StaffTotpVerifyInput,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.verifyTotp(body, { ipAddress, userAgent });
  }

  @Post('auth/refresh')
  refresh(@Body() body: StaffRefreshInput) {
    return this.authService.refresh(body);
  }

  @UseGuards(StaffAuthGuard)
  @Get('me')
  me(@Req() request: AuthenticatedStaffRequest) {
    return this.authService.me(request.staffAuth!.staffUserId);
  }

  @UseGuards(StaffAuthGuard)
  @Post('auth/logout')
  logout(@Req() request: AuthenticatedStaffRequest) {
    return this.authService.logout(request.staffAuth!.sessionId);
  }

  @UseGuards(StaffAuthGuard, StaffPermissionsGuard)
  @RequireStaffPermissions(StaffPermission.AuditRead)
  @Get('audit-logs')
  auditLogs(@Query('limit') rawLimit?: string) {
    const parsed = rawLimit ? Number.parseInt(rawLimit, 10) : 100;
    return this.authService.listAuditLogs(
      Number.isFinite(parsed) ? parsed : 100,
    );
  }
}
