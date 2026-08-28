import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_language.dart';
import '../../../l10n/app_strings.dart';
import '../../../l10n/locale_controller.dart';
import '../../auth/application/auth_controller.dart';

class LanguageScreen extends ConsumerWidget {
  const LanguageScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current =
        ref.watch(localeControllerProvider).value ?? AppLanguage.indonesia;
    final strings = context.strings;

    return Scaffold(
      appBar: AppBar(title: Text(strings.language)),
      body: ListView(
        padding: const EdgeInsets.all(CoffeeSpacing.md),
        children: [
          Text(
            strings.selectLanguage,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: CoffeeSpacing.md),
          for (final language in AppLanguage.values)
            RadioListTile<AppLanguage>(
              value: language,
              groupValue: current,
              title: Text(language.label),
              onChanged: (value) async {
                if (value == null) return;

                await ref
                    .read(localeControllerProvider.notifier)
                    .setLanguage(value);

                try {
                  await ref
                      .read(authControllerProvider.notifier)
                      .syncLanguage(value);
                } catch (_) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Language changed on this device. Account sync will retry later.',
                        ),
                      ),
                    );
                  }
                }
              },
            ),
        ],
      ),
    );
  }
}
