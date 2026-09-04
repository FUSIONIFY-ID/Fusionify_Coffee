from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace_exact(path: str, old: str, new: str) -> None:
    content = read(path)
    if old not in content:
        raise RuntimeError(f"Expected block not found in {path}: {old[:100]!r}")
    write(path, content.replace(old, new, 1))


# Prisma schema: membership is configurable and separate from the points ledger.
schema = "services/api/prisma/schema.prisma"
replace_exact(
    schema,
    "  loyaltyEntry   LoyaltyLedgerEntry?\n  createdAt      DateTime             @default(now())",
    "  loyaltyEntry      LoyaltyLedgerEntry?\n  loyaltyProcessedAt DateTime?\n  createdAt         DateTime             @default(now())",
)
replace_exact(
    schema,
    "  entries          LoyaltyLedgerEntry[]\n  createdAt        DateTime             @default(now())",
    "  entries              LoyaltyLedgerEntry[]\n  membershipProgresses MembershipProgress[]\n  createdAt            DateTime             @default(now())",
)
replace_exact(
    schema,
    "model LoyaltyAccount {",
    '''model MembershipTier {
  id                     String   @id @default(cuid())
  currency               String
  rank                   Int
  name                   String
  translations           Json?
  minimumQualifyingSpend Int
  pointsMultiplierBps    Int      @default(10000)
  active                 Boolean  @default(false)
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  @@unique([currency, rank])
  @@index([currency, active, minimumQualifyingSpend])
}

model MembershipProgress {
  id              String         @id @default(cuid())
  accountId       String
  account         LoyaltyAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  currency        String
  qualifyingSpend Int            @default(0)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@unique([accountId, currency])
  @@index([currency, qualifyingSpend])
}

model LoyaltyAccount {''',
)

write(
    "services/api/prisma/migrations/20260904022000_membership_tiers/migration.sql",
    '''ALTER TABLE "Order" ADD COLUMN "loyaltyProcessedAt" TIMESTAMP(3);

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
''',
)

write(
    "services/api/src/rewards/rewards.types.ts",
    '''export type ConfigureLoyaltyProgramInput = {
  spendUnit: number;
  pointsPerUnit: number;
  active: boolean;
};

export type MembershipTierTranslations = {
  ID_ID?: string;
  MS_MY?: string;
  EN?: string;
};

export type ConfigureMembershipTierInput = {
  name: string;
  translations?: MembershipTierTranslations;
  minimumQualifyingSpend: number;
  pointsMultiplierBps: number;
  active: boolean;
};
''',
)

