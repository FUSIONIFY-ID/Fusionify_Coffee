import 'package:dio/dio.dart';

import '../../../l10n/app_language.dart';
import '../domain/catalog_models.dart';

class CatalogRepository {
  const CatalogRepository(this._dio);

  final Dio _dio;

  Future<List<Outlet>> fetchOutlets({required AppLanguage language}) async {
    final response = await _dio.get<List<dynamic>>(
      '/v1/catalog/outlets',
      queryParameters: {'lang': language.apiValue},
    );
    final data = response.data;
    if (data == null) {
      throw const CatalogException('Outlet response is empty.');
    }
    return data
        .map((item) => Outlet.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList(growable: false);
  }

  Future<CatalogSnapshot> fetchCatalog({
    required AppLanguage language,
    required String outletId,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/v1/catalog',
      queryParameters: {'lang': language.apiValue, 'outletId': outletId},
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
