import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/storage/secure_store.dart';
import 'app_language.dart';

final localeControllerProvider =
    AsyncNotifierProvider<LocaleController, AppLanguage>(LocaleController.new);

class LocaleController extends AsyncNotifier<AppLanguage> {
  @override
  Future<AppLanguage> build() async {
    final store = ref.read(secureStoreProvider);
    final stored = await store.readLanguage();

    if (stored != null) {
      return AppLanguage.fromApi(stored);
    }

    final deviceLocale = PlatformDispatcher.instance.locale;
    return AppLanguage.fromLocale(deviceLocale);
  }

  Future<void> setLanguage(AppLanguage language) async {
    state = AsyncData(language);
    await ref.read(secureStoreProvider).writeLanguage(language.apiValue);
  }
}
