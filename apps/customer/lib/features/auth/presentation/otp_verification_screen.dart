import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_language.dart';
import '../../../l10n/app_strings.dart';
import '../../../l10n/locale_controller.dart';
import '../application/auth_controller.dart';
import '../application/registration_controller.dart';
import 'auth_error.dart';

class OtpVerificationScreen extends ConsumerStatefulWidget {
  const OtpVerificationScreen({super.key});

  @override
  ConsumerState<OtpVerificationScreen> createState() =>
      _OtpVerificationScreenState();
}

class _OtpVerificationScreenState
    extends ConsumerState<OtpVerificationScreen> {
  final _codeController = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    final registration = ref.read(registrationProvider);
    final challenge = registration.challenge;

    if (_submitting || challenge == null) {
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final verified = await ref.read(authRepositoryProvider).verifyOtp(
            challengeId: challenge.challengeId,
            code: _codeController.text,
          );
      ref.read(registrationProvider.notifier).verified(verified);

      if (mounted) {
        context.push('/auth/complete-profile');
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

  Future<void> _switchChannel() async {
    final registration = ref.read(registrationProvider);
    final nextChannel =
        registration.channel == 'WHATSAPP' ? 'SMS' : 'WHATSAPP';

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final language =
          ref.read(localeControllerProvider).value ?? AppLanguage.indonesia;
      final challenge = await ref.read(authRepositoryProvider).requestOtp(
            country: registration.country,
            phone: registration.phone,
            channel: nextChannel,
            language: language,
          );

      ref.read(registrationProvider.notifier).start(
            country: registration.country,
            phone: registration.phone,
            channel: nextChannel,
            challenge: challenge,
          );
      _codeController.clear();
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
    final registration = ref.watch(registrationProvider);
    final challenge = registration.challenge;
    final strings = context.strings;

    if (challenge == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(
          child: FilledButton(
            onPressed: () => context.go('/auth/register'),
            child: Text(strings.createAccount),
          ),
        ),
      );
    }

    final channelLabel =
        registration.channel == 'WHATSAPP' ? 'WhatsApp' : 'SMS';

    return Scaffold(
      appBar: AppBar(),
      body: ListView(
        padding: const EdgeInsets.all(CoffeeSpacing.lg),
        children: [
          Text(
            strings.otpTitle,
            style: Theme.of(context).textTheme.headlineLarge,
          ),
          const SizedBox(height: CoffeeSpacing.xs),
          Text(
            '$channelLabel • ${challenge.phone}',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: CoffeeSpacing.xl),
          TextField(
            controller: _codeController,
            autofocus: true,
            keyboardType: TextInputType.number,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  letterSpacing: 10,
                ),
            maxLength: 6,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(6),
            ],
            decoration: InputDecoration(
              labelText: strings.otpCode,
              counterText: '',
            ),
            onChanged: (_) => setState(() {}),
            onSubmitted: (_) {
              if (_codeController.text.length == 6) {
                _verify();
              }
            },
          ),
          if (_error != null) ...[
            const SizedBox(height: CoffeeSpacing.sm),
            Text(
              _error!,
              style: const TextStyle(
                color: CoffeeColors.error,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
          const SizedBox(height: CoffeeSpacing.lg),
          FilledButton(
            onPressed:
                _submitting || _codeController.text.length != 6 ? null : _verify,
            child: Text(strings.verify),
          ),
          const SizedBox(height: CoffeeSpacing.sm),
          TextButton(
            onPressed: _submitting ? null : _switchChannel,
            child: Text(
              registration.channel == 'WHATSAPP'
                  ? strings.useSmsInstead
                  : strings.useWhatsAppInstead,
            ),
          ),
        ],
      ),
    );
  }
}
