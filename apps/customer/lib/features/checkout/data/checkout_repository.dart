import 'package:dio/dio.dart';

import '../../cart/domain/cart_item.dart';
import '../domain/checkout_models.dart';

class CheckoutRepository {
  const CheckoutRepository(this._dio);

  final Dio _dio;

  Future<CheckoutOrder> createOrder({
    required String outletId,
    required List<CartItem> items,
    required String idempotencyKey,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/v1/orders',
      options: Options(headers: {'Idempotency-Key': idempotencyKey}),
      data: {
        'outletId': outletId,
        'items': [
          for (final item in items)
            {
              'productId': item.productId,
              'quantity': item.quantity,
              'modifierOptionIds': [
                for (final option in item.selectedOptions) option.id,
              ],
            },
        ],
      },
    );

    final data = response.data;
    if (data == null) {
      throw const CheckoutException('Order response is empty.');
    }

    return CheckoutOrder.fromJson(data);
  }

  Future<PaymentView> createPayment({
    required String orderId,
    required String idempotencyKey,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/v1/orders/$orderId/payments',
      options: Options(headers: {'Idempotency-Key': idempotencyKey}),
      data: const {'channel': 'GOPAY_QRIS'},
    );

    final data = response.data;
    if (data == null) {
      throw const CheckoutException('Payment response is empty.');
    }

    return PaymentView.fromJson(data);
  }

  Future<PaymentView> getPayment(String paymentId) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/v1/payments/$paymentId',
    );

    final data = response.data;
    if (data == null) {
      throw const CheckoutException('Payment status response is empty.');
    }

    return PaymentView.fromJson(data);
  }

  Future<PaymentView> checkPayment(String paymentId) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/v1/payments/$paymentId/check',
    );

    final data = response.data;
    if (data == null) {
      throw const CheckoutException('Payment check response is empty.');
    }

    return PaymentView.fromJson(data);
  }

  Future<PaymentView> cancelPayment(String paymentId) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/v1/payments/$paymentId/cancel',
    );

    final data = response.data;
    if (data == null) {
      throw const CheckoutException('Payment cancel response is empty.');
    }

    return PaymentView.fromJson(data);
  }
}

class CheckoutException implements Exception {
  const CheckoutException(this.message);

  final String message;

  @override
  String toString() => message;
}
