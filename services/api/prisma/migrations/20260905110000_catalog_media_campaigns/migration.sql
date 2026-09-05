ALTER TABLE "Outlet"
  ADD COLUMN "imageUrl" TEXT;

ALTER TABLE "Product"
  ADD COLUMN "imageUrl" TEXT;

CREATE TABLE "Campaign" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "ctaLabel" TEXT NOT NULL,
  "translations" JSONB,
  "imageUrl" TEXT NOT NULL,
  "actionPath" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Campaign_active_sortOrder_idx"
  ON "Campaign"("active", "sortOrder");
