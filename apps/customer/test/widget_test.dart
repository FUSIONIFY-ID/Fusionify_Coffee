import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/app/app.dart';

void main() {
  testWidgets('renders Fusionify Coffee ordering foundation', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: FusionifyCoffeeApp()),
    );
    await tester.pumpAndSettle();

    expect(find.text('Fusionify Coffee'), findsOneWidget);
    expect(find.text('Mau ngopi apa hari ini?'), findsOneWidget);
    expect(find.text('Pickup'), findsOneWidget);
    expect(find.text('Delivery'), findsOneWidget);
  });
}
