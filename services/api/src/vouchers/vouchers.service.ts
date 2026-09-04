import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import {
  CustomerVoucherStatus,
  VoucherDiscountType,
} from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import { StaffAuthService } from '../staff/staff-auth.service';
import type {
  ConfigureVoucherInput,
  IssueVoucherInput,
  VoucherTranslations,
} from './vouchers.types';

@Injectable()
export class VouchersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly staffAuthService: StaffAuthService,
  ) {}

  async listWallet(userId: string, languageValue?: string) {
    const language = this.normalizeLanguage(languageValue);
    const now = new Date();
    const rows = await this.prisma.customerVoucher.findMany({
      where: { userId },
      include: { voucher: true, redemption: true },
      orderBy: { issuedAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      source: row.source,
      issuedAt: row.issuedAt,
      expiresAt: row.expiresAt,
      usable:
        row.status === CustomerVoucherStatus.AVAILABLE &&
        row.voucher.active &&
        row.voucher.validFrom <= now &&
        row.voucher.validUntil > now &&
        (!row.expiresAt || row.expiresAt > now),
      voucher: this.voucherView(row.voucher, language),
      redemption: row.redemption,
    }));
  }

  listConfigured() {
    return this.prisma.voucher.findMany({
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async configure(
    staffUserId: string,
    codeValue: string,
    input: ConfigureVoucherInput,
  ) {
    const code = codeValue.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
      throw new BadRequestException(
        'Voucher code must contain 3 to 32 letters, numbers, underscores, or dashes.',
      );
    }
    const title = input.title?.trim();
    if (!title || title.length > 80) {
      throw new BadRequestException('Voucher title is required.');
    }
    const currency = this.normalizeCurrency(input.currency);
    const validFrom = this.parseDate(input.validFrom, 'validFrom');
    const validUntil = this.parseDate(input.validUntil, 'validUntil');
    if (validUntil <= validFrom) {
      throw new BadRequestException('validUntil must be after validFrom.');
    }
    this.validateDiscount(input);

    if (input.outletId) {
      const outlet = await this.prisma.outlet.findUnique({
        where: { id: input.outletId },
      });
      if (!outlet) throw new NotFoundException('Outlet not found.');
    }

    const voucher = await this.prisma.voucher.upsert({
      where: { code },
      update: {
        title,
        description: input.description?.trim() ?? '',
        translations: this.cleanTranslations(input.translations ?? {}),
        currency,
        discountType: input.discountType,
        discountValue: input.discountValue,
        minimumSpend: input.minimumSpend ?? 0,
        maximumDiscount: input.maximumDiscount ?? null,
        outletId: input.outletId ?? null,
        validFrom,
        validUntil,
        active: input.active,
      },
      create: {
        code,
        title,
        description: input.description?.trim() ?? '',
        translations: this.cleanTranslations(input.translations ?? {}),
        currency,
        discountType: input.discountType,
        discountValue: input.discountValue,
        minimumSpend: input.minimumSpend ?? 0,
        maximumDiscount: input.maximumDiscount ?? null,
        outletId: input.outletId ?? null,
        validFrom,
        validUntil,
        active: input.active,
      },
    });

    await this.staffAuthService.audit(staffUserId, 'VOUCHER_CONFIGURED', {
      targetType: 'Voucher',
      targetId: voucher.id,
      metadata: {
        code: voucher.code,
        currency: voucher.currency,
        active: voucher.active,
      },
    });
    return voucher;
  }

  async issue(
    staffUserId: string,
    codeValue: string,
    input: IssueVoucherInput,
  ) {
    const code = codeValue.trim().toUpperCase();
    const [voucher, user] = await Promise.all([
      this.prisma.voucher.findUnique({ where: { code } }),
      this.prisma.customerUser.findUnique({ where: { id: input.userId } }),
    ]);
    if (!voucher) throw new NotFoundException('Voucher not found.');
    if (!user) throw new NotFoundException('Customer not found.');

    const expiresAt = input.expiresAt
      ? this.parseDate(input.expiresAt, 'expiresAt')
      : null;
    const customerVoucher = await this.prisma.customerVoucher.create({
      data: {
        userId: user.id,
        voucherId: voucher.id,
        source: (input.source ?? 'STAFF').trim().slice(0, 40) || 'STAFF',
        expiresAt,
      },
      include: { voucher: true },
    });

    await this.staffAuthService.audit(staffUserId, 'VOUCHER_ISSUED', {
      targetType: 'CustomerVoucher',
      targetId: customerVoucher.id,
      metadata: { code: voucher.code, userId: user.id },
    });
    return customerVoucher;
  }

  private validateDiscount(input: ConfigureVoucherInput) {
    if (!Object.values(VoucherDiscountType).includes(input.discountType)) {
      throw new BadRequestException('Unsupported voucher discount type.');
    }
    if (!Number.isInteger(input.discountValue) || input.discountValue <= 0) {
      throw new BadRequestException('discountValue must be positive.');
    }
    if (
      input.discountType === VoucherDiscountType.PERCENTAGE_BPS &&
      input.discountValue > 10000
    ) {
      throw new BadRequestException('Percentage discount cannot exceed 100%.');
    }
    const minimumSpend = input.minimumSpend ?? 0;
    if (!Number.isInteger(minimumSpend) || minimumSpend < 0) {
      throw new BadRequestException('minimumSpend must be non-negative.');
    }
    if (
      input.maximumDiscount != null &&
      (!Number.isInteger(input.maximumDiscount) || input.maximumDiscount <= 0)
    ) {
      throw new BadRequestException('maximumDiscount must be positive.');
    }
  }

  private voucherView(
    voucher: {
      id: string;
      code: string;
      title: string;
      description: string;
      translations: Prisma.JsonValue | null;
      currency: string;
      discountType: VoucherDiscountType;
      discountValue: number;
      minimumSpend: number;
      maximumDiscount: number | null;
      outletId: string | null;
      validFrom: Date;
      validUntil: Date;
      active: boolean;
    },
    language: 'ID_ID' | 'MS_MY' | 'EN',
  ) {
    const translated = this.translationObject(voucher.translations)[language];
    return {
      id: voucher.id,
      code: voucher.code,
      title: translated?.title ?? voucher.title,
      description: translated?.description ?? voucher.description,
      currency: voucher.currency,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      minimumSpend: voucher.minimumSpend,
      maximumDiscount: voucher.maximumDiscount,
      outletId: voucher.outletId,
      validFrom: voucher.validFrom,
      validUntil: voucher.validUntil,
      active: voucher.active,
    };
  }

  private cleanTranslations(value: VoucherTranslations) {
    const result: VoucherTranslations = {};
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
      return {} as Record<
        string,
        { title?: string; description?: string }
      >;
    }
    const result: Record<string, { title?: string; description?: string }> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (!entry || Array.isArray(entry) || typeof entry !== 'object') continue;
      const title = typeof entry.title === 'string' ? entry.title : undefined;
      const description =
        typeof entry.description === 'string' ? entry.description : undefined;
      result[key] = { title, description };
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

  private parseDate(value: string, field: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO date.`);
    }
    return date;
  }
}
