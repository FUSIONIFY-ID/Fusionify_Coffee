import { Module } from '@nestjs/common';
import { StaffAuthController } from './staff-auth.controller';
import { StaffAuthGuard } from './staff-auth.guard';
import { StaffAuthService } from './staff-auth.service';
import { StaffManagementController } from './staff-management.controller';
import { StaffManagementService } from './staff-management.service';
import { StaffPermissionsGuard } from './staff-permissions.guard';

@Module({
  controllers: [StaffAuthController, StaffManagementController],
  providers: [
    StaffAuthService,
    StaffAuthGuard,
    StaffPermissionsGuard,
    StaffManagementService,
  ],
  exports: [
    StaffAuthService,
    StaffAuthGuard,
    StaffPermissionsGuard,
    StaffManagementService,
  ],
})
export class StaffModule {}
