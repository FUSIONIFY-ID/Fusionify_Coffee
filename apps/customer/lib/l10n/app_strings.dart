import 'package:flutter/widgets.dart';

class AppStrings {
  const AppStrings(this.languageCode);

  final String languageCode;

  static AppStrings of(BuildContext context) {
    return AppStrings(Localizations.localeOf(context).languageCode);
  }

  String _pick(String id, String ms, String en) {
    return switch (languageCode) {
      'id' => id,
      'ms' => ms,
      _ => en,
    };
  }

  String get home => _pick('Beranda', 'Utama', 'Home');
  String get order => _pick('Pesan', 'Pesan', 'Order');
  String get orders => _pick('Pesanan', 'Pesanan', 'Orders');
  String get rewards => _pick('Rewards', 'Ganjaran', 'Rewards');
  String get account => _pick('Akun', 'Akaun', 'Account');
  String get createAccount =>
      _pick('Buat akun', 'Cipta akaun', 'Create account');
  String get login => _pick('Masuk', 'Log masuk', 'Log in');
  String get logout => _pick('Keluar', 'Log keluar', 'Log out');
  String get logoutAll =>
      _pick('Keluar dari semua perangkat', 'Log keluar semua peranti', 'Log out all devices');
  String get phoneNumber =>
      _pick('Nomor HP', 'Nombor telefon', 'Phone number');
  String get country => _pick('Negara', 'Negara', 'Country');
  String get indonesia => 'Indonesia';
  String get malaysia => 'Malaysia';
  String get continueLabel => _pick('Lanjut', 'Teruskan', 'Continue');
  String get sendWhatsApp =>
      _pick('Kirim via WhatsApp', 'Hantar melalui WhatsApp', 'Send via WhatsApp');
  String get sendSms => _pick('Kirim via SMS', 'Hantar melalui SMS', 'Send via SMS');
  String get otpTitle =>
      _pick('Verifikasi nomor', 'Sahkan nombor', 'Verify your number');
  String get otpCode =>
      _pick('Kode 6 digit', 'Kod 6 digit', '6-digit code');
  String get verify => _pick('Verifikasi', 'Sahkan', 'Verify');
  String get resend => _pick('Kirim ulang', 'Hantar semula', 'Resend');
  String get useSmsInstead =>
      _pick('Gunakan SMS', 'Gunakan SMS', 'Use SMS instead');
  String get useWhatsAppInstead =>
      _pick('Gunakan WhatsApp', 'Gunakan WhatsApp', 'Use WhatsApp instead');
  String get fullName => _pick('Nama lengkap', 'Nama penuh', 'Full name');
  String get emailOptional =>
      _pick('Email (opsional)', 'E-mel (pilihan)', 'Email (optional)');
  String get password => _pick('Password', 'Kata laluan', 'Password');
  String get completeProfile =>
      _pick('Lengkapi profil', 'Lengkapkan profil', 'Complete profile');
  String get language => _pick('Bahasa', 'Bahasa', 'Language');
  String get personalInformation =>
      _pick('Informasi pribadi', 'Maklumat peribadi', 'Personal information');
  String get security => _pick('Keamanan', 'Keselamatan', 'Security');
  String get verified => _pick('Terverifikasi', 'Disahkan', 'Verified');
  String get memberSince =>
      _pick('Member sejak', 'Ahli sejak', 'Member since');
  String get yourCoffee =>
      _pick('Kopi Kamu', 'Kopi Anda', 'Your Coffee');
  String get buyAgain =>
      _pick('Pesan Lagi', 'Pesan Semula', 'Buy Again');
  String get favorites => _pick('Favorit', 'Kegemaran', 'Favorites');
  String get vouchers => _pick('Voucher', 'Baucar', 'Vouchers');
  String get fusionifyBenefits =>
      _pick('Benefit Fusionify', 'Manfaat Fusionify', 'Fusionify Benefits');
  String get wifiAccess =>
      _pick('Akses Wi-Fi', 'Akses Wi-Fi', 'Wi-Fi Access');
  String get aiBenefits =>
      _pick('Benefit AI', 'Manfaat AI', 'AI Benefits');
  String get support => _pick('Bantuan', 'Sokongan', 'Support');
  String get helpCenter =>
      _pick('Pusat Bantuan', 'Pusat Bantuan', 'Help Center');
  String get privacyAndTerms =>
      _pick('Privasi & Ketentuan', 'Privasi & Terma', 'Privacy & Terms');
  String get phoneVerified =>
      _pick('Nomor terverifikasi', 'Nombor disahkan', 'Verified phone');
  String get selectLanguage =>
      _pick('Pilih bahasa', 'Pilih bahasa', 'Choose language');
  String get accountGuestTitle => _pick(
        'Pesan kopi lebih gampang dengan akun Fusionify.',
        'Pesan kopi lebih mudah dengan akaun Fusionify.',
        'Make every coffee order easier with a Fusionify account.',
      );
  String get accountGuestBody => _pick(
        'Simpan riwayat pesanan, profil, bahasa, dan benefit akun kamu.',
        'Simpan sejarah pesanan, profil, bahasa dan manfaat akaun anda.',
        'Keep your orders, profile, language, and account benefits together.',
      );
  String get phoneSupportOnly => _pick(
        'Saat ini hanya nomor Indonesia (+62) dan Malaysia (+60).',
        'Buat masa ini hanya nombor Indonesia (+62) dan Malaysia (+60).',
        'Currently available for Indonesia (+62) and Malaysia (+60) numbers only.',
      );
  String get noVerificationLink => _pick(
        'Kami akan mengirim kode 6 digit. Tidak ada link verifikasi.',
        'Kami akan menghantar kod 6 digit. Tiada pautan pengesahan.',
        'We will send a 6-digit code. No verification link.',
      );
  String get otpDeliveryNotConfigured => _pick(
        'Pengiriman OTP belum dikonfigurasi pada server.',
        'Penghantaran OTP belum dikonfigurasi pada pelayan.',
        'OTP delivery is not configured on the server.',
      );
}

extension AppStringsContext on BuildContext {
  AppStrings get strings => AppStrings.of(this);
}
