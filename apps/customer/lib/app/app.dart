import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n/app_language.dart';
import '../l10n/locale_controller.dart';
import 'router.dart';
import 'theme.dart';

class FusionifyCoffeeApp extends ConsumerWidget {
  const FusionifyCoffeeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final language =
        ref.watch(localeControllerProvider).value ?? AppLanguage.indonesia;

    return MaterialApp.router(
      title: 'Fusionify Coffee',
      debugShowCheckedModeBanner: false,
      theme: buildFusionifyCoffeeTheme(),
      themeMode: ThemeMode.light,
      locale: language.locale,
      supportedLocales: [
        for (final language in AppLanguage.values) language.locale,
      ],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      routerConfig: appRouter,
    );
  }
}
