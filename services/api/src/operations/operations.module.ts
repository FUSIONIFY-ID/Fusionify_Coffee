import { Module } from '@nestjs/common';
import { StaffModule } from '../staff/staff.module';
import { InventoryConsumptionService } from './inventory-consumption.service';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';

@Module({
  imports: [StaffModule],
  controllers: [OperationsController],
  providers: [OperationsService, InventoryConsumptionService],
  exports: [OperationsService, InventoryConsumptionService],
})
export class OperationsModule {}
