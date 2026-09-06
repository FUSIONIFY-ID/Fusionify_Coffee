import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StaffAuthService } from '../staff/staff-auth.service';
import { CatalogAdminService } from './catalog-admin.service';

describe('CatalogAdminService', () => {
  it('creates new products unavailable at every outlet until explicitly enabled', async () => {
    const createMany = jest.fn().mockResolvedValue({ count: 2 });
    const productUpsert = jest.fn().mockResolvedValue({
      id: 'new-latte',
      name: 'New Latte',
      active: true,
    });
    const transactionClient = {
      product: { upsert: productUpsert },
      outlet: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'jakarta' }, { id: 'depok' }]),
      },
      outletProductAvailability: { createMany },
    };
    const transaction = jest.fn(
      (callback: (client: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient),
    );
    const prisma = {
      category: {
        findUnique: jest.fn().mockResolvedValue({ id: 'coffee' }),
      },
      product: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: transaction,
    } as unknown as PrismaService;
    const audit = jest.fn().mockResolvedValue(undefined);
    const staffAuthService = { audit } as unknown as StaffAuthService;
    const service = new CatalogAdminService(prisma, staffAuthService);

    await service.upsertProduct('staff-1', 'new-latte', {
      name: 'New Latte',
      description: 'A new espresso drink.',
      imageUrl: 'https://cdn.example.com/new-latte.webp',
      basePrice: 32000,
      categoryId: 'coffee',
      active: true,
      isBestseller: false,
    });

    const [createManyInput] = createMany.mock.calls[0] as [
      {
        data: Array<{
          outletId: string;
          productId: string;
          available: boolean;
        }>;
      },
    ];
    expect(createManyInput.data).toEqual([
      { outletId: 'jakarta', productId: 'new-latte', available: false },
      { outletId: 'depok', productId: 'new-latte', available: false },
    ]);
    expect(audit).toHaveBeenCalledWith(
      'staff-1',
      'CATALOG_PRODUCT_UPDATED',
      expect.objectContaining({ targetId: 'new-latte' }),
    );
  });

  it('rejects insecure media URLs in production', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const service = new CatalogAdminService(
      {} as PrismaService,
      {} as StaffAuthService,
    );

    try {
      await expect(
        service.upsertCampaign('staff-1', 'morning-campaign', {
          title: 'Morning coffee',
          body: 'Start the day with coffee.',
          ctaLabel: 'Order now',
          imageUrl: 'http://cdn.example.com/banner.webp',
          actionPath: '/menu',
          active: true,
          sortOrder: 0,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });

  it('rejects unsupported campaign destinations before writing data', async () => {
    const campaignUpsert = jest.fn();
    const service = new CatalogAdminService(
      { campaign: { upsert: campaignUpsert } } as unknown as PrismaService,
      {} as StaffAuthService,
    );

    await expect(
      service.upsertCampaign('staff-1', 'external-campaign', {
        title: 'External',
        body: 'Unsupported destination.',
        ctaLabel: 'Open',
        imageUrl: 'https://cdn.example.com/banner.webp',
        actionPath: '/checkout' as '/menu',
        active: true,
        sortOrder: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(campaignUpsert).not.toHaveBeenCalled();
  });

  it('upserts a complete modifier group and archives omitted options', async () => {
    const groupUpsert = jest.fn().mockResolvedValue({ id: 'latte-size' });
    const optionUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    const optionUpsert = jest.fn().mockResolvedValue({ id: 'latte-regular' });
    const savedGroup = {
      id: 'latte-size',
      productId: 'latte',
      name: 'Size',
      active: true,
      required: true,
      allowMultiple: false,
      sortOrder: 0,
      options: [
        {
          id: 'latte-regular',
          modifierGroupId: 'latte-size',
          name: 'Regular',
          priceDelta: 0,
          isDefault: true,
          active: true,
          sortOrder: 0,
        },
      ],
    };
    const transactionClient = {
      modifierGroup: {
        upsert: groupUpsert,
        findUniqueOrThrow: jest.fn().mockResolvedValue(savedGroup),
      },
      modifierOption: {
        updateMany: optionUpdateMany,
        upsert: optionUpsert,
      },
    };
    const transaction = jest.fn(
      (callback: (client: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient),
    );
    const audit = jest.fn().mockResolvedValue(undefined);
    const prisma = {
      product: { findUnique: jest.fn().mockResolvedValue({ id: 'latte' }) },
      modifierGroup: { findUnique: jest.fn().mockResolvedValue(null) },
      modifierOption: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: transaction,
    } as unknown as PrismaService;
    const service = new CatalogAdminService(prisma, {
      audit,
    } as unknown as StaffAuthService);

    await expect(
      service.upsertModifierGroup('staff-1', 'latte', 'latte-size', {
        name: 'Size',
        active: true,
        required: true,
        allowMultiple: false,
        sortOrder: 0,
        options: [
          {
            id: 'latte-regular',
            name: 'Regular',
            priceDelta: 0,
            isDefault: true,
            active: true,
            sortOrder: 0,
          },
        ],
      }),
    ).resolves.toEqual(savedGroup);

    const [archiveInput] = optionUpdateMany.mock.calls[0] as [unknown];
    expect(archiveInput).toMatchObject({
      where: {
        modifierGroupId: 'latte-size',
        id: { notIn: ['latte-regular'] },
      },
      data: { active: false, isDefault: false },
    });
    expect(audit).toHaveBeenCalledWith(
      'staff-1',
      'CATALOG_MODIFIER_GROUP_UPDATED',
      expect.objectContaining({ targetId: 'latte-size' }),
    );
  });

  it('rejects multiple defaults in a single-select modifier group', async () => {
    const service = new CatalogAdminService(
      {} as PrismaService,
      {} as StaffAuthService,
    );

    await expect(
      service.upsertModifierGroup('staff-1', 'latte', 'latte-size', {
        name: 'Size',
        active: true,
        required: true,
        allowMultiple: false,
        options: [
          {
            id: 'latte-regular',
            name: 'Regular',
            priceDelta: 0,
            isDefault: true,
          },
          {
            id: 'latte-large',
            name: 'Large',
            priceDelta: 5000,
            isDefault: true,
          },
        ],
      }),
    ).rejects.toThrow(
      'A single-select modifier group can only have one default option.',
    );
  });
});
