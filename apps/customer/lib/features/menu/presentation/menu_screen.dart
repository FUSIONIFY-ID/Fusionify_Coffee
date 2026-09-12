import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_strings.dart';
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
  String _categoryId = 'all';
  String _query = '';
  late final TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final cartCount = ref.watch(cartItemCountProvider);
    final catalog = ref.watch(catalogProvider);
    final selectedOutlet = catalog.value?.outlet;

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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        strings.orderCoffee,
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      if (selectedOutlet != null)
                        TextButton.icon(
                          onPressed: () => context.push('/outlets'),
                          style: TextButton.styleFrom(
                            padding: EdgeInsets.zero,
                            minimumSize: const Size(0, 48),
                          ),
                          icon: const Icon(Icons.storefront_outlined, size: 18),
                          label: Text(
                            selectedOutlet.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: cartCount > 0
                      ? strings.cartWithItems(cartCount)
                      : strings.cart,
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
          Padding(
            padding: const EdgeInsets.fromLTRB(
              CoffeeSpacing.md,
              0,
              CoffeeSpacing.md,
              CoffeeSpacing.sm,
            ),
            child: SearchBar(
              controller: _searchController,
              hintText: strings.menuSearchHint,
              leading: const Icon(Icons.search),
              trailing: [
                if (_query.isNotEmpty)
                  IconButton(
                    tooltip: strings.remove,
                    onPressed: () {
                      _searchController.clear();
                      setState(() => _query = '');
                    },
                    icon: const Icon(Icons.close),
                  ),
              ],
              onChanged: (value) => setState(() => _query = value),
            ),
          ),
          Expanded(
            child: catalog.when(
              data: (data) => _MenuContent(
                snapshot: data,
                selectedCategoryId: _categoryId,
                searchQuery: _query,
                onCategoryChanged: (categoryId) {
                  setState(() => _categoryId = categoryId);
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
    required this.selectedCategoryId,
    required this.searchQuery,
    required this.onCategoryChanged,
  });

  final CatalogSnapshot snapshot;
  final String selectedCategoryId;
  final String searchQuery;
  final ValueChanged<String> onCategoryChanged;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final categoryNames = <String, String>{
      for (final product in snapshot.products)
        product.categoryId: product.category,
    };
    final categories = [
      (id: 'all', name: strings.all),
      for (final entry in categoryNames.entries)
        (id: entry.key, name: entry.value),
    ];

    final activeCategoryId =
        categories.any((category) => category.id == selectedCategoryId)
        ? selectedCategoryId
        : 'all';

    final categoryProducts = activeCategoryId == 'all'
        ? snapshot.products
        : snapshot.products
              .where((product) => product.categoryId == activeCategoryId)
              .toList(growable: false);
    final normalizedQuery = searchQuery.trim().toLowerCase();
    final visibleProducts = normalizedQuery.isEmpty
        ? categoryProducts
        : categoryProducts
              .where(
                (product) =>
                    product.name.toLowerCase().contains(normalizedQuery) ||
                    product.description.toLowerCase().contains(
                      normalizedQuery,
                    ) ||
                    product.category.toLowerCase().contains(normalizedQuery),
              )
              .toList(growable: false);

    return CustomScrollView(
      slivers: [
        if (snapshot.preview)
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(
              CoffeeSpacing.md,
              CoffeeSpacing.xs,
              CoffeeSpacing.md,
              CoffeeSpacing.sm,
            ),
            sliver: SliverToBoxAdapter(
              child: Text(
                strings.developmentPreviewCatalog,
                style: const TextStyle(
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
                  label: Text(category.name),
                  selected: category.id == activeCategoryId,
                  onSelected: (_) => onCategoryChanged(category.id),
                );
              },
            ),
          ),
        ),
        if (visibleProducts.isEmpty)
          SliverPadding(
            padding: const EdgeInsets.all(CoffeeSpacing.xl),
            sliver: SliverToBoxAdapter(
              child: Column(
                children: [
                  Image.asset(
                    'assets/illustrations/empty-cup.webp',
                    height: 180,
                    fit: BoxFit.contain,
                    excludeFromSemantics: true,
                  ),
                  const SizedBox(height: CoffeeSpacing.md),
                  Text(
                    normalizedQuery.isEmpty
                        ? strings.noMenuAvailable
                        : strings.noSearchResults,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          )
        else
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
