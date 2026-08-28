import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderInput } from './orders.types';

@Controller('v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Body() body: CreateOrderInput,
    @Headers('idempotency-key') idempotencyKey = '',
  ) {
    return this.ordersService.create(body, idempotencyKey);
  }

  @Get(':orderId')
  getById(@Param('orderId') orderId: string) {
    return this.ordersService.getById(orderId);
  }
}
