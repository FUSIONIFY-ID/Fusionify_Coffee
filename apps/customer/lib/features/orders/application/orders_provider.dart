import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../data/orders_repository.dart';
import '../domain/order_history_models.dart';

final ordersRepositoryProvider = Provider<OrdersRepository>((ref) {
  return OrdersRepository(ref.watch(dioProvider));
});

final orderHistoryProvider =
    FutureProvider.autoDispose<List<CustomerOrderSummary>>((ref) {
      return ref.watch(ordersRepositoryProvider).listOrders();
    });

final orderDetailProvider =
    FutureProvider.autoDispose.family<CustomerOrderDetail, String>(
      (ref, orderId) {
        return ref.watch(ordersRepositoryProvider).getOrder(orderId);
      },
    );
