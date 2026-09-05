import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../../../core/realtime/customer_realtime_models.dart';
import '../../../core/realtime/customer_realtime_provider.dart';
import '../../../l10n/app_strings.dart';

class CustomerRealtimeStatus extends ConsumerWidget {
  const CustomerRealtimeStatus({
    super.key,
    this.showLive = false,
    this.padding = EdgeInsets.zero,
  });

  final bool showLive;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final realtime = ref.watch(customerRealtimeProvider);
    final connectionStatus =
        realtime.value?.connectionStatus ??
        CustomerRealtimeConnectionStatus.connecting;

    if (connectionStatus == CustomerRealtimeConnectionStatus.live &&
        !showLive) {
      return const SizedBox.shrink();
    }

    final isLive = connectionStatus == CustomerRealtimeConnectionStatus.live;
    final isReconnecting =
        connectionStatus == CustomerRealtimeConnectionStatus.reconnecting ||
        realtime.hasError;
    final icon = isLive
        ? Icons.cloud_done_outlined
        : isReconnecting
        ? Icons.cloud_sync_outlined
        : Icons.sync_outlined;
    final message = isLive
        ? context.strings.realtimeLive
        : isReconnecting
        ? context.strings.realtimeRecovering
        : context.strings.realtimeConnecting;
    final color = isLive
        ? CoffeeColors.success
        : isReconnecting
        ? CoffeeColors.warning
        : CoffeeColors.primary;

    return Padding(
      padding: padding,
      child: Semantics(
        liveRegion: true,
        label: message,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(
            horizontal: CoffeeSpacing.sm,
            vertical: CoffeeSpacing.xs,
          ),
          decoration: BoxDecoration(
            color: CoffeeColors.surface,
            border: Border.all(color: CoffeeColors.border),
            borderRadius: BorderRadius.circular(CoffeeRadius.control),
          ),
          child: Row(
            children: [
              Icon(icon, size: 18, color: color),
              const SizedBox(width: CoffeeSpacing.xs),
              Expanded(
                child: Text(
                  message,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: CoffeeColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
