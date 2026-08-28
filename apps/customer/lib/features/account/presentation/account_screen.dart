import 'package:flutter/material.dart';

import '../../../app/theme.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const SafeArea(
      child: Center(
        child: Padding(
          padding: EdgeInsets.all(CoffeeSpacing.xl),
          child: Text(
            'Mode preview tanpa akun. Auth belum diimplementasikan.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
