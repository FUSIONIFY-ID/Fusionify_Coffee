import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_strings.dart';
import '../../auth/application/auth_controller.dart';
import '../../catalog/application/catalog_provider.dart';
import '../../shared/presentation/product_card.dart';
import '../application/favorites_provider.dart';
import 'favorites_strings.dart';

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(authControllerProvider).value;
    final strings = context.strings;
    final favoriteStrings = context.favoriteStrings;

    if (profile == null) {
      return Scaffold(
        appBar: AppBar(title: Text(strings.favorites)),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(CoffeeSpacing.xl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.favorite_border,
                  size: 56,
                  color: CoffeeColors.primary,
                ),
                const SizedBox(height: CoffeeSpacing.md),
                Text(
                  favoriteStrings.signInRequired,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: CoffeeSpacing.lg),
                FilledButton(
                  onPressed: () => context.push('/auth/login'),
                  child: Text(strings.login),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final favoriteIds = ref.watch(favoriteProductIdsProvider);
    final catalog = ref.watch(catalogProvider);

    return Scaffold(
      appBar: AppBar(title: Text(strings.favorites)),
      body: favoriteIds.when(
        data: (ids) => catalog.when(
          data: (snapshot) {
            final products = snapshot.products
                .where((product) => ids.contains(product.id))
                .toList(growable: false);

            if (products.isEmpty) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(CoffeeSpacing.xl),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.favorite_border,
                        size: 56,
                        color: CoffeeColors.primary,
                      ),
                      const SizedBox(height: CoffeeSpacing.md),
                      Text(
                        favoriteStrings.emptyTitle,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: CoffeeSpacing.xs),
                      Text(
                        favoriteStrings.emptyBody,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              );
            }

            return GridView.builder(
              padding: const EdgeInsets.all(CoffeeSpacing.md),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: CoffeeSpacing.sm,
                mainAxisSpacing: CoffeeSpacing.sm,
                childAspectRatio: 0.72,
              ),
              itemCount: products.length,
              itemBuilder: (context, index) {
                final product = products[index];
                return ProductCard(
                  product: product,
                  onTap: () => context.push('/product/${product.id}'),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, _) => Center(child: Text(strings.menuLoadFailed)),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => Center(child: Text(favoriteStrings.updateFailed)),
      ),
    );
  }
}
