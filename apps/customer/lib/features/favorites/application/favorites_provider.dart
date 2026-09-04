import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../../auth/application/auth_controller.dart';
import '../data/favorites_repository.dart';

final favoritesRepositoryProvider = Provider<FavoritesRepository>((ref) {
  return FavoritesRepository(ref.watch(dioProvider));
});

final favoriteProductIdsProvider =
    AsyncNotifierProvider<FavoriteProductIdsController, Set<String>>(
      FavoriteProductIdsController.new,
    );

class FavoriteProductIdsController extends AsyncNotifier<Set<String>> {
  @override
  Future<Set<String>> build() async {
    final profile = ref.watch(authControllerProvider).value;
    if (profile == null) return <String>{};
    return ref.read(favoritesRepositoryProvider).listProductIds();
  }

  Future<void> toggle(String productId) async {
    final current = state.value ?? <String>{};
    final next = Set<String>.from(current);
    final repository = ref.read(favoritesRepositoryProvider);

    if (current.contains(productId)) {
      next.remove(productId);
      state = AsyncData(next);
      try {
        await repository.remove(productId);
      } catch (error, stackTrace) {
        state = AsyncData(current);
        Error.throwWithStackTrace(error, stackTrace);
      }
      return;
    }

    next.add(productId);
    state = AsyncData(next);
    try {
      await repository.add(productId);
    } catch (error, stackTrace) {
      state = AsyncData(current);
      Error.throwWithStackTrace(error, stackTrace);
    }
  }
}
