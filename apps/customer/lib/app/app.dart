import 'package:flutter/material.dart';

import 'router.dart';
import 'theme.dart';

class FusionifyCoffeeApp extends StatelessWidget {
  const FusionifyCoffeeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Fusionify Coffee',
      debugShowCheckedModeBanner: false,
      theme: buildFusionifyCoffeeTheme(),
      themeMode: ThemeMode.light,
      routerConfig: appRouter,
    );
  }
}
