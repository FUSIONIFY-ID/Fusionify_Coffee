import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../data/catalog_repository.dart';
import '../domain/catalog_models.dart';

final catalogRepositoryProvider = Provider<CatalogRepository>((ref) {
  return CatalogRepository(ref.watch(dioProvider));
});

final catalogProvider = FutureProvider<CatalogSnapshot>((ref) {
  return ref.watch(catalogRepositoryProvider).fetchPreviewCatalog();
});
