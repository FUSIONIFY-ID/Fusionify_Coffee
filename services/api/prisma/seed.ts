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

function campaignTranslations(input: {
  titles: LocalizedName;
  bodies: LocalizedName;
  ctaLabels: LocalizedName;
}) {
  return {
    ID_ID: {
      title: input.titles.ID_ID,
      body: input.bodies.ID_ID,
      ctaLabel: input.ctaLabels.ID_ID,
    },
    MS_MY: {
      title: input.titles.MS_MY,
      body: input.bodies.MS_MY,
      ctaLabel: input.ctaLabels.MS_MY,
    },
    EN: {
      title: input.titles.EN,
      body: input.bodies.EN,
      ctaLabel: input.ctaLabels.EN,
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
  imageUrl: string;
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
      imageUrl: input.imageUrl,
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
      imageUrl: input.imageUrl,
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
      imageUrl: 'asset://outlets/preview-store.webp',
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
      imageUrl: 'asset://outlets/preview-store.webp',
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
    imageUrl: 'asset://products/aren-latte.webp',
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
    imageUrl: 'asset://products/sea-salt-latte.webp',
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
    imageUrl: 'asset://products/matcha-cloud.webp',
  });

  await seedProduct({
    id: 'buttercream-latte',
    names: {
      ID_ID: 'Buttercream Latte',
      MS_MY: 'Buttercream Latte',
      EN: 'Buttercream Latte',
    },
    descriptions: {
      ID_ID: 'Espresso creamy dengan lapisan buttercream lembut.',
      MS_MY: 'Espresso berkrim dengan lapisan buttercream lembut.',
      EN: 'Creamy espresso finished with a smooth buttercream layer.',
    },
    basePrice: 33000,
    categoryId: 'coffee',
    imageUrl: 'asset://products/buttercream-latte.webp',
    isBestseller: true,
  });

  await seedProduct({
    id: 'pandan-coconut-latte',
    names: {
      ID_ID: 'Pandan Coconut Latte',
      MS_MY: 'Pandan Coconut Latte',
      EN: 'Pandan Coconut Latte',
    },
    descriptions: {
      ID_ID: 'Pandan harum dan kelapa creamy dalam satu gelas.',
      MS_MY: 'Pandan harum dan kelapa berkrim dalam satu gelas.',
      EN: 'Fragrant pandan and creamy coconut in one refreshing cup.',
    },
    basePrice: 31000,
    categoryId: 'non-coffee',
    imageUrl: 'asset://products/pandan-coconut-latte.webp',
  });

  await seedProduct({
    id: 'chocolate-malt-cloud',
    names: {
      ID_ID: 'Chocolate Malt Cloud',
      MS_MY: 'Chocolate Malt Cloud',
      EN: 'Chocolate Malt Cloud',
    },
    descriptions: {
      ID_ID: 'Cokelat malt dingin dengan foam cokelat yang ringan.',
      MS_MY: 'Coklat malt sejuk dengan buih coklat yang ringan.',
      EN: 'Iced chocolate malt with a light chocolate cloud foam.',
    },
    basePrice: 32000,
    categoryId: 'non-coffee',
    imageUrl: 'asset://products/chocolate-malt-cloud.webp',
  });

  const campaigns = [
    {
      id: 'signature-lineup',
      titles: {
        ID_ID: 'Signature Fusion',
        MS_MY: 'Signature Fusion',
        EN: 'Fusion Signatures',
      },
      bodies: {
        ID_ID: 'Tiga rasa andalan untuk nemenin harimu.',
        MS_MY: 'Tiga rasa pilihan untuk menemani hari anda.',
        EN: 'Three house favorites for every kind of day.',
      },
      ctaLabels: {
        ID_ID: 'Lihat Menu',
        MS_MY: 'Lihat Menu',
        EN: 'Explore Menu',
      },
      imageUrl: 'asset://campaigns/signature-lineup.webp',
      actionPath: '/menu',
      sortOrder: 0,
    },
    {
      id: 'morning-pickup',
      titles: {
        ID_ID: 'Pagi Tanpa Antre',
        MS_MY: 'Pagi Tanpa Beratur',
        EN: 'Skip the Morning Line',
      },
      bodies: {
        ID_ID: 'Pesan dulu, ambil saat kopi dan sarapanmu siap.',
        MS_MY: 'Pesan dahulu, ambil apabila kopi dan sarapan siap.',
        EN: 'Order ahead and pick up coffee and breakfast when ready.',
      },
      ctaLabels: {
        ID_ID: 'Pesan Sekarang',
        MS_MY: 'Pesan Sekarang',
        EN: 'Order Now',
      },
      imageUrl: 'asset://campaigns/morning-pickup.webp',
      actionPath: '/menu',
      sortOrder: 1,
    },
    {
      id: 'fusion-black-rewards',
      titles: {
        ID_ID: 'Menuju Fusion Black',
        MS_MY: 'Menuju Fusion Black',
        EN: 'Your Path to Fusion Black',
      },
      bodies: {
        ID_ID: 'Naik tier lewat transaksi yang tercatat di akunmu.',
        MS_MY: 'Naik tahap melalui transaksi dalam akaun anda.',
        EN: 'Move up through eligible purchases recorded to your account.',
      },
      ctaLabels: {
        ID_ID: 'Lihat Membership',
        MS_MY: 'Lihat Keahlian',
        EN: 'View Membership',
      },
      imageUrl: 'asset://campaigns/fusion-black-rewards.webp',
      actionPath: '/rewards',
      sortOrder: 2,
    },
  ] satisfies Array<{
    id: string;
    titles: LocalizedName;
    bodies: LocalizedName;
    ctaLabels: LocalizedName;
    imageUrl: string;
    actionPath: string;
    sortOrder: number;
  }>;

  for (const campaign of campaigns) {
    const translations = campaignTranslations(campaign);
    await prisma.campaign.upsert({
      where: { id: campaign.id },
      update: {
        title: campaign.titles.EN,
        body: campaign.bodies.EN,
        ctaLabel: campaign.ctaLabels.EN,
        translations,
        imageUrl: campaign.imageUrl,
        actionPath: campaign.actionPath,
        active: true,
        sortOrder: campaign.sortOrder,
      },
      create: {
        id: campaign.id,
        title: campaign.titles.EN,
        body: campaign.bodies.EN,
        ctaLabel: campaign.ctaLabels.EN,
        translations,
        imageUrl: campaign.imageUrl,
        actionPath: campaign.actionPath,
        active: true,
        sortOrder: campaign.sortOrder,
      },
    });
  }
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
