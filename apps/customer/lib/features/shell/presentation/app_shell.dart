import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_strings.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.location, required this.child});

  final String location;
  final Widget child;

  static const _paths = ['/', '/menu', '/orders', '/rewards', '/account'];

  int get _currentIndex {
    if (location.startsWith('/menu')) return 1;
    if (location.startsWith('/orders')) return 2;
    if (location.startsWith('/rewards')) return 3;
    if (location.startsWith('/account')) return 4;
    return 0;
  }

  void _navigate(BuildContext context, int index) {
    context.go(_paths[index]);
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final useRail = constraints.maxWidth >= 700;

        final strings = context.strings;

        if (!useRail) {
          return Scaffold(
            body: child,
            bottomNavigationBar: NavigationBar(
              selectedIndex: _currentIndex,
              onDestinationSelected: (index) => _navigate(context, index),
              destinations: [
                NavigationDestination(
                  icon: Icon(Icons.home_outlined),
                  selectedIcon: Icon(Icons.home),
                  label: strings.home,
                ),
                NavigationDestination(
                  icon: Icon(Icons.local_cafe_outlined),
                  selectedIcon: Icon(Icons.local_cafe),
                  label: strings.order,
                ),
                NavigationDestination(
                  icon: Icon(Icons.receipt_long_outlined),
                  selectedIcon: Icon(Icons.receipt_long),
                  label: strings.orders,
                ),
                NavigationDestination(
                  icon: Icon(Icons.loyalty_outlined),
                  selectedIcon: Icon(Icons.loyalty),
                  label: strings.rewards,
                ),
                NavigationDestination(
                  icon: Icon(Icons.person_outline),
                  selectedIcon: Icon(Icons.person),
                  label: strings.account,
                ),
              ],
            ),
          );
        }

        return Scaffold(
          body: Row(
            children: [
              NavigationRail(
                selectedIndex: _currentIndex,
                onDestinationSelected: (index) => _navigate(context, index),
                labelType: NavigationRailLabelType.all,
                leading: const Padding(
                  padding: EdgeInsets.symmetric(vertical: CoffeeSpacing.md),
                  child: Icon(
                    Icons.local_cafe,
                    color: CoffeeColors.primary,
                    size: 30,
                  ),
                ),
                destinations: [
                  NavigationRailDestination(
                    icon: Icon(Icons.home_outlined),
                    selectedIcon: Icon(Icons.home),
                    label: Text(strings.home),
                  ),
                  NavigationRailDestination(
                    icon: Icon(Icons.local_cafe_outlined),
                    selectedIcon: Icon(Icons.local_cafe),
                    label: Text(strings.order),
                  ),
                  NavigationRailDestination(
                    icon: Icon(Icons.receipt_long_outlined),
                    selectedIcon: Icon(Icons.receipt_long),
                    label: Text(strings.orders),
                  ),
                  NavigationRailDestination(
                    icon: Icon(Icons.loyalty_outlined),
                    selectedIcon: Icon(Icons.loyalty),
                    label: Text(strings.rewards),
                  ),
                  NavigationRailDestination(
                    icon: Icon(Icons.person_outline),
                    selectedIcon: Icon(Icons.person),
                    label: Text(strings.account),
                  ),
                ],
              ),
              const VerticalDivider(width: 1),
              Expanded(child: child),
            ],
          ),
        );
      },
    );
  }
}
