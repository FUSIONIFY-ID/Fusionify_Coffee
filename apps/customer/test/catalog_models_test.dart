import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/features/catalog/domain/catalog_models.dart';

void main() {
  test('parses modifier-aware catalog payload', () {
    final snapshot = CatalogSnapshot.fromJson({
      'preview': true,
      'outlet': {
        'id': 'preview-outlet',
        'name': 'Preview Store',
        'note': 'Development only',
        'pickupEnabled': true,
      },
      'products': [
        {
          'id': 'aren-latte',
          'name': 'Aren Latte',
          'description': 'Test',
          'category': 'Coffee',
          'basePrice': 28000,
          'isBestseller': true,
          'modifierGroups': [
            {
              'id': 'milk',
              'label': 'Milk',
              'required': true,
              'allowMultiple': false,
              'options': [
                {
                  'id': 'oat-milk',
                  'label': 'Oat Milk',
                  'priceDelta': 8000,
                  'isDefault': false,
                },
              ],
            },
          ],
        },
      ],
    });

    expect(snapshot.preview, isTrue);
    expect(snapshot.outlet.pickupEnabled, isTrue);
    expect(snapshot.products.single.modifierGroups.single.label, 'Milk');
    expect(
      snapshot.products.single.modifierGroups.single.options.single.priceDelta,
      8000,
    );
  });
}
