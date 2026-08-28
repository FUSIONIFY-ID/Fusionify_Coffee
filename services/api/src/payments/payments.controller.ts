import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('v1')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:orderId/payments')
  create(
    @Param('orderId') orderId: string,
    @Headers('idempotency-key') idempotencyKey = '',
    @Body() body: { channel?: string },
  ) {
    return this.paymentsService.createForOrder(
      orderId,
      idempotencyKey,
      body?.channel,
    );
  }

  @Post('payments/:paymentId/check')
  check(@Param('paymentId') paymentId: string) {
    return this.paymentsService.check(paymentId);
  }

  @Post('payments/:paymentId/cancel')
  cancel(@Param('paymentId') paymentId: string) {
    return this.paymentsService.cancel(paymentId);
  }
}
