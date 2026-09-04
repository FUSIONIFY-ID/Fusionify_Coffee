import 'package:go_router/go_router.dart';

import '../features/account/presentation/account_screen.dart';
import '../features/account/presentation/active_sessions_screen.dart';
import '../features/account/presentation/change_phone_screen.dart';
import '../features/account/presentation/delete_account_screen.dart';
import '../features/account/presentation/language_screen.dart';
import '../features/account/presentation/personal_information_screen.dart';
import '../features/account/presentation/security_screen.dart';
import '../features/auth/presentation/complete_profile_screen.dart';
import '../features/auth/presentation/forgot_password_screen.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/otp_verification_screen.dart';
import '../features/auth/presentation/register_phone_screen.dart';
import '../features/cart/presentation/cart_screen.dart';
import '../features/checkout/presentation/checkout_screen.dart';
import '../features/favorites/presentation/favorites_screen.dart';
import '../features/home/presentation/home_screen.dart';
import '../features/menu/presentation/menu_screen.dart';
import '../features/orders/presentation/order_detail_screen.dart';
import '../features/orders/presentation/orders_screen.dart';
import '../features/payment/presentation/payment_screen.dart';
import '../features/product/presentation/product_detail_screen.dart';
import '../features/receipts/presentation/digital_receipt_screen.dart';
import '../features/rewards/presentation/rewards_hub_screen.dart';
import '../features/shell/presentation/app_shell.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    ShellRoute(
      builder: (context, state, child) =>
          AppShell(location: state.uri.path, child: child),
      routes: [
        GoRoute(path: '/', builder: (_, _) => const HomeScreen()),
        GoRoute(path: '/menu', builder: (_, _) => const MenuScreen()),
        GoRoute(path: '/orders', builder: (_, _) => const OrdersScreen()),
        GoRoute(path: '/rewards', builder: (_, _) => const RewardsHubScreen()),
        GoRoute(path: '/account', builder: (_, _) => const AccountScreen()),
      ],
    ),
    GoRoute(
      path: '/product/:productId',
      builder: (context, state) => ProductDetailScreen(
        productId: state.pathParameters['productId'] ?? '',
      ),
    ),
    GoRoute(path: '/cart', builder: (_, _) => const CartScreen()),
    GoRoute(path: '/checkout', builder: (_, _) => const CheckoutScreen()),
    GoRoute(path: '/favorites', builder: (_, _) => const FavoritesScreen()),
    GoRoute(
      path: '/orders/:orderId',
      builder: (context, state) =>
          OrderDetailScreen(orderId: state.pathParameters['orderId'] ?? ''),
    ),
    GoRoute(
      path: '/orders/:orderId/receipt',
      builder: (context, state) =>
          DigitalReceiptScreen(orderId: state.pathParameters['orderId'] ?? ''),
    ),
    GoRoute(
      path: '/payment/:paymentId',
      builder: (context, state) =>
          PaymentScreen(paymentId: state.pathParameters['paymentId'] ?? ''),
    ),
    GoRoute(
      path: '/auth/register',
      builder: (_, _) => const RegisterPhoneScreen(),
    ),
    GoRoute(
      path: '/auth/otp',
      builder: (_, _) => const OtpVerificationScreen(),
    ),
    GoRoute(
      path: '/auth/complete-profile',
      builder: (_, _) => const CompleteProfileScreen(),
    ),
    GoRoute(path: '/auth/login', builder: (_, _) => const LoginScreen()),
    GoRoute(
      path: '/auth/forgot-password',
      builder: (_, _) => const ForgotPasswordScreen(),
    ),
    GoRoute(
      path: '/account/language',
      builder: (_, _) => const LanguageScreen(),
    ),
    GoRoute(
      path: '/account/personal',
      builder: (_, _) => const PersonalInformationScreen(),
    ),
    GoRoute(
      path: '/account/security',
      builder: (_, _) => const SecurityScreen(),
    ),
    GoRoute(
      path: '/account/change-phone',
      builder: (_, _) => const ChangePhoneScreen(),
    ),
    GoRoute(
      path: '/account/sessions',
      builder: (_, _) => const ActiveSessionsScreen(),
    ),
    GoRoute(
      path: '/account/delete',
      builder: (_, _) => const DeleteAccountScreen(),
    ),
  ],
);
