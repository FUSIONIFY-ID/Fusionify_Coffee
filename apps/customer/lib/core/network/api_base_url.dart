String resolveApiBaseUrl({
  required String explicitBaseUrl,
  required bool releaseMode,
  required String developmentFallback,
}) {
  final explicit = explicitBaseUrl.trim();
  if (explicit.isEmpty) {
    if (releaseMode) {
      throw StateError('API_BASE_URL is required for release builds.');
    }
    return developmentFallback;
  }

  final normalized = explicit.replaceFirst(RegExp(r'/+$'), '');
  final uri = Uri.tryParse(normalized);
  if (uri == null ||
      !uri.hasScheme ||
      uri.host.isEmpty ||
      (uri.scheme != 'http' && uri.scheme != 'https') ||
      uri.userInfo.isNotEmpty ||
      uri.hasQuery ||
      uri.hasFragment) {
    throw StateError('API_BASE_URL must be a valid HTTP(S) base URL.');
  }

  if (releaseMode) {
    if (uri.scheme != 'https') {
      throw StateError('Release API_BASE_URL must use HTTPS.');
    }
    if (_isLocalOrReservedHost(uri.host)) {
      throw StateError(
        'Release API_BASE_URL cannot use a local or reserved host.',
      );
    }
  }

  return normalized;
}

bool _isLocalOrReservedHost(String host) {
  final normalized = host.toLowerCase();
  return normalized == 'localhost' ||
      normalized.endsWith('.localhost') ||
      normalized == '0.0.0.0' ||
      normalized == '::1' ||
      normalized.startsWith('127.') ||
      normalized == '10.0.2.2' ||
      normalized.endsWith('.invalid') ||
      normalized.endsWith('.example') ||
      normalized.endsWith('.test') ||
      const {'example.com', 'example.net', 'example.org'}.contains(normalized);
}
