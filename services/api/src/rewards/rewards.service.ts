import {
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
