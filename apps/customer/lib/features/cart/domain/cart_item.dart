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

  String displayProductName(CatalogSnapshot? catalog) {
    return _localizedProduct(catalog)?.name ?? productName;
  }

  List<String> displayOptionLabels(CatalogSnapshot? catalog) {
    final product = _localizedProduct(catalog);
    if (product == null) {
      return selectedOptions
          .map((option) => option.label)
          .toList(growable: false);
    }

    final localizedById = <String, String>{
      for (final group in product.modifierGroups)
        for (final option in group.options) option.id: option.label,
    };

    return selectedOptions
        .map((option) => localizedById[option.id] ?? option.label)
        .toList(growable: false);
  }

  Product? _localizedProduct(CatalogSnapshot? catalog) {
    if (catalog == null) return null;
    for (final product in catalog.products) {
      if (product.id == productId) return product;
    }
    return null;
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
