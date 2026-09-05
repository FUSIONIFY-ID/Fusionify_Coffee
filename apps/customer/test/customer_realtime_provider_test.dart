import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/core/realtime/customer_realtime_provider.dart';

void main() {
  test('uses capped exponential reconnect delays', () {
    expect(customerRealtimeReconnectDelay(0), const Duration(seconds: 1));
    expect(customerRealtimeReconnectDelay(1), const Duration(seconds: 1));
    expect(customerRealtimeReconnectDelay(2), const Duration(seconds: 2));
    expect(customerRealtimeReconnectDelay(3), const Duration(seconds: 4));
    expect(customerRealtimeReconnectDelay(4), const Duration(seconds: 8));
    expect(customerRealtimeReconnectDelay(5), const Duration(seconds: 16));
    expect(customerRealtimeReconnectDelay(6), const Duration(seconds: 30));
    expect(customerRealtimeReconnectDelay(20), const Duration(seconds: 30));
  });
}
