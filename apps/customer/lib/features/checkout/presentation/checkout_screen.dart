import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/formatters/currency.dart';
import '../../../core/utils/idempotency_key.dart';
import '../../cart/application/cart_controller.dart';
import '../../cart/domain/cart_item.dart';
import '../../catalog/application/catalog_provider.dart';
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
    if (_submitting) {
      return;
    }

    final items = ref.read(cartProvider);
    final catalog = ref.read(catalogProvider).value;

    if (items.isEmpty || catalog == null) {
      return;
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
      );

      final payment = await repository.createPayment(
        orderId: order.id,
        idempotencyKey: _paymentKey,
      );

      if (!mounted) {
        return;
      }

      context.go('/payment/${payment.id}');
    } on DioException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = _messageFromDio(error);
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = 'Checkout belum bisa diproses. Coba lagi.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
        });
      }
    }
  }

  String _messageFromDio(DioException error) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is String && message.isNotEmpty) {
        return message;
      }
    }

    if (error.response?.statusCode == 503) {
      return 'Payment provider belum dikonfigurasi pada server ini.';
    }

    return 'Tidak bisa terhubung ke server checkout.';
  }

  @override
  Widget build(BuildContext context) {
    final items = ref.watch(cartProvider);
    final localSubtotal = ref.watch(cartSubtotalProvider);
    final catalog = ref.watch(catalogProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: catalog.when(
        data: (snapshot) => ListView(
          padding: const EdgeInsets.all(CoffeeSpacing.md),
          children: [
            Text(
              'Pickup',
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
                            'Ambil pesanan di outlet ini setelah status Ready.',
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
              'Order Summary',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: CoffeeSpacing.sm),
            for (final item in items) ...[
              _OrderLine(item: item),
              const Divider(height: CoffeeSpacing.lg),
            ],
            const SizedBox(height: CoffeeSpacing.sm),
            Row(
              children: [
                const Expanded(child: Text('Estimated subtotal')),
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
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.verified_user_outlined,
                    size: 20,
                    color: CoffeeColors.deep,
                  ),
                  SizedBox(width: CoffeeSpacing.xs),
                  Expanded(
                    child: Text(
                      'Harga final dihitung ulang oleh server dari menu dan modifier aktif sebelum QRIS dibuat.',
                      style: TextStyle(
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
        error: (_, _) => const Center(
          child: Padding(
            padding: EdgeInsets.all(CoffeeSpacing.lg),
            child: Text('Outlet checkout belum bisa dimuat.'),
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
                    _submitting ? 'Preparing payment…' : 'Continue to QRIS',
                  ),
                ),
              ),
            ),
    );
  }
}

class _OrderLine extends StatelessWidget {
  const _OrderLine({required this.item});

  final CartItem item;

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
                '${item.quantity}× ${item.productName}',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: CoffeeSpacing.xxs),
              Text(
                item.selectedOptions
                    .map((option) => option.label)
                    .join(' · '),
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
