import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { LoyaltyEntryType, PhoneCountry } from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import { StaffAuthService } from '../staff/staff-auth.service';
import type {
  ConfigureRewardCatalogItemInput,
  RewardCatalogTranslations,
} from './reward-catalog.types';

@Injectable()
export class RewardCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly staffAuthService: StaffAuthService,
  ) {}

  async listForCustomer(userId: string, languageValue?: string) {
    const user = await this.prisma.customerUser.findUnique({
      where: { id: userId },
      select: {
        phoneCountry: true,
        loyaltyAccount: { select: { balance: true } },
      },
    });
    if (!user) throw new NotFoundException('Customer account not found.');

    const currency = user.phoneCountry === PhoneCountry.MY ? 'MYR' : 'IDR';
    const language = this.normalizeLanguage(languageValue);
    const now = new Date();
    const items = await this.prisma.rewardCatalogItem.findMany({
      where: {
        currency,
        active: true,
        voucher: {
          active: true,
          validFrom: { lte: now },
          validUntil: { gt: now },
        },
      },
      include: { voucher: true },
      orderBy: [{ pointsCost: 'asc' }, { createdAt: 'asc' }],
    });

    const balance = user.loyaltyAccount?.balance ?? 0;
    return {
      balance,
      currency,
      items: items.map((item) => ({
        ...this.itemView(item, language),
        affordable: balance >= item.pointsCost,
        inStock:
          item.stockLimit == null || item.redeemedCount < item.stockLimit,
      })),
    };
  }

  listConfigured() {
    return this.prisma.rewardCatalogItem.findMany({
      include: { voucher: true },
      orderBy: [{ currency: 'asc' }, { pointsCost: 'asc' }],
    });
  }

  async configure(
    staffUserId: string,
    itemId: string,
    input: ConfigureRewardCatalogItemInput,
  ) {
    const id = itemId.trim();
    if (!id || id.length > 80) {
      throw new BadRequestException('Reward item id is invalid.');
    }
    const title = input.title?.trim();
    if (!title || title.length > 80) {
      throw new BadRequestException('Reward title is required.');
    }
    const currency = this.normalizeCurrency(input.currency);
    if (!Number.isInteger(input.pointsCost) || input.pointsCost <= 0) {
      throw new BadRequestException('pointsCost must be positive.');
    }
    if (
      input.stockLimit != null &&
      (!Number.isInteger(input.stockLimit) || input.stockLimit < 0)
    ) {
      throw new BadRequestException('stockLimit must be non-negative.');
    }

    const voucher = await this.prisma.voucher.findUnique({
      where: { id: input.voucherId },
    });
    if (!voucher) throw new NotFoundException('Voucher not found.');
    if (voucher.currency !== currency) {
      throw new BadRequestException(
        'Reward and voucher currencies must be identical.',
      );
    }

    const item = await this.prisma.rewardCatalogItem.upsert({
      where: { id },
      update: {
        title,
        description: input.description?.trim() ?? '',
        translations: this.cleanTranslations(input.translations ?? {}),
        currency,
        pointsCost: input.pointsCost,
        voucherId: voucher.id,
        active: input.active,
        stockLimit: input.stockLimit ?? null,
      },
      create: {
        id,
        title,
        description: input.description?.trim() ?? '',
        translations: this.cleanTranslations(input.translations ?? {}),
        currency,
        pointsCost: input.pointsCost,
        voucherId: voucher.id,
        active: input.active,
        stockLimit: input.stockLimit ?? null,
      },
      include: { voucher: true },
    });

    await this.staffAuthService.audit(staffUserId, 'REWARD_ITEM_CONFIGURED', {
      targetType: 'RewardCatalogItem',
      targetId: item.id,
      metadata: {
        currency: item.currency,
        pointsCost: item.pointsCost,
        voucherId: item.voucherId,
        active: item.active,
      },
    });
    return item;
  }

  async redeem(userId: string, itemId: string, idempotencyKey: string) {
    this.validateIdempotencyKey(idempotencyKey);
    const existing = await this.prisma.rewardRedemption.findUnique({
      where: { idempotencyKey },
      include: {
        rewardItem: true,
        customerVoucher: { include: { voucher: true } },
      },
    });
    if (existing) {
      if (existing.userId !== userId) {
        throw new ConflictException('Idempotency key is already in use.');
      }
      return existing;
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const [user, item] = await Promise.all([
          tx.customerUser.findUnique({
            where: { id: userId },
            select: {
              phoneCountry: true,
              loyaltyAccount: true,
            },
          }),
          tx.rewardCatalogItem.findUnique({
            where: { id: itemId },
            include: { voucher: true },
          }),
        ]);
        if (!user) throw new NotFoundException('Customer account not found.');
        if (!item || !item.active) {
          throw new NotFoundException('Reward item is not available.');
        }
        const currency = user.phoneCountry === PhoneCountry.MY ? 'MYR' : 'IDR';
        const now = new Date();
        if (
          item.currency !== currency ||
          !item.voucher.active ||
          item.voucher.validFrom > now ||
          item.voucher.validUntil <= now
        ) {
          throw new ConflictException(
            'Reward item is not currently redeemable.',
          );
        }
        const account = user.loyaltyAccount;
        if (!account || account.balance < item.pointsCost) {
          throw new ConflictException('Insufficient Fusion Points.');
        }

        const stockUpdate = await tx.rewardCatalogItem.updateMany({
          where: {
            id: item.id,
            active: true,
            OR: [
              { stockLimit: null },
              { redeemedCount: { lt: item.stockLimit ?? 0 } },
            ],
          },
          data: { redeemedCount: { increment: 1 } },
        });
        if (stockUpdate.count !== 1) {
          throw new ConflictException('Reward item is out of stock.');
        }

        const accountUpdate = await tx.loyaltyAccount.updateMany({
          where: { id: account.id, balance: { gte: item.pointsCost } },
          data: {
            balance: { decrement: item.pointsCost },
            lifetimeRedeemed: { increment: item.pointsCost },
          },
        });
        if (accountUpdate.count !== 1) {
          throw new ConflictException('Insufficient Fusion Points.');
        }
        const updatedAccount = await tx.loyaltyAccount.findUniqueOrThrow({
          where: { id: account.id },
        });

        await tx.loyaltyLedgerEntry.create({
          data: {
            accountId: account.id,
            type: LoyaltyEntryType.REDEEM_REWARD,
            points: -item.pointsCost,
            balanceAfter: updatedAccount.balance,
            note: `Redeemed reward ${item.id}.`,
          },
        });
        const customerVoucher = await tx.customerVoucher.create({
          data: {
            userId,
            voucherId: item.voucherId,
            source: 'POINTS_REWARD',
            expiresAt: item.voucher.validUntil,
          },
        });
        return tx.rewardRedemption.create({
          data: {
            idempotencyKey,
            userId,
            rewardItemId: item.id,
            customerVoucherId: customerVoucher.id,
            pointsSpent: item.pointsCost,
          },
          include: {
            rewardItem: true,
            customerVoucher: { include: { voucher: true } },
          },
        });
      });
    } catch (error: unknown) {
      const duplicate = await this.prisma.rewardRedemption.findUnique({
        where: { idempotencyKey },
        include: {
          rewardItem: true,
          customerVoucher: { include: { voucher: true } },
        },
      });
      if (duplicate?.userId === userId) return duplicate;
      throw error;
    }
  }

  private itemView(
    item: {
      id: string;
      title: string;
      description: string;
      translations: Prisma.JsonValue | null;
      currency: string;
      pointsCost: number;
      voucherId: string;
      stockLimit: number | null;
      redeemedCount: number;
      voucher: { code: string; validUntil: Date };
    },
    language: 'ID_ID' | 'MS_MY' | 'EN',
  ) {
    const translated = this.translationObject(item.translations)[language];
    return {
      id: item.id,
      title: translated?.title ?? item.title,
      description: translated?.description ?? item.description,
      currency: item.currency,
      pointsCost: item.pointsCost,
      voucherId: item.voucherId,
      voucherCode: item.voucher.code,
      voucherValidUntil: item.voucher.validUntil,
      stockLimit: item.stockLimit,
      redeemedCount: item.redeemedCount,
    };
  }

  private cleanTranslations(value: RewardCatalogTranslations) {
    const result: RewardCatalogTranslations = {};
    for (const key of ['ID_ID', 'MS_MY', 'EN'] as const) {
      const entry = value[key];
      if (!entry) continue;
      const title = entry.title?.trim();
      const description = entry.description?.trim();
      if (title || description) {
        result[key] = {
          ...(title ? { title: title.slice(0, 80) } : {}),
          ...(description ? { description: description.slice(0, 240) } : {}),
        };
      }
    }
    return result;
  }

  private translationObject(value: Prisma.JsonValue | null) {
    if (!value || Array.isArray(value) || typeof value !== 'object') {
      return {} as Record<string, { title?: string; description?: string }>;
    }
    const result: Record<string, { title?: string; description?: string }> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (!entry || Array.isArray(entry) || typeof entry !== 'object') continue;
      result[key] = {
        ...(typeof entry.title === 'string' ? { title: entry.title } : {}),
        ...(typeof entry.description === 'string'
          ? { description: entry.description }
          : {}),
      };
    }
    return result;
  }

  private normalizeLanguage(value?: string) {
    const normalized = value?.trim().toLowerCase() ?? '';
    if (normalized.startsWith('ms') || normalized === 'ms_my') return 'MS_MY';
    if (normalized.startsWith('en')) return 'EN';
    return 'ID_ID';
  }

  private normalizeCurrency(value: string) {
    const currency = value?.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new BadRequestException('Currency must be a 3-letter code.');
    }
    return currency;
  }

  private validateIdempotencyKey(value: string) {
    if (!value || value.length > 128) {
      throw new BadRequestException('A valid Idempotency-Key is required.');
    }
  }
}
