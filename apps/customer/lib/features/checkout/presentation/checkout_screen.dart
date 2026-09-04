import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/formatters/currency.dart';
import '../../../core/utils/idempotency_key.dart';
import '../../../l10n/app_strings.dart';
import '../../../l10n/reward_extras_strings.dart';
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

      if (mounted) {
        context.go('/payment/${payment.id}');
      }
    } on DioException catch (error) {
      if (mounted) {
        setState(() {
          _error = _messageFromDio(error, context.strings);
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = context.strings.checkoutProcessingFailed;
        });
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
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
              strings.pickup,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: CoffeeSpacing.sm),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(CoffeeSpacing.md),
                child: Row(
                  children: [
                    const Icon(
                      Icons.storefront_outlined,
                      color: CoffeeColors.primary,
                    ),
                    const SizedBox(width: CoffeeSpacing.sm),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            snapshot.outlet.name,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: CoffeeSpacing.xxs),
                          Text(
                            strings.pickupReadyInstruction,
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
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
            const SizedBox(height: CoffeeSpacing.sm),
            Row(
              children: [
                Expanded(child: Text(strings.estimatedSubtotal)),
                Text(
                  formatRupiah(localSubtotal),
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ],
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
    if (voucher.currency == 'IDR') {
      return formatRupiah(voucher.discountValue);
    }
    if (voucher.currency == 'MYR') {
      return 'RM ${(voucher.discountValue / 100).toStringAsFixed(2)}';
    }
    return '${voucher.currency} ${voucher.discountValue}';
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
          formatRupiah(item.lineTotal),
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}
