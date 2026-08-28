String formatRupiah(int amount) {
  final digits = amount.abs().toString();
  final buffer = StringBuffer();

  for (var index = 0; index < digits.length; index++) {
    if (index > 0 && (digits.length - index) % 3 == 0) {
      buffer.write('.');
    }
    buffer.write(digits[index]);
  }

  final prefix = amount < 0 ? '-Rp' : 'Rp';
  return '$prefix$buffer';
}
