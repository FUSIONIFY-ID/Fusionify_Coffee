import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { CustomerAuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { OtpDeliveryService } from './otp-delivery.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, CustomerAuthGuard, OtpDeliveryService],
  exports: [AuthService, CustomerAuthGuard],
})
export class AuthModule {}
