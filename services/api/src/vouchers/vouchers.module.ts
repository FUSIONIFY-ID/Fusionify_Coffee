import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StaffModule } from '../staff/staff.module';
import { StaffVouchersController } from './staff-vouchers.controller';
import { VouchersController } from './vouchers.controller';
import { VouchersService } from './vouchers.service';

@Module({
  imports: [AuthModule, StaffModule],
  controllers: [VouchersController, StaffVouchersController],
  providers: [VouchersService],
  exports: [VouchersService],
})
export class VouchersModule {}
