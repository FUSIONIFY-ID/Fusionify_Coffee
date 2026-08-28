import '../../../l10n/app_strings.dart';

String localizedOrderStatus(AppStrings strings, String status) {
  return switch (status) {
    'AWAITING_PAYMENT' => strings.orderStatusAwaitingPayment,
    'CONFIRMED' => strings.orderStatusConfirmed,
    'PREPARING' => strings.orderStatusPreparing,
    'READY' => strings.orderStatusReady,
    'PICKED_UP' => strings.orderStatusPickedUp,
    'COMPLETED' => strings.orderStatusCompleted,
    'CANCELLED' => strings.orderStatusCancelled,
    _ => status,
  };
}
