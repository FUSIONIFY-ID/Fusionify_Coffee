import 'package:flutter/widgets.dart';

enum AppLanguage {
  indonesia('id', 'ID_ID', 'Bahasa Indonesia'),
  malaysia('ms', 'MS_MY', 'Bahasa Melayu'),
  english('en', 'EN', 'English');

  const AppLanguage(this.localeCode, this.apiValue, this.label);

  final String localeCode;
  final String apiValue;
  final String label;

  Locale get locale => Locale(localeCode);

  static AppLanguage fromLocale(Locale locale) {
    return switch (locale.languageCode) {
      'id' => AppLanguage.indonesia,
      'ms' => AppLanguage.malaysia,
      _ => AppLanguage.english,
    };
  }

  static AppLanguage fromApi(String value) {
    return switch (value) {
      'ID_ID' => AppLanguage.indonesia,
      'MS_MY' => AppLanguage.malaysia,
      _ => AppLanguage.english,
    };
  }
}
