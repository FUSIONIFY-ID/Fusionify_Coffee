class OtpChallengeView {
  const OtpChallengeView({
    required this.challengeId,
    required this.phone,
    required this.channel,
    required this.expiresInSeconds,
    required this.resendAfterSeconds,
  });

  factory OtpChallengeView.fromJson(Map<String, dynamic> json) {
    return OtpChallengeView(
      challengeId: json['challengeId'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      channel: json['channel'] as String? ?? '',
      expiresInSeconds: json['expiresInSeconds'] as int? ?? 300,
      resendAfterSeconds: json['resendAfterSeconds'] as int? ?? 60,
    );
  }

  final String challengeId;
  final String phone;
  final String channel;
  final int expiresInSeconds;
  final int resendAfterSeconds;
}

class OtpVerificationView {
  const OtpVerificationView({
    required this.challengeId,
    required this.verificationToken,
  });

  factory OtpVerificationView.fromJson(Map<String, dynamic> json) {
    return OtpVerificationView(
      challengeId: json['challengeId'] as String? ?? '',
      verificationToken: json['verificationToken'] as String? ?? '',
    );
  }

  final String challengeId;
  final String verificationToken;
}

class CustomerProfile {
  const CustomerProfile({
    required this.id,
    required this.fullName,
    required this.phoneCountry,
    required this.phone,
    required this.phoneVerified,
    required this.preferredLanguage,
    required this.memberSince,
    this.email,
    this.birthDate,
    this.avatarUrl,
  });

  factory CustomerProfile.fromJson(Map<String, dynamic> json) {
    return CustomerProfile(
      id: json['id'] as String? ?? '',
      fullName: json['fullName'] as String? ?? '',
      phoneCountry: json['phoneCountry'] as String? ?? 'ID',
      phone: json['phone'] as String? ?? '',
      phoneVerified: json['phoneVerified'] as bool? ?? false,
      preferredLanguage: json['preferredLanguage'] as String? ?? 'ID_ID',
      memberSince: DateTime.tryParse(json['memberSince'] as String? ?? '') ??
          DateTime(2026),
      email: json['email'] as String?,
      birthDate: json['birthDate'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
    );
  }

  final String id;
  final String fullName;
  final String phoneCountry;
  final String phone;
  final bool phoneVerified;
  final String preferredLanguage;
  final DateTime memberSince;
  final String? email;
  final String? birthDate;
  final String? avatarUrl;

  String get initials {
    final words = fullName
        .trim()
        .split(RegExp(r'\s+'))
        .where((word) => word.isNotEmpty)
        .toList();

    if (words.isEmpty) return '?';
    if (words.length == 1) return words.first.substring(0, 1).toUpperCase();
    return '${words.first.substring(0, 1)}${words.last.substring(0, 1)}'
        .toUpperCase();
  }
}

class AuthSessionView {
  const AuthSessionView({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
  });

  factory AuthSessionView.fromJson(Map<String, dynamic> json) {
    return AuthSessionView(
      user: CustomerProfile.fromJson(
        Map<String, dynamic>.from(json['user'] as Map),
      ),
      accessToken: json['accessToken'] as String? ?? '',
      refreshToken: json['refreshToken'] as String? ?? '',
    );
  }

  final CustomerProfile user;
  final String accessToken;
  final String refreshToken;
}
