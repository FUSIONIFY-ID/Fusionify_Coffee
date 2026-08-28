import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { CustomerAuthGuard } from '../auth/auth.guard';
import { PaymentsService } from './payments.service';

@Controller('v1')
@UseGuards(CustomerAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:orderId/payments')
  create(
    @Req() request: AuthenticatedRequest,
    @Param('orderId') orderId: string,
    @Headers('idempotency-key') idempotencyKey = '',
    @Body() body: { channel?: string },
  ) {
    return this.paymentsService.createForOrder(
      orderId,
      request.auth!.userId,
      idempotencyKey,
      body?.channel,
    );
  }

  @Get('payments/:paymentId')
  get(
    @Req() request: AuthenticatedRequest,
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentsService.getView(paymentId, request.auth!.userId);
  }

  @Post('payments/:paymentId/check')
  check(
    @Req() request: AuthenticatedRequest,
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentsService.check(paymentId, request.auth!.userId);
  }

  @Post('payments/:paymentId/cancel')
  cancel(
    @Req() request: AuthenticatedRequest,
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentsService.cancel(paymentId, request.auth!.userId);
  }
}