write(
    "services/api/src/rewards/rewards.service.ts",
    '''import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import {
  LoyaltyEntryType,
  OrderStatus,
  PhoneCountry,
} from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import { StaffAuthService } from '../staff/staff-auth.service';
import type {
  ConfigureLoyaltyProgramInput,
  ConfigureMembershipTierInput,
  MembershipTierTranslations,
} from './rewards.types';

type TierShape = {
  id: string;
  currency: string;
  rank: number;
  name: string;
  translations: Prisma.JsonValue | null;
  minimumQualifyingSpend: number;
  pointsMultiplierBps: number;
  active: boolean;
};

@Injectable()
export class RewardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly staffAuthService: StaffAuthService,
  ) {}

  async getCustomerSummary(userId: string, languageValue?: string) {
    const user = await this.prisma.customerUser.findUnique({
      where: { id: userId },
      select: {
        phoneCountry: true,
        loyaltyAccount: {
          include: {
            entries: {
              orderBy: { createdAt: 'desc' },
              take: 50,
            },
            membershipProgresses: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Customer account not found.');
    }

    const currency =
      user.phoneCountry === PhoneCountry.MY ? 'MYR' : 'IDR';
    const account = user.loyaltyAccount;
    const qualifyingSpend =
      account?.membershipProgresses.find(
        (progress) => progress.currency === currency,
      )?.qualifyingSpend ?? 0;
    const tiers = await this.prisma.membershipTier.findMany({
      where: { currency, active: true },
      orderBy: [{ minimumQualifyingSpend: 'asc' }, { rank: 'asc' }],
    });
    const currentTier = [...tiers]
      .reverse()
      .find((tier) => tier.minimumQualifyingSpend <= qualifyingSpend);
    const nextTier = tiers.find(
      (tier) => tier.minimumQualifyingSpend > qualifyingSpend,
    );
    const language = this.normalizeLanguage(languageValue);

    return {
      balance: account?.balance ?? 0,
      lifetimeEarned: account?.lifetimeEarned ?? 0,
      lifetimeRedeemed: account?.lifetimeRedeemed ?? 0,
      recentActivity: account?.entries ?? [],
      membership: {
        currency,
        qualifyingSpend,
        pointsMultiplierBps: currentTier?.pointsMultiplierBps ?? 10000,
        currentTier: currentTier
          ? this.tierView(currentTier, language)
          : null,
        nextTier: nextTier ? this.tierView(nextTier, language) : null,
        remainingToNextTier: nextTier
          ? Math.max(0, nextTier.minimumQualifyingSpend - qualifyingSpend)
          : 0,
      },
    };
  }

  listPrograms() {
    return this.prisma.loyaltyProgram.findMany({
      orderBy: { currency: 'asc' },
    });
  }

  listMembershipTiers() {
    return this.prisma.membershipTier.findMany({
      orderBy: [{ currency: 'asc' }, { rank: 'asc' }],
    });
  }

  async configureProgram(
    staffUserId: string,
    currencyValue: string,
    input: ConfigureLoyaltyProgramInput,
  ) {
    const currency = this.normalizeCurrency(currencyValue);
    this.validateProgram(input);

    const program = await this.prisma.loyaltyProgram.upsert({
      where: { currency },
      update: {
        spendUnit: input.spendUnit,
        pointsPerUnit: input.pointsPerUnit,
        active: input.active,
      },
      create: {
        currency,
        spendUnit: input.spendUnit,
        pointsPerUnit: input.pointsPerUnit,
        active: input.active,
      },
    });

    await this.staffAuthService.audit(staffUserId, 'LOYALTY_PROGRAM_UPDATED', {
      targetType: 'LoyaltyProgram',
      targetId: program.id,
      metadata: {
        currency: program.currency,
        spendUnit: program.spendUnit,
        pointsPerUnit: program.pointsPerUnit,
        active: program.active,
      },
    });

    return program;
  }

  async configureMembershipTier(
    staffUserId: string,
    currencyValue: string,
    rankValue: string,
    input: ConfigureMembershipTierInput,
  ) {
    const currency = this.normalizeCurrency(currencyValue);
    const rank = Number.parseInt(rankValue, 10);
    const translations = this.validateMembershipTier(rank, input);

    const otherTiers = await this.prisma.membershipTier.findMany({
      where: { currency, rank: { not: rank } },
      select: {
        rank: true,
        minimumQualifyingSpend: true,
        active: true,
      },
    });
    const activeSequence = [
      ...otherTiers,
      {
        rank,
        minimumQualifyingSpend: input.minimumQualifyingSpend,
        active: input.active,
      },
    ]
      .filter((tier) => tier.active)
      .sort((left, right) => left.rank - right.rank);

    for (let index = 1; index < activeSequence.length; index += 1) {
      if (
        activeSequence[index].minimumQualifyingSpend <=
        activeSequence[index - 1].minimumQualifyingSpend
      ) {
        throw new BadRequestException(
          'Active membership thresholds must increase with tier rank.',
        );
      }
    }

    const tier = await this.prisma.membershipTier.upsert({
      where: { currency_rank: { currency, rank } },
      update: {
        name: input.name.trim(),
        translations,
        minimumQualifyingSpend: input.minimumQualifyingSpend,
        pointsMultiplierBps: input.pointsMultiplierBps,
        active: input.active,
      },
      create: {
        currency,
        rank,
        name: input.name.trim(),
        translations,
        minimumQualifyingSpend: input.minimumQualifyingSpend,
        pointsMultiplierBps: input.pointsMultiplierBps,
        active: input.active,
      },
    });

    await this.staffAuthService.audit(staffUserId, 'MEMBERSHIP_TIER_UPDATED', {
      targetType: 'MembershipTier',
      targetId: tier.id,
      metadata: {
        currency: tier.currency,
        rank: tier.rank,
        name: tier.name,
        minimumQualifyingSpend: tier.minimumQualifyingSpend,
        pointsMultiplierBps: tier.pointsMultiplierBps,
        active: tier.active,
      },
    });

    return tier;
  }

  async awardCompletedOrder(tx: Prisma.TransactionClient, orderId: string) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        currency: true,
        subtotal: true,
        loyaltyProcessedAt: true,
      },
    });

    if (!order || !order.userId || order.status !== OrderStatus.COMPLETED) {
      return null;
    }

    const existing = await tx.loyaltyLedgerEntry.findUnique({
      where: { orderId: order.id },
    });
    if (order.loyaltyProcessedAt) {
      return existing;
    }

    const account = await tx.loyaltyAccount.upsert({
      where: { userId: order.userId },
      update: {},
      create: { userId: order.userId },
    });
    const progress = await tx.membershipProgress.findUnique({
      where: {
        accountId_currency: {
          accountId: account.id,
          currency: order.currency,
        },
      },
    });

    if (existing) {
      await tx.membershipProgress.upsert({
        where: {
          accountId_currency: {
            accountId: account.id,
            currency: order.currency,
          },
        },
        update: { qualifyingSpend: { increment: order.subtotal } },
        create: {
          accountId: account.id,
          currency: order.currency,
          qualifyingSpend: order.subtotal,
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { loyaltyProcessedAt: new Date() },
      });
      return existing;
    }

    const currentTier = await tx.membershipTier.findFirst({
      where: {
        currency: order.currency,
        active: true,
        minimumQualifyingSpend: {
          lte: progress?.qualifyingSpend ?? 0,
        },
      },
      orderBy: [
        { minimumQualifyingSpend: 'desc' },
        { rank: 'desc' },
      ],
    });
    const program = await tx.loyaltyProgram.findUnique({
      where: { currency: order.currency },
    });

    let ledger = null;
    if (program?.active) {
      const basePoints =
        Math.floor(order.subtotal / program.spendUnit) * program.pointsPerUnit;
      const multiplierBps = currentTier?.pointsMultiplierBps ?? 10000;
      const points = Math.floor((basePoints * multiplierBps) / 10000);

      if (points > 0) {
        const updatedAccount = await tx.loyaltyAccount.update({
          where: { id: account.id },
          data: {
            balance: { increment: points },
            lifetimeEarned: { increment: points },
          },
        });
        ledger = await tx.loyaltyLedgerEntry.create({
          data: {
            accountId: account.id,
            type: LoyaltyEntryType.ORDER_REWARD,
            points,
            balanceAfter: updatedAccount.balance,
            orderId: order.id,
            note: currentTier
              ? `Completed order reward at ${currentTier.pointsMultiplierBps} bps membership multiplier.`
              : 'Eligible completed order reward.',
          },
        });
      }
    }

    await tx.membershipProgress.upsert({
      where: {
        accountId_currency: {
          accountId: account.id,
          currency: order.currency,
        },
      },
      update: { qualifyingSpend: { increment: order.subtotal } },
      create: {
        accountId: account.id,
        currency: order.currency,
        qualifyingSpend: order.subtotal,
      },
    });
    await tx.order.update({
      where: { id: order.id },
      data: { loyaltyProcessedAt: new Date() },
    });

    return ledger;
  }

  private normalizeCurrency(value: string) {
    const currency = value.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new BadRequestException('Currency must be a 3-letter code.');
    }
    return currency;
  }

  private validateProgram(input: ConfigureLoyaltyProgramInput) {
    if (
      !Number.isInteger(input.spendUnit) ||
      input.spendUnit <= 0 ||
      input.spendUnit > 1_000_000_000
    ) {
      throw new BadRequestException('spendUnit must be a positive integer.');
    }

    if (
      !Number.isInteger(input.pointsPerUnit) ||
      input.pointsPerUnit <= 0 ||
      input.pointsPerUnit > 1_000_000
    ) {
      throw new BadRequestException(
        'pointsPerUnit must be a positive integer.',
      );
    }

    if (typeof input.active !== 'boolean') {
      throw new BadRequestException('active must be a boolean.');
    }
  }

  private validateMembershipTier(
    rank: number,
    input: ConfigureMembershipTierInput,
  ) {
    if (!Number.isInteger(rank) || rank < 0 || rank > 100) {
      throw new BadRequestException('Tier rank must be an integer from 0 to 100.');
    }
    const name = input.name?.trim();
    if (!name || name.length < 2 || name.length > 40) {
      throw new BadRequestException('Tier name must contain 2 to 40 characters.');
    }
    if (
      !Number.isInteger(input.minimumQualifyingSpend) ||
      input.minimumQualifyingSpend < 0 ||
      input.minimumQualifyingSpend > 2_000_000_000
    ) {
      throw new BadRequestException(
        'minimumQualifyingSpend must be a non-negative integer.',
      );
    }
    if (
      !Number.isInteger(input.pointsMultiplierBps) ||
      input.pointsMultiplierBps < 10000 ||
      input.pointsMultiplierBps > 50000
    ) {
      throw new BadRequestException(
        'pointsMultiplierBps must be between 10000 (1x) and 50000 (5x).',
      );
    }
    if (typeof input.active !== 'boolean') {
      throw new BadRequestException('active must be a boolean.');
    }

    const translations = input.translations ?? {};
    for (const value of Object.values(translations)) {
      if (value !== undefined && (value.trim().length < 2 || value.trim().length > 40)) {
        throw new BadRequestException(
          'Translated tier names must contain 2 to 40 characters.',
        );
      }
    }

    return this.cleanTranslations(translations);
  }

  private cleanTranslations(translations: MembershipTierTranslations) {
    const result: MembershipTierTranslations = {};
    for (const key of ['ID_ID', 'MS_MY', 'EN'] as const) {
      const value = translations[key]?.trim();
      if (value) result[key] = value;
    }
    return result;
  }

  private normalizeLanguage(value?: string) {
    const normalized = value?.trim().toLowerCase() ?? '';
    if (normalized.startsWith('ms') || normalized === 'ms_my') return 'MS_MY';
    if (normalized.startsWith('en') || normalized === 'en') return 'EN';
    return 'ID_ID';
  }

  private tierView(tier: TierShape, language: 'ID_ID' | 'MS_MY' | 'EN') {
    const translations = this.translationObject(tier.translations);
    return {
      id: tier.id,
      currency: tier.currency,
      rank: tier.rank,
      name: translations[language] ?? tier.name,
      minimumQualifyingSpend: tier.minimumQualifyingSpend,
      pointsMultiplierBps: tier.pointsMultiplierBps,
    };
  }

  private translationObject(value: Prisma.JsonValue | null) {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return {} as Record<string, string>;
    }
    const result: Record<string, string> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry === 'string' && entry.trim()) result[key] = entry.trim();
    }
    return result;
  }
}
''',
)

