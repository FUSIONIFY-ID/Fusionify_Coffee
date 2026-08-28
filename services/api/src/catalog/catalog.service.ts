import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreviewCatalog() {
    const [outlet, products] = await Promise.all([
      this.prisma.outlet.findFirst({
        where: { pickupEnabled: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.product.findMany({
        where: { active: true },
        include: {
          category: true,
          modifierGroups: {
            orderBy: { sortOrder: 'asc' },
            include: {
              options: {
                where: { active: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
        orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
      }),
    ]);

    if (!outlet) {
      throw new NotFoundException('No pickup outlet is available.');
    }

    return {
      preview: true,
      outlet: {
        id: outlet.id,
        name: outlet.name,
        note: outlet.note,
        pickupEnabled: outlet.pickupEnabled,
      },
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category.name,
        basePrice: product.basePrice,
        isBestseller: product.isBestseller,
        modifierGroups: product.modifierGroups.map((group) => ({
          id: group.id,
          label: group.name,
          required: group.required,
          allowMultiple: group.allowMultiple,
          options: group.options.map((option) => ({
            id: option.id,
            label: option.name,
            priceDelta: option.priceDelta,
            isDefault: option.isDefault,
          })),
        })),
      })),
    };
  }
}
