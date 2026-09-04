import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_strings.dart';
import '../../../l10n/receipt_strings.dart';
import '../../orders/presentation/order_status_labels.dart';
import '../application/digital_receipt_provider.dart';
import '../domain/digital_receipt.dart';

class DigitalReceiptScreen extends ConsumerWidget {
  const DigitalReceiptScreen({super.key, required this.orderId});

  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = context.strings;
    final receipt = ref.watch(digitalReceiptProvider(orderId));

    return Scaffold(
      appBar: AppBar(title: Text(strings.digitalReceipt)),
      body: receipt.when(
        data: (value) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(digitalReceiptProvider(orderId));
            await ref.read(digitalReceiptProvider(orderId).future);
          },
          child: ListView(
            padding: const EdgeInsets.all(CoffeeSpacing.md),
            children: [
              _ReceiptHeader(receipt: value),
              const SizedBox(height: CoffeeSpacing.md),
              _ItemsCard(receipt: value),
              const SizedBox(height: CoffeeSpacing.md),
              _SummaryCard(receipt: value),
              if (value.payment != null || value.voucherCode != null) ...[
                const SizedBox(height: CoffeeSpacing.md),
                _PaymentCard(receipt: value),
              ],
              if (value.benefitIds.isNotEmpty) ...[
                const SizedBox(height: CoffeeSpacing.md),
                Card(
                  child: ListTile(
                    leading: const Icon(
                      Icons.card_giftcard_outlined,
                      color: CoffeeColors.deep,
                    ),
                    title: Text(strings.receiptBenefitsIssued),
                    subtitle: Text(value.benefitIds.length.toString()),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.go('/rewards'),
                  ),
                ),
              ],
              const SizedBox(height: CoffeeSpacing.md),
              Container(
                padding: const EdgeInsets.all(CoffeeSpacing.sm),
                decoration: BoxDecoration(
                  color: CoffeeColors.surfaceBlue,
                  borderRadius: BorderRadius.circular(CoffeeRadius.control),
                ),
                child: Text(
                  strings.receiptServerNotice,
                  style: const TextStyle(
                    color: CoffeeColors.deep,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: CoffeeSpacing.xl),
            ],
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(CoffeeSpacing.lg),
            child: Text(strings.receiptLoadFailed),
          ),
        ),
      ),
    );
  }
}

class _ReceiptHeader extends StatelessWidget {
  const _ReceiptHeader({required this.receipt});

  final DigitalReceipt receipt;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final shortId = receipt.orderId.length > 8
        ? receipt.orderId.substring(receipt.orderId.length - 8)
        : receipt.orderId;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CoffeeSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Fusionify Coffee',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: CoffeeColors.deep,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: CoffeeSpacing.xs),
            Text(
              receipt.outletName,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const Divider(height: CoffeeSpacing.lg),
            Text('${strings.orderNumber} #$shortId'),
            Text('${strings.placedAt} ${_formatDate(receipt.createdAt)}'),
            Text(localizedOrderStatus(strings, receipt.status)),
          ],
        ),
      ),
    );
  }
}

class _ItemsCard extends StatelessWidget {
  const _ItemsCard({required this.receipt});

  final DigitalReceipt receipt;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CoffeeSpacing.md),
        child: Column(
          children: [
            for (var index = 0; index < receipt.items.length; index++) ...[
              _ReceiptItemRow(item: receipt.items[index], currency: receipt.currency),
              if (index < receipt.items.length - 1) const Divider(),
            ],
          ],
        ),
      ),
    );
  }
}

class _ReceiptItemRow extends StatelessWidget {
  const _ReceiptItemRow({required this.item, required this.currency});

  final ReceiptItem item;
  final String currency;

  @override
  Widget build(BuildContext context) {
    final modifiers = item.modifiers
        .map((modifier) => modifier.optionName)
        .where((name) => name.isNotEmpty)
        .join(' • ');
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: CoffeeSpacing.xs),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${item.quantity}×', style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(width: CoffeeSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.productName, style: const TextStyle(fontWeight: FontWeight.w700)),
                if (modifiers.isNotEmpty) ...[
                  const SizedBox(height: CoffeeSpacing.xxs),
                  Text(modifiers, style: Theme.of(context).textTheme.bodySmall),
                ],
              ],
            ),
          ),
          Text(_money(currency, item.lineTotal)),
        ],
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.receipt});

  final DigitalReceipt receipt;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CoffeeSpacing.md),
        child: Column(
          children: [
            _MoneyRow(label: strings.receiptSubtotal, value: _money(receipt.currency, receipt.subtotal)),
            if (receipt.discountAmount > 0)
              _MoneyRow(label: strings.receiptDiscount, value: '-${_money(receipt.currency, receipt.discountAmount)}'),
            if (receipt.deliveryFee > 0)
              _MoneyRow(label: strings.receiptDeliveryFee, value: _money(receipt.currency, receipt.deliveryFee)),
            const Divider(),
            _MoneyRow(
              label: strings.total,
              value: _money(receipt.currency, receipt.totalAmount),
              strong: true,
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentCard extends StatelessWidget {
  const _PaymentCard({required this.receipt});

  final DigitalReceipt receipt;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final payment = receipt.payment;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CoffeeSpacing.md),
        child: Column(
          children: [
            if (payment != null)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.payments_outlined),
                title: Text(strings.receiptPayment),
                subtitle: Text('${payment.channel} • ${payment.status}'),
                trailing: Text(_money(receipt.currency, payment.amount)),
              ),
            if (receipt.voucherCode != null)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.confirmation_number_outlined),
                title: Text(strings.receiptVoucher),
                trailing: SelectableText(receipt.voucherCode!),
              ),
          ],
        ),
      ),
    );
  }
}

class _MoneyRow extends StatelessWidget {
  const _MoneyRow({required this.label, required this.value, this.strong = false});

  final String label;
  final String value;
  final bool strong;

  @override
  Widget build(BuildContext context) {
    final style = strong
        ? Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)
        : Theme.of(context).textTheme.bodyMedium;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: CoffeeSpacing.xxs),
      child: Row(
        children: [
          Expanded(child: Text(label, style: style)),
          Text(value, style: style),
        ],
      ),
    );
  }
}

String _money(String currency, int amount) {
  if (currency == 'IDR') {
    final digits = amount.toString();
    final result = StringBuffer();
    for (var index = 0; index < digits.length; index += 1) {
      if (index > 0 && (digits.length - index) % 3 == 0) result.write('.');
      result.write(digits[index]);
    }
    return 'Rp$result';
  }
  if (currency == 'MYR') return 'RM ${(amount / 100).toStringAsFixed(2)}';
  return '$currency $amount';
}

String _formatDate(DateTime value) {
  final local = value.toLocal();
  final day = local.day.toString().padLeft(2, '0');
  final month = local.month.toString().padLeft(2, '0');
  final hour = local.hour.toString().padLeft(2, '0');
  final minute = local.minute.toString().padLeft(2, '0');
  return '$day/$month/${local.year} $hour:$minute';
}
