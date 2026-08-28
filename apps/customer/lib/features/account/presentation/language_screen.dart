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
          Card(
            child: Column(
              children: [
                for (var index = 0;
                    index < AppLanguage.values.length;
                    index++) ...[
                  _LanguageTile(
                    language: AppLanguage.values[index],
                    selected: AppLanguage.values[index] == current,
                    onTap: () => _selectLanguage(
                      context,
                      ref,
                      AppLanguage.values[index],
                    ),
                  ),
                  if (index < AppLanguage.values.length - 1) const Divider(),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _selectLanguage(
    BuildContext context,
    WidgetRef ref,
    AppLanguage language,
  ) async {
    await ref.read(localeControllerProvider.notifier).setLanguage(language);

    try {
      await ref.read(authControllerProvider.notifier).syncLanguage(language);
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
  }
}

class _LanguageTile extends StatelessWidget {
  const _LanguageTile({
    required this.language,
    required this.selected,
    required this.onTap,
  });

  final AppLanguage language;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: CoffeeSpacing.md,
        vertical: CoffeeSpacing.xs,
      ),
      title: Text(language.label),
      trailing: selected
          ? const Icon(
              Icons.check_circle,
              color: CoffeeColors.primary,
            )
          : const Icon(
              Icons.circle_outlined,
              color: CoffeeColors.textSecondary,
            ),
    );
  }
}
