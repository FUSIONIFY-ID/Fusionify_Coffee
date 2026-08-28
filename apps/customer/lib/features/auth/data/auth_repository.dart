import 'package:dio/dio.dart';

import '../../../core/storage/secure_store.dart';
import '../../../l10n/app_language.dart';
import '../domain/auth_models.dart';

class AuthRepository {
  const AuthRepository(this._dio, this._store);

  final Dio _dio;
  final SecureStore _store;

  Future<OtpChallengeView> requestOtp({
    required String country,
    required String phone,
    required String channel,
    required AppLanguage language,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/v1/auth/otp/request',
      data: {
        'country': country,
        'phone': phone,
        'channel': channel,
        'language': language.apiValue,
        'purpose': 'REGISTER',
      },
    );

    return OtpChallengeView.fromJson(_requireData(response));
  }

  Future<OtpVerificationView> verifyOtp({
    required String challengeId,
    required String code,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/v1/auth/otp/verify',
      data: {
        'challengeId': challengeId,
        'code': code,
      },
    );

    return OtpVerificationView.fromJson(_requireData(response));
  }

  Future<CustomerProfile> register({
    required String challengeId,
    required String verificationToken,
    required String fullName,
    required String password,
    required AppLanguage language,
    String? email,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/v1/auth/register',
      data: {
        'challengeId': challengeId,
        'verificationToken': verificationToken,
        'fullName': fullName,
        'password': password,
        'email': email?.trim().isEmpty == true ? null : email?.trim(),
        'preferredLanguage': language.apiValue,
      },
    );

    return _saveSession(response);
  }

  Future<CustomerProfile> login({
    required String login,
    required String password,
    String? country,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/v1/auth/login',
      data: {
        'login': login,
        'password': password,
        if (country != null) 'country': country,
      },
    );

    return _saveSession(response);
  }

  Future<CustomerProfile?> restoreProfile() async {
    final token = await _store.readAccessToken();
    if (token == null) {
      return null;
    }

    try {
      final response = await _dio.get<Map<String, dynamic>>('/v1/account/me');
      return CustomerProfile.fromJson(_requireData(response));
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        await _store.clearSession();
        return null;
      }
      rethrow;
    }
  }

  Future<CustomerProfile> updateLanguage(AppLanguage language) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      '/v1/account/profile',
      data: {'preferredLanguage': language.apiValue},
    );

    return CustomerProfile.fromJson(_requireData(response));
  }

  Future<void> logout() async {
    try {
      await _dio.post<void>('/v1/auth/logout');
    } finally {
      await _store.clearSession();
    }
  }

  Future<void> logoutAll() async {
    try {
      await _dio.post<void>('/v1/auth/logout-all');
    } finally {
      await _store.clearSession();
    }
  }

  Future<CustomerProfile> _saveSession(
    Response<Map<String, dynamic>> response,
  ) async {
    final session = AuthSessionView.fromJson(_requireData(response));

    await _store.writeSession(
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    );

    return session.user;
  }

  Map<String, dynamic> _requireData(
    Response<Map<String, dynamic>> response,
  ) {
    final data = response.data;
    if (data == null) {
      throw StateError('Authentication response is empty.');
    }
    return data;
  }
}
