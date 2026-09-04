import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/features/catalog/domain/catalog_models.dart';
import 'package:fusionify_coffee/features/orders/application/reorder_builder.dart';
import 'package:fusionify_coffee/features/orders/domain/order_history_models.dart';

void main() {
  CatalogSnapshot catalog({bool includeOldOption = true}) {
    return CatalogSnapshot(
      preview: true,
      outlet: const Outlet(
        id: 'preview-outlet',
        name: 'Preview Store',
        note: '',
        pickupEnabled: true,
      ),
      products: [
        Product(
          id: 'aren-latte',
          name: 'Aren Latte',
          categoryId: 'coffee',
          description: 'Current description',
          category: 'Coffee',
          basePrice: 30000,
          modifierGroups: [
            ModifierGroup(
              id: 'size',
              label: 'Size',
              required: true,
              options: [
                if (includeOldOption)
                  const ModifierOption(
                    id: 'size-large',
                    label: 'Large',
                    priceDelta: 5000,
                  ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  const oldItem = CustomerOrderItem(
    productId: 'aren-latte',
    productName: 'Aren Latte',
    quantity: 2,
    lineTotal: 56000,
    selectedModifiers: [
      CustomerOrderModifier(
        optionId: 'size-large',
        groupName: 'Size',
        optionName: 'Large',
        priceDelta: 0,
      ),
    ],
  );

  test('reorder rebuilds cart using current catalog pricing', () {
    final result = buildReorderCart(
      orderItems: const [oldItem],
      catalog: catalog(),
    );

    expect(result.canReorder, isTrue);
    expect(result.items, hasLength(1));
    expect(result.items.single.unitPrice, 35000);
    expect(result.items.single.quantity, 2);
    expect(result.items.single.lineTotal, 70000);
  });

  test('reorder fails safely when an old modifier is no longer available', () {
    final result = buildReorderCart(
      orderItems: const [oldItem],
      catalog: catalog(includeOldOption: false),
    );

    expect(result.canReorder, isFalse);
    expect(result.items, isEmpty);
    expect(result.unavailableProductNames, ['Aren Latte']);
  });
}
