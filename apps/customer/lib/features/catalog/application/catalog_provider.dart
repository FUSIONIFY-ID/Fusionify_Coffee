import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../../../core/storage/secure_store.dart';
import '../../../l10n/app_language.dart';
import '../../../l10n/locale_controller.dart';
import '../data/catalog_repository.dart';
import '../domain/catalog_models.dart';

final catalogRepositoryProvider = Provider<CatalogRepository>((ref) {
  return CatalogRepository(ref.watch(dioProvider));
});

final outletsProvider = FutureProvider<List<Outlet>>((ref) {
  final language =
      ref.watch(localeControllerProvider).value ?? AppLanguage.indonesia;

  return ref.watch(catalogRepositoryProvider).fetchOutlets(language: language);
});

final selectedOutletIdProvider =
    AsyncNotifierProvider<SelectedOutletController, String>(
      SelectedOutletController.new,
    );

class SelectedOutletController extends AsyncNotifier<String> {
  @override
  Future<String> build() async {
    final outlets = await ref.watch(outletsProvider.future);
    if (outlets.isEmpty) {
      throw const CatalogException('No active outlet is available.');
    }
    final saved = await ref.read(secureStoreProvider).readOutletId();
    if (outlets.any((outlet) => outlet.id == saved)) return saved!;

    final fallback = outlets.first.id;
    await ref.read(secureStoreProvider).writeOutletId(fallback);
    return fallback;
  }

  Future<void> select(String outletId) async {
    final outlets = await ref.read(outletsProvider.future);
    if (!outlets.any((outlet) => outlet.id == outletId)) {
      throw const CatalogException('Outlet is not available.');
    }
    await ref.read(secureStoreProvider).writeOutletId(outletId);
    state = AsyncData(outletId);
  }
}

final catalogProvider = FutureProvider<CatalogSnapshot>((ref) async {
  final language =
      ref.watch(localeControllerProvider).value ?? AppLanguage.indonesia;
  final outletId = await ref.watch(selectedOutletIdProvider.future);

  return ref
      .watch(catalogRepositoryProvider)
      .fetchCatalog(language: language, outletId: outletId);
});
