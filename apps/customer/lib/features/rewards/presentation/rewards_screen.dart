import 'package:flutter/material.dart';

import '../../../app/theme.dart';

class RewardsScreen extends StatelessWidget {
  const RewardsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const SafeArea(
      child: Center(
        child: Padding(
          padding: EdgeInsets.all(CoffeeSpacing.xl),
          child: Text(
            'Fusion Points belum aktif. Rewards mulai setelah order flow stabil.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
