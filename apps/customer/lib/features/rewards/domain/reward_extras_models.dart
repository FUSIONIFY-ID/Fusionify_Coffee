class VoucherDefinition {
  const VoucherDefinition({
    required this.code,
    required this.title,
    required this.description,
    required this.currency,
    required this.discountType,
    required this.discountValue,
    required this.minimumSpend,
    required this.active,
    required this.validFrom,
    required this.validUntil,
    this.maximumDiscount,
    this.outletId,
  });

  factory VoucherDefinition.fromJson(Map<String, dynamic> json) {
    return VoucherDefinition(
      code: json['code'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      currency: json['currency'] as String? ?? 'IDR',
      discountType: json['discountType'] as String? ?? '',
      discountValue: json['discountValue'] as int? ?? 0,
      minimumSpend: json['minimumSpend'] as int? ?? 0,
      maximumDiscount: json['maximumDiscount'] as int?,
      outletId: json['outletId'] as String?,
      active: json['active'] as bool? ?? false,
      validFrom:
          DateTime.tryParse(json['validFrom'] as String? ?? '') ??
          DateTime(2026),
      validUntil:
          DateTime.tryParse(json['validUntil'] as String? ?? '') ??
          DateTime(2026),
    );
  }

  final String code;
  final String title;
  final String description;
  final String currency;
  final String discountType;
  final int discountValue;
  final int minimumSpend;
  final int? maximumDiscount;
  final String? outletId;
  final bool active;
  final DateTime validFrom;
  final DateTime validUntil;
}

class CustomerVoucherWalletEntry {
  const CustomerVoucherWalletEntry({
    required this.id,
    required this.status,
    required this.source,
    required this.issuedAt,
    required this.usable,
    required this.voucher,
    this.expiresAt,
  });

  factory CustomerVoucherWalletEntry.fromJson(Map<String, dynamic> json) {
    final rawVoucher = json['voucher'];
    return CustomerVoucherWalletEntry(
      id: json['id'] as String? ?? '',
      status: json['status'] as String? ?? '',
      source: json['source'] as String? ?? '',
      issuedAt:
          DateTime.tryParse(json['issuedAt'] as String? ?? '') ??
          DateTime(2026),
      expiresAt: DateTime.tryParse(json['expiresAt'] as String? ?? ''),
      usable: json['usable'] as bool? ?? false,
      voucher: VoucherDefinition.fromJson(
        rawVoucher is Map
            ? Map<String, dynamic>.from(rawVoucher)
            : const <String, dynamic>{},
      ),
    );
  }

  final String id;
  final String status;
  final String source;
  final DateTime issuedAt;
  final DateTime? expiresAt;
  final bool usable;
  final VoucherDefinition voucher;
}

class DigitalBenefitOrderRef {
  const DigitalBenefitOrderRef({
    required this.id,
    required this.createdAt,
    required this.outletName,
  });

  factory DigitalBenefitOrderRef.fromJson(Map<String, dynamic> json) {
    final rawOutlet = json['outlet'];
    final outlet = rawOutlet is Map
        ? Map<String, dynamic>.from(rawOutlet)
        : const <String, dynamic>{};
    return DigitalBenefitOrderRef(
      id: json['id'] as String? ?? '',
      createdAt:
          DateTime.tryParse(json['createdAt'] as String? ?? '') ??
          DateTime(2026),
      outletName: outlet['name'] as String? ?? 'Fusionify Coffee',
    );
  }

  final String id;
  final DateTime createdAt;
  final String outletName;
}

class DigitalBenefitEntitlement {
  const DigitalBenefitEntitlement({
    required this.id,
    required this.type,
    required this.active,
    required this.validFrom,
    required this.validUntil,
    required this.quotaUsed,
    required this.order,
    this.quotaTotal,
    this.quotaRemaining,
    this.ssid,
    this.password,
  });

  factory DigitalBenefitEntitlement.fromJson(Map<String, dynamic> json) {
    final rawPayload = json['payload'];
    final payload = rawPayload is Map
        ? Map<String, dynamic>.from(rawPayload)
        : const <String, dynamic>{};
    final rawOrder = json['order'];
    return DigitalBenefitEntitlement(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? '',
      active: json['active'] as bool? ?? false,
      validFrom:
          DateTime.tryParse(json['validFrom'] as String? ?? '') ??
          DateTime(2026),
      validUntil:
          DateTime.tryParse(json['validUntil'] as String? ?? '') ??
          DateTime(2026),
      quotaTotal: json['quotaTotal'] as int?,
      quotaUsed: json['quotaUsed'] as int? ?? 0,
      quotaRemaining: json['quotaRemaining'] as int?,
      ssid: payload['ssid'] as String?,
      password: payload['password'] as String?,
      order: DigitalBenefitOrderRef.fromJson(
        rawOrder is Map
            ? Map<String, dynamic>.from(rawOrder)
            : const <String, dynamic>{},
      ),
    );
  }

  final String id;
  final String type;
  final bool active;
  final DateTime validFrom;
  final DateTime validUntil;
  final int? quotaTotal;
  final int quotaUsed;
  final int? quotaRemaining;
  final String? ssid;
  final String? password;
  final DigitalBenefitOrderRef order;
}
