import '../domain/catalog_models.dart';

const previewOutlet = Outlet(
  id: 'preview-outlet',
  name: 'Fusionify Coffee Preview Store',
  note: 'Data outlet sementara untuk development Milestone 0.1.',
  pickupEnabled: true,
);

const _sizeGroup = ModifierGroup(
  id: 'size',
  label: 'Size',
  required: true,
  options: [
    ModifierOption(id: 'regular', label: 'Regular', isDefault: true),
    ModifierOption(id: 'large', label: 'Large', priceDelta: 5000),
  ],
);

const _temperatureGroup = ModifierGroup(
  id: 'temperature',
  label: 'Temperature',
  required: true,
  options: [
    ModifierOption(id: 'iced', label: 'Iced', isDefault: true),
    ModifierOption(id: 'hot', label: 'Hot'),
  ],
);

const _sugarGroup = ModifierGroup(
  id: 'sugar',
  label: 'Sugar Level',
  required: true,
  options: [
    ModifierOption(id: 'sugar-0', label: '0%'),
    ModifierOption(id: 'sugar-25', label: '25%'),
    ModifierOption(id: 'sugar-50', label: '50%', isDefault: true),
    ModifierOption(id: 'sugar-75', label: '75%'),
    ModifierOption(id: 'sugar-100', label: '100%'),
  ],
);

const _iceGroup = ModifierGroup(
  id: 'ice',
  label: 'Ice Level',
  required: true,
  options: [
    ModifierOption(id: 'no-ice', label: 'No Ice'),
    ModifierOption(id: 'less-ice', label: 'Less Ice'),
    ModifierOption(id: 'normal-ice', label: 'Normal Ice', isDefault: true),
  ],
);

const _milkGroup = ModifierGroup(
  id: 'milk',
  label: 'Milk',
  required: true,
  options: [
    ModifierOption(id: 'fresh-milk', label: 'Fresh Milk', isDefault: true),
    ModifierOption(id: 'oat-milk', label: 'Oat Milk', priceDelta: 8000),
  ],
);

const _addonGroup = ModifierGroup(
  id: 'addons',
  label: 'Add-ons',
  allowMultiple: true,
  options: [
    ModifierOption(id: 'extra-shot', label: 'Extra Shot', priceDelta: 7000),
    ModifierOption(id: 'coffee-jelly', label: 'Coffee Jelly', priceDelta: 5000),
    ModifierOption(id: 'caramel', label: 'Caramel', priceDelta: 4000),
  ],
);

const demoProducts = [
  Product(
    id: 'aren-latte',
    name: 'Aren Latte',
    description: 'Espresso, fresh milk, dan rasa gula aren yang seimbang.',
    category: 'Coffee',
    basePrice: 28000,
    isBestseller: true,
    modifierGroups: [
      _sizeGroup,
      _temperatureGroup,
      _sugarGroup,
      _iceGroup,
      _milkGroup,
      _addonGroup,
    ],
  ),
  Product(
    id: 'sea-salt-latte',
    name: 'Sea Salt Latte',
    description: 'Latte lembut dengan sentuhan sea salt cream.',
    category: 'Coffee',
    basePrice: 32000,
    modifierGroups: [
      _sizeGroup,
      _temperatureGroup,
      _sugarGroup,
      _iceGroup,
      _milkGroup,
      _addonGroup,
    ],
  ),
  Product(
    id: 'matcha-cloud',
    name: 'Matcha Cloud',
    description: 'Matcha creamy untuk pilihan non-coffee.',
    category: 'Non Coffee',
    basePrice: 30000,
    modifierGroups: [
      _sizeGroup,
      _temperatureGroup,
      _sugarGroup,
      _iceGroup,
      _milkGroup,
      _addonGroup,
    ],
  ),
];
