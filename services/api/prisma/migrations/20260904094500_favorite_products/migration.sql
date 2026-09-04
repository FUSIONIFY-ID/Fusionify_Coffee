CREATE TABLE "FavoriteProduct" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FavoriteProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FavoriteProduct_userId_productId_key"
ON "FavoriteProduct"("userId", "productId");
CREATE INDEX "FavoriteProduct_userId_createdAt_idx"
ON "FavoriteProduct"("userId", "createdAt");
CREATE INDEX "FavoriteProduct_productId_idx"
ON "FavoriteProduct"("productId");

ALTER TABLE "FavoriteProduct"
ADD CONSTRAINT "FavoriteProduct_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "CustomerUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FavoriteProduct"
ADD CONSTRAINT "FavoriteProduct_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
