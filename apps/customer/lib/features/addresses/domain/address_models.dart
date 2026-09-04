class SavedAddress {
  const SavedAddress({
    required this.id,
    required this.label,
    required this.recipientName,
    required this.phoneE164,
    required this.country,
    required this.line1,
    required this.city,
    required this.latitude,
    required this.longitude,
    required this.isDefault,
    this.line2,
    this.region,
    this.postalCode,
    this.deliveryNotes,
  });

  factory SavedAddress.fromJson(Map<String, dynamic> json) {
    return SavedAddress(
      id: json['id'] as String? ?? '',
      label: json['label'] as String? ?? '',
      recipientName: json['recipientName'] as String? ?? '',
      phoneE164: json['phoneE164'] as String? ?? '',
      country: json['country'] as String? ?? 'ID',
      line1: json['line1'] as String? ?? '',
      line2: json['line2'] as String?,
      city: json['city'] as String? ?? '',
      region: json['region'] as String?,
      postalCode: json['postalCode'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0,
      deliveryNotes: json['deliveryNotes'] as String?,
      isDefault: json['isDefault'] as bool? ?? false,
    );
  }

  final String id;
  final String label;
  final String recipientName;
  final String phoneE164;
  final String country;
  final String line1;
  final String? line2;
  final String city;
  final String? region;
  final String? postalCode;
  final double latitude;
  final double longitude;
  final String? deliveryNotes;
  final bool isDefault;

  String get compactAddress {
    return [
      line1,
      city,
      region,
      postalCode,
    ].whereType<String>().where((value) => value.trim().isNotEmpty).join(', ');
  }
}

class DeliveryQuote {
  const DeliveryQuote({
    required this.serviceable,
    required this.outletId,
    this.addressId,
    this.reason,
    this.distanceMeters,
    this.radiusMeters,
    this.fee,
    this.currency,
  });

  factory DeliveryQuote.fromJson(Map<String, dynamic> json) {
    return DeliveryQuote(
      serviceable: json['serviceable'] as bool? ?? false,
      outletId: json['outletId'] as String? ?? '',
      addressId: json['addressId'] as String?,
      reason: json['reason'] as String?,
      distanceMeters: json['distanceMeters'] as int?,
      radiusMeters: json['radiusMeters'] as int?,
      fee: json['fee'] as int?,
      currency: json['currency'] as String?,
    );
  }

  final bool serviceable;
  final String outletId;
  final String? addressId;
  final String? reason;
  final int? distanceMeters;
  final int? radiusMeters;
  final int? fee;
  final String? currency;
}
