import { Injectable, type MessageEvent } from '@nestjs/common';
import {
  catchError,
  distinctUntilChanged,
  filter,
  from,
  interval,
  map,
  merge,
  of,
  switchMap,
  timer,
  type Observable,
} from 'rxjs';
import { PrismaService } from '../database/prisma.service';
import { OrderStatus } from '../generated/prisma/enums';

const queueStatuses = [
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.PICKED_UP,
];

const refreshIntervalMs = 2_000;
const heartbeatIntervalMs = 15_000;

type QueueSnapshot = {
  signature: string;
  orders: unknown[];
  generatedAt: string;
};

@Injectable()
export class StaffOrderStreamService {
  constructor(private readonly prisma: PrismaService) {}

  stream(outletId: string | null): Observable<MessageEvent> {
    const updates = timer(0, refreshIntervalMs).pipe(
      switchMap(() =>
        from(this.loadQueue(outletId)).pipe(
          catchError(() => of<QueueSnapshot | null>(null)),
        ),
      ),
      filter((value): value is QueueSnapshot => value !== null),
      distinctUntilChanged((previous, next) => {
        return previous.signature === next.signature;
      }),
      map((snapshot): MessageEvent => ({
        type: 'orders',
        retry: 3_000,
        data: {
          orders: snapshot.orders,
          generatedAt: snapshot.generatedAt,
        },
      })),
    );

    const heartbeat = interval(heartbeatIntervalMs).pipe(
      map(
        (): MessageEvent => ({
          type: 'heartbeat',
          retry: 3_000,
          data: { generatedAt: new Date().toISOString() },
        }),
      ),
    );

    return merge(updates, heartbeat);
  }

  private async loadQueue(outletId: string | null): Promise<QueueSnapshot> {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: queueStatuses },
        ...(outletId ? { outletId } : {}),
      },
      include: {
        outlet: { select: { id: true, name: true } },
        items: { orderBy: { createdAt: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'asc' },
      take: 250,
    });

    const signature = JSON.stringify(
      orders.map((order) => ({
        id: order.id,
        status: order.status,
        updatedAt: order.updatedAt.toISOString(),
      })),
    );

    return {
      signature,
      orders,
      generatedAt: new Date().toISOString(),
    };
  }
}
