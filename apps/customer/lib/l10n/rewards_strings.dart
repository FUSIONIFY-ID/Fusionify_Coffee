import 'app_strings.dart';

extension RewardsStrings on AppStrings {
  String get fusionPoints => _pick(
    'Fusion Points',
    'Fusion Points',
    'Fusion Points',
  );

  String get pointsBalance => _pick(
    'Saldo poin',
    'Baki mata',
    'Points balance',
  );

  String get lifetimeEarned => _pick(
    'Total diperoleh',
    'Jumlah diperoleh',
    'Lifetime earned',
  );

  String get lifetimeRedeemed => _pick(
    'Total digunakan',
    'Jumlah digunakan',
    'Lifetime redeemed',
  );

  String get recentPointsActivity => _pick(
    'Aktivitas terbaru',
    'Aktiviti terkini',
    'Recent activity',
  );

  String get noPointsActivity => _pick(
    'Belum ada aktivitas Fusion Points.',
    'Belum ada aktiviti Fusion Points.',
    'No Fusion Points activity yet.',
  );

  String get signInToSeeRewards => _pick(
    'Masuk untuk melihat Fusion Points kamu.',
    'Log masuk untuk melihat Fusion Points anda.',
    'Log in to see your Fusion Points.',
  );

  String get pointsLoadFailed => _pick(
    'Fusion Points belum bisa dimuat.',
    'Fusion Points belum dapat dimuatkan.',
    'Fusion Points could not be loaded.',
  );

  String get orderReward => _pick(
    'Poin dari pesanan selesai',
    'Mata daripada pesanan selesai',
    'Completed order reward',
  );

  String get campaignBonus => _pick(
    'Bonus kampanye',
    'Bonus kempen',
    'Campaign bonus',
  );

  String get rewardRedemption => _pick(
    'Penukaran reward',
    'Penebusan ganjaran',
    'Reward redemption',
  );

  String get refundReversal => _pick(
    'Penyesuaian refund',
    'Pelarasan bayaran balik',
    'Refund adjustment',
  );

  String get manualAdjustment => _pick(
    'Penyesuaian poin',
    'Pelarasan mata',
    'Points adjustment',
  );

  String pointsAmount(int points) => _pick(
    '$points poin',
    '$points mata',
    '$points points',
  );
}
