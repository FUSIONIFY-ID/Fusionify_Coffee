import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/features/rewards/domain/rewards_models.dart';

void main() {
  test('parses Fusion Points summary and ledger entries', () {
    final summary = RewardsSummary.fromJson({
      'balance': 28,
      'lifetimeEarned': 28,
      'lifetimeRedeemed': 0,
      'recentActivity': [
        {
          'id': 'entry-1',
          'type': 'ORDER_REWARD',
          'points': 28,
          'balanceAfter': 28,
          'orderId': 'order-1',
          'createdAt': '2026-09-04T01:30:00.000Z',
        },
      ],
    });

    expect(summary.balance, 28);
    expect(summary.lifetimeEarned, 28);
    expect(summary.lifetimeRedeemed, 0);
    expect(summary.recentActivity, hasLength(1));
    expect(summary.recentActivity.first.type, 'ORDER_REWARD');
    expect(summary.recentActivity.first.balanceAfter, 28);
  });
}
