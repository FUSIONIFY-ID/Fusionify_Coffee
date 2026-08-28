import 'dart:math';

String createIdempotencyKey(String prefix) {
  final random = Random.secure();
  final randomPart = List.generate(
    4,
    (_) => random.nextInt(1 << 32).toRadixString(16).padLeft(8, '0'),
  ).join();

  return '$prefix-${DateTime.now().microsecondsSinceEpoch}-$randomPart';
}
