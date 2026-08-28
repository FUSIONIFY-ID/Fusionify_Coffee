import 'package:go_router/go_router.dart';

import '../features/account/presentation/account_screen.dart';
import '../features/cart/presentation/cart_screen.dart';
import '../features/home/presentation/home_screen.dart';
import '../features/menu/presentation/menu_screen.dart';
import '../features/orders/presentation/orders_screen.dart';
import '../features/product/presentation/product_detail_screen.dart';
import '../features/rewards/presentation/rewards_screen.dart';
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
        GoRoute(path: '/rewards', builder: (_, _) => const RewardsScreen()),
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
  ],
);
