import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed Fusionify Coffee.');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

type Language = 'ID_ID' | 'MS_MY' | 'EN';

type LocalizedName = Record<Language, string>;

type SeedOption = {
  id: string;
  labels: LocalizedName;
  priceDelta?: number;
  isDefault?: boolean;
};

type SeedGroup = {
  id: string;
  labels: LocalizedName;
  required?: boolean;
  allowMultiple?: boolean;
  options: SeedOption[];
};

function nameTranslations(labels: LocalizedName) {
  return {
    ID_ID: { name: labels.ID_ID },
    MS_MY: { name: labels.MS_MY },
    EN: { name: labels.EN },
  };
}

function contentTranslations(input: {
  names: LocalizedName;
  descriptions: LocalizedName;
}) {
  return {
    ID_ID: {
      name: input.names.ID_ID,
      description: input.descriptions.ID_ID,
    },
    MS_MY: {
      name: input.names.MS_MY,
      description: input.descriptions.MS_MY,
    },
    EN: {
      name: input.names.EN,
      description: input.descriptions.EN,
    },
  };
}

const modifierGroups: SeedGroup[] = [
  {
    id: 'size',
    labels: {
      ID_ID: 'Ukuran',
      MS_MY: 'Saiz',
      EN: 'Size',
    },
    required: true,
    options: [
      {
        id: 'regular',
        labels: { ID_ID: 'Regular', MS_MY: 'Biasa', EN: 'Regular' },
        isDefault: true,
      },
      {
        id: 'large',
        labels: { ID_ID: 'Besar', MS_MY: 'Besar', EN: 'Large' },
        priceDelta: 5000,
      },
    ],
  },
  {
    id: 'temperature',
    labels: {
      ID_ID: 'Suhu',
      MS_MY: 'Suhu',
      EN: 'Temperature',
    },
    required: true,
    options: [
      {
        id: 'iced',
        labels: { ID_ID: 'Dingin', MS_MY: 'Ais', EN: 'Iced' },
        isDefault: true,
      },
      {
        id: 'hot',
        labels: { ID_ID: 'Panas', MS_MY: 'Panas', EN: 'Hot' },
      },
    ],
  },
  {
    id: 'sugar',
    labels: {
      ID_ID: 'Gula',
      MS_MY: 'Gula',
      EN: 'Sugar',
    },
    required: true,
    options: [
      {
        id: 'sugar-0',
        labels: { ID_ID: '0%', MS_MY: '0%', EN: '0%' },
      },
      {
        id: 'sugar-25',
        labels: { ID_ID: '25%', MS_MY: '25%', EN: '25%' },
      },
      {
        id: 'sugar-50',
        labels: { ID_ID: '50%', MS_MY: '50%', EN: '50%' },
        isDefault: true,
      },
      {
        id: 'sugar-75',
        labels: { ID_ID: '75%', MS_MY: '75%', EN: '75%' },
      },
      {
        id: 'sugar-100',
        labels: { ID_ID: '100%', MS_MY: '100%', EN: '100%' },
      },
    ],
  },
  {
    id: 'ice',
    labels: {
      ID_ID: 'Es',
      MS_MY: 'Ais',
      EN: 'Ice',
    },
    required: true,
    options: [
      {
        id: 'no-ice',
        labels: { ID_ID: 'Tanpa Es', MS_MY: 'Tanpa Ais', EN: 'No Ice' },
      },
      {
        id: 'less-ice',
        labels: { ID_ID: 'Sedikit Es', MS_MY: 'Kurang Ais', EN: 'Less Ice' },
      },
      {
        id: 'normal-ice',
        labels: { ID_ID: 'Es Normal', MS_MY: 'Ais Biasa', EN: 'Normal Ice' },
        isDefault: true,
      },
    ],
  },
  {
    id: 'milk',
    labels: {
      ID_ID: 'Susu',
      MS_MY: 'Susu',
      EN: 'Milk',
    },
    required: true,
    options: [
      {
        id: 'fresh-milk',
        labels: {
          ID_ID: 'Susu Segar',
          MS_MY: 'Susu Segar',
          EN: 'Fresh Milk',
        },
        isDefault: true,
      },
      {
        id: 'oat-milk',
        labels: { ID_ID: 'Susu Oat', MS_MY: 'Susu Oat', EN: 'Oat Milk' },
        priceDelta: 8000,
      },
    ],
  },
  {
    id: 'add-ons',
    labels: {
      ID_ID: 'Tambahan',
      MS_MY: 'Tambahan',
      EN: 'Add-ons',
    },
    allowMultiple: true,
    options: [
      {
        id: 'extra-shot',
        labels: {
          ID_ID: 'Extra Shot',
          MS_MY: 'Extra Shot',
          EN: 'Extra Shot',
        },
        priceDelta: 7000,
      },
      {
        id: 'coffee-jelly',
        labels: {
          ID_ID: 'Coffee Jelly',
          MS_MY: 'Coffee Jelly',
          EN: 'Coffee Jelly',
        },
        priceDelta: 5000,
      },
      {
        id: 'caramel',
        labels: { ID_ID: 'Karamel', MS_MY: 'Karamel', EN: 'Caramel' },
        priceDelta: 4000,
      },
    ],
  },
];

