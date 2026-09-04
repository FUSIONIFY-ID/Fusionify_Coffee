import '../../cart/domain/cart_item.dart';
import '../../catalog/domain/catalog_models.dart';
import '../domain/order_history_models.dart';

class ReorderBuildResult {
  const ReorderBuildResult({
    required this.items,
    required this.unavailableProductNames,
  });

  final List<CartItem> items;
  final List<String> unavailableProductNames;

  bool get canReorder => unavailableProductNames.isEmpty && items.isNotEmpty;
}

ReorderBuildResult buildReorderCart({
  required CustomerOrderDetail order,
  required CatalogSnapshot catalog,
}) {
  final cartItems = <CartItem>[];
  final unavailable = <String>[];

  for (final orderItem in order.items) {
    final product = catalog.products.where((item) {
      return item.id == orderItem.productId;
    }).firstOrNull;

    if (product == null) {
      unavailable.add(orderItem.productName);
      continue;
    }

    final selectedOptionIds = orderItem.selectedModifiers
        .map((modifier) => modifier.optionId)
        .where((id) => id.isNotEmpty)
        .toSet();

    final currentOptions = <String, ModifierOption>{
      for (final group in product.modifierGroups)
        for (final option in group.options) option.id: option,
    };

    if (!selectedOptionIds.every(currentOptions.containsKey)) {
      unavailable.add(orderItem.productName);
      continue;
    }

    var configurationValid = true;
    for (final group in product.modifierGroups) {
      final selectedInGroup = group.options
          .where((option) => selectedOptionIds.contains(option.id))
          .length;

      if (group.required && selectedInGroup == 0) {
        configurationValid = false;
        break;
      }
      if (!group.allowMultiple && selectedInGroup > 1) {
        configurationValid = false;
        break;
      }
    }

    if (!configurationValid) {
      unavailable.add(orderItem.productName);
      continue;
    }

    final selectedOptions = selectedOptionIds
        .map((id) => currentOptions[id]!)
        .toList(growable: false);

    cartItems.add(
      CartItem.fromProduct(
        product: product,
        selectedOptions: selectedOptions,
        quantity: orderItem.quantity,
      ),
    );
  }

  if (unavailable.isNotEmpty) {
    return ReorderBuildResult(
      items: const <CartItem>[],
      unavailableProductNames: List.unmodifiable(unavailable),
    );
  }

  return ReorderBuildResult(
    items: List.unmodifiable(cartItems),
    unavailableProductNames: const <String>[],
  );
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull {
    final iterator = this.iterator;
    return iterator.moveNext() ? iterator.current : null;
  }
}
