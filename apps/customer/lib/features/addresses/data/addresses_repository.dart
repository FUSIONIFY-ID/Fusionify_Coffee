import 'package:dio/dio.dart';

import '../domain/address_models.dart';

class AddressesRepository {
  const AddressesRepository(this._dio);

  final Dio _dio;

  Future<List<SavedAddress>> list() async {
    final response = await _dio.get<List<dynamic>>('/v1/addresses');
    return (response.data ?? const <dynamic>[])
        .whereType<Map>()
        .map((entry) => SavedAddress.fromJson(Map<String, dynamic>.from(entry)))
        .toList();
  }

  Future<SavedAddress> create(Map<String, dynamic> input) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/v1/addresses',
      data: input,
    );
    final data = response.data;
    if (data == null) throw StateError('Address response is empty.');
    return SavedAddress.fromJson(data);
  }

  Future<SavedAddress> update(
    String addressId,
    Map<String, dynamic> input,
  ) async {
    final response = await _dio.put<Map<String, dynamic>>(
      '/v1/addresses/$addressId',
      data: input,
    );
    final data = response.data;
    if (data == null) throw StateError('Address response is empty.');
    return SavedAddress.fromJson(data);
  }

  Future<void> remove(String addressId) async {
    await _dio.delete<void>('/v1/addresses/$addressId');
  }

  Future<DeliveryQuote> quote({
    required String addressId,
    required String outletId,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/v1/addresses/$addressId/delivery-quote',
      queryParameters: {'outletId': outletId},
    );
    final data = response.data;
    if (data == null) throw StateError('Delivery quote response is empty.');
    return DeliveryQuote.fromJson(data);
  }
}
