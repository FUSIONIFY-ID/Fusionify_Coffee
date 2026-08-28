import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_strings.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(CoffeeSpacing.xl),
          child: Text(context.strings.ordersEmpty, textAlign: TextAlign.center),
        ),
      ),
    );
  }
}
