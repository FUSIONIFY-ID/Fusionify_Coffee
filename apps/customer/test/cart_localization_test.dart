import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/features/cart/domain/cart_item.dart';
import 'package:fusionify_coffee/features/catalog/domain/catalog_models.dart';

void main() {
  test('cart display labels follow the latest localized catalog', () {
    const storedOption = ModifierOption(
      id: 'milk-oat',
      label: 'Oat Milk',
      priceDelta: 8000,
    );
    const item = CartItem(
      productId: 'aren-latte',
      productName: 'Aren Latte',
      unitPrice: 36000,
      quantity: 1,
      selectedOptions: [storedOption],
    );

    const malayCatalog = CatalogSnapshot(
      preview: false,
      outlet: Outlet(
        id: 'outlet',
        name: 'Fusionify Coffee',
        note: '',
        pickupEnabled: true,
      ),
      products: [
        Product(
          id: 'aren-latte',
          name: 'Aren Latte',
          categoryId: 'coffee',
          description: 'Espresso dan susu segar.',
          category: 'Kopi',
          basePrice: 28000,
          modifierGroups: [
            ModifierGroup(
              id: 'milk',
              label: 'Susu',
              required: true,
              options: [
                ModifierOption(
                  id: 'milk-oat',
                  label: 'Susu Oat',
                  priceDelta: 8000,
                ),
              ],
            ),
          ],
        ),
      ],
    );

    expect(item.displayProductName(malayCatalog), 'Aren Latte');
    expect(item.displayOptionLabels(malayCatalog), ['Susu Oat']);
  });
}
