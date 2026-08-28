import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_language.dart';
import '../../../l10n/app_strings.dart';
import '../../../l10n/locale_controller.dart';
import '../application/auth_controller.dart';
import 'auth_error.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _loginController = TextEditingController();
  final _passwordController = TextEditingController();
  String _country = 'ID';
  bool _hidePassword = true;
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _loginController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final login = _loginController.text.trim();
      final profile = await ref.read(authRepositoryProvider).login(
            login: login,
            password: _passwordController.text,
            country: login.contains('@') ? null : _country,
          );

      await ref.read(authControllerProvider.notifier).setAuthenticated(profile);
      final language = AppLanguage.fromApi(profile.preferredLanguage);
      await ref.read(localeControllerProvider.notifier).setLanguage(language);

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
          Text(strings.login, style: Theme.of(context).textTheme.headlineLarge),
          const SizedBox(height: CoffeeSpacing.xl),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'ID', label: Text('+62 Indonesia')),
              ButtonSegment(value: 'MY', label: Text('+60 Malaysia')),
            ],
            selected: {_country},
            onSelectionChanged: (selection) {
              setState(() => _country = selection.first);
            },
          ),
          const SizedBox(height: CoffeeSpacing.md),
          TextField(
            controller: _loginController,
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.username],
            decoration: InputDecoration(
              labelText: strings.phoneOrEmail,
            ),
          ),
          const SizedBox(height: CoffeeSpacing.md),
          TextField(
            controller: _passwordController,
            obscureText: _hidePassword,
            autofillHints: const [AutofillHints.password],
            decoration: InputDecoration(
              labelText: strings.password,
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
            child: Text(strings.login),
          ),
          const SizedBox(height: CoffeeSpacing.sm),
          TextButton(
            onPressed: () => context.push('/auth/register'),
            child: Text(strings.createAccount),
          ),
        ],
      ),
    );
  }
}
