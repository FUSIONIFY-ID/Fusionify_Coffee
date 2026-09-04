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

const refreshIntervalMs = 2_000;
const heartbeatIntervalMs = 15_000;

type CustomerSnapshot = {
  signature: string;
  orders: unknown[];
  generatedAt: string;
};

@Injectable()
export class CustomerOrderStreamService {
  constructor(private readonly prisma: PrismaService) {}

  stream(userId: string): Observable<MessageEvent> {
    const updates = timer(0, refreshIntervalMs).pipe(
      switchMap(() =>
        from(this.loadSnapshot(userId)).pipe(
          catchError(() => of<CustomerSnapshot | null>(null)),
        ),
      ),
      filter((value): value is CustomerSnapshot => value !== null),
      distinctUntilChanged((previous, next) => {
        return previous.signature === next.signature;
      }),
      map((snapshot): MessageEvent => ({
        type: 'account',
        retry: 3_000,
        data: snapshot,
      })),
    );

    const heartbeat = interval(heartbeatIntervalMs).pipe(
      map((): MessageEvent => ({
        type: 'heartbeat',
        retry: 3_000,
        data: { generatedAt: new Date().toISOString() },
      })),
    );

    return merge(updates, heartbeat);
  }

  private async loadSnapshot(userId: string): Promise<CustomerSnapshot> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            orderId: true,
            provider: true,
            channel: true,
            status: true,
            amount: true,
            currency: true,
            providerQrString: true,
            providerQrUrl: true,
            providerCheckoutUrl: true,
            providerExpiryTime: true,
            providerRawStatus: true,
            paidAt: true,
            cancelledAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    const normalizedOrders = orders.map((order) => ({
      id: order.id,
      status: order.status,
      updatedAt: order.updatedAt,
      payments: order.payments.map((payment) => ({
        id: payment.id,
        orderId: payment.orderId,
        provider: payment.provider,
        channel: payment.channel,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        qrString: payment.providerQrString,
        qrUrl: payment.providerQrUrl,
        checkoutUrl: payment.providerCheckoutUrl,
        expiryTime: payment.providerExpiryTime,
        providerRawStatus: payment.providerRawStatus,
        paidAt: payment.paidAt,
        cancelledAt: payment.cancelledAt,
        updatedAt: payment.updatedAt,
      })),
    }));

    return {
      signature: JSON.stringify(normalizedOrders),
      orders: normalizedOrders,
      generatedAt: new Date().toISOString(),
    };
  }
}
