CREATE TYPE "LoyaltyEntryType" AS ENUM (
  'ORDER_REWARD',
  'CAMPAIGN_BONUS',
  'REDEEM_REWARD',
  'REFUND_REVERSAL',
  'MANUAL_ADJUSTMENT'
);

CREATE TABLE "LoyaltyProgram" (
  "id" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "spendUnit" INTEGER NOT NULL,
  "pointsPerUnit" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoyaltyAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
  "lifetimeRedeemed" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LoyaltyAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoyaltyLedgerEntry" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "type" "LoyaltyEntryType" NOT NULL,
  "points" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "orderId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoyaltyLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LoyaltyProgram_currency_key" ON "LoyaltyProgram"("currency");
CREATE UNIQUE INDEX "LoyaltyAccount_userId_key" ON "LoyaltyAccount"("userId");
CREATE UNIQUE INDEX "LoyaltyLedgerEntry_orderId_key" ON "LoyaltyLedgerEntry"("orderId");
CREATE INDEX "LoyaltyLedgerEntry_accountId_createdAt_idx" ON "LoyaltyLedgerEntry"("accountId", "createdAt");
CREATE INDEX "LoyaltyLedgerEntry_type_createdAt_idx" ON "LoyaltyLedgerEntry"("type", "createdAt");

ALTER TABLE "LoyaltyAccount"
ADD CONSTRAINT "LoyaltyAccount_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "CustomerUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LoyaltyLedgerEntry"
ADD CONSTRAINT "LoyaltyLedgerEntry_accountId_fkey"
FOREIGN KEY ("accountId") REFERENCES "LoyaltyAccount"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LoyaltyLedgerEntry"
ADD CONSTRAINT "LoyaltyLedgerEntry_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
