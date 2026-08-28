class Outlet {
  const Outlet({
    required this.id,
    required this.name,
    required this.note,
    required this.pickupEnabled,
  });

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
    required this.description,
    required this.category,
    required this.basePrice,
    required this.modifierGroups,
    this.isBestseller = false,
  });

  final String id;
  final String name;
  final String description;
  final String category;
  final int basePrice;
  final List<ModifierGroup> modifierGroups;
  final bool isBestseller;
}
