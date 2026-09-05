import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_strings.dart';
import '../../../l10n/delivery_strings.dart';
import '../../../l10n/rewards_strings.dart';
import '../../auth/application/auth_controller.dart';
import '../../auth/domain/auth_models.dart';
import '../../rewards/application/rewards_provider.dart';
import '../../rewards/domain/rewards_models.dart';
import '../../rewards/presentation/membership_visual_card.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);

    return SafeArea(
      child: auth.when(
        data: (profile) {
          if (profile == null) {
            return const _GuestAccount();
          }

          final rewards = ref.watch(rewardsSummaryProvider);
          return AccountHubView(
            profile: profile,
            membership: rewards.value?.membership,
            onRewards: () => context.go('/rewards'),
            onOrders: () => context.go('/orders'),
            onFavorites: () => context.push('/favorites'),
            onAddresses: () => context.push('/account/addresses'),
            onPersonalInfo: () => context.push('/account/personal'),
            onLanguage: () => context.push('/account/language'),
            onSecurity: () => context.push('/account/security'),
            onLogout: () async {
              await ref.read(authControllerProvider.notifier).logout();
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => const _GuestAccount(),
      ),
    );
  }
}

class AccountHubView extends StatelessWidget {
  const AccountHubView({
    super.key,
    required this.profile,
    this.membership,
    this.onRewards,
    this.onOrders,
    this.onFavorites,
    this.onAddresses,
    this.onPersonalInfo,
    this.onLanguage,
    this.onSecurity,
    this.onLogout,
  });

  final CustomerProfile profile;
  final MembershipSummary? membership;
  final VoidCallback? onRewards;
  final VoidCallback? onOrders;
  final VoidCallback? onFavorites;
  final VoidCallback? onAddresses;
  final VoidCallback? onPersonalInfo;
  final VoidCallback? onLanguage;
  final VoidCallback? onSecurity;
  final VoidCallback? onLogout;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;

    return ListView(
      padding: const EdgeInsets.fromLTRB(
        CoffeeSpacing.md,
        CoffeeSpacing.md,
        CoffeeSpacing.md,
        CoffeeSpacing.xl,
      ),
      children: [
        Text(strings.account, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: CoffeeSpacing.lg),
        _ProfileHeader(profile: profile),
        const SizedBox(height: CoffeeSpacing.md),
        _MemberCard(profile: profile, membership: membership, onTap: onRewards),
        const SizedBox(height: CoffeeSpacing.xl),
        _SectionTitle(strings.yourCoffee),
        _AccountTile(
          icon: Icons.receipt_long_outlined,
          title: strings.orders,
          onTap: onOrders,
        ),
        _AccountTile(
          icon: Icons.favorite_border,
          title: strings.favorites,
          onTap: onFavorites,
        ),
        const SizedBox(height: CoffeeSpacing.lg),
        _SectionTitle(strings.account),
        _AccountTile(
          icon: Icons.person_outline,
          title: strings.personalInformation,
          onTap: onPersonalInfo,
        ),
        _AccountTile(
          icon: Icons.location_on_outlined,
          title: strings.savedAddresses,
          onTap: onAddresses,
        ),
        _AccountTile(
          icon: Icons.language_outlined,
          title: strings.language,
          subtitle: _languageLabel(profile.preferredLanguage),
          onTap: onLanguage,
        ),
        _AccountTile(
          icon: Icons.shield_outlined,
          title: strings.security,
          onTap: onSecurity,
        ),
        const SizedBox(height: CoffeeSpacing.lg),
        _SectionTitle(strings.support),
        _AccountTile(icon: Icons.help_outline, title: strings.helpCenter),
        _AccountTile(
          icon: Icons.policy_outlined,
          title: strings.privacyAndTerms,
        ),
        const SizedBox(height: CoffeeSpacing.lg),
        OutlinedButton.icon(
          onPressed: onLogout,
          icon: const Icon(Icons.logout),
          label: Text(strings.logout),
        ),
      ],
    );
  }

  String _languageLabel(String value) {
    return switch (value) {
      'ID_ID' => 'Bahasa Indonesia',
      'MS_MY' => 'Bahasa Melayu',
      _ => 'English',
    };
  }
}

