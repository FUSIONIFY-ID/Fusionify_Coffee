import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';

export type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
    sessionId: string;
  };
};

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication is required.');
    }

    const token = authorization.substring('Bearer '.length).trim();
    const result = await this.authService.getUserForAccessToken(token);

    if (!result) {
      throw new UnauthorizedException('Session is invalid or expired.');
    }

    request.auth = {
      userId: result.user.id,
      sessionId: result.session.id,
    };

    return true;
  }
}
