import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../../core/formatters/currency.dart';
import '../../catalog/domain/catalog_models.dart';

class ProductCard extends StatelessWidget {
  const ProductCard({super.key, required this.product, required this.onTap});

  final Product product;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: CoffeeColors.surface,
      borderRadius: BorderRadius.circular(CoffeeRadius.card),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(CoffeeRadius.card),
        child: Container(
          padding: const EdgeInsets.all(CoffeeSpacing.sm),
          decoration: BoxDecoration(
            border: Border.all(color: CoffeeColors.border),
            borderRadius: BorderRadius.circular(CoffeeRadius.card),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AspectRatio(
                aspectRatio: 1,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: CoffeeColors.surfaceWarm,
                    borderRadius: BorderRadius.circular(CoffeeRadius.control),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.local_cafe_outlined,
                      size: 42,
                      color: CoffeeColors.textSecondary,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: CoffeeSpacing.sm),
              if (product.isBestseller) ...[
                const Text(
                  'Bestseller',
                  style: TextStyle(
                    color: CoffeeColors.deep,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: CoffeeSpacing.xxs),
              ],
              Text(
                product.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: CoffeeColors.textPrimary,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: CoffeeSpacing.xxs),
              Text(
                formatRupiah(product.basePrice),
                style: const TextStyle(
                  color: CoffeeColors.textPrimary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