write(
    "services/api/src/rewards/rewards.controller.ts",
    '''import {
  Controller,
  Get,
  Headers,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { CustomerAuthGuard } from '../auth/auth.guard';
import { RewardsService } from './rewards.service';

@Controller('v1/rewards')
@UseGuards(CustomerAuthGuard)
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('me')
  me(
    @Req() request: AuthenticatedRequest,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.rewardsService.getCustomerSummary(
      request.auth!.userId,
      acceptLanguage,
    );
  }
}
''',
)

write(
    "services/api/src/rewards/staff-rewards.controller.ts",
    '''import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedStaffRequest } from '../staff/staff-auth.guard';
import { StaffAuthGuard } from '../staff/staff-auth.guard';
import { RequireStaffPermissions } from '../staff/staff.decorators';
import { StaffPermissionsGuard } from '../staff/staff-permissions.guard';
import { StaffPermission } from '../staff/staff.types';
import { RewardsService } from './rewards.service';
import type {
  ConfigureLoyaltyProgramInput,
  ConfigureMembershipTierInput,
} from './rewards.types';

@Controller('v1/staff/rewards')
@UseGuards(StaffAuthGuard, StaffPermissionsGuard)
@RequireStaffPermissions(StaffPermission.RewardsManage)
export class StaffRewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('programs')
  programs() {
    return this.rewardsService.listPrograms();
  }

  @Put('programs/:currency')
  configure(
    @Req() request: AuthenticatedStaffRequest,
    @Param('currency') currency: string,
    @Body() body: ConfigureLoyaltyProgramInput,
  ) {
    return this.rewardsService.configureProgram(
      request.staffAuth!.staffUserId,
      currency,
      body,
    );
  }

  @Get('membership-tiers')
  membershipTiers() {
    return this.rewardsService.listMembershipTiers();
  }

  @Put('membership-tiers/:currency/:rank')
  configureMembershipTier(
    @Req() request: AuthenticatedStaffRequest,
    @Param('currency') currency: string,
    @Param('rank') rank: string,
    @Body() body: ConfigureMembershipTierInput,
  ) {
    return this.rewardsService.configureMembershipTier(
      request.staffAuth!.staffUserId,
      currency,
      rank,
      body,
    );
  }
}
''',
)

# Customer rewards models and UI.
write(
    "apps/customer/lib/features/rewards/domain/rewards_models.dart",
    '''class RewardsSummary {
  const RewardsSummary({
    required this.balance,
    required this.lifetimeEarned,
    required this.lifetimeRedeemed,
    required this.recentActivity,
    required this.membership,
  });

  factory RewardsSummary.fromJson(Map<String, dynamic> json) {
    final rawActivity = json['recentActivity'] is List
        ? json['recentActivity'] as List
        : const [];
    final rawMembership = json['membership'] is Map
        ? Map<String, dynamic>.from(json['membership'] as Map)
        : const <String, dynamic>{};

    return RewardsSummary(
      balance: json['balance'] as int? ?? 0,
      lifetimeEarned: json['lifetimeEarned'] as int? ?? 0,
      lifetimeRedeemed: json['lifetimeRedeemed'] as int? ?? 0,
      recentActivity: rawActivity
          .whereType<Map>()
          .map(
            (entry) =>
                RewardsLedgerEntry.fromJson(Map<String, dynamic>.from(entry)),
          )
          .toList(),
      membership: MembershipSummary.fromJson(rawMembership),
    );
  }

  final int balance;
  final int lifetimeEarned;
  final int lifetimeRedeemed;
  final List<RewardsLedgerEntry> recentActivity;
  final MembershipSummary membership;
}

class MembershipSummary {
  const MembershipSummary({
    required this.currency,
    required this.qualifyingSpend,
    required this.pointsMultiplierBps,
    required this.remainingToNextTier,
    this.currentTier,
    this.nextTier,
  });

  factory MembershipSummary.fromJson(Map<String, dynamic> json) {
    return MembershipSummary(
      currency: json['currency'] as String? ?? 'IDR',
      qualifyingSpend: json['qualifyingSpend'] as int? ?? 0,
      pointsMultiplierBps: json['pointsMultiplierBps'] as int? ?? 10000,
      remainingToNextTier: json['remainingToNextTier'] as int? ?? 0,
      currentTier: json['currentTier'] is Map
          ? MembershipTierView.fromJson(
              Map<String, dynamic>.from(json['currentTier'] as Map),
            )
          : null,
      nextTier: json['nextTier'] is Map
          ? MembershipTierView.fromJson(
              Map<String, dynamic>.from(json['nextTier'] as Map),
            )
          : null,
    );
  }

  final String currency;
  final int qualifyingSpend;
  final int pointsMultiplierBps;
  final int remainingToNextTier;
  final MembershipTierView? currentTier;
  final MembershipTierView? nextTier;

  double get progressToNextTier {
    final next = nextTier;
    if (next == null) return 1;
    final start = currentTier?.minimumQualifyingSpend ?? 0;
    final range = next.minimumQualifyingSpend - start;
    if (range <= 0) return 0;
    return ((qualifyingSpend - start) / range).clamp(0, 1).toDouble();
  }
}

class MembershipTierView {
  const MembershipTierView({
    required this.id,
    required this.currency,
    required this.rank,
    required this.name,
    required this.minimumQualifyingSpend,
    required this.pointsMultiplierBps,
  });

  factory MembershipTierView.fromJson(Map<String, dynamic> json) {
    return MembershipTierView(
      id: json['id'] as String? ?? '',
      currency: json['currency'] as String? ?? '',
      rank: json['rank'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      minimumQualifyingSpend: json['minimumQualifyingSpend'] as int? ?? 0,
      pointsMultiplierBps: json['pointsMultiplierBps'] as int? ?? 10000,
    );
  }

  final String id;
  final String currency;
  final int rank;
  final String name;
  final int minimumQualifyingSpend;
  final int pointsMultiplierBps;
}

class RewardsLedgerEntry {
  const RewardsLedgerEntry({
    required this.id,
    required this.type,
    required this.points,
    required this.balanceAfter,
    required this.createdAt,
    this.orderId,
    this.note,
  });

  factory RewardsLedgerEntry.fromJson(Map<String, dynamic> json) {
    return RewardsLedgerEntry(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? '',
      points: json['points'] as int? ?? 0,
      balanceAfter: json['balanceAfter'] as int? ?? 0,
      orderId: json['orderId'] as String?,
      note: json['note'] as String?,
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime(2026),
    );
  }

  final String id;
  final String type;
  final int points;
  final int balanceAfter;
  final String? orderId;
  final String? note;
  final DateTime createdAt;
}
''',
)

