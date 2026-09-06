import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  AssetStatus,
  OrderStatus,
  PaymentStatus,
} from '../generated/prisma/enums';

const allowedRangeDays = new Set([7, 30, 90]);
const activeQueueStatuses = [
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
];
const stalePaymentMs = 30 * 60 * 1000;

type DashboardOrder = {
  outletId: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  createdAt: Date;
  payments: Array<{ status: PaymentStatus }>;
};

@Injectable()
export class OwnerDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(
    staffOutletId: string | null,
    requestedOutletId?: string,
    rawRangeDays?: string,
  ) {
    const rangeDays = this.parseRangeDays(rawRangeDays);
    const outletId = this.resolveOutlet(staffOutletId, requestedOutletId);
    const now = new Date();
    const startAt = this.startOfUtcDay(now, rangeDays - 1);
    const previousStartAt = this.startOfUtcDay(now, rangeDays * 2 - 1);
    const staleBefore = new Date(now.getTime() - stalePaymentMs);

    const accessibleOutlets = await this.prisma.outlet.findMany({
      where: staffOutletId ? { id: staffOutletId } : undefined,
      select: {
        id: true,
        name: true,
        currency: true,
        timezone: true,
        active: true,
      },
      orderBy: [{ active: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
    const outlets = outletId
      ? accessibleOutlets.filter((outlet) => outlet.id === outletId)
      : accessibleOutlets;
    if (outletId && outlets.length === 0) {
      throw new NotFoundException('Outlet not found.');
    }

    const outletIds = outlets.map((outlet) => outlet.id);
    const outletFilter = { in: outletIds };
    const orderSelect = {
      outletId: true,
      status: true,
      totalAmount: true,
      currency: true,
      createdAt: true,
      payments: { select: { status: true } },
    } as const;

    const [
      currentOrders,
      previousOrders,
      activeOrders,
      paymentAttention,
      inventoryLevels,
      maintenanceAssets,
    ] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          outletId: outletFilter,
          createdAt: { gte: startAt, lte: now },
        },
        select: orderSelect,
      }),
      this.prisma.order.findMany({
        where: {
          outletId: outletFilter,
          createdAt: { gte: previousStartAt, lt: startAt },
        },
        select: orderSelect,
      }),
      this.prisma.order.findMany({
        where: {
          outletId: outletFilter,
          status: { in: activeQueueStatuses },
        },
        select: { id: true, outletId: true, status: true },
      }),
      this.prisma.payment.findMany({
        where: {
          order: { outletId: outletFilter },
          createdAt: { gte: startAt, lte: now },
          OR: [
            { status: PaymentStatus.FAILED },
            {
              status: PaymentStatus.PENDING,
              updatedAt: { lte: staleBefore },
            },
          ],
        },
        select: {
          id: true,
          status: true,
          amount: true,
          currency: true,
          updatedAt: true,
          order: {
            select: {
              outletId: true,
              outlet: { select: { name: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      this.prisma.outletInventory.findMany({
        where: { outletId: outletFilter, reorderPointBaseUnit: { gt: 0 } },
        select: {
          id: true,
          outletId: true,
          onHandBaseUnit: true,
          reorderPointBaseUnit: true,
          updatedAt: true,
          outlet: { select: { name: true } },
          inventoryItem: {
            select: { name: true, baseUnit: true, active: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.asset.findMany({
        where: {
          outletId: outletFilter,
          nextMaintenanceAt: { lte: now },
          status: { notIn: [AssetStatus.RETIRED, AssetStatus.LOST] },
        },
        select: {
          id: true,
          outletId: true,
          name: true,
          assetTag: true,
          status: true,
          nextMaintenanceAt: true,
          outlet: { select: { name: true } },
        },
        orderBy: { nextMaintenanceAt: 'asc' },
        take: 50,
      }),
    ]);

    const lowStock = inventoryLevels.filter(
      (level) =>
        level.inventoryItem.active &&
        level.onHandBaseUnit <= level.reorderPointBaseUnit,
    );
    const paidCurrent = this.paidOrders(currentOrders);
    const paidPrevious = this.paidOrders(previousOrders);
    const currencies = [
      ...new Set([
        ...outlets.map((outlet) => outlet.currency),
        ...paidCurrent.map((order) => order.currency),
      ]),
    ].sort();

    const currencyTotals = currencies.map((currency) => {
      const current = paidCurrent.filter(
        (order) => order.currency === currency,
      );
      const previous = paidPrevious.filter(
        (order) => order.currency === currency,
      );
      const netSales = this.sum(current.map((order) => order.totalAmount));
      const previousNetSales = this.sum(
        previous.map((order) => order.totalAmount),
      );
      return {
        currency,
        netSales,
        previousNetSales,
        paidOrders: current.length,
        averageOrderValue:
          current.length === 0 ? 0 : Math.round(netSales / current.length),
        netSalesChangeBps: this.changeBps(netSales, previousNetSales),
      };
    });

    const outletPerformance = outlets.map((outlet) => {
      const orders = paidCurrent.filter(
        (order) => order.outletId === outlet.id,
      );
      const netSales = this.sum(orders.map((order) => order.totalAmount));
      return {
        ...outlet,
        netSales,
        paidOrders: orders.length,
        completedOrders: currentOrders.filter(
          (order) =>
            order.outletId === outlet.id &&
            order.status === OrderStatus.COMPLETED,
        ).length,
        averageOrderValue:
          orders.length === 0 ? 0 : Math.round(netSales / orders.length),
        activeQueue: activeOrders.filter(
          (order) => order.outletId === outlet.id,
        ).length,
        paymentAttention: paymentAttention.filter(
          (payment) => payment.order.outletId === outlet.id,
        ).length,
        lowStock: lowStock.filter((level) => level.outletId === outlet.id)
          .length,
        maintenanceDue: maintenanceAssets.filter(
          (asset) => asset.outletId === outlet.id,
        ).length,
      };
    });

    const previousCompletedOrders = previousOrders.filter(
      (order) => order.status === OrderStatus.COMPLETED,
    ).length;
    const completedOrders = currentOrders.filter(
      (order) => order.status === OrderStatus.COMPLETED,
    ).length;

    return {
      generatedAt: now,
      rangeDays,
      startAt,
      endAt: now,
      selectedOutletId: outletId ?? null,
      outlets: accessibleOutlets,
      currencyTotals,
      totals: {
        completedOrders,
        previousCompletedOrders,
        completedOrdersChangeBps: this.changeBps(
          completedOrders,
          previousCompletedOrders,
        ),
        activeQueue: activeOrders.length,
        paymentAttention: paymentAttention.length,
        lowStock: lowStock.length,
        maintenanceDue: maintenanceAssets.length,
      },
      trend: this.buildTrend(paidCurrent, rangeDays, startAt, currencies),
      outletPerformance,
      attention: [
        ...paymentAttention.map((payment) => ({
          type: 'PAYMENT' as const,
          severity: 'CRITICAL' as const,
          outletId: payment.order.outletId,
          outletName: payment.order.outlet.name,
          title:
            payment.status === PaymentStatus.FAILED
              ? 'Payment failed'
              : 'Payment pending too long',
          detail: `${payment.currency} ${payment.amount}`,
          occurredAt: payment.updatedAt,
          referenceId: payment.id,
        })),
        ...lowStock.map((level) => ({
          type: 'LOW_STOCK' as const,
          severity: 'WARNING' as const,
          outletId: level.outletId,
          outletName: level.outlet.name,
          title: `${level.inventoryItem.name} stock is low`,
          detail: `${level.onHandBaseUnit} ${level.inventoryItem.baseUnit} on hand · reorder at ${level.reorderPointBaseUnit}`,
          occurredAt: level.updatedAt,
          referenceId: level.id,
        })),
        ...maintenanceAssets.map((asset) => ({
          type: 'MAINTENANCE_DUE' as const,
          severity: 'WARNING' as const,
          outletId: asset.outletId,
          outletName: asset.outlet.name,
          title: `${asset.name} maintenance is due`,
          detail: asset.assetTag,
          occurredAt: asset.nextMaintenanceAt!,
          referenceId: asset.id,
        })),
      ]
        .sort((left, right) => {
          if (left.severity !== right.severity) {
            return left.severity === 'CRITICAL' ? -1 : 1;
          }
          return left.occurredAt.getTime() - right.occurredAt.getTime();
        })
        .slice(0, 12),
    };
  }

  private parseRangeDays(value?: string) {
    const parsed = value ? Number.parseInt(value, 10) : 7;
    if (!allowedRangeDays.has(parsed)) {
      throw new BadRequestException('rangeDays must be 7, 30, or 90.');
    }
    return parsed;
  }

  private resolveOutlet(staffOutletId: string | null, requested?: string) {
    const normalized = requested?.trim() || undefined;
    if (staffOutletId && normalized && staffOutletId !== normalized) {
      throw new NotFoundException('Outlet not found.');
    }
    return staffOutletId ?? normalized;
  }

  private paidOrders(orders: DashboardOrder[]) {
    return orders.filter((order) =>
      order.payments.some((payment) => payment.status === PaymentStatus.PAID),
    );
  }

  private buildTrend(
    orders: DashboardOrder[],
    rangeDays: number,
    startAt: Date,
    currencies: string[],
  ) {
    return Array.from({ length: rangeDays }, (_, index) => {
      const date = new Date(startAt);
      date.setUTCDate(startAt.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      const dailyOrders = orders.filter(
        (order) => order.createdAt.toISOString().slice(0, 10) === key,
      );
      return {
        date: key,
        currencies: currencies.map((currency) => {
          const matching = dailyOrders.filter(
            (order) => order.currency === currency,
          );
          return {
            currency,
            netSales: this.sum(matching.map((order) => order.totalAmount)),
            paidOrders: matching.length,
          };
        }),
      };
    });
  }

  private startOfUtcDay(now: Date, daysAgo: number) {
    return new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - daysAgo,
      ),
    );
  }

  private sum(values: number[]) {
    return values.reduce((total, value) => total + value, 0);
  }

  private changeBps(current: number, previous: number) {
    if (previous === 0) return current === 0 ? 0 : null;
    return Math.round(((current - previous) * 10000) / previous);
  }
}
