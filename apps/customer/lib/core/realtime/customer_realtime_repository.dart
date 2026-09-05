import 'dart:convert';

import 'package:dio/dio.dart';

import 'customer_realtime_models.dart';

const customerRealtimeInactivityTimeout = Duration(seconds: 45);

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

    yield* decodeCustomerRealtimeEvents(body.stream);
  }
}

Stream<CustomerRealtimeSnapshot> decodeCustomerRealtimeEvents(
  Stream<List<int>> byteStream, {
  Duration inactivityTimeout = customerRealtimeInactivityTimeout,
}) async* {
  var eventType = 'message';
  final dataLines = <String>[];

  final lines = byteStream
      .transform(utf8.decoder)
      .transform(const LineSplitter())
      .timeout(inactivityTimeout);

  await for (final line in lines) {
    if (line.isEmpty) {
      final snapshot = _decodeAccountEvent(eventType, dataLines);
      if (snapshot != null) {
        yield snapshot;
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

  final trailingSnapshot = _decodeAccountEvent(eventType, dataLines);
  if (trailingSnapshot != null) {
    yield trailingSnapshot;
  }
}

CustomerRealtimeSnapshot? _decodeAccountEvent(
  String eventType,
  List<String> dataLines,
) {
  if (eventType != 'account' || dataLines.isEmpty) {
    return null;
  }

  final decoded = jsonDecode(dataLines.join('\n'));
  if (decoded is Map<String, dynamic>) {
    return CustomerRealtimeSnapshot.fromJson(decoded);
  }
  if (decoded is Map) {
    return CustomerRealtimeSnapshot.fromJson(
      Map<String, dynamic>.from(decoded),
    );
  }

  throw const FormatException('Customer realtime event must be a JSON object.');
}
