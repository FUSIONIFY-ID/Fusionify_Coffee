import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../l10n/app_language.dart';
import '../../l10n/locale_controller.dart';
import '../storage/secure_store.dart';
import 'api_config.dart';

final dioProvider = Provider<Dio>((ref) {
  final store = ref.watch(secureStoreProvider);
  final language =
      ref.watch(localeControllerProvider).value ?? AppLanguage.indonesia;
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 5),
      receiveTimeout: const Duration(seconds: 8),
      sendTimeout: const Duration(seconds: 5),
      headers: {
        'Accept': 'application/json',
        'Accept-Language': language.httpLanguageTag,
      },
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final accessToken = await store.readAccessToken();
        if (accessToken != null && accessToken.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $accessToken';
        }
        handler.next(options);
      },
    ),
  );

  ref.onDispose(() => dio.close(force: true));
  return dio;
});
