import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/features/receipts/domain/digital_receipt.dart';

void main() {
  test('parses authoritative digital receipt totals and benefit ids', () {
    final receipt = DigitalReceipt.fromJson({
      'orderId': 'order-1',
      'createdAt': '2026-09-04T10:00:00.000Z',
      'status': 'COMPLETED',
      'fulfillmentType': 'PICKUP',
      'outlet': {'id': 'outlet-1', 'name': 'Fusionify Coffee Preview'},
      'currency': 'IDR',
      'subtotal': 60000,
      'discountAmount': 10000,
      'deliveryFee': 0,
      'totalAmount': 50000,
      'items': [
        {
          'productName': 'Aren Latte',
          'quantity': 2,
          'unitPrice': 30000,
          'lineTotal': 60000,
          'selectedModifiers': [
            {'optionName': 'Iced'},
          ],
        },
      ],
      'payment': {'status': 'PAID', 'channel': 'GOPAY_QRIS', 'amount': 50000},
      'voucher': {'code': 'WELCOME'},
      'benefitIds': ['wifi-1', 'ai-1'],
    });

    expect(receipt.totalAmount, 50000);
    expect(receipt.discountAmount, 10000);
    expect(receipt.items.single.modifiers.single.optionName, 'Iced');
    expect(receipt.payment?.status, 'PAID');
    expect(receipt.voucherCode, 'WELCOME');
    expect(receipt.benefitIds, hasLength(2));
  });
}
