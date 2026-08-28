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

class CompleteProfileScreen extends ConsumerStatefulWidget {
  const CompleteProfileScreen({super.key});

  @override
  ConsumerState<CompleteProfileScreen> createState() =>
      _CompleteProfileScreenState();
}

class _CompleteProfileScreenState extends ConsumerState<CompleteProfileScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _submitting = false;
  bool _hidePassword = true;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final registration = ref.read(registrationProvider);
    final verification = registration.verification;

    if (_submitting || verification == null) {
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final language =
          ref.read(localeControllerProvider).value ?? AppLanguage.indonesia;
      final profile = await ref.read(authRepositoryProvider).register(
            challengeId: verification.challengeId,
            verificationToken: verification.verificationToken,
            fullName: _nameController.text,
            password: _passwordController.text,
            email: _emailController.text,
            language: language,
          );

      await ref.read(authControllerProvider.notifier).setAuthenticated(profile);
      ref.read(registrationProvider.notifier).clear();

      if (mounted) {
        context.go('/account');
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
            strings.completeProfile,
            style: Theme.of(context).textTheme.headlineLarge,
          ),
          const SizedBox(height: CoffeeSpacing.xl),
          TextField(
            controller: _nameController,
            textCapitalization: TextCapitalization.words,
            autofillHints: const [AutofillHints.name],
            decoration: InputDecoration(labelText: strings.fullName),
          ),
          const SizedBox(height: CoffeeSpacing.md),
          TextField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
            decoration: InputDecoration(labelText: strings.emailOptional),
          ),
          const SizedBox(height: CoffeeSpacing.md),
          TextField(
            controller: _passwordController,
            obscureText: _hidePassword,
            autofillHints: const [AutofillHints.newPassword],
            decoration: InputDecoration(
              labelText: strings.password,
              helperText: strings.minimumPassword,
              suffixIcon: IconButton(
                onPressed: () {
                  setState(() => _hidePassword = !_hidePassword);
                },
                icon: Icon(
                  _hidePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                ),
              ),
            ),
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
          FilledButton(
            onPressed: _submitting ? null : _submit,
            child: Text(strings.createAccount),
          ),
        ],
      ),
    );
  }
}
