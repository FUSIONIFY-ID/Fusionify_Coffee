import 'package:dio/dio.dart';

String authErrorMessage(Object error) {
  if (error is DioException) {
    final data = error.response?.data;

    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is String && message.isNotEmpty) {
        return message;
      }
      if (message is List && message.isNotEmpty) {
        return message.first.toString();
      }
    }

    if (error.response?.statusCode == 503) {
      return 'OTP delivery is not configured on the server.';
    }

    return 'Unable to reach Fusionify Coffee server.';
  }

  return 'Something went wrong. Please try again.';
}
