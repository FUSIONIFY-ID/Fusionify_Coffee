import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StaffAuthService } from '../staff/staff-auth.service';
import type {
  SetOutletProductAvailabilityInput,
  UpsertCampaignInput,
  UpsertCategoryInput,
  UpsertModifierGroupInput,
  UpsertOutletInput,
  UpsertProductInput,
} from './catalog-admin.types';

@Injectable()
export class CatalogAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly staffAuthService: StaffAuthService,
  ) {}

  async overview() {
    const [outlets, categories, products, campaigns] = await Promise.all([
      this.prisma.outlet.findMany({
        orderBy: [{ active: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.category.findMany({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.product.findMany({
        include: {
          category: { select: { id: true, name: true } },
          modifierGroups: {
            include: {
              options: {
                orderBy: [
                  { active: 'desc' },
                  { sortOrder: 'asc' },
                  { name: 'asc' },
                ],
              },
            },
            orderBy: [
              { active: 'desc' },
              { sortOrder: 'asc' },
              { name: 'asc' },
            ],
          },
          outletAvailability: {
            select: { outletId: true, available: true },
            orderBy: { outletId: 'asc' },
          },
        },
        orderBy: [{ active: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.campaign.findMany({
        orderBy: [{ active: 'desc' }, { sortOrder: 'asc' }, { title: 'asc' }],
      }),
    ]);

    return { outlets, categories, products, campaigns };
  }

  async upsertOutlet(
    staffUserId: string,
    outletIdValue: string,
    input: UpsertOutletInput,
  ) {
    this.assertInput(input);
    const outletId = this.slug(outletIdValue, 'outletId');
    const name = this.requiredText(input.name, 'name', 100);
    const currency = this.currency(input.currency);
    const timezone = this.requiredText(
      input.timezone ?? 'Asia/Jakarta',
      'timezone',
      64,
    );
    const sortOrder = this.nonNegativeInteger(
      input.sortOrder ?? 0,
      'sortOrder',
    );
    const pickupEnabled = this.boolean(
      input.pickupEnabled,
      true,
      'pickupEnabled',
    );
    const deliveryEnabled = this.boolean(
      input.deliveryEnabled,
      false,
      'deliveryEnabled',
    );
    const latitude = this.coordinate(input.latitude, 'latitude', -90, 90);
    const longitude = this.coordinate(input.longitude, 'longitude', -180, 180);
    const deliveryRadiusMeters = this.nullableNonNegativeInteger(
      input.deliveryRadiusMeters,
      'deliveryRadiusMeters',
    );
    const deliveryBaseFee = this.nonNegativeInteger(
      input.deliveryBaseFee ?? 0,
      'deliveryBaseFee',
    );
    const deliveryPerKmFee = this.nonNegativeInteger(
      input.deliveryPerKmFee ?? 0,
      'deliveryPerKmFee',
    );

    if (
      deliveryEnabled &&
      (latitude == null || longitude == null || !deliveryRadiusMeters)
    ) {
      throw new BadRequestException(
        'Delivery requires coordinates and a positive delivery radius.',
      );
    }

    const data = {
      name,
      note: this.optionalText(input.note, 'note', 240),
      imageUrl: this.mediaUrl(input.imageUrl, true),
      currency,
      timezone,
      active: this.boolean(input.active, true, 'active'),
      sortOrder,
      pickupEnabled,
      deliveryEnabled,
      latitude,
      longitude,
      deliveryRadiusMeters,
      deliveryBaseFee,
      deliveryPerKmFee,
    };

    const existing = await this.prisma.outlet.findUnique({
      where: { id: outletId },
      select: { id: true },
    });
    const outlet = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.outlet.upsert({
        where: { id: outletId },
        update: data,
        create: { id: outletId, ...data },
      });
      if (!existing) {
        const products = await tx.product.findMany({ select: { id: true } });
        if (products.length > 0) {
          await tx.outletProductAvailability.createMany({
            data: products.map((product) => ({
              outletId,
              productId: product.id,
              available: false,
            })),
            skipDuplicates: true,
          });
        }
      }
      return saved;
    });

    await this.staffAuthService.audit(staffUserId, 'CATALOG_OUTLET_UPDATED', {
      targetType: 'Outlet',
      targetId: outlet.id,
      metadata: { active: outlet.active },
    });
    return outlet;
  }

  async upsertCategory(
    staffUserId: string,
    categoryIdValue: string,
    input: UpsertCategoryInput,
  ) {
    this.assertInput(input);
    const categoryId = this.slug(categoryIdValue, 'categoryId');
    const category = await this.prisma.category.upsert({
      where: { id: categoryId },
      update: {
        name: this.requiredText(input.name, 'name', 80),
        sortOrder: this.nonNegativeInteger(input.sortOrder ?? 0, 'sortOrder'),
      },
      create: {
        id: categoryId,
        name: this.requiredText(input.name, 'name', 80),
        sortOrder: this.nonNegativeInteger(input.sortOrder ?? 0, 'sortOrder'),
      },
    });
    await this.staffAuthService.audit(staffUserId, 'CATALOG_CATEGORY_UPDATED', {
      targetType: 'Category',
      targetId: category.id,
    });
    return category;
  }

  async upsertProduct(
    staffUserId: string,
    productIdValue: string,
    input: UpsertProductInput,
  ) {
    this.assertInput(input);
    const productId = this.slug(productIdValue, 'productId');
    const categoryId = this.slug(input.categoryId, 'categoryId');
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) throw new NotFoundException('Category not found.');

    const data = {
      name: this.requiredText(input.name, 'name', 100),
      description: this.requiredText(input.description, 'description', 500),
      imageUrl: this.mediaUrl(input.imageUrl, true),
      basePrice: this.nonNegativeInteger(input.basePrice, 'basePrice'),
      categoryId,
      active: this.boolean(input.active, true, 'active'),
      isBestseller: this.boolean(input.isBestseller, false, 'isBestseller'),
    };
    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    const product = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.product.upsert({
        where: { id: productId },
        update: data,
        create: { id: productId, ...data },
      });
      if (!existing) {
        const outlets = await tx.outlet.findMany({ select: { id: true } });
        if (outlets.length > 0) {
          await tx.outletProductAvailability.createMany({
            data: outlets.map((outlet) => ({
              outletId: outlet.id,
              productId,
              available: false,
            })),
            skipDuplicates: true,
          });
        }
      }
      return saved;
    });

    await this.staffAuthService.audit(staffUserId, 'CATALOG_PRODUCT_UPDATED', {
      targetType: 'Product',
      targetId: product.id,
      metadata: { active: product.active },
    });
    return product;
  }

  async upsertCampaign(
    staffUserId: string,
    campaignIdValue: string,
    input: UpsertCampaignInput,
  ) {
    this.assertInput(input);
    const campaignId = this.slug(campaignIdValue, 'campaignId');
    if (input.actionPath !== '/menu' && input.actionPath !== '/rewards') {
      throw new BadRequestException('Campaign actionPath is not supported.');
    }
    const data = {
      title: this.requiredText(input.title, 'title', 100),
      body: this.requiredText(input.body, 'body', 300),
      ctaLabel: this.requiredText(input.ctaLabel, 'ctaLabel', 60),
      imageUrl: this.mediaUrl(input.imageUrl, false)!,
      actionPath: input.actionPath,
      active: this.boolean(input.active, true, 'active'),
      sortOrder: this.nonNegativeInteger(input.sortOrder ?? 0, 'sortOrder'),
    };
    const campaign = await this.prisma.campaign.upsert({
      where: { id: campaignId },
      update: data,
      create: { id: campaignId, ...data },
    });
    await this.staffAuthService.audit(staffUserId, 'CATALOG_CAMPAIGN_UPDATED', {
      targetType: 'Campaign',
      targetId: campaign.id,
      metadata: { active: campaign.active },
    });
    return campaign;
  }

  async setAvailability(
    staffUserId: string,
    outletIdValue: string,
    productIdValue: string,
    input: SetOutletProductAvailabilityInput,
  ) {
    this.assertInput(input);
    const outletId = this.slug(outletIdValue, 'outletId');
    const productId = this.slug(productIdValue, 'productId');
    if (typeof input.available !== 'boolean') {
      throw new BadRequestException('available must be a boolean.');
    }
    const [outlet, product] = await Promise.all([
      this.prisma.outlet.findUnique({ where: { id: outletId } }),
      this.prisma.product.findUnique({ where: { id: productId } }),
    ]);
    if (!outlet) throw new NotFoundException('Outlet not found.');
    if (!product) throw new NotFoundException('Product not found.');

    const availability = await this.prisma.outletProductAvailability.upsert({
      where: { outletId_productId: { outletId, productId } },
      update: { available: input.available },
      create: { outletId, productId, available: input.available },
    });
    await this.staffAuthService.audit(
      staffUserId,
      'CATALOG_PRODUCT_AVAILABILITY_UPDATED',
      {
        targetType: 'Product',
        targetId: productId,
        metadata: { outletId, available: availability.available },
      },
    );
    return availability;
  }

  async upsertModifierGroup(
    staffUserId: string,
    productIdValue: string,
    groupIdValue: string,
    input: UpsertModifierGroupInput,
  ) {
    this.assertInput(input);
    const productId = this.slug(productIdValue, 'productId');
    const groupId = this.slug(groupIdValue, 'modifierGroupId');
    const name = this.requiredText(input.name, 'name', 80);
    const active = this.boolean(input.active, true, 'active');
    const required = this.boolean(input.required, false, 'required');
    const allowMultiple = this.boolean(
      input.allowMultiple,
      false,
      'allowMultiple',
    );
    const sortOrder = this.nonNegativeInteger(
      input.sortOrder ?? 0,
      'sortOrder',
    );

    if (!Array.isArray(input.options) || input.options.length > 30) {
      throw new BadRequestException('options must contain at most 30 items.');
    }
    const options = input.options.map((option, index) => {
      this.assertInput(option);
      const optionActive = this.boolean(option.active, true, 'option.active');
      const isDefault = this.boolean(
        option.isDefault,
        false,
        'option.isDefault',
      );
      if (!optionActive && isDefault) {
        throw new BadRequestException(
          'An inactive modifier option cannot be the default.',
        );
      }
      return {
        id: this.slug(option.id, `options[${index}].id`),
        name: this.requiredText(option.name, `options[${index}].name`, 80),
        priceDelta: this.nonNegativeInteger(
          option.priceDelta,
          `options[${index}].priceDelta`,
        ),
        isDefault,
        active: optionActive,
        sortOrder: this.nonNegativeInteger(
          option.sortOrder ?? index,
          `options[${index}].sortOrder`,
        ),
      };
    });

    if (new Set(options.map((option) => option.id)).size !== options.length) {
      throw new BadRequestException('Modifier option IDs must be unique.');
    }
    const activeOptions = options.filter((option) => option.active);
    if (active && activeOptions.length === 0) {
      throw new BadRequestException(
        'An active modifier group requires an active option.',
      );
    }
    if (
      !allowMultiple &&
      activeOptions.filter((option) => option.isDefault).length > 1
    ) {
      throw new BadRequestException(
        'A single-select modifier group can only have one default option.',
      );
    }

    const [product, existingGroup, existingOptions] = await Promise.all([
      this.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      }),
      this.prisma.modifierGroup.findUnique({
        where: { id: groupId },
        select: { productId: true },
      }),
      this.prisma.modifierOption.findMany({
        where: { id: { in: options.map((option) => option.id) } },
        select: { id: true, modifierGroupId: true },
      }),
    ]);
    if (!product) throw new NotFoundException('Product not found.');
    if (existingGroup && existingGroup.productId !== productId) {
      throw new BadRequestException(
        'Modifier group already belongs to another product.',
      );
    }
    if (existingOptions.some((option) => option.modifierGroupId !== groupId)) {
      throw new BadRequestException(
        'Modifier option already belongs to another group.',
      );
    }

    const group = await this.prisma.$transaction(async (tx) => {
      await tx.modifierGroup.upsert({
        where: { id: groupId },
        update: { name, active, required, allowMultiple, sortOrder },
        create: {
          id: groupId,
          productId,
          name,
          active,
          required,
          allowMultiple,
          sortOrder,
        },
      });
      await tx.modifierOption.updateMany({
        where: {
          modifierGroupId: groupId,
          id: { notIn: options.map((option) => option.id) },
        },
        data: { active: false, isDefault: false },
      });
      for (const option of options) {
        await tx.modifierOption.upsert({
          where: { id: option.id },
          update: {
            name: option.name,
            priceDelta: option.priceDelta,
            isDefault: option.isDefault,
            active: option.active,
            sortOrder: option.sortOrder,
          },
          create: {
            ...option,
            modifierGroupId: groupId,
          },
        });
      }
      return tx.modifierGroup.findUniqueOrThrow({
        where: { id: groupId },
        include: {
          options: {
            orderBy: [
              { active: 'desc' },
              { sortOrder: 'asc' },
              { name: 'asc' },
            ],
          },
        },
      });
    });

    await this.staffAuthService.audit(
      staffUserId,
      'CATALOG_MODIFIER_GROUP_UPDATED',
      {
        targetType: 'ModifierGroup',
        targetId: group.id,
        metadata: {
          productId,
          active: group.active,
          optionCount: group.options.length,
        },
      },
    );
    return group;
  }

  private assertInput(value: unknown): asserts value is object {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('A JSON object body is required.');
    }
  }

  private slug(value: unknown, field: string) {
    const normalized =
      typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(normalized)) {
      throw new BadRequestException(`${field} must be a stable URL-safe ID.`);
    }
    return normalized;
  }

  private requiredText(value: unknown, field: string, maxLength: number) {
    const normalized = typeof value === 'string' ? value.trim() : '';
    if (!normalized || normalized.length > maxLength) {
      throw new BadRequestException(`${field} is required.`);
    }
    return normalized;
  }

  private optionalText(value: unknown, field: string, maxLength: number) {
    if (value == null) return '';
    if (typeof value !== 'string' || value.trim().length > maxLength) {
      throw new BadRequestException(`${field} is invalid.`);
    }
    return value.trim();
  }

  private currency(value: unknown) {
    const normalized =
      typeof value === 'string' ? value.trim().toUpperCase() : '';
    if (!/^[A-Z]{3}$/.test(normalized)) {
      throw new BadRequestException('currency must be a 3-letter code.');
    }
    return normalized;
  }

  private nonNegativeInteger(value: unknown, field: string) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
      throw new BadRequestException(`${field} must be a non-negative integer.`);
    }
    return value;
  }

  private nullableNonNegativeInteger(value: unknown, field: string) {
    if (value == null) return null;
    return this.nonNegativeInteger(value, field);
  }

  private coordinate(
    value: unknown,
    field: string,
    minimum: number,
    maximum: number,
  ) {
    if (value == null) return null;
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < minimum ||
      value > maximum
    ) {
      throw new BadRequestException(`${field} is invalid.`);
    }
    return value;
  }

  private boolean(value: unknown, fallback: boolean, field: string) {
    if (value == null) return fallback;
    if (typeof value !== 'boolean') {
      throw new BadRequestException(`${field} must be a boolean.`);
    }
    return value;
  }

  private mediaUrl(value: unknown, optional: boolean) {
    const normalized = typeof value === 'string' ? value.trim() : '';
    if (!normalized) {
      if (optional) return null;
      throw new BadRequestException('imageUrl is required.');
    }
    if (
      process.env.NODE_ENV !== 'production' &&
      /^asset:\/\/[a-z0-9/_-]+\.(png|webp|gif|svg)$/i.test(normalized)
    ) {
      return normalized;
    }
    let parsed: URL;
    try {
      parsed = new URL(normalized);
    } catch {
      throw new BadRequestException('imageUrl must be a valid HTTPS URL.');
    }
    if (
      parsed.protocol !== 'https:' ||
      !parsed.hostname ||
      parsed.username ||
      parsed.password
    ) {
      throw new BadRequestException('imageUrl must be a valid HTTPS URL.');
    }
    return parsed.toString();
  }
}
