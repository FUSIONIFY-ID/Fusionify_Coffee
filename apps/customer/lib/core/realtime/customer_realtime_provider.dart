import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/dio_provider.dart';
import 'customer_realtime_models.dart';
import 'customer_realtime_repository.dart';

const customerRealtimeFallbackInterval = Duration(seconds: 30);

final customerRealtimeRepositoryProvider = Provider<CustomerRealtimeRepository>(
  (ref) => CustomerRealtimeRepository(ref.watch(dioProvider)),
);

Duration customerRealtimeReconnectDelay(int failedAttempts) {
  if (failedAttempts <= 1) return const Duration(seconds: 1);
  if (failedAttempts == 2) return const Duration(seconds: 2);
  if (failedAttempts == 3) return const Duration(seconds: 4);
  if (failedAttempts == 4) return const Duration(seconds: 8);
  if (failedAttempts == 5) return const Duration(seconds: 16);
  return const Duration(seconds: 30);
}

// SSE accelerates UI updates; authoritative REST endpoints remain the fallback.
final customerRealtimeProvider =
    StreamProvider.autoDispose<CustomerRealtimeState>((ref) async* {
      var disposed = false;
      ref.onDispose(() => disposed = true);
      final repository = ref.watch(customerRealtimeRepositoryProvider);
      CustomerRealtimeSnapshot? latestSnapshot;
      var failedAttempts = 0;

      yield const CustomerRealtimeState(
        connectionStatus: CustomerRealtimeConnectionStatus.connecting,
      );

      while (!disposed) {
        try {
          await for (final snapshot in repository.watchAccount()) {
            if (disposed) return;
            latestSnapshot = snapshot;
            failedAttempts = 0;
            yield CustomerRealtimeState(
              connectionStatus: CustomerRealtimeConnectionStatus.live,
              snapshot: snapshot,
            );
          }
        } catch (_) {
          if (disposed) return;
        }

        if (disposed) return;
        failedAttempts += 1;
        final retryDelay = customerRealtimeReconnectDelay(failedAttempts);
        yield CustomerRealtimeState(
          connectionStatus: CustomerRealtimeConnectionStatus.reconnecting,
          snapshot: latestSnapshot,
          reconnectAttempt: failedAttempts,
          retryIn: retryDelay,
        );
        await Future<void>.delayed(retryDelay);
      }
    });
