import 'app_strings.dart';

extension RewardsStrings on AppStrings {
  String _rewardPick(String id, String ms, String en) {
    return switch (languageCode) {
      'id' => id,
      'ms' => ms,
      _ => en,
    };
  }

  String get fusionPoints =>
      _rewardPick('Fusion Points', 'Fusion Points', 'Fusion Points');
  String get membership => _rewardPick('Membership', 'Keahlian', 'Membership');
  String get baseMember =>
      _rewardPick('Fusion Member', 'Fusion Member', 'Fusion Member');
  String get membershipProgress => _rewardPick(
    'Progress membership',
    'Kemajuan keahlian',
    'Membership progress',
  );
  String get membershipNotConfigured => _rewardPick(
    'Belum ada tier membership aktif untuk wilayah kamu.',
    'Belum ada tahap keahlian aktif untuk wilayah anda.',
    'No active membership tiers are configured for your region yet.',
  );
  String nextTierProgress(String amount, String tier) => _rewardPick(
    '$amount lagi menuju $tier',
    '$amount lagi untuk mencapai $tier',
    '$amount to reach $tier',
  );
  String get topTierReached => _rewardPick(
    'Kamu sudah berada di tier aktif tertinggi.',
    'Anda sudah berada pada tahap aktif tertinggi.',
    'You are on the highest active tier.',
  );
  String pointsMultiplier(String multiplier) => _rewardPick(
    'Multiplier poin $multiplier×',
    'Pengganda mata $multiplier×',
    '$multiplier× points multiplier',
  );
  String get pointsBalance =>
      _rewardPick('Saldo poin', 'Baki mata', 'Points balance');
  String get lifetimeEarned =>
      _rewardPick('Total diperoleh', 'Jumlah diperoleh', 'Lifetime earned');
  String get lifetimeRedeemed =>
      _rewardPick('Total digunakan', 'Jumlah digunakan', 'Lifetime redeemed');
  String get recentPointsActivity =>
      _rewardPick('Aktivitas terbaru', 'Aktiviti terkini', 'Recent activity');
  String get noPointsActivity => _rewardPick(
    'Belum ada aktivitas Fusion Points.',
    'Belum ada aktiviti Fusion Points.',
    'No Fusion Points activity yet.',
  );
  String get signInToSeeRewards => _rewardPick(
    'Masuk untuk melihat Fusion Points kamu.',
    'Log masuk untuk melihat Fusion Points anda.',
    'Log in to see your Fusion Points.',
  );
  String get pointsLoadFailed => _rewardPick(
    'Fusion Points belum bisa dimuat.',
    'Fusion Points belum dapat dimuatkan.',
    'Fusion Points could not be loaded.',
  );
  String get orderReward => _rewardPick(
    'Poin dari pesanan selesai',
    'Mata daripada pesanan selesai',
    'Completed order reward',
  );
  String get campaignBonus =>
      _rewardPick('Bonus kampanye', 'Bonus kempen', 'Campaign bonus');
  String get rewardRedemption => _rewardPick(
    'Penukaran reward',
    'Penebusan ganjaran',
    'Reward redemption',
  );
  String get refundReversal => _rewardPick(
    'Penyesuaian refund',
    'Pelarasan bayaran balik',
    'Refund adjustment',
  );
  String get manualAdjustment =>
      _rewardPick('Penyesuaian poin', 'Pelarasan mata', 'Points adjustment');
  String pointsAmount(int points) =>
      _rewardPick('$points poin', '$points mata', '$points points');
}
