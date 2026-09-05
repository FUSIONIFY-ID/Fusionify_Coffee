import { PrismaService } from '../database/prisma.service';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  it('returns the requested localized catalog and falls back safely', async () => {
    const prisma = {
      outlet: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'preview-outlet',
          name: 'Preview Store',
          note: 'Database fixture',
          imageUrl: 'asset://outlets/preview-store.webp',
          translations: {
            MS_MY: {
              name: 'Kedai Pratonton',
              note: 'Data pembangunan',
            },
          },
          currency: 'IDR',
          pickupEnabled: true,
          deliveryEnabled: true,
        }),
      },
      product: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'aren-latte',
            name: 'Aren Latte',
            description: 'Fallback description',
            imageUrl: 'https://cdn.example.com/products/aren-latte.webp',
            translations: {
              MS_MY: {
                description: 'Espresso dan susu segar.',
              },
            },
            category: {
              name: 'Coffee',
              translations: {
                MS_MY: { name: 'Kopi' },
              },
            },
            categoryId: 'coffee',
            basePrice: 28000,
            active: true,
            isBestseller: true,
            modifierGroups: [
              {
                id: 'aren-latte-milk',
                name: 'Milk',
                translations: {
                  MS_MY: { name: 'Susu' },
                },
                required: true,
                allowMultiple: false,
                options: [
                  {
                    id: 'aren-latte-milk-oat-milk',
                    name: 'Oat Milk',
                    translations: {
                      MS_MY: { name: 'Susu Oat' },
                    },
                    priceDelta: 8000,
                    isDefault: false,
                  },
                ],
              },
            ],
          },
        ]),
      },
      campaign: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'morning-pickup',
            title: 'Skip the Morning Line',
            body: 'Order ahead.',
            ctaLabel: 'Order Now',
            translations: {
              MS_MY: {
                title: 'Pagi Tanpa Beratur',
                body: 'Pesan dahulu.',
                ctaLabel: 'Pesan Sekarang',
              },
            },
            imageUrl: 'asset://campaigns/morning-pickup.webp',
            actionPath: '/menu',
          },
        ]),
      },
    } as unknown as PrismaService;

    const service = new CatalogService(prisma);
    const catalog = await service.getPreviewCatalog('MS_MY');

    expect(catalog.language).toBe('MS_MY');
    expect(catalog.outlet.name).toBe('Kedai Pratonton');
    expect(catalog.outlet.currency).toBe('IDR');
    expect(catalog.outlet.imageUrl).toBe('asset://outlets/preview-store.webp');
    expect(catalog.outlet.deliveryEnabled).toBe(true);
    expect(catalog.products[0].name).toBe('Aren Latte');
    expect(catalog.products[0].description).toBe('Espresso dan susu segar.');
    expect(catalog.products[0].categoryId).toBe('coffee');
    expect(catalog.products[0].category).toBe('Kopi');
    expect(catalog.products[0].imageUrl).toBe(
      'https://cdn.example.com/products/aren-latte.webp',
    );
    expect(catalog.products[0].modifierGroups[0].label).toBe('Susu');
    expect(catalog.products[0].modifierGroups[0].options[0].label).toBe(
      'Susu Oat',
    );
    expect(catalog.campaigns[0]).toMatchObject({
      title: 'Pagi Tanpa Beratur',
      body: 'Pesan dahulu.',
      ctaLabel: 'Pesan Sekarang',
      imageUrl: 'asset://campaigns/morning-pickup.webp',
      actionPath: '/menu',
    });
  });

  it.each([
    ['ms-MY,ms;q=0.9,en;q=0.8', 'MS_MY'],
    ['en-US,en;q=0.9', 'EN'],
    ['id-ID,id;q=0.9', 'ID_ID'],
    [undefined, 'ID_ID'],
  ])('normalizes HTTP language value %s', async (requested, expected) => {
    const prisma = {
      outlet: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'preview-outlet',
          name: 'Preview Store',
          note: '',
          imageUrl: null,
          translations: null,
          currency: 'IDR',
          pickupEnabled: true,
          deliveryEnabled: false,
        }),
      },
      product: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      campaign: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as unknown as PrismaService;

    const service = new CatalogService(prisma);
    const catalog = await service.getPreviewCatalog(requested);

    expect(catalog.language).toBe(expected);
  });
});
