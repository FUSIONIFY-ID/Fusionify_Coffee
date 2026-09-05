import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/formatters/currency.dart';
import '../../../l10n/app_strings.dart';
import '../../auth/application/auth_controller.dart';
import '../../cart/application/cart_controller.dart';
import '../../cart/domain/cart_item.dart';
import '../../catalog/application/catalog_provider.dart';
import '../../catalog/domain/catalog_models.dart';
import '../../favorites/application/favorites_provider.dart';
import '../../favorites/presentation/favorites_strings.dart';
import '../../shared/presentation/catalog_states.dart';
import '../../shared/presentation/product_image.dart';

class ProductDetailScreen extends ConsumerWidget {
  const ProductDetailScreen({super.key, required this.productId});

  final String productId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final catalog = ref.watch(catalogProvider);

    return catalog.when(
      data: (snapshot) {
        Product? product;
        for (final item in snapshot.products) {
          if (item.id == productId) {
            product = item;
            break;
          }
        }

        if (product == null) {
          return Scaffold(
            body: SafeArea(
              child: Center(child: Text(context.strings.productNotFound)),
            ),
          );
        }

        return _ProductDetailContent(product: product);
      },
      loading: () => const Scaffold(
        body: SafeArea(child: Center(child: CircularProgressIndicator())),
      ),
      error: (_, _) => Scaffold(
        appBar: AppBar(),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(CoffeeSpacing.md),
            child: CatalogErrorState(
              onRetry: () => ref.invalidate(catalogProvider),
            ),
          ),
        ),
      ),
    );
  }
}

class _ProductDetailContent extends ConsumerStatefulWidget {
  const _ProductDetailContent({required this.product});

  final Product product;

  @override
  ConsumerState<_ProductDetailContent> createState() =>
      _ProductDetailContentState();
}

class _ProductDetailContentState extends ConsumerState<_ProductDetailContent> {
  late final Map<String, Set<String>> _selection;
  int _quantity = 1;

  @override
  void initState() {
    super.initState();
    _selection = {
      for (final group in widget.product.modifierGroups)
        group.id: {
          for (final option in group.options)
            if (option.isDefault) option.id,
        },
    };

    for (final group in widget.product.modifierGroups) {
      if (group.required &&
          (_selection[group.id]?.isEmpty ?? true) &&
          group.options.isNotEmpty) {
        _selection[group.id] = {group.options.first.id};
      }
    }
  }

  List<ModifierOption> get _selectedOptions {
    final result = <ModifierOption>[];

    for (final group in widget.product.modifierGroups) {
      final selectedIds = _selection[group.id] ?? const <String>{};
      result.addAll(
        group.options.where((option) => selectedIds.contains(option.id)),
      );
    }

    return result;
  }

  int get _unitPrice {
    return widget.product.basePrice +
        _selectedOptions.fold<int>(
          0,
          (total, option) => total + option.priceDelta,
        );
  }

  void _toggleOption(ModifierGroup group, ModifierOption option) {
    setState(() {
      final current = Set<String>.from(_selection[group.id] ?? const {});

      if (group.allowMultiple) {
        if (current.contains(option.id)) {
          current.remove(option.id);
        } else {
          current.add(option.id);
        }
      } else {
        current
          ..clear()
          ..add(option.id);
      }

      _selection[group.id] = current;
    });
  }

