import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../catalog/domain/catalog_models.dart';
import 'media_image.dart';

const _previewProductAssets = <String, String>{
  'aren-latte': 'assets/products/aren-latte.webp',
  'sea-salt-latte': 'assets/products/sea-salt-latte.webp',
  'matcha-cloud': 'assets/products/matcha-cloud.webp',
  'buttercream-latte': 'assets/products/buttercream-latte.webp',
  'pandan-coconut-latte': 'assets/products/pandan-coconut-latte.webp',
  'chocolate-malt-cloud': 'assets/products/chocolate-malt-cloud.webp',
};

String? previewProductAsset(String productId) {
  return _previewProductAssets[productId];
}

class ProductImage extends StatelessWidget {
  const ProductImage({
    super.key,
    required this.product,
    this.padding = const EdgeInsets.all(CoffeeSpacing.xs),
  });

  final Product product;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final asset = previewProductAsset(product.id);

    return DecoratedBox(
      decoration: BoxDecoration(
        color: CoffeeColors.surfaceWarm,
        borderRadius: BorderRadius.circular(CoffeeRadius.control),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(CoffeeRadius.control),
        child: Padding(
          padding: padding,
          child: MediaImage(
            mediaUrl: product.imageUrl,
            bundledFallback: asset,
            fit: BoxFit.contain,
            semanticLabel: product.name,
            placeholderIcon: Icons.local_cafe_outlined,
          ),
        ),
      ),
    );
  }
}
