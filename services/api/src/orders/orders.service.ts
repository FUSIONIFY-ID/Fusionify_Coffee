import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CustomerVoucherStatus,
  FulfillmentType,
  OrderStatus,
  PaymentStatus,
  VoucherDiscountType,
  VoucherRedemptionStatus,
} from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import type {
  CreateOrderInput,
  CreateOrderItemInput,
  SelectedModifierSnapshot,
} from './orders.types';

const scheduleLeadMs = 15 * 60 * 1000;
const scheduleHorizonMs = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateOrderInput, checkoutKey: string, userId: string) {
    return this.createOwned(input, checkoutKey, userId);
  }

  async createForStaff(input: CreateOrderInput, checkoutKey: string) {
    return this.createOwned(input, checkoutKey, null);
  }

  private async createOwned(
    input: CreateOrderInput,
    checkoutKey: string,
    userId: string | null,
  ) {
    this.validateCheckoutKey(checkoutKey);
    this.validateInput(input);

    const existing = await this.prisma.order.findUnique({
      where: { checkoutKey },
      include: { items: true, payments: true },
    });
    if (existing) {
      if (existing.userId !== userId) {
        throw new ConflictException('Checkout key is already in use.');
      }
      return existing;
    }

    const outlet = await this.prisma.outlet.findUnique({
      where: { id: input.outletId },
    });
    if (!outlet) throw new BadRequestException('Outlet is not available.');

    const fulfillmentType = input.fulfillmentType ?? FulfillmentType.PICKUP;
    const scheduledFor = this.resolveSchedule(input.scheduledFor);
    let savedAddressId: string | null = null;
    let deliveryAddressSnapshot: Prisma.InputJsonValue | undefined;
    let deliveryDistanceMeters: number | null = null;
    let deliveryFee = 0;

    if (fulfillmentType === FulfillmentType.PICKUP) {
      if (!outlet.pickupEnabled) {
        throw new BadRequestException('Pickup outlet is not available.');
      }
      if (input.savedAddressId) {
        throw new BadRequestException('Pickup orders cannot use an address.');
      }
    } else if (fulfillmentType === FulfillmentType.DELIVERY) {
      if (!userId) {
        throw new BadRequestException(
          'Delivery requires an authenticated customer account.',
        );
      }
      if (
        !outlet.deliveryEnabled ||
        outlet.latitude == null ||
        outlet.longitude == null ||
        outlet.deliveryRadiusMeters == null
      ) {
        throw new BadRequestException('Delivery is not configured for outlet.');
      }
      if (!input.savedAddressId) {
        throw new BadRequestException(
          'savedAddressId is required for delivery.',
        );
      }
      const address = await this.prisma.savedAddress.findFirst({
        where: { id: input.savedAddressId, userId },
      });
      if (!address) throw new NotFoundException('Saved address not found.');

      deliveryDistanceMeters = Math.round(
        this.distanceMeters(
          outlet.latitude,
          outlet.longitude,
          address.latitude,
          address.longitude,
        ),
      );
      if (deliveryDistanceMeters > outlet.deliveryRadiusMeters) {
        throw new BadRequestException('Address is outside delivery area.');
      }
      deliveryFee =
        outlet.deliveryBaseFee +
        Math.ceil(deliveryDistanceMeters / 1000) * outlet.deliveryPerKmFee;
      savedAddressId = address.id;
      deliveryAddressSnapshot = {
        label: address.label,
        recipientName: address.recipientName,
        phoneE164: address.phoneE164,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        region: address.region,
        postalCode: address.postalCode,
        country: address.country,
        latitude: address.latitude,
        longitude: address.longitude,
        deliveryNotes: address.deliveryNotes,
      };
    } else {
      throw new BadRequestException('Unsupported fulfillment type.');
    }

    const productIds = [...new Set(input.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      include: {
        modifierGroups: {
          orderBy: { sortOrder: 'asc' },
          include: {
            options: {
              where: { active: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );
    const pricedItems = input.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(
          `Product ${item.productId} is not available.`,
        );
      }
      const selectedOptionIds = item.modifierOptionIds ?? [];
      if (new Set(selectedOptionIds).size !== selectedOptionIds.length) {
        throw new BadRequestException(
          `Duplicate modifier option for product ${product.id}.`,
        );
      }
      const selectedModifiers: SelectedModifierSnapshot[] = [];
      const selectedByGroup = new Map<string, string[]>();
      const knownOptionIds = new Set<string>();
      for (const group of product.modifierGroups) {
        for (const option of group.options) {
          knownOptionIds.add(option.id);
          if (selectedOptionIds.includes(option.id)) {
            const current = selectedByGroup.get(group.id) ?? [];
            current.push(option.id);
            selectedByGroup.set(group.id, current);
            selectedModifiers.push({
              groupId: group.id,
              groupName: group.name,
              optionId: option.id,
              optionName: option.name,
              priceDelta: option.priceDelta,
            });
          }
        }
      }
      if (selectedOptionIds.some((optionId) => !knownOptionIds.has(optionId))) {
        throw new BadRequestException(
          `Invalid modifier option for product ${product.id}.`,
        );
      }
      for (const group of product.modifierGroups) {
        const count = selectedByGroup.get(group.id)?.length ?? 0;
        if (group.required && count === 0) {
          throw new BadRequestException(
            `Modifier group ${group.name} is required for ${product.name}.`,
          );
        }
        if (!group.allowMultiple && count > 1) {
          throw new BadRequestException(
            `Modifier group ${group.name} only allows one selection.`,
          );
        }
      }
      const optionTotal = selectedModifiers.reduce(
        (sum, modifier) => sum + modifier.priceDelta,
        0,
      );
      const unitPrice = product.basePrice + optionTotal;
      return {
        productId: product.id,
        productName: product.name,
        basePrice: product.basePrice,
        unitPrice,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
        selectedModifiers,
      };
    });
    const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);

    let customerVoucherId: string | null = null;
    let discountAmount = 0;
    if (input.customerVoucherId) {
      if (!userId) {
        throw new BadRequestException(
          'Guest staff orders cannot use vouchers.',
        );
      }
      const row = await this.prisma.customerVoucher.findFirst({
        where: { id: input.customerVoucherId, userId },
        include: { voucher: true, redemption: true },
      });
      const now = new Date();
      if (
        !row ||
        row.status !== CustomerVoucherStatus.AVAILABLE ||
        row.redemption ||
        !row.voucher.active ||
        row.voucher.validFrom > now ||
        row.voucher.validUntil <= now ||
        (row.expiresAt && row.expiresAt <= now)
      ) {
        throw new ConflictException('Voucher is not available.');
      }
      if (
        row.voucher.currency !== outlet.currency ||
        (row.voucher.outletId && row.voucher.outletId !== outlet.id)
      ) {
        throw new BadRequestException('Voucher does not apply to this order.');
      }
      if (subtotal < row.voucher.minimumSpend) {
        throw new BadRequestException(
          'Order does not meet voucher minimum spend.',
        );
      }
      discountAmount = this.discountForVoucher(
        subtotal,
        row.voucher.discountType,
        row.voucher.discountValue,
        row.voucher.maximumDiscount,
      );
      customerVoucherId = row.id;
    }

    const totalAmount = Math.max(0, subtotal + deliveryFee - discountAmount);
    const initialStatus =
      totalAmount === 0 ? OrderStatus.CONFIRMED : OrderStatus.AWAITING_PAYMENT;

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (customerVoucherId) {
          const reserved = await tx.customerVoucher.updateMany({
            where: {
              id: customerVoucherId,
              userId: userId!,
              status: CustomerVoucherStatus.AVAILABLE,
            },
            data: { status: CustomerVoucherStatus.RESERVED },
          });
          if (reserved.count !== 1) {
            throw new ConflictException('Voucher was already used.');
          }
        }

        const order = await tx.order.create({
          data: {
            checkoutKey,
            userId,
            outletId: outlet.id,
            status: initialStatus,
            fulfillmentType,
            scheduledFor,
            savedAddressId,
            deliveryAddressSnapshot,
            deliveryDistanceMeters,
            deliveryFee,
            currency: outlet.currency,
            subtotal,
            discountAmount,
            totalAmount,
            items: { create: pricedItems },
            ...(initialStatus === OrderStatus.CONFIRMED
              ? {
                  statusEvents: {
                    create: {
                      fromStatus: null,
                      toStatus: OrderStatus.CONFIRMED,
                      note: 'Order confirmed without external payment.',
                    },
                  },
                }
              : {}),
          },
          include: { items: true, payments: true },
        });

        if (customerVoucherId) {
          const applied = initialStatus === OrderStatus.CONFIRMED;
          await tx.voucherRedemption.create({
            data: {
              customerVoucherId,
              orderId: order.id,
              status: applied
                ? VoucherRedemptionStatus.APPLIED
                : VoucherRedemptionStatus.RESERVED,
              discountAmount,
              ...(applied ? { appliedAt: new Date() } : {}),
            },
          });
          if (applied) {
            await tx.customerVoucher.update({
              where: { id: customerVoucherId },
              data: { status: CustomerVoucherStatus.REDEEMED },
            });
          }
        }
        return order;
      });
    } catch (error: unknown) {
      const duplicate = await this.prisma.order.findUnique({
        where: { checkoutKey },
        include: { items: true, payments: true },
      });
      if (duplicate && duplicate.userId === userId) return duplicate;
      throw error;
    }
  }

  async listForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        outlet: { select: { id: true, name: true } },
        items: { orderBy: { createdAt: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        voucherRedemption: {
          include: { customerVoucher: { include: { voucher: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getById(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        outlet: { select: { id: true, name: true } },
        items: true,
        payments: { orderBy: { createdAt: 'desc' } },
        statusEvents: {
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            note: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        voucherRedemption: {
          include: { customerVoucher: { include: { voucher: true } } },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found.');
    return order;
  }

  async cancel(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        payments: {
          where: { status: PaymentStatus.PENDING },
          take: 1,
        },
        voucherRedemption: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.status !== OrderStatus.AWAITING_PAYMENT) {
      throw new ConflictException('Only unpaid orders can be cancelled.');
    }
    if (order.payments.length > 0) {
      throw new ConflictException('Cancel the pending payment first.');
    }

    return this.prisma.$transaction(async (tx) => {
      const cancelled = await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
      });
      await tx.orderStatusEvent.create({
        data: {
          orderId: order.id,
          fromStatus: OrderStatus.AWAITING_PAYMENT,
          toStatus: OrderStatus.CANCELLED,
          note: 'Cancelled by customer before payment.',
        },
      });
      if (
        order.voucherRedemption?.status === VoucherRedemptionStatus.RESERVED
      ) {
        await tx.voucherRedemption.update({
          where: { id: order.voucherRedemption.id },
          data: {
            status: VoucherRedemptionStatus.RELEASED,
            releasedAt: new Date(),
          },
        });
        await tx.customerVoucher.update({
          where: { id: order.voucherRedemption.customerVoucherId },
          data: { status: CustomerVoucherStatus.AVAILABLE },
        });
      }
      return cancelled;
    });
  }

  private discountForVoucher(
    subtotal: number,
    discountType: VoucherDiscountType,
    discountValue: number,
    maximumDiscount: number | null,
  ) {
    const raw =
      discountType === VoucherDiscountType.FIXED_AMOUNT
        ? discountValue
        : Math.floor((subtotal * discountValue) / 10000);
    return Math.min(
      subtotal,
      maximumDiscount ? Math.min(raw, maximumDiscount) : raw,
    );
  }

  private resolveSchedule(value?: string | null) {
    if (!value) return null;
    const scheduled = new Date(value);
    if (Number.isNaN(scheduled.getTime())) {
      throw new BadRequestException('scheduledFor must be a valid ISO date.');
    }
    const now = Date.now();
    if (scheduled.getTime() < now + scheduleLeadMs) {
      throw new BadRequestException(
        'Scheduled orders require 15 minutes lead time.',
      );
    }
    if (scheduled.getTime() > now + scheduleHorizonMs) {
      throw new BadRequestException(
        'Scheduled orders can be at most 7 days ahead.',
      );
    }
    return scheduled;
  }

  private distanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const earthRadius = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private validateCheckoutKey(checkoutKey: string) {
    if (!checkoutKey || checkoutKey.length > 128) {
      throw new BadRequestException(
        'A valid Idempotency-Key header is required.',
      );
    }
  }

  private validateInput(input: CreateOrderInput) {
    if (!input || typeof input.outletId !== 'string' || !input.outletId) {
      throw new BadRequestException('outletId is required.');
    }
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new BadRequestException('At least one order item is required.');
    }
    for (const item of input.items) this.validateItem(item);
  }

  private validateItem(item: CreateOrderItemInput) {
    if (!item || typeof item.productId !== 'string' || !item.productId) {
      throw new BadRequestException('Each item requires productId.');
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new BadRequestException(
        'Each item quantity must be a positive integer.',
      );
    }
    if (
      item.modifierOptionIds !== undefined &&
      (!Array.isArray(item.modifierOptionIds) ||
        item.modifierOptionIds.some((value) => typeof value !== 'string'))
    ) {
      throw new BadRequestException('modifierOptionIds must be string IDs.');
    }
  }
}
