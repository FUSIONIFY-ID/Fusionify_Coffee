import 'package:flutter/material.dart';

abstract final class CoffeeColors {
  static const primary = Color(0xFF0D6CD7);
  static const deep = Color(0xFF0261CC);
  static const supporting = Color(0xFF539DE9);
  static const background = Color(0xFFF8F8F6);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceWarm = Color(0xFFF3EEE7);
  static const textPrimary = Color(0xFF181816);
  static const textSecondary = Color(0xFF66645F);
  static const border = Color(0xFFE5E3DE);
  static const error = Color(0xFFB3261E);
}

abstract final class CoffeeSpacing {
  static const xxs = 4.0;
  static const xs = 8.0;
  static const sm = 12.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
}

abstract final class CoffeeRadius {
  static const small = 8.0;
  static const control = 12.0;
  static const card = 16.0;
}

ThemeData buildFusionifyCoffeeTheme() {
  const scheme = ColorScheme.light(
    primary: CoffeeColors.primary,
    onPrimary: Colors.white,
    secondary: CoffeeColors.supporting,
    onSecondary: Colors.white,
    surface: CoffeeColors.surface,
    onSurface: CoffeeColors.textPrimary,
    error: CoffeeColors.error,
    onError: Colors.white,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: CoffeeColors.background,
    cardTheme: const CardThemeData(
      color: CoffeeColors.surface,
      elevation: 0,
      margin: EdgeInsets.zero,
    ),
    dividerTheme: const DividerThemeData(
      color: CoffeeColors.border,
      thickness: 1,
    ),
    navigationBarTheme: const NavigationBarThemeData(
      backgroundColor: CoffeeColors.surface,
      indicatorColor: Color(0xFFE8F2FD),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(CoffeeRadius.control),
        ),
        textStyle: const TextStyle(fontWeight: FontWeight.w700),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(48),
        side: const BorderSide(color: CoffeeColors.border),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(CoffeeRadius.control),
        ),
      ),
    ),
  );
}