write(
    "apps/customer/lib/l10n/rewards_strings.dart",
    '''import 'app_strings.dart';

extension RewardsStrings on AppStrings {
  String _rewardPick(String id, String ms, String en) {
    return switch (languageCode) {
      'id' => id,
      'ms' => ms,
      _ => en,
    };
  }

  String get fusionPoints =>
      _rewardPick('Fusion Points', 'Fusion Points', 'Fusion Points');
  String get membership =>
      _rewardPick('Membership', 'Keahlian', 'Membership');
  String get baseMember =>
      _rewardPick('Fusion Member', 'Fusion Member', 'Fusion Member');
  String get membershipProgress => _rewardPick(
    'Progress membership',
    'Kemajuan keahlian',
    'Membership progress',
  );
  String get membershipNotConfigured => _rewardPick(
    'Belum ada tier membership aktif untuk wilayah kamu.',
    'Belum ada tahap keahlian aktif untuk wilayah anda.',
    'No active membership tiers are configured for your region yet.',
  );
  String nextTierProgress(String amount, String tier) => _rewardPick(
    '$amount lagi menuju $tier',
    '$amount lagi untuk mencapai $tier',
    '$amount to reach $tier',
  );
  String get topTierReached => _rewardPick(
    'Kamu sudah berada di tier aktif tertinggi.',
    'Anda sudah berada pada tahap aktif tertinggi.',
    'You are on the highest active tier.',
  );
  String pointsMultiplier(String multiplier) => _rewardPick(
    'Multiplier poin ${multiplier}×',
    'Pengganda mata ${multiplier}×',
    '${multiplier}× points multiplier',
  );
  String get pointsBalance =>
      _rewardPick('Saldo poin', 'Baki mata', 'Points balance');
  String get lifetimeEarned =>
      _rewardPick('Total diperoleh', 'Jumlah diperoleh', 'Lifetime earned');
  String get lifetimeRedeemed =>
      _rewardPick('Total digunakan', 'Jumlah digunakan', 'Lifetime redeemed');
  String get recentPointsActivity =>
      _rewardPick('Aktivitas terbaru', 'Aktiviti terkini', 'Recent activity');
  String get noPointsActivity => _rewardPick(
    'Belum ada aktivitas Fusion Points.',
    'Belum ada aktiviti Fusion Points.',
    'No Fusion Points activity yet.',
  );
  String get signInToSeeRewards => _rewardPick(
    'Masuk untuk melihat Fusion Points kamu.',
    'Log masuk untuk melihat Fusion Points anda.',
    'Log in to see your Fusion Points.',
  );
  String get pointsLoadFailed => _rewardPick(
    'Fusion Points belum bisa dimuat.',
    'Fusion Points belum dapat dimuatkan.',
    'Fusion Points could not be loaded.',
  );
  String get orderReward => _rewardPick(
    'Poin dari pesanan selesai',
    'Mata daripada pesanan selesai',
    'Completed order reward',
  );
  String get campaignBonus =>
      _rewardPick('Bonus kampanye', 'Bonus kempen', 'Campaign bonus');
  String get rewardRedemption => _rewardPick(
    'Penukaran reward',
    'Penebusan ganjaran',
    'Reward redemption',
  );
  String get refundReversal => _rewardPick(
    'Penyesuaian refund',
    'Pelarasan bayaran balik',
    'Refund adjustment',
  );
  String get manualAdjustment =>
      _rewardPick('Penyesuaian poin', 'Pelarasan mata', 'Points adjustment');
  String pointsAmount(int points) =>
      _rewardPick('$points poin', '$points mata', '$points points');
}
''',
)

