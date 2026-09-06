import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedStaffRequest } from '../staff/staff-auth.guard';
import { StaffAuthGuard } from '../staff/staff-auth.guard';
import { RequireStaffPermissions } from '../staff/staff.decorators';
import { StaffPermissionsGuard } from '../staff/staff-permissions.guard';
import { StaffPermission } from '../staff/staff.types';
import { CatalogAdminService } from './catalog-admin.service';
import type {
  SetOutletProductAvailabilityInput,
  UpsertCampaignInput,
  UpsertCategoryInput,
  UpsertOutletInput,
  UpsertProductInput,
} from './catalog-admin.types';

@Controller('v1/staff/catalog')
@UseGuards(StaffAuthGuard, StaffPermissionsGuard)
@RequireStaffPermissions(StaffPermission.CatalogManage)
export class StaffCatalogController {
  constructor(private readonly catalogAdminService: CatalogAdminService) {}

  @Get()
  overview() {
    return this.catalogAdminService.overview();
  }

  @Put('outlets/:outletId')
  upsertOutlet(
    @Req() request: AuthenticatedStaffRequest,
    @Param('outletId') outletId: string,
    @Body() body: UpsertOutletInput,
  ) {
    return this.catalogAdminService.upsertOutlet(
      request.staffAuth!.staffUserId,
      outletId,
      body,
    );
  }

  @Put('categories/:categoryId')
  upsertCategory(
    @Req() request: AuthenticatedStaffRequest,
    @Param('categoryId') categoryId: string,
    @Body() body: UpsertCategoryInput,
  ) {
    return this.catalogAdminService.upsertCategory(
      request.staffAuth!.staffUserId,
      categoryId,
      body,
    );
  }

  @Put('products/:productId')
  upsertProduct(
    @Req() request: AuthenticatedStaffRequest,
    @Param('productId') productId: string,
    @Body() body: UpsertProductInput,
  ) {
    return this.catalogAdminService.upsertProduct(
      request.staffAuth!.staffUserId,
      productId,
      body,
    );
  }

  @Put('campaigns/:campaignId')
  upsertCampaign(
    @Req() request: AuthenticatedStaffRequest,
    @Param('campaignId') campaignId: string,
    @Body() body: UpsertCampaignInput,
  ) {
    return this.catalogAdminService.upsertCampaign(
      request.staffAuth!.staffUserId,
      campaignId,
      body,
    );
  }

  @Put('outlets/:outletId/products/:productId')
  setAvailability(
    @Req() request: AuthenticatedStaffRequest,
    @Param('outletId') outletId: string,
    @Param('productId') productId: string,
    @Body() body: SetOutletProductAvailabilityInput,
  ) {
    return this.catalogAdminService.setAvailability(
      request.staffAuth!.staffUserId,
      outletId,
      productId,
      body,
    );
  }
}
