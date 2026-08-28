import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/app/theme.dart';
import 'package:fusionify_coffee/features/account/presentation/account_screen.dart';
import 'package:fusionify_coffee/features/auth/domain/auth_models.dart';

void main() {
  testWidgets('renders Indonesian Fusionify account profile', (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final profile = CustomerProfile(
      id: 'preview-user',
      fullName: 'Muhammad Jundy Rabbani',
      phoneCountry: 'ID',
      phone: '+62 812••••7890',
      phoneVerified: true,
      preferredLanguage: 'ID_ID',
      memberSince: DateTime(2026, 8, 28),
      email: 'jundy@example.com',
    );

    await tester.pumpWidget(
      MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: buildFusionifyCoffeeTheme(),
        locale: const Locale('id'),
        supportedLocales: const [
          Locale('id'),
          Locale('ms'),
          Locale('en'),
        ],
        localizationsDelegates: GlobalMaterialLocalizations.delegates,
        home: Scaffold(
          body: SafeArea(
            child: AccountHubView(
              profile: profile,
              onOrders: () {},
              onPersonalInfo: () {},
              onLanguage: () {},
              onSecurity: () {},
              onLogout: () {},
            ),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Muhammad Jundy Rabbani'), findsOneWidget);
    expect(find.text('Bahasa Indonesia'), findsOneWidget);
    expectLater(
      find.byType(Scaffold),
      matchesGoldenFile('goldens/account_profile_id.png'),
    );
  });
}
