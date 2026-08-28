import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.guard';
import { CustomerAuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import type {
  ConfirmChangePhoneInput,
  ConfirmDeleteAccountInput,
  LoginInput,
  RefreshInput,
  RegisterInput,
  RequestChangePhoneOtpInput,
  RequestDeleteAccountOtpInput,
  RequestOtpInput,
  ResetPasswordInput,
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

  @Post('auth/reset-password')
  resetPassword(@Body() body: ResetPasswordInput) {
    return this.authService.resetPassword(body);
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
  @Post('account/change-phone/request-otp')
  requestChangePhoneOtp(
    @Req() request: AuthenticatedRequest,
    @Body() body: RequestChangePhoneOtpInput,
  ) {
    return this.authService.requestChangePhoneOtp(request.auth!.userId, body);
  }

  @UseGuards(CustomerAuthGuard)
  @Post('account/change-phone/confirm')
  confirmChangePhone(
    @Req() request: AuthenticatedRequest,
    @Body() body: ConfirmChangePhoneInput,
  ) {
    return this.authService.confirmChangePhone(
      request.auth!.userId,
      request.auth!.sessionId,
      body,
    );
  }

  @UseGuards(CustomerAuthGuard)
  @Post('account/delete/request-otp')
  requestDeleteAccountOtp(
    @Req() request: AuthenticatedRequest,
    @Body() body: RequestDeleteAccountOtpInput,
  ) {
    return this.authService.requestDeleteAccountOtp(
      request.auth!.userId,
      body,
    );
  }

  @UseGuards(CustomerAuthGuard)
  @Post('account/delete/confirm')
  confirmDeleteAccount(
    @Req() request: AuthenticatedRequest,
    @Body() body: ConfirmDeleteAccountInput,
  ) {
    return this.authService.confirmDeleteAccount(request.auth!.userId, body);
  }

  @UseGuards(CustomerAuthGuard)
  @Get('account/sessions')
  listSessions(@Req() request: AuthenticatedRequest) {
    return this.authService.listSessions(
      request.auth!.userId,
      request.auth!.sessionId,
    );
  }

  @UseGuards(CustomerAuthGuard)
  @Post('account/sessions/:sessionId/revoke')
  revokeSession(
    @Req() request: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
  ) {
    return this.authService.revokeSession(
      request.auth!.userId,
      sessionId,
      request.auth!.sessionId,
    );
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
