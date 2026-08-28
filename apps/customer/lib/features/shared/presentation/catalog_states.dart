import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_strings.dart';

class CatalogLoading extends StatelessWidget {
  const CatalogLoading({super.key, this.cardCount = 3});

  final int cardCount;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          height: 18,
          width: 180,
          decoration: BoxDecoration(
            color: CoffeeColors.border,
            borderRadius: BorderRadius.circular(CoffeeRadius.small),
          ),
        ),
        const SizedBox(height: CoffeeSpacing.md),
        SizedBox(
          height: 250,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: cardCount,
            separatorBuilder: (_, _) => const SizedBox(width: CoffeeSpacing.sm),
            itemBuilder: (_, _) {
              return Container(
                width: 176,
                decoration: BoxDecoration(
                  color: CoffeeColors.surface,
                  border: Border.all(color: CoffeeColors.border),
                  borderRadius: BorderRadius.circular(CoffeeRadius.card),
                ),
                padding: const EdgeInsets.all(CoffeeSpacing.sm),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AspectRatio(
                      aspectRatio: 1,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: CoffeeColors.surfaceWarm,
                          borderRadius: BorderRadius.circular(
                            CoffeeRadius.control,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: CoffeeSpacing.sm),
                    Container(
                      height: 14,
                      width: 120,
                      color: CoffeeColors.border,
                    ),
                    const SizedBox(height: CoffeeSpacing.xs),
                    Container(
                      height: 14,
                      width: 84,
                      color: CoffeeColors.border,
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class CatalogErrorState extends StatelessWidget {
  const CatalogErrorState({super.key, required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CoffeeSpacing.lg),
        child: Column(
          children: [
            const Icon(
              Icons.cloud_off_outlined,
              size: 40,
              color: CoffeeColors.textSecondary,
            ),
            const SizedBox(height: CoffeeSpacing.sm),
            Text(
              strings.menuLoadFailed,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: CoffeeSpacing.xs),
            Text(
              strings.menuLoadFailedBody,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: CoffeeSpacing.md),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: Text(strings.retry),
            ),
          ],
        ),
      ),
    );
  }
}
