import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { DigitalBenefitType } from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import { StaffAuthService } from '../staff/staff-auth.service';
import {
  decryptBenefitPayload,
  encryptBenefitPayload,
} from './benefit-crypto.util';
import type {
  ConfigureAiBenefitInput,
  ConfigureWifiBenefitInput,
} from './benefits.types';

@Injectable()
export class BenefitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly staffAuthService: StaffAuthService,
  ) {}

  async configureWifi(
    staffUserId: string,
    outletId: string,
    input: ConfigureWifiBenefitInput,
  ) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: outletId },
    });
    if (!outlet) throw new NotFoundException('Outlet not found.');
    const ssid = input.ssid?.trim();
    if (!ssid || ssid.length > 64) {
      throw new BadRequestException('Wi-Fi SSID is required.');
    }
    if (!input.password || input.password.length > 128) {
      throw new BadRequestException('Wi-Fi password is required.');
    }
    this.validateHours(input.entitlementHours);
    const config = await this.prisma.wifiBenefitConfig.upsert({
      where: { outletId },
      update: {
        ssid,
        passwordEncrypted: encryptBenefitPayload({ password: input.password }),
        entitlementHours: input.entitlementHours,
        active: input.active,
      },
      create: {
        outletId,
        ssid,
        passwordEncrypted: encryptBenefitPayload({ password: input.password }),
        entitlementHours: input.entitlementHours,
        active: input.active,
      },
    });
    await this.staffAuthService.audit(staffUserId, 'WIFI_BENEFIT_CONFIGURED', {
      targetType: 'Outlet',
      targetId: outletId,
      metadata: {
        active: config.active,
        entitlementHours: config.entitlementHours,
      },
    });
    return {
      id: config.id,
      outletId: config.outletId,
      ssid: config.ssid,
      entitlementHours: config.entitlementHours,
      active: config.active,
    };
  }

  async configureAi(
    staffUserId: string,
    outletId: string,
    input: ConfigureAiBenefitInput,
  ) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: outletId },
    });
    if (!outlet) throw new NotFoundException('Outlet not found.');
    if (
      !Number.isInteger(input.dailyQuota) ||
      input.dailyQuota <= 0 ||
      input.dailyQuota > 100000
    ) {
      throw new BadRequestException('dailyQuota must be a positive integer.');
    }
    this.validateHours(input.entitlementHours);
    const config = await this.prisma.aiBenefitConfig.upsert({
      where: { outletId },
      update: {
        dailyQuota: input.dailyQuota,
        entitlementHours: input.entitlementHours,
        active: input.active,
      },
      create: {
        outletId,
        dailyQuota: input.dailyQuota,
        entitlementHours: input.entitlementHours,
        active: input.active,
      },
    });
    await this.staffAuthService.audit(staffUserId, 'AI_BENEFIT_CONFIGURED', {
      targetType: 'Outlet',
      targetId: outletId,
      metadata: {
        active: config.active,
        dailyQuota: config.dailyQuota,
        entitlementHours: config.entitlementHours,
      },
    });
    return config;
  }

  async issueCompletedOrder(tx: Prisma.TransactionClient, orderId: string) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        outletId: true,
        outlet: {
          select: {
            wifiBenefitConfig: true,
            aiBenefitConfig: true,
          },
        },
      },
    });
    if (!order?.userId) return [];

    const now = new Date();
    const issued: string[] = [];
    const wifi = order.outlet.wifiBenefitConfig;
    if (wifi?.active) {
      const { password } = decryptBenefitPayload<{ password: string }>(
        wifi.passwordEncrypted,
      );
      await tx.digitalBenefitEntitlement.upsert({
        where: {
          orderId_type: { orderId, type: DigitalBenefitType.WIFI },
        },
        update: {},
        create: {
          userId: order.userId,
          orderId,
          type: DigitalBenefitType.WIFI,
          payloadEncrypted: encryptBenefitPayload({
            ssid: wifi.ssid,
            password,
          }),
          validFrom: now,
          validUntil: new Date(
            now.getTime() + wifi.entitlementHours * 60 * 60 * 1000,
          ),
        },
      });
      issued.push(DigitalBenefitType.WIFI);
    }

    const ai = order.outlet.aiBenefitConfig;
    if (ai?.active) {
      await tx.digitalBenefitEntitlement.upsert({
        where: { orderId_type: { orderId, type: DigitalBenefitType.AI } },
        update: {},
        create: {
          userId: order.userId,
          orderId,
          type: DigitalBenefitType.AI,
          quotaTotal: ai.dailyQuota,
          validFrom: now,
          validUntil: new Date(
            now.getTime() + ai.entitlementHours * 60 * 60 * 1000,
          ),
        },
      });
      issued.push(DigitalBenefitType.AI);
    }
    return issued;
  }

  async listForCustomer(userId: string) {
    const now = new Date();
    const rows = await this.prisma.digitalBenefitEntitlement.findMany({
      where: { userId },
      include: {
        order: {
          select: {
            id: true,
            createdAt: true,
            outlet: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      active: !row.revokedAt && row.validFrom <= now && row.validUntil > now,
      validFrom: row.validFrom,
      validUntil: row.validUntil,
      quotaTotal: row.quotaTotal,
      quotaUsed: row.quotaUsed,
      quotaRemaining:
        row.quotaTotal == null
          ? null
          : Math.max(0, row.quotaTotal - row.quotaUsed),
      payload:
        row.type === DigitalBenefitType.WIFI &&
        row.payloadEncrypted &&
        !row.revokedAt &&
        row.validUntil > now
          ? decryptBenefitPayload<Record<string, string>>(row.payloadEncrypted)
          : null,
      order: row.order,
    }));
  }

  async consumeAi(userId: string, entitlementId: string, units: number) {
    if (!Number.isInteger(units) || units <= 0 || units > 1000) {
      throw new BadRequestException('units must be a positive integer.');
    }
    const entitlement = await this.prisma.digitalBenefitEntitlement.findFirst({
      where: {
        id: entitlementId,
        userId,
        type: DigitalBenefitType.AI,
      },
    });
    const now = new Date();
    if (
      !entitlement ||
      entitlement.revokedAt ||
      entitlement.validFrom > now ||
      entitlement.validUntil <= now ||
      entitlement.quotaTotal == null
    ) {
      throw new NotFoundException('AI entitlement is not active.');
    }
    const updated = await this.prisma.digitalBenefitEntitlement.updateMany({
      where: {
        id: entitlement.id,
        quotaUsed: { lte: entitlement.quotaTotal - units },
      },
      data: { quotaUsed: { increment: units } },
    });
    if (updated.count !== 1) {
      throw new ConflictException('AI benefit quota is exhausted.');
    }
    return this.prisma.digitalBenefitEntitlement.findUniqueOrThrow({
      where: { id: entitlement.id },
    });
  }

  async receipt(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        outlet: { select: { id: true, name: true } },
        items: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        voucherRedemption: {
          include: { customerVoucher: { include: { voucher: true } } },
        },
        digitalEntitlements: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found.');
    return {
      orderId: order.id,
      createdAt: order.createdAt,
      status: order.status,
      fulfillmentType: order.fulfillmentType,
      scheduledFor: order.scheduledFor,
      outlet: order.outlet,
      currency: order.currency,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      deliveryFee: order.deliveryFee,
      totalAmount: order.totalAmount,
      items: order.items,
      payment: order.payments[0] ?? null,
      voucher: order.voucherRedemption?.customerVoucher.voucher ?? null,
      benefitIds: order.digitalEntitlements.map((entry) => entry.id),
    };
  }

  private validateHours(value: number) {
    if (!Number.isInteger(value) || value <= 0 || value > 720) {
      throw new BadRequestException(
        'entitlementHours must be an integer from 1 to 720.',
      );
    }
  }
}
