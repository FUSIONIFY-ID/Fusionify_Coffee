import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AutoGoPayGoPayProvider } from './providers/autogopay-gopay.provider';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService, AutoGoPayGoPayProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