write(
    "apps/customer/lib/features/rewards/presentation/rewards_screen.dart",
    '''import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/formatters/currency.dart';
import '../../../l10n/app_strings.dart';
import '../../../l10n/rewards_strings.dart';
import '../../auth/application/auth_controller.dart';
import '../application/rewards_provider.dart';
import '../domain/rewards_models.dart';

class RewardsScreen extends ConsumerWidget {
  const RewardsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = context.strings;
    final profile = ref.watch(authControllerProvider).value;

    if (profile == null) {
      return SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(CoffeeSpacing.xl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.stars_outlined,
                  size: 56,
                  color: CoffeeColors.primary,
                ),
                const SizedBox(height: CoffeeSpacing.md),
                Text(strings.signInToSeeRewards, textAlign: TextAlign.center),
                const SizedBox(height: CoffeeSpacing.md),
                FilledButton(
                  onPressed: () => context.push('/auth/login'),
                  child: Text(strings.login),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final summary = ref.watch(rewardsSummaryProvider);

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(rewardsSummaryProvider);
          await ref.read(rewardsSummaryProvider.future);
        },
        child: summary.when(
          data: (value) => _RewardsContent(summary: value),
          loading: () => const _RewardsLoading(),
          error: (_, _) => _RewardsError(
            onRetry: () => ref.invalidate(rewardsSummaryProvider),
          ),
        ),
      ),
    );
  }
}

class _RewardsContent extends StatelessWidget {
  const _RewardsContent({required this.summary});

  final RewardsSummary summary;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(CoffeeSpacing.md),
      children: [
        Text(
          strings.membership,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: CoffeeSpacing.md),
        _MembershipCard(membership: summary.membership),
        const SizedBox(height: CoffeeSpacing.xl),
        Text(
          strings.fusionPoints,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: CoffeeSpacing.md),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(CoffeeSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  strings.pointsBalance,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: CoffeeSpacing.xs),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      summary.balance.toString(),
                      style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        color: CoffeeColors.deep,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(width: CoffeeSpacing.xs),
                    Padding(
                      padding: const EdgeInsets.only(bottom: CoffeeSpacing.xs),
                      child: Text(strings.fusionPoints),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: CoffeeSpacing.md),
        Row(
          children: [
            Expanded(
              child: _Metric(
                label: strings.lifetimeEarned,
                value: summary.lifetimeEarned,
              ),
            ),
            const SizedBox(width: CoffeeSpacing.md),
            Expanded(
              child: _Metric(
                label: strings.lifetimeRedeemed,
                value: summary.lifetimeRedeemed,
              ),
            ),
          ],
        ),
        const SizedBox(height: CoffeeSpacing.xl),
        Text(
          strings.recentPointsActivity,
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: CoffeeSpacing.sm),
        if (summary.recentActivity.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: CoffeeSpacing.xl),
            child: Text(
              strings.noPointsActivity,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          )
        else
          for (final entry in summary.recentActivity) _LedgerTile(entry: entry),
      ],
    );
  }
}

class _MembershipCard extends StatelessWidget {
  const _MembershipCard({required this.membership});

  final MembershipSummary membership;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final current = membership.currentTier;
    final next = membership.nextTier;
    final multiplier = membership.pointsMultiplierBps / 10000;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CoffeeSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: CoffeeColors.surfaceBlue,
                    borderRadius: BorderRadius.circular(CoffeeRadius.control),
                  ),
                  child: const Icon(
                    Icons.workspace_premium_outlined,
                    color: CoffeeColors.deep,
                  ),
                ),
                const SizedBox(width: CoffeeSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        current?.name ?? strings.baseMember,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      if (current != null && multiplier > 1)
                        Text(
                          strings.pointsMultiplier(
                            multiplier.toStringAsFixed(
                              multiplier == multiplier.roundToDouble() ? 0 : 2,
                            ),
                          ),
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: CoffeeSpacing.lg),
            if (current == null && next == null)
              Text(strings.membershipNotConfigured)
            else ...[
              Text(
                strings.membershipProgress,
                style: Theme.of(context).textTheme.labelLarge,
              ),
              const SizedBox(height: CoffeeSpacing.xs),
              LinearProgressIndicator(
                value: membership.progressToNextTier,
                minHeight: 8,
                borderRadius: BorderRadius.circular(CoffeeRadius.control),
              ),
              const SizedBox(height: CoffeeSpacing.sm),
              Text(
                next == null
                    ? strings.topTierReached
                    : strings.nextTierProgress(
                        _formatSpend(
                          membership.currency,
                          membership.remainingToNextTier,
                        ),
                        next.name,
                      ),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatSpend(String currency, int amount) {
    if (currency == 'IDR') return formatRupiah(amount);
    if (currency == 'MYR') return 'RM ${(amount / 100).toStringAsFixed(2)}';
    return '$currency $amount';
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(CoffeeSpacing.md),
      decoration: BoxDecoration(
        border: Border.all(color: CoffeeColors.border),
        borderRadius: BorderRadius.circular(CoffeeRadius.card),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: CoffeeSpacing.xs),
          Text(
            value.toString(),
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
        ],
      ),
    );
  }
}

class _LedgerTile extends StatelessWidget {
  const _LedgerTile({required this.entry});

  final RewardsLedgerEntry entry;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final positive = entry.points >= 0;
    final local = entry.createdAt.toLocal();
    final date =
        '${local.day.toString().padLeft(2, '0')}/'
        '${local.month.toString().padLeft(2, '0')}/${local.year}';

    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(
        positive ? Icons.add_circle_outline : Icons.remove_circle_outline,
        color: positive ? CoffeeColors.success : CoffeeColors.error,
      ),
      title: Text(_entryLabel(strings)),
      subtitle: Text(date),
      trailing: Text(
        '${positive ? '+' : ''}${strings.pointsAmount(entry.points)}',
        style: TextStyle(
          color: positive ? CoffeeColors.success : CoffeeColors.error,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }

  String _entryLabel(AppStrings strings) {
    return switch (entry.type) {
      'ORDER_REWARD' => strings.orderReward,
      'CAMPAIGN_BONUS' => strings.campaignBonus,
      'REDEEM_REWARD' => strings.rewardRedemption,
      'REFUND_REVERSAL' => strings.refundReversal,
      'MANUAL_ADJUSTMENT' => strings.manualAdjustment,
      _ => strings.fusionPoints,
    };
  }
}

class _RewardsLoading extends StatelessWidget {
  const _RewardsLoading();

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: const [
        SizedBox(height: 240),
        Center(child: CircularProgressIndicator()),
      ],
    );
  }
}

class _RewardsError extends StatelessWidget {
  const _RewardsError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(CoffeeSpacing.xl),
      children: [
        const SizedBox(height: 180),
        Text(strings.pointsLoadFailed, textAlign: TextAlign.center),
        const SizedBox(height: CoffeeSpacing.md),
        Center(
          child: FilledButton(onPressed: onRetry, child: Text(strings.retry)),
        ),
      ],
    );
  }
}
''',
)

# Account membership card now reads the same backend summary as Rewards.
account_path = "apps/customer/lib/features/account/presentation/account_screen.dart"
replace_exact(
    account_path,
    "import '../../../l10n/app_strings.dart';\n",
    "import '../../../l10n/app_strings.dart';\nimport '../../../l10n/rewards_strings.dart';\n",
)
replace_exact(
    account_path,
    "import '../../auth/domain/auth_models.dart';\n",
    "import '../../auth/domain/auth_models.dart';\nimport '../../rewards/application/rewards_provider.dart';\nimport '../../rewards/domain/rewards_models.dart';\n",
)
replace_exact(
    account_path,
    "    final auth = ref.watch(authControllerProvider);\n",
    "    final auth = ref.watch(authControllerProvider);\n    final rewards = ref.watch(rewardsSummaryProvider);\n",
)
replace_exact(
    account_path,
    "            profile: profile,\n            onOrders: () => context.go('/orders'),",
    "            profile: profile,\n            membership: rewards.value?.membership,\n            onRewards: () => context.go('/rewards'),\n            onOrders: () => context.go('/orders'),",
)
replace_exact(
    account_path,
    "    required this.profile,\n    this.onOrders,",
    "    required this.profile,\n    this.membership,\n    this.onRewards,\n    this.onOrders,",
)
replace_exact(
    account_path,
    "  final CustomerProfile profile;\n  final VoidCallback? onOrders;",
    "  final CustomerProfile profile;\n  final MembershipSummary? membership;\n  final VoidCallback? onRewards;\n  final VoidCallback? onOrders;",
)
replace_exact(
    account_path,
    "        _MemberCard(profile: profile),",
    "        _MemberCard(\n          profile: profile,\n          membership: membership,\n          onTap: onRewards,\n        ),",
)
start = read(account_path).index("class _MemberCard extends StatelessWidget")
end = read(account_path).index("class _SectionTitle extends StatelessWidget")
account = read(account_path)
member_card = '''class _MemberCard extends StatelessWidget {
  const _MemberCard({
    required this.profile,
    this.membership,
    this.onTap,
  });

  final CustomerProfile profile;
  final MembershipSummary? membership;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final year = profile.memberSince.year;
    final tier = membership?.currentTier;

    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(CoffeeRadius.card),
        child: Padding(
          padding: const EdgeInsets.all(CoffeeSpacing.md),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: CoffeeColors.primary,
                  borderRadius: BorderRadius.circular(CoffeeRadius.control),
                ),
                child: const Icon(
                  Icons.local_cafe_outlined,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: CoffeeSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tier?.name ?? strings.baseMember,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: CoffeeSpacing.xxs),
                    Text(
                      membership?.nextTier == null
                          ? '${strings.memberSince} $year'
                          : strings.nextTierProgress(
                              _formatSpend(
                                membership!.currency,
                                membership!.remainingToNextTier,
                              ),
                              membership!.nextTier!.name,
                            ),
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              if (onTap != null)
                const Icon(
                  Icons.chevron_right,
                  color: CoffeeColors.textSecondary,
                ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatSpend(String currency, int amount) {
    if (currency == 'IDR') {
      final digits = amount.toString();
      final result = StringBuffer();
      for (var index = 0; index < digits.length; index += 1) {
        if (index > 0 && (digits.length - index) % 3 == 0) result.write('.');
        result.write(digits[index]);
      }
      return 'Rp$result';
    }
    if (currency == 'MYR') return 'RM ${(amount / 100).toStringAsFixed(2)}';
    return '$currency $amount';
  }
}

'''
write(account_path, account[:start] + member_card + account[end:])

