CREATE TYPE "FulfillmentType" AS ENUM ('PICKUP', 'DELIVERY');
CREATE TYPE "VoucherDiscountType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE_BPS');
CREATE TYPE "CustomerVoucherStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'REDEEMED');
CREATE TYPE "VoucherRedemptionStatus" AS ENUM ('RESERVED', 'APPLIED', 'RELEASED');
CREATE TYPE "InventoryItemType" AS ENUM ('INGREDIENT', 'PACKAGING', 'SUPPLY');
CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE', 'SALE', 'WASTE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT', 'RETURN', 'EXPIRED', 'DAMAGED', 'STOCK_OPNAME');
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'RETIRED', 'LOST');
CREATE TYPE "DigitalBenefitType" AS ENUM ('WIFI', 'AI');

ALTER TABLE "Outlet"
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'IDR',
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION,
  ADD COLUMN "deliveryRadiusMeters" INTEGER,
  ADD COLUMN "deliveryBaseFee" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "deliveryPerKmFee" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Order"
  ADD COLUMN "fulfillmentType" "FulfillmentType" NOT NULL DEFAULT 'PICKUP',
  ADD COLUMN "scheduledFor" TIMESTAMP(3),
  ADD COLUMN "savedAddressId" TEXT,
  ADD COLUMN "deliveryAddressSnapshot" JSONB,
  ADD COLUMN "deliveryDistanceMeters" INTEGER,
  ADD COLUMN "deliveryFee" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "discountAmount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "Voucher" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "translations" JSONB,
  "currency" TEXT NOT NULL,
  "discountType" "VoucherDiscountType" NOT NULL,
  "discountValue" INTEGER NOT NULL,
  "minimumSpend" INTEGER NOT NULL DEFAULT 0,
  "maximumDiscount" INTEGER,
  "outletId" TEXT,
  "validFrom" TIMESTAMP(3) NOT NULL,
  "validUntil" TIMESTAMP(3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerVoucher" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "voucherId" TEXT NOT NULL,
  "status" "CustomerVoucherStatus" NOT NULL DEFAULT 'AVAILABLE',
  "source" TEXT NOT NULL DEFAULT 'CAMPAIGN',
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "CustomerVoucher_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoucherRedemption" (
  "id" TEXT NOT NULL,
  "customerVoucherId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" "VoucherRedemptionStatus" NOT NULL DEFAULT 'RESERVED',
  "discountAmount" INTEGER NOT NULL,
  "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "appliedAt" TIMESTAMP(3),
  "releasedAt" TIMESTAMP(3),
  CONSTRAINT "VoucherRedemption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RewardCatalogItem" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "translations" JSONB,
  "currency" TEXT NOT NULL,
  "pointsCost" INTEGER NOT NULL,
  "voucherId" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "stockLimit" INTEGER,
  "redeemedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RewardCatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RewardRedemption" (
  "id" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rewardItemId" TEXT NOT NULL,
  "customerVoucherId" TEXT NOT NULL,
  "pointsSpent" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RewardRedemption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SavedAddress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "recipientName" TEXT NOT NULL,
  "phoneE164" TEXT NOT NULL,
  "line1" TEXT NOT NULL,
  "line2" TEXT,
  "city" TEXT NOT NULL,
  "region" TEXT,
  "postalCode" TEXT,
  "country" "PhoneCountry" NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "deliveryNotes" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SavedAddress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryItem" (
  "id" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "InventoryItemType" NOT NULL,
  "baseUnit" TEXT NOT NULL,
  "costPerBaseUnit" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductRecipeItem" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "quantityBaseUnit" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductRecipeItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OutletInventory" (
  "id" TEXT NOT NULL,
  "outletId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "onHandBaseUnit" INTEGER NOT NULL DEFAULT 0,
  "reorderPointBaseUnit" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OutletInventory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockMovement" (
  "id" TEXT NOT NULL,
  "outletId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "type" "StockMovementType" NOT NULL,
  "quantityBaseUnit" INTEGER NOT NULL,
  "balanceAfterBaseUnit" INTEGER NOT NULL,
  "reason" TEXT,
  "orderId" TEXT,
  "staffUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Supplier" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "contactName" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "address" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseOrder" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "outletId" TEXT NOT NULL,
  "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "currency" TEXT NOT NULL,
  "notes" TEXT,
  "createdById" TEXT NOT NULL,
  "receivedById" TEXT,
  "orderedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseOrderItem" (
  "id" TEXT NOT NULL,
  "purchaseOrderId" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "quantityBaseUnit" INTEGER NOT NULL,
  "receivedBaseUnit" INTEGER NOT NULL DEFAULT 0,
  "unitCost" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Asset" (
  "id" TEXT NOT NULL,
  "assetTag" TEXT NOT NULL,
  "outletId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
  "purchaseDate" TIMESTAMP(3),
  "purchaseCost" INTEGER,
  "serialNumber" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssetMaintenance" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "staffUserId" TEXT,
  "description" TEXT NOT NULL,
  "cost" INTEGER,
  "performedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssetMaintenance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WifiBenefitConfig" (
  "id" TEXT NOT NULL,
  "outletId" TEXT NOT NULL,
  "ssid" TEXT NOT NULL,
  "passwordEncrypted" TEXT NOT NULL,
  "entitlementHours" INTEGER NOT NULL DEFAULT 8,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WifiBenefitConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiBenefitConfig" (
  "id" TEXT NOT NULL,
  "outletId" TEXT NOT NULL,
  "dailyQuota" INTEGER NOT NULL DEFAULT 30,
  "entitlementHours" INTEGER NOT NULL DEFAULT 24,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiBenefitConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DigitalBenefitEntitlement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "type" "DigitalBenefitType" NOT NULL,
  "payloadEncrypted" TEXT,
  "quotaTotal" INTEGER,
  "quotaUsed" INTEGER NOT NULL DEFAULT 0,
  "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validUntil" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DigitalBenefitEntitlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Voucher_code_key" ON "Voucher"("code");
CREATE INDEX "Voucher_currency_active_validFrom_validUntil_idx" ON "Voucher"("currency", "active", "validFrom", "validUntil");
CREATE INDEX "Voucher_outletId_active_idx" ON "Voucher"("outletId", "active");
CREATE INDEX "CustomerVoucher_userId_status_issuedAt_idx" ON "CustomerVoucher"("userId", "status", "issuedAt");
CREATE INDEX "CustomerVoucher_voucherId_idx" ON "CustomerVoucher"("voucherId");
CREATE UNIQUE INDEX "VoucherRedemption_customerVoucherId_key" ON "VoucherRedemption"("customerVoucherId");
CREATE UNIQUE INDEX "VoucherRedemption_orderId_key" ON "VoucherRedemption"("orderId");
CREATE INDEX "VoucherRedemption_status_reservedAt_idx" ON "VoucherRedemption"("status", "reservedAt");
CREATE INDEX "RewardCatalogItem_currency_active_pointsCost_idx" ON "RewardCatalogItem"("currency", "active", "pointsCost");
CREATE UNIQUE INDEX "RewardRedemption_idempotencyKey_key" ON "RewardRedemption"("idempotencyKey");
CREATE UNIQUE INDEX "RewardRedemption_customerVoucherId_key" ON "RewardRedemption"("customerVoucherId");
CREATE INDEX "RewardRedemption_userId_createdAt_idx" ON "RewardRedemption"("userId", "createdAt");
CREATE INDEX "RewardRedemption_rewardItemId_createdAt_idx" ON "RewardRedemption"("rewardItemId", "createdAt");
CREATE INDEX "SavedAddress_userId_isDefault_idx" ON "SavedAddress"("userId", "isDefault");
CREATE UNIQUE INDEX "InventoryItem_sku_key" ON "InventoryItem"("sku");
CREATE INDEX "InventoryItem_type_active_idx" ON "InventoryItem"("type", "active");
CREATE UNIQUE INDEX "ProductRecipeItem_productId_inventoryItemId_key" ON "ProductRecipeItem"("productId", "inventoryItemId");
CREATE INDEX "ProductRecipeItem_inventoryItemId_idx" ON "ProductRecipeItem"("inventoryItemId");
CREATE UNIQUE INDEX "OutletInventory_outletId_inventoryItemId_key" ON "OutletInventory"("outletId", "inventoryItemId");
CREATE INDEX "OutletInventory_outletId_onHandBaseUnit_idx" ON "OutletInventory"("outletId", "onHandBaseUnit");
CREATE INDEX "StockMovement_outletId_inventoryItemId_createdAt_idx" ON "StockMovement"("outletId", "inventoryItemId", "createdAt");
CREATE INDEX "StockMovement_orderId_createdAt_idx" ON "StockMovement"("orderId", "createdAt");
CREATE INDEX "Supplier_active_name_idx" ON "Supplier"("active", "name");
CREATE INDEX "PurchaseOrder_outletId_status_createdAt_idx" ON "PurchaseOrder"("outletId", "status", "createdAt");
CREATE INDEX "PurchaseOrder_supplierId_status_idx" ON "PurchaseOrder"("supplierId", "status");
CREATE UNIQUE INDEX "PurchaseOrderItem_purchaseOrderId_inventoryItemId_key" ON "PurchaseOrderItem"("purchaseOrderId", "inventoryItemId");
CREATE UNIQUE INDEX "Asset_assetTag_key" ON "Asset"("assetTag");
CREATE INDEX "Asset_outletId_status_idx" ON "Asset"("outletId", "status");
CREATE INDEX "AssetMaintenance_assetId_performedAt_idx" ON "AssetMaintenance"("assetId", "performedAt");
CREATE UNIQUE INDEX "WifiBenefitConfig_outletId_key" ON "WifiBenefitConfig"("outletId");
CREATE UNIQUE INDEX "AiBenefitConfig_outletId_key" ON "AiBenefitConfig"("outletId");
CREATE UNIQUE INDEX "DigitalBenefitEntitlement_orderId_type_key" ON "DigitalBenefitEntitlement"("orderId", "type");
CREATE INDEX "DigitalBenefitEntitlement_userId_type_validUntil_idx" ON "DigitalBenefitEntitlement"("userId", "type", "validUntil");
CREATE INDEX "Order_fulfillmentType_scheduledFor_idx" ON "Order"("fulfillmentType", "scheduledFor");

ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerVoucher" ADD CONSTRAINT "CustomerVoucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CustomerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerVoucher" ADD CONSTRAINT "CustomerVoucher_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_customerVoucherId_fkey" FOREIGN KEY ("customerVoucherId") REFERENCES "CustomerVoucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RewardCatalogItem" ADD CONSTRAINT "RewardCatalogItem_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CustomerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_rewardItemId_fkey" FOREIGN KEY ("rewardItemId") REFERENCES "RewardCatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_customerVoucherId_fkey" FOREIGN KEY ("customerVoucherId") REFERENCES "CustomerVoucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SavedAddress" ADD CONSTRAINT "SavedAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CustomerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_savedAddressId_fkey" FOREIGN KEY ("savedAddressId") REFERENCES "SavedAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductRecipeItem" ADD CONSTRAINT "ProductRecipeItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductRecipeItem" ADD CONSTRAINT "ProductRecipeItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OutletInventory" ADD CONSTRAINT "OutletInventory_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutletInventory" ADD CONSTRAINT "OutletInventory_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WifiBenefitConfig" ADD CONSTRAINT "WifiBenefitConfig_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiBenefitConfig" ADD CONSTRAINT "AiBenefitConfig_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DigitalBenefitEntitlement" ADD CONSTRAINT "DigitalBenefitEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CustomerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DigitalBenefitEntitlement" ADD CONSTRAINT "DigitalBenefitEntitlement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
