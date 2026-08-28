import { Module } from '@nestjs/common';
import { StaffAuthController } from './staff-auth.controller';
import { StaffAuthGuard } from './staff-auth.guard';
import { StaffAuthService } from './staff-auth.service';
import { StaffPermissionsGuard } from './staff-permissions.guard';

@Module({
  controllers: [StaffAuthController],
  providers: [StaffAuthService, StaffAuthGuard, StaffPermissionsGuard],
  exports: [StaffAuthService, StaffAuthGuard, StaffPermissionsGuard],
})
export class StaffModule {}
