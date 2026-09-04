import { ConflictException, Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { StockMovementType } from '../generated/prisma/enums';

@Injectable()
export class InventoryConsumptionService {
  async consumeOrder(
    tx: Prisma.TransactionClient,
    orderId: string,
    staffUserId: string,
  ) {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      select: {
        id: true,
        outletId: true,
        items: {
          select: {
            quantity: true,
            product: {
              select: {
                recipeItems: {
                  select: {
                    inventoryItemId: true,
                    quantityBaseUnit: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const required = new Map<string, number>();
    for (const orderItem of order.items) {
      for (const recipe of orderItem.product.recipeItems) {
        required.set(
          recipe.inventoryItemId,
          (required.get(recipe.inventoryItemId) ?? 0) +
            recipe.quantityBaseUnit * orderItem.quantity,
        );
      }
    }

    for (const [inventoryItemId, quantity] of required) {
      const level = await tx.outletInventory.findUnique({
        where: {
          outletId_inventoryItemId: {
            outletId: order.outletId,
            inventoryItemId,
          },
        },
      });
      if (!level || level.onHandBaseUnit < quantity) {
        throw new ConflictException(
          `Insufficient inventory for item ${inventoryItemId}.`,
        );
      }
      const nextBalance = level.onHandBaseUnit - quantity;
      await tx.outletInventory.update({
        where: { id: level.id },
        data: { onHandBaseUnit: nextBalance },
      });
      await tx.stockMovement.create({
        data: {
          outletId: order.outletId,
          inventoryItemId,
          type: StockMovementType.SALE,
          quantityBaseUnit: -quantity,
          balanceAfterBaseUnit: nextBalance,
          reason: `Recipe consumption for order ${order.id}`,
          orderId: order.id,
          staffUserId,
        },
      });
    }

    return { consumedItemCount: required.size };
  }
}
