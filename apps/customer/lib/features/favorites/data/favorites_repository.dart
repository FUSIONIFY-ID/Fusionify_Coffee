import 'package:dio/dio.dart';

class FavoritesRepository {
  const FavoritesRepository(this._dio);

  final Dio _dio;

  Future<Set<String>> listProductIds() async {
    final response = await _dio.get<List<dynamic>>('/v1/account/favorites');
    final data = response.data ?? const <dynamic>[];

    return data
        .whereType<Map>()
        .map((entry) => entry['productId'])
        .whereType<String>()
        .where((id) => id.isNotEmpty)
        .toSet();
  }

  Future<void> add(String productId) async {
    await _dio.post<void>('/v1/account/favorites/$productId');
  }

  Future<void> remove(String productId) async {
    await _dio.delete<void>('/v1/account/favorites/$productId');
  }
}
