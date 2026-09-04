import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/formatters/currency.dart';
import '../../../core/utils/idempotency_key.dart';
import '../../../l10n/app_strings.dart';
import '../../../l10n/delivery_strings.dart';
import '../../../l10n/reward_extras_strings.dart';
import '../../addresses/application/addresses_provider.dart';
import '../../addresses/domain/address_models.dart';
import '../../auth/application/auth_controller.dart';
import '../../cart/application/cart_controller.dart';
import '../../cart/domain/cart_item.dart';
import '../../catalog/application/catalog_provider.dart';
import '../../catalog/domain/catalog_models.dart';
import '../../orders/application/orders_provider.dart';
import '../../rewards/application/reward_extras_provider.dart';
import '../../rewards/application/rewards_provider.dart';
import '../../rewards/domain/reward_extras_models.dart';
import '../application/checkout_provider.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  late final String _checkoutKey;
  late final String _paymentKey;
  String _fulfillmentType = 'PICKUP';
  DateTime? _scheduledFor;
  String? _selectedAddressId;
  String? _selectedVoucherId;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _checkoutKey = createIdempotencyKey('checkout');
    _paymentKey = createIdempotencyKey('payment');
  }

  Future<void> _placeOrder() async {
    if (_submitting) return;

    final items = ref.read(cartProvider);
    final catalog = ref.read(catalogProvider).value;
    if (items.isEmpty || catalog == null) return;

    if (_fulfillmentType == 'DELIVERY') {
      final addressId = _selectedAddressId;
      if (addressId == null) {
        setState(() => _error = context.strings.deliveryAddressRequired);
        return;
      }
      try {
        final quote = await ref.read(
          deliveryQuoteProvider((
            addressId: addressId,
            outletId: catalog.outlet.id,
          )).future,
        );
        if (!quote.serviceable) {
          if (mounted) {
            setState(
              () => _error = context.strings.deliveryUnavailableForAddress,
            );
          }
          return;
        }
      } catch (_) {
        if (mounted) {
          setState(() => _error = context.strings.deliveryQuoteFailed);
        }
        return;
      }
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final repository = ref.read(checkoutRepositoryProvider);
      final order = await repository.createOrder(
        outletId: catalog.outlet.id,
        items: items,
        idempotencyKey: _checkoutKey,
        fulfillmentType: _fulfillmentType,
        scheduledFor: _fulfillmentType == 'PICKUP' ? _scheduledFor : null,
        savedAddressId: _fulfillmentType == 'DELIVERY'
            ? _selectedAddressId
            : null,
        customerVoucherId: _selectedVoucherId,
      );

      ref.invalidate(voucherWalletProvider);
      ref.invalidate(rewardsSummaryProvider);
      ref.invalidate(orderHistoryProvider);

      if (!order.requiresPayment) {
        ref.read(cartProvider.notifier).clear();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(context.strings.freeOrderConfirmed)),
          );
          context.go('/orders/${order.id}');
        }
        return;
      }

      final payment = await repository.createPayment(
        orderId: order.id,
        idempotencyKey: _paymentKey,
      );

      if (mounted) context.go('/payment/${payment.id}');
    } on DioException catch (error) {
      if (mounted) {
        setState(() => _error = _messageFromDio(error, context.strings));
      }
    } catch (_) {
      if (mounted) {
        setState(() => _error = context.strings.checkoutProcessingFailed);
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _pickSchedule() async {
    final now = DateTime.now();
    final earliest = now.add(const Duration(minutes: 15));
    final latest = now.add(const Duration(days: 7));
    final initial = _scheduledFor ?? earliest.add(const Duration(minutes: 15));

    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: latest,
    );
    if (date == null || !mounted) return;

    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time == null) return;

    final selected = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );
    if (selected.isBefore(earliest) || selected.isAfter(latest)) {
      setState(() => _error = context.strings.scheduleWindowHelp);
      return;
    }

    setState(() {
      _scheduledFor = selected;
      _error = null;
    });
  }

  String _messageFromDio(DioException error, AppStrings strings) {
    if (error.response?.statusCode == 503) {
      return strings.paymentProviderNotConfigured;
    }
    if (_selectedVoucherId != null &&
        (error.response?.statusCode == 400 ||
            error.response?.statusCode == 409)) {
      return strings.voucherRejected;
    }
    return strings.checkoutServerUnavailable;
  }

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final items = ref.watch(cartProvider);
    final localSubtotal = ref.watch(cartSubtotalProvider);
    final catalog = ref.watch(catalogProvider);
    final profile = ref.watch(authControllerProvider).value;

    if (profile == null) {
      return Scaffold(
        appBar: AppBar(title: Text(strings.checkout)),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(CoffeeSpacing.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.lock_person_outlined,
                  size: 52,
                  color: CoffeeColors.primary,
                ),
                const SizedBox(height: CoffeeSpacing.md),
                Text(
                  strings.signInBeforeCheckout,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: CoffeeSpacing.xs),
                Text(
                  strings.checkoutAccountReason,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: CoffeeSpacing.lg),
                FilledButton(
                  onPressed: () => context.push('/auth/login'),
                  child: Text(strings.login),
                ),
                const SizedBox(height: CoffeeSpacing.sm),
                OutlinedButton(
                  onPressed: () => context.push('/auth/register'),
                  child: Text(strings.createAccount),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final vouchers = ref.watch(voucherWalletProvider);

    return Scaffold(
      appBar: AppBar(title: Text(strings.checkout)),
      body: catalog.when(
        data: (snapshot) => ListView(
          padding: const EdgeInsets.all(CoffeeSpacing.md),
          children: [
            Text(
              strings.fulfillmentMethod,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: CoffeeSpacing.sm),
            SegmentedButton<String>(
              segments: [
                ButtonSegment(
                  value: 'PICKUP',
                  icon: const Icon(Icons.storefront_outlined),
                  label: Text(strings.pickup),
                  enabled: snapshot.outlet.pickupEnabled,
                ),
                ButtonSegment(
                  value: 'DELIVERY',
                  icon: const Icon(Icons.delivery_dining_outlined),
                  label: Text(strings.delivery),
                  enabled: snapshot.outlet.deliveryEnabled,
                ),
              ],
              selected: {_fulfillmentType},
              onSelectionChanged: (selection) {
                setState(() {
                  _fulfillmentType = selection.first;
                  _error = null;
                  if (_fulfillmentType == 'DELIVERY') _scheduledFor = null;
                });
              },
            ),
            const SizedBox(height: CoffeeSpacing.md),
            if (_fulfillmentType == 'PICKUP')
              _PickupOptions(
                outletName: snapshot.outlet.name,
                scheduledFor: _scheduledFor,
                onAsap: () => setState(() => _scheduledFor = null),
                onSchedule: _pickSchedule,
              )
            else
              _DeliveryOptions(
                outletId: snapshot.outlet.id,
                selectedAddressId: _selectedAddressId,
                onSelected: (value) {
                  setState(() {
                    _selectedAddressId = value;
                    _error = null;
                  });
                },
              ),
            const SizedBox(height: CoffeeSpacing.lg),
            Text(
              strings.orderSummary,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: CoffeeSpacing.sm),
            for (final item in items) ...[
              _OrderLine(item: item, catalog: snapshot),
              const Divider(height: CoffeeSpacing.lg),
            ],
            _CheckoutTotals(
              subtotal: localSubtotal,
              currency: snapshot.outlet.currency,
              fulfillmentType: _fulfillmentType,
              selectedAddressId: _selectedAddressId,
              outletId: snapshot.outlet.id,
            ),
            const SizedBox(height: CoffeeSpacing.lg),
            Text(
              strings.chooseVoucher,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: CoffeeSpacing.sm),
            vouchers.when(
              data: (entries) {
                final eligible = entries.where((entry) {
                  final voucher = entry.voucher;
                  return entry.usable &&
                      voucher.minimumSpend <= localSubtotal &&
                      (voucher.outletId == null ||
                          voucher.outletId == snapshot.outlet.id);
                }).toList();
                final selectedStillEligible = eligible.any(
                  (entry) => entry.id == _selectedVoucherId,
                );
                if (!selectedStillEligible && _selectedVoucherId != null) {
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (mounted) setState(() => _selectedVoucherId = null);
                  });
                }
                return _VoucherSelector(
                  entries: eligible,
                  selectedId: _selectedVoucherId,
                  onSelected: (value) {
                    setState(() {
                      _selectedVoucherId = value;
                      _error = null;
                    });
                  },
                );
              },
              loading: () => const LinearProgressIndicator(),
              error: (_, _) => Text(strings.vouchersLoadFailed),
            ),
            const SizedBox(height: CoffeeSpacing.xs),
            Text(
              strings.voucherServerValidation,
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: CoffeeSpacing.md),
            Container(
              padding: const EdgeInsets.all(CoffeeSpacing.sm),
              decoration: BoxDecoration(
                color: CoffeeColors.surfaceBlue,
                borderRadius: BorderRadius.circular(CoffeeRadius.control),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.verified_user_outlined,
                    size: 20,
                    color: CoffeeColors.deep,
                  ),
                  const SizedBox(width: CoffeeSpacing.xs),
                  Expanded(
                    child: Text(
                      strings.serverPriceNotice,
                      style: const TextStyle(
                        color: CoffeeColors.deep,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: CoffeeSpacing.md),
              Text(
                _error!,
                style: const TextStyle(
                  color: CoffeeColors.error,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(CoffeeSpacing.lg),
            child: Text(strings.checkoutLoadFailed),
          ),
        ),
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
                child: FilledButton.icon(
                  onPressed: _submitting ? null : _placeOrder,
                  icon: _submitting
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.qr_code_2),
                  label: Text(
                    _submitting
                        ? strings.preparingPayment
                        : strings.continueToQris,
                  ),
                ),
              ),
            ),
    );
  }
}

class _PickupOptions extends StatelessWidget {
  const _PickupOptions({
    required this.outletName,
    required this.scheduledFor,
    required this.onAsap,
    required this.onSchedule,
  });

  final String outletName;
  final DateTime? scheduledFor;
  final VoidCallback onAsap;
  final VoidCallback onSchedule;

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
                const Icon(
                  Icons.storefront_outlined,
                  color: CoffeeColors.primary,
                ),
                const SizedBox(width: CoffeeSpacing.sm),
                Expanded(
                  child: Text(
                    outletName,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
              ],
            ),
            const SizedBox(height: CoffeeSpacing.sm),
            ListTile(
              contentPadding: EdgeInsets.zero,
              onTap: onAsap,
              leading: Icon(
                scheduledFor == null
                    ? Icons.check_circle
                    : Icons.circle_outlined,
                color: CoffeeColors.primary,
              ),
              title: Text(strings.pickupNow),
              subtitle: Text(strings.pickupReadyInstruction),
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              onTap: onSchedule,
              leading: Icon(
                scheduledFor != null
                    ? Icons.check_circle
                    : Icons.circle_outlined,
                color: CoffeeColors.primary,
              ),
              title: Text(strings.scheduledPickup),
              subtitle: Text(
                scheduledFor == null
                    ? strings.scheduleWindowHelp
                    : strings.scheduledForLabel(_formatDateTime(scheduledFor!)),
              ),
              trailing: const Icon(Icons.schedule_outlined),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDateTime(DateTime value) {
    final local = value.toLocal();
    final day = local.day.toString().padLeft(2, '0');
    final month = local.month.toString().padLeft(2, '0');
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '$day/$month/${local.year} $hour:$minute';
  }
}

class _DeliveryOptions extends ConsumerWidget {
  const _DeliveryOptions({
    required this.outletId,
    required this.selectedAddressId,
    required this.onSelected,
  });

  final String outletId;
  final String? selectedAddressId;
  final ValueChanged<String?> onSelected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = context.strings;
    final addresses = ref.watch(savedAddressesProvider);

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
                    strings.chooseDeliveryAddress,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                TextButton.icon(
                  onPressed: () => context.push('/account/addresses/new'),
                  icon: const Icon(Icons.add_location_alt_outlined),
                  label: Text(strings.addAddress),
                ),
              ],
            ),
            addresses.when(
              data: (items) {
                if (items.isEmpty) return Text(strings.addressesEmpty);
                if (selectedAddressId == null) {
                  final preferred =
                      items.where((item) => item.isDefault).firstOrNull ??
                      items.first;
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    onSelected(preferred.id);
                  });
                }
                return Column(
                  children: [
                    for (final address in items)
                      RadioListTile<String>(
                        value: address.id,
                        groupValue: selectedAddressId,
                        contentPadding: EdgeInsets.zero,
                        title: Text(address.label),
                        subtitle: Text(address.compactAddress),
                        onChanged: onSelected,
                      ),
                    if (selectedAddressId != null)
                      _DeliveryQuoteView(
                        addressId: selectedAddressId!,
                        outletId: outletId,
                      ),
                  ],
                );
              },
              loading: () => const LinearProgressIndicator(),
              error: (_, _) => Text(strings.addressesLoadFailed),
            ),
          ],
        ),
      ),
    );
  }
}

