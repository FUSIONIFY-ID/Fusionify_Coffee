import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../cart/application/cart_controller.dart';
import '../../catalog/data/demo_catalog.dart';
import '../../shared/presentation/product_card.dart';

class MenuScreen extends ConsumerStatefulWidget {
  const MenuScreen({super.key});

  @override
  ConsumerState<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends ConsumerState<MenuScreen> {
  String _category = 'All';

  @override
  Widget build(BuildContext context) {
    final cartCount = ref.watch(cartItemCountProvider);
    final categories = <String>{
      'All',
      ...demoProducts.map((product) => product.category),
    }.toList();

    final visibleProducts = _category == 'All'
        ? demoProducts
        : demoProducts
              .where((product) => product.category == _category)
              .toList();

    return SafeArea(
      child: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(
              CoffeeSpacing.md,
              CoffeeSpacing.md,
              CoffeeSpacing.md,
              CoffeeSpacing.sm,
            ),
            sliver: SliverToBoxAdapter(
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Order Coffee',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ),
                  IconButton(
                    tooltip: 'Cart',
                    onPressed: () => context.push('/cart'),
                    icon: Badge(
                      isLabelVisible: cartCount > 0,
                      label: Text('$cartCount'),
                      child: const Icon(Icons.shopping_bag_outlined),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 48,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(
                  horizontal: CoffeeSpacing.md,
                ),
                scrollDirection: Axis.horizontal,
                itemCount: categories.length,
                separatorBuilder: (_, _) =>
                    const SizedBox(width: CoffeeSpacing.xs),
                itemBuilder: (context, index) {
                  final category = categories[index];
                  return ChoiceChip(
                    label: Text(category),
                    selected: category == _category,
                    onSelected: (_) => setState(() => _category = category),
                  );
                },
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(CoffeeSpacing.md),
            sliver: SliverGrid(
              delegate: SliverChildBuilderDelegate((context, index) {
                final product = visibleProducts[index];
                return ProductCard(
                  product: product,
                  onTap: () => context.push('/product/${product.id}'),
                );
              }, childCount: visibleProducts.length),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: CoffeeSpacing.sm,
                crossAxisSpacing: CoffeeSpacing.sm,
                childAspectRatio: 0.64,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
