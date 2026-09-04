import 'dart:convert';

import 'package:dio/dio.dart';

import 'customer_realtime_models.dart';

class CustomerRealtimeRepository {
  const CustomerRealtimeRepository(this._dio);

  final Dio _dio;

  Stream<CustomerRealtimeSnapshot> watchAccount() async* {
    final response = await _dio.get<ResponseBody>(
      '/v1/orders/events',
      options: Options(
        responseType: ResponseType.stream,
        receiveTimeout: Duration.zero,
        headers: const {'Accept': 'text/event-stream'},
      ),
    );
    final body = response.data;
    if (body == null) {
      throw StateError('Customer realtime response is empty.');
    }

    var eventType = 'message';
    final dataLines = <String>[];

    await for (final line in body.stream
        .transform(utf8.decoder)
        .transform(const LineSplitter())) {
      if (line.isEmpty) {
        if (eventType == 'account' && dataLines.isNotEmpty) {
          final decoded = jsonDecode(dataLines.join('\n'));
          if (decoded is Map<String, dynamic>) {
            yield CustomerRealtimeSnapshot.fromJson(decoded);
          } else if (decoded is Map) {
            yield CustomerRealtimeSnapshot.fromJson(
              Map<String, dynamic>.from(decoded),
            );
          }
        }
        eventType = 'message';
        dataLines.clear();
        continue;
      }

      if (line.startsWith(':')) {
        continue;
      }
      if (line.startsWith('event:')) {
        eventType = line.substring(6).trim();
        continue;
      }
      if (line.startsWith('data:')) {
        dataLines.add(line.substring(5).trimLeft());
      }
    }
  }
}
