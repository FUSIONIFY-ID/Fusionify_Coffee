import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { CustomerAuthGuard } from '../auth/auth.guard';
import { OrdersService } from './orders.service';
import type { CreateOrderInput } from './orders.types';

@Controller('v1/orders')
@UseGuards(CustomerAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateOrderInput,
    @Headers('idempotency-key') idempotencyKey = '',
  ) {
    return this.ordersService.create(
      body,
      idempotencyKey,
      request.auth!.userId,
    );
  }

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.ordersService.listForUser(request.auth!.userId);
  }

  @Get(':orderId')
  getById(
    @Req() request: AuthenticatedRequest,
    @Param('orderId') orderId: string,
  ) {
    return this.ordersService.getById(orderId, request.auth!.userId);
  }
}
