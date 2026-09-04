import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_strings.dart';
import '../../../l10n/reward_extras_strings.dart';
import '../../auth/application/auth_controller.dart';
import '../application/reward_extras_provider.dart';
import '../domain/reward_extras_models.dart';

class BenefitsScreen extends ConsumerStatefulWidget {
  const BenefitsScreen({super.key});

  @override
  ConsumerState<BenefitsScreen> createState() => _BenefitsScreenState();
}

class _BenefitsScreenState extends ConsumerState<BenefitsScreen> {
  final Set<String> _revealed = {};

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final profile = ref.watch(authControllerProvider).value;

    if (profile == null) {
      return ListView(
        padding: const EdgeInsets.all(CoffeeSpacing.xl),
        children: [
          const SizedBox(height: 160),
          const Icon(Icons.card_giftcard_outlined, size: 56),
          const SizedBox(height: CoffeeSpacing.md),
          Text(strings.signInToSeeRewards, textAlign: TextAlign.center),
          const SizedBox(height: CoffeeSpacing.md),
          Center(
            child: FilledButton(
              onPressed: () => context.push('/auth/login'),
              child: Text(strings.login),
            ),
          ),
        ],
      );
    }

    final benefits = ref.watch(digitalBenefitsProvider);
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(digitalBenefitsProvider);
        await ref.read(digitalBenefitsProvider.future);
      },
      child: benefits.when(
        data: (items) {
          if (items.isEmpty) {
            return _BenefitMessage(message: strings.benefitsEmpty);
          }
          return ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(CoffeeSpacing.md),
            itemCount: items.length,
            separatorBuilder: (_, _) =>
                const SizedBox(height: CoffeeSpacing.sm),
            itemBuilder: (context, index) => _BenefitCard(
              benefit: items[index],
              revealed: _revealed.contains(items[index].id),
              onToggleReveal: () {
                setState(() {
                  if (!_revealed.add(items[index].id)) {
                    _revealed.remove(items[index].id);
                  }
                });
              },
            ),
          );
        },
        loading: () => const _BenefitLoading(),
        error: (_, _) => _BenefitMessage(message: strings.benefitsLoadFailed),
      ),
    );
  }
}

class _BenefitCard extends StatelessWidget {
  const _BenefitCard({
    required this.benefit,
    required this.revealed,
    required this.onToggleReveal,
  });

  final DigitalBenefitEntitlement benefit;
  final bool revealed;
  final VoidCallback onToggleReveal;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final isWifi = benefit.type == 'WIFI';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CoffeeSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isWifi ? Icons.wifi_outlined : Icons.auto_awesome_outlined,
                  color: CoffeeColors.deep,
                ),
                const SizedBox(width: CoffeeSpacing.sm),
                Expanded(
                  child: Text(
                    isWifi ? strings.wifiAccess : strings.aiAccess,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                Text(
                  benefit.active ? strings.activeBenefit : strings.inactiveBenefit,
                  style: TextStyle(
                    color: benefit.active
                        ? CoffeeColors.success
                        : CoffeeColors.textSecondary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: CoffeeSpacing.xs),
            Text(strings.benefitFromOutlet(benefit.order.outletName)),
            Text(strings.benefitValidUntil(_dateTime(benefit.validUntil))),
            if (isWifi && benefit.active && benefit.ssid != null) ...[
              const Divider(height: CoffeeSpacing.xl),
              Text(
                strings.networkName,
                style: Theme.of(context).textTheme.labelMedium,
              ),
              SelectableText(benefit.ssid!),
              const SizedBox(height: CoffeeSpacing.sm),
              Text(
                strings.wifiPassword,
                style: Theme.of(context).textTheme.labelMedium,
              ),
              Row(
                children: [
                  Expanded(
                    child: SelectableText(
                      revealed ? (benefit.password ?? '—') : '••••••••',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                  TextButton(
                    onPressed: benefit.password == null ? null : onToggleReveal,
                    child: Text(
                      revealed ? strings.hidePassword : strings.showPassword,
                    ),
                  ),
                ],
              ),
            ],
            if (!isWifi && benefit.quotaTotal != null) ...[
              const Divider(height: CoffeeSpacing.xl),
              Text(
                strings.quotaRemaining(
                  benefit.quotaRemaining ?? 0,
                  benefit.quotaTotal!,
                ),
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _dateTime(DateTime value) {
    final local = value.toLocal();
    final day = local.day.toString().padLeft(2, '0');
    final month = local.month.toString().padLeft(2, '0');
    final hour = local.hour.toString().padLeft(2, '0');
    final minute = local.minute.toString().padLeft(2, '0');
    return '$day/$month/${local.year} $hour:$minute';
  }
}

class _BenefitLoading extends StatelessWidget {
  const _BenefitLoading();

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

class _BenefitMessage extends StatelessWidget {
  const _BenefitMessage({required this.message});

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
