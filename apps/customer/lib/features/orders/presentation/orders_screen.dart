import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/formatters/currency.dart';
import '../../../core/realtime/customer_realtime_provider.dart';
import '../../../l10n/app_strings.dart';
import '../../auth/application/auth_controller.dart';
import '../../cart/application/cart_controller.dart';
import '../../catalog/application/catalog_provider.dart';
import '../../catalog/domain/catalog_models.dart';
import '../../shared/presentation/customer_realtime_status.dart';
import '../application/orders_provider.dart';
import '../application/reorder_builder.dart';
import '../domain/order_history_models.dart';
import 'order_status_labels.dart';
import 'reorder_strings.dart';

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen>
    with WidgetsBindingObserver {
  Timer? _fallbackTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _fallbackTimer = Timer.periodic(
      customerRealtimeFallbackInterval,
      (_) => _refreshAuthoritative(),
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _fallbackTimer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed) return;
    ref.invalidate(customerRealtimeProvider);
    _refreshAuthoritative();
  }

  void _refreshAuthoritative() {
    if (!mounted ||
        WidgetsBinding.instance.lifecycleState != AppLifecycleState.resumed ||
        ref.read(authControllerProvider).value == null) {
      return;
    }
    ref.invalidate(orderHistoryProvider);
  }

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final profile = ref.watch(authControllerProvider).value;

    if (profile == null) {
      return SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(CoffeeSpacing.xl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.receipt_long_outlined,
                  size: 56,
                  color: CoffeeColors.primary,
                ),
                const SizedBox(height: CoffeeSpacing.md),
                Text(strings.signInToSeeOrders, textAlign: TextAlign.center),
                const SizedBox(height: CoffeeSpacing.md),
                FilledButton(
                  onPressed: () => context.push('/auth/login'),
                  child: Text(strings.login),
                ),
              ],
            ),
          ),
        ),
      );
    }

    ref.listen(customerRealtimeProvider, (previous, next) {
      final previousSignature = previous?.value?.snapshot?.signature;
      final nextSignature = next.value?.snapshot?.signature;
      if (nextSignature != null && nextSignature != previousSignature) {
        ref.invalidate(orderHistoryProvider);
      }
    });

    final orders = ref.watch(orderHistoryProvider);
    final catalog = ref.watch(catalogProvider).value;

    return SafeArea(
      child: Column(
        children: [
          const CustomerRealtimeStatus(
            padding: EdgeInsets.fromLTRB(
              CoffeeSpacing.md,
              CoffeeSpacing.sm,
              CoffeeSpacing.md,
              0,
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(orderHistoryProvider);
                ref.invalidate(catalogProvider);
                await Future.wait([
                  ref.read(orderHistoryProvider.future),
                  ref.read(catalogProvider.future),
                ]);
              },
              child: orders.when(
                data: (items) {
                  if (items.isEmpty) {
                    return ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        SizedBox(
                          height: MediaQuery.sizeOf(context).height * 0.65,
                          child: Center(
                            child: Padding(
                              padding: const EdgeInsets.all(CoffeeSpacing.xl),
                              child: Text(
                                strings.ordersEmpty,
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                        ),
                      ],
                    );
                  }

                  return ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(CoffeeSpacing.md),
                    itemCount: items.length,
                    separatorBuilder: (_, _) =>
                        const SizedBox(height: CoffeeSpacing.sm),
                    itemBuilder: (context, index) {
                      final order = items[index];
                      return _OrderCard(
                        order: order,
                        onTap: () => context.push('/orders/${order.id}'),
                        onBuyAgain:
                            catalog == null || !_canBuyAgain(order.status)
                            ? null
                            : () => _buyAgain(
                                context: context,
                                ref: ref,
                                order: order,
                                catalog: catalog,
                              ),
                      );
                    },
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, _) => ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: [
                    SizedBox(
                      height: MediaQuery.sizeOf(context).height * 0.65,
                      child: Center(
                        child: Text(strings.orderHistoryLoadFailed),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  bool _canBuyAgain(String status) {
    return switch (status) {
      'COMPLETED' || 'PICKED_UP' || 'CANCELLED' => true,
      _ => false,
    };
  }

  void _buyAgain({
    required BuildContext context,
    required WidgetRef ref,
    required CustomerOrderSummary order,
    required CatalogSnapshot catalog,
  }) {
    final result = buildReorderCart(orderItems: order.items, catalog: catalog);

    if (!result.canReorder) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.reorderStrings.unavailable)),
      );
      return;
    }

    for (final item in result.items) {
      ref.read(cartProvider.notifier).add(item);
    }

    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(context.reorderStrings.addedToCart)));
    context.push('/cart');
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order, required this.onTap, this.onBuyAgain});

  final CustomerOrderSummary order;
  final VoidCallback onTap;
  final VoidCallback? onBuyAgain;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final firstItems = order.items
        .take(2)
        .map((item) {
          return '${item.quantity}× ${item.productName}';
        })
        .join(' • ');

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(CoffeeSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      order.outletName,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  _StatusChip(
                    label: localizedOrderStatus(strings, order.status),
                    status: order.status,
                  ),
                ],
              ),
              const SizedBox(height: CoffeeSpacing.xs),
              Text(
                firstItems.isEmpty
                    ? strings.itemsCount(order.items.length)
                    : firstItems,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: CoffeeSpacing.sm),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      _formatDate(order.createdAt),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                  Text(
                    formatRupiah(order.totalAmount),
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              if (onBuyAgain != null) ...[
                const SizedBox(height: CoffeeSpacing.sm),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        context.reorderStrings.currentPricingNotice,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                    TextButton.icon(
                      onPressed: onBuyAgain,
                      icon: const Icon(Icons.replay_outlined),
                      label: Text(strings.buyAgain),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final local = date.toLocal();
    final day = local.day.toString().padLeft(2, '0');
    final month = local.month.toString().padLeft(2, '0');
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '$day/$month/${local.year} $hour:$minute';
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label, required this.status});

  final String label;
  final String status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'COMPLETED' || 'PICKED_UP' => CoffeeColors.success,
      'CANCELLED' => CoffeeColors.error,
      'READY' => CoffeeColors.deep,
      _ => CoffeeColors.primary,
    };

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: CoffeeSpacing.sm,
        vertical: CoffeeSpacing.xxs,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(CoffeeRadius.control),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
      ),
    );
  }
}