async function seedProduct(input: {
  id: string;
  names: LocalizedName;
  descriptions: LocalizedName;
  basePrice: number;
  categoryId: string;
  isBestseller?: boolean;
}) {
  const translations = contentTranslations({
    names: input.names,
    descriptions: input.descriptions,
  });

  await prisma.product.upsert({
    where: { id: input.id },
    update: {
      name: input.names.EN,
      description: input.descriptions.EN,
      translations,
      basePrice: input.basePrice,
      categoryId: input.categoryId,
      active: true,
      isBestseller: input.isBestseller ?? false,
    },
    create: {
      id: input.id,
      name: input.names.EN,
      description: input.descriptions.EN,
      translations,
      basePrice: input.basePrice,
      categoryId: input.categoryId,
      active: true,
      isBestseller: input.isBestseller ?? false,
    },
  });

  await prisma.modifierGroup.deleteMany({
    where: { productId: input.id },
  });

  for (const [groupIndex, group] of modifierGroups.entries()) {
    await prisma.modifierGroup.create({
      data: {
        id: `${input.id}-${group.id}`,
        productId: input.id,
        name: group.labels.EN,
        translations: nameTranslations(group.labels),
        required: group.required ?? false,
        allowMultiple: group.allowMultiple ?? false,
        sortOrder: groupIndex,
        options: {
          create: group.options.map((option, optionIndex) => ({
            id: `${input.id}-${group.id}-${option.id}`,
            name: option.labels.EN,
            translations: nameTranslations(option.labels),
            priceDelta: option.priceDelta ?? 0,
            isDefault: option.isDefault ?? false,
            active: true,
            sortOrder: optionIndex,
          })),
        },
      },
    });
  }
}

async function main() {
  const outletTranslations = {
    ID_ID: {
      name: 'Fusionify Coffee Preview Store',
      note: 'Data pengembangan yang berasal dari database.',
    },
    MS_MY: {
      name: 'Fusionify Coffee Preview Store',
      note: 'Data pembangunan yang bersumber daripada pangkalan data.',
    },
    EN: {
      name: 'Fusionify Coffee Preview Store',
      note: 'Database-backed development fixture.',
    },
  };

  await prisma.outlet.upsert({
    where: { id: 'preview-outlet' },
    update: {
      name: 'Fusionify Coffee Preview Store',
      note: 'Database-backed development fixture.',
      translations: outletTranslations,
      pickupEnabled: true,
      deliveryEnabled: true,
      latitude: -6.595,
      longitude: 106.8166,
      deliveryRadiusMeters: 10000,
      deliveryBaseFee: 5000,
      deliveryPerKmFee: 2000,
    },
    create: {
      id: 'preview-outlet',
      name: 'Fusionify Coffee Preview Store',
      note: 'Database-backed development fixture.',
      translations: outletTranslations,
      pickupEnabled: true,
      deliveryEnabled: true,
      latitude: -6.595,
      longitude: 106.8166,
      deliveryRadiusMeters: 10000,
      deliveryBaseFee: 5000,
      deliveryPerKmFee: 2000,
    },
  });

  const categories = [
    {
      id: 'coffee',
      sortOrder: 0,
      labels: {
        ID_ID: 'Kopi',
        MS_MY: 'Kopi',
        EN: 'Coffee',
      } satisfies LocalizedName,
    },
    {
      id: 'non-coffee',
      sortOrder: 1,
      labels: {
        ID_ID: 'Non-Kopi',
        MS_MY: 'Bukan Kopi',
        EN: 'Non Coffee',
      } satisfies LocalizedName,
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {
        name: category.labels.EN,
        translations: nameTranslations(category.labels),
        sortOrder: category.sortOrder,
      },
      create: {
        id: category.id,
        name: category.labels.EN,
        translations: nameTranslations(category.labels),
        sortOrder: category.sortOrder,
      },
    });
  }

  await seedProduct({
    id: 'aren-latte',
    names: {
      ID_ID: 'Aren Latte',
      MS_MY: 'Aren Latte',
      EN: 'Aren Latte',
    },
    descriptions: {
      ID_ID: 'Espresso, susu segar, dan gula aren yang seimbang.',
      MS_MY: 'Espresso, susu segar dan gula aren yang seimbang.',
      EN: 'Espresso, fresh milk, and balanced palm sugar sweetness.',
    },
    basePrice: 28000,
    categoryId: 'coffee',
    isBestseller: true,
  });

  await seedProduct({
    id: 'sea-salt-latte',
    names: {
      ID_ID: 'Sea Salt Latte',
      MS_MY: 'Sea Salt Latte',
      EN: 'Sea Salt Latte',
    },
    descriptions: {
      ID_ID: 'Latte lembut dengan sentuhan krim sea salt.',
      MS_MY: 'Latte lembut dengan sentuhan krim garam laut.',
      EN: 'Smooth latte finished with sea-salt cream.',
    },
    basePrice: 32000,
    categoryId: 'coffee',
  });

  await seedProduct({
    id: 'matcha-cloud',
    names: {
      ID_ID: 'Matcha Cloud',
      MS_MY: 'Matcha Cloud',
      EN: 'Matcha Cloud',
    },
    descriptions: {
      ID_ID: 'Matcha creamy untuk pilihan tanpa kopi.',
      MS_MY: 'Matcha berkrim untuk pilihan tanpa kopi.',
      EN: 'Creamy matcha for a coffee-free choice.',
    },
    basePrice: 30000,
    categoryId: 'non-coffee',
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