# Staff types and rewards control surface.
staff_types = "apps/staff/lib/types.ts"
with Path(staff_types).open("a", encoding="utf-8") as handle:
    handle.write('''\nexport type MembershipTier = {\n  id: string;\n  currency: string;\n  rank: number;\n  name: string;\n  translations: { ID_ID?: string; MS_MY?: string; EN?: string } | null;\n  minimumQualifyingSpend: number;\n  pointsMultiplierBps: number;\n  active: boolean;\n  createdAt: string;\n  updatedAt: string;\n};\n''')

write(
    "apps/staff/app/rewards/page.tsx",
    ''''use client';

import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { StaffShell } from '@/components/staff-shell';
import { useStaff } from '@/hooks/use-staff';
import { apiJson } from '@/lib/client-api';
import type { LoyaltyProgram, MembershipTier } from '@/lib/types';

export default function RewardsPage() {
  const { staff, loading: staffLoading } = useStaff();
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [currency, setCurrency] = useState('IDR');
  const [spendUnit, setSpendUnit] = useState('');
  const [pointsPerUnit, setPointsPerUnit] = useState('');
  const [active, setActive] = useState(false);
  const [tierCurrency, setTierCurrency] = useState('IDR');
  const [tierRank, setTierRank] = useState('0');
  const [tierName, setTierName] = useState('');
  const [tierNameId, setTierNameId] = useState('');
  const [tierNameMs, setTierNameMs] = useState('');
  const [tierNameEn, setTierNameEn] = useState('');
  const [tierMinimumSpend, setTierMinimumSpend] = useState('');
  const [tierMultiplier, setTierMultiplier] = useState('1.00');
  const [tierActive, setTierActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const [nextPrograms, nextTiers] = await Promise.all([
        apiJson<LoyaltyProgram[]>('/api/staff/rewards/programs'),
        apiJson<MembershipTier[]>('/api/staff/rewards/membership-tiers'),
      ]);
      setPrograms(nextPrograms);
      setTiers(nextTiers);
      setError('');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Rewards and membership settings could not load.',
      );
    }
  }, []);

  useEffect(() => {
    if (staff?.permissions.includes('rewards.manage')) void load();
  }, [staff, load]);

  if (staffLoading || !staff) {
    return <main className="loading-page">Opening rewards…</main>;
  }

  if (!staff.permissions.includes('rewards.manage')) {
    return (
      <StaffShell staff={staff}>
        <div className="empty-panel">You do not have rewards management access.</div>
      </StaffShell>
    );
  }

  function edit(program: LoyaltyProgram) {
    setCurrency(program.currency);
    setSpendUnit(program.spendUnit.toString());
    setPointsPerUnit(program.pointsPerUnit.toString());
    setActive(program.active);
    setMessage('');
    setError('');
  }

  function editTier(tier: MembershipTier) {
    setTierCurrency(tier.currency);
    setTierRank(tier.rank.toString());
    setTierName(tier.name);
    setTierNameId(tier.translations?.ID_ID ?? '');
    setTierNameMs(tier.translations?.MS_MY ?? '');
    setTierNameEn(tier.translations?.EN ?? '');
    setTierMinimumSpend(tier.minimumQualifyingSpend.toString());
    setTierMultiplier((tier.pointsMultiplierBps / 10000).toFixed(2));
    setTierActive(tier.active);
    setMessage('');
    setError('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalizedCurrency = currency.trim().toUpperCase();
    const parsedSpendUnit = Number.parseInt(spendUnit, 10);
    const parsedPointsPerUnit = Number.parseInt(pointsPerUnit, 10);

    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      setError('Currency must use a 3-letter code such as IDR or MYR.');
      return;
    }
    if (parsedSpendUnit <= 0 || parsedPointsPerUnit <= 0) {
      setError('Spend unit and points per unit must be positive integers.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      await apiJson<LoyaltyProgram>(
        `/api/staff/rewards/programs/${normalizedCurrency}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            spendUnit: parsedSpendUnit,
            pointsPerUnit: parsedPointsPerUnit,
            active,
          }),
        },
      );
      setMessage(`${normalizedCurrency} earning program saved.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Program update failed.');
    } finally {
      setBusy(false);
    }
  }

  async function submitTier(event: FormEvent) {
    event.preventDefault();
    const normalizedCurrency = tierCurrency.trim().toUpperCase();
    const rank = Number.parseInt(tierRank, 10);
    const minimumQualifyingSpend = Number.parseInt(tierMinimumSpend, 10);
    const multiplier = Number.parseFloat(tierMultiplier);
    const pointsMultiplierBps = Math.round(multiplier * 10000);

    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      setError('Tier currency must use a 3-letter code such as IDR or MYR.');
      return;
    }
    if (!Number.isInteger(rank) || rank < 0) {
      setError('Tier rank must be a non-negative integer.');
      return;
    }
    if (!tierName.trim()) {
      setError('Tier name is required.');
      return;
    }
    if (!Number.isInteger(minimumQualifyingSpend) || minimumQualifyingSpend < 0) {
      setError('Minimum qualifying spend must be a non-negative integer.');
      return;
    }
    if (!Number.isFinite(multiplier) || multiplier < 1 || multiplier > 5) {
      setError('Points multiplier must be between 1.00× and 5.00×.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      await apiJson<MembershipTier>(
        `/api/staff/rewards/membership-tiers/${normalizedCurrency}/${rank}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: tierName.trim(),
            translations: {
              ...(tierNameId.trim() ? { ID_ID: tierNameId.trim() } : {}),
              ...(tierNameMs.trim() ? { MS_MY: tierNameMs.trim() } : {}),
              ...(tierNameEn.trim() ? { EN: tierNameEn.trim() } : {}),
            },
            minimumQualifyingSpend,
            pointsMultiplierBps,
            active: tierActive,
          }),
        },
      );
      setMessage(`${normalizedCurrency} membership tier rank ${rank} saved.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tier update failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <StaffShell staff={staff}>
      <header className="page-heading">
        <div>
          <p className="eyebrow">LOYALTY CONTROL</p>
          <h1>Fusion Points & Membership</h1>
          <p>
            Configure earning rates and real membership benefits. No tier is
            active until an authorized staff member deliberately enables it.
          </p>
        </div>
      </header>

      {error ? <div className="inline-alert">{error}</div> : null}
      {message ? <div className="detail-card">{message}</div> : null}

      <div className="order-detail-grid">
        <section className="detail-card">
          <p className="eyebrow">EARNING PROGRAMS</p>
          <h2>Configured currencies</h2>
          <div className="team-list">
            {programs.length === 0 ? (
              <p>No rewards program configured yet.</p>
            ) : (
              programs.map((program) => (
                <article className="team-row" key={program.id}>
                  <div className="team-avatar">{program.currency}</div>
                  <div className="team-name">
                    <strong>{program.currency}</strong>
                    <span>
                      {program.pointsPerUnit} point(s) per {program.spendUnit}{' '}
                      minor currency units
                    </span>
                  </div>
                  <span className="team-role">
                    {program.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <button className="text-button" type="button" onClick={() => edit(program)}>
                    Edit
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="detail-card">
          <p className="eyebrow">POINTS SETTINGS</p>
          <h2>{currency.trim().toUpperCase() || 'Currency'}</h2>
          <p>
            Example values are not activated automatically. Choose production
            earning values deliberately for each currency.
          </p>
          <form className="form-stack" onSubmit={submit}>
            <label>
              Currency
              <input required maxLength={3} placeholder="IDR" value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} />
            </label>
            <label>
              Spend unit (minor currency units)
              <input required min={1} inputMode="numeric" type="number" value={spendUnit} onChange={(event) => setSpendUnit(event.target.value)} />
            </label>
            <label>
              Points per spend unit
              <input required min={1} inputMode="numeric" type="number" value={pointsPerUnit} onChange={(event) => setPointsPerUnit(event.target.value)} />
            </label>
            <label>
              <span>Program status</span>
              <select value={active ? 'ACTIVE' : 'INACTIVE'} onChange={(event) => setActive(event.target.value === 'ACTIVE')}>
                <option value="INACTIVE">Inactive</option>
                <option value="ACTIVE">Active</option>
              </select>
            </label>
            <button className="primary-button" disabled={busy}>
              {busy ? 'Saving…' : 'Save rewards program'}
            </button>
          </form>
        </section>
      </div>

      <div className="order-detail-grid">
        <section className="detail-card">
          <p className="eyebrow">MEMBERSHIP TIERS</p>
          <h2>Configured tiers</h2>
          <p>
            Qualification uses completed customer spend. A newly reached tier
            applies its points multiplier starting with the next completed order.
          </p>
          <div className="team-list">
            {tiers.length === 0 ? (
              <p>No membership tiers configured. Customers remain base members.</p>
            ) : (
              tiers.map((tier) => (
                <article className="team-row" key={tier.id}>
                  <div className="team-avatar">{tier.rank}</div>
                  <div className="team-name">
                    <strong>{tier.name}</strong>
                    <span>
                      {tier.currency} · from {tier.minimumQualifyingSpend} ·{' '}
                      {(tier.pointsMultiplierBps / 10000).toFixed(2)}× points
                    </span>
                  </div>
                  <span className="team-role">{tier.active ? 'ACTIVE' : 'INACTIVE'}</span>
                  <button className="text-button" type="button" onClick={() => editTier(tier)}>
                    Edit
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="detail-card">
          <p className="eyebrow">TIER SETTINGS</p>
          <h2>{tierName.trim() || 'Membership tier'}</h2>
          <form className="form-stack" onSubmit={submitTier}>
            <label>
              Currency
              <input required maxLength={3} placeholder="IDR" value={tierCurrency} onChange={(event) => setTierCurrency(event.target.value.toUpperCase())} />
            </label>
            <label>
              Rank
              <input required min={0} type="number" inputMode="numeric" value={tierRank} onChange={(event) => setTierRank(event.target.value)} />
            </label>
            <label>
              Default tier name
              <input required maxLength={40} value={tierName} onChange={(event) => setTierName(event.target.value)} />
            </label>
            <label>
              Bahasa Indonesia name (optional)
              <input maxLength={40} value={tierNameId} onChange={(event) => setTierNameId(event.target.value)} />
            </label>
            <label>
              Bahasa Melayu name (optional)
              <input maxLength={40} value={tierNameMs} onChange={(event) => setTierNameMs(event.target.value)} />
            </label>
            <label>
              English name (optional)
              <input maxLength={40} value={tierNameEn} onChange={(event) => setTierNameEn(event.target.value)} />
            </label>
            <label>
              Minimum qualifying spend (minor currency units)
              <input required min={0} type="number" inputMode="numeric" value={tierMinimumSpend} onChange={(event) => setTierMinimumSpend(event.target.value)} />
            </label>
            <label>
              Points multiplier (1.00×–5.00×)
              <input required min={1} max={5} step="0.01" type="number" inputMode="decimal" value={tierMultiplier} onChange={(event) => setTierMultiplier(event.target.value)} />
            </label>
            <label>
              <span>Tier status</span>
              <select value={tierActive ? 'ACTIVE' : 'INACTIVE'} onChange={(event) => setTierActive(event.target.value === 'ACTIVE')}>
                <option value="INACTIVE">Inactive</option>
                <option value="ACTIVE">Active</option>
              </select>
            </label>
            <button className="primary-button" disabled={busy}>
              {busy ? 'Saving…' : 'Save membership tier'}
            </button>
          </form>
        </section>
      </div>
    </StaffShell>
  );
}
''',
)

