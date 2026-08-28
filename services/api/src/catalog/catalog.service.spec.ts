import { PrismaService } from '../database/prisma.service';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  it('maps database catalog into the customer preview contract', async () => {
    const prisma = {
      outlet: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'preview-outlet',
          name: 'Preview Store',
          note: 'Database fixture',
          pickupEnabled: true,
        }),
      },
      product: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'aren-latte',
            name: 'Aren Latte',
            description: 'Test coffee',
            category: { name: 'Coffee' },
            categoryId: 'coffee',
            basePrice: 28000,
            active: true,
            isBestseller: true,
            modifierGroups: [
              {
                id: 'aren-latte-milk',
                name: 'Milk',
                required: true,
                allowMultiple: false,
                options: [
                  {
                    id: 'aren-latte-milk-oat-milk',
                    name: 'Oat Milk',
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
    const catalog = await service.getPreviewCatalog();

    expect(catalog.preview).toBe(true);
    expect(catalog.outlet.id).toBe('preview-outlet');
    expect(catalog.products[0].category).toBe('Coffee');
    expect(catalog.products[0].modifierGroups[0].options[0]).toEqual({
      id: 'aren-latte-milk-oat-milk',
      label: 'Oat Milk',
      priceDelta: 8000,
      isDefault: false,
    });
  });
});
