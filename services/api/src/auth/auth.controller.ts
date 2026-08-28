import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.guard';
import { CustomerAuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import type {
  LoginInput,
  RefreshInput,
  RegisterInput,
  RequestOtpInput,
  UpdateProfileInput,
  VerifyOtpInput,
} from './auth.types';

@Controller('v1')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/otp/request')
  requestOtp(@Body() body: RequestOtpInput) {
    return this.authService.requestOtp(body);
  }

  @Post('auth/otp/verify')
  verifyOtp(@Body() body: VerifyOtpInput) {
    return this.authService.verifyOtp(body);
  }

  @Post('auth/register')
  register(@Body() body: RegisterInput) {
    return this.authService.register(body);
  }

  @Post('auth/login')
  login(@Body() body: LoginInput) {
    return this.authService.login(body);
  }

  @Post('auth/refresh')
  refresh(@Body() body: RefreshInput) {
    return this.authService.refresh(body);
  }

  @UseGuards(CustomerAuthGuard)
  @Get('account/me')
  getProfile(@Req() request: AuthenticatedRequest) {
    return this.authService.getProfile(request.auth!.userId);
  }

  @UseGuards(CustomerAuthGuard)
  @Patch('account/profile')
  updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateProfileInput,
  ) {
    return this.authService.updateProfile(request.auth!.userId, body);
  }

  @UseGuards(CustomerAuthGuard)
  @Post('auth/logout')
  logout(@Req() request: AuthenticatedRequest) {
    return this.authService.logout(request.auth!.sessionId);
  }

  @UseGuards(CustomerAuthGuard)
  @Post('auth/logout-all')
  logoutAll(@Req() request: AuthenticatedRequest) {
    return this.authService.logoutAll(request.auth!.userId);
  }
}
