import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_language.dart';
import '../../../l10n/app_strings.dart';
import '../../../l10n/locale_controller.dart';
import '../application/auth_controller.dart';
import '../domain/auth_models.dart';
import 'auth_error.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _phone = TextEditingController();
  final _code = TextEditingController();
  final _password = TextEditingController();
  String _country = 'ID';
  String _channel = 'WHATSAPP';
  int _step = 0;
  bool _busy = false;
  String? _error;
  OtpChallengeView? _challenge;
  OtpVerificationView? _verification;

  @override
  void dispose() {
    _phone.dispose();
    _code.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _request() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final language =
          ref.read(localeControllerProvider).value ?? AppLanguage.indonesia;
      _challenge = await ref.read(authRepositoryProvider).requestOtp(
            country: _country,
            phone: _phone.text,
            channel: _channel,
            language: language,
            purpose: 'RESET_PASSWORD',
          );
      if (mounted) setState(() => _step = 1);
    } catch (error) {
      if (mounted) {
        setState(() => _error = authErrorMessage(error, context.strings));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verify() async {
    final challenge = _challenge;
    if (challenge == null) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      _verification = await ref.read(authRepositoryProvider).verifyOtp(
            challengeId: challenge.challengeId,
            code: _code.text,
          );
      if (mounted) setState(() => _step = 2);
    } catch (error) {
      if (mounted) {
        setState(() => _error = authErrorMessage(error, context.strings));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _reset() async {
    final verification = _verification;
    if (verification == null) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).resetPassword(
            challengeId: verification.challengeId,
            verificationToken: verification.verificationToken,
            newPassword: _password.text,
          );
      if (mounted) setState(() => _step = 3);
    } catch (error) {
      if (mounted) {
        setState(() => _error = authErrorMessage(error, context.strings));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    return Scaffold(
      appBar: AppBar(title: Text(strings.resetPassword)),
      body: ListView(
        padding: const EdgeInsets.all(CoffeeSpacing.lg),
        children: [
          if (_step == 0) ...[
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
            TextField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(labelText: strings.phoneNumber),
            ),
            const SizedBox(height: CoffeeSpacing.md),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'WHATSAPP', label: Text('WhatsApp')),
                ButtonSegment(value: 'SMS', label: Text('SMS')),
              ],
              selected: {_channel},
              onSelectionChanged: (value) =>
                  setState(() => _channel = value.first),
            ),
            const SizedBox(height: CoffeeSpacing.lg),
            FilledButton(
              onPressed: _busy ? null : _request,
              child: Text(strings.requestCode),
            ),
          ] else if (_step == 1) ...[
            Text(
              (_challenge?.channel ?? _channel) +
                  ' • ' +
                  (_challenge?.phone ?? ''),
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: CoffeeSpacing.md),
            TextField(
              controller: _code,
              keyboardType: TextInputType.number,
              maxLength: 6,
              onChanged: (_) => setState(() {}),
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(6),
              ],
              decoration: InputDecoration(
                labelText: strings.otpCode,
                counterText: '',
              ),
            ),
            const SizedBox(height: CoffeeSpacing.lg),
            FilledButton(
              onPressed: _busy || _code.text.length != 6 ? null : _verify,
              child: Text(strings.verify),
            ),
          ] else if (_step == 2) ...[
            TextField(
              controller: _password,
              obscureText: true,
              decoration: InputDecoration(
                labelText: strings.newPassword,
                helperText: strings.passwordRequirement,
              ),
            ),
            const SizedBox(height: CoffeeSpacing.lg),
            FilledButton(
              onPressed: _busy ? null : _reset,
              child: Text(strings.resetPassword),
            ),
          ] else ...[
            const Icon(
              Icons.check_circle_outline,
              size: 64,
              color: CoffeeColors.success,
            ),
            const SizedBox(height: CoffeeSpacing.md),
            Text(
              strings.passwordResetComplete,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: CoffeeSpacing.lg),
            FilledButton(
              onPressed: () => context.go('/auth/login'),
              child: Text(strings.login),
            ),
          ],
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
        ],
      ),
    );
  }
}
