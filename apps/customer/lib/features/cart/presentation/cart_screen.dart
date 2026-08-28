import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/formatters/currency.dart';
import '../application/cart_controller.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(cartProvider);
    final subtotal = ref.watch(cartSubtotalProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Cart')),
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
                                item.productName,
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const SizedBox(height: CoffeeSpacing.xxs),
                              Text(
                                item.selectedOptions
                                    .map((option) => option.label)
                                    .join(' · '),
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
                          tooltip: 'Remove',
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
                        const Expanded(child: Text('Estimated subtotal')),
                        Text(
                          formatRupiah(subtotal),
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                    const SizedBox(height: CoffeeSpacing.sm),
                    FilledButton(
                      onPressed: () => context.push('/checkout'),
                      child: const Text('Checkout'),
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
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(CoffeeSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.shopping_bag_outlined,
              size: 56,
              color: CoffeeColors.textSecondary,
            ),
            SizedBox(height: CoffeeSpacing.md),
            Text(
              'Cart masih kosong.',
              style: TextStyle(
                color: CoffeeColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            SizedBox(height: CoffeeSpacing.xs),
            Text(
              'Pilih kopi dan custom sesuai selera kamu.',
              textAlign: TextAlign.center,
              style: TextStyle(color: CoffeeColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}
