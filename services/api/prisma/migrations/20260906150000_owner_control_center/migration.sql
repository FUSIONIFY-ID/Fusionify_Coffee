ALTER TABLE "Asset"
ADD COLUMN "nextMaintenanceAt" TIMESTAMP(3);

CREATE INDEX "Asset_nextMaintenanceAt_status_idx"
ON "Asset"("nextMaintenanceAt", "status");
