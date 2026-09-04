import 'app_strings.dart';

extension RewardExtrasStrings on AppStrings {
  String _extrasPick(String id, String ms, String en) {
    return switch (languageCode) {
      'id' => id,
      'ms' => ms,
      _ => en,
    };
  }

  String get signInToSeeRewards => _extrasPick(
    'Masuk untuk melihat reward, voucher, dan benefit akun kamu.',
    'Log masuk untuk melihat ganjaran, baucar dan manfaat akaun anda.',
    'Log in to see your rewards, vouchers, and account benefits.',
  );
  String get pointsTab => _extrasPick('Poin', 'Mata', 'Points');
  String get voucherTab => _extrasPick('Voucher', 'Baucar', 'Vouchers');
  String get benefitsTab => _extrasPick('Benefit', 'Manfaat', 'Benefits');
  String get myVouchers =>
      _extrasPick('Voucher Saya', 'Baucar Saya', 'My Vouchers');
  String get vouchersEmpty => _extrasPick(
    'Belum ada voucher di akun kamu.',
    'Belum ada baucar dalam akaun anda.',
    'There are no vouchers in your account yet.',
  );
  String get vouchersLoadFailed => _extrasPick(
    'Voucher belum bisa dimuat.',
    'Baucar belum dapat dimuatkan.',
    'Vouchers could not be loaded.',
  );
  String get availableVoucher =>
      _extrasPick('Bisa digunakan', 'Boleh digunakan', 'Available');
  String get voucherUsed =>
      _extrasPick('Sudah digunakan', 'Telah digunakan', 'Used');
  String get voucherExpired =>
      _extrasPick('Kedaluwarsa', 'Tamat tempoh', 'Expired');
  String voucherMinimum(String amount) => _extrasPick(
    'Minimum belanja $amount',
    'Belanja minimum $amount',
    'Minimum spend $amount',
  );
  String voucherValidUntil(String date) => _extrasPick(
    'Berlaku sampai $date',
    'Sah sehingga $date',
    'Valid until $date',
  );
  String get chooseVoucher =>
      _extrasPick('Pilih voucher', 'Pilih baucar', 'Choose voucher');
  String get noVoucher =>
      _extrasPick('Tanpa voucher', 'Tanpa baucar', 'No voucher');
  String get noEligibleVoucher => _extrasPick(
    'Belum ada voucher yang cocok untuk pesanan ini.',
    'Belum ada baucar yang sesuai untuk pesanan ini.',
    'No voucher is eligible for this order yet.',
  );
  String get voucherServerValidation => _extrasPick(
    'Voucher akan diverifikasi lagi oleh server saat pesanan dibuat.',
    'Baucar akan disahkan semula oleh pelayan semasa pesanan dibuat.',
    'The server validates the voucher again when the order is created.',
  );
  String get voucherRejected => _extrasPick(
    'Voucher tidak dapat digunakan untuk pesanan ini. Pilih voucher lain atau lanjut tanpa voucher.',
    'Baucar tidak dapat digunakan untuk pesanan ini. Pilih baucar lain atau teruskan tanpa baucar.',
    'This voucher cannot be used for the order. Choose another voucher or continue without one.',
  );
  String get freeOrderConfirmed => _extrasPick(
    'Pesanan sudah dikonfirmasi tanpa pembayaran tambahan.',
    'Pesanan telah disahkan tanpa pembayaran tambahan.',
    'The order was confirmed without an additional payment.',
  );
  String get fusionifyBenefits => _extrasPick(
    'Benefit Fusionify',
    'Manfaat Fusionify',
    'Fusionify Benefits',
  );
  String get benefitsEmpty => _extrasPick(
    'Belum ada benefit digital aktif dari pesanan kamu.',
    'Belum ada manfaat digital aktif daripada pesanan anda.',
    'No digital benefits are available from your orders yet.',
  );
  String get benefitsLoadFailed => _extrasPick(
    'Benefit digital belum bisa dimuat.',
    'Manfaat digital belum dapat dimuatkan.',
    'Digital benefits could not be loaded.',
  );
  String get wifiAccess =>
      _extrasPick('Akses Wi-Fi', 'Akses Wi-Fi', 'Wi-Fi Access');
  String get aiAccess => _extrasPick('Benefit AI', 'Manfaat AI', 'AI Benefit');
  String get activeBenefit => _extrasPick('Aktif', 'Aktif', 'Active');
  String get inactiveBenefit =>
      _extrasPick('Tidak aktif', 'Tidak aktif', 'Inactive');
  String get networkName =>
      _extrasPick('Nama jaringan', 'Nama rangkaian', 'Network name');
  String get wifiPassword =>
      _extrasPick('Password Wi-Fi', 'Kata laluan Wi-Fi', 'Wi-Fi password');
  String get showPassword => _extrasPick('Tampilkan', 'Tunjukkan', 'Show');
  String get hidePassword => _extrasPick('Sembunyikan', 'Sembunyikan', 'Hide');
  String quotaRemaining(int remaining, int total) => _extrasPick(
    '$remaining dari $total request tersisa',
    '$remaining daripada $total permintaan berbaki',
    '$remaining of $total requests remaining',
  );
  String benefitValidUntil(String date) => _extrasPick(
    'Aktif sampai $date',
    'Aktif sehingga $date',
    'Active until $date',
  );
  String benefitFromOutlet(String outlet) => _extrasPick(
    'Dari pesanan di $outlet',
    'Daripada pesanan di $outlet',
    'From an order at $outlet',
  );
}
