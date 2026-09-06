import 'dart:io';

import 'package:flutter/foundation.dart';

import 'api_base_url.dart';

abstract final class ApiConfig {
  static const _explicitBaseUrl = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl {
    final fallback = !kIsWeb && Platform.isAndroid
        ? 'http://10.0.2.2:3000'
        : 'http://127.0.0.1:3000';
    return resolveApiBaseUrl(
      explicitBaseUrl: _explicitBaseUrl,
      releaseMode: kReleaseMode,
      developmentFallback: fallback,
    );
  }
}
