import { PrismaService } from '../database/prisma.service';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  it('scopes favorite listing to the authenticated customer', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      favoriteProduct: { findMany },
    } as unknown as PrismaService;
    const service = new FavoritesService(prisma);

    await service.list('customer-a');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'customer-a' }),
      }),
    );
  });

  it('uses the customer and product pair as the idempotent favorite key', async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: 'aren-latte' });
    const upsert = jest.fn().mockResolvedValue({
      id: 'favorite-1',
      userId: 'customer-a',
      productId: 'aren-latte',
      createdAt: new Date(),
      product: { id: 'aren-latte' },
    });
    const prisma = {
      product: { findFirst },
      favoriteProduct: { upsert },
    } as unknown as PrismaService;
    const service = new FavoritesService(prisma);

    await service.add('customer-a', 'aren-latte');

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_productId: {
            userId: 'customer-a',
            productId: 'aren-latte',
          },
        },
      }),
    );
  });
});
