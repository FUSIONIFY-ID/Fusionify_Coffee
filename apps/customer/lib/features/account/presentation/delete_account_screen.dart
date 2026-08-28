import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_language.dart';
import '../../../l10n/app_strings.dart';
import '../../../l10n/locale_controller.dart';
import '../../auth/application/auth_controller.dart';
import '../../auth/domain/auth_models.dart';
import '../../auth/presentation/auth_error.dart';

class DeleteAccountScreen extends ConsumerStatefulWidget {
  const DeleteAccountScreen({super.key});

  @override
  ConsumerState<DeleteAccountScreen> createState() =>
      _DeleteAccountScreenState();
}

class _DeleteAccountScreenState extends ConsumerState<DeleteAccountScreen> {
  final _code = TextEditingController();
  String _channel = 'WHATSAPP';
  bool _busy = false;
  int _step = 0;
  String? _error;
  OtpChallengeView? _challenge;
  OtpVerificationView? _verification;

  @override
  void dispose() {
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
          .requestDeleteAccountOtp(channel: _channel, language: language);
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
      _verification = await ref
          .read(authRepositoryProvider)
          .verifyOtp(challengeId: challenge.challengeId, code: _code.text);
      if (mounted) setState(() => _step = 2);
    } catch (error) {
      if (mounted) {
        setState(() => _error = authErrorMessage(error, context.strings));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _delete() async {
    final verification = _verification;
    if (verification == null) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref
          .read(authRepositoryProvider)
          .confirmDeleteAccount(
            challengeId: verification.challengeId,
            verificationToken: verification.verificationToken,
          );
      await ref.read(authControllerProvider.notifier).setUnauthenticated();
      if (mounted) {
        context.go('/account');
      }
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
      appBar: AppBar(title: Text(strings.deleteAccount)),
      body: ListView(
        padding: const EdgeInsets.all(CoffeeSpacing.lg),
        children: [
          Container(
            padding: const EdgeInsets.all(CoffeeSpacing.md),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.errorContainer,
              borderRadius: BorderRadius.circular(CoffeeRadius.card),
            ),
            child: Text(
              strings.deleteAccountWarning,
              style: TextStyle(
                color: Theme.of(context).colorScheme.onErrorContainer,
              ),
            ),
          ),
          const SizedBox(height: CoffeeSpacing.lg),
          if (_step == 0) ...[
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
              onPressed: _busy || _code.text.length != 6 ? null : _verify,
              child: Text(strings.verifyDeletion),
            ),
          ] else ...[
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.error,
                foregroundColor: Theme.of(context).colorScheme.onError,
              ),
              onPressed: _busy ? null : _delete,
              child: Text(strings.deletePermanently),
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
