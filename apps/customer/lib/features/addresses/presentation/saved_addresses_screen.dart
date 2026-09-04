import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../l10n/delivery_strings.dart';
import '../../auth/application/auth_controller.dart';
import '../application/addresses_provider.dart';
import '../domain/address_models.dart';

class SavedAddressesScreen extends ConsumerWidget {
  const SavedAddressesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = context.strings;
    final profile = ref.watch(authControllerProvider).value;

    if (profile == null) {
      return Scaffold(
        appBar: AppBar(title: Text(strings.savedAddresses)),
        body: const Center(child: Icon(Icons.lock_person_outlined)),
      );
    }

    final addresses = ref.watch(savedAddressesProvider);

    return Scaffold(
      appBar: AppBar(title: Text(strings.savedAddresses)),
      body: addresses.when(
        data: (items) {
          if (items.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(CoffeeSpacing.xl),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.location_on_outlined,
                      size: 56,
                      color: CoffeeColors.primary,
                    ),
                    const SizedBox(height: CoffeeSpacing.md),
                    Text(strings.addressesEmpty),
                    const SizedBox(height: CoffeeSpacing.lg),
                    FilledButton.icon(
                      onPressed: () => context.push('/account/addresses/new'),
                      icon: const Icon(Icons.add_location_alt_outlined),
                      label: Text(strings.addAddress),
                    ),
                  ],
                ),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(savedAddressesProvider);
              await ref.read(savedAddressesProvider.future);
            },
            child: ListView.separated(
              padding: const EdgeInsets.all(CoffeeSpacing.md),
              itemCount: items.length,
              separatorBuilder: (_, _) =>
                  const SizedBox(height: CoffeeSpacing.sm),
              itemBuilder: (context, index) => _AddressCard(
                address: items[index],
                onEdit: () => context.push(
                  '/account/addresses/${items[index].id}',
                  extra: items[index],
                ),
                onDelete: () async {
                  await ref
                      .read(addressesRepositoryProvider)
                      .remove(items[index].id);
                  ref.invalidate(savedAddressesProvider);
                },
              ),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => Center(child: Text(strings.addressesLoadFailed)),
      ),
      floatingActionButton: addresses.value?.isNotEmpty == true
          ? FloatingActionButton.extended(
              onPressed: () => context.push('/account/addresses/new'),
              icon: const Icon(Icons.add),
              label: Text(strings.addAddress),
            )
          : null,
    );
  }
}

class _AddressCard extends StatelessWidget {
  const _AddressCard({
    required this.address,
    required this.onEdit,
    required this.onDelete,
  });

  final SavedAddress address;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CoffeeSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    address.label,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                if (address.isDefault)
                  Chip(
                    label: Text(strings.defaultAddress),
                    visualDensity: VisualDensity.compact,
                  ),
              ],
            ),
            const SizedBox(height: CoffeeSpacing.xs),
            Text(address.recipientName),
            Text(address.compactAddress),
            if (address.deliveryNotes?.trim().isNotEmpty == true) ...[
              const SizedBox(height: CoffeeSpacing.xs),
              Text(
                address.deliveryNotes!,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            const SizedBox(height: CoffeeSpacing.sm),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(onPressed: onEdit, child: Text(strings.editAddress)),
                TextButton(
                  onPressed: onDelete,
                  style: TextButton.styleFrom(
                    foregroundColor: Theme.of(context).colorScheme.error,
                  ),
                  child: Text(strings.remove),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
