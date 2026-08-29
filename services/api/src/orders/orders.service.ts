import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateOrderInput,
  CreateOrderItemInput,
  SelectedModifierSnapshot,
} from './orders.types';

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

    if (!outlet || !outlet.pickupEnabled) {
      throw new BadRequestException('Pickup outlet is not available.');
    }

    const productIds = [...new Set(input.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        active: true,
      },
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

      const unknownOptions = selectedOptionIds.filter(
        (optionId) => !knownOptionIds.has(optionId),
      );
      if (unknownOptions.length > 0) {
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
      const lineTotal = unitPrice * item.quantity;

      return {
        productId: product.id,
        productName: product.name,
        basePrice: product.basePrice,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
        selectedModifiers,
      };
    });

    const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);

    try {
      return await this.prisma.order.create({
        data: {
          checkoutKey,
          userId,
          outletId: outlet.id,
          subtotal,
          totalAmount: subtotal,
          items: {
            create: pricedItems,
          },
        },
        include: { items: true, payments: true },
      });
    } catch (error: unknown) {
      const duplicate = await this.prisma.order.findUnique({
        where: { checkoutKey },
        include: { items: true, payments: true },
      });

      if (duplicate) {
        return duplicate;
      }

      throw error;
    }
  }

  async listForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        outlet: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
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
        outlet: {
          select: {
            id: true,
            name: true,
          },
        },
        items: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
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
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return order;
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

    for (const item of input.items) {
      this.validateItem(item);
    }
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
