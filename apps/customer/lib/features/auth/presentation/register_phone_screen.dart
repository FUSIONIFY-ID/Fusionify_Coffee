import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_language.dart';
import '../../../l10n/app_strings.dart';
import '../../../l10n/locale_controller.dart';
import '../application/auth_controller.dart';
import '../application/registration_controller.dart';
import 'auth_error.dart';

class RegisterPhoneScreen extends ConsumerStatefulWidget {
  const RegisterPhoneScreen({super.key});

  @override
  ConsumerState<RegisterPhoneScreen> createState() =>
      _RegisterPhoneScreenState();
}

class _RegisterPhoneScreenState extends ConsumerState<RegisterPhoneScreen> {
  final _phoneController = TextEditingController();
  String _country = 'ID';
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _request(String channel) async {
    if (_submitting || _phoneController.text.trim().isEmpty) {
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final language =
          ref.read(localeControllerProvider).value ?? AppLanguage.indonesia;
      final challenge = await ref
          .read(authRepositoryProvider)
          .requestOtp(
            country: _country,
            phone: _phoneController.text,
            channel: channel,
            language: language,
          );

      ref
          .read(registrationProvider.notifier)
          .start(
            country: _country,
            phone: _phoneController.text.trim(),
            channel: channel,
            challenge: challenge,
          );

      if (mounted) {
        context.push('/auth/otp');
      }
    } catch (error) {
      if (mounted) {
        setState(() => _error = authErrorMessage(error, context.strings));
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;

    return Scaffold(
      appBar: AppBar(),
      body: ListView(
        padding: const EdgeInsets.all(CoffeeSpacing.lg),
        children: [
          Text(
            strings.createAccount,
            style: Theme.of(context).textTheme.headlineLarge,
          ),
          const SizedBox(height: CoffeeSpacing.xs),
          Text(
            strings.phoneSupportOnly,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: CoffeeSpacing.xl),
          Text(strings.country, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: CoffeeSpacing.sm),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(
                value: 'ID',
                label: Text('Indonesia'),
                icon: Icon(Icons.flag_outlined),
              ),
              ButtonSegment(
                value: 'MY',
                label: Text('Malaysia'),
                icon: Icon(Icons.flag_outlined),
              ),
            ],
            selected: {_country},
            onSelectionChanged: _submitting
                ? null
                : (selection) => setState(() {
                    _country = selection.first;
                  }),
          ),
          const SizedBox(height: CoffeeSpacing.lg),
          TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            autofillHints: const [AutofillHints.telephoneNumber],
            decoration: InputDecoration(
              labelText: strings.phoneNumber,
              prefixText: _country == 'ID' ? '+62 ' : '+60 ',
              hintText: _country == 'ID' ? '812 3456 7890' : '12 345 6789',
            ),
          ),
          const SizedBox(height: CoffeeSpacing.sm),
          Text(
            strings.noVerificationLink,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          if (_error != null) ...[
            const SizedBox(height: CoffeeSpacing.md),
            Text(
              _error!,
              style: const TextStyle(
                color: CoffeeColors.error,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
          const SizedBox(height: CoffeeSpacing.xl),
          FilledButton.icon(
            onPressed: _submitting ? null : () => _request('WHATSAPP'),
            icon: const Icon(Icons.chat_bubble_outline),
            label: Text(strings.sendWhatsApp),
          ),
          const SizedBox(height: CoffeeSpacing.sm),
          OutlinedButton.icon(
            onPressed: _submitting ? null : () => _request('SMS'),
            icon: const Icon(Icons.sms_outlined),
            label: Text(strings.sendSms),
          ),
          const SizedBox(height: CoffeeSpacing.lg),
          TextButton(
            onPressed: _submitting ? null : () => context.push('/auth/login'),
            child: Text(strings.login),
          ),
        ],
      ),
    );
  }
}
