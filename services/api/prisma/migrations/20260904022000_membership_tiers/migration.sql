ALTER TABLE "Order" ADD COLUMN "loyaltyProcessedAt" TIMESTAMP(3);

CREATE TABLE "MembershipTier" (
  "id" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "rank" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "translations" JSONB,
  "minimumQualifyingSpend" INTEGER NOT NULL,
  "pointsMultiplierBps" INTEGER NOT NULL DEFAULT 10000,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MembershipTier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MembershipProgress" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "qualifyingSpend" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MembershipProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MembershipTier_currency_rank_key"
ON "MembershipTier"("currency", "rank");
CREATE INDEX "MembershipTier_currency_active_minimumQualifyingSpend_idx"
ON "MembershipTier"("currency", "active", "minimumQualifyingSpend");
CREATE UNIQUE INDEX "MembershipProgress_accountId_currency_key"
ON "MembershipProgress"("accountId", "currency");
CREATE INDEX "MembershipProgress_currency_qualifyingSpend_idx"
ON "MembershipProgress"("currency", "qualifyingSpend");

ALTER TABLE "MembershipProgress"
ADD CONSTRAINT "MembershipProgress_accountId_fkey"
FOREIGN KEY ("accountId") REFERENCES "LoyaltyAccount"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
