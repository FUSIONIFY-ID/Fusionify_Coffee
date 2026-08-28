class CheckoutOrder {
  const CheckoutOrder({
    required this.id,
    required this.status,
    required this.currency,
    required this.subtotal,
    required this.totalAmount,
  });

  factory CheckoutOrder.fromJson(Map<String, dynamic> json) {
    return CheckoutOrder(
      id: json['id'] as String? ?? '',
      status: json['status'] as String? ?? '',
      currency: json['currency'] as String? ?? 'IDR',
      subtotal: json['subtotal'] as int? ?? 0,
      totalAmount: json['totalAmount'] as int? ?? 0,
    );
  }

  final String id;
  final String status;
  final String currency;
  final int subtotal;
  final int totalAmount;
}

class PaymentView {
  const PaymentView({
    required this.id,
    required this.orderId,
    required this.provider,
    required this.channel,
    required this.status,
    required this.amount,
    required this.currency,
    this.qrString,
    this.qrUrl,
    this.checkoutUrl,
    this.expiryTime,
    this.providerRawStatus,
    this.paidAt,
    this.cancelledAt,
  });

  factory PaymentView.fromJson(Map<String, dynamic> json) {
    return PaymentView(
      id: json['id'] as String? ?? '',
      orderId: json['orderId'] as String? ?? '',
      provider: json['provider'] as String? ?? '',
      channel: json['channel'] as String? ?? '',
      status: json['status'] as String? ?? '',
      amount: json['amount'] as int? ?? 0,
      currency: json['currency'] as String? ?? 'IDR',
      qrString: json['qrString'] as String?,
      qrUrl: json['qrUrl'] as String?,
      checkoutUrl: json['checkoutUrl'] as String?,
      expiryTime: json['expiryTime'] as String?,
      providerRawStatus: json['providerRawStatus'] as String?,
      paidAt: json['paidAt'] as String?,
      cancelledAt: json['cancelledAt'] as String?,
    );
  }

  final String id;
  final String orderId;
  final String provider;
  final String channel;
  final String status;
  final int amount;
  final String currency;
  final String? qrString;
  final String? qrUrl;
  final String? checkoutUrl;
  final String? expiryTime;
  final String? providerRawStatus;
  final String? paidAt;
  final String? cancelledAt;

  bool get isPending => status == 'PENDING';
  bool get isPaid => status == 'PAID';
  bool get isTerminal =>
      status == 'PAID' ||
      status == 'EXPIRED' ||
      status == 'CANCELLED' ||
      status == 'FAILED' ||
      status == 'REFUNDED';

  DateTime? get expiresAt {
    final value = expiryTime?.trim();
    if (value == null || value.isEmpty) {
      return null;
    }

    if (value.contains('T')) {
      return DateTime.tryParse(value);
    }

    return DateTime.tryParse('${value.replaceFirst(' ', 'T')}+07:00');
  }
}
