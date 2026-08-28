import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../../../core/storage/secure_store.dart';
import '../../../l10n/app_language.dart';
import '../data/auth_repository.dart';
import '../domain/auth_models.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    ref.watch(dioProvider),
    ref.watch(secureStoreProvider),
  );
});

final authControllerProvider =
    AsyncNotifierProvider<AuthController, CustomerProfile?>(AuthController.new);

class AuthController extends AsyncNotifier<CustomerProfile?> {
  @override
  Future<CustomerProfile?> build() {
    return ref.read(authRepositoryProvider).restoreProfile();
  }

  Future<void> setAuthenticated(CustomerProfile profile) async {
    state = AsyncData(profile);
  }

  Future<void> syncLanguage(AppLanguage language) async {
    final current = state.value;
    if (current == null) {
      return;
    }

    final updated =
        await ref.read(authRepositoryProvider).updateLanguage(language);
    state = AsyncData(updated);
  }

  Future<void> logout() async {
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncData(null);
  }

  Future<void> logoutAll() async {
    await ref.read(authRepositoryProvider).logoutAll();
    state = const AsyncData(null);
  }
}
