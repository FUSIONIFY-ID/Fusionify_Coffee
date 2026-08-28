import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_strings.dart';
import '../../auth/application/auth_controller.dart';

class PersonalInformationScreen extends ConsumerWidget {
  const PersonalInformationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(authControllerProvider).value;
    final strings = context.strings;

    return Scaffold(
      appBar: AppBar(title: Text(strings.personalInformation)),
      body: profile == null
          ? Center(child: Text(strings.accountSessionUnavailable))
          : ListView(
              padding: const EdgeInsets.all(CoffeeSpacing.md),
              children: [
                _InfoRow(label: strings.fullName, value: profile.fullName),
                _InfoRow(
                  label: strings.phoneVerified,
                  value: profile.phone,
                  verified: profile.phoneVerified,
                ),
                _InfoRow(
                  label: strings.email,
                  value: profile.email ?? '—',
                ),
                _InfoRow(
                  label: strings.country,
                  value: profile.phoneCountry == 'MY' ? strings.malaysia : strings.indonesia,
                ),
              ],
            ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.label,
    required this.value,
    this.verified = false,
  });

  final String label;
  final String value;
  final bool verified;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label),
      subtitle: Text(value),
      trailing: verified
          ? const Icon(Icons.verified, color: CoffeeColors.success)
          : null,
    );
  }
}
