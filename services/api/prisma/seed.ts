import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed Fusionify Coffee.');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

type SeedOption = {
  id: string;
  label: string;
  priceDelta?: number;
  isDefault?: boolean;
};

type SeedGroup = {
  id: string;
  label: string;
  required?: boolean;
  allowMultiple?: boolean;
  options: SeedOption[];
};

const modifierGroups: SeedGroup[] = [
  {
    id: 'size',
    label: 'Size',
    required: true,
    options: [
      { id: 'regular', label: 'Regular', isDefault: true },
      { id: 'large', label: 'Large', priceDelta: 5000 },
    ],
  },
  {
    id: 'temperature',
    label: 'Temperature',
    required: true,
    options: [
      { id: 'iced', label: 'Iced', isDefault: true },
      { id: 'hot', label: 'Hot' },
    ],
  },
  {
    id: 'sugar',
    label: 'Sugar Level',
    required: true,
    options: [
      { id: 'sugar-0', label: '0%' },
      { id: 'sugar-25', label: '25%' },
      { id: 'sugar-50', label: '50%', isDefault: true },
      { id: 'sugar-75', label: '75%' },
      { id: 'sugar-100', label: '100%' },
    ],
  },
  {
    id: 'ice',
    label: 'Ice Level',
    required: true,
    options: [
      { id: 'no-ice', label: 'No Ice' },
      { id: 'less-ice', label: 'Less Ice' },
      { id: 'normal-ice', label: 'Normal Ice', isDefault: true },
    ],
  },
  {
    id: 'milk',
    label: 'Milk',
    required: true,
    options: [
      { id: 'fresh-milk', label: 'Fresh Milk', isDefault: true },
      { id: 'oat-milk', label: 'Oat Milk', priceDelta: 8000 },
    ],
  },
  {
    id: 'addons',
    label: 'Add-ons',
    allowMultiple: true,
    options: [
      { id: 'extra-shot', label: 'Extra Shot', priceDelta: 7000 },
      { id: 'coffee-jelly', label: 'Coffee Jelly', priceDelta: 5000 },
      { id: 'caramel', label: 'Caramel', priceDelta: 4000 },
    ],
  },
];

async function seedProduct(input: {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  categoryId: string;
  isBestseller?: boolean;
}) {
  await prisma.product.upsert({
    where: { id: input.id },
    update: {
      name: input.name,
      description: input.description,
      basePrice: input.basePrice,
      categoryId: input.categoryId,
      active: true,
      isBestseller: input.isBestseller ?? false,
    },
    create: {
      id: input.id,
      name: input.name,
      description: input.description,
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
        name: group.label,
        required: group.required ?? false,
        allowMultiple: group.allowMultiple ?? false,
        sortOrder: groupIndex,
        options: {
          create: group.options.map((option, optionIndex) => ({
            id: `${input.id}-${group.id}-${option.id}`,
            name: option.label,
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
  await prisma.outlet.upsert({
    where: { id: 'preview-outlet' },
    update: {
      name: 'Fusionify Coffee Preview Store',
      note: 'Database-backed development fixture.',
      pickupEnabled: true,
      deliveryEnabled: false,
    },
    create: {
      id: 'preview-outlet',
      name: 'Fusionify Coffee Preview Store',
      note: 'Database-backed development fixture.',
      pickupEnabled: true,
      deliveryEnabled: false,
    },
  });

  await prisma.category.upsert({
    where: { id: 'coffee' },
    update: { name: 'Coffee', sortOrder: 0 },
    create: { id: 'coffee', name: 'Coffee', sortOrder: 0 },
  });

  await prisma.category.upsert({
    where: { id: 'non-coffee' },
    update: { name: 'Non Coffee', sortOrder: 1 },
    create: { id: 'non-coffee', name: 'Non Coffee', sortOrder: 1 },
  });

  await seedProduct({
    id: 'aren-latte',
    name: 'Aren Latte',
    description: 'Espresso, fresh milk, dan rasa gula aren yang seimbang.',
    basePrice: 28000,
    categoryId: 'coffee',
    isBestseller: true,
  });

  await seedProduct({
    id: 'sea-salt-latte',
    name: 'Sea Salt Latte',
    description: 'Latte lembut dengan sentuhan sea salt cream.',
    basePrice: 32000,
    categoryId: 'coffee',
  });

  await seedProduct({
    id: 'matcha-cloud',
    name: 'Matcha Cloud',
    description: 'Matcha creamy untuk pilihan non-coffee.',
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
