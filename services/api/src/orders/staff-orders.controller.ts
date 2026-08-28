import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedStaffRequest } from '../staff/staff-auth.guard';
import { StaffAuthGuard } from '../staff/staff-auth.guard';
import { RequireStaffPermissions } from '../staff/staff.decorators';
import { StaffPermissionsGuard } from '../staff/staff-permissions.guard';
import { StaffPermission } from '../staff/staff.types';
import { StaffOrdersService } from './staff-orders.service';

@Controller('v1/staff/orders')
@UseGuards(StaffAuthGuard, StaffPermissionsGuard)
export class StaffOrdersController {
  constructor(private readonly ordersService: StaffOrdersService) {}

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
