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

  Future<String?>? refreshTask;

  Future<String?> refreshAccessToken() {
    final current = refreshTask;
    if (current != null) {
      return current;
    }

    final task = () async {
      final refreshToken = await store.readRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        return null;
      }

      final refreshDio = Dio(
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

      try {
        final response = await refreshDio.post<Map<String, dynamic>>(
          '/v1/auth/refresh',
          data: {'refreshToken': refreshToken},
        );
        final data = response.data;
        final accessToken = data?['accessToken'] as String?;
        final nextRefreshToken = data?['refreshToken'] as String?;

        if (accessToken == null ||
            accessToken.isEmpty ||
            nextRefreshToken == null ||
            nextRefreshToken.isEmpty) {
          await store.clearSession();
          return null;
        }

        await store.writeSession(
          accessToken: accessToken,
          refreshToken: nextRefreshToken,
        );
        return accessToken;
      } on DioException {
        await store.clearSession();
        return null;
      } finally {
        refreshDio.close(force: true);
      }
    }();

    refreshTask = task;
    task.whenComplete(() {
      if (identical(refreshTask, task)) {
        refreshTask = null;
      }
    });
    return task;
  }

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final accessToken = await store.readAccessToken();
        if (accessToken != null && accessToken.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $accessToken';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        final request = error.requestOptions;
        final isUnauthorized = error.response?.statusCode == 401;
        final alreadyRetried = request.extra['fusionifyAuthRetried'] == true;
        final isRefreshRequest = request.path == '/v1/auth/refresh';

        if (!isUnauthorized || alreadyRetried || isRefreshRequest) {
          handler.next(error);
          return;
        }

        final accessToken = await refreshAccessToken();
        if (accessToken == null) {
          handler.next(error);
          return;
        }

        request.extra['fusionifyAuthRetried'] = true;
        request.headers['Authorization'] = 'Bearer $accessToken';

        try {
          final response = await dio.fetch<dynamic>(request);
          handler.resolve(response);
        } on DioException catch (retryError) {
          handler.next(retryError);
        }
      },
    ),
  );

  ref.onDispose(() => dio.close(force: true));
  return dio;
});
