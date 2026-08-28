import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../cart/application/cart_controller.dart';
import '../../catalog/application/catalog_provider.dart';
import '../../catalog/domain/catalog_models.dart';
import '../../shared/presentation/catalog_states.dart';
import '../../shared/presentation/product_card.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartCount = ref.watch(cartItemCountProvider);
    final catalog = ref.watch(catalogProvider);

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () => ref.refresh(catalogProvider.future),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            CoffeeSpacing.md,
            CoffeeSpacing.md,
            CoffeeSpacing.md,
            CoffeeSpacing.xl,
          ),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Fusionify Coffee',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                ),
                IconButton(
                  onPressed: () => context.push('/cart'),
                  tooltip: 'Cart',
                  icon: Badge(
                    isLabelVisible: cartCount > 0,
                    label: Text('$cartCount'),
                    child: const Icon(Icons.shopping_bag_outlined),
                  ),
                ),
              ],
            ),
            const SizedBox(height: CoffeeSpacing.lg),
            Text(
              'Mau ngopi apa hari ini?',
              style: Theme.of(context).textTheme.headlineLarge,
            ),
            const SizedBox(height: CoffeeSpacing.xs),
            Text(
              'Pilih pickup dulu. Delivery menyusul setelah flow pickup stabil.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: CoffeeSpacing.lg),
            catalog.when(
              data: (data) => _CatalogHome(data: data),
              loading: () => const CatalogLoading(),
              error: (_, _) => CatalogErrorState(
                onRetry: () => ref.invalidate(catalogProvider),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CatalogHome extends StatelessWidget {
  const _CatalogHome({required this.data});

  final CatalogSnapshot data;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (data.preview) ...[
          const _PreviewNotice(),
          const SizedBox(height: CoffeeSpacing.md),
        ],
        _OutletCard(outlet: data.outlet),
        const SizedBox(height: CoffeeSpacing.lg),
        Row(
          children: [
            Expanded(
              child: _FulfillmentCard(
                title: 'Pickup',
                subtitle: data.outlet.pickupEnabled
                    ? 'Pesan dari outlet ini'
                    : 'Sedang tidak tersedia',
                icon: Icons.storefront_outlined,
                enabled: data.outlet.pickupEnabled,
                onTap: () => context.go('/menu'),
              ),
            ),
            const SizedBox(width: CoffeeSpacing.sm),
            const Expanded(
              child: _FulfillmentCard(
                title: 'Delivery',
                subtitle: 'Belum diimplementasikan',
                icon: Icons.delivery_dining_outlined,
                enabled: false,
              ),
            ),
          ],
        ),
        const SizedBox(height: CoffeeSpacing.xl),
        Row(
          children: [
            Expanded(
              child: Text(
                'Recommended',
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ),
            TextButton(
              onPressed: () => context.go('/menu'),
              child: const Text('Lihat menu'),
            ),
          ],
        ),
        const SizedBox(height: CoffeeSpacing.sm),
        if (data.products.isEmpty)
          const Text('Belum ada menu yang tersedia.')
        else
          SizedBox(
            height: 286,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: data.products.length,
              separatorBuilder: (_, _) =>
                  const SizedBox(width: CoffeeSpacing.sm),
              itemBuilder: (context, index) {
                final product = data.products[index];
                return SizedBox(
                  width: 184,
                  child: ProductCard(
                    product: product,
                    onTap: () => context.push('/product/${product.id}'),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }
}

class _PreviewNotice extends StatelessWidget {
  const _PreviewNotice();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(CoffeeSpacing.sm),
      decoration: BoxDecoration(
        color: CoffeeColors.surfaceBlue,
        borderRadius: BorderRadius.circular(CoffeeRadius.control),
      ),
      child: const Row(
        children: [
          Icon(Icons.science_outlined, size: 20, color: CoffeeColors.deep),
          SizedBox(width: CoffeeSpacing.xs),
          Expanded(
            child: Text(
              'Preview catalog dari API development. Bukan data production.',
              style: TextStyle(
                color: CoffeeColors.deep,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OutletCard extends StatelessWidget {
  const _OutletCard({required this.outlet});

  final Outlet outlet;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CoffeeSpacing.md),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.store_outlined, color: CoffeeColors.primary),
            const SizedBox(width: CoffeeSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    outlet.name,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  if (outlet.note.isNotEmpty) ...[
                    const SizedBox(height: CoffeeSpacing.xxs),
                    Text(
                      outlet.note,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FulfillmentCard extends StatelessWidget {
  const _FulfillmentCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.enabled,
    this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final bool enabled;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final foreground =
        enabled ? CoffeeColors.textPrimary : CoffeeColors.textSecondary;

    return Card(
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(CoffeeRadius.card),
        child: Padding(
          padding: const EdgeInsets.all(CoffeeSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: enabled ? CoffeeColors.primary : foreground),
              const SizedBox(height: CoffeeSpacing.sm),
              Text(
                title,
                style: TextStyle(
                  color: foreground,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: CoffeeSpacing.xxs),
              Text(
                subtitle,
                style: const TextStyle(color: CoffeeColors.textSecondary),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
