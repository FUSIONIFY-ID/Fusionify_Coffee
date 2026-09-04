import 'app_strings.dart';

extension DeliveryStrings on AppStrings {
  String _deliveryPick(String id, String ms, String en) {
    return switch (languageCode) {
      'id' => id,
      'ms' => ms,
      _ => en,
    };
  }

  String get savedAddresses =>
      _deliveryPick('Alamat tersimpan', 'Alamat disimpan', 'Saved addresses');
  String get addAddress =>
      _deliveryPick('Tambah alamat', 'Tambah alamat', 'Add address');
  String get editAddress =>
      _deliveryPick('Edit alamat', 'Edit alamat', 'Edit address');
  String get addressLabel =>
      _deliveryPick('Label alamat', 'Label alamat', 'Address label');
  String get recipientName =>
      _deliveryPick('Nama penerima', 'Nama penerima', 'Recipient name');
  String get addressLine1 =>
      _deliveryPick('Alamat lengkap', 'Alamat penuh', 'Street address');
  String get addressLine2 =>
      _deliveryPick('Detail tambahan', 'Butiran tambahan', 'Address line 2');
  String get city => _deliveryPick('Kota', 'Bandar', 'City');
  String get region => _deliveryPick('Provinsi', 'Negeri', 'Region');
  String get postalCode =>
      _deliveryPick('Kode pos', 'Poskod', 'Postal code');
  String get deliveryNotes =>
      _deliveryPick('Catatan kurir', 'Nota penghantar', 'Delivery notes');
  String get latitude => _deliveryPick('Latitude', 'Latitud', 'Latitude');
  String get longitude => _deliveryPick('Longitude', 'Longitud', 'Longitude');
  String get coordinatesHelp => _deliveryPick(
    'Untuk tahap ini, pin peta belum aktif. Masukkan koordinat lokasi agar radius delivery dapat dihitung server.',
    'Buat masa ini pin peta belum aktif. Masukkan koordinat lokasi supaya radius penghantaran dapat dikira pelayan.',
    'Map pin search is not active yet. Enter location coordinates so the server can calculate delivery radius.',
  );
  String get defaultAddress =>
      _deliveryPick('Alamat utama', 'Alamat utama', 'Default address');
  String get saveAddress =>
      _deliveryPick('Simpan alamat', 'Simpan alamat', 'Save address');
  String get addressSaved =>
      _deliveryPick('Alamat tersimpan.', 'Alamat disimpan.', 'Address saved.');
  String get addressDeleted =>
      _deliveryPick('Alamat dihapus.', 'Alamat dipadam.', 'Address deleted.');
  String get addressesEmpty => _deliveryPick(
    'Belum ada alamat tersimpan.',
    'Belum ada alamat disimpan.',
    'No saved addresses yet.',
  );
  String get addressesLoadFailed => _deliveryPick(
    'Alamat belum bisa dimuat.',
    'Alamat belum dapat dimuatkan.',
    'Addresses could not be loaded.',
  );
  String get addressInvalid => _deliveryPick(
    'Lengkapi alamat dan koordinat yang valid.',
    'Lengkapkan alamat dan koordinat yang sah.',
    'Complete the address and enter valid coordinates.',
  );
  String get fulfillmentMethod => _deliveryPick(
    'Cara menerima pesanan',
    'Cara menerima pesanan',
    'Fulfillment method',
  );
  String get pickupNow =>
      _deliveryPick('Secepatnya', 'Secepat mungkin', 'As soon as possible');
  String get scheduledPickup =>
      _deliveryPick('Jadwalkan pickup', 'Jadualkan ambilan', 'Schedule pickup');
  String get choosePickupTime => _deliveryPick(
    'Pilih waktu pickup',
    'Pilih waktu ambilan',
    'Choose pickup time',
  );
  String scheduledForLabel(String value) => _deliveryPick(
    'Dijadwalkan $value',
    'Dijadualkan $value',
    'Scheduled for $value',
  );
  String get scheduleWindowHelp => _deliveryPick(
    'Minimal 15 menit dari sekarang dan maksimal 7 hari.',
    'Minimum 15 minit dari sekarang dan maksimum 7 hari.',
    'At least 15 minutes from now and within 7 days.',
  );
  String get chooseDeliveryAddress => _deliveryPick(
    'Pilih alamat delivery',
    'Pilih alamat penghantaran',
    'Choose delivery address',
  );
  String get deliveryFee =>
      _deliveryPick('Biaya delivery', 'Caj penghantaran', 'Delivery fee');
  String get estimatedTotal =>
      _deliveryPick('Perkiraan total', 'Anggaran jumlah', 'Estimated total');
  String get deliveryAvailable => _deliveryPick(
    'Alamat ini masuk area delivery.',
    'Alamat ini dalam kawasan penghantaran.',
    'This address is within the delivery area.',
  );
  String get deliveryOutsideArea => _deliveryPick(
    'Alamat ini di luar area delivery outlet.',
    'Alamat ini di luar kawasan penghantaran cawangan.',
    'This address is outside the outlet delivery area.',
  );
  String get deliveryNotConfigured => _deliveryPick(
    'Delivery belum dikonfigurasi untuk outlet ini.',
    'Penghantaran belum dikonfigurasi untuk cawangan ini.',
    'Delivery is not configured for this outlet.',
  );
  String get deliveryQuoteFailed => _deliveryPick(
    'Estimasi delivery belum bisa dihitung.',
    'Anggaran penghantaran belum dapat dikira.',
    'Delivery estimate could not be calculated.',
  );
  String get deliveryAddressRequired => _deliveryPick(
    'Pilih alamat delivery terlebih dahulu.',
    'Pilih alamat penghantaran terlebih dahulu.',
    'Choose a delivery address first.',
  );
  String get deliveryUnavailableForAddress => _deliveryPick(
    'Alamat yang dipilih belum dapat dilayani oleh outlet ini.',
    'Alamat yang dipilih belum dapat dilayan oleh cawangan ini.',
    'The selected address is not serviceable by this outlet.',
  );
}
