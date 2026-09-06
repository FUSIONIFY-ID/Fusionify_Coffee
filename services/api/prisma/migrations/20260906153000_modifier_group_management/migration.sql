ALTER TABLE "ModifierGroup"
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "ModifierGroup_productId_active_sortOrder_idx"
ON "ModifierGroup"("productId", "active", "sortOrder");
