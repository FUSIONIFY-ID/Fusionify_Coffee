CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE "PhoneCountry" AS ENUM ('ID', 'MY');
CREATE TYPE "AppLanguage" AS ENUM ('ID_ID', 'MS_MY', 'EN');
CREATE TYPE "OtpChannel" AS ENUM ('WHATSAPP', 'SMS');
CREATE TYPE "OtpPurpose" AS ENUM ('REGISTER', 'LOGIN_CHALLENGE', 'RESET_PASSWORD', 'CHANGE_PHONE', 'DELETE_ACCOUNT');

ALTER TABLE "Order" ADD COLUMN "userId" TEXT;

CREATE TABLE "CustomerUser" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "phoneCountry" "PhoneCountry" NOT NULL,
  "phoneE164" TEXT NOT NULL,
  "phoneVerifiedAt" TIMESTAMP(3) NOT NULL,
  "email" TEXT,
  "passwordHash" TEXT NOT NULL,
  "preferredLanguage" "AppLanguage" NOT NULL DEFAULT 'ID_ID',
  "birthDate" TIMESTAMP(3),
  "avatarUrl" TEXT,
  "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomerUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accessTokenHash" TEXT NOT NULL,
  "refreshTokenHash" TEXT NOT NULL,
  "deviceName" TEXT,
  "platform" TEXT,
  "accessExpiresAt" TIMESTAMP(3) NOT NULL,
  "refreshExpiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OtpChallenge" (
  "id" TEXT NOT NULL,
  "phoneCountry" "PhoneCountry" NOT NULL,
  "phoneE164" TEXT NOT NULL,
  "channel" "OtpChannel" NOT NULL,
  "purpose" "OtpPurpose" NOT NULL,
  "language" "AppLanguage" NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  "verifiedAt" TIMESTAMP(3),
  "verificationTokenHash" TEXT,
  "verificationExpiresAt" TIMESTAMP(3),
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerUser_phoneE164_key" ON "CustomerUser"("phoneE164");
CREATE UNIQUE INDEX "CustomerUser_email_key" ON "CustomerUser"("email");
CREATE INDEX "CustomerUser_phoneCountry_status_idx" ON "CustomerUser"("phoneCountry", "status");
CREATE UNIQUE INDEX "UserSession_accessTokenHash_key" ON "UserSession"("accessTokenHash");
CREATE UNIQUE INDEX "UserSession_refreshTokenHash_key" ON "UserSession"("refreshTokenHash");
CREATE INDEX "UserSession_userId_revokedAt_idx" ON "UserSession"("userId", "revokedAt");
CREATE INDEX "OtpChallenge_phoneE164_purpose_createdAt_idx" ON "OtpChallenge"("phoneE164", "purpose", "createdAt");
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

ALTER TABLE "Order"
ADD CONSTRAINT "Order_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "CustomerUser"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserSession"
ADD CONSTRAINT "UserSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "CustomerUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
