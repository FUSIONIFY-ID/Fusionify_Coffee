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
    this.fulfillmentType = 'PICKUP',
    this.scheduledFor,
    this.deliveryFee = 0,
  });

  factory CustomerOrderSummary.fromJson(Map<String, dynamic> json) {
    final outlet = _map(json['outlet']);
    final rawItems = _list(json['items']);
    final rawPayments = _list(json['payments']);

    return CustomerOrderSummary(
      id: json['id'] as String? ?? '',
      status: json['status'] as String? ?? '',
      currency: json['currency'] as String? ?? 'IDR',
      totalAmount: json['totalAmount'] as int? ?? 0,
      createdAt: _date(json['createdAt']),
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
          : _map(rawPayments.first)['status'] as String?,
      fulfillmentType: json['fulfillmentType'] as String? ?? 'PICKUP',
      scheduledFor: _nullableDate(json['scheduledFor']),
      deliveryFee: json['deliveryFee'] as int? ?? 0,
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
  final String fulfillmentType;
  final DateTime? scheduledFor;
  final int deliveryFee;
}

class CustomerOrderDetail {
  const CustomerOrderDetail({
    required this.id,
    required this.status,
    required this.currency,
    required this.totalAmount,
    required this.createdAt,
    required this.outletName,
    required this.items,
    required this.statusEvents,
    this.paymentStatus,
    this.fulfillmentType = 'PICKUP',
    this.scheduledFor,
    this.deliveryFee = 0,
    this.deliveryDistanceMeters,
    this.deliveryAddress,
    this.subtotal = 0,
    this.discountAmount = 0,
  });

  factory CustomerOrderDetail.fromJson(Map<String, dynamic> json) {
    final outlet = _map(json['outlet']);
    final rawItems = _list(json['items']);
    final rawPayments = _list(json['payments']);
    final rawEvents = _list(json['statusEvents']);
    final rawAddress = _map(json['deliveryAddressSnapshot']);

    return CustomerOrderDetail(
      id: json['id'] as String? ?? '',
      status: json['status'] as String? ?? '',
      currency: json['currency'] as String? ?? 'IDR',
      totalAmount: json['totalAmount'] as int? ?? 0,
      createdAt: _date(json['createdAt']),
      outletName: outlet['name'] as String? ?? 'Fusionify Coffee',
      items: rawItems
          .whereType<Map>()
          .map(
            (item) => CustomerOrderItem.fromJson(
              Map<String, dynamic>.from(item),
            ),
          )
          .toList(),
      statusEvents: rawEvents
          .whereType<Map>()
          .map(
            (event) => CustomerOrderStatusEvent.fromJson(
              Map<String, dynamic>.from(event),
            ),
          )
          .toList(),
      paymentStatus: rawPayments.isEmpty
          ? null
          : _map(rawPayments.first)['status'] as String?,
      fulfillmentType: json['fulfillmentType'] as String? ?? 'PICKUP',
      scheduledFor: _nullableDate(json['scheduledFor']),
      deliveryFee: json['deliveryFee'] as int? ?? 0,
      deliveryDistanceMeters: json['deliveryDistanceMeters'] as int?,
      deliveryAddress: rawAddress.isEmpty
          ? null
          : CustomerDeliveryAddressSnapshot.fromJson(rawAddress),
      subtotal: json['subtotal'] as int? ?? 0,
      discountAmount: json['discountAmount'] as int? ?? 0,
    );
  }

  final String id;
  final String status;
  final String currency;
  final int totalAmount;
  final DateTime createdAt;
  final String outletName;
  final List<CustomerOrderItem> items;
  final List<CustomerOrderStatusEvent> statusEvents;
  final String? paymentStatus;
  final String fulfillmentType;
  final DateTime? scheduledFor;
  final int deliveryFee;
  final int? deliveryDistanceMeters;
  final CustomerDeliveryAddressSnapshot? deliveryAddress;
  final int subtotal;
  final int discountAmount;
}

class CustomerDeliveryAddressSnapshot {
  const CustomerDeliveryAddressSnapshot({
    required this.label,
    required this.recipientName,
    required this.phoneE164,
    required this.line1,
    required this.city,
    required this.country,
    this.line2,
    this.region,
    this.postalCode,
    this.deliveryNotes,
  });

  factory CustomerDeliveryAddressSnapshot.fromJson(Map<String, dynamic> json) {
    return CustomerDeliveryAddressSnapshot(
      label: json['label'] as String? ?? '',
      recipientName: json['recipientName'] as String? ?? '',
      phoneE164: json['phoneE164'] as String? ?? '',
      line1: json['line1'] as String? ?? '',
      line2: json['line2'] as String?,
      city: json['city'] as String? ?? '',
      region: json['region'] as String?,
      postalCode: json['postalCode'] as String?,
      country: json['country'] as String? ?? '',
      deliveryNotes: json['deliveryNotes'] as String?,
    );
  }

  final String label;
  final String recipientName;
  final String phoneE164;
  final String line1;
  final String? line2;
  final String city;
  final String? region;
  final String? postalCode;
  final String country;
  final String? deliveryNotes;

  String get compactAddress {
    return [line1, line2, city, region, postalCode]
        .whereType<String>()
        .where((value) => value.trim().isNotEmpty)
        .join(', ');
  }
}

class CustomerOrderItem {
  const CustomerOrderItem({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.lineTotal,
    required this.selectedModifiers,
  });

  factory CustomerOrderItem.fromJson(Map<String, dynamic> json) {
    final rawModifiers = _list(json['selectedModifiers']);

    return CustomerOrderItem(
      productId: json['productId'] as String? ?? '',
      productName: json['productName'] as String? ?? '',
      quantity: json['quantity'] as int? ?? 0,
      lineTotal: json['lineTotal'] as int? ?? 0,
      selectedModifiers: rawModifiers
          .whereType<Map>()
          .map(
            (modifier) => CustomerOrderModifier.fromJson(
              Map<String, dynamic>.from(modifier),
            ),
          )
          .toList(),
    );
  }

  final String productId;
  final String productName;
  final int quantity;
  final int lineTotal;
  final List<CustomerOrderModifier> selectedModifiers;
}

class CustomerOrderModifier {
  const CustomerOrderModifier({
    required this.optionId,
    required this.groupName,
    required this.optionName,
    required this.priceDelta,
  });

  factory CustomerOrderModifier.fromJson(Map<String, dynamic> json) {
    return CustomerOrderModifier(
      optionId: json['optionId'] as String? ?? '',
      groupName: json['groupName'] as String? ?? '',
      optionName: json['optionName'] as String? ?? '',
      priceDelta: json['priceDelta'] as int? ?? 0,
    );
  }

  final String optionId;
  final String groupName;
  final String optionName;
  final int priceDelta;
}

class CustomerOrderStatusEvent {
  const CustomerOrderStatusEvent({
    required this.toStatus,
    required this.createdAt,
    this.fromStatus,
    this.note,
  });

  factory CustomerOrderStatusEvent.fromJson(Map<String, dynamic> json) {
    return CustomerOrderStatusEvent(
      fromStatus: json['fromStatus'] as String?,
      toStatus: json['toStatus'] as String? ?? '',
      note: json['note'] as String?,
      createdAt: _date(json['createdAt']),
    );
  }

  final String? fromStatus;
  final String toStatus;
  final String? note;
  final DateTime createdAt;
}

Map<String, dynamic> _map(Object? value) {
  return value is Map
      ? Map<String, dynamic>.from(value)
      : const <String, dynamic>{};
}

List<dynamic> _list(Object? value) {
  return value is List ? value : const <dynamic>[];
}

DateTime _date(Object? value) {
  return DateTime.tryParse(value as String? ?? '') ?? DateTime(2026);
}

DateTime? _nullableDate(Object? value) {
  if (value is! String || value.isEmpty) return null;
  return DateTime.tryParse(value);
}
