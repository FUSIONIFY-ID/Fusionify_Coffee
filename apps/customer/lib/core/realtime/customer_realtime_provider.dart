import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/dio_provider.dart';
import 'customer_realtime_models.dart';
import 'customer_realtime_repository.dart';

final customerRealtimeRepositoryProvider = Provider<CustomerRealtimeRepository>(
  (ref) => CustomerRealtimeRepository(ref.watch(dioProvider)),
);

final customerRealtimeProvider =
    StreamProvider.autoDispose<CustomerRealtimeSnapshot>((ref) async* {
      var disposed = false;
      ref.onDispose(() => disposed = true);

      while (!disposed) {
        try {
          yield* ref.read(customerRealtimeRepositoryProvider).watchAccount();
        } catch (_) {
          if (disposed) return;
        }

        if (disposed) return;
        await Future<void>.delayed(const Duration(seconds: 3));
      }
    });
