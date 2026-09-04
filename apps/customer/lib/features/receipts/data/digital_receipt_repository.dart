import 'package:dio/dio.dart';

import '../domain/digital_receipt.dart';

class DigitalReceiptRepository {
  const DigitalReceiptRepository(this._dio);

  final Dio _dio;

  Future<DigitalReceipt> getReceipt(String orderId) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/v1/benefits/receipts/$orderId',
    );
    final data = response.data;
    if (data == null) {
      throw StateError('Digital receipt response is empty.');
    }
    return DigitalReceipt.fromJson(data);
  }
}
