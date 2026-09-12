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
      expect(strings.cartWithItems(2), 'Keranjang, 2 item');
      expect(strings.showPassword, 'Tampilkan password');
      expect(strings.quantityValue(2), 'Jumlah: 2');
    });

    test('returns Malay customer copy', () {
      const strings = AppStrings('ms');

      expect(strings.home, 'Utama');
      expect(strings.cart, 'Troli');
      expect(strings.paymentReceived, 'Pembayaran diterima');
      expect(strings.signInBeforeCheckout, 'Log masuk sebelum checkout');
      expect(strings.cartWithItems(2), 'Troli, 2 item');
      expect(strings.showPassword, 'Tunjukkan kata laluan');
      expect(strings.quantityValue(2), 'Kuantiti: 2');
    });

    test('returns English customer copy', () {
      const strings = AppStrings('en');

      expect(strings.home, 'Home');
      expect(strings.cart, 'Cart');
      expect(strings.paymentReceived, 'Payment received');
      expect(strings.signInBeforeCheckout, 'Sign in before checkout');
      expect(strings.cartWithItems(1), 'Cart, 1 item');
      expect(strings.cartWithItems(2), 'Cart, 2 items');
      expect(strings.showPassword, 'Show password');
      expect(strings.quantityValue(2), 'Quantity: 2');
    });
  });
}
