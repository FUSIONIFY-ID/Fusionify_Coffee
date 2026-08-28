import 'dart:io';

import 'package:flutter/foundation.dart';

abstract final class ApiConfig {
  static const _explicitBaseUrl = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl {
    final explicit = _explicitBaseUrl.trim();
    if (explicit.isNotEmpty) {
      return explicit.endsWith('/')
          ? explicit.substring(0, explicit.length - 1)
          : explicit;
    }

    if (kIsWeb) {
      return 'http://127.0.0.1:3000';
    }

    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3000';
    }

    return 'http://127.0.0.1:3000';
  }
}
