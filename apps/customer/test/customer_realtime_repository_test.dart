import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/core/realtime/customer_realtime_repository.dart';

void main() {
  test('decodes chunked account events and ignores heartbeats', () async {
    final chunks = [
      utf8.encode(': connected\n\nevent: heartbeat\ndata: {}\n\n'),
      utf8.encode('event: account\ndata: {"signature":"sig-1","generatedAt":'),
      utf8.encode('"2026-09-05T12:00:00.000Z","orders":[]}\n\n'),
    ];

    final snapshots = await decodeCustomerRealtimeEvents(
      Stream<List<int>>.fromIterable(chunks),
    ).toList();

    expect(snapshots, hasLength(1));
    expect(snapshots.single.signature, 'sig-1');
    expect(snapshots.single.orders, isEmpty);
  });

  test('dispatches a complete trailing account event', () async {
    final chunks = [
      utf8.encode('event: account\ndata: {"signature":"sig-2","orders":[]}'),
    ];

    final snapshots = await decodeCustomerRealtimeEvents(
      Stream<List<int>>.fromIterable(chunks),
    ).toList();

    expect(snapshots.single.signature, 'sig-2');
  });

  test('times out when the SSE connection stops sending heartbeats', () async {
    final controller = StreamController<List<int>>();

    await expectLater(
      decodeCustomerRealtimeEvents(
        controller.stream,
        inactivityTimeout: const Duration(milliseconds: 20),
      ),
      emitsError(isA<TimeoutException>()),
    );

    await controller.close();
  });
}
