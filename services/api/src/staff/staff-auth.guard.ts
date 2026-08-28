import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { StaffAuthService } from './staff-auth.service';
import type { StaffPermission } from './staff.types';

export type AuthenticatedStaffRequest = Request & {
  staffAuth?: {
    staffUserId: string;
    sessionId: string;
    permissions: StaffPermission[];
  };
};

@Injectable()
export class StaffAuthGuard implements CanActivate {
  constructor(private readonly authService: StaffAuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedStaffRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Staff authentication is required.');
    }

    const token = authorization.substring('Bearer '.length).trim();
    const result = await this.authService.getForAccessToken(token);
    if (!result) {
      throw new UnauthorizedException('Staff session is invalid or expired.');
    }

    request.staffAuth = {
      staffUserId: result.staff.id,
      sessionId: result.session.id,
      permissions: result.permissions,
    };
    return true;
  }
}
