import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../data/reward_extras_repository.dart';
import '../domain/reward_extras_models.dart';

final rewardExtrasRepositoryProvider = Provider<RewardExtrasRepository>((ref) {
  return RewardExtrasRepository(ref.watch(dioProvider));
});

final voucherWalletProvider =
    FutureProvider.autoDispose<List<CustomerVoucherWalletEntry>>((ref) {
      return ref.watch(rewardExtrasRepositoryProvider).vouchers();
    });

final digitalBenefitsProvider =
    FutureProvider.autoDispose<List<DigitalBenefitEntitlement>>((ref) {
      return ref.watch(rewardExtrasRepositoryProvider).benefits();
    });
