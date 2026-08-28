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
          translations: {
            MS_MY: {
              name: 'Kedai Pratonton',
              note: 'Data pembangunan',
            },
          },
          pickupEnabled: true,
        }),
      },
      product: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'aren-latte',
            name: 'Aren Latte',
            description: 'Fallback description',
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
    } as unknown as PrismaService;

    const service = new CatalogService(prisma);
    const catalog = await service.getPreviewCatalog('MS_MY');

    expect(catalog.language).toBe('MS_MY');
    expect(catalog.outlet.name).toBe('Kedai Pratonton');
    expect(catalog.products[0].name).toBe('Aren Latte');
    expect(catalog.products[0].description).toBe('Espresso dan susu segar.');
    expect(catalog.products[0].categoryId).toBe('coffee');
    expect(catalog.products[0].category).toBe('Kopi');
    expect(catalog.products[0].modifierGroups[0].label).toBe('Susu');
    expect(catalog.products[0].modifierGroups[0].options[0].label).toBe(
      'Susu Oat',
    );
  });
});
