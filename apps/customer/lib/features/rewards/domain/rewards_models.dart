class RewardsSummary {
  const RewardsSummary({
    required this.balance,
    required this.lifetimeEarned,
    required this.lifetimeRedeemed,
    required this.recentActivity,
    required this.membership,
  });

  factory RewardsSummary.fromJson(Map<String, dynamic> json) {
    final rawActivity = json['recentActivity'] is List
        ? json['recentActivity'] as List
        : const [];
    final rawMembership = json['membership'] is Map
        ? Map<String, dynamic>.from(json['membership'] as Map)
        : const <String, dynamic>{};

    return RewardsSummary(
      balance: json['balance'] as int? ?? 0,
      lifetimeEarned: json['lifetimeEarned'] as int? ?? 0,
      lifetimeRedeemed: json['lifetimeRedeemed'] as int? ?? 0,
      recentActivity: rawActivity
          .whereType<Map>()
          .map(
            (entry) =>
                RewardsLedgerEntry.fromJson(Map<String, dynamic>.from(entry)),
          )
          .toList(),
      membership: MembershipSummary.fromJson(rawMembership),
    );
  }

  final int balance;
  final int lifetimeEarned;
  final int lifetimeRedeemed;
  final List<RewardsLedgerEntry> recentActivity;
  final MembershipSummary membership;
}

class MembershipSummary {
  const MembershipSummary({
    required this.currency,
    required this.qualifyingSpend,
    required this.pointsMultiplierBps,
    required this.remainingToNextTier,
    this.currentTier,
    this.nextTier,
  });

  factory MembershipSummary.fromJson(Map<String, dynamic> json) {
    return MembershipSummary(
      currency: json['currency'] as String? ?? 'IDR',
      qualifyingSpend: json['qualifyingSpend'] as int? ?? 0,
      pointsMultiplierBps: json['pointsMultiplierBps'] as int? ?? 10000,
      remainingToNextTier: json['remainingToNextTier'] as int? ?? 0,
      currentTier: json['currentTier'] is Map
          ? MembershipTierView.fromJson(
              Map<String, dynamic>.from(json['currentTier'] as Map),
            )
          : null,
      nextTier: json['nextTier'] is Map
          ? MembershipTierView.fromJson(
              Map<String, dynamic>.from(json['nextTier'] as Map),
            )
          : null,
    );
  }

  final String currency;
  final int qualifyingSpend;
  final int pointsMultiplierBps;
  final int remainingToNextTier;
  final MembershipTierView? currentTier;
  final MembershipTierView? nextTier;

  double get progressToNextTier {
    final next = nextTier;
    if (next == null) return 1;
    final start = currentTier?.minimumQualifyingSpend ?? 0;
    final range = next.minimumQualifyingSpend - start;
    if (range <= 0) return 0;
    return ((qualifyingSpend - start) / range).clamp(0, 1).toDouble();
  }
}

class MembershipTierView {
  const MembershipTierView({
    required this.id,
    required this.currency,
    required this.rank,
    required this.name,
    required this.minimumQualifyingSpend,
    required this.pointsMultiplierBps,
  });

  factory MembershipTierView.fromJson(Map<String, dynamic> json) {
    return MembershipTierView(
      id: json['id'] as String? ?? '',
      currency: json['currency'] as String? ?? '',
      rank: json['rank'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      minimumQualifyingSpend: json['minimumQualifyingSpend'] as int? ?? 0,
      pointsMultiplierBps: json['pointsMultiplierBps'] as int? ?? 10000,
    );
  }

  final String id;
  final String currency;
  final int rank;
  final String name;
  final int minimumQualifyingSpend;
  final int pointsMultiplierBps;
}

class RewardsLedgerEntry {
  const RewardsLedgerEntry({
    required this.id,
    required this.type,
    required this.points,
    required this.balanceAfter,
    required this.createdAt,
    this.orderId,
    this.note,
  });

  factory RewardsLedgerEntry.fromJson(Map<String, dynamic> json) {
    return RewardsLedgerEntry(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? '',
      points: json['points'] as int? ?? 0,
      balanceAfter: json['balanceAfter'] as int? ?? 0,
      orderId: json['orderId'] as String?,
      note: json['note'] as String?,
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime(2026),
    );
  }

  final String id;
  final String type;
  final int points;
  final int balanceAfter;
  final String? orderId;
  final String? note;
  final DateTime createdAt;
}
