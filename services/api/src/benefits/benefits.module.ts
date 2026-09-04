import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StaffModule } from '../staff/staff.module';
import { BenefitsController } from './benefits.controller';
import { BenefitsService } from './benefits.service';
import { StaffBenefitsController } from './staff-benefits.controller';

@Module({
  imports: [AuthModule, StaffModule],
  controllers: [BenefitsController, StaffBenefitsController],
  providers: [BenefitsService],
  exports: [BenefitsService],
})
export class BenefitsModule {}
