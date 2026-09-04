import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { CustomerAuthGuard } from '../auth/auth.guard';
import { RewardsService } from './rewards.service';

@Controller('v1/rewards')
@UseGuards(CustomerAuthGuard)
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return this.rewardsService.getCustomerSummary(request.auth!.userId);
  }
}
