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
  String get cart => _pick('Keranjang', 'Troli', 'Cart');
  String get checkout => _pick('Checkout', 'Checkout', 'Checkout');
  String get pickup => _pick('Pickup', 'Ambil Sendiri', 'Pickup');
  String get delivery => _pick('Delivery', 'Penghantaran', 'Delivery');
  String get recommended => _pick('Rekomendasi', 'Disyorkan', 'Recommended');
  String get all => _pick('Semua', 'Semua', 'All');
  String get bestseller => _pick('Terlaris', 'Terlaris', 'Bestseller');
  String get retry => _pick('Coba lagi', 'Cuba lagi', 'Retry');
  String get view => _pick('Lihat', 'Lihat', 'View');
  String get seeMenu => _pick('Lihat menu', 'Lihat menu', 'See menu');
  String get remove => _pick('Hapus', 'Buang', 'Remove');
  String get estimatedSubtotal =>
      _pick('Perkiraan subtotal', 'Anggaran subtotal', 'Estimated subtotal');
  String get orderSummary =>
      _pick('Ringkasan Pesanan', 'Ringkasan Pesanan', 'Order Summary');
  String get continueLabel => _pick('Lanjut', 'Teruskan', 'Continue');
  String get loading => _pick('Memuat…', 'Memuatkan…', 'Loading…');

  String get coffeePrompt => _pick(
    'Mau ngopi apa hari ini?',
    'Nak minum kopi apa hari ini?',
    'What are you having today?',
  );
  String get pickupIntro => _pick(
    'Mulai dari pickup. Delivery akan menyusul setelah alur pickup stabil.',
    'Mulakan dengan ambil sendiri. Penghantaran akan menyusul selepas aliran pickup stabil.',
    'Start with pickup. Delivery will follow after the pickup flow is stable.',
  );
  String get orderFromThisOutlet => _pick(
    'Pesan dari outlet ini',
    'Pesan dari cawangan ini',
    'Order from this outlet',
  );
  String get temporarilyUnavailable => _pick(
    'Sedang tidak tersedia',
    'Tidak tersedia buat masa ini',
    'Temporarily unavailable',
  );
  String get notImplementedYet =>
      _pick('Belum tersedia', 'Belum tersedia', 'Not available yet');
  String get noMenuAvailable => _pick(
    'Belum ada menu yang tersedia.',
    'Belum ada menu yang tersedia.',
    'No menu is available yet.',
  );
  String get previewCatalogNotice => _pick(
    'Katalog preview dari API development. Bukan data production.',
    'Katalog pratonton daripada API pembangunan. Bukan data produksi.',
    'Preview catalog from the development API. This is not production data.',
  );
  String get developmentPreviewCatalog => _pick(
    'Katalog preview development',
    'Katalog pratonton pembangunan',
    'Development preview catalog',
  );
  String get orderCoffee => _pick('Pesan Kopi', 'Pesan Kopi', 'Order Coffee');

  String get menuLoadFailed => _pick(
    'Menu belum bisa dimuat.',
    'Menu belum dapat dimuatkan.',
    'The menu could not be loaded.',
  );
  String get menuLoadFailedBody => _pick(
    'Periksa koneksi ke Fusionify Coffee API lalu coba lagi.',
    'Periksa sambungan ke Fusionify Coffee API dan cuba lagi.',
    'Check the connection to the Fusionify Coffee API and try again.',
  );
  String get productNotFound => _pick(
    'Produk tidak ditemukan.',
    'Produk tidak ditemui.',
    'Product not found.',
  );
  String productAddedToCart(String productName) => _pick(
    '$productName ditambahkan ke keranjang.',
    '$productName ditambah ke troli.',
    '$productName added to cart.',
  );
  String get addToCart =>
      _pick('Tambah ke Keranjang', 'Tambah ke Troli', 'Add to Cart');
  String get viewCart => _pick('Lihat keranjang', 'Lihat troli', 'View cart');

  String get emptyCartTitle => _pick(
    'Keranjang masih kosong.',
    'Troli masih kosong.',
    'Your cart is empty.',
  );
  String get emptyCartBody => _pick(
    'Pilih kopi dan custom sesuai selera kamu.',
    'Pilih kopi dan ubah suai ikut citarasa anda.',
    'Choose a drink and customize it your way.',
  );

  String get ordersEmpty => _pick(
    'Belum ada pesanan. Riwayat pesanan akan muncul di sini.',
    'Belum ada pesanan. Sejarah pesanan akan muncul di sini.',
    'No orders yet. Your order history will appear here.',
  );
  String get rewardsComingSoon => _pick(
    'Fusion Points belum aktif. Rewards akan hadir setelah alur pesanan stabil.',
    'Fusion Points belum aktif. Ganjaran akan hadir selepas aliran pesanan stabil.',
    'Fusion Points are not active yet. Rewards will follow after the order flow is stable.',
  );

  String get createAccount =>
      _pick('Buat akun', 'Cipta akaun', 'Create account');
  String get login => _pick('Masuk', 'Log masuk', 'Log in');
  String get logout => _pick('Keluar', 'Log keluar', 'Log out');
  String get logoutAll => _pick(
    'Keluar dari semua perangkat',
    'Log keluar semua peranti',
    'Log out all devices',
  );
  String get phoneNumber => _pick('Nomor HP', 'Nombor telefon', 'Phone number');
  String get phoneOrEmail =>
      _pick('Nomor HP / Email', 'Nombor telefon / E-mel', 'Phone / Email');
  String get country => _pick('Negara', 'Negara', 'Country');
  String get indonesia => 'Indonesia';
  String get malaysia => 'Malaysia';
  String get sendWhatsApp => _pick(
    'Kirim via WhatsApp',
    'Hantar melalui WhatsApp',
    'Send via WhatsApp',
  );
  String get sendSms =>
      _pick('Kirim via SMS', 'Hantar melalui SMS', 'Send via SMS');
  String get otpTitle =>
      _pick('Verifikasi nomor', 'Sahkan nombor', 'Verify your number');
  String get otpCode => _pick('Kode 6 digit', 'Kod 6 digit', '6-digit code');
  String get verify => _pick('Verifikasi', 'Sahkan', 'Verify');
  String get resend => _pick('Kirim ulang', 'Hantar semula', 'Resend');
  String get useSmsInstead =>
      _pick('Gunakan SMS', 'Gunakan SMS', 'Use SMS instead');
  String get useWhatsAppInstead =>
      _pick('Gunakan WhatsApp', 'Gunakan WhatsApp', 'Use WhatsApp instead');
  String get fullName => _pick('Nama lengkap', 'Nama penuh', 'Full name');
  String get email => _pick('Email', 'E-mel', 'Email');
  String get emailOptional =>
      _pick('Email (opsional)', 'E-mel (pilihan)', 'Email (optional)');
  String get password => _pick('Password', 'Kata laluan', 'Password');
  String get minimumPassword =>
      _pick('Minimum 8 karakter', 'Minimum 8 aksara', 'Minimum 8 characters');
  String get completeProfile =>
      _pick('Lengkapi profil', 'Lengkapkan profil', 'Complete profile');
  String get language => _pick('Bahasa', 'Bahasa', 'Language');
  String get personalInformation =>
      _pick('Informasi pribadi', 'Maklumat peribadi', 'Personal information');
  String get security => _pick('Keamanan', 'Keselamatan', 'Security');
  String get verified => _pick('Terverifikasi', 'Disahkan', 'Verified');
  String get memberSince => _pick('Member sejak', 'Ahli sejak', 'Member since');
  String get yourCoffee => _pick('Kopi Kamu', 'Kopi Anda', 'Your Coffee');
  String get buyAgain => _pick('Pesan Lagi', 'Pesan Semula', 'Buy Again');
  String get favorites => _pick('Favorit', 'Kegemaran', 'Favorites');
  String get vouchers => _pick('Voucher', 'Baucar', 'Vouchers');
  String get fusionifyBenefits =>
      _pick('Benefit Fusionify', 'Manfaat Fusionify', 'Fusionify Benefits');
  String get wifiAccess => _pick('Akses Wi-Fi', 'Akses Wi-Fi', 'Wi-Fi Access');
  String get aiBenefits => _pick('Benefit AI', 'Manfaat AI', 'AI Benefits');
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
  String get accountSessionUnavailable => _pick(
    'Sesi akun tidak tersedia.',
    'Sesi akaun tidak tersedia.',
    'Account session is not available.',
  );
  String get passwordAuthenticationEnabled => _pick(
    'Autentikasi password aktif',
    'Pengesahan kata laluan aktif',
    'Password authentication enabled',
  );
  String get fusionMember =>
      _pick('Fusion Member', 'Ahli Fusion', 'Fusion Member');
  String get languageSavedLocally => _pick(
    'Bahasa sudah diubah di perangkat ini. Sinkronisasi akun akan dicoba lagi nanti.',
    'Bahasa telah diubah pada peranti ini. Penyelarasan akaun akan dicuba semula nanti.',
    'Language changed on this device. Account sync will retry later.',
  );

  String get genericError => _pick(
    'Terjadi masalah. Coba lagi.',
    'Sesuatu berlaku. Cuba lagi.',
    'Something went wrong. Please try again.',
  );
  String get serverUnavailable => _pick(
    'Tidak bisa terhubung ke server Fusionify Coffee.',
    'Tidak dapat menyambung ke pelayan Fusionify Coffee.',
    'Unable to reach the Fusionify Coffee server.',
  );
  String get invalidCredentials => _pick(
    'Nomor/email atau password tidak valid.',
    'Nombor/e-mel atau kata laluan tidak sah.',
    'Invalid phone/email or password.',
  );
  String get otpIncorrect =>
      _pick('Kode OTP salah.', 'Kod OTP salah.', 'The OTP code is incorrect.');
  String get otpExpired => _pick(
    'Kode OTP sudah kedaluwarsa.',
    'Kod OTP telah tamat.',
    'The OTP has expired.',
  );
  String get otpUnavailable => _pick(
    'Kode OTP sudah tidak tersedia. Minta kode baru.',
    'Kod OTP tidak lagi tersedia. Minta kod baharu.',
    'The OTP is no longer available. Request a new code.',
  );
  String get otpAttemptLimit => _pick(
    'Batas percobaan OTP tercapai. Minta kode baru.',
    'Had percubaan OTP dicapai. Minta kod baharu.',
    'OTP attempt limit reached. Request a new code.',
  );
  String get otpWaitBeforeResend => _pick(
    'Tunggu sebentar sebelum meminta OTP lagi.',
    'Tunggu sebentar sebelum meminta OTP lagi.',
    'Please wait before requesting another OTP.',
  );
  String get accountAlreadyExists => _pick(
    'Akun dengan nomor ini sudah ada.',
    'Akaun dengan nombor ini sudah wujud.',
    'An account already exists for this phone number.',
  );
  String get invalidFullName => _pick(
    'Masukkan nama lengkap yang valid.',
    'Masukkan nama penuh yang sah.',
    'Enter a valid full name.',
  );
  String get invalidEmail => _pick(
    'Alamat email tidak valid.',
    'Alamat e-mel tidak sah.',
    'Email address is invalid.',
  );
  String get passwordRequirement => _pick(
    'Password harus 8–128 karakter.',
    'Kata laluan mesti 8–128 aksara.',
    'Password must contain 8–128 characters.',
  );

  String get signInBeforeCheckout => _pick(
    'Masuk sebelum checkout',
    'Log masuk sebelum checkout',
    'Sign in before checkout',
  );
  String get checkoutAccountReason => _pick(
    'Pesanan, pembayaran, dan riwayat harus terhubung ke akun Fusionify yang terverifikasi.',
    'Pesanan, pembayaran dan sejarah perlu dipautkan kepada akaun Fusionify yang disahkan.',
    'Your order, payment, and history need to belong to a verified Fusionify account.',
  );
  String get pickupReadyInstruction => _pick(
    'Ambil pesanan di outlet ini setelah status Siap.',
    'Ambil pesanan di cawangan ini selepas status Sedia.',
    'Pick up your order here after the status changes to Ready.',
  );
  String get serverPriceNotice => _pick(
    'Harga final dihitung ulang oleh server dari menu dan modifier aktif sebelum QRIS dibuat.',
    'Harga akhir dikira semula oleh pelayan berdasarkan menu dan modifier aktif sebelum QRIS dibuat.',
    'The server recalculates the final price from active menu items and modifiers before creating QRIS.',
  );
  String get checkoutLoadFailed => _pick(
    'Outlet checkout belum bisa dimuat.',
    'Cawangan checkout belum dapat dimuatkan.',
    'The checkout outlet could not be loaded.',
  );
  String get preparingPayment => _pick(
    'Menyiapkan pembayaran…',
    'Menyediakan pembayaran…',
    'Preparing payment…',
  );
  String get continueToQris =>
      _pick('Lanjut ke QRIS', 'Teruskan ke QRIS', 'Continue to QRIS');
  String get checkoutProcessingFailed => _pick(
    'Checkout belum bisa diproses. Coba lagi.',
    'Checkout belum dapat diproses. Cuba lagi.',
    'Checkout could not be processed. Try again.',
  );
  String get paymentProviderNotConfigured => _pick(
    'Payment provider belum dikonfigurasi pada server ini.',
    'Penyedia pembayaran belum dikonfigurasi pada pelayan ini.',
    'The payment provider is not configured on this server.',
  );
  String get checkoutServerUnavailable => _pick(
    'Tidak bisa terhubung ke server checkout.',
    'Tidak dapat menyambung ke pelayan checkout.',
    'Unable to reach the checkout server.',
  );

  String get qrisPayment =>
      _pick('Pembayaran QRIS', 'Pembayaran QRIS', 'QRIS Payment');
  String get paymentStatusLoadFailed => _pick(
    'Status pembayaran belum bisa dimuat.',
    'Status pembayaran belum dapat dimuatkan.',
    'Payment status could not be loaded.',
  );
  String get paymentProviderCheckFailed => _pick(
    'Belum bisa mengecek provider. Coba lagi.',
    'Belum dapat menyemak penyedia. Cuba lagi.',
    'Unable to check the payment provider. Try again.',
  );
  String get paymentCancelFailed => _pick(
    'Pembayaran belum bisa dibatalkan.',
    'Pembayaran belum dapat dibatalkan.',
    'The payment could not be cancelled.',
  );
  String get paymentNotFound => _pick(
    'Pembayaran tidak ditemukan.',
    'Pembayaran tidak ditemui.',
    'Payment not found.',
  );
  String get scanQrisInstruction => _pick(
    'Scan QR ini dari aplikasi pembayaran yang mendukung QRIS. Status akan diperbarui otomatis saat webhook diterima.',
    'Imbas QR ini menggunakan aplikasi pembayaran yang menyokong QRIS. Status akan dikemas kini secara automatik apabila webhook diterima.',
    'Scan this QR with a payment app that supports QRIS. Status updates automatically when the webhook is received.',
  );
  String get checkStatus => _pick('Cek Status', 'Semak Status', 'Check Status');
  String get cancelling => _pick('Membatalkan…', 'Membatalkan…', 'Cancelling…');
  String get cancelPendingPayment => _pick(
    'Batalkan Pembayaran Pending',
    'Batalkan Pembayaran Tertunda',
    'Cancel Pending Payment',
  );
  String get viewOrder => _pick('Lihat Pesanan', 'Lihat Pesanan', 'View Order');
  String get backToCart =>
      _pick('Kembali ke Keranjang', 'Kembali ke Troli', 'Back to Cart');
  String expiresIn(String time) =>
      _pick('Kedaluwarsa dalam $time', 'Tamat dalam $time', 'Expires in $time');
  String providerExpiry(String value) => _pick(
    'Kedaluwarsa provider: $value',
    'Tamat penyedia: $value',
    'Provider expiry: $value',
  );
  String get followPaymentStatus => _pick(
    'Ikuti status pembayaran yang ditampilkan di aplikasi ini.',
    'Ikuti status pembayaran yang dipaparkan dalam aplikasi ini.',
    'Follow the payment status shown in this app.',
  );
  String get paymentReceived =>
      _pick('Pembayaran diterima', 'Pembayaran diterima', 'Payment received');
  String get paymentExpired =>
      _pick('Pembayaran kedaluwarsa', 'Pembayaran tamat', 'Payment expired');
  String get paymentCancelled => _pick(
    'Pembayaran dibatalkan',
    'Pembayaran dibatalkan',
    'Payment cancelled',
  );
  String get paymentFailed =>
      _pick('Pembayaran gagal', 'Pembayaran gagal', 'Payment failed');
  String get waitingForPayment => _pick(
    'Menunggu pembayaran',
    'Menunggu pembayaran',
    'Waiting for payment',
  );
}

extension AppStringsContext on BuildContext {
  AppStrings get strings => AppStrings.of(this);
}
