CREATE TYPE "OrderStatus" AS ENUM (
  'AWAITING_PAYMENT',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'PICKED_UP',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING',
  'PAID',
  'EXPIRED',
  'CANCELLED',
  'FAILED',
  'REFUNDED'
);

CREATE TYPE "PaymentProvider" AS ENUM ('AUTOGOPAY');

CREATE TYPE "PaymentChannel" AS ENUM (
  'GOPAY_QRIS',
  'SHOPEEPAY_QRIS',
  'INTERACTIVE_QRIS'
);

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "checkoutKey" TEXT NOT NULL,
  "outletId" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
  "currency" TEXT NOT NULL DEFAULT 'IDR',
  "subtotal" INTEGER NOT NULL,
  "totalAmount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "basePrice" INTEGER NOT NULL,
  "unitPrice" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "lineTotal" INTEGER NOT NULL,
  "selectedModifiers" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "provider" "PaymentProvider" NOT NULL,
  "channel" "PaymentChannel" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'IDR',
  "providerTransactionId" TEXT,
  "providerOrderId" TEXT,
  "providerOrderSn" TEXT,
  "providerInvoiceId" TEXT,
  "providerRefNo" TEXT,
  "providerRawStatus" TEXT,
  "providerQrString" TEXT,
  "providerQrUrl" TEXT,
  "providerCheckoutUrl" TEXT,
  "providerExpiryTime" TEXT,
  "paidAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Order_checkoutKey_key" ON "Order"("checkoutKey");
CREATE INDEX "Order_outletId_status_idx" ON "Order"("outletId", "status");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");
CREATE UNIQUE INDEX "Payment_providerTransactionId_key" ON "Payment"("providerTransactionId");
CREATE INDEX "Payment_orderId_status_idx" ON "Payment"("orderId", "status");

ALTER TABLE "Order"
ADD CONSTRAINT "Order_outletId_fkey"
FOREIGN KEY ("outletId") REFERENCES "Outlet"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
