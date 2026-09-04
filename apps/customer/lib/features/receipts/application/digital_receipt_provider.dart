import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../data/digital_receipt_repository.dart';
import '../domain/digital_receipt.dart';

final digitalReceiptRepositoryProvider = Provider<DigitalReceiptRepository>(
  (ref) => DigitalReceiptRepository(ref.watch(dioProvider)),
);

final digitalReceiptProvider = FutureProvider.autoDispose
    .family<DigitalReceipt, String>((ref, orderId) {
      return ref.watch(digitalReceiptRepositoryProvider).getReceipt(orderId);
    });
