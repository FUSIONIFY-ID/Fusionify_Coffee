import 'package:flutter/material.dart';

import '../../../app/theme.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const SafeArea(
      child: Center(
        child: Padding(
          padding: EdgeInsets.all(CoffeeSpacing.xl),
          child: Text(
            'Belum ada order. Order tracking mulai di Milestone 0.3.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
