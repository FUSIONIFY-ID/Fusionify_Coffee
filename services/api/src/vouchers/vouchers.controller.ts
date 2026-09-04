import { Controller, Get, Headers, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { CustomerAuthGuard } from '../auth/auth.guard';
import { VouchersService } from './vouchers.service';

@Controller('v1/vouchers')
@UseGuards(CustomerAuthGuard)
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get('me')
  me(
    @Req() request: AuthenticatedRequest,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.vouchersService.listWallet(
      request.auth!.userId,
      acceptLanguage,
    );
  }
}
