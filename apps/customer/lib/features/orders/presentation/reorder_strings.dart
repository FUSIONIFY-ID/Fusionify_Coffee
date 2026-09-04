import 'package:flutter/widgets.dart';

class ReorderStrings {
  const ReorderStrings(this.languageCode);

  final String languageCode;

  static ReorderStrings of(BuildContext context) {
    return ReorderStrings(Localizations.localeOf(context).languageCode);
  }

  String _pick(String id, String ms, String en) {
    return switch (languageCode) {
      'id' => id,
      'ms' => ms,
      _ => en,
    };
  }

  String get unavailable => _pick(
    'Pesanan lama sudah berubah. Buka produk terkait dan pilih konfigurasi yang tersedia sekarang.',
    'Pesanan lama telah berubah. Buka produk berkaitan dan pilih konfigurasi yang tersedia sekarang.',
    'This previous order has changed. Open the affected products and choose a currently available configuration.',
  );

  String get addedToCart => _pick(
    'Pesanan ditambahkan ke keranjang dengan harga saat ini.',
    'Pesanan ditambah ke troli dengan harga semasa.',
    'Order added to cart using current prices.',
  );

  String get currentPricingNotice => _pick(
    'Harga dan ketersediaan mengikuti menu saat ini.',
    'Harga dan ketersediaan mengikut menu semasa.',
    'Prices and availability follow the current menu.',
  );
}

extension ReorderStringsContext on BuildContext {
  ReorderStrings get reorderStrings => ReorderStrings.of(this);
}
