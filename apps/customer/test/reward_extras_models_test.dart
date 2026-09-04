import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/features/rewards/domain/reward_extras_models.dart';

void main() {
  test('parses localized voucher wallet entry', () {
    final entry = CustomerVoucherWalletEntry.fromJson({
      'id': 'cv-1',
      'status': 'AVAILABLE',
      'source': 'STAFF',
      'issuedAt': '2026-09-04T10:00:00.000Z',
      'usable': true,
      'voucher': {
        'code': 'WELCOME20',
        'title': '20% off',
        'description': 'Welcome voucher',
        'currency': 'IDR',
        'discountType': 'PERCENTAGE_BPS',
        'discountValue': 2000,
        'minimumSpend': 40000,
        'active': true,
        'validFrom': '2026-09-01T00:00:00.000Z',
        'validUntil': '2026-10-01T00:00:00.000Z',
      },
    });

    expect(entry.usable, isTrue);
    expect(entry.voucher.code, 'WELCOME20');
    expect(entry.voucher.discountValue, 2000);
  });

  test('parses Wi-Fi digital benefit payload safely', () {
    final benefit = DigitalBenefitEntitlement.fromJson({
      'id': 'benefit-1',
      'type': 'WIFI',
      'active': true,
      'validFrom': '2026-09-04T10:00:00.000Z',
      'validUntil': '2026-09-04T22:00:00.000Z',
      'quotaUsed': 0,
      'payload': {'ssid': 'Fusionify Coffee', 'password': 'secret'},
      'order': {
        'id': 'order-1',
        'createdAt': '2026-09-04T10:00:00.000Z',
        'outlet': {'id': 'outlet-1', 'name': 'Fusionify Coffee Preview'},
      },
    });

    expect(benefit.ssid, 'Fusionify Coffee');
    expect(benefit.password, 'secret');
    expect(benefit.order.outletName, 'Fusionify Coffee Preview');
  });
}
