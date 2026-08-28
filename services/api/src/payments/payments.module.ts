import { Module } from '@nestjs/common';
import { AutoGoPayGoPayProvider } from './providers/autogopay-gopay.provider';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WebhooksController } from './webhooks.controller';

@Module({
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService, AutoGoPayGoPayProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
