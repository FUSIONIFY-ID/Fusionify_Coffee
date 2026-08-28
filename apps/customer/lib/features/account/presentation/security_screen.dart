import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_strings.dart';
import '../../auth/application/auth_controller.dart';

class SecurityScreen extends ConsumerWidget {
  const SecurityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(authControllerProvider).value;
    final strings = context.strings;

    return Scaffold(
      appBar: AppBar(title: Text(strings.security)),
      body: ListView(
        padding: const EdgeInsets.all(CoffeeSpacing.md),
        children: [
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.phone_android_outlined),
            title: Text(strings.phoneVerified),
            subtitle: Text(profile?.phone ?? '—'),
            trailing: const Icon(Icons.verified, color: CoffeeColors.success),
            onTap: () => context.push('/account/change-phone'),
          ),
          const Divider(),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.password_outlined),
            title: Text(strings.password),
            subtitle: Text(strings.passwordAuthenticationEnabled),
            onTap: () => context.push('/auth/forgot-password'),
          ),
          const Divider(),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.devices_outlined),
            title: Text(strings.activeDevices),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/account/sessions'),
          ),
          const SizedBox(height: CoffeeSpacing.xl),
          OutlinedButton.icon(
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).logoutAll();
              if (context.mounted) context.go('/account');
            },
            icon: const Icon(Icons.phonelink_erase_outlined),
            label: Text(strings.logoutAll),
          ),
          const SizedBox(height: CoffeeSpacing.lg),
          TextButton.icon(
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
            ),
            onPressed: () => context.push('/account/delete'),
            icon: const Icon(Icons.delete_forever_outlined),
            label: Text(strings.deleteAccount),
          ),
        ],
      ),
    );
  }
}