class _GuestAccount extends StatelessWidget {
  const _GuestAccount();

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;

    return ListView(
      padding: const EdgeInsets.all(CoffeeSpacing.lg),
      children: [
        const SizedBox(height: CoffeeSpacing.xl),
        const Icon(
          Icons.account_circle_outlined,
          size: 72,
          color: CoffeeColors.primary,
        ),
        const SizedBox(height: CoffeeSpacing.lg),
        Text(
          strings.accountGuestTitle,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: CoffeeSpacing.sm),
        Text(
          strings.accountGuestBody,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: CoffeeSpacing.xl),
        FilledButton(
          onPressed: () => context.push('/auth/register'),
          child: Text(strings.createAccount),
        ),
        const SizedBox(height: CoffeeSpacing.sm),
        OutlinedButton(
          onPressed: () => context.push('/auth/login'),
          child: Text(strings.login),
        ),
      ],
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.profile});

  final CustomerProfile profile;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          radius: 30,
          backgroundColor: CoffeeColors.surfaceBlue,
          foregroundColor: CoffeeColors.deep,
          child: Text(
            profile.initials,
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20),
          ),
        ),
        const SizedBox(width: CoffeeSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                profile.fullName,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: CoffeeSpacing.xxs),
              Row(
                children: [
                  const Icon(
                    Icons.verified_outlined,
                    size: 18,
                    color: CoffeeColors.success,
                  ),
                  const SizedBox(width: CoffeeSpacing.xxs),
                  Flexible(
                    child: Text(
                      profile.phone,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _MemberCard extends StatelessWidget {
  const _MemberCard({required this.profile, this.membership, this.onTap});

  final CustomerProfile profile;
  final MembershipSummary? membership;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final year = profile.memberSince.year;
    final summary = membership;
    final tier = summary?.currentTier;

    if (summary == null) {
      return Card(
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(CoffeeRadius.card),
          child: Padding(
            padding: const EdgeInsets.all(CoffeeSpacing.md),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: CoffeeColors.primary,
                    borderRadius: BorderRadius.circular(CoffeeRadius.control),
                  ),
                  child: const Icon(
                    Icons.local_cafe_outlined,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: CoffeeSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        strings.baseMember,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: CoffeeSpacing.xxs),
                      Text(
                        '${strings.memberSince} $year',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
                if (onTap != null)
                  const Icon(
                    Icons.chevron_right,
                    color: CoffeeColors.textSecondary,
                  ),
              ],
            ),
          ),
        ),
      );
    }

    return MembershipVisualCard(
      tierName: tier?.name ?? strings.baseMember,
      rank: tier?.rank ?? 1,
      memberName: profile.fullName,
      supportingText: summary.nextTier == null
          ? '${strings.memberSince} $year'
          : strings.nextTierProgress(
              _formatSpend(
                summary.currency,
                summary.remainingToNextTier,
              ),
              summary.nextTier!.name,
            ),
      onTap: onTap,
    );
  }

  String _formatSpend(String currency, int amount) {
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
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(
        left: CoffeeSpacing.xs,
        bottom: CoffeeSpacing.xs,
      ),
      child: Text(
        title.toUpperCase(),
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
          color: CoffeeColors.textSecondary,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _AccountTile extends StatelessWidget {
  const _AccountTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: Icon(icon, color: CoffeeColors.textPrimary),
      title: Text(title),
      subtitle: subtitle == null ? null : Text(subtitle!),
      trailing: onTap == null
          ? null
          : const Icon(Icons.chevron_right, color: CoffeeColors.textSecondary),
      contentPadding: const EdgeInsets.symmetric(horizontal: CoffeeSpacing.xs),
    );
  }
}
