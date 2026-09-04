import type {
  AssetStatus,
  InventoryItemType,
  StockMovementType,
} from '../generated/prisma/enums';

export type UpsertInventoryItemInput = {
  name: string;
  type: InventoryItemType;
  baseUnit: string;
  costPerBaseUnit?: number;
  active?: boolean;
};

export type RecipeItemInput = {
  inventoryItemId: string;
  quantityBaseUnit: number;
};

export type AdjustStockInput = {
  outletId?: string;
  inventoryItemId: string;
  type: StockMovementType;
  quantityBaseUnit: number;
  reason?: string;
};

export type CreateSupplierInput = {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export type CreatePurchaseOrderInput = {
  outletId?: string;
  supplierId: string;
  currency: string;
  notes?: string;
  items: Array<{
    inventoryItemId: string;
    quantityBaseUnit: number;
    unitCost: number;
  }>;
};

export type ReceivePurchaseOrderInput = {
  items: Array<{
    inventoryItemId: string;
    quantityBaseUnit: number;
  }>;
};

export type CreateAssetInput = {
  outletId?: string;
  assetTag: string;
  name: string;
  category: string;
  status?: AssetStatus;
  purchaseDate?: string | null;
  purchaseCost?: number | null;
  serialNumber?: string | null;
  notes?: string | null;
};

export type MaintenanceInput = {
  description: string;
  cost?: number | null;
  performedAt: string;
};
