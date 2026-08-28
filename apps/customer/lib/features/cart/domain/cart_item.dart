import '../../catalog/domain/catalog_models.dart';

class CartItem {
  const CartItem({
    required this.productId,
    required this.productName,
    required this.unitPrice,
    required this.quantity,
    required this.selectedOptions,
  });

  factory CartItem.fromProduct({
    required Product product,
    required List<ModifierOption> selectedOptions,
    int quantity = 1,
  }) {
    final optionTotal = selectedOptions.fold<int>(
      0,
      (total, option) => total + option.priceDelta,
    );

    return CartItem(
      productId: product.id,
      productName: product.name,
      unitPrice: product.basePrice + optionTotal,
      quantity: quantity,
      selectedOptions: List.unmodifiable(selectedOptions),
    );
  }

  final String productId;
  final String productName;
  final int unitPrice;
  final int quantity;
  final List<ModifierOption> selectedOptions;

  int get lineTotal => unitPrice * quantity;

  String get signature {
    final optionIds = selectedOptions.map((option) => option.id).toList()
      ..sort();
    return '$productId|${optionIds.join(',')}';
  }

  CartItem copyWith({int? quantity}) {
    return CartItem(
      productId: productId,
      productName: productName,
      unitPrice: unitPrice,
      quantity: quantity ?? this.quantity,
      selectedOptions: selectedOptions,
    );
  }
}
