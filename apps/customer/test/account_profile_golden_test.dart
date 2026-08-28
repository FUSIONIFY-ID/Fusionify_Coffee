import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/app/theme.dart';
import 'package:fusionify_coffee/features/account/presentation/account_screen.dart';
import 'package:fusionify_coffee/features/auth/domain/auth_models.dart';

void main() {
  for (final caseData in [
    (
      locale: const Locale('id'),
      preferredLanguage: 'ID_ID',
      languageLabel: 'Bahasa Indonesia',
      accountLabel: 'Akun',
      golden: 'goldens/account_profile_id.png',
    ),
    (
      locale: const Locale('ms'),
      preferredLanguage: 'MS_MY',
      languageLabel: 'Bahasa Melayu',
      accountLabel: 'Akaun',
      golden: 'goldens/account_profile_ms.png',
    ),
    (
      locale: const Locale('en'),
      preferredLanguage: 'EN',
      languageLabel: 'English',
      accountLabel: 'Account',
      golden: 'goldens/account_profile_en.png',
    ),
  ]) {
    testWidgets(
      'renders Fusionify account profile for ${caseData.locale.languageCode}',
      (tester) async {
        await tester.binding.setSurfaceSize(const Size(390, 844));
        addTearDown(() => tester.binding.setSurfaceSize(null));

        final profile = CustomerProfile(
          id: 'preview-user',
          fullName: 'Muhammad Jundy Rabbani',
          phoneCountry: 'ID',
          phone: '+62 812••••7890',
          phoneVerified: true,
          preferredLanguage: caseData.preferredLanguage,
          memberSince: DateTime(2026, 8, 28),
          email: 'jundy@example.com',
        );

        await tester.pumpWidget(
          MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: buildFusionifyCoffeeTheme(),
            locale: caseData.locale,
            supportedLocales: const [Locale('id'), Locale('ms'), Locale('en')],
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
        expect(find.text(caseData.languageLabel), findsOneWidget);
        expect(find.text(caseData.accountLabel), findsWidgets);
        expectLater(find.byType(Scaffold), matchesGoldenFile(caseData.golden));
      },
    );
  }
}
