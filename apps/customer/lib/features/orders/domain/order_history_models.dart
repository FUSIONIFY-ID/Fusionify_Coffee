class CustomerOrderSummary {
  const CustomerOrderSummary({
    required this.id,
    required this.status,
    required this.currency,
    required this.totalAmount,
    required this.createdAt,
    required this.outletName,
    required this.items,
    this.paymentStatus,
  });

  factory CustomerOrderSummary.fromJson(Map<String, dynamic> json) {
    final outlet = json['outlet'] is Map
        ? Map<String, dynamic>.from(json['outlet'] as Map)
        : const <String, dynamic>{};
    final rawItems = json['items'] is List ? json['items'] as List : const [];
    final rawPayments =
        json['payments'] is List ? json['payments'] as List : const [];

    return CustomerOrderSummary(
      id: json['id'] as String? ?? '',
      status: json['status'] as String? ?? '',
      currency: json['currency'] as String? ?? 'IDR',
      totalAmount: json['totalAmount'] as int? ?? 0,
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime(2026),
      outletName: outlet['name'] as String? ?? 'Fusionify Coffee',
      items: rawItems
          .whereType<Map>()
          .map(
            (item) => CustomerOrderItem.fromJson(
              Map<String, dynamic>.from(item),
            ),
          )
          .toList(),
      paymentStatus: rawPayments.isEmpty
          ? null
          : Map<String, dynamic>.from(rawPayments.first as Map)['status']
                as String?,
    );
  }

  final String id;
  final String status;
  final String currency;
  final int totalAmount;
  final DateTime createdAt;
  final String outletName;
  final List<CustomerOrderItem> items;
  final String? paymentStatus;
}

class CustomerOrderItem {
  const CustomerOrderItem({
    required this.productName,
    required this.quantity,
    required this.lineTotal,
  });

  factory CustomerOrderItem.fromJson(Map<String, dynamic> json) {
    return CustomerOrderItem(
      productName: json['productName'] as String? ?? '',
      quantity: json['quantity'] as int? ?? 0,
      lineTotal: json['lineTotal'] as int? ?? 0,
    );
  }

  final String productName;
  final int quantity;
  final int lineTotal;
}
