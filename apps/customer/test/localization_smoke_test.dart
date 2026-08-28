import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/l10n/app_language.dart';
import 'package:fusionify_coffee/l10n/app_strings.dart';

void main() {
  test('maps supported locales to API and HTTP language values', () {
    expect(AppLanguage.indonesia.locale.toLanguageTag(), 'id-ID');
    expect(AppLanguage.indonesia.apiValue, 'ID_ID');
    expect(AppLanguage.indonesia.httpLanguageTag, 'id-ID');

    expect(AppLanguage.malaysia.locale.toLanguageTag(), 'ms-MY');
    expect(AppLanguage.malaysia.apiValue, 'MS_MY');
    expect(AppLanguage.malaysia.httpLanguageTag, 'ms-MY');

    expect(AppLanguage.english.locale.toLanguageTag(), 'en');
    expect(AppLanguage.english.apiValue, 'EN');
    expect(AppLanguage.english.httpLanguageTag, 'en');
  });

  test('core customer copy is available in all supported languages', () {
    const indonesia = AppStrings('id');
    const malaysia = AppStrings('ms');
    const english = AppStrings('en');

    expect(indonesia.home, 'Beranda');
    expect(malaysia.account, 'Akaun');
    expect(english.checkout, 'Checkout');

    expect(indonesia.coffeePrompt, isNotEmpty);
    expect(malaysia.coffeePrompt, isNotEmpty);
    expect(english.coffeePrompt, isNotEmpty);

    expect(indonesia.signInBeforeCheckout, isNotEmpty);
    expect(malaysia.signInBeforeCheckout, isNotEmpty);
    expect(english.signInBeforeCheckout, isNotEmpty);

    expect(indonesia.paymentReceived, isNotEmpty);
    expect(malaysia.paymentReceived, isNotEmpty);
    expect(english.paymentReceived, isNotEmpty);
  });
}
