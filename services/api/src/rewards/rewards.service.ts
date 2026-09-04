import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { LoyaltyEntryType, OrderStatus } from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import { StaffAuthService } from '../staff/staff-auth.service';
import type { ConfigureLoyaltyProgramInput } from './rewards.types';

@Injectable()
export class RewardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly staffAuthService: StaffAuthService,
  ) {}

  async getCustomerSummary(userId: string) {
    const account = await this.prisma.loyaltyAccount.findUnique({
      where: { userId },
      include: {
        entries: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    return {
      balance: account?.balance ?? 0,
      lifetimeEarned: account?.lifetimeEarned ?? 0,
      lifetimeRedeemed: account?.lifetimeRedeemed ?? 0,
      recentActivity: account?.entries ?? [],
    };
  }

  listPrograms() {
    return this.prisma.loyaltyProgram.findMany({
      orderBy: { currency: 'asc' },
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

    await this.staffAuthService.audit(
      staffUserId,
      'LOYALTY_PROGRAM_UPDATED',
      {
        targetType: 'LoyaltyProgram',
        targetId: program.id,
        metadata: {
          currency: program.currency,
          spendUnit: program.spendUnit,
          pointsPerUnit: program.pointsPerUnit,
          active: program.active,
        },
      },
    );

    return program;
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
      },
    });

    if (
      !order ||
      !order.userId ||
      order.status !== OrderStatus.COMPLETED
    ) {
      return null;
    }

    const existing = await tx.loyaltyLedgerEntry.findUnique({
      where: { orderId: order.id },
    });
    if (existing) {
      return existing;
    }

    const program = await tx.loyaltyProgram.findUnique({
      where: { currency: order.currency },
    });
    if (!program?.active) {
      return null;
    }

    const points =
      Math.floor(order.subtotal / program.spendUnit) * program.pointsPerUnit;
    if (points <= 0) {
      return null;
    }

    await tx.loyaltyAccount.upsert({
      where: { userId: order.userId },
      update: {},
      create: { userId: order.userId },
    });

    const account = await tx.loyaltyAccount.update({
      where: { userId: order.userId },
      data: {
        balance: { increment: points },
        lifetimeEarned: { increment: points },
      },
    });

    return tx.loyaltyLedgerEntry.create({
      data: {
        accountId: account.id,
        type: LoyaltyEntryType.ORDER_REWARD,
        points,
        balanceAfter: account.balance,
        orderId: order.id,
        note: 'Eligible completed order reward.',
      },
    });
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
}