class _DeliveryQuoteView extends ConsumerWidget {
  const _DeliveryQuoteView({required this.addressId, required this.outletId});

  final String addressId;
  final String outletId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = context.strings;
    final quote = ref.watch(
      deliveryQuoteProvider((addressId: addressId, outletId: outletId)),
    );
    return quote.when(
      data: (value) => ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Icon(
          value.serviceable ? Icons.check_circle : Icons.location_off_outlined,
          color: value.serviceable ? CoffeeColors.success : CoffeeColors.error,
        ),
        title: Text(
          value.serviceable
              ? strings.deliveryAvailable
              : value.reason == 'delivery_not_configured'
              ? strings.deliveryNotConfigured
              : strings.deliveryOutsideArea,
        ),
        subtitle: value.serviceable && value.fee != null
            ? Text(
                '${strings.deliveryFee}: ${_money(value.currency ?? 'IDR', value.fee!)}',
              )
            : null,
      ),
      loading: () => const LinearProgressIndicator(),
      error: (_, _) => Text(strings.deliveryQuoteFailed),
    );
  }
}

class _CheckoutTotals extends ConsumerWidget {
  const _CheckoutTotals({
    required this.subtotal,
    required this.currency,
    required this.fulfillmentType,
    required this.selectedAddressId,
    required this.outletId,
  });

