import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/formatters/currency.dart';
import '../../../core/utils/idempotency_key.dart';
import '../../../l10n/app_strings.dart';
import '../../auth/application/auth_controller.dart';
import '../../cart/application/cart_controller.dart';
import '../../cart/domain/cart_item.dart';
import '../../catalog/application/catalog_provider.dart';
import '../../catalog/domain/catalog_models.dart';
import '../application/checkout_provider.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  late final String _checkoutKey;
  late final String _paymentKey;
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
      );

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

    return Scaffold(
      appBar: AppBar(title: Text(strings.checkout)),
      body: catalog.when(
        data: (snapshot) => ListView(
          padding: const EdgeInsets.all(CoffeeSpacing.md),
          children: [
            Text(strings.pickup, style: Theme.of(context).textTheme.headlineSmall),
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
            const SizedBox(height: CoffeeSpacing.sm),
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
