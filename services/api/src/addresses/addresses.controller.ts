import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { CustomerAuthGuard } from '../auth/auth.guard';
import type { SaveAddressInput } from './addresses.types';
import { AddressesService } from './addresses.service';

@Controller('v1/addresses')
@UseGuards(CustomerAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.addressesService.list(request.auth!.userId);
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() body: SaveAddressInput) {
    return this.addressesService.create(request.auth!.userId, body);
  }

  @Put(':addressId')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('addressId') addressId: string,
    @Body() body: SaveAddressInput,
  ) {
    return this.addressesService.update(request.auth!.userId, addressId, body);
  }

  @Delete(':addressId')
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('addressId') addressId: string,
  ) {
    return this.addressesService.remove(request.auth!.userId, addressId);
  }

  @Get(':addressId/delivery-quote')
  quote(
    @Req() request: AuthenticatedRequest,
    @Param('addressId') addressId: string,
    @Query('outletId') outletId = '',
  ) {
    return this.addressesService.quote(
      request.auth!.userId,
      addressId,
      outletId,
    );
  }
}
