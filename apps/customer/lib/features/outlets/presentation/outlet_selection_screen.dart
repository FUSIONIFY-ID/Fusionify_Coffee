import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_strings.dart';
import '../../cart/application/cart_controller.dart';
import '../../catalog/application/catalog_provider.dart';
import '../../catalog/domain/catalog_models.dart';
import '../../shared/presentation/catalog_states.dart';
import '../../shared/presentation/media_image.dart';

class OutletSelectionScreen extends ConsumerWidget {
  const OutletSelectionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = context.strings;
    final outlets = ref.watch(outletsProvider);
    final selectedOutletId = ref.watch(selectedOutletIdProvider).value;

    return Scaffold(
      appBar: AppBar(title: Text(strings.chooseOutlet)),
      body: outlets.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(CoffeeSpacing.md),
          child: CatalogLoading(cardCount: 3),
        ),
        error: (_, _) => ListView(
          padding: const EdgeInsets.all(CoffeeSpacing.md),
          children: [
            CatalogErrorState(
              onRetry: () {
                ref.invalidate(outletsProvider);
                ref.invalidate(selectedOutletIdProvider);
              },
            ),
          ],
        ),
        data: (items) => ListView(
          padding: const EdgeInsets.fromLTRB(
            CoffeeSpacing.md,
            CoffeeSpacing.sm,
            CoffeeSpacing.md,
            CoffeeSpacing.xl,
          ),
          children: [
            Text(
              strings.outletSelectionBody,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: CoffeeSpacing.md),
            for (final outlet in items) ...[
              _OutletOption(
                outlet: outlet,
                selected: outlet.id == selectedOutletId,
                onTap: () => _select(context, ref, outlet),
              ),
              const SizedBox(height: CoffeeSpacing.sm),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _select(
    BuildContext context,
    WidgetRef ref,
    Outlet outlet,
  ) async {
    final current = ref.read(selectedOutletIdProvider).value;
    if (current == outlet.id) {
      Navigator.of(context).pop();
      return;
    }

    if (ref.read(cartProvider).isNotEmpty) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text(context.strings.changeOutlet),
          content: Text(context.strings.outletChangeClearsCart),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: Text(context.strings.keepCurrentOutlet),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: Text(context.strings.confirmOutletChange),
            ),
          ],
        ),
      );
      if (confirmed != true) return;
      ref.read(cartProvider.notifier).clear();
    }

    await ref.read(selectedOutletIdProvider.notifier).select(outlet.id);
    ref.invalidate(catalogProvider);
    if (context.mounted) Navigator.of(context).pop();
  }
}

class _OutletOption extends StatelessWidget {
  const _OutletOption({
    required this.outlet,
    required this.selected,
    required this.onTap,
  });

  final Outlet outlet;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(CoffeeSpacing.md),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(CoffeeRadius.control),
                child: SizedBox(
                  width: 84,
                  height: 72,
                  child: MediaImage(
                    mediaUrl: outlet.imageUrl,
                    bundledFallback: 'assets/outlets/preview-store.webp',
                    fit: BoxFit.cover,
                    semanticLabel: outlet.name,
                    placeholderIcon: Icons.store_outlined,
                  ),
                ),
              ),
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
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: CoffeeSpacing.xs),
                    Wrap(
                      spacing: CoffeeSpacing.xs,
                      children: [
                        if (outlet.pickupEnabled)
                          _Capability(label: context.strings.pickup),
                        if (outlet.deliveryEnabled)
                          _Capability(label: context.strings.delivery),
                      ],
                    ),
                  ],
                ),
              ),
              Icon(
                selected ? Icons.check_circle : Icons.chevron_right,
                color: selected
                    ? CoffeeColors.primary
                    : CoffeeColors.textSecondary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Capability extends StatelessWidget {
  const _Capability({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: CoffeeSpacing.xs,
        vertical: CoffeeSpacing.xxs,
      ),
      decoration: BoxDecoration(
        color: CoffeeColors.surfaceBlue,
        borderRadius: BorderRadius.circular(CoffeeRadius.control),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: CoffeeColors.deep,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
