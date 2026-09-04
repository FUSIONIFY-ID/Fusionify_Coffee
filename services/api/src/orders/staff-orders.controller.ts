import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedStaffRequest } from '../staff/staff-auth.guard';
import { StaffAuthGuard } from '../staff/staff-auth.guard';
import { RequireStaffPermissions } from '../staff/staff.decorators';
import { StaffPermissionsGuard } from '../staff/staff-permissions.guard';
import { StaffPermission } from '../staff/staff.types';
import { StaffOrderStreamService } from './staff-order-stream.service';
import { StaffOrdersService } from './staff-orders.service';
import type { CreateOrderInput } from './orders.types';

@Controller('v1/staff/orders')
@UseGuards(StaffAuthGuard, StaffPermissionsGuard)
export class StaffOrdersController {
  constructor(
    private readonly ordersService: StaffOrdersService,
    private readonly orderStream: StaffOrderStreamService,
  ) {}

  @Post()
  @RequireStaffPermissions(StaffPermission.OrdersManage)
  createPosOrder(
    @Req() request: AuthenticatedStaffRequest,
    @Headers('idempotency-key') idempotencyKey = '',
    @Body() body: CreateOrderInput,
  ) {
    return this.ordersService.createPosOrder(
      {
        staffUserId: request.staffAuth!.staffUserId,
        outletId: request.staffAuth!.outletId,
      },
      body,
      idempotencyKey,
    );
  }

  @Get()
  @RequireStaffPermissions(StaffPermission.OrdersRead)
  list(
    @Req() request: AuthenticatedStaffRequest,
    @Query('status') status?: string,
    @Query('outletId') outletId?: string,
  ) {
    return this.ordersService.list(
      {
        staffUserId: request.staffAuth!.staffUserId,
        outletId: request.staffAuth!.outletId,
      },
      { status, outletId },
    );
  }

  @Sse('events')
  @RequireStaffPermissions(StaffPermission.OrdersRead)
  events(@Req() request: AuthenticatedStaffRequest) {
    return this.orderStream.stream(request.staffAuth!.outletId);
  }

  @Get(':orderId')
  @RequireStaffPermissions(StaffPermission.OrdersRead)
  get(
    @Req() request: AuthenticatedStaffRequest,
    @Param('orderId') orderId: string,
  ) {
    return this.ordersService.getById(
      {
        staffUserId: request.staffAuth!.staffUserId,
        outletId: request.staffAuth!.outletId,
      },
      orderId,
    );
  }

  @Post(':orderId/status')
  @RequireStaffPermissions(StaffPermission.OrdersManage)
  transition(
    @Req() request: AuthenticatedStaffRequest,
    @Param('orderId') orderId: string,
    @Body() body: { toStatus: string; note?: string },
  ) {
    return this.ordersService.transition(
      {
        staffUserId: request.staffAuth!.staffUserId,
        outletId: request.staffAuth!.outletId,
      },
      orderId,
      body,
    );
  }
}
