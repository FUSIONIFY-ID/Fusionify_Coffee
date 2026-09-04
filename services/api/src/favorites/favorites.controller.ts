import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { CustomerAuthGuard } from '../auth/auth.guard';
import { FavoritesService } from './favorites.service';

@Controller('v1/account/favorites')
@UseGuards(CustomerAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.favoritesService.list(request.auth!.userId);
  }

  @Post(':productId')
  add(
    @Req() request: AuthenticatedRequest,
    @Param('productId') productId: string,
  ) {
    return this.favoritesService.add(request.auth!.userId, productId);
  }

  @Delete(':productId')
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('productId') productId: string,
  ) {
    return this.favoritesService.remove(request.auth!.userId, productId);
  }
}
