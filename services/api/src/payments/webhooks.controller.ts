import { Controller, Headers, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';

@Controller('v1/webhooks')
export class WebhooksController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('autogopay')
  handleAutoGoPay(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-signature') signature = '',
  ) {
    if (!request.rawBody) {
      throw new Error('Raw request body is unavailable.');
    }

    return this.paymentsService.handleAutoGoPayWebhook(
      request.rawBody,
      signature,
    );
  }
}
