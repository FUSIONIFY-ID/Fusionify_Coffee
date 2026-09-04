import { firstValueFrom, filter, take } from 'rxjs';
import { PrismaService } from '../database/prisma.service';
import { OrderStatus } from '../generated/prisma/enums';
import { StaffOrderStreamService } from './staff-order-stream.service';

type OrdersStreamData = {
  orders: Array<{ id: string; status: string }>;
  generatedAt: string;
};

describe('StaffOrderStreamService', () => {
  it('emits an outlet-scoped queue snapshot over SSE', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'order-1',
        status: OrderStatus.CONFIRMED,
        updatedAt: new Date('2026-09-04T12:00:00.000Z'),
        outlet: { id: 'outlet-1', name: 'Fusionify Coffee' },
        items: [],
        payments: [],
      },
    ]);
    const prisma = {
      order: { findMany },
    } as unknown as PrismaService;
    const service = new StaffOrderStreamService(prisma);

    const event = await firstValueFrom(
      service
        .stream('outlet-1')
        .pipe(filter((entry) => entry.type === 'orders'), take(1)),
    );
    const data = event.data as OrdersStreamData;

    expect(data.orders).toHaveLength(1);
    expect(data.orders[0]).toMatchObject({
      id: 'order-1',
      status: OrderStatus.CONFIRMED,
    });
    expect(data.generatedAt).toBeTruthy();
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ outletId: 'outlet-1' }),
      }),
    );
  });
});
