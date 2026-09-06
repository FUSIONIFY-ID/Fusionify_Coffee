ALTER TABLE "Outlet"
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "OutletProductAvailability" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutletProductAvailability_pkey" PRIMARY KEY ("id")
);

INSERT INTO "OutletProductAvailability" (
    "id",
    "outletId",
    "productId",
    "available",
    "createdAt",
    "updatedAt"
)
SELECT
    CONCAT(
        'availability-',
        MD5("Outlet"."id" || CHR(31) || "Product"."id")
    ),
    "Outlet"."id",
    "Product"."id",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Outlet"
CROSS JOIN "Product";

CREATE UNIQUE INDEX "OutletProductAvailability_outletId_productId_key"
ON "OutletProductAvailability"("outletId", "productId");

CREATE INDEX "OutletProductAvailability_outletId_available_idx"
ON "OutletProductAvailability"("outletId", "available");

CREATE INDEX "OutletProductAvailability_productId_available_idx"
ON "OutletProductAvailability"("productId", "available");

ALTER TABLE "OutletProductAvailability"
ADD CONSTRAINT "OutletProductAvailability_outletId_fkey"
FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OutletProductAvailability"
ADD CONSTRAINT "OutletProductAvailability_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
