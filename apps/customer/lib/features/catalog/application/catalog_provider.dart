import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../../../l10n/app_language.dart';
import '../../../l10n/locale_controller.dart';
import '../data/catalog_repository.dart';
import '../domain/catalog_models.dart';

final catalogRepositoryProvider = Provider<CatalogRepository>((ref) {
  return CatalogRepository(ref.watch(dioProvider));
});

final catalogProvider = FutureProvider<CatalogSnapshot>((ref) {
  final language =
      ref.watch(localeControllerProvider).value ?? AppLanguage.indonesia;

  return ref
      .watch(catalogRepositoryProvider)
      .fetchPreviewCatalog(language: language);
});