  void _addToCart() {
    ref
        .read(cartProvider.notifier)
        .add(
          CartItem.fromProduct(
            product: widget.product,
            selectedOptions: _selectedOptions,
            quantity: _quantity,
          ),
        );

    final strings = context.strings;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(strings.productAddedToCart(widget.product.name)),
        action: SnackBarAction(
          label: strings.view,
          onPressed: () => context.push('/cart'),
        ),
      ),
    );
  }

  Future<void> _toggleFavorite() async {
    final profile = ref.read(authControllerProvider).value;
    if (profile == null) {
      context.push('/auth/login');
      return;
    }

    try {
      await ref
          .read(favoriteProductIdsProvider.notifier)
          .toggle(widget.product.id);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.favoriteStrings.updateFailed)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final product = widget.product;
    final favorites = ref.watch(favoriteProductIdsProvider).value ?? <String>{};
    final isFavorite = favorites.contains(product.id);

    return Scaffold(
      appBar: AppBar(
        title: Text(product.name),
        actions: [
          IconButton(
            onPressed: _toggleFavorite,
            tooltip: strings.favorites,
            icon: Icon(
              isFavorite ? Icons.favorite : Icons.favorite_border,
              color: isFavorite ? CoffeeColors.error : null,
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          CoffeeSpacing.md,
          0,
          CoffeeSpacing.md,
          120,
        ),
        children: [
          AspectRatio(
            aspectRatio: 1.35,
            child: ProductImage(
              product: product,
              padding: const EdgeInsets.all(CoffeeSpacing.md),
            ),
          ),
          const SizedBox(height: CoffeeSpacing.lg),
          Text(product.name, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: CoffeeSpacing.xs),
          Text(product.description),
          const SizedBox(height: CoffeeSpacing.xs),
          Text(
            formatRupiah(product.basePrice),
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: CoffeeSpacing.xl),
          for (final group in product.modifierGroups) ...[
            _ModifierSection(
              group: group,
              selectedIds: _selection[group.id] ?? const {},
              onSelected: (option) => _toggleOption(group, option),
            ),
            const SizedBox(height: CoffeeSpacing.lg),
          ],
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.all(CoffeeSpacing.md),
          decoration: const BoxDecoration(
            color: CoffeeColors.surface,
            border: Border(top: BorderSide(color: CoffeeColors.border)),
          ),
          child: Row(
            children: [
              _QuantityControl(
                quantity: _quantity,
                onDecrease: _quantity > 1
                    ? () => setState(() => _quantity--)
                    : null,
                onIncrease: () => setState(() => _quantity++),
              ),
              const SizedBox(width: CoffeeSpacing.sm),
              Expanded(
                child: FilledButton(
                  onPressed: _addToCart,
                  child: Text(
                    '${strings.addToCart} · ${formatRupiah(_unitPrice * _quantity)}',
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ModifierSection extends StatelessWidget {
  const _ModifierSection({
    required this.group,
    required this.selectedIds,
    required this.onSelected,
  });

  final ModifierGroup group;
  final Set<String> selectedIds;
  final ValueChanged<ModifierOption> onSelected;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(group.label, style: Theme.of(context).textTheme.titleMedium),
            if (group.required)
              const Text(
                ' *',
                style: TextStyle(
                  color: CoffeeColors.error,
                  fontWeight: FontWeight.w700,
                ),
              ),
          ],
        ),
        const SizedBox(height: CoffeeSpacing.sm),
        Wrap(
          spacing: CoffeeSpacing.xs,
          runSpacing: CoffeeSpacing.xs,
          children: [
            for (final option in group.options)
              FilterChip(
                selected: selectedIds.contains(option.id),
                onSelected: (_) => onSelected(option),
                label: Text(
                  option.priceDelta == 0
                      ? option.label
                      : '${option.label} +${formatRupiah(option.priceDelta)}',
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _QuantityControl extends StatelessWidget {
  const _QuantityControl({
    required this.quantity,
    required this.onDecrease,
    required this.onIncrease,
  });

  final int quantity;
  final VoidCallback? onDecrease;
  final VoidCallback onIncrease;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      decoration: BoxDecoration(
        border: Border.all(color: CoffeeColors.border),
        borderRadius: BorderRadius.circular(CoffeeRadius.control),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(onPressed: onDecrease, icon: const Icon(Icons.remove)),
          Text(
            '$quantity',
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          IconButton(onPressed: onIncrease, icon: const Icon(Icons.add)),
        ],
      ),
    );
  }
}
