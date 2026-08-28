import 'package:dio/dio.dart';

import '../domain/order_history_models.dart';

class OrdersRepository {
  const OrdersRepository(this._dio);

  final Dio _dio;

  Future<List<CustomerOrderSummary>> listOrders() async {
    final response = await _dio.get<List<dynamic>>('/v1/orders');
    final data = response.data ?? const <dynamic>[];
    return data
        .whereType<Map>()
        .map(
          (entry) =>
              CustomerOrderSummary.fromJson(Map<String, dynamic>.from(entry)),
        )
        .toList();
  }

  Future<CustomerOrderDetail> getOrder(String orderId) async {
    final response = await _dio.get<Map<String, dynamic>>('/v1/orders/$orderId');
    final data = response.data;
    if (data == null) {
      throw StateError('Order response is empty.');
    }
    return CustomerOrderDetail.fromJson(data);
  }
}
