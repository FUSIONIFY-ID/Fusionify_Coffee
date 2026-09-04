import 'package:flutter/widgets.dart';

class FavoritesStrings {
  const FavoritesStrings(this.languageCode);

  final String languageCode;

  static FavoritesStrings of(BuildContext context) {
    return FavoritesStrings(Localizations.localeOf(context).languageCode);
  }

  String _pick(String id, String ms, String en) {
    return switch (languageCode) {
      'id' => id,
      'ms' => ms,
      _ => en,
    };
  }

  String get emptyTitle => _pick(
    'Belum ada produk favorit.',
    'Belum ada produk kegemaran.',
    'No favorite products yet.',
  );

  String get emptyBody => _pick(
    'Simpan kopi yang kamu suka supaya lebih cepat ditemukan lagi.',
    'Simpan kopi yang anda suka supaya lebih cepat ditemui semula.',
    'Save drinks you love so they are easier to find again.',
  );

  String get signInRequired => _pick(
    'Masuk untuk menyimpan produk favorit.',
    'Log masuk untuk menyimpan produk kegemaran.',
    'Log in to save favorite products.',
  );

  String get updateFailed => _pick(
    'Favorit belum bisa diperbarui. Coba lagi.',
    'Kegemaran belum dapat dikemas kini. Cuba lagi.',
    'Favorites could not be updated. Try again.',
  );
}

extension FavoritesStringsContext on BuildContext {
  FavoritesStrings get favoriteStrings => FavoritesStrings.of(this);
}
