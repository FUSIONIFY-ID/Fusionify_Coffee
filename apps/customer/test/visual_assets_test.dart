import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/features/rewards/presentation/membership_visual_card.dart';
import 'package:fusionify_coffee/features/shared/presentation/media_image.dart';
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
    expect(
      previewProductAsset('buttercream-latte'),
      'assets/products/buttercream-latte.webp',
    );
    expect(
      previewProductAsset('pandan-coconut-latte'),
      'assets/products/pandan-coconut-latte.webp',
    );
    expect(
      previewProductAsset('chocolate-malt-cloud'),
      'assets/products/chocolate-malt-cloud.webp',
    );
    expect(previewProductAsset('future-product'), isNull);
  });

  test('accepts only supported backend media references', () {
    expect(
      assetPathFromMediaUrl('asset://campaigns/morning-pickup.webp'),
      'assets/campaigns/morning-pickup.webp',
    );
    expect(
      assetPathFromMediaUrl('asset://products/aren-latte.webp'),
      'assets/products/aren-latte.webp',
    );
    expect(assetPathFromMediaUrl('asset://secrets/token.txt'), isNull);
    expect(assetPathFromMediaUrl('asset://products/../token.txt'), isNull);
    expect(assetPathFromMediaUrl('asset://products/%2e%2e/token.txt'), isNull);
    expect(isRemoteMediaUrl('https://cdn.example.com/banner.webp'), isTrue);
    expect(isRemoteMediaUrl('http://10.0.2.2:3000/banner.webp'), isTrue);
    expect(isRemoteMediaUrl('javascript:alert(1)'), isFalse);
    expect(isRemoteMediaUrl('file:///tmp/banner.webp'), isFalse);
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
