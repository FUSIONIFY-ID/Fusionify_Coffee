import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/formatters/currency.dart';
import '../../../l10n/app_strings.dart';
import '../../../l10n/reward_extras_strings.dart';
import '../../auth/application/auth_controller.dart';
import '../application/reward_extras_provider.dart';
import '../domain/reward_extras_models.dart';

class VouchersScreen extends ConsumerWidget {
  const VouchersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = context.strings;
    final profile = ref.watch(authControllerProvider).value;

    if (profile == null) {
      return _SignInState(
        message: strings.signInToSeeRewards,
        login: strings.login,
      );
    }

    final wallet = ref.watch(voucherWalletProvider);
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(voucherWalletProvider);
        await ref.read(voucherWalletProvider.future);
      },
      child: wallet.when(
        data: (entries) => _VoucherList(entries: entries),
        loading: () => const _LoadingList(),
        error: (_, _) => _MessageList(message: strings.vouchersLoadFailed),
      ),
    );
  }
}

class _VoucherList extends StatelessWidget {
  const _VoucherList({required this.entries});

  final List<CustomerVoucherWalletEntry> entries;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    if (entries.isEmpty) {
      return _MessageList(message: strings.vouchersEmpty);
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(CoffeeSpacing.md),
      itemCount: entries.length,
      separatorBuilder: (_, _) => const SizedBox(height: CoffeeSpacing.sm),
      itemBuilder: (context, index) => _VoucherCard(entry: entries[index]),
    );
  }
}

class _VoucherCard extends StatelessWidget {
  const _VoucherCard({required this.entry});

  final CustomerVoucherWalletEntry entry;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final voucher = entry.voucher;
    final statusLabel = entry.usable
        ? strings.availableVoucher
        : entry.status == 'USED'
        ? strings.voucherUsed
        : strings.voucherExpired;

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
                    voucher.title,
                    style: Theme.of(context).textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w800),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: CoffeeSpacing.sm,
                    vertical: CoffeeSpacing.xxs,
                  ),
                  decoration: BoxDecoration(
                    color: entry.usable
                        ? CoffeeColors.surfaceBlue
                        : Theme.of(context).colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(CoffeeRadius.control),
                  ),
                  child: Text(
                    statusLabel,
                    style: TextStyle(
                      color: entry.usable
                          ? CoffeeColors.deep
                          : CoffeeColors.textSecondary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: CoffeeSpacing.xs),
            SelectableText(
              voucher.code,
              style: const TextStyle(
                color: CoffeeColors.deep,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2,
              ),
            ),
            if (voucher.description.isNotEmpty) ...[
              const SizedBox(height: CoffeeSpacing.xs),
              Text(voucher.description),
            ],
            const SizedBox(height: CoffeeSpacing.md),
            Text(
              _discount(voucher),
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: CoffeeColors.deep,
                fontWeight: FontWeight.w800,
              ),
            ),
            if (voucher.minimumSpend > 0) ...[
              const SizedBox(height: CoffeeSpacing.xxs),
              Text(
                strings.voucherMinimum(
                  _money(voucher.currency, voucher.minimumSpend),
                ),
              ),
            ],
            const SizedBox(height: CoffeeSpacing.xxs),
            Text(strings.voucherValidUntil(_date(voucher.validUntil))),
          ],
        ),
      ),
    );
  }

  String _discount(VoucherDefinition voucher) {
    if (voucher.discountType == 'PERCENTAGE_BPS') {
      final value = voucher.discountValue / 100;
      return '${value.toStringAsFixed(value == value.roundToDouble() ? 0 : 2)}%';
    }
    return _money(voucher.currency, voucher.discountValue);
  }

  String _money(String currency, int amount) {
    if (currency == 'IDR') return formatRupiah(amount);
    if (currency == 'MYR') return 'RM ${(amount / 100).toStringAsFixed(2)}';
    return '$currency $amount';
  }

  String _date(DateTime value) {
    final local = value.toLocal();
    return '${local.day.toString().padLeft(2, '0')}/'
        '${local.month.toString().padLeft(2, '0')}/${local.year}';
  }
}

class _SignInState extends StatelessWidget {
  const _SignInState({required this.message, required this.login});

  final String message;
  final String login;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(CoffeeSpacing.xl),
      children: [
        const SizedBox(height: 160),
        const Icon(Icons.confirmation_number_outlined, size: 56),
        const SizedBox(height: CoffeeSpacing.md),
        Text(message, textAlign: TextAlign.center),
        const SizedBox(height: CoffeeSpacing.md),
        Center(
          child: FilledButton(
            onPressed: () => context.push('/auth/login'),
            child: Text(login),
          ),
        ),
      ],
    );
  }
}

class _LoadingList extends StatelessWidget {
  const _LoadingList();

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: const [
        SizedBox(height: 200),
        Center(child: CircularProgressIndicator()),
      ],
    );
  }
}

class _MessageList extends StatelessWidget {
  const _MessageList({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(CoffeeSpacing.xl),
      children: [
        const SizedBox(height: 160),
        Text(message, textAlign: TextAlign.center),
      ],
    );
  }
}
