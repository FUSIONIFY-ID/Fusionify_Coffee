import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/features/orders/domain/order_history_models.dart';

void main() {
  test('parses order detail items and fulfillment timeline', () {
    final order = CustomerOrderDetail.fromJson({
      'id': 'order-1',
      'status': 'READY',
      'currency': 'IDR',
      'totalAmount': 33000,
      'createdAt': '2026-08-28T10:00:00.000Z',
      'outlet': {'name': 'Fusionify Coffee Preview Store'},
      'items': [
        {
          'productName': 'Aren Latte',
          'quantity': 1,
          'lineTotal': 33000,
          'selectedModifiers': [
            {
              'groupName': 'Size',
              'optionName': 'Large',
              'priceDelta': 5000,
            },
          ],
        },
      ],
      'payments': [
        {'status': 'PAID'},
      ],
      'statusEvents': [
        {
          'fromStatus': 'AWAITING_PAYMENT',
          'toStatus': 'CONFIRMED',
          'createdAt': '2026-08-28T10:01:00.000Z',
        },
        {
          'fromStatus': 'CONFIRMED',
          'toStatus': 'PREPARING',
          'note': 'Started.',
          'createdAt': '2026-08-28T10:02:00.000Z',
        },
        {
          'fromStatus': 'PREPARING',
          'toStatus': 'READY',
          'createdAt': '2026-08-28T10:05:00.000Z',
        },
      ],
    });

    expect(order.status, 'READY');
    expect(order.outletName, 'Fusionify Coffee Preview Store');
    expect(order.paymentStatus, 'PAID');
    expect(order.items.single.selectedModifiers.single.optionName, 'Large');
    expect(order.statusEvents.length, 3);
    expect(order.statusEvents.last.toStatus, 'READY');
    expect(order.statusEvents[1].note, 'Started.');
  });
}
