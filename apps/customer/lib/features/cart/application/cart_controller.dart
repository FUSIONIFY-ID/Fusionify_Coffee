import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/cart_item.dart';

final cartProvider = NotifierProvider<CartController, List<CartItem>>(
  CartController.new,
);

final cartItemCountProvider = Provider<int>((ref) {
  return ref
      .watch(cartProvider)
      .fold<int>(0, (total, item) => total + item.quantity);
});

final cartSubtotalProvider = Provider<int>((ref) {
  return ref
      .watch(cartProvider)
      .fold<int>(0, (total, item) => total + item.lineTotal);
});

class CartController extends Notifier<List<CartItem>> {
  @override
  List<CartItem> build() => const [];

  void add(CartItem newItem) {
    final index = state.indexWhere(
      (item) => item.signature == newItem.signature,
    );

    if (index == -1) {
      state = [...state, newItem];
      return;
    }

    final current = state[index];
    final updated = current.copyWith(
      quantity: current.quantity + newItem.quantity,
    );

    state = [
      for (var itemIndex = 0; itemIndex < state.length; itemIndex++)
        if (itemIndex == index) updated else state[itemIndex],
    ];
  }

  void increment(String signature) {
    _setQuantity(signature, (current) => current + 1);
  }

  void decrement(String signature) {
    _setQuantity(signature, (current) => current - 1);
  }

  void remove(String signature) {
    state = state.where((item) => item.signature != signature).toList();
  }

  void clear() {
    state = const [];
  }

  void _setQuantity(String signature, int Function(int current) update) {
    final index = state.indexWhere((item) => item.signature == signature);
    if (index == -1) return;

    final nextQuantity = update(state[index].quantity);
    if (nextQuantity <= 0) {
      remove(signature);
      return;
    }

    state = [
      for (var itemIndex = 0; itemIndex < state.length; itemIndex++)
        if (itemIndex == index)
          state[itemIndex].copyWith(quantity: nextQuantity)
        else
          state[itemIndex],
    ];
  }
}
