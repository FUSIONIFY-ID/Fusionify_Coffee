import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../cart/application/cart_controller.dart';
import '../../catalog/data/demo_catalog.dart';
import '../../shared/presentation/product_card.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartCount = ref.watch(cartItemCountProvider);

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(CoffeeSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
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
            if (kDebugMode) ...[
              const SizedBox(height: CoffeeSpacing.sm),
              const _PreviewNotice(),
            ],
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
            const _OutletCard(),
            const SizedBox(height: CoffeeSpacing.lg),
            Row(
              children: [
                Expanded(
                  child: _FulfillmentCard(
                    title: 'Pickup',
                    subtitle: 'Aktif untuk Milestone 0.1',
                    icon: Icons.storefront_outlined,
                    enabled: true,
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
            SizedBox(
              height: 286,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: demoProducts.length,
                separatorBuilder: (_, _) =>
                    const SizedBox(width: CoffeeSpacing.sm),
                itemBuilder: (context, index) {
                  final product = demoProducts[index];
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
        ),
      ),
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
        color: const Color(0xFFE8F2FD),
        borderRadius: BorderRadius.circular(CoffeeRadius.control),
      ),
      child: const Row(
        children: [
          Icon(Icons.science_outlined, size: 20, color: CoffeeColors.deep),
          SizedBox(width: CoffeeSpacing.xs),
          Expanded(
            child: Text(
              'Preview catalog data. Belum terhubung ke production backend.',
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
  const _OutletCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(CoffeeSpacing.md),
      decoration: BoxDecoration(
        color: CoffeeColors.surface,
        border: Border.all(color: CoffeeColors.border),
        borderRadius: BorderRadius.circular(CoffeeRadius.card),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.store_outlined, color: CoffeeColors.primary),
          SizedBox(width: CoffeeSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  previewOutlet.name,
                  style: TextStyle(
                    color: CoffeeColors.textPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                SizedBox(height: CoffeeSpacing.xxs),
                Text(
                  previewOutlet.note,
                  style: TextStyle(color: CoffeeColors.textSecondary),
                ),
              ],
            ),
          ),
        ],
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

    return Material(
      color: CoffeeColors.surface,
      borderRadius: BorderRadius.circular(CoffeeRadius.card),
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(CoffeeRadius.card),
        child: Container(
          padding: const EdgeInsets.all(CoffeeSpacing.md),
          decoration: BoxDecoration(
            border: Border.all(color: CoffeeColors.border),
            borderRadius: BorderRadius.circular(CoffeeRadius.card),
          ),
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
