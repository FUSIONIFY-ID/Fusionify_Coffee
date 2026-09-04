import 'package:dio/dio.dart';

import '../domain/reward_extras_models.dart';

class RewardExtrasRepository {
  const RewardExtrasRepository(this._dio);

  final Dio _dio;

  Future<List<CustomerVoucherWalletEntry>> vouchers() async {
    final response = await _dio.get<List<dynamic>>('/v1/vouchers/me');
    return (response.data ?? const <dynamic>[])
        .whereType<Map>()
        .map(
          (entry) => CustomerVoucherWalletEntry.fromJson(
            Map<String, dynamic>.from(entry),
          ),
        )
        .toList();
  }

  Future<List<DigitalBenefitEntitlement>> benefits() async {
    final response = await _dio.get<List<dynamic>>('/v1/benefits/me');
    return (response.data ?? const <dynamic>[])
        .whereType<Map>()
        .map(
          (entry) => DigitalBenefitEntitlement.fromJson(
            Map<String, dynamic>.from(entry),
          ),
        )
        .toList();
  }
}
