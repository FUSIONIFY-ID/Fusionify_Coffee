import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/features/addresses/domain/address_models.dart';

void main() {
  test('parses saved address and delivery quote', () {
    final address = SavedAddress.fromJson({
      'id': 'addr-1',
      'label': 'Home',
      'recipientName': 'Jundy',
      'phoneE164': '+6281234567890',
      'country': 'ID',
      'line1': 'Jl. Preview 1',
      'city': 'Bogor',
      'latitude': -6.595,
      'longitude': 106.8166,
      'isDefault': true,
    });
    final quote = DeliveryQuote.fromJson({
      'serviceable': true,
      'outletId': 'preview-outlet',
      'addressId': 'addr-1',
      'distanceMeters': 800,
      'radiusMeters': 10000,
      'fee': 7000,
      'currency': 'IDR',
    });

    expect(address.phoneE164, '+6281234567890');
    expect(address.isDefault, true);
    expect(quote.serviceable, true);
    expect(quote.fee, 7000);
  });
}
