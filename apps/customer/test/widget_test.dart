import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/app/app.dart';
import 'package:fusionify_coffee/features/catalog/application/catalog_provider.dart';

import 'catalog_fixture.dart';

void main() {
  testWidgets('renders API-backed ordering foundation', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          catalogProvider.overrideWith((ref) async => catalogFixture),
        ],
        child: const FusionifyCoffeeApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Fusionify Coffee'), findsOneWidget);
    expect(find.text('Mau ngopi apa hari ini?'), findsOneWidget);
    expect(find.text('Pickup'), findsOneWidget);
    expect(find.text('Delivery'), findsOneWidget);
    expect(find.text('Aren Latte'), findsOneWidget);
  });
}
