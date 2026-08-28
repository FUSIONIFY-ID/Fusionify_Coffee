class CatalogSnapshot {
  const CatalogSnapshot({
    required this.preview,
    required this.outlet,
    required this.products,
  });

  factory CatalogSnapshot.fromJson(Map<String, dynamic> json) {
    return CatalogSnapshot(
      preview: json['preview'] as bool? ?? false,
      outlet: Outlet.fromJson(Map<String, dynamic>.from(json['outlet'] as Map)),
      products: (json['products'] as List<dynamic>? ?? const [])
          .map(
            (item) => Product.fromJson(Map<String, dynamic>.from(item as Map)),
          )
          .toList(growable: false),
    );
  }

  final bool preview;
  final Outlet outlet;
  final List<Product> products;
}

class Outlet {
  const Outlet({
    required this.id,
    required this.name,
    required this.note,
    required this.pickupEnabled,
  });

  factory Outlet.fromJson(Map<String, dynamic> json) {
    return Outlet(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Unknown outlet',
      note: json['note'] as String? ?? '',
      pickupEnabled: json['pickupEnabled'] as bool? ?? false,
    );
  }

  final String id;
  final String name;
  final String note;
  final bool pickupEnabled;
}

class ModifierOption {
  const ModifierOption({
    required this.id,
    required this.label,
    this.priceDelta = 0,
    this.isDefault = false,
  });

  factory ModifierOption.fromJson(Map<String, dynamic> json) {
    return ModifierOption(
      id: json['id'] as String? ?? '',
      label: json['label'] as String? ?? '',
      priceDelta: json['priceDelta'] as int? ?? 0,
      isDefault: json['isDefault'] as bool? ?? false,
    );
  }

  final String id;
  final String label;
  final int priceDelta;
  final bool isDefault;
}

class ModifierGroup {
  const ModifierGroup({
    required this.id,
    required this.label,
    required this.options,
    this.required = false,
    this.allowMultiple = false,
  });

  factory ModifierGroup.fromJson(Map<String, dynamic> json) {
    return ModifierGroup(
      id: json['id'] as String? ?? '',
      label: json['label'] as String? ?? '',
      required: json['required'] as bool? ?? false,
      allowMultiple: json['allowMultiple'] as bool? ?? false,
      options: (json['options'] as List<dynamic>? ?? const [])
          .map(
            (item) =>
                ModifierOption.fromJson(Map<String, dynamic>.from(item as Map)),
          )
          .toList(growable: false),
    );
  }

  final String id;
  final String label;
  final List<ModifierOption> options;
  final bool required;
  final bool allowMultiple;
}

class Product {
  const Product({
    required this.id,
    required this.name,
    required this.categoryId,
    required this.description,
    required this.category,
    required this.basePrice,
    required this.modifierGroups,
    this.isBestseller = false,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      categoryId: json['categoryId'] as String? ?? '',
      description: json['description'] as String? ?? '',
      category: json['category'] as String? ?? '',
      basePrice: json['basePrice'] as int? ?? 0,
      isBestseller: json['isBestseller'] as bool? ?? false,
      modifierGroups: (json['modifierGroups'] as List<dynamic>? ?? const [])
          .map(
            (item) =>
                ModifierGroup.fromJson(Map<String, dynamic>.from(item as Map)),
          )
          .toList(growable: false),
    );
  }

  final String id;
  final String name;
  final String categoryId;
  final String description;
  final String category;
  final int basePrice;
  final List<ModifierGroup> modifierGroups;
  final bool isBestseller;
}
