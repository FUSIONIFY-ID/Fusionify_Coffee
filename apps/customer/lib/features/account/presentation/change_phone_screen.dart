import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_language.dart';
import '../../../l10n/app_strings.dart';
import '../../../l10n/locale_controller.dart';
import '../../auth/application/auth_controller.dart';
import '../../auth/domain/auth_models.dart';
import '../../auth/presentation/auth_error.dart';

class ChangePhoneScreen extends ConsumerStatefulWidget {
  const ChangePhoneScreen({super.key});

  @override
  ConsumerState<ChangePhoneScreen> createState() => _ChangePhoneScreenState();
}

class _ChangePhoneScreenState extends ConsumerState<ChangePhoneScreen> {
  final _phone = TextEditingController();
  final _code = TextEditingController();
  String _country = 'ID';
  String _channel = 'WHATSAPP';
  bool _busy = false;
  int _step = 0;
  String? _error;
  OtpChallengeView? _challenge;

  @override
  void dispose() {
    _phone.dispose();
    _code.dispose();
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
      _challenge = await ref
          .read(authRepositoryProvider)
          .requestChangePhoneOtp(
            country: _country,
            phone: _phone.text,
            channel: _channel,
            language: language,
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

  Future<void> _confirm() async {
    final challenge = _challenge;
    if (challenge == null) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final verification = await ref
          .read(authRepositoryProvider)
          .verifyOtp(challengeId: challenge.challengeId, code: _code.text);
      final profile = await ref
          .read(authRepositoryProvider)
          .confirmChangePhone(
            challengeId: verification.challengeId,
            verificationToken: verification.verificationToken,
          );
      await ref.read(authControllerProvider.notifier).setAuthenticated(profile);
      if (mounted) setState(() => _step = 2);
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
      appBar: AppBar(title: Text(strings.changePhone)),
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
              decoration: InputDecoration(labelText: strings.newPhoneNumber),
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
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(6),
              ],
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                labelText: strings.otpCode,
                counterText: '',
              ),
            ),
            const SizedBox(height: CoffeeSpacing.lg),
            FilledButton(
              onPressed: _busy || _code.text.length != 6 ? null : _confirm,
              child: Text(strings.verify),
            ),
          ] else ...[
            const Icon(
              Icons.check_circle_outline,
              size: 64,
              color: CoffeeColors.success,
            ),
            const SizedBox(height: CoffeeSpacing.md),
            Text(
              strings.phoneChanged,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
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
