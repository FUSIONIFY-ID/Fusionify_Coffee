import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_strings.dart';
import '../../../l10n/reward_extras_strings.dart';
import 'benefits_screen.dart';
import 'rewards_screen.dart';
import 'vouchers_screen.dart';

class RewardsHubScreen extends StatelessWidget {
  const RewardsHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;

    return DefaultTabController(
      length: 3,
      child: Column(
        children: [
          Material(
            color: Theme.of(context).colorScheme.surface,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(
                CoffeeSpacing.md,
                CoffeeSpacing.sm,
                CoffeeSpacing.md,
                0,
              ),
              child: TabBar(
                tabs: [
                  Tab(text: strings.pointsTab),
                  Tab(text: strings.voucherTab),
                  Tab(text: strings.benefitsTab),
                ],
              ),
            ),
          ),
          const Expanded(
            child: TabBarView(
              children: [RewardsScreen(), VouchersScreen(), BenefitsScreen()],
            ),
          ),
        ],
      ),
    );
  }
}
