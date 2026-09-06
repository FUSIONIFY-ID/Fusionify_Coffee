import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/core/storage/secure_store.dart';
import 'package:fusionify_coffee/features/catalog/application/catalog_provider.dart';
import 'package:fusionify_coffee/features/catalog/domain/catalog_models.dart';

void main() {
  test('restores and persists the selected active outlet', () async {
    final store = _MemorySecureStore('depok');
    final container = ProviderContainer(
      overrides: [
        secureStoreProvider.overrideWithValue(store),
        outletsProvider.overrideWith((ref) async => _outlets),
      ],
    );
    addTearDown(container.dispose);

    expect(await container.read(selectedOutletIdProvider.future), 'depok');

    await container.read(selectedOutletIdProvider.notifier).select('jakarta');

    expect(container.read(selectedOutletIdProvider).value, 'jakarta');
    expect(store.outletId, 'jakarta');
  });

  test('falls back to and stores the first active outlet', () async {
    final store = _MemorySecureStore('closed-outlet');
    final container = ProviderContainer(
      overrides: [
        secureStoreProvider.overrideWithValue(store),
        outletsProvider.overrideWith((ref) async => _outlets),
      ],
    );
    addTearDown(container.dispose);

    expect(await container.read(selectedOutletIdProvider.future), 'jakarta');
    expect(store.outletId, 'jakarta');
  });
}

const _outlets = [
  Outlet(
    id: 'jakarta',
    name: 'Jakarta',
    note: '',
    currency: 'IDR',
    pickupEnabled: true,
    deliveryEnabled: true,
  ),
  Outlet(
    id: 'depok',
    name: 'Depok',
    note: '',
    currency: 'IDR',
    pickupEnabled: true,
    deliveryEnabled: false,
  ),
];

class _MemorySecureStore extends SecureStore {
  _MemorySecureStore(this.outletId);

  String? outletId;

  @override
  Future<String?> readOutletId() async => outletId;

  @override
  Future<void> writeOutletId(String value) async {
    outletId = value;
  }
}