# Dedicated e2e coverage proves qualification and multiplier behavior.
write(
    "services/api/test/membership.e2e-spec.ts",
    '''import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { createOpaqueToken, hashOpaqueToken } from './../src/auth/crypto.util';
import { PrismaService } from './../src/database/prisma.service';
import { StaffRole } from './../src/generated/prisma/enums';

type OrderResponse = { id: string; subtotal: number };
type MembershipResponse = {
  balance: number;
  membership: {
    currency: string;
    qualifyingSpend: number;
    pointsMultiplierBps: number;
    currentTier: { name: string; rank: number } | null;
    nextTier: { name: string; rank: number } | null;
    remainingToNextTier: number;
  };
};

describe('Fusionify Membership (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let sequence = 0;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    app = moduleFixture.createNestApplication({ rawBody: true });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  async function customerSession() {
    sequence += 1;
    const user = await prisma.customerUser.create({
      data: {
        fullName: 'Membership Test Customer',
        phoneCountry: 'ID',
        phoneE164: `+628188${Date.now()}${sequence}`,
        phoneVerifiedAt: new Date(),
        passwordHash: 'test-only-unused',
      },
    });
    const accessToken = createOpaqueToken();
    const refreshToken = createOpaqueToken();
    await prisma.userSession.create({
      data: {
        userId: user.id,
        accessTokenHash: hashOpaqueToken(accessToken),
        refreshTokenHash: hashOpaqueToken(refreshToken),
        accessExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        refreshExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    return { accessToken };
  }

  async function staffSession(role: StaffRole) {
    sequence += 1;
    const staff = await prisma.staffUser.create({
      data: {
        fullName: 'Membership Test Staff',
        email: `membership-staff-${Date.now()}-${sequence}@example.com`,
        passwordHash: 'test-only-unused',
        role,
      },
    });
    const accessToken = createOpaqueToken();
    const refreshToken = createOpaqueToken();
    await prisma.staffSession.create({
      data: {
        staffUserId: staff.id,
        accessTokenHash: hashOpaqueToken(accessToken),
        refreshTokenHash: hashOpaqueToken(refreshToken),
        accessExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        refreshExpiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
    });
    return { accessToken };
  }

  async function createAndCompleteOrder(
    customerToken: string,
    staffToken: string,
  ) {
    const created = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', `membership-order-${Date.now()}-${sequence++}`)
      .send({
        outletId: 'preview-outlet',
        items: [
          {
            productId: 'aren-latte',
            quantity: 1,
            modifierOptionIds: [
              'aren-latte-size-regular',
              'aren-latte-temperature-iced',
              'aren-latte-sugar-sugar-50',
              'aren-latte-ice-normal-ice',
              'aren-latte-milk-fresh-milk',
            ],
          },
        ],
      })
      .expect(201);
    const order = created.body as unknown as OrderResponse;

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED' },
      }),
      prisma.orderStatusEvent.create({
        data: {
          orderId: order.id,
          fromStatus: 'AWAITING_PAYMENT',
          toStatus: 'CONFIRMED',
          note: 'E2E simulated paid order.',
        },
      }),
    ]);

    for (const status of ['PREPARING', 'READY', 'PICKED_UP', 'COMPLETED']) {
      await request(app.getHttpServer())
        .post(`/v1/staff/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ toStatus: status })
        .expect(201);
    }
    return order;
  }

  it('qualifies membership and applies its multiplier on the next order', async () => {
    const admin = await staffSession(StaffRole.SUPER_ADMIN);
    const customer = await customerSession();

    await request(app.getHttpServer())
      .put('/v1/staff/rewards/programs/IDR')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ spendUnit: 1000, pointsPerUnit: 1, active: true })
      .expect(200);

    await request(app.getHttpServer())
      .put('/v1/staff/rewards/membership-tiers/IDR/0')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: 'Base Test Tier',
        translations: { ID_ID: 'Tier Dasar Test' },
        minimumQualifyingSpend: 0,
        pointsMultiplierBps: 10000,
        active: true,
      })
      .expect(200);
    await request(app.getHttpServer())
      .put('/v1/staff/rewards/membership-tiers/IDR/1')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: 'Plus Test Tier',
        translations: { ID_ID: 'Tier Plus Test' },
        minimumQualifyingSpend: 28000,
        pointsMultiplierBps: 15000,
        active: true,
      })
      .expect(200);

    await createAndCompleteOrder(customer.accessToken, admin.accessToken);

    const firstSummaryResponse = await request(app.getHttpServer())
      .get('/v1/rewards/me')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .set('Accept-Language', 'id-ID')
      .expect(200);
    const firstSummary =
      firstSummaryResponse.body as unknown as MembershipResponse;

    expect(firstSummary.balance).toBe(28);
    expect(firstSummary.membership.qualifyingSpend).toBe(28000);
    expect(firstSummary.membership.currentTier?.name).toBe('Tier Plus Test');
    expect(firstSummary.membership.pointsMultiplierBps).toBe(15000);

    await createAndCompleteOrder(customer.accessToken, admin.accessToken);

    const secondSummaryResponse = await request(app.getHttpServer())
      .get('/v1/rewards/me')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .expect(200);
    const secondSummary =
      secondSummaryResponse.body as unknown as MembershipResponse;

    expect(secondSummary.balance).toBe(70);
    expect(secondSummary.membership.qualifyingSpend).toBe(56000);
    expect(secondSummary.membership.currentTier?.rank).toBe(1);
  });

  it('does not let a cashier configure membership tiers', async () => {
    const cashier = await staffSession(StaffRole.CASHIER);
    await request(app.getHttpServer())
      .put('/v1/staff/rewards/membership-tiers/IDR/0')
      .set('Authorization', `Bearer ${cashier.accessToken}`)
      .send({
        name: 'Blocked Tier',
        minimumQualifyingSpend: 0,
        pointsMultiplierBps: 10000,
        active: true,
      })
      .expect(403);
  });
});
''',
)

