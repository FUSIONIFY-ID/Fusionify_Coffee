import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../catalog/domain/catalog_models.dart';

const _previewProductAssets = <String, String>{
  'aren-latte': 'assets/products/aren-latte.webp',
  'sea-salt-latte': 'assets/products/sea-salt-latte.webp',
  'matcha-cloud': 'assets/products/matcha-cloud.webp',
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
          child: asset == null
              ? const Center(
                  child: Icon(
                    Icons.local_cafe_outlined,
                    size: 42,
                    color: CoffeeColors.textSecondary,
                  ),
                )
              : Image.asset(
                  asset,
                  fit: BoxFit.contain,
                  semanticLabel: product.name,
                  errorBuilder: (_, _, _) => const Center(
                    child: Icon(
                      Icons.local_cafe_outlined,
                      size: 42,
                      color: CoffeeColors.textSecondary,
                    ),
                  ),
                ),
        ),
      ),
    );
  }
}
