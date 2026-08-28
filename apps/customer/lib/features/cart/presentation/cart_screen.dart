import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/formatters/currency.dart';
import '../../../l10n/app_strings.dart';
import '../../catalog/application/catalog_provider.dart';
import '../application/cart_controller.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = context.strings;
    final items = ref.watch(cartProvider);
    final subtotal = ref.watch(cartSubtotalProvider);
    final catalog = ref.watch(catalogProvider).value;

    return Scaffold(
      appBar: AppBar(title: Text(strings.cart)),
      body: items.isEmpty
          ? const _EmptyCart()
          : ListView.separated(
              padding: const EdgeInsets.all(CoffeeSpacing.md),
              itemCount: items.length,
              separatorBuilder: (_, _) => const Divider(height: 32),
              itemBuilder: (context, index) {
                final item = items[index];
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.local_cafe_outlined),
                        const SizedBox(width: CoffeeSpacing.sm),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.displayProductName(catalog),
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const SizedBox(height: CoffeeSpacing.xxs),
                              Text(
                                item.displayOptionLabels(catalog).join(' · '),
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                              const SizedBox(height: CoffeeSpacing.xs),
                              Text(
                                formatRupiah(item.lineTotal),
                                style: const TextStyle(
                                  color: CoffeeColors.textPrimary,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          tooltip: strings.remove,
                          onPressed: () => ref
                              .read(cartProvider.notifier)
                              .remove(item.signature),
                          icon: const Icon(Icons.delete_outline),
                        ),
                      ],
                    ),
                    const SizedBox(height: CoffeeSpacing.sm),
                    Row(
                      children: [
                        IconButton.outlined(
                          onPressed: () => ref
                              .read(cartProvider.notifier)
                              .decrement(item.signature),
                          icon: const Icon(Icons.remove),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: CoffeeSpacing.sm,
                          ),
                          child: Text(
                            '${item.quantity}',
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                        IconButton.outlined(
                          onPressed: () => ref
                              .read(cartProvider.notifier)
                              .increment(item.signature),
                          icon: const Icon(Icons.add),
                        ),
                      ],
                    ),
                  ],
                );
              },
            ),
      bottomNavigationBar: items.isEmpty
          ? null
          : SafeArea(
              top: false,
              child: Container(
                padding: const EdgeInsets.all(CoffeeSpacing.md),
                decoration: const BoxDecoration(
                  color: CoffeeColors.surface,
                  border: Border(top: BorderSide(color: CoffeeColors.border)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Expanded(child: Text(strings.estimatedSubtotal)),
                        Text(
                          formatRupiah(subtotal),
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                    const SizedBox(height: CoffeeSpacing.sm),
                    FilledButton(
                      onPressed: () => context.push('/checkout'),
                      child: Text(strings.checkout),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}

class _EmptyCart extends StatelessWidget {
  const _EmptyCart();

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(CoffeeSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.shopping_bag_outlined,
              size: 56,
              color: CoffeeColors.textSecondary,
            ),
            const SizedBox(height: CoffeeSpacing.md),
            Text(
              strings.emptyCartTitle,
              style: const TextStyle(
                color: CoffeeColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: CoffeeSpacing.xs),
            Text(
              strings.emptyCartBody,
              textAlign: TextAlign.center,
              style: const TextStyle(color: CoffeeColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}
