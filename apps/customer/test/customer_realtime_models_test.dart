import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/core/realtime/customer_realtime_models.dart';

void main() {
  test('parses account realtime snapshot and locates payment', () {
    final snapshot = CustomerRealtimeSnapshot.fromJson({
      'signature': 'sig-1',
      'generatedAt': '2026-09-04T12:00:00.000Z',
      'orders': [
        {
          'id': 'order-1',
          'status': 'CONFIRMED',
          'updatedAt': '2026-09-04T12:00:00.000Z',
          'payments': [
            {
              'id': 'payment-1',
              'orderId': 'order-1',
              'provider': 'AUTOGOPAY',
              'channel': 'GOPAY_QRIS',
              'status': 'PAID',
              'amount': 28000.0,
              'currency': 'IDR',
              'providerRawStatus': 'PAID',
            },
          ],
        },
      ],
    });

    expect(snapshot.signature, 'sig-1');
    expect(snapshot.orderById('order-1')?.status, 'CONFIRMED');
    expect(snapshot.paymentById('payment-1')?.status, 'PAID');
    expect(snapshot.paymentById('payment-1')?.amount, 28000);
    expect(
      CustomerRealtimeSnapshot.fromJson(const {}).generatedAt,
      DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
    );
  });
}
