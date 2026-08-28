import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../cart/application/cart_controller.dart';
import '../../catalog/application/catalog_provider.dart';
import '../../catalog/domain/catalog_models.dart';
import '../../shared/presentation/catalog_states.dart';
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
    final catalog = ref.watch(catalogProvider);

    return SafeArea(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              CoffeeSpacing.md,
              CoffeeSpacing.md,
              CoffeeSpacing.md,
              CoffeeSpacing.sm,
            ),
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
          Expanded(
            child: catalog.when(
              data: (data) => _MenuContent(
                snapshot: data,
                selectedCategory: _category,
                onCategoryChanged: (category) {
                  setState(() => _category = category);
                },
              ),
              loading: () => const Padding(
                padding: EdgeInsets.all(CoffeeSpacing.md),
                child: CatalogLoading(cardCount: 2),
              ),
              error: (_, _) => ListView(
                padding: const EdgeInsets.all(CoffeeSpacing.md),
                children: [
                  CatalogErrorState(
                    onRetry: () => ref.invalidate(catalogProvider),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuContent extends StatelessWidget {
  const _MenuContent({
    required this.snapshot,
    required this.selectedCategory,
    required this.onCategoryChanged,
  });

  final CatalogSnapshot snapshot;
  final String selectedCategory;
  final ValueChanged<String> onCategoryChanged;

  @override
  Widget build(BuildContext context) {
    final categories = <String>{
      'All',
      ...snapshot.products.map((product) => product.category),
    }.toList();

    final activeCategory = categories.contains(selectedCategory)
        ? selectedCategory
        : 'All';

    final visibleProducts = activeCategory == 'All'
        ? snapshot.products
        : snapshot.products
              .where((product) => product.category == activeCategory)
              .toList(growable: false);

    return CustomScrollView(
      slivers: [
        if (snapshot.preview)
          const SliverPadding(
            padding: EdgeInsets.fromLTRB(
              CoffeeSpacing.md,
              CoffeeSpacing.xs,
              CoffeeSpacing.md,
              CoffeeSpacing.sm,
            ),
            sliver: SliverToBoxAdapter(
              child: Text(
                'Development preview catalog',
                style: TextStyle(
                  color: CoffeeColors.deep,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        SliverToBoxAdapter(
          child: SizedBox(
            height: 48,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: CoffeeSpacing.md),
              scrollDirection: Axis.horizontal,
              itemCount: categories.length,
              separatorBuilder: (_, _) =>
                  const SizedBox(width: CoffeeSpacing.xs),
              itemBuilder: (context, index) {
                final category = categories[index];
                return ChoiceChip(
                  label: Text(category),
                  selected: category == activeCategory,
                  onSelected: (_) => onCategoryChanged(category),
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
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 220,
              mainAxisSpacing: CoffeeSpacing.sm,
              crossAxisSpacing: CoffeeSpacing.sm,
              childAspectRatio: 0.64,
            ),
          ),
        ),
      ],
    );
  }
}
