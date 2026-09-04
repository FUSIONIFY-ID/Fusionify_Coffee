import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.favoriteProduct.findMany({
      where: {
        userId,
        product: { active: true },
      },
      include: {
        product: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async add(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, active: true },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return this.prisma.favoriteProduct.upsert({
      where: {
        userId_productId: { userId, productId },
      },
      update: {},
      create: { userId, productId },
      include: { product: true },
    });
  }

  async remove(userId: string, productId: string) {
    await this.prisma.favoriteProduct.deleteMany({
      where: { userId, productId },
    });

    return { success: true };
  }
}
