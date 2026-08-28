import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/features/checkout/domain/checkout_models.dart';

void main() {
  test('parses payment response and provider expiry', () {
    final payment = PaymentView.fromJson({
      'id': 'pay-1',
      'orderId': 'order-1',
      'provider': 'AUTOGOPAY',
      'channel': 'GOPAY_QRIS',
      'status': 'PENDING',
      'amount': 28000,
      'currency': 'IDR',
      'qrString': '000201-test',
      'expiryTime': '2026-08-28 15:00:00',
    });

    expect(payment.isPending, isTrue);
    expect(payment.isTerminal, isFalse);
    expect(payment.qrString, '000201-test');
    expect(payment.expiresAt, isNotNull);
    expect(payment.expiresAt!.toUtc().hour, 8);
  });

  test('paid payment is terminal', () {
    final payment = PaymentView.fromJson({
      'id': 'pay-1',
      'orderId': 'order-1',
      'provider': 'AUTOGOPAY',
      'channel': 'GOPAY_QRIS',
      'status': 'PAID',
      'amount': 28000,
      'currency': 'IDR',
    });

    expect(payment.isPaid, isTrue);
    expect(payment.isTerminal, isTrue);
  });
}
