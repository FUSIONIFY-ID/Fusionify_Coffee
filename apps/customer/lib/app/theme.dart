import 'package:flutter/material.dart';

abstract final class CoffeeColors {
  static const primary = Color(0xFF0D6CD7);
  static const deep = Color(0xFF0261CC);
  static const supporting = Color(0xFF539DE9);

  static const background = Color(0xFFF8F8F6);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceWarm = Color(0xFFF3EEE7);
  static const surfaceBlue = Color(0xFFE8F2FD);

  static const textPrimary = Color(0xFF181816);
  static const textSecondary = Color(0xFF66645F);
  static const border = Color(0xFFE5E3DE);

  static const success = Color(0xFF237A49);
  static const warning = Color(0xFFA6610A);
  static const error = Color(0xFFB3261E);
}

abstract final class CoffeeSpacing {
  static const xxs = 4.0;
  static const xs = 8.0;
  static const sm = 12.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
  static const xxl = 40.0;
  static const xxxl = 48.0;
}

abstract final class CoffeeRadius {
  static const small = 8.0;
  static const control = 12.0;
  static const card = 16.0;
  static const sheet = 24.0;
}

ThemeData buildFusionifyCoffeeTheme() {
  final generatedScheme = ColorScheme.fromSeed(
    seedColor: CoffeeColors.primary,
    brightness: Brightness.light,
  );

  final scheme = generatedScheme.copyWith(
    primary: CoffeeColors.primary,
    onPrimary: Colors.white,
    secondary: CoffeeColors.supporting,
    onSecondary: Colors.white,
    surface: CoffeeColors.surface,
    onSurface: CoffeeColors.textPrimary,
    outline: CoffeeColors.border,
    error: CoffeeColors.error,
    onError: Colors.white,
  );

  final textTheme = Typography.material2021().black.apply(
    bodyColor: CoffeeColors.textPrimary,
    displayColor: CoffeeColors.textPrimary,
  );

  final controlShape = RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(CoffeeRadius.control),
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: CoffeeColors.background,
    textTheme: textTheme.copyWith(
      headlineLarge: textTheme.headlineLarge?.copyWith(
        fontWeight: FontWeight.w700,
        height: 1.08,
      ),
      headlineSmall: textTheme.headlineSmall?.copyWith(
        fontWeight: FontWeight.w700,
      ),
      titleLarge: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
      titleMedium: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
      bodyMedium: textTheme.bodyMedium?.copyWith(
        color: CoffeeColors.textSecondary,
      ),
      labelLarge: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: CoffeeColors.background,
      foregroundColor: CoffeeColors.textPrimary,
      surfaceTintColor: Colors.transparent,
      centerTitle: false,
      elevation: 0,
      scrolledUnderElevation: 0,
    ),
    cardTheme: CardThemeData(
      color: CoffeeColors.surface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        side: const BorderSide(color: CoffeeColors.border),
        borderRadius: BorderRadius.circular(CoffeeRadius.card),
      ),
    ),
    dividerTheme: const DividerThemeData(
      color: CoffeeColors.border,
      thickness: 1,
      space: 1,
    ),
    navigationBarTheme: const NavigationBarThemeData(
      height: 72,
      backgroundColor: CoffeeColors.surface,
      indicatorColor: CoffeeColors.surfaceBlue,
      surfaceTintColor: Colors.transparent,
      labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
    ),
    navigationRailTheme: const NavigationRailThemeData(
      backgroundColor: CoffeeColors.surface,
      indicatorColor: CoffeeColors.surfaceBlue,
      useIndicator: true,
      groupAlignment: -0.65,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        shape: controlShape,
        textStyle: const TextStyle(fontWeight: FontWeight.w700),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(48),
        shape: controlShape,
        side: const BorderSide(color: CoffeeColors.border),
        foregroundColor: CoffeeColors.textPrimary,
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: CoffeeColors.deep,
        textStyle: const TextStyle(fontWeight: FontWeight.w700),
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: CoffeeColors.surface,
      selectedColor: CoffeeColors.surfaceBlue,
      side: const BorderSide(color: CoffeeColors.border),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(CoffeeRadius.control),
      ),
      labelStyle: const TextStyle(color: CoffeeColors.textPrimary),
      secondaryLabelStyle: const TextStyle(
        color: CoffeeColors.deep,
        fontWeight: FontWeight.w700,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: CoffeeColors.surface,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(CoffeeRadius.control),
        borderSide: const BorderSide(color: CoffeeColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(CoffeeRadius.control),
        borderSide: const BorderSide(color: CoffeeColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(CoffeeRadius.control),
        borderSide: const BorderSide(color: CoffeeColors.primary, width: 2),
      ),
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: CoffeeColors.surface,
      surfaceTintColor: Colors.transparent,
      showDragHandle: true,
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: CoffeeColors.textPrimary,
      contentTextStyle: const TextStyle(color: Colors.white),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(CoffeeRadius.control),
      ),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: CoffeeColors.primary,
      linearTrackColor: CoffeeColors.surfaceBlue,
    ),
  );
}
