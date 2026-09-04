import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../data/rewards_repository.dart';
import '../domain/rewards_models.dart';

final rewardsRepositoryProvider = Provider<RewardsRepository>((ref) {
  return RewardsRepository(ref.watch(dioProvider));
});

final rewardsSummaryProvider = FutureProvider.autoDispose<RewardsSummary>((ref) {
  return ref.watch(rewardsRepositoryProvider).getSummary();
});
