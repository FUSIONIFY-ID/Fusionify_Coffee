import 'package:fusionify_coffee/features/catalog/domain/catalog_models.dart';

const catalogFixture = CatalogSnapshot(
  preview: true,
  outlet: Outlet(
    id: 'preview-outlet',
    name: 'Fusionify Coffee Preview Store',
    note: 'Test fixture',
    pickupEnabled: true,
  ),
  products: [
    Product(
      id: 'aren-latte',
      name: 'Aren Latte',
      description: 'Espresso dan fresh milk.',
      category: 'Coffee',
      basePrice: 28000,
      isBestseller: true,
      modifierGroups: [
        ModifierGroup(
          id: 'size',
          label: 'Size',
          required: true,
          options: [
            ModifierOption(id: 'regular', label: 'Regular', isDefault: true),
            ModifierOption(id: 'large', label: 'Large', priceDelta: 5000),
          ],
        ),
      ],
    ),
  ],
);
