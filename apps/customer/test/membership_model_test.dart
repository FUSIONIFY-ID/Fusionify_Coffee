import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/features/rewards/domain/rewards_models.dart';

void main() {
  test('parses membership tier progress from rewards summary', () {
    final summary = RewardsSummary.fromJson({
      'balance': 70,
      'lifetimeEarned': 70,
      'lifetimeRedeemed': 0,
      'recentActivity': <dynamic>[],
      'membership': {
        'currency': 'IDR',
        'qualifyingSpend': 56000,
        'pointsMultiplierBps': 15000,
        'remainingToNextTier': 44000,
        'currentTier': {
          'id': 'tier-plus',
          'currency': 'IDR',
          'rank': 1,
          'name': 'Plus',
          'minimumQualifyingSpend': 28000,
          'pointsMultiplierBps': 15000,
        },
        'nextTier': {
          'id': 'tier-next',
          'currency': 'IDR',
          'rank': 2,
          'name': 'Next',
          'minimumQualifyingSpend': 100000,
          'pointsMultiplierBps': 20000,
        },
      },
    });

    expect(summary.membership.currentTier?.name, 'Plus');
    expect(summary.membership.nextTier?.name, 'Next');
    expect(summary.membership.pointsMultiplierBps, 15000);
    expect(summary.membership.progressToNextTier, closeTo(0.3889, 0.001));
  });
}
