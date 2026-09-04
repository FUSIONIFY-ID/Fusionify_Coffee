class CustomerRealtimeSnapshot {
  const CustomerRealtimeSnapshot({
    required this.signature,
    required this.orders,
    required this.generatedAt,
  });

  factory CustomerRealtimeSnapshot.fromJson(Map<String, dynamic> json) {
    final rawOrders = json['orders'] is List
        ? json['orders'] as List
        : const [];
    return CustomerRealtimeSnapshot(
      signature: json['signature'] as String? ?? '',
      orders: rawOrders
          .whereType<Map>()
          .map(
            (entry) => CustomerRealtimeOrder.fromJson(
              Map<String, dynamic>.from(entry),
            ),
          )
          .toList(),
      generatedAt:
          DateTime.tryParse(json['generatedAt'] as String? ?? '') ??
          DateTime(2026),
    );
  }

  final String signature;
  final List<CustomerRealtimeOrder> orders;
  final DateTime generatedAt;

  CustomerRealtimePayment? paymentById(String paymentId) {
    for (final order in orders) {
      for (final payment in order.payments) {
        if (payment.id == paymentId) {
          return payment;
        }
      }
    }
    return null;
  }

  CustomerRealtimeOrder? orderById(String orderId) {
    for (final order in orders) {
      if (order.id == orderId) {
        return order;
      }
    }
    return null;
  }
}

class CustomerRealtimeOrder {
  const CustomerRealtimeOrder({
    required this.id,
    required this.status,
    required this.updatedAt,
    required this.payments,
  });

  factory CustomerRealtimeOrder.fromJson(Map<String, dynamic> json) {
    final rawPayments = json['payments'] is List
        ? json['payments'] as List
        : const [];
    return CustomerRealtimeOrder(
      id: json['id'] as String? ?? '',
      status: json['status'] as String? ?? '',
      updatedAt:
          DateTime.tryParse(json['updatedAt'] as String? ?? '') ??
          DateTime(2026),
      payments: rawPayments
          .whereType<Map>()
          .map(
            (entry) => CustomerRealtimePayment.fromJson(
              Map<String, dynamic>.from(entry),
            ),
          )
          .toList(),
    );
  }

  final String id;
  final String status;
  final DateTime updatedAt;
  final List<CustomerRealtimePayment> payments;
}

class CustomerRealtimePayment {
  const CustomerRealtimePayment({
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

  factory CustomerRealtimePayment.fromJson(Map<String, dynamic> json) {
    return CustomerRealtimePayment(
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
      paidAt: json['paidAt']?.toString(),
      cancelledAt: json['cancelledAt']?.toString(),
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
}
