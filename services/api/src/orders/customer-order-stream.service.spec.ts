import { filter, firstValueFrom, take } from 'rxjs';
import { PrismaService } from '../database/prisma.service';
import { OrderStatus, PaymentStatus } from '../generated/prisma/enums';
import { CustomerOrderStreamService } from './customer-order-stream.service';

type AccountStreamData = {
  signature: string;
  orders: Array<{
    id: string;
    status: string;
    payments: Array<{
      id: string;
      status: string;
      qrString: string | null;
      expiryTime: string | null;
    }>;
  }>;
  generatedAt: string;
};

type FindManyCall = {
  where?: {
    userId?: string;
  };
};

describe('CustomerOrderStreamService', () => {
  it('emits only the authenticated customer snapshot over SSE', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'order-1',
        status: OrderStatus.CONFIRMED,
        updatedAt: new Date('2026-09-04T12:00:00.000Z'),
        payments: [
          {
            id: 'payment-1',
            orderId: 'order-1',
            provider: 'AUTOGOPAY',
            channel: 'GOPAY_QRIS',
            status: PaymentStatus.PAID,
            amount: 28000,
            currency: 'IDR',
            providerQrString: '000201010212',
            providerQrUrl: null,
            providerCheckoutUrl: null,
            providerExpiryTime: '2026-09-04T12:05:00.000Z',
            providerRawStatus: 'PAID',
            paidAt: new Date('2026-09-04T12:00:00.000Z'),
            cancelledAt: null,
            updatedAt: new Date('2026-09-04T12:00:00.000Z'),
          },
        ],
      },
    ]);
    const prisma = {
      order: { findMany },
    } as unknown as PrismaService;
    const service = new CustomerOrderStreamService(prisma);

    const event = await firstValueFrom(
      service.stream('customer-1').pipe(
        filter((entry) => entry.type === 'account'),
        take(1),
      ),
    );
    const data = event.data as AccountStreamData;
    const calls = findMany.mock.calls as unknown as Array<[FindManyCall]>;

    expect(data.orders).toHaveLength(1);
    expect(data.orders[0]).toMatchObject({
      id: 'order-1',
      status: OrderStatus.CONFIRMED,
    });
    expect(data.orders[0].payments[0]).toMatchObject({
      id: 'payment-1',
      status: PaymentStatus.PAID,
      qrString: '000201010212',
      expiryTime: '2026-09-04T12:05:00.000Z',
    });
    expect(data.signature).toBeTruthy();
    expect(data.generatedAt).toBeTruthy();
    expect(calls[0]?.[0].where?.userId).toBe('customer-1');
  });
});
