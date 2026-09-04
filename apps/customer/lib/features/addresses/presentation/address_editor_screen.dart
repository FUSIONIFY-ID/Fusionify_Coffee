import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../l10n/delivery_strings.dart';
import '../application/addresses_provider.dart';
import '../domain/address_models.dart';

class AddressEditorScreen extends ConsumerStatefulWidget {
  const AddressEditorScreen({super.key, this.initialAddress});

  final SavedAddress? initialAddress;

  @override
  ConsumerState<AddressEditorScreen> createState() =>
      _AddressEditorScreenState();
}

class _AddressEditorScreenState extends ConsumerState<AddressEditorScreen> {
  late final TextEditingController _label;
  late final TextEditingController _recipient;
  late final TextEditingController _phone;
  late final TextEditingController _line1;
  late final TextEditingController _line2;
  late final TextEditingController _city;
  late final TextEditingController _region;
  late final TextEditingController _postalCode;
  late final TextEditingController _latitude;
  late final TextEditingController _longitude;
  late final TextEditingController _notes;
  late String _country;
  late bool _isDefault;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final address = widget.initialAddress;
    _label = TextEditingController(text: address?.label ?? 'Home');
    _recipient = TextEditingController(text: address?.recipientName ?? '');
    _phone = TextEditingController(text: address?.phoneE164 ?? '');
    _line1 = TextEditingController(text: address?.line1 ?? '');
    _line2 = TextEditingController(text: address?.line2 ?? '');
    _city = TextEditingController(text: address?.city ?? '');
    _region = TextEditingController(text: address?.region ?? '');
    _postalCode = TextEditingController(text: address?.postalCode ?? '');
    _latitude = TextEditingController(
      text: address == null ? '' : address.latitude.toString(),
    );
    _longitude = TextEditingController(
      text: address == null ? '' : address.longitude.toString(),
    );
    _notes = TextEditingController(text: address?.deliveryNotes ?? '');
    _country = address?.country ?? 'ID';
    _isDefault = address?.isDefault ?? false;
  }

  @override
  void dispose() {
    for (final controller in [
      _label,
      _recipient,
      _phone,
      _line1,
      _line2,
      _city,
      _region,
      _postalCode,
      _latitude,
      _longitude,
      _notes,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    final latitude = double.tryParse(_latitude.text.trim());
    final longitude = double.tryParse(_longitude.text.trim());
    if (_label.text.trim().isEmpty ||
        _recipient.text.trim().isEmpty ||
        _phone.text.trim().isEmpty ||
        _line1.text.trim().isEmpty ||
        _city.text.trim().isEmpty ||
        latitude == null ||
        longitude == null ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180) {
      setState(() => _error = context.strings.addressInvalid);
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });

    final input = <String, dynamic>{
      'label': _label.text.trim(),
      'recipientName': _recipient.text.trim(),
      'phone': _phone.text.trim(),
      'country': _country,
      'line1': _line1.text.trim(),
      'line2': _line2.text.trim().isEmpty ? null : _line2.text.trim(),
      'city': _city.text.trim(),
      'region': _region.text.trim().isEmpty ? null : _region.text.trim(),
      'postalCode': _postalCode.text.trim().isEmpty
          ? null
          : _postalCode.text.trim(),
      'latitude': latitude,
      'longitude': longitude,
      'deliveryNotes': _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      'isDefault': _isDefault,
    };

    try {
      final repository = ref.read(addressesRepositoryProvider);
      if (widget.initialAddress == null) {
        await repository.create(input);
      } else {
        await repository.update(widget.initialAddress!.id, input);
      }
      ref.invalidate(savedAddressesProvider);
      if (mounted) context.pop();
    } catch (_) {
      if (mounted) setState(() => _error = context.strings.genericError);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.initialAddress == null ? strings.addAddress : strings.editAddress,
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(CoffeeSpacing.md),
        children: [
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'ID', label: Text('+62 Indonesia')),
              ButtonSegment(value: 'MY', label: Text('+60 Malaysia')),
            ],
            selected: {_country},
            onSelectionChanged: (value) =>
                setState(() => _country = value.first),
          ),
          const SizedBox(height: CoffeeSpacing.md),
          _field(_label, strings.addressLabel),
          _field(_recipient, strings.recipientName),
          _field(_phone, strings.phoneNumber, type: TextInputType.phone),
          _field(_line1, strings.addressLine1, maxLines: 2),
          _field(_line2, strings.addressLine2),
          _field(_city, strings.city),
          _field(_region, strings.region),
          _field(_postalCode, strings.postalCode),
          const SizedBox(height: CoffeeSpacing.xs),
          Text(
            strings.coordinatesHelp,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: CoffeeSpacing.sm),
          Row(
            children: [
              Expanded(
                child: _field(
                  _latitude,
                  strings.latitude,
                  type: const TextInputType.numberWithOptions(
                    decimal: true,
                    signed: true,
                  ),
                ),
              ),
              const SizedBox(width: CoffeeSpacing.sm),
              Expanded(
                child: _field(
                  _longitude,
                  strings.longitude,
                  type: const TextInputType.numberWithOptions(
                    decimal: true,
                    signed: true,
                  ),
                ),
              ),
            ],
          ),
          _field(_notes, strings.deliveryNotes, maxLines: 2),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            value: _isDefault,
            title: Text(strings.defaultAddress),
            onChanged: (value) => setState(() => _isDefault = value),
          ),
          if (_error != null) ...[
            const SizedBox(height: CoffeeSpacing.sm),
            Text(
              _error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: CoffeeSpacing.lg),
          FilledButton.icon(
            onPressed: _saving ? null : _save,
            icon: _saving
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.save_outlined),
            label: Text(strings.saveAddress),
          ),
        ],
      ),
    );
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    TextInputType? type,
    int maxLines = 1,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: CoffeeSpacing.md),
      child: TextField(
        controller: controller,
        keyboardType: type,
        maxLines: maxLines,
        decoration: InputDecoration(labelText: label),
      ),
    );
  }
}
