class DigitalReceipt {
  const DigitalReceipt({
    required this.orderId,
    required this.createdAt,
    required this.status,
    required this.fulfillmentType,
    required this.outletName,
    required this.currency,
    required this.subtotal,
    required this.discountAmount,
    required this.deliveryFee,
    required this.totalAmount,
    required this.items,
    required this.benefitIds,
    this.payment,
    this.voucherCode,
    this.scheduledFor,
  });

  factory DigitalReceipt.fromJson(Map<String, dynamic> json) {
    final rawOutlet = json['outlet'];
    final outlet = rawOutlet is Map
        ? Map<String, dynamic>.from(rawOutlet)
        : const <String, dynamic>{};
    final rawPayment = json['payment'];
    final rawVoucher = json['voucher'];
    final voucher = rawVoucher is Map
        ? Map<String, dynamic>.from(rawVoucher)
        : const <String, dynamic>{};
    final rawItems = json['items'] is List ? json['items'] as List : const [];
    final rawBenefitIds = json['benefitIds'] is List
        ? json['benefitIds'] as List
        : const [];

    return DigitalReceipt(
      orderId: json['orderId'] as String? ?? '',
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime(2026),
      status: json['status'] as String? ?? '',
      fulfillmentType: json['fulfillmentType'] as String? ?? 'PICKUP',
      scheduledFor: DateTime.tryParse(json['scheduledFor'] as String? ?? ''),
      outletName: outlet['name'] as String? ?? 'Fusionify Coffee',
      currency: json['currency'] as String? ?? 'IDR',
      subtotal: json['subtotal'] as int? ?? 0,
      discountAmount: json['discountAmount'] as int? ?? 0,
      deliveryFee: json['deliveryFee'] as int? ?? 0,
      totalAmount: json['totalAmount'] as int? ?? 0,
      items: rawItems
          .whereType<Map>()
          .map((item) => ReceiptItem.fromJson(Map<String, dynamic>.from(item)))
          .toList(),
      payment: rawPayment is Map
          ? ReceiptPayment.fromJson(Map<String, dynamic>.from(rawPayment))
          : null,
      voucherCode: voucher['code'] as String?,
      benefitIds: rawBenefitIds.whereType<String>().toList(),
    );
  }

  final String orderId;
  final DateTime createdAt;
  final String status;
  final String fulfillmentType;
  final DateTime? scheduledFor;
  final String outletName;
  final String currency;
  final int subtotal;
  final int discountAmount;
  final int deliveryFee;
  final int totalAmount;
  final List<ReceiptItem> items;
  final ReceiptPayment? payment;
  final String? voucherCode;
  final List<String> benefitIds;
}

class ReceiptItem {
  const ReceiptItem({
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    required this.lineTotal,
    required this.modifiers,
  });

  factory ReceiptItem.fromJson(Map<String, dynamic> json) {
    final rawModifiers = json['selectedModifiers'] is List
        ? json['selectedModifiers'] as List
        : const [];
    return ReceiptItem(
      productName: json['productName'] as String? ?? '',
      quantity: json['quantity'] as int? ?? 0,
      unitPrice: json['unitPrice'] as int? ?? 0,
      lineTotal: json['lineTotal'] as int? ?? 0,
      modifiers: rawModifiers
          .whereType<Map>()
          .map(
            (value) =>
                ReceiptModifier.fromJson(Map<String, dynamic>.from(value)),
          )
          .toList(),
    );
  }

  final String productName;
  final int quantity;
  final int unitPrice;
  final int lineTotal;
  final List<ReceiptModifier> modifiers;
}

class ReceiptModifier {
  const ReceiptModifier({required this.optionName});

  factory ReceiptModifier.fromJson(Map<String, dynamic> json) {
    return ReceiptModifier(optionName: json['optionName'] as String? ?? '');
  }

  final String optionName;
}

class ReceiptPayment {
  const ReceiptPayment({
    required this.status,
    required this.channel,
    required this.amount,
  });

  factory ReceiptPayment.fromJson(Map<String, dynamic> json) {
    return ReceiptPayment(
      status: json['status'] as String? ?? '',
      channel: json['channel'] as String? ?? '',
      amount: json['amount'] as int? ?? 0,
    );
  }

  final String status;
  final String channel;
  final int amount;
}
