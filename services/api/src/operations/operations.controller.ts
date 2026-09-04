import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedStaffRequest } from '../staff/staff-auth.guard';
import { StaffAuthGuard } from '../staff/staff-auth.guard';
import { RequireStaffPermissions } from '../staff/staff.decorators';
import { StaffPermissionsGuard } from '../staff/staff-permissions.guard';
import { StaffPermission } from '../staff/staff.types';
import { OperationsService } from './operations.service';
import type {
  AdjustStockInput,
  CreateAssetInput,
  CreatePurchaseOrderInput,
  CreateSupplierInput,
  MaintenanceInput,
  ReceivePurchaseOrderInput,
  RecipeItemInput,
  UpsertInventoryItemInput,
} from './operations.types';

@Controller('v1/staff/operations')
@UseGuards(StaffAuthGuard, StaffPermissionsGuard)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get('inventory')
  @RequireStaffPermissions(StaffPermission.InventoryRead)
  inventory(
    @Req() request: AuthenticatedStaffRequest,
    @Query('outletId') outletId?: string,
  ) {
    return this.operationsService.listInventory(
      request.staffAuth!.outletId,
      outletId,
    );
  }

  @Get('inventory/items')
  @RequireStaffPermissions(StaffPermission.InventoryRead)
  inventoryItems() {
    return this.operationsService.listInventoryItems();
  }

  @Put('inventory/items/:sku')
  @RequireStaffPermissions(StaffPermission.InventoryManage)
  upsertInventoryItem(
    @Req() request: AuthenticatedStaffRequest,
    @Param('sku') sku: string,
    @Body() body: UpsertInventoryItemInput,
  ) {
    return this.operationsService.upsertInventoryItem(
      request.staffAuth!.staffUserId,
      sku,
      body,
    );
  }

  @Put('recipes/:productId')
  @RequireStaffPermissions(StaffPermission.InventoryManage)
  setRecipe(
    @Req() request: AuthenticatedStaffRequest,
    @Param('productId') productId: string,
    @Body() body: { items: RecipeItemInput[] },
  ) {
    return this.operationsService.setRecipe(
      request.staffAuth!.staffUserId,
      productId,
      body.items,
    );
  }

  @Post('inventory/adjust')
  @RequireStaffPermissions(StaffPermission.InventoryManage)
  adjust(
    @Req() request: AuthenticatedStaffRequest,
    @Body() body: AdjustStockInput,
  ) {
    return this.operationsService.adjustStock(
      request.staffAuth!.staffUserId,
      request.staffAuth!.outletId,
      body,
    );
  }

  @Get('suppliers')
  @RequireStaffPermissions(StaffPermission.InventoryRead)
  suppliers() {
    return this.operationsService.listSuppliers();
  }

  @Post('suppliers')
  @RequireStaffPermissions(StaffPermission.InventoryManage)
  createSupplier(
    @Req() request: AuthenticatedStaffRequest,
    @Body() body: CreateSupplierInput,
  ) {
    return this.operationsService.createSupplier(
      request.staffAuth!.staffUserId,
      body,
    );
  }

  @Get('purchase-orders')
  @RequireStaffPermissions(StaffPermission.InventoryRead)
  purchaseOrders(
    @Req() request: AuthenticatedStaffRequest,
    @Query('outletId') outletId?: string,
  ) {
    return this.operationsService.listPurchaseOrders(
      request.staffAuth!.outletId,
      outletId,
    );
  }

  @Post('purchase-orders')
  @RequireStaffPermissions(StaffPermission.InventoryManage)
  createPurchaseOrder(
    @Req() request: AuthenticatedStaffRequest,
    @Body() body: CreatePurchaseOrderInput,
  ) {
    return this.operationsService.createPurchaseOrder(
      request.staffAuth!.staffUserId,
      request.staffAuth!.outletId,
      body,
    );
  }

  @Post('purchase-orders/:purchaseOrderId/order')
  @RequireStaffPermissions(StaffPermission.InventoryManage)
  orderPurchase(
    @Req() request: AuthenticatedStaffRequest,
    @Param('purchaseOrderId') purchaseOrderId: string,
  ) {
    return this.operationsService.markPurchaseOrdered(
      request.staffAuth!.staffUserId,
      request.staffAuth!.outletId,
      purchaseOrderId,
    );
  }

  @Post('purchase-orders/:purchaseOrderId/receive')
  @RequireStaffPermissions(StaffPermission.InventoryManage)
  receivePurchase(
    @Req() request: AuthenticatedStaffRequest,
    @Param('purchaseOrderId') purchaseOrderId: string,
    @Body() body: ReceivePurchaseOrderInput,
  ) {
    return this.operationsService.receivePurchaseOrder(
      request.staffAuth!.staffUserId,
      request.staffAuth!.outletId,
      purchaseOrderId,
      body,
    );
  }

  @Get('assets')
  @RequireStaffPermissions(StaffPermission.InventoryRead)
  assets(
    @Req() request: AuthenticatedStaffRequest,
    @Query('outletId') outletId?: string,
  ) {
    return this.operationsService.listAssets(
      request.staffAuth!.outletId,
      outletId,
    );
  }

  @Post('assets')
  @RequireStaffPermissions(StaffPermission.InventoryManage)
  createAsset(
    @Req() request: AuthenticatedStaffRequest,
    @Body() body: CreateAssetInput,
  ) {
    return this.operationsService.createAsset(
      request.staffAuth!.staffUserId,
      request.staffAuth!.outletId,
      body,
    );
  }

  @Post('assets/:assetId/maintenance')
  @RequireStaffPermissions(StaffPermission.InventoryManage)
  addMaintenance(
    @Req() request: AuthenticatedStaffRequest,
    @Param('assetId') assetId: string,
    @Body() body: MaintenanceInput,
  ) {
    return this.operationsService.addMaintenance(
      request.staffAuth!.staffUserId,
      request.staffAuth!.outletId,
      assetId,
      body,
    );
  }
}
