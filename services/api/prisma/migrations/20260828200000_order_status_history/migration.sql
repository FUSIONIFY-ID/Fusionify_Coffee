CREATE TABLE "OrderStatusEvent" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "fromStatus" "OrderStatus",
  "toStatus" "OrderStatus" NOT NULL,
  "staffUserId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderStatusEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderStatusEvent_orderId_createdAt_idx"
ON "OrderStatusEvent"("orderId", "createdAt");

CREATE INDEX "OrderStatusEvent_staffUserId_createdAt_idx"
ON "OrderStatusEvent"("staffUserId", "createdAt");

ALTER TABLE "OrderStatusEvent"
ADD CONSTRAINT "OrderStatusEvent_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderStatusEvent"
ADD CONSTRAINT "OrderStatusEvent_staffUserId_fkey"
FOREIGN KEY ("staffUserId") REFERENCES "StaffUser"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
