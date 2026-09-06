import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

type CatalogLanguage = 'ID_ID' | 'MS_MY' | 'EN';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listOutlets(requestedLanguage?: string) {
    const language = this.normalizeLanguage(requestedLanguage);
    const outlets = await this.prisma.outlet.findMany({
      where: {
        active: true,
        OR: [{ pickupEnabled: true }, { deliveryEnabled: true }],
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return outlets.map((outlet) => this.outletView(outlet, language));
  }

  async getCatalog(
    requestedLanguage?: string,
    requestedOutletId?: string,
    forcePreview = false,
  ) {
    const language = this.normalizeLanguage(requestedLanguage);
    const outlet = await this.prisma.outlet.findFirst({
      where: requestedOutletId
        ? { id: requestedOutletId, active: true }
        : {
            active: true,
            OR: [{ pickupEnabled: true }, { deliveryEnabled: true }],
          },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    if (!outlet) {
      throw new NotFoundException('No active outlet is available.');
    }

    const [products, campaigns] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          active: true,
          outletAvailability: {
            some: { outletId: outlet.id, available: true },
          },
        },
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
      this.prisma.campaign.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);

    return {
      preview:
        forcePreview ||
        process.env.NODE_ENV !== 'production' ||
        process.env.CATALOG_PREVIEW_MODE === 'true',
      language,
      outlet: this.outletView(outlet, language),
      products: products.map((product) => ({
        id: product.id,
        name: this.text(product.translations, language, 'name', product.name),
        description: this.text(
          product.translations,
          language,
          'description',
          product.description,
        ),
        imageUrl: product.imageUrl,
        categoryId: product.categoryId,
        category: this.text(
          product.category.translations,
          language,
          'name',
          product.category.name,
        ),
        basePrice: product.basePrice,
        isBestseller: product.isBestseller,
        modifierGroups: product.modifierGroups.map((group) => ({
          id: group.id,
          label: this.text(group.translations, language, 'name', group.name),
          required: group.required,
          allowMultiple: group.allowMultiple,
          options: group.options.map((option) => ({
            id: option.id,
            label: this.text(
              option.translations,
              language,
              'name',
              option.name,
            ),
            priceDelta: option.priceDelta,
            isDefault: option.isDefault,
          })),
        })),
      })),
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        title: this.text(
          campaign.translations,
          language,
          'title',
          campaign.title,
        ),
        body: this.text(campaign.translations, language, 'body', campaign.body),
        ctaLabel: this.text(
          campaign.translations,
          language,
          'ctaLabel',
          campaign.ctaLabel,
        ),
        imageUrl: campaign.imageUrl,
        actionPath: campaign.actionPath,
      })),
    };
  }

  private outletView(
    outlet: {
      id: string;
      name: string;
      note: string;
      imageUrl: string | null;
      translations: unknown;
      currency: string;
      pickupEnabled: boolean;
      deliveryEnabled: boolean;
    },
    language: CatalogLanguage,
  ) {
    return {
      id: outlet.id,
      name: this.text(outlet.translations, language, 'name', outlet.name),
      note: this.text(outlet.translations, language, 'note', outlet.note),
      imageUrl: outlet.imageUrl,
      currency: outlet.currency,
      pickupEnabled: outlet.pickupEnabled,
      deliveryEnabled: outlet.deliveryEnabled,
    };
  }

  private normalizeLanguage(value?: string): CatalogLanguage {
    return switchLanguage(value);
  }

  private text(
    translations: unknown,
    language: CatalogLanguage,
    field: string,
    fallback: string,
  ) {
    if (
      translations === null ||
      typeof translations !== 'object' ||
      Array.isArray(translations)
    ) {
      return fallback;
    }

    const localized = (translations as Record<string, unknown>)[language];
    if (
      localized === null ||
      typeof localized !== 'object' ||
      Array.isArray(localized)
    ) {
      return fallback;
    }

    const value = (localized as Record<string, unknown>)[field];
    return typeof value === 'string' && value.trim().length > 0
      ? value
      : fallback;
  }
}

function switchLanguage(value?: string): CatalogLanguage {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return 'ID_ID';
  }

  if (
    normalized === 'ms_my' ||
    normalized.startsWith('ms-my') ||
    normalized.startsWith('ms')
  ) {
    return 'MS_MY';
  }

  if (
    normalized === 'en' ||
    normalized.startsWith('en-') ||
    normalized.startsWith('en,')
  ) {
    return 'EN';
  }

  return 'ID_ID';
}