  final int subtotal;
  final String currency;
  final String fulfillmentType;
  final String? selectedAddressId;
  final String outletId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = context.strings;
    var deliveryFee = 0;
    if (fulfillmentType == 'DELIVERY' && selectedAddressId != null) {
      final quote = ref.watch(
        deliveryQuoteProvider((
          addressId: selectedAddressId!,
          outletId: outletId,
        )),
      );
      deliveryFee = quote.value?.serviceable == true
          ? quote.value?.fee ?? 0
          : 0;
    }

    return Column(
      children: [
        _TotalRow(
          label: strings.estimatedSubtotal,
          value: _money(currency, subtotal),
        ),
        if (fulfillmentType == 'DELIVERY')
          _TotalRow(
            label: strings.deliveryFee,
            value: _money(currency, deliveryFee),
          ),
        const Divider(),
        _TotalRow(
          label: strings.estimatedTotal,
          value: _money(currency, subtotal + deliveryFee),
          strong: true,
        ),
      ],
    );
  }
}

class _TotalRow extends StatelessWidget {
  const _TotalRow({
    required this.label,
    required this.value,
    this.strong = false,
  });

  final String label;
  final String value;
  final bool strong;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: CoffeeSpacing.xxs),
      child: Row(
        children: [
          Expanded(child: Text(label)),
          Text(
            value,
            style: TextStyle(
              fontWeight: strong ? FontWeight.w800 : FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _VoucherSelector extends StatelessWidget {
  const _VoucherSelector({
    required this.entries,
    required this.selectedId,
    required this.onSelected,
  });

  final List<CustomerVoucherWalletEntry> entries;
  final String? selectedId;
  final ValueChanged<String?> onSelected;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;

    return Card(
      child: Column(
        children: [
          ListTile(
            onTap: () => onSelected(null),
            leading: Icon(
              selectedId == null ? Icons.check_circle : Icons.circle_outlined,
              color: selectedId == null
                  ? CoffeeColors.primary
                  : CoffeeColors.textSecondary,
            ),
            title: Text(strings.noVoucher),
          ),
          if (entries.isEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                CoffeeSpacing.md,
                0,
                CoffeeSpacing.md,
                CoffeeSpacing.md,
              ),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(strings.noEligibleVoucher),
              ),
            )
          else
            for (final entry in entries) ...[
              const Divider(height: 1),
              ListTile(
                onTap: () => onSelected(entry.id),
                leading: Icon(
                  selectedId == entry.id
                      ? Icons.check_circle
                      : Icons.circle_outlined,
                  color: selectedId == entry.id
                      ? CoffeeColors.primary
                      : CoffeeColors.textSecondary,
                ),
                title: Text(entry.voucher.title),
                subtitle: Text(
                  '${entry.voucher.code} · ${_discountLabel(entry.voucher)}',
                ),
              ),
            ],
        ],
      ),
    );
  }

  String _discountLabel(VoucherDefinition voucher) {
    if (voucher.discountType == 'PERCENTAGE_BPS') {
      final percentage = voucher.discountValue / 100;
      final decimals = percentage == percentage.roundToDouble() ? 0 : 2;
      return '${percentage.toStringAsFixed(decimals)}%';
    }
    return _money(voucher.currency, voucher.discountValue);
  }
}

class _OrderLine extends StatelessWidget {
  const _OrderLine({required this.item, required this.catalog});

  final CartItem item;
  final CatalogSnapshot catalog;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${item.quantity}× ${item.displayProductName(catalog)}',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: CoffeeSpacing.xxs),
              Text(
                item.displayOptionLabels(catalog).join(' · '),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ),
        ),
        const SizedBox(width: CoffeeSpacing.sm),
        Text(
          _money(catalog.outlet.currency, item.lineTotal),
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}

String _money(String currency, int amount) {
  if (currency == 'IDR') return formatRupiah(amount);
  if (currency == 'MYR') return 'RM ${(amount / 100).toStringAsFixed(2)}';
  return '$currency $amount';
}
