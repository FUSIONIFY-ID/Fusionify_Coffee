import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../app/theme.dart';
import '../../../core/formatters/currency.dart';
import '../../../core/realtime/customer_realtime_models.dart';
import '../../../core/realtime/customer_realtime_provider.dart';
import '../../../l10n/app_strings.dart';
import '../../cart/application/cart_controller.dart';
import '../../checkout/application/checkout_provider.dart';
import '../../checkout/domain/checkout_models.dart';

class PaymentScreen extends ConsumerStatefulWidget {
  const PaymentScreen({super.key, required this.paymentId});

  final String paymentId;

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen>
    with WidgetsBindingObserver {
  PaymentView? _payment;
  Timer? _fallbackTimer;
  Timer? _clockTimer;
  bool _loading = true;
  bool _checking = false;
  bool _cancelling = false;
  String? _error;
  Duration? _remaining;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _refreshLocal();
    _fallbackTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _refreshLocal(silent: true),
    );
    _clockTimer = Timer.periodic(
      const Duration(seconds: 1),
      (_) => _updateRemaining(),
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _fallbackTimer?.cancel();
    _clockTimer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _payment?.isPending == true) {
      _checkProvider(silent: true);
    }
  }

  Future<void> _refreshLocal({bool silent = false}) async {
    if (!silent && mounted) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }

    try {
      final payment = await ref
          .read(checkoutRepositoryProvider)
          .getPayment(widget.paymentId);
      _applyPayment(payment);
    } on DioException {
      if (!silent && mounted) {
        setState(() {
          _error = context.strings.paymentStatusLoadFailed;
        });
      }
    } finally {
      if (!silent && mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _checkProvider({bool silent = false}) async {
    if (_checking || _payment?.isPending != true) return;

    if (mounted) {
      setState(() {
        _checking = true;
        if (!silent) _error = null;
      });
    }

    try {
      final payment = await ref
          .read(checkoutRepositoryProvider)
          .checkPayment(widget.paymentId);
      _applyPayment(payment);
    } on DioException {
      if (!silent && mounted) {
        setState(() {
          _error = context.strings.paymentProviderCheckFailed;
        });
      }
    } finally {
      if (mounted) {
        setState(() => _checking = false);
      }
    }
  }

  Future<void> _cancel() async {
    if (_cancelling || _payment?.isPending != true) return;

    setState(() {
      _cancelling = true;
      _error = null;
    });

    try {
      final payment = await ref
          .read(checkoutRepositoryProvider)
          .cancelPayment(widget.paymentId);
      _applyPayment(payment);
    } on DioException {
      if (mounted) {
        setState(() {
          _error = context.strings.paymentCancelFailed;
        });
      }
    } finally {
      if (mounted) {
        setState(() => _cancelling = false);
      }
    }
  }

  void _applyRealtimePayment(CustomerRealtimePayment payment) {
    _applyPayment(
      PaymentView(
        id: payment.id,
        orderId: payment.orderId,
        provider: payment.provider,
        channel: payment.channel,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        qrString: payment.qrString,
        qrUrl: payment.qrUrl,
        checkoutUrl: payment.checkoutUrl,
        expiryTime: payment.expiryTime,
        providerRawStatus: payment.providerRawStatus,
        paidAt: payment.paidAt,
        cancelledAt: payment.cancelledAt,
      ),
    );
  }

  void _applyPayment(PaymentView payment) {
    if (!mounted) return;

    final becamePaid = _payment?.isPaid != true && payment.isPaid;

    setState(() {
      _payment = payment;
      _loading = false;
      _error = null;
    });
    _updateRemaining();

    if (payment.isTerminal) {
      _fallbackTimer?.cancel();
    }

    if (becamePaid) {
      ref.read(cartProvider.notifier).clear();
    }
  }

  void _updateRemaining() {
    final expiresAt = _payment?.expiresAt;
    if (!mounted) return;

    if (expiresAt == null) {
      if (_remaining != null) {
        setState(() => _remaining = null);
      }
      return;
    }

    final remaining = expiresAt.difference(DateTime.now());
    final normalized = remaining.isNegative ? Duration.zero : remaining;

    if (_remaining != normalized) {
      setState(() => _remaining = normalized);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(customerRealtimeProvider, (previous, next) {
      next.whenData((snapshot) {
        final payment = snapshot.paymentById(widget.paymentId);
        if (payment != null) {
          _applyRealtimePayment(payment);
        }
      });
    });

    final strings = context.strings;
    final payment = _payment;

    return Scaffold(
      appBar: AppBar(title: Text(strings.qrisPayment)),
      body: _loading && payment == null
          ? const Center(child: CircularProgressIndicator())
          : payment == null
          ? _ErrorBody(
              message: _error ?? strings.paymentNotFound,
              onRetry: _refreshLocal,
            )
          : ListView(
              padding: const EdgeInsets.all(CoffeeSpacing.md),
              children: [
                _StatusHeader(payment: payment),
                const SizedBox(height: CoffeeSpacing.lg),
                if (payment.isPending && payment.qrString != null) ...[
                  Center(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(CoffeeSpacing.md),
                        child: QrImageView(
                          data: payment.qrString!,
                          version: QrVersions.auto,
                          size: 240,
                          backgroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: CoffeeSpacing.md),
                  Text(
                    formatRupiah(payment.amount),
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: CoffeeSpacing.xs),
                  Text(
                    _expiryLabel(payment, strings),
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: CoffeeSpacing.lg),
                  Text(
                    strings.scanQrisInstruction,
                    textAlign: TextAlign.center,
                  ),
                ],
                if (_error != null) ...[
                  const SizedBox(height: CoffeeSpacing.md),
                  Text(
                    _error!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: CoffeeColors.error,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
                const SizedBox(height: CoffeeSpacing.lg),
                if (payment.isPending) ...[
                  OutlinedButton.icon(
                    onPressed: _checking ? null : () => _checkProvider(),
                    icon: _checking
                        ? const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.refresh),
                    label: Text(strings.checkStatus),
                  ),
                  const SizedBox(height: CoffeeSpacing.sm),
                  TextButton(
                    onPressed: _cancelling ? null : _cancel,
                    child: Text(
                      _cancelling
                          ? strings.cancelling
                          : strings.cancelPendingPayment,
                    ),
                  ),
                ] else if (payment.isPaid) ...[
                  FilledButton.icon(
                    onPressed: () => context.go('/orders'),
                    icon: const Icon(Icons.receipt_long_outlined),
                    label: Text(strings.viewOrder),
                  ),
                ] else ...[
                  OutlinedButton(
                    onPressed: () => context.go('/cart'),
                    child: Text(strings.backToCart),
                  ),
                ],
              ],
            ),
    );
  }

  String _expiryLabel(PaymentView payment, AppStrings strings) {
    final remaining = _remaining;
    if (remaining != null) {
      final minutes = remaining.inMinutes;
      final seconds = remaining.inSeconds.remainder(60);
      final time =
          '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
      return strings.expiresIn(time);
    }

    if (payment.expiryTime != null) {
      return strings.providerExpiry(payment.expiryTime!);
    }

    return strings.followPaymentStatus;
  }
}

class _StatusHeader extends StatelessWidget {
  const _StatusHeader({required this.payment});

  final PaymentView payment;

  @override
  Widget build(BuildContext context) {
    final strings = context.strings;
    final config = switch (payment.status) {
      'PAID' => (
        Icons.check_circle_outline,
        strings.paymentReceived,
        CoffeeColors.success,
      ),
      'EXPIRED' => (
        Icons.timer_off_outlined,
        strings.paymentExpired,
        CoffeeColors.warning,
      ),
      'CANCELLED' => (
        Icons.cancel_outlined,
        strings.paymentCancelled,
        CoffeeColors.textSecondary,
      ),
      'FAILED' => (
        Icons.error_outline,
        strings.paymentFailed,
        CoffeeColors.error,
      ),
      _ => (
        Icons.hourglass_top_outlined,
        strings.waitingForPayment,
        CoffeeColors.primary,
      ),
    };

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(CoffeeSpacing.md),
        child: Row(
          children: [
            Icon(config.$1, color: config.$3, size: 32),
            const SizedBox(width: CoffeeSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    config.$2,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: CoffeeSpacing.xxs),
                  Text(
                    'GoPay QRIS',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorBody extends StatelessWidget {
  const _ErrorBody({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(CoffeeSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.cloud_off_outlined,
              size: 48,
              color: CoffeeColors.textSecondary,
            ),
            const SizedBox(height: CoffeeSpacing.md),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: CoffeeSpacing.md),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: Text(context.strings.retry),
            ),
          ],
        ),
      ),
    );
  }
}
