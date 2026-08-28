import { SetMetadata } from '@nestjs/common';
import { StaffPermission } from './staff.types';

export const STAFF_PERMISSIONS_KEY = 'staff_permissions';

export const RequireStaffPermissions = (...permissions: StaffPermission[]) =>
  SetMetadata(STAFF_PERMISSIONS_KEY, permissions);
