import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/formatters/currency.dart';
import '../../../l10n/app_strings.dart';
import '../../../l10n/rewards_strings.dart';
import '../../auth/application/auth_controller.dart';
import '../application/rewards_provider.dart';
import '../domain/rewards_models.dart';

class RewardsScreen extends ConsumerWidget {
  const RewardsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
                  Icons.stars_outlined,
                  size: 56,
                  color: CoffeeColors.primary,
                ),
                const SizedBox(height: CoffeeSpacing.md),
                Text(strings.signInToSeeRewards, textAlign: TextAlign.center),
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

    final summary = ref.watch(rewardsSummaryProvider);

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(rewardsSummaryProvider);
          await ref.read(rewardsSummaryProvider.future);
        },
        child: summary.when(
          data: (value) => _RewardsContent(summary: value),
          loading: () => const _RewardsLoading(),
          error: (_, _) => _RewardsError(
            onRetry: () => ref.invalidate(rewardsSummaryProvider),
          ),
        ),
      ),
    );
  }
}

class _RewardsContent extends StatelessWidget {
  const _RewardsContent({required this.summary});

  final RewardsSummary summary;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(CoffeeSpacing.md),
      children: [
        Text(
          strings.membership,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: CoffeeSpacing.md),
        _MembershipCard(membership: summary.membership),
        const SizedBox(height: CoffeeSpacing.xl),
        Text(
          strings.fusionPoints,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: CoffeeSpacing.md),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(CoffeeSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  strings.pointsBalance,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: CoffeeSpacing.xs),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      summary.balance.toString(),
                      style: Theme.of(context).textTheme.displaySmall?.copyWith(
                        color: CoffeeColors.deep,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(width: CoffeeSpacing.xs),
                    Padding(
                      padding: const EdgeInsets.only(bottom: CoffeeSpacing.xs),
                      child: Text(strings.fusionPoints),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: CoffeeSpacing.md),
        Row(
          children: [
            Expanded(
              child: _Metric(
                label: strings.lifetimeEarned,
                value: summary.lifetimeEarned,
              ),
            ),
            const SizedBox(width: CoffeeSpacing.md),
            Expanded(
              child: _Metric(
                label: strings.lifetimeRedeemed,
                value: summary.lifetimeRedeemed,
              ),
            ),
          ],
        ),
        const SizedBox(height: CoffeeSpacing.xl),
        Text(
          strings.recentPointsActivity,
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: CoffeeSpacing.sm),
        if (summary.recentActivity.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: CoffeeSpacing.xl),
            child: Text(
              strings.noPointsActivity,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          )
        else
          for (final entry in summary.recentActivity) _LedgerTile(entry: entry),
      ],
    );
  }
}

class _MembershipCard extends StatelessWidget {
  const _MembershipCard({required this.membership});

  final MembershipSummary membership;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final current = membership.currentTier;
    final next = membership.nextTier;
    final multiplier = membership.pointsMultiplierBps / 10000;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CoffeeSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: CoffeeColors.surfaceBlue,
                    borderRadius: BorderRadius.circular(CoffeeRadius.control),
                  ),
                  child: const Icon(
                    Icons.workspace_premium_outlined,
                    color: CoffeeColors.deep,
                  ),
                ),
                const SizedBox(width: CoffeeSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        current?.name ?? strings.baseMember,
                        style: Theme.of(context).textTheme.titleLarge
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      if (current != null && multiplier > 1)
                        Text(
                          strings.pointsMultiplier(
                            multiplier.toStringAsFixed(
                              multiplier == multiplier.roundToDouble() ? 0 : 2,
                            ),
                          ),
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: CoffeeSpacing.lg),
            if (current == null && next == null)
              Text(strings.membershipNotConfigured)
            else ...[
              Text(
                strings.membershipProgress,
                style: Theme.of(context).textTheme.labelLarge,
              ),
              const SizedBox(height: CoffeeSpacing.xs),
              LinearProgressIndicator(
                value: membership.progressToNextTier,
                minHeight: 8,
                borderRadius: BorderRadius.circular(CoffeeRadius.control),
              ),
              const SizedBox(height: CoffeeSpacing.sm),
              Text(
                next == null
                    ? strings.topTierReached
                    : strings.nextTierProgress(
                        _formatSpend(
                          membership.currency,
                          membership.remainingToNextTier,
                        ),
                        next.name,
                      ),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatSpend(String currency, int amount) {
    if (currency == 'IDR') return formatRupiah(amount);
    if (currency == 'MYR') return 'RM ${(amount / 100).toStringAsFixed(2)}';
    return '$currency $amount';
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(CoffeeSpacing.md),
      decoration: BoxDecoration(
        border: Border.all(color: CoffeeColors.border),
        borderRadius: BorderRadius.circular(CoffeeRadius.card),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: CoffeeSpacing.xs),
          Text(
            value.toString(),
            style: Theme.of(context).textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }
}

class _LedgerTile extends StatelessWidget {
  const _LedgerTile({required this.entry});

  final RewardsLedgerEntry entry;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final positive = entry.points >= 0;
    final local = entry.createdAt.toLocal();
    final date =
        '${local.day.toString().padLeft(2, '0')}/'
        '${local.month.toString().padLeft(2, '0')}/${local.year}';

    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(
        positive ? Icons.add_circle_outline : Icons.remove_circle_outline,
        color: positive ? CoffeeColors.success : CoffeeColors.error,
      ),
      title: Text(_entryLabel(strings)),
      subtitle: Text(date),
      trailing: Text(
        '${positive ? '+' : ''}${strings.pointsAmount(entry.points)}',
        style: TextStyle(
          color: positive ? CoffeeColors.success : CoffeeColors.error,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }

  String _entryLabel(AppStrings strings) {
    return switch (entry.type) {
      'ORDER_REWARD' => strings.orderReward,
      'CAMPAIGN_BONUS' => strings.campaignBonus,
      'REDEEM_REWARD' => strings.rewardRedemption,
      'REFUND_REVERSAL' => strings.refundReversal,
      'MANUAL_ADJUSTMENT' => strings.manualAdjustment,
      _ => strings.fusionPoints,
    };
  }
}

class _RewardsLoading extends StatelessWidget {
  const _RewardsLoading();

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: const [
        SizedBox(height: 240),
        Center(child: CircularProgressIndicator()),
      ],
    );
  }
}

class _RewardsError extends StatelessWidget {
  const _RewardsError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(CoffeeSpacing.xl),
      children: [
        const SizedBox(height: 180),
        Text(strings.pointsLoadFailed, textAlign: TextAlign.center),
        const SizedBox(height: CoffeeSpacing.md),
        Center(
          child: FilledButton(onPressed: onRetry, child: Text(strings.retry)),
        ),
      ],
    );
  }
}
