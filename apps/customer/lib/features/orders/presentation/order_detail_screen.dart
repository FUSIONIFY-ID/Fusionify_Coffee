import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/formatters/currency.dart';
import '../../../core/realtime/customer_realtime_provider.dart';
import '../../../l10n/app_strings.dart';
import '../../../l10n/receipt_strings.dart';
import '../../shared/presentation/customer_realtime_status.dart';
import '../application/orders_provider.dart';
import '../domain/order_history_models.dart';
import 'order_status_labels.dart';

class OrderDetailScreen extends ConsumerStatefulWidget {
  const OrderDetailScreen({super.key, required this.orderId});

  final String orderId;

  @override
  ConsumerState<OrderDetailScreen> createState() =>
      _OrderDetailScreenState();
}

class _OrderDetailScreenState extends ConsumerState<OrderDetailScreen>
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
        WidgetsBinding.instance.lifecycleState != AppLifecycleState.resumed) {
      return;
    }
    ref.invalidate(orderDetailProvider(widget.orderId));
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(customerRealtimeProvider, (previous, next) {
      final previousOrder = previous?.value?.snapshot?.orderById(widget.orderId);
      final nextOrder = next.value?.snapshot?.orderById(widget.orderId);
      if (nextOrder != null &&
          (previousOrder?.status != nextOrder.status ||
              previousOrder?.updatedAt != nextOrder.updatedAt)) {
        ref.invalidate(orderDetailProvider(widget.orderId));
      }
    });

    final strings = context.strings;
    final order = ref.watch(orderDetailProvider(widget.orderId));

    return Scaffold(
      appBar: AppBar(
        title: Text(strings.orderDetail),
        actions: [
          IconButton(
            tooltip: strings.digitalReceipt,
            onPressed: () =>
                context.push('/orders/${widget.orderId}/receipt'),
            icon: const Icon(Icons.receipt_long_outlined),
          ),
        ],
      ),
      body: Column(
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
            child: order.when(
              data: (value) => RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(orderDetailProvider(widget.orderId));
                  await ref.read(orderDetailProvider(widget.orderId).future);
                },
                child: ListView(
                  padding: const EdgeInsets.all(CoffeeSpacing.md),
                  children: [
                    _OrderHeader(order: value),
                    const SizedBox(height: CoffeeSpacing.lg),
                    Text(
                      strings.orderItems,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: CoffeeSpacing.sm),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(CoffeeSpacing.md),
                        child: Column(
                          children: [
                            for (
                              var index = 0;
                              index < value.items.length;
                              index++
                            ) ...[
                              _OrderItemRow(item: value.items[index]),
                              if (index < value.items.length - 1)
                                const Divider(),
                            ],
                            const Divider(),
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    strings.total,
                                    style: Theme.of(
                                      context,
                                    ).textTheme.titleMedium,
                                  ),
                                ),
                                Text(
                                  formatRupiah(value.totalAmount),
                                  style: Theme.of(context).textTheme.titleMedium
                                      ?.copyWith(fontWeight: FontWeight.w800),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: CoffeeSpacing.lg),
                    Text(
                      strings.orderTimeline,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: CoffeeSpacing.sm),
                    _OrderTimeline(order: value),
                    const SizedBox(height: CoffeeSpacing.xl),
                  ],
                ),
              ),
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (_, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(CoffeeSpacing.lg),
                  child: Text(strings.orderDetailLoadFailed),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderHeader extends StatelessWidget {
  const _OrderHeader({required this.order});

  final CustomerOrderDetail order;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final shortId = order.id.length > 8
        ? order.id.substring(order.id.length - 8)
        : order.id;

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
                    order.outletName,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
                _StatusPill(
                  status: order.status,
                  label: localizedOrderStatus(strings, order.status),
                ),
              ],
            ),
            const SizedBox(height: CoffeeSpacing.sm),
            Text('${strings.orderNumber} #$shortId'),
            const SizedBox(height: CoffeeSpacing.xxs),
            Text('${strings.placedAt} ${_formatDate(order.createdAt)}'),
          ],
        ),
      ),
    );
  }
}

class _OrderItemRow extends StatelessWidget {
  const _OrderItemRow({required this.item});

  final CustomerOrderItem item;

  @override
  Widget build(BuildContext context) {
    final modifierText = item.selectedModifiers
        .map((modifier) => modifier.optionName)
        .where((name) => name.isNotEmpty)
        .join(' • ');

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: CoffeeSpacing.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${item.quantity}×',
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          const SizedBox(width: CoffeeSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.productName,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                if (modifierText.isNotEmpty) ...[
                  const SizedBox(height: CoffeeSpacing.xxs),
                  Text(
                    modifierText,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ),
          Text(formatRupiah(item.lineTotal)),
        ],
      ),
    );
  }
}

class _OrderTimeline extends StatelessWidget {
  const _OrderTimeline({required this.order});

  final CustomerOrderDetail order;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final events = order.statusEvents;

    if (events.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(CoffeeSpacing.md),
          child: Row(
            children: [
              const Icon(Icons.schedule_outlined, color: CoffeeColors.primary),
              const SizedBox(width: CoffeeSpacing.sm),
              Expanded(
                child: Text(
                  '${localizedOrderStatus(strings, order.status)} · '
                  '${strings.statusHistoryEmpty}',
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CoffeeSpacing.md),
        child: Column(
          children: [
            for (var index = 0; index < events.length; index++)
              _TimelineRow(
                event: events[index],
                isLast: index == events.length - 1,
              ),
          ],
        ),
      ),
    );
  }
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({required this.event, required this.isLast});

  final CustomerOrderStatusEvent event;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 28,
            child: Column(
              children: [
                Container(
                  width: 14,
                  height: 14,
                  decoration: const BoxDecoration(
                    color: CoffeeColors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(
                        vertical: CoffeeSpacing.xxs,
                      ),
                      color: CoffeeColors.border,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: CoffeeSpacing.sm),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : CoffeeSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    localizedOrderStatus(strings, event.toStatus),
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: CoffeeSpacing.xxs),
                  Text(
                    _formatDate(event.createdAt),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  if (event.note?.trim().isNotEmpty == true) ...[
                    const SizedBox(height: CoffeeSpacing.xxs),
                    Text(event.note!),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status, required this.label});

  final String status;
  final String label;

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

String _formatDate(DateTime date) {
  final local = date.toLocal();
  final day = local.day.toString().padLeft(2, '0');
  final month = local.month.toString().padLeft(2, '0');
  final hour = local.hour.toString().padLeft(2, '0');
  final minute = local.minute.toString().padLeft(2, '0');
  return '$day/$month/${local.year} $hour:$minute';
}
