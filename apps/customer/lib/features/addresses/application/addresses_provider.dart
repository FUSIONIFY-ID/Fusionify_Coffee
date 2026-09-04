import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../data/addresses_repository.dart';
import '../domain/address_models.dart';

final addressesRepositoryProvider = Provider<AddressesRepository>((ref) {
  return AddressesRepository(ref.watch(dioProvider));
});

final savedAddressesProvider = FutureProvider.autoDispose<List<SavedAddress>>((
  ref,
) {
  return ref.watch(addressesRepositoryProvider).list();
});

typedef DeliveryQuoteRequest = ({String addressId, String outletId});

final deliveryQuoteProvider = FutureProvider.autoDispose
    .family<DeliveryQuote, DeliveryQuoteRequest>((ref, request) {
      return ref
          .watch(addressesRepositoryProvider)
          .quote(addressId: request.addressId, outletId: request.outletId);
    });
