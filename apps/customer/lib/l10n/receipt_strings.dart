import 'app_strings.dart';

extension ReceiptStrings on AppStrings {
  String _receiptPick(String id, String ms, String en) {
    return switch (languageCode) {
      'id' => id,
      'ms' => ms,
      _ => en,
    };
  }

  String get digitalReceipt =>
      _receiptPick('Struk Digital', 'Resit Digital', 'Digital Receipt');
  String get receiptLoadFailed => _receiptPick(
    'Struk digital belum bisa dimuat.',
    'Resit digital belum dapat dimuatkan.',
    'Digital receipt could not be loaded.',
  );
  String get receiptOrderSummary => _receiptPick(
    'Ringkasan transaksi',
    'Ringkasan transaksi',
    'Transaction summary',
  );
  String get receiptSubtotal =>
      _receiptPick('Subtotal', 'Jumlah kecil', 'Subtotal');
  String get receiptDiscount => _receiptPick('Diskon', 'Diskaun', 'Discount');
  String get receiptDeliveryFee =>
      _receiptPick('Biaya pengantaran', 'Caj penghantaran', 'Delivery fee');
  String get receiptPayment =>
      _receiptPick('Pembayaran', 'Pembayaran', 'Payment');
  String get receiptVoucher => _receiptPick('Voucher', 'Baucar', 'Voucher');
  String get receiptBenefitsIssued => _receiptPick(
    'Benefit digital diterbitkan',
    'Manfaat digital dikeluarkan',
    'Digital benefits issued',
  );
  String get viewBenefits =>
      _receiptPick('Lihat benefit', 'Lihat manfaat', 'View benefits');
  String get receiptServerNotice => _receiptPick(
    'Struk ini berasal dari data pesanan yang tersimpan di server Fusionify Coffee.',
    'Resit ini berasal daripada data pesanan yang disimpan pada pelayan Fusionify Coffee.',
    'This receipt is rendered from order data stored by the Fusionify Coffee server.',
  );
  String get openDigitalReceipt => _receiptPick(
    'Buka Struk Digital',
    'Buka Resit Digital',
    'Open Digital Receipt',
  );
}
