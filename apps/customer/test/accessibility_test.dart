import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/app/theme.dart';
import 'package:fusionify_coffee/features/auth/presentation/login_screen.dart';
import 'package:fusionify_coffee/features/cart/application/cart_controller.dart';
import 'package:fusionify_coffee/features/cart/domain/cart_item.dart';
import 'package:fusionify_coffee/features/cart/presentation/cart_screen.dart';
import 'package:fusionify_coffee/features/catalog/application/catalog_provider.dart';
import 'package:fusionify_coffee/features/shared/presentation/catalog_states.dart';
import 'package:fusionify_coffee/features/shared/presentation/media_image.dart';
import 'package:fusionify_coffee/features/shared/presentation/product_card.dart';

import 'catalog_fixture.dart';

void main() {
  testWidgets('product cards expose one concise localized button label', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    addTearDown(semantics.dispose);
    var tapped = false;

    await tester.pumpWidget(
      _localizedApp(
        SizedBox(
          width: 184,
          height: 286,
          child: ProductCard(
            product: catalogFixture.products.single,
            onTap: () => tapped = true,
          ),
        ),
      ),
    );

    final product = find.bySemanticsLabel('Aren Latte, Terlaris, Rp28.000');
    expect(product, findsOneWidget);

    await tester.tap(product);
    expect(tapped, isTrue);
  });

  testWidgets('catalog loading announces progress and honors reduced motion', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    addTearDown(semantics.dispose);

    await tester.pumpWidget(
      _localizedApp(
        const CatalogLoading(cardCount: 1),
        disableAnimations: true,
      ),
    );

    expect(find.bySemanticsLabel('Memuat…'), findsOneWidget);
    final image = tester.widget<Image>(find.byType(Image));
    expect(
      (image.image as AssetImage).assetName,
      'assets/brand/fusion-f-bean-app-icon.png',
    );
  });

  testWidgets('missing media keeps its accessible image label', (tester) async {
    final semantics = tester.ensureSemantics();
    addTearDown(semantics.dispose);

    await tester.pumpWidget(
      _localizedApp(
        const SizedBox(
          width: 120,
          height: 120,
          child: MediaImage(
            mediaUrl: null,
            fit: BoxFit.cover,
            semanticLabel: 'Aren Latte',
          ),
        ),
      ),
    );

    expect(find.bySemanticsLabel('Aren Latte'), findsOneWidget);
  });

  testWidgets('password visibility action describes its current behavior', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(child: _localizedApp(const LoginScreen())),
    );

    expect(find.byTooltip('Tampilkan password'), findsOneWidget);
    await tester.tap(find.byTooltip('Tampilkan password'));
    await tester.pump();
    expect(find.byTooltip('Sembunyikan password'), findsOneWidget);
  });

  testWidgets('cart quantity controls are labeled and announce changes', (
    tester,
  ) async {
    final semantics = tester.ensureSemantics();
    addTearDown(semantics.dispose);
    final container = ProviderContainer(
      overrides: [catalogProvider.overrideWith((ref) async => catalogFixture)],
    );
    addTearDown(container.dispose);
    container
        .read(cartProvider.notifier)
        .add(
          const CartItem(
            productId: 'aren-latte',
            productName: 'Aren Latte',
            unitPrice: 28000,
            quantity: 1,
            selectedOptions: [],
          ),
        );

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: _localizedApp(const CartScreen()),
      ),
    );

    expect(find.byTooltip('Kurangi jumlah'), findsOneWidget);
    expect(find.byTooltip('Tambah jumlah'), findsOneWidget);
    expect(find.bySemanticsLabel('Jumlah: 1'), findsOneWidget);

    await tester.tap(find.byTooltip('Tambah jumlah'));
    await tester.pump();
    expect(find.bySemanticsLabel('Jumlah: 2'), findsOneWidget);
  });
}

Widget _localizedApp(Widget child, {bool disableAnimations = false}) {
  return MaterialApp(
    locale: const Locale('id', 'ID'),
    supportedLocales: const [
      Locale('id', 'ID'),
      Locale('ms', 'MY'),
      Locale('en'),
    ],
    localizationsDelegates: GlobalMaterialLocalizations.delegates,
    theme: buildFusionifyCoffeeTheme(),
    builder: (context, child) {
      final mediaQuery = MediaQuery.of(context);
      return MediaQuery(
        data: mediaQuery.copyWith(disableAnimations: disableAnimations),
        child: child!,
      );
    },
    home: Scaffold(body: Center(child: child)),
  );
}
