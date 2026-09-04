import {
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
import { RewardCatalogService } from './reward-catalog.service';

@Controller('v1/rewards/catalog')
@UseGuards(CustomerAuthGuard)
export class RewardCatalogController {
  constructor(private readonly rewardCatalogService: RewardCatalogService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.rewardCatalogService.listForCustomer(
      request.auth!.userId,
      acceptLanguage,
    );
  }

  @Post(':itemId/redeem')
  redeem(
    @Req() request: AuthenticatedRequest,
    @Param('itemId') itemId: string,
    @Headers('idempotency-key') idempotencyKey = '',
  ) {
    return this.rewardCatalogService.redeem(
      request.auth!.userId,
      itemId,
      idempotencyKey,
    );
  }
}