# Flutter model coverage.
write(
    "apps/customer/test/membership_model_test.dart",
    '''import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/features/rewards/domain/rewards_models.dart';

void main() {
  test('parses membership tier progress from rewards summary', () {
    final summary = RewardsSummary.fromJson({
      'balance': 70,
      'lifetimeEarned': 70,
      'lifetimeRedeemed': 0,
      'recentActivity': <dynamic>[],
      'membership': {
        'currency': 'IDR',
        'qualifyingSpend': 56000,
        'pointsMultiplierBps': 15000,
        'remainingToNextTier': 44000,
        'currentTier': {
          'id': 'tier-plus',
          'currency': 'IDR',
          'rank': 1,
          'name': 'Plus',
          'minimumQualifyingSpend': 28000,
          'pointsMultiplierBps': 15000,
        },
        'nextTier': {
          'id': 'tier-next',
          'currency': 'IDR',
          'rank': 2,
          'name': 'Next',
          'minimumQualifyingSpend': 100000,
          'pointsMultiplierBps': 20000,
        },
      },
    });

    expect(summary.membership.currentTier?.name, 'Plus');
    expect(summary.membership.nextTier?.name, 'Next');
    expect(summary.membership.pointsMultiplierBps, 15000);
    expect(summary.membership.progressToNextTier, closeTo(0.3889, 0.001));
  });
}
''',
)

print('Membership implementation staged successfully.')
