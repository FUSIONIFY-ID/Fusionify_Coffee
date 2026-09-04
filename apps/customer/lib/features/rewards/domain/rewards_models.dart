class RewardsSummary {
  const RewardsSummary({
    required this.balance,
    required this.lifetimeEarned,
    required this.lifetimeRedeemed,
    required this.recentActivity,
  });

  factory RewardsSummary.fromJson(Map<String, dynamic> json) {
    final rawActivity = json['recentActivity'] is List
        ? json['recentActivity'] as List
        : const [];

    return RewardsSummary(
      balance: json['balance'] as int? ?? 0,
      lifetimeEarned: json['lifetimeEarned'] as int? ?? 0,
      lifetimeRedeemed: json['lifetimeRedeemed'] as int? ?? 0,
      recentActivity: rawActivity
          .whereType<Map>()
          .map(
            (entry) => RewardsLedgerEntry.fromJson(
              Map<String, dynamic>.from(entry),
            ),
          )
          .toList(),
    );
  }

  final int balance;
  final int lifetimeEarned;
  final int lifetimeRedeemed;
  final List<RewardsLedgerEntry> recentActivity;
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
          DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime(2026),
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
