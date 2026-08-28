import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/l10n/app_strings.dart';

void main() {
  group('AppStrings', () {
    test('returns Indonesian customer copy', () {
      const strings = AppStrings('id');

      expect(strings.home, 'Beranda');
      expect(strings.cart, 'Keranjang');
      expect(strings.paymentReceived, 'Pembayaran diterima');
      expect(strings.signInBeforeCheckout, 'Masuk sebelum checkout');
    });

    test('returns Malay customer copy', () {
      const strings = AppStrings('ms');

      expect(strings.home, 'Utama');
      expect(strings.cart, 'Troli');
      expect(strings.paymentReceived, 'Pembayaran diterima');
      expect(strings.signInBeforeCheckout, 'Log masuk sebelum checkout');
    });

    test('returns English customer copy', () {
      const strings = AppStrings('en');

      expect(strings.home, 'Home');
      expect(strings.cart, 'Cart');
      expect(strings.paymentReceived, 'Payment received');
      expect(strings.signInBeforeCheckout, 'Sign in before checkout');
    });
  });
}
