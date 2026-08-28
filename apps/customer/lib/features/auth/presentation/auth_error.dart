import 'package:dio/dio.dart';

import '../../../l10n/app_strings.dart';

String authErrorMessage(Object error, AppStrings strings) {
  if (error is DioException) {
    final data = error.response?.data;
    final message = _serverMessage(data);

    if (message != null) {
      final localized = _localizedServerMessage(message, strings);
      if (localized != null) {
        return localized;
      }
    }

    if (error.response?.statusCode == 503) {
      return strings.otpDeliveryNotConfigured;
    }

    if (error.response?.statusCode == 401) {
      return strings.invalidCredentials;
    }

    return strings.serverUnavailable;
  }

  return strings.genericError;
}

String? _serverMessage(Object? data) {
  if (data is! Map<String, dynamic>) {
    return null;
  }

  final message = data['message'];
  if (message is String && message.isNotEmpty) {
    return message;
  }

  if (message is List && message.isNotEmpty) {
    return message.first.toString();
  }

  return null;
}

String? _localizedServerMessage(String message, AppStrings strings) {
  if (message.contains('already exists')) {
    return strings.accountAlreadyExists;
  }
  if (message.contains('wait before requesting another OTP')) {
    return strings.otpWaitBeforeResend;
  }
  if (message.contains('OTP has expired')) {
    return strings.otpExpired;
  }
  if (message.contains('OTP challenge is not available')) {
    return strings.otpUnavailable;
  }
  if (message.contains('OTP attempt limit')) {
    return strings.otpAttemptLimit;
  }
  if (message.contains('OTP is incorrect')) {
    return strings.otpIncorrect;
  }
  if (message.contains('valid full name')) {
    return strings.invalidFullName;
  }
  if (message.contains('Email address is invalid')) {
    return strings.invalidEmail;
  }
  if (message.contains('Password must contain')) {
    return strings.passwordRequirement;
  }
  if (message.contains('Invalid login credentials')) {
    return strings.invalidCredentials;
  }
  if (message.contains('Indonesia and Malaysia only')) {
    return strings.phoneSupportOnly;
  }

  return null;
}
