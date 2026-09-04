import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/features/checkout/domain/checkout_models.dart';

void main() {
  test('parses authoritative voucher discount and zero-payment order', () {
    final order = CheckoutOrder.fromJson({
      'id': 'order-1',
      'status': 'CONFIRMED',
      'currency': 'IDR',
      'subtotal': 50000,
      'discountAmount': 50000,
      'deliveryFee': 0,
      'totalAmount': 0,
    });

    expect(order.discountAmount, 50000);
    expect(order.totalAmount, 0);
    expect(order.requiresPayment, isFalse);
  });

  test('requires payment only for positive awaiting-payment orders', () {
    final order = CheckoutOrder.fromJson({
      'id': 'order-2',
      'status': 'AWAITING_PAYMENT',
      'currency': 'IDR',
      'subtotal': 56000,
      'discountAmount': 6000,
      'deliveryFee': 0,
      'totalAmount': 50000,
    });

    expect(order.requiresPayment, isTrue);
  });
}
