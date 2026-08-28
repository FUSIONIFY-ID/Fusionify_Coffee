import 'package:dio/dio.dart';

import '../domain/catalog_models.dart';

class CatalogRepository {
  const CatalogRepository(this._dio);

  final Dio _dio;

  Future<CatalogSnapshot> fetchPreviewCatalog() async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/v1/catalog/preview',
    );

    final data = response.data;
    if (data == null) {
      throw const CatalogException('Catalog response is empty.');
    }

    return CatalogSnapshot.fromJson(data);
  }
}

class CatalogException implements Exception {
  const CatalogException(this.message);

  final String message;

  @override
  String toString() => message;
}
