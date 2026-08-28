import { Injectable } from '@nestjs/common';

const sizeGroup = {
  id: 'size',
  label: 'Size',
  required: true,
  allowMultiple: false,
  options: [
    {
      id: 'regular',
      label: 'Regular',
      priceDelta: 0,
      isDefault: true,
    },
    {
      id: 'large',
      label: 'Large',
      priceDelta: 5000,
      isDefault: false,
    },
  ],
};

const temperatureGroup = {
  id: 'temperature',
  label: 'Temperature',
  required: true,
  allowMultiple: false,
  options: [
    {
      id: 'iced',
      label: 'Iced',
      priceDelta: 0,
      isDefault: true,
    },
    {
      id: 'hot',
      label: 'Hot',
      priceDelta: 0,
      isDefault: false,
    },
  ],
};

const sugarGroup = {
  id: 'sugar',
  label: 'Sugar Level',
  required: true,
  allowMultiple: false,
  options: [
    { id: 'sugar-0', label: '0%', priceDelta: 0, isDefault: false },
    { id: 'sugar-25', label: '25%', priceDelta: 0, isDefault: false },
    { id: 'sugar-50', label: '50%', priceDelta: 0, isDefault: true },
    { id: 'sugar-75', label: '75%', priceDelta: 0, isDefault: false },
    { id: 'sugar-100', label: '100%', priceDelta: 0, isDefault: false },
  ],
};

const iceGroup = {
  id: 'ice',
  label: 'Ice Level',
  required: true,
  allowMultiple: false,
  options: [
    { id: 'no-ice', label: 'No Ice', priceDelta: 0, isDefault: false },
    { id: 'less-ice', label: 'Less Ice', priceDelta: 0, isDefault: false },
    {
      id: 'normal-ice',
      label: 'Normal Ice',
      priceDelta: 0,
      isDefault: true,
    },
  ],
};

const milkGroup = {
  id: 'milk',
  label: 'Milk',
  required: true,
  allowMultiple: false,
  options: [
    {
      id: 'fresh-milk',
      label: 'Fresh Milk',
      priceDelta: 0,
      isDefault: true,
    },
    {
      id: 'oat-milk',
      label: 'Oat Milk',
      priceDelta: 8000,
      isDefault: false,
    },
  ],
};

const addonGroup = {
  id: 'addons',
  label: 'Add-ons',
  required: false,
  allowMultiple: true,
  options: [
    {
      id: 'extra-shot',
      label: 'Extra Shot',
      priceDelta: 7000,
      isDefault: false,
    },
    {
      id: 'coffee-jelly',
      label: 'Coffee Jelly',
      priceDelta: 5000,
      isDefault: false,
    },
    {
      id: 'caramel',
      label: 'Caramel',
      priceDelta: 4000,
      isDefault: false,
    },
  ],
};

const modifierGroups = [
  sizeGroup,
  temperatureGroup,
  sugarGroup,
  iceGroup,
  milkGroup,
  addonGroup,
];

@Injectable()
export class CatalogService {
  getPreviewCatalog() {
    return {
      preview: true,
      outlet: {
        id: 'preview-outlet',
        name: 'Fusionify Coffee Preview Store',
        note: 'Development outlet fixture from the Fusionify Coffee API.',
        pickupEnabled: true,
      },
      products: [
        {
          id: 'aren-latte',
          name: 'Aren Latte',
          description:
            'Espresso, fresh milk, dan rasa gula aren yang seimbang.',
          category: 'Coffee',
          basePrice: 28000,
          isBestseller: true,
          modifierGroups,
        },
        {
          id: 'sea-salt-latte',
          name: 'Sea Salt Latte',
          description: 'Latte lembut dengan sentuhan sea salt cream.',
          category: 'Coffee',
          basePrice: 32000,
          isBestseller: false,
          modifierGroups,
        },
        {
          id: 'matcha-cloud',
          name: 'Matcha Cloud',
          description: 'Matcha creamy untuk pilihan non-coffee.',
          category: 'Non Coffee',
          basePrice: 30000,
          isBestseller: false,
          modifierGroups,
        },
      ],
    };
  }
}
