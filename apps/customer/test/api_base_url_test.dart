import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/core/network/api_base_url.dart';

void main() {
  const developmentFallback = 'http://10.0.2.2:3000';

  test('uses the local fallback only outside release mode', () {
    expect(
      resolveApiBaseUrl(
        explicitBaseUrl: '',
        releaseMode: false,
        developmentFallback: developmentFallback,
      ),
      developmentFallback,
    );
  });

  test('requires an explicit API URL in release mode', () {
    expect(
      () => resolveApiBaseUrl(
        explicitBaseUrl: '',
        releaseMode: true,
        developmentFallback: developmentFallback,
      ),
      throwsStateError,
    );
  });

  test('requires HTTPS and a non-local host in release mode', () {
    for (final value in [
      'http://api.fusionify.id',
      'https://127.0.0.1:3000',
      'https://localhost:3000',
      'https://10.0.2.2:3000',
      'https://api.invalid',
      'https://example.com',
    ]) {
      expect(
        () => resolveApiBaseUrl(
          explicitBaseUrl: value,
          releaseMode: true,
          developmentFallback: developmentFallback,
        ),
        throwsStateError,
        reason: value,
      );
    }
  });

  test('normalizes a valid release URL', () {
    expect(
      resolveApiBaseUrl(
        explicitBaseUrl: ' https://api.fusionify.id/ ',
        releaseMode: true,
        developmentFallback: developmentFallback,
      ),
      'https://api.fusionify.id',
    );
  });

  test('rejects credentials, query strings, and fragments', () {
    for (final value in [
      'https://user:password@api.fusionify.id',
      'https://api.fusionify.id?token=value',
      'https://api.fusionify.id#fragment',
    ]) {
      expect(
        () => resolveApiBaseUrl(
          explicitBaseUrl: value,
          releaseMode: true,
          developmentFallback: developmentFallback,
        ),
        throwsStateError,
        reason: value,
      );
    }
  });
}
