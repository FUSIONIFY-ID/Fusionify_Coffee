import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssetStatus,
  InventoryItemType,
  PurchaseOrderStatus,
  StockMovementType,
} from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import { StaffAuthService } from '../staff/staff-auth.service';
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

@Injectable()
export class OperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly staffAuthService: StaffAuthService,
  ) {}

  async listInventory(
    staffOutletId: string | null,
    requestedOutletId?: string,
  ) {
    const outletId = this.resolveOutlet(staffOutletId, requestedOutletId);
    return this.prisma.outletInventory.findMany({
      where: { outletId },
      include: { inventoryItem: true },
      orderBy: { inventoryItem: { name: 'asc' } },
    });
  }

  listInventoryItems() {
    return this.prisma.inventoryItem.findMany({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
  }

  async upsertInventoryItem(
    staffUserId: string,
    skuValue: string,
    input: UpsertInventoryItemInput,
  ) {
    const sku = skuValue.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{2,40}$/.test(sku)) {
      throw new BadRequestException('Inventory SKU is invalid.');
    }
    const name = this.requiredText(input.name, 'name', 100);
    const baseUnit = this.requiredText(input.baseUnit, 'baseUnit', 24);
    if (!Object.values(InventoryItemType).includes(input.type)) {
      throw new BadRequestException('Inventory item type is invalid.');
    }
    const cost = input.costPerBaseUnit ?? 0;
    if (!Number.isInteger(cost) || cost < 0) {
      throw new BadRequestException('costPerBaseUnit must be non-negative.');
    }
    const item = await this.prisma.inventoryItem.upsert({
      where: { sku },
      update: {
        name,
        type: input.type,
        baseUnit,
        costPerBaseUnit: cost,
        active: input.active ?? true,
      },
      create: {
        sku,
        name,
        type: input.type,
        baseUnit,
        costPerBaseUnit: cost,
        active: input.active ?? true,
      },
    });
    await this.staffAuthService.audit(staffUserId, 'INVENTORY_ITEM_UPDATED', {
      targetType: 'InventoryItem',
      targetId: item.id,
      metadata: { sku: item.sku, type: item.type },
    });
    return item;
  }

  async setRecipe(
    staffUserId: string,
    productId: string,
    items: RecipeItemInput[],
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found.');
    if (!Array.isArray(items))
      throw new BadRequestException('items is required.');
    const ids = new Set<string>();
    for (const item of items) {
      if (!item.inventoryItemId || ids.has(item.inventoryItemId)) {
        throw new BadRequestException('Recipe inventory items must be unique.');
      }
      if (
        !Number.isInteger(item.quantityBaseUnit) ||
        item.quantityBaseUnit <= 0
      ) {
        throw new BadRequestException(
          'Recipe quantities must be positive integers.',
        );
      }
      ids.add(item.inventoryItemId);
    }
    const known = await this.prisma.inventoryItem.count({
      where: { id: { in: [...ids] }, active: true },
    });
    if (known !== ids.size) {
      throw new BadRequestException(
        'Recipe contains unavailable inventory item.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.productRecipeItem.deleteMany({ where: { productId } });
      if (items.length > 0) {
        await tx.productRecipeItem.createMany({
          data: items.map((item) => ({ productId, ...item })),
        });
      }
    });
    await this.staffAuthService.audit(staffUserId, 'PRODUCT_RECIPE_UPDATED', {
      targetType: 'Product',
      targetId: productId,
      metadata: { itemCount: items.length },
    });
    return this.prisma.productRecipeItem.findMany({
      where: { productId },
      include: { inventoryItem: true },
    });
  }

  async adjustStock(
    staffUserId: string,
    staffOutletId: string | null,
    input: AdjustStockInput,
  ) {
    const outletId = this.resolveOutlet(staffOutletId, input.outletId);
    if (!Object.values(StockMovementType).includes(input.type)) {
      throw new BadRequestException('Stock movement type is invalid.');
    }
    if (
      !Number.isInteger(input.quantityBaseUnit) ||
      input.quantityBaseUnit === 0
    ) {
      throw new BadRequestException(
        'quantityBaseUnit must be a non-zero integer.',
      );
    }
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: input.inventoryItemId },
    });
    if (!item) throw new NotFoundException('Inventory item not found.');

    const result = await this.prisma.$transaction(async (tx) => {
      const level = await tx.outletInventory.upsert({
        where: {
          outletId_inventoryItemId: {
            outletId,
            inventoryItemId: item.id,
          },
        },
        update: {},
        create: { outletId, inventoryItemId: item.id },
      });
      const nextBalance = level.onHandBaseUnit + input.quantityBaseUnit;
      if (nextBalance < 0) {
        throw new ConflictException('Stock cannot become negative.');
      }
      const updated = await tx.outletInventory.update({
        where: { id: level.id },
        data: { onHandBaseUnit: nextBalance },
      });
      const movement = await tx.stockMovement.create({
        data: {
          outletId,
          inventoryItemId: item.id,
          type: input.type,
          quantityBaseUnit: input.quantityBaseUnit,
          balanceAfterBaseUnit: nextBalance,
          reason: input.reason?.trim().slice(0, 240) || null,
          staffUserId,
        },
      });
      return { level: updated, movement };
    });
    await this.staffAuthService.audit(staffUserId, 'STOCK_ADJUSTED', {
      targetType: 'InventoryItem',
      targetId: item.id,
      metadata: {
        outletId,
        type: input.type,
        quantityBaseUnit: input.quantityBaseUnit,
      },
    });
    return result;
  }

  listSuppliers() {
    return this.prisma.supplier.findMany({
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
  }

  async createSupplier(staffUserId: string, input: CreateSupplierInput) {
    const supplier = await this.prisma.supplier.create({
      data: {
        name: this.requiredText(input.name, 'name', 100),
        contactName: input.contactName?.trim().slice(0, 100) || null,
        phone: input.phone?.trim().slice(0, 40) || null,
        email: input.email?.trim().toLowerCase().slice(0, 160) || null,
        address: input.address?.trim().slice(0, 240) || null,
      },
    });
    await this.staffAuthService.audit(staffUserId, 'SUPPLIER_CREATED', {
      targetType: 'Supplier',
      targetId: supplier.id,
    });
    return supplier;
  }

  async listPurchaseOrders(
    staffOutletId: string | null,
    requestedOutletId?: string,
  ) {
    const outletId = this.resolveOutlet(staffOutletId, requestedOutletId);
    return this.prisma.purchaseOrder.findMany({
      where: { outletId },
      include: { supplier: true, items: { include: { inventoryItem: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async createPurchaseOrder(
    staffUserId: string,
    staffOutletId: string | null,
    input: CreatePurchaseOrderInput,
  ) {
    const outletId = this.resolveOutlet(staffOutletId, input.outletId);
    const currency = this.normalizeCurrency(input.currency);
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new BadRequestException('Purchase order requires items.');
    }
    const itemIds = new Set<string>();
    for (const item of input.items) {
      if (!item.inventoryItemId || itemIds.has(item.inventoryItemId)) {
        throw new BadRequestException('Purchase items must be unique.');
      }
      if (
        !Number.isInteger(item.quantityBaseUnit) ||
        item.quantityBaseUnit <= 0 ||
        !Number.isInteger(item.unitCost) ||
        item.unitCost < 0
      ) {
        throw new BadRequestException('Purchase item values are invalid.');
      }
      itemIds.add(item.inventoryItemId);
    }
    const [supplier, inventoryCount] = await Promise.all([
      this.prisma.supplier.findUnique({ where: { id: input.supplierId } }),
      this.prisma.inventoryItem.count({ where: { id: { in: [...itemIds] } } }),
    ]);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    if (inventoryCount !== itemIds.size) {
      throw new BadRequestException(
        'Unknown inventory item in purchase order.',
      );
    }
    const purchaseOrder = await this.prisma.purchaseOrder.create({
      data: {
        supplierId: supplier.id,
        outletId,
        currency,
        notes: input.notes?.trim().slice(0, 500) || null,
        createdById: staffUserId,
        items: { create: input.items },
      },
      include: { supplier: true, items: true },
    });
    await this.staffAuthService.audit(staffUserId, 'PURCHASE_ORDER_CREATED', {
      targetType: 'PurchaseOrder',
      targetId: purchaseOrder.id,
      metadata: { outletId, supplierId: supplier.id },
    });
    return purchaseOrder;
  }

  async markPurchaseOrdered(
    staffUserId: string,
    staffOutletId: string | null,
    purchaseOrderId: string,
  ) {
    const purchaseOrder = await this.purchaseOrderForScope(
      staffOutletId,
      purchaseOrderId,
    );
    if (purchaseOrder.status !== PurchaseOrderStatus.DRAFT) {
      throw new ConflictException('Only draft purchase orders can be ordered.');
    }
    const updated = await this.prisma.purchaseOrder.update({
      where: { id: purchaseOrder.id },
      data: { status: PurchaseOrderStatus.ORDERED, orderedAt: new Date() },
    });
    await this.staffAuthService.audit(staffUserId, 'PURCHASE_ORDER_ORDERED', {
      targetType: 'PurchaseOrder',
      targetId: updated.id,
    });
    return updated;
  }

  async receivePurchaseOrder(
    staffUserId: string,
    staffOutletId: string | null,
    purchaseOrderId: string,
    input: ReceivePurchaseOrderInput,
  ) {
    const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
      where: {
        id: purchaseOrderId,
        ...(staffOutletId ? { outletId: staffOutletId } : {}),
      },
      include: { items: true },
    });
    if (!purchaseOrder)
      throw new NotFoundException('Purchase order not found.');
    if (
      ![
        PurchaseOrderStatus.ORDERED,
        PurchaseOrderStatus.PARTIALLY_RECEIVED,
      ].includes(purchaseOrder.status)
    ) {
      throw new ConflictException('Purchase order cannot receive stock now.');
    }
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new BadRequestException('Receiving requires item quantities.');
    }
    const requested = new Map(
      input.items.map((item) => [item.inventoryItemId, item.quantityBaseUnit]),
    );
    if (requested.size !== input.items.length) {
      throw new BadRequestException('Receiving items must be unique.');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const poItem of purchaseOrder.items) {
        const quantity = requested.get(poItem.inventoryItemId) ?? 0;
        if (!Number.isInteger(quantity) || quantity < 0) {
          throw new BadRequestException('Received quantity is invalid.');
        }
        const remaining = poItem.quantityBaseUnit - poItem.receivedBaseUnit;
        if (quantity > remaining) {
          throw new BadRequestException(
            'Received quantity exceeds ordered quantity.',
          );
        }
        if (quantity === 0) continue;

        const level = await tx.outletInventory.upsert({
          where: {
            outletId_inventoryItemId: {
              outletId: purchaseOrder.outletId,
              inventoryItemId: poItem.inventoryItemId,
            },
          },
          update: {},
          create: {
            outletId: purchaseOrder.outletId,
            inventoryItemId: poItem.inventoryItemId,
          },
        });
        const nextBalance = level.onHandBaseUnit + quantity;
        await tx.outletInventory.update({
          where: { id: level.id },
          data: { onHandBaseUnit: nextBalance },
        });
        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { receivedBaseUnit: { increment: quantity } },
        });
        await tx.stockMovement.create({
          data: {
            outletId: purchaseOrder.outletId,
            inventoryItemId: poItem.inventoryItemId,
            type: StockMovementType.PURCHASE,
            quantityBaseUnit: quantity,
            balanceAfterBaseUnit: nextBalance,
            reason: `Purchase order ${purchaseOrder.id}`,
            staffUserId,
          },
        });
      }

      const freshItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: purchaseOrder.id },
      });
      const complete = freshItems.every(
        (item) => item.receivedBaseUnit >= item.quantityBaseUnit,
      );
      const anyReceived = freshItems.some((item) => item.receivedBaseUnit > 0);
      const updated = await tx.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: {
          status: complete
            ? PurchaseOrderStatus.RECEIVED
            : anyReceived
              ? PurchaseOrderStatus.PARTIALLY_RECEIVED
              : purchaseOrder.status,
          ...(complete
            ? { receivedAt: new Date(), receivedById: staffUserId }
            : {}),
        },
        include: { supplier: true, items: true },
      });
      await this.staffAuthService.audit(
        staffUserId,
        'PURCHASE_ORDER_RECEIVED',
        {
          targetType: 'PurchaseOrder',
          targetId: updated.id,
          metadata: { complete },
        },
      );
      return updated;
    });
  }

  async listAssets(staffOutletId: string | null, requestedOutletId?: string) {
    const outletId = this.resolveOutlet(staffOutletId, requestedOutletId);
    return this.prisma.asset.findMany({
      where: { outletId },
      include: { maintenances: { orderBy: { performedAt: 'desc' }, take: 5 } },
      orderBy: { name: 'asc' },
    });
  }

  async createAsset(
    staffUserId: string,
    staffOutletId: string | null,
    input: CreateAssetInput,
  ) {
    const outletId = this.resolveOutlet(staffOutletId, input.outletId);
    const assetTag = this.requiredText(input.assetTag, 'assetTag', 60);
    const purchaseDate = input.purchaseDate
      ? this.parseDate(input.purchaseDate, 'purchaseDate')
      : null;
    if (
      input.purchaseCost != null &&
      (!Number.isInteger(input.purchaseCost) || input.purchaseCost < 0)
    ) {
      throw new BadRequestException('purchaseCost must be non-negative.');
    }
    const asset = await this.prisma.asset.create({
      data: {
        assetTag,
        outletId,
        name: this.requiredText(input.name, 'name', 100),
        category: this.requiredText(input.category, 'category', 60),
        status: input.status ?? AssetStatus.ACTIVE,
        purchaseDate,
        purchaseCost: input.purchaseCost ?? null,
        serialNumber: input.serialNumber?.trim().slice(0, 100) || null,
        notes: input.notes?.trim().slice(0, 500) || null,
      },
    });
    await this.staffAuthService.audit(staffUserId, 'ASSET_CREATED', {
      targetType: 'Asset',
      targetId: asset.id,
      metadata: { outletId, assetTag },
    });
    return asset;
  }

  async addMaintenance(
    staffUserId: string,
    staffOutletId: string | null,
    assetId: string,
    input: MaintenanceInput,
  ) {
    const asset = await this.prisma.asset.findFirst({
      where: {
        id: assetId,
        ...(staffOutletId ? { outletId: staffOutletId } : {}),
      },
    });
    if (!asset) throw new NotFoundException('Asset not found.');
    if (
      input.cost != null &&
      (!Number.isInteger(input.cost) || input.cost < 0)
    ) {
      throw new BadRequestException('Maintenance cost must be non-negative.');
    }
    const maintenance = await this.prisma.assetMaintenance.create({
      data: {
        assetId: asset.id,
        staffUserId,
        description: this.requiredText(input.description, 'description', 500),
        cost: input.cost ?? null,
        performedAt: this.parseDate(input.performedAt, 'performedAt'),
      },
    });
    await this.staffAuthService.audit(staffUserId, 'ASSET_MAINTENANCE_ADDED', {
      targetType: 'Asset',
      targetId: asset.id,
      metadata: { maintenanceId: maintenance.id },
    });
    return maintenance;
  }

  private async purchaseOrderForScope(
    staffOutletId: string | null,
    purchaseOrderId: string,
  ) {
    const row = await this.prisma.purchaseOrder.findFirst({
      where: {
        id: purchaseOrderId,
        ...(staffOutletId ? { outletId: staffOutletId } : {}),
      },
    });
    if (!row) throw new NotFoundException('Purchase order not found.');
    return row;
  }

  private resolveOutlet(staffOutletId: string | null, requested?: string) {
    if (staffOutletId) {
      if (requested && requested !== staffOutletId) {
        throw new NotFoundException('Outlet not found.');
      }
      return staffOutletId;
    }
    if (!requested) {
      throw new BadRequestException('outletId is required for global staff.');
    }
    return requested;
  }

  private requiredText(value: string, field: string, max: number) {
    const text = value?.trim();
    if (!text || text.length > max) {
      throw new BadRequestException(`${field} is required.`);
    }
    return text;
  }

  private normalizeCurrency(value: string) {
    const currency = value?.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new BadRequestException('Currency must be a 3-letter code.');
    }
    return currency;
  }

  private parseDate(value: string, field: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO date.`);
    }
    return date;
  }
}
