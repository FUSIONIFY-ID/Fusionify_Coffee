import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedStaffRequest } from '../staff/staff-auth.guard';
import { StaffAuthGuard } from '../staff/staff-auth.guard';
import { RequireStaffPermissions } from '../staff/staff.decorators';
import { StaffPermissionsGuard } from '../staff/staff-permissions.guard';
import { StaffPermission } from '../staff/staff.types';
import { PaymentsService } from './payments.service';

@Controller('v1/staff')
@UseGuards(StaffAuthGuard, StaffPermissionsGuard)
export class StaffPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:orderId/payments')
  @RequireStaffPermissions(StaffPermission.OrdersManage)
  create(
    @Req() request: AuthenticatedStaffRequest,
    @Param('orderId') orderId: string,
    @Headers('idempotency-key') idempotencyKey = '',
    @Body() body: { channel?: string },
  ) {
    return this.paymentsService.createForStaffOrder(
      orderId,
      request.staffAuth!.outletId,
      idempotencyKey,
      body?.channel,
    );
  }

  @Post('payments/:paymentId/check')
  @RequireStaffPermissions(StaffPermission.OrdersManage)
  check(
    @Req() request: AuthenticatedStaffRequest,
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentsService.checkForStaff(
      paymentId,
      request.staffAuth!.outletId,
    );
  }

  @Post('payments/:paymentId/cancel')
  @RequireStaffPermissions(StaffPermission.OrdersManage)
  cancel(
    @Req() request: AuthenticatedStaffRequest,
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentsService.cancelForStaff(
      paymentId,
      request.staffAuth!.outletId,
    );
  }
}
