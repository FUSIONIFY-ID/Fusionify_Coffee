import 'package:dio/dio.dart';

import '../domain/rewards_models.dart';

class RewardsRepository {
  const RewardsRepository(this._dio);

  final Dio _dio;

  Future<RewardsSummary> getSummary() async {
    final response = await _dio.get<Map<String, dynamic>>('/v1/rewards/me');
    final data = response.data;
    if (data == null) {
      throw StateError('Rewards response is empty.');
    }
    return RewardsSummary.fromJson(data);
  }
}
