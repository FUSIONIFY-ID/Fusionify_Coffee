import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { CustomerAuthGuard } from '../auth/auth.guard';
import { BenefitsService } from './benefits.service';

@Controller('v1/benefits')
@UseGuards(CustomerAuthGuard)
export class BenefitsController {
  constructor(private readonly benefitsService: BenefitsService) {}

  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return this.benefitsService.listForCustomer(request.auth!.userId);
  }

  @Post(':entitlementId/ai/consume')
  consumeAi(
    @Req() request: AuthenticatedRequest,
    @Param('entitlementId') entitlementId: string,
    @Body() body: { units?: number },
  ) {
    return this.benefitsService.consumeAi(
      request.auth!.userId,
      entitlementId,
      body.units ?? 1,
    );
  }

  @Get('receipts/:orderId')
  receipt(
    @Req() request: AuthenticatedRequest,
    @Param('orderId') orderId: string,
  ) {
    return this.benefitsService.receipt(request.auth!.userId, orderId);
  }
}
