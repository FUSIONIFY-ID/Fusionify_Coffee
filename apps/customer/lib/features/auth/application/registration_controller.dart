import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/auth_models.dart';

class RegistrationState {
  const RegistrationState({
    this.country = 'ID',
    this.phone = '',
    this.channel = 'WHATSAPP',
    this.challenge,
    this.verification,
  });

  final String country;
  final String phone;
  final String channel;
  final OtpChallengeView? challenge;
  final OtpVerificationView? verification;

  RegistrationState copyWith({
    String? country,
    String? phone,
    String? channel,
    OtpChallengeView? challenge,
    OtpVerificationView? verification,
  }) {
    return RegistrationState(
      country: country ?? this.country,
      phone: phone ?? this.phone,
      channel: channel ?? this.channel,
      challenge: challenge ?? this.challenge,
      verification: verification ?? this.verification,
    );
  }
}

final registrationProvider =
    NotifierProvider<RegistrationController, RegistrationState>(
      RegistrationController.new,
    );

class RegistrationController extends Notifier<RegistrationState> {
  @override
  RegistrationState build() => const RegistrationState();

  void start({
    required String country,
    required String phone,
    required String channel,
    required OtpChallengeView challenge,
  }) {
    state = RegistrationState(
      country: country,
      phone: phone,
      channel: channel,
      challenge: challenge,
    );
  }

  void verified(OtpVerificationView verification) {
    state = state.copyWith(verification: verification);
  }

  void clear() {
    state = const RegistrationState();
  }
}
