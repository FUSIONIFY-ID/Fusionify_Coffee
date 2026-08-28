CREATE TYPE "StaffRole" AS ENUM (
  'SUPER_ADMIN',
  'OWNER',
  'OPERATIONS_MANAGER',
  'OUTLET_MANAGER',
  'CASHIER',
  'BARISTA',
  'INVENTORY_STAFF',
  'CUSTOMER_SUPPORT',
  'FINANCE'
);

CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

CREATE TABLE "StaffUser" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "StaffRole" NOT NULL,
  "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
  "outletId" TEXT,
  "totpSecretEncrypted" TEXT,
  "totpEnabledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffSession" (
  "id" TEXT NOT NULL,
  "staffUserId" TEXT NOT NULL,
  "accessTokenHash" TEXT NOT NULL,
  "refreshTokenHash" TEXT NOT NULL,
  "accessExpiresAt" TIMESTAMP(3) NOT NULL,
  "refreshExpiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StaffSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffLoginChallenge" (
  "id" TEXT NOT NULL,
  "staffUserId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffLoginChallenge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffAuditLog" (
  "id" TEXT NOT NULL,
  "staffUserId" TEXT,
  "action" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffUser_email_key" ON "StaffUser"("email");
CREATE INDEX "StaffUser_role_status_idx" ON "StaffUser"("role", "status");
CREATE INDEX "StaffUser_outletId_idx" ON "StaffUser"("outletId");
CREATE UNIQUE INDEX "StaffSession_accessTokenHash_key" ON "StaffSession"("accessTokenHash");
CREATE UNIQUE INDEX "StaffSession_refreshTokenHash_key" ON "StaffSession"("refreshTokenHash");
CREATE INDEX "StaffSession_staffUserId_revokedAt_idx" ON "StaffSession"("staffUserId", "revokedAt");
CREATE UNIQUE INDEX "StaffLoginChallenge_tokenHash_key" ON "StaffLoginChallenge"("tokenHash");
CREATE INDEX "StaffLoginChallenge_staffUserId_expiresAt_idx" ON "StaffLoginChallenge"("staffUserId", "expiresAt");
CREATE INDEX "StaffAuditLog_staffUserId_createdAt_idx" ON "StaffAuditLog"("staffUserId", "createdAt");
CREATE INDEX "StaffAuditLog_action_createdAt_idx" ON "StaffAuditLog"("action", "createdAt");

ALTER TABLE "StaffUser"
ADD CONSTRAINT "StaffUser_outletId_fkey"
FOREIGN KEY ("outletId") REFERENCES "Outlet"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StaffSession"
ADD CONSTRAINT "StaffSession_staffUserId_fkey"
FOREIGN KEY ("staffUserId") REFERENCES "StaffUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StaffLoginChallenge"
ADD CONSTRAINT "StaffLoginChallenge_staffUserId_fkey"
FOREIGN KEY ("staffUserId") REFERENCES "StaffUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StaffAuditLog"
ADD CONSTRAINT "StaffAuditLog_staffUserId_fkey"
FOREIGN KEY ("staffUserId") REFERENCES "StaffUser"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
