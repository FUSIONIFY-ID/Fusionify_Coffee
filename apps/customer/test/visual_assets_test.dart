import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/features/rewards/presentation/membership_visual_card.dart';
import 'package:fusionify_coffee/features/shared/presentation/product_image.dart';

void main() {
  test('maps preview products to bundled catalog artwork', () {
    expect(
      previewProductAsset('aren-latte'),
      'assets/products/aren-latte.webp',
    );
    expect(
      previewProductAsset('sea-salt-latte'),
      'assets/products/sea-salt-latte.webp',
    );
    expect(
      previewProductAsset('matcha-cloud'),
      'assets/products/matcha-cloud.webp',
    );
    expect(previewProductAsset('future-product'), isNull);
  });

  test('selects membership artwork from configured tier rank', () {
    expect(
      membershipBackgroundAssetForRank(1),
      'assets/membership/fusion-blue.webp',
    );
    expect(
      membershipBackgroundAssetForRank(2),
      'assets/membership/fusion-silver.webp',
    );
    expect(
      membershipBackgroundAssetForRank(3),
      'assets/membership/fusion-gold.webp',
    );
    expect(
      membershipBackgroundAssetForRank(4),
      'assets/membership/fusion-black.webp',
    );
    expect(
      membershipBackgroundAssetForRank(8),
      'assets/membership/fusion-black.webp',
    );
  });
}
