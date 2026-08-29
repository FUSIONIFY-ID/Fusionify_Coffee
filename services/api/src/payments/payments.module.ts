import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StaffModule } from '../staff/staff.module';
import { AutoGoPayGoPayProvider } from './providers/autogopay-gopay.provider';
import { PaymentsController } from './payments.controller';
import { StaffPaymentsController } from './staff-payments.controller';
import { PaymentsService } from './payments.service';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [AuthModule, StaffModule],
  controllers: [
    PaymentsController,
    StaffPaymentsController,
    WebhooksController,
  ],
  providers: [PaymentsService, AutoGoPayGoPayProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
