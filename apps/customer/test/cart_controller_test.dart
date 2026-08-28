import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/features/cart/application/cart_controller.dart';
import 'package:fusionify_coffee/features/cart/domain/cart_item.dart';
import 'package:fusionify_coffee/features/catalog/domain/catalog_models.dart';

void main() {
  test('same configured product merges quantity', () {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    const option = ModifierOption(id: 'regular', label: 'Regular');
    const item = CartItem(
      productId: 'aren-latte',
      productName: 'Aren Latte',
      unitPrice: 28000,
      quantity: 1,
      selectedOptions: [option],
    );

    container.read(cartProvider.notifier)
      ..add(item)
      ..add(item);

    final cart = container.read(cartProvider);

    expect(cart, hasLength(1));
    expect(cart.single.quantity, 2);
    expect(cart.single.lineTotal, 56000);
  });
}
