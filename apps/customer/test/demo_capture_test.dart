import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fusionify_coffee/app/router.dart';
import 'package:fusionify_coffee/app/theme.dart';
import 'package:fusionify_coffee/features/catalog/application/catalog_provider.dart';
import 'package:fusionify_coffee/features/catalog/domain/catalog_models.dart';

const _captureDemo = bool.fromEnvironment('CAPTURE_DEMO');

const _demoCatalog = CatalogSnapshot(
  preview: true,
  outlet: Outlet(
    id: 'preview-outlet',
    name: 'Fusionify Coffee Preview Store',
    note: 'Jl. Pajajaran, Bogor · Buka sampai 22.00',
    imageUrl: 'asset://outlets/preview-store.webp',
    currency: 'IDR',
    pickupEnabled: true,
    deliveryEnabled: true,
  ),
  campaigns: [
    Campaign(
      id: 'signature-lineup',
      title: 'Signature Fusion',
      body: 'Tiga rasa andalan untuk nemenin harimu.',
      ctaLabel: 'Lihat Menu',
      imageUrl: 'asset://campaigns/signature-lineup.webp',
      actionPath: '/menu',
    ),
    Campaign(
      id: 'morning-pickup',
      title: 'Pagi Tanpa Antre',
      body: 'Pesan dulu, ambil saat kopi dan sarapanmu siap.',
      ctaLabel: 'Pesan Sekarang',
      imageUrl: 'asset://campaigns/morning-pickup.webp',
      actionPath: '/menu',
    ),
    Campaign(
      id: 'fusion-black-rewards',
      title: 'Menuju Fusion Black',
      body: 'Naik tier lewat transaksi yang tercatat di akunmu.',
      ctaLabel: 'Lihat Membership',
      imageUrl: 'asset://campaigns/fusion-black-rewards.webp',
      actionPath: '/rewards',
    ),
  ],
  products: [
    Product(
      id: 'aren-latte',
      name: 'Aren Latte',
      categoryId: 'coffee',
      description: 'Espresso, susu segar, dan gula aren.',
      category: 'Kopi',
      basePrice: 28000,
      modifierGroups: [],
      isBestseller: true,
      imageUrl: 'asset://products/aren-latte.webp',
    ),
    Product(
      id: 'sea-salt-latte',
      name: 'Sea Salt Latte',
      categoryId: 'coffee',
      description: 'Latte lembut dengan krim sea salt.',
      category: 'Kopi',
      basePrice: 32000,
      modifierGroups: [],
      imageUrl: 'asset://products/sea-salt-latte.webp',
    ),
    Product(
      id: 'buttercream-latte',
      name: 'Buttercream Latte',
      categoryId: 'coffee',
      description: 'Espresso creamy dan buttercream lembut.',
      category: 'Kopi',
      basePrice: 33000,
      modifierGroups: [],
      isBestseller: true,
      imageUrl: 'asset://products/buttercream-latte.webp',
    ),
    Product(
      id: 'matcha-cloud',
      name: 'Matcha Cloud',
      categoryId: 'non-coffee',
      description: 'Matcha creamy dengan foam ringan.',
      category: 'Non-Kopi',
      basePrice: 30000,
      modifierGroups: [],
      imageUrl: 'asset://products/matcha-cloud.webp',
    ),
    Product(
      id: 'pandan-coconut-latte',
      name: 'Pandan Coconut Latte',
      categoryId: 'non-coffee',
      description: 'Pandan harum dan kelapa creamy.',
      category: 'Non-Kopi',
      basePrice: 31000,
      modifierGroups: [],
      imageUrl: 'asset://products/pandan-coconut-latte.webp',
    ),
    Product(
      id: 'chocolate-malt-cloud',
      name: 'Chocolate Malt Cloud',
      categoryId: 'non-coffee',
      description: 'Cokelat malt dingin dengan foam ringan.',
      category: 'Non-Kopi',
      basePrice: 32000,
      modifierGroups: [],
      imageUrl: 'asset://products/chocolate-malt-cloud.webp',
    ),
  ],
);

void main() {
  setUpAll(_loadAndroidFonts);

  testWidgets(
    'captures rendered customer home and menu demo',
    (tester) async {
      await tester.binding.setSurfaceSize(const Size(390, 844));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      appRouter.go('/');
      final baseTheme = buildFusionifyCoffeeTheme();
      final screenshotTheme = baseTheme.copyWith(
        textTheme: baseTheme.textTheme.apply(fontFamily: 'Roboto'),
        primaryTextTheme: baseTheme.primaryTextTheme.apply(
          fontFamily: 'Roboto',
        ),
      );
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            catalogProvider.overrideWith((ref) async => _demoCatalog),
          ],
          child: MaterialApp.router(
            title: 'Fusionify Coffee',
            debugShowCheckedModeBanner: false,
            theme: screenshotTheme,
            locale: const Locale('id'),
            supportedLocales: const [
              Locale('id'),
              Locale('ms'),
              Locale('en'),
            ],
            localizationsDelegates: GlobalMaterialLocalizations.delegates,
            routerConfig: appRouter,
          ),
        ),
      );
      await tester.pumpAndSettle();
      await _precacheDemoAssets(tester);
      await tester.pump();

      await expectLater(
        find.byType(Scaffold).first,
        matchesGoldenFile('captures/demo-home.png'),
      );

      appRouter.go('/menu');
      await tester.pumpAndSettle();

      await expectLater(
        find.byType(Scaffold).first,
        matchesGoldenFile('captures/demo-menu.png'),
      );
    },
    skip: !_captureDemo,
  );
}

Future<void> _loadAndroidFonts() async {
  final flutterRoot = Platform.environment['FLUTTER_ROOT'];
  if (flutterRoot == null) {
    throw StateError('FLUTTER_ROOT is required to render demo screenshots.');
  }

  final loader = FontLoader('Roboto');
  for (final filename in ['Roboto-Regular.ttf', 'Roboto-Medium.ttf']) {
    final file = File(
      '$flutterRoot/bin/cache/artifacts/material_fonts/$filename',
    );
    final bytes = await file.readAsBytes();
    loader.addFont(Future.value(ByteData.sublistView(bytes)));
  }
  await loader.load();

  final iconLoader = FontLoader('MaterialIcons');
  final iconFile = File(
    '$flutterRoot/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf',
  );
  final iconBytes = await iconFile.readAsBytes();
  iconLoader.addFont(Future.value(ByteData.sublistView(iconBytes)));
  await iconLoader.load();
}

Future<void> _precacheDemoAssets(WidgetTester tester) async {
  final context = tester.element(find.byType(Scaffold).first);
  await tester.runAsync(() async {
    for (final asset in [
      'assets/brand/fusion-f-bean-app-icon.png',
      'assets/campaigns/signature-lineup.webp',
      'assets/outlets/preview-store.webp',
      'assets/products/aren-latte.webp',
      'assets/products/sea-salt-latte.webp',
      'assets/products/buttercream-latte.webp',
      'assets/products/matcha-cloud.webp',
      'assets/products/pandan-coconut-latte.webp',
      'assets/products/chocolate-malt-cloud.webp',
    ]) {
      await precacheImage(AssetImage(asset), context);
    }
  });
}
