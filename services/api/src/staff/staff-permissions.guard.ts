import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedStaffRequest } from './staff-auth.guard';
import { STAFF_PERMISSIONS_KEY } from './staff.decorators';
import { StaffPermission } from './staff.types';

@Injectable()
export class StaffPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const required =
      this.reflector.getAllAndOverride<StaffPermission[]>(
        STAFF_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (required.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedStaffRequest>();
    const granted = request.staffAuth?.permissions ?? [];

    if (!required.every((permission) => granted.includes(permission))) {
      throw new ForbiddenException('Staff permission is required.');
    }

    return true;
  }
}
